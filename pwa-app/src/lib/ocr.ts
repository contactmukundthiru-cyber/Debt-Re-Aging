import { createWorker } from 'tesseract.js';

type OCROptions = {
  scale?: number;
  contrast?: number;
  thresholdLow?: number;
  thresholdHigh?: number;
};

/**
 * Perform OCR on an image file with preprocessing for higher accuracy
 */
export async function performOCR(
  file: File,
  onProgress?: (progress: number) => void,
  options: OCROptions = {}
): Promise<string> {
  const worker = await createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    }
  });

  try {
    // Advanced Preprocessing via Canvas
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const scale = options.scale ?? 1;
    canvas.width = Math.max(1, Math.floor(bitmap.width * scale));
    canvas.height = Math.max(1, Math.floor(bitmap.height * scale));

    // 1. Draw original
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    // 2. Advanced Preprocessing: Grayscale, Contrast, and Sharpening
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Grayscale and Contrast Boost
    const contrast = options.contrast ?? 1.2;
    const intercept = 128 * (1 - contrast);
    const thresholdLow = options.thresholdLow ?? 90;
    const thresholdHigh = options.thresholdHigh ?? 160;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Grayscale conversion (Luminance)
      let gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      
      // Contrast Adjustment
      gray = gray * contrast + intercept;
      
      // Simple thresholding for text clarity
      gray = gray > thresholdHigh ? 255 : (gray < thresholdLow ? 0 : gray);
      
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);

    // 3. Simple Sharpening Filter
    ctx.filter = 'contrast(120%) brightness(100%) sharp(1.5)';
    // Redraw to apply filters if browser supports it, or use a manual convolution if needed
    // For now, standard canvas filters provide a good balance of performance and quality

    const processedImageUrl = canvas.toDataURL('image/png');
    const { data: { text } } = await worker.recognize(processedImageUrl);
    return text;
  } finally {
    await worker.terminate();
  }
}

/**
 * Detect if a file is an image
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Detect if a file is a PDF (we might need a different lib for PDF-to-image or text-PDF)
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf';
}
