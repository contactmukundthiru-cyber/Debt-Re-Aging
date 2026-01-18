/**
 * Utility functions for downloading files
 */

export interface DownloadOptions {
  filename: string;
  mimeType?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Downloads content as a file
 */
export function downloadFile(
  content: string | Blob,
  options: DownloadOptions
): void {
  const {
    filename,
    mimeType = 'text/plain',
    onSuccess,
    onError,
  } = options;

  try {
    const blob = content instanceof Blob
      ? content
      : new Blob([content], { type: mimeType });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 100);

    onSuccess?.();
  } catch (error) {
    console.error('Download failed:', error);
    onError?.(error instanceof Error ? error : new Error('Download failed'));
  }
}

/**
 * Downloads JSON data as a file
 */
export function downloadJSON<T>(
  data: T,
  filename: string,
  options?: Omit<DownloadOptions, 'filename' | 'mimeType'>
): void {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, {
    ...options,
    filename: filename.endsWith('.json') ? filename : `${filename}.json`,
    mimeType: 'application/json',
  });
}

/**
 * Downloads CSV content as a file
 */
export function downloadCSV(
  content: string,
  filename: string,
  options?: Omit<DownloadOptions, 'filename' | 'mimeType'>
): void {
  downloadFile(content, {
    ...options,
    filename: filename.endsWith('.csv') ? filename : `${filename}.csv`,
    mimeType: 'text/csv',
  });
}

/**
 * Downloads text content as a file
 */
export function downloadText(
  content: string,
  filename: string,
  options?: Omit<DownloadOptions, 'filename' | 'mimeType'>
): void {
  downloadFile(content, {
    ...options,
    filename: filename.endsWith('.txt') ? filename : `${filename}.txt`,
    mimeType: 'text/plain',
  });
}

/**
 * Downloads Markdown content as a file
 */
export function downloadMarkdown(
  content: string,
  filename: string,
  options?: Omit<DownloadOptions, 'filename' | 'mimeType'>
): void {
  downloadFile(content, {
    ...options,
    filename: filename.endsWith('.md') ? filename : `${filename}.md`,
    mimeType: 'text/markdown',
  });
}

/**
 * Downloads iCal content as a file
 */
export function downloadICS(
  content: string,
  filename: string,
  options?: Omit<DownloadOptions, 'filename' | 'mimeType'>
): void {
  downloadFile(content, {
    ...options,
    filename: filename.endsWith('.ics') ? filename : `${filename}.ics`,
    mimeType: 'text/calendar',
  });
}

/**
 * Converts an array of objects to CSV string
 */
export function objectsToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers?: string[]
): string {
  if (data.length === 0) return '';

  const keys = headers || Object.keys(data[0]);
  const csvHeaders = keys.map(escapeCSVValue).join(',');

  const csvRows = data.map(row =>
    keys.map(key => escapeCSVValue(String(row[key] ?? ''))).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Escapes a value for CSV format
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Creates a data URL from content
 */
export function createDataURL(
  content: string,
  mimeType: string = 'text/plain'
): string {
  const base64 = btoa(unescape(encodeURIComponent(content)));
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Triggers print dialog for the current page
 */
export function printPage(): void {
  window.print();
}
