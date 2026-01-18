/**
 * Error Handling Utilities
 * Provides user-friendly error messages and error classification
 */

export type ErrorCategory =
  | 'file_upload'
  | 'parsing'
  | 'analysis'
  | 'export'
  | 'storage'
  | 'unknown';

export interface UserFriendlyError {
  title: string;
  message: string;
  suggestion: string;
  category: ErrorCategory;
  originalError?: Error;
}

/**
 * Error messages mapped by category and error type
 */
const ERROR_MESSAGES: Record<string, UserFriendlyError> = {
  // File Upload Errors
  'file_too_large': {
    title: 'File Too Large',
    message: 'The file you selected exceeds the maximum size limit of 10MB.',
    suggestion: 'Please try uploading a smaller file or compress the PDF before uploading.',
    category: 'file_upload'
  },
  'invalid_file_type': {
    title: 'Invalid File Type',
    message: 'This file type is not supported.',
    suggestion: 'Please upload a PDF, TXT, or supported image file (PNG, JPG).',
    category: 'file_upload'
  },
  'file_read_failed': {
    title: 'Unable to Read File',
    message: 'There was a problem reading your file.',
    suggestion: 'Please try again or use the manual text input option instead.',
    category: 'file_upload'
  },
  'pdf_extraction_failed': {
    title: 'PDF Processing Error',
    message: 'We could not extract text from this PDF.',
    suggestion: 'Try copying the text directly from your PDF and pasting it into the text area.',
    category: 'file_upload'
  },

  // Parsing Errors
  'no_account_data': {
    title: 'No Account Data Found',
    message: 'We could not identify any account information in the provided text.',
    suggestion: 'Make sure you\'re uploading a credit report and that the text contains account details.',
    category: 'parsing'
  },
  'invalid_date_format': {
    title: 'Date Format Issue',
    message: 'Some dates in your report could not be interpreted.',
    suggestion: 'You can manually correct dates in the verification step.',
    category: 'parsing'
  },
  'incomplete_data': {
    title: 'Incomplete Data',
    message: 'Some required fields are missing from the extracted data.',
    suggestion: 'Please fill in the missing fields manually in the verification step.',
    category: 'parsing'
  },

  // Analysis Errors
  'analysis_failed': {
    title: 'Analysis Error',
    message: 'An error occurred while analyzing your credit report.',
    suggestion: 'Please verify your data and try again. If the problem persists, contact support.',
    category: 'analysis'
  },
  'no_violations_check': {
    title: 'Analysis Complete',
    message: 'No violations were detected in this account.',
    suggestion: 'This is good news! Your account appears to be reported correctly.',
    category: 'analysis'
  },

  // Export Errors
  'pdf_generation_failed': {
    title: 'PDF Generation Failed',
    message: 'We could not create the PDF document.',
    suggestion: 'Try downloading as a text file instead, or try again in a different browser.',
    category: 'export'
  },
  'download_failed': {
    title: 'Download Failed',
    message: 'The file could not be downloaded.',
    suggestion: 'Check your browser\'s download permissions and try again.',
    category: 'export'
  },

  // Storage Errors
  'storage_full': {
    title: 'Storage Full',
    message: 'Your browser\'s local storage is full.',
    suggestion: 'Try clearing old disputes or browser data to free up space.',
    category: 'storage'
  },
  'storage_unavailable': {
    title: 'Storage Unavailable',
    message: 'Local storage is not available in your browser.',
    suggestion: 'Try enabling cookies or using a different browser. Your data will not be saved between sessions.',
    category: 'storage'
  },

  // Generic Fallback
  'unknown_error': {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred.',
    suggestion: 'Please refresh the page and try again. If the problem persists, contact support.',
    category: 'unknown'
  }
};

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyError(
  errorKey: string,
  originalError?: Error
): UserFriendlyError {
  const error = ERROR_MESSAGES[errorKey] || ERROR_MESSAGES['unknown_error'];
  return {
    ...error,
    originalError
  };
}

/**
 * Classify an error based on its properties
 */
export function classifyError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // File-related errors
    if (message.includes('file') && message.includes('large')) return 'file_too_large';
    if (message.includes('type') || message.includes('format')) return 'invalid_file_type';
    if (message.includes('read') || message.includes('load')) return 'file_read_failed';
    if (message.includes('pdf')) return 'pdf_extraction_failed';

    // Storage errors
    if (message.includes('quota') || message.includes('storage')) return 'storage_full';
    if (message.includes('localstorage')) return 'storage_unavailable';

    // Analysis errors
    if (message.includes('analysis') || message.includes('rule')) return 'analysis_failed';

    // PDF generation
    if (message.includes('jspdf') || message.includes('document')) return 'pdf_generation_failed';
  }

  return 'unknown_error';
}

/**
 * Handle an error and return a user-friendly message
 */
export function handleError(error: unknown): UserFriendlyError {
  const errorKey = classifyError(error);
  const originalError = error instanceof Error ? error : new Error(String(error));
  return getUserFriendlyError(errorKey, originalError);
}

/**
 * Format error for display in toast
 */
export function formatErrorForToast(error: UserFriendlyError): string {
  return `${error.title}: ${error.message}`;
}

/**
 * Log error for debugging (only in development)
 */
export function logError(error: UserFriendlyError, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.group(`[Error] ${error.title}`);
    console.error('Message:', error.message);
    console.error('Suggestion:', error.suggestion);
    console.error('Category:', error.category);
    if (context) console.error('Context:', context);
    if (error.originalError) console.error('Original Error:', error.originalError);
    console.groupEnd();
  }
}

/**
 * Safely execute a function with error handling
 */
export async function safeExecute<T>(
  fn: () => T | Promise<T>,
  errorKey?: string
): Promise<{ success: true; data: T } | { success: false; error: UserFriendlyError }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const userError = errorKey
      ? getUserFriendlyError(errorKey, error instanceof Error ? error : undefined)
      : handleError(error);
    logError(userError);
    return { success: false, error: userError };
  }
}

/**
 * Validate required fields and return appropriate error
 */
export function validateRequiredFields(
  fields: Record<string, unknown>,
  required: string[]
): UserFriendlyError | null {
  const missing = required.filter(key => !fields[key]);

  if (missing.length > 0) {
    return {
      title: 'Missing Information',
      message: `The following fields are required: ${missing.join(', ')}`,
      suggestion: 'Please fill in all required fields before continuing.',
      category: 'parsing'
    };
  }

  return null;
}
