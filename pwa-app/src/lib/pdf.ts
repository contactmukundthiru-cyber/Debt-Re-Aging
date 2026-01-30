/**
 * PDF Text Extraction Module
 * Uses pdfjs-dist for text extraction with OCR fallback via Tesseract.js
 */

// Worker configuration - using unpkg CDN for reliable cross-origin loading
const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@5.0.375/build/pdf.worker.min.mjs';

/**
 * Extract text from a PDF file
 * Dynamically imports pdfjs-dist to avoid SSR issues
 */
export async function extractPDFText(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Dynamic import to avoid SSR issues with pdfjs-dist
  const pdfjs = await import('pdfjs-dist');

  // Configure worker using CDN for better compatibility with static exports
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const totalPages = pdf.numPages;
    const textParts: string[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items
        .filter((item) => 'str' in item && typeof (item as { str: string }).str === 'string')
        .map(item => (item as { str: string }).str);

      textParts.push(strings.join(' '));

      if (onProgress) {
        onProgress(i / totalPages);
      }
    }

    const output = textParts.join('\n\n').trim();
    if (!output) {
      throw new Error('No selectable text found in PDF. Try uploading a scanned image.');
    }

    return output;
  } catch (error) {
    // Re-throw with more context
    const message = error instanceof Error ? error.message : 'Unknown PDF error';
    if (message.includes('No selectable text')) {
      throw error;
    }
    throw new Error(`PDF extraction failed: ${message}`);
  }
}

type OCRFallbackOptions = {
  maxPages?: number;
  scale?: number;
};

/**
 * Extract text from PDF pages via OCR.
 */
export async function extractPDFTextViaOCR(
  file: File,
  onProgress?: (progress: number) => void,
  options: OCRFallbackOptions = {}
): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const maxPages = Math.min(pdf.numPages, options.maxPages ?? 5);
    const scale = options.scale ?? 2.0; // Increased scale for better OCR accuracy
    const textParts: string[] = [];

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not create canvas for OCR');

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: context, viewport, canvas }).promise;

      // Preprocessing: Convert to grayscale for better OCR
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let px = 0; px < data.length; px += 4) {
        const r = data[px];
        const g = data[px + 1];
        const b = data[px + 2];
        const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
        data[px] = gray;
        data[px + 1] = gray;
        data[px + 2] = gray;
      }
      context.putImageData(imageData, 0, 0);

      const { data: { text } } = await worker.recognize(canvas);
      textParts.push(text);

      if (onProgress) {
        onProgress(i / maxPages);
      }
    }

    const output = textParts.join('\n\n').trim();
    if (!output) {
      throw new Error('OCR failed to extract text from this PDF.');
    }

    return output;
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract text from PDF, falling back to OCR for scanned pages.
 */
export async function extractPDFTextWithOCR(
  file: File,
  onProgress?: (progress: number) => void,
  options: OCRFallbackOptions = {}
): Promise<string> {
  try {
    return await extractPDFText(file, onProgress);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF extraction failed';
    if (!message.toLowerCase().includes('no selectable text')) {
      throw error;
    }
  }

  return extractPDFTextViaOCR(file, onProgress, options);
}

/**
 * Check if a file is a PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
