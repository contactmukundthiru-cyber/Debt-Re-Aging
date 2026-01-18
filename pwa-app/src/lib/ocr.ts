import { createWorker } from 'tesseract.js';

/**
 * Perform OCR on an image file with preprocessing for higher accuracy
 */
export async function performOCR(file: File, onProgress?: (progress: number) => void): Promise<string> {
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

    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    // 1. Draw original
    ctx.drawImage(bitmap, 0, 0);

    // 2. Grayscale & Contrast Enhancement
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Grayscale conversion (Luminance)
      let gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      
      // Simple thresholding (Otsu-lite)
      gray = gray > 128 ? 255 : 0;
      
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);

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
