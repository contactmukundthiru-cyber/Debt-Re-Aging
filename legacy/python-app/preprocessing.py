"""
Advanced image preprocessing for OCR.

Provides configurable preprocessing options to improve OCR accuracy.
"""

from typing import Tuple, Optional, Dict, Any
from enum import Enum
import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageEnhance

# Try to import OpenCV, fall back to PIL-only preprocessing
try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False


class PreprocessingLevel(Enum):
    """Preprocessing intensity levels."""
    NONE = "none"
    LIGHT = "light"
    STANDARD = "standard"
    AGGRESSIVE = "aggressive"
    CUSTOM = "custom"


class ImagePreprocessor:
    """
    Configurable image preprocessor for OCR optimization.
    """

    def __init__(
        self,
        level: PreprocessingLevel = PreprocessingLevel.STANDARD,
        custom_options: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the preprocessor.

        Args:
            level: Preprocessing intensity level
            custom_options: Custom options for CUSTOM level
        """
        self.level = level
        self.custom_options = custom_options or {}

        # Default settings per level
        self.level_settings = {
            PreprocessingLevel.NONE: {
                'grayscale': False,
                'contrast': 1.0,
                'brightness': 1.0,
                'sharpen': False,
                'denoise': False,
                'threshold': False,
                'deskew': False,
                'scale': 1.0
            },
            PreprocessingLevel.LIGHT: {
                'grayscale': True,
                'contrast': 1.2,
                'brightness': 1.0,
                'sharpen': False,
                'denoise': False,
                'threshold': False,
                'deskew': False,
                'scale': 1.0
            },
            PreprocessingLevel.STANDARD: {
                'grayscale': True,
                'contrast': 1.3,
                'brightness': 1.0,
                'sharpen': True,
                'denoise': True,
                'threshold': True,
                'deskew': False,
                'scale': 2.0
            },
            PreprocessingLevel.AGGRESSIVE: {
                'grayscale': True,
                'contrast': 1.5,
                'brightness': 1.1,
                'sharpen': True,
                'denoise': True,
                'threshold': True,
                'deskew': True,
                'scale': 3.0
            }
        }

    def get_settings(self) -> Dict[str, Any]:
        """Get current preprocessing settings."""
        if self.level == PreprocessingLevel.CUSTOM:
            return self.custom_options
        return self.level_settings.get(self.level, self.level_settings[PreprocessingLevel.STANDARD])

    def preprocess(self, image: Image.Image) -> Image.Image:
        """
        Apply preprocessing to an image.

        Args:
            image: PIL Image to preprocess

        Returns:
            Preprocessed PIL Image
        """
        settings = self.get_settings()

        # Convert RGBA to RGB if needed
        if image.mode == 'RGBA':
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            image = background

        # Scale up for better OCR
        scale = settings.get('scale', 1.0)
        if scale != 1.0:
            new_size = (int(image.width * scale), int(image.height * scale))
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        # Convert to grayscale
        if settings.get('grayscale', True):
            image = ImageOps.grayscale(image)

        # Adjust contrast
        contrast = settings.get('contrast', 1.0)
        if contrast != 1.0:
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(contrast)

        # Adjust brightness
        brightness = settings.get('brightness', 1.0)
        if brightness != 1.0:
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(brightness)

        # Sharpen
        if settings.get('sharpen', False):
            image = image.filter(ImageFilter.SHARPEN)

        # Denoise
        if settings.get('denoise', False):
            if HAS_OPENCV:
                image = self._denoise_opencv(image)
            else:
                # PIL fallback - slight blur then sharpen
                image = image.filter(ImageFilter.MedianFilter(3))

        # Thresholding (binarization)
        if settings.get('threshold', False):
            image = self._apply_threshold(image)

        # Deskew
        if settings.get('deskew', False) and HAS_OPENCV:
            image = self._deskew_opencv(image)

        return image

    def _apply_threshold(self, image: Image.Image) -> Image.Image:
        """Apply adaptive thresholding."""
        img_array = np.array(image)

        if HAS_OPENCV and len(img_array.shape) == 2:
            # Use OpenCV adaptive threshold
            binary = cv2.adaptiveThreshold(
                img_array, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 11, 2
            )
            return Image.fromarray(binary)
        else:
            # PIL fallback - simple threshold
            threshold = np.mean(img_array) * 0.9
            binary = np.where(img_array > threshold, 255, 0).astype(np.uint8)
            return Image.fromarray(binary)

    def _denoise_opencv(self, image: Image.Image) -> Image.Image:
        """Denoise using OpenCV."""
        img_array = np.array(image)

        if len(img_array.shape) == 2:
            denoised = cv2.fastNlMeansDenoising(img_array, None, 10, 7, 21)
        else:
            denoised = cv2.fastNlMeansDenoisingColored(img_array, None, 10, 10, 7, 21)

        return Image.fromarray(denoised)

    def _deskew_opencv(self, image: Image.Image) -> Image.Image:
        """Deskew image using OpenCV."""
        img_array = np.array(image)

        # Detect edges
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array

        edges = cv2.Canny(gray, 50, 150, apertureSize=3)

        # Detect lines
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=10)

        if lines is None or len(lines) == 0:
            return image

        # Calculate average angle
        angles = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
            if -45 < angle < 45:  # Horizontal lines
                angles.append(angle)

        if not angles:
            return image

        median_angle = np.median(angles)

        # Rotate image
        if abs(median_angle) > 0.5:
            (h, w) = img_array.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
            rotated = cv2.warpAffine(
                img_array, M, (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE
            )
            return Image.fromarray(rotated)

        return image


def preprocess_for_ocr(
    image: Image.Image,
    level: str = "standard"
) -> Image.Image:
    """
    Convenience function for preprocessing.

    Args:
        image: PIL Image
        level: Preprocessing level (none, light, standard, aggressive)

    Returns:
        Preprocessed image
    """
    level_map = {
        'none': PreprocessingLevel.NONE,
        'light': PreprocessingLevel.LIGHT,
        'standard': PreprocessingLevel.STANDARD,
        'aggressive': PreprocessingLevel.AGGRESSIVE
    }

    preprocessor = ImagePreprocessor(
        level=level_map.get(level.lower(), PreprocessingLevel.STANDARD)
    )

    return preprocessor.preprocess(image)


def get_preprocessing_options() -> Dict[str, str]:
    """Get available preprocessing options with descriptions."""
    return {
        'none': 'No preprocessing (use original image)',
        'light': 'Light preprocessing (grayscale + slight contrast boost)',
        'standard': 'Standard preprocessing (recommended for most documents)',
        'aggressive': 'Aggressive preprocessing (for poor quality scans)'
    }
