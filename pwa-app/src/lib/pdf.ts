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

  // Configure worker
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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

  return textParts.join('\n\n');
}

/**
 * Check if a file is a PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
