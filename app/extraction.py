"""
Extraction pipeline for PDF and image files.
Handles text extraction via PyMuPDF and OCR via pytesseract.
"""

import io
import os
import logging
from pathlib import Path
from typing import Tuple, Optional
import fitz  # PyMuPDF
from PIL import Image
import pytesseract
import numpy as np
import cv2

# Configure logging
logger = logging.getLogger(__name__)

# Minimum text length to consider embedded text extraction successful
MIN_TEXT_THRESHOLD = 50


def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Preprocess image for better OCR results using OpenCV.
    - Grayscale conversion
    - Noise reduction (Bilateral Filter)
    - Adaptive thresholding (Otsu's Binarization)
    - Deskewing (optional, but handled better by adaptive thresholding)
    """
    # Convert PIL to OpenCV format (BGR)
    open_cv_image = np.array(image.convert('RGB'))
    open_cv_image = open_cv_image[:, :, ::-1].copy()

    # Convert to grayscale
    gray = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2GRAY)

    # Noise reduction - Bilateral Filter preserves edges while blurring noise
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # Thresholding - Use Otsu's binarization to automatically find best threshold
    _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # If the image is mostly black (e.g., white text on black background), invert it
    # OCR works best with black text on white background
    if np.mean(thresh) < 127:
        thresh = cv2.bitwise_not(thresh)

    return Image.fromarray(thresh)


def extract_text_from_pdf(pdf_path: str) -> Tuple[str, str]:
    """
    Extract text from a PDF file.

    First attempts embedded text extraction.
    Falls back to OCR if embedded text is insufficient.

    Returns:
        Tuple of (extracted_text, extraction_method)
    """
    try:
        doc = fitz.open(pdf_path)
        embedded_text = ""

        # Try embedded text extraction first
        for page in doc:
            embedded_text += page.get_text()

        # If we got sufficient text, return it
        if len(embedded_text.strip()) >= MIN_TEXT_THRESHOLD:
            doc.close()
            return embedded_text.strip(), "embedded_text"

        # Fall back to OCR
        ocr_text = ""
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Render page to image
            mat = fitz.Matrix(2, 2)  # 2x zoom for better OCR
            pix = page.get_pixmap(matrix=mat)

            # Convert to PIL Image
            img_data = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_data))

            # Preprocess and OCR
            processed_image = preprocess_image(image)
            page_text = pytesseract.image_to_string(processed_image)
            ocr_text += page_text + "\n"

        doc.close()
        return ocr_text.strip(), "ocr"

    except Exception as e:
        return f"Error extracting text: {str(e)}", "error"


def extract_text_from_image(image_path: str) -> Tuple[str, str]:
    """
    Extract text from an image file using OCR.

    Returns:
        Tuple of (extracted_text, extraction_method)
    """
    try:
        # Open and preprocess image
        image = Image.open(image_path)

        # Convert RGBA to RGB if necessary
        if image.mode == 'RGBA':
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            image = background

        # Preprocess for better OCR
        processed_image = preprocess_image(image)

        # Perform OCR
        text = pytesseract.image_to_string(processed_image)

        return text.strip(), "ocr"

    except Exception as e:
        return f"Error extracting text: {str(e)}", "error"


def extract_text(file_path: str, file_type: str) -> Tuple[str, str]:
    """
    Main extraction function that routes to appropriate handler.

    Args:
        file_path: Path to the file
        file_type: MIME type or extension of the file

    Returns:
        Tuple of (extracted_text, extraction_method)
    """
    file_path = str(file_path)
    file_lower = file_path.lower()
    
    logger.info(f"Starting extraction for {file_path} (Type: {file_type})")

    if file_lower.endswith('.pdf'):
        res, method = extract_text_from_pdf(file_path)
    elif any(file_lower.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']):
        res, method = extract_text_from_image(file_path)
    else:
        logger.warning(f"Unsupported file type for {file_path}")
        return "Unsupported file type", "error"
    
    logger.info(f"Extraction complete for {file_path} using {method}. Length: {len(res)} characters.")
    return res, method


def extract_text_from_bytes(file_bytes: bytes, file_name: str) -> Tuple[str, str]:
    """
    Extract text from file bytes (for Streamlit uploaded files).

    Args:
        file_bytes: Raw file bytes
        file_name: Original filename for type detection

    Returns:
        Tuple of (extracted_text, extraction_method)
    """
    import tempfile
    import os

    file_lower = file_name.lower()

    # Determine file type
    if file_lower.endswith('.pdf'):
        suffix = '.pdf'
    elif file_lower.endswith('.png'):
        suffix = '.png'
    elif file_lower.endswith(('.jpg', '.jpeg')):
        suffix = '.jpg'
    elif file_lower.endswith('.tiff'):
        suffix = '.tiff'
    elif file_lower.endswith('.bmp'):
        suffix = '.bmp'
    else:
        return "Unsupported file type", "error"

    # Write to temp file and process
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        if suffix == '.pdf':
            result = extract_text_from_pdf(tmp_path)
        else:
            result = extract_text_from_image(tmp_path)

        return result

    except Exception as e:
        return f"Error processing file: {str(e)}", "error"
    finally:
        # Clean up temp file
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def get_extraction_quality_score(text: str) -> Tuple[int, str]:
    """
    Estimate the quality of extracted text.

    Returns:
        Tuple of (score 0-100, quality description)
    """
    if not text or len(text) < 10:
        return 0, "No text extracted"

    # Count recognizable words vs gibberish
    words = text.split()
    if len(words) == 0:
        return 0, "No words found"

    # Simple heuristic: count words that are mostly alphabetic
    valid_words = sum(1 for w in words if sum(c.isalpha() for c in w) / max(len(w), 1) > 0.5)
    word_ratio = valid_words / len(words)

    # Check for common credit report terms
    credit_terms = [
        'account', 'balance', 'payment', 'credit', 'collection',
        'date', 'opened', 'reported', 'status', 'creditor',
        'original', 'amount', 'limit', 'delinquent', 'charge',
        'bureau', 'experian', 'equifax', 'transunion'
    ]
    text_lower = text.lower()
    term_matches = sum(1 for term in credit_terms if term in text_lower)
    term_score = min(term_matches / 5, 1.0)  # Cap at 5 matches

    # Combined score
    score = int((word_ratio * 0.6 + term_score * 0.4) * 100)

    if score >= 80:
        quality = "High quality extraction"
    elif score >= 50:
        quality = "Moderate quality - review recommended"
    else:
        quality = "Low quality - manual entry may be needed"

    return score, quality
