/**
 * Input validation utilities for security and data integrity
 */

// Maximum allowed file size (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed file types for upload
export const ALLOWED_FILE_TYPES = [
  'text/plain',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
];

// Allowed file extensions
export const ALLOWED_FILE_EXTENSIONS = ['.txt', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff'];

// Maximum text input length (10MB of text)
export const MAX_TEXT_LENGTH = 10 * 1024 * 1024;

// Maximum field lengths for consumer info
export const MAX_FIELD_LENGTHS = {
  name: 100,
  address: 200,
  city: 100,
  state: 50,
  zip: 20,
  accountNumber: 50,
};

/**
 * Validate file before processing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds maximum limit of 50MB` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  // Check file type
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
    return { valid: false, error: `File type ${fileExtension} is not supported. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}` };
  }

  // Additional MIME type check if available
  if (file.type && !ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
    // Some browsers may not set MIME type correctly, so we only warn
    console.warn(`Unexpected MIME type: ${file.type} for file ${file.name}`);
  }

  // Check for potentially malicious file names
  if (containsDangerousPath(file.name)) {
    return { valid: false, error: 'File name contains potentially dangerous characters' };
  }

  return { valid: true };
}

/**
 * Validate text input
 */
export function validateTextInput(text: string, maxLength: number = MAX_TEXT_LENGTH): { valid: boolean; error?: string; sanitized?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Text input is empty' };
  }

  if (text.length > maxLength) {
    return { valid: false, error: `Text exceeds maximum length of ${maxLength} characters` };
  }

  // Basic XSS prevention - remove script tags and dangerous content
  const sanitized = sanitizeText(text);

  return { valid: true, sanitized };
}

/**
 * Validate consumer information fields
 */
export function validateConsumerInfo(field: keyof typeof MAX_FIELD_LENGTHS, value: string): { valid: boolean; error?: string; sanitized?: string } {
  const maxLength = MAX_FIELD_LENGTHS[field];
  
  if (!value || value.trim().length === 0) {
    return { valid: false, error: `${field} is required` };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `${field} exceeds maximum length of ${maxLength} characters` };
  }

  // Sanitize the input
  const sanitized = sanitizeText(value);

  // Field-specific validation
  switch (field) {
    case 'zip':
      // Allow ZIP+4 format (12345 or 12345-6789)
      if (!/^\d{5}(-\d{4})?$/.test(sanitized)) {
        return { valid: false, error: 'Invalid ZIP code format' };
      }
      break;
    case 'state':
      // Allow 2-letter state codes or full state names
      if (sanitized.length !== 2 && sanitized.length < 3) {
        return { valid: false, error: 'State must be a 2-letter code or full name' };
      }
      break;
  }

  return { valid: true, sanitized };
}

/**
 * Sanitize text to prevent XSS and injection attacks
 */
function sanitizeText(text: string): string {
  return text
    // Remove script tags and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (can be used for XSS)
    .replace(/data:[^;]*;base64,/gi, '')
    // Remove potentially dangerous HTML tags
    .replace(/<(iframe|object|embed|form|input|textarea|button)[^>]*>/gi, '')
    // Remove other script-like content
    .replace(/<[^>]+>/g, '') // Remove all HTML tags for safety
    .trim();
}

/**
 * Check if file name contains dangerous path traversal characters
 */
function containsDangerousPath(filename: string): boolean {
  const dangerousPatterns = [
    '..', // Path traversal
    '/',  // Unix path separator
    '\\', // Windows path separator
    '\x00', // Null byte
    ':',  // Windows drive separator (when used inappropriately)
  ];
  
  return dangerousPatterns.some(pattern => filename.includes(pattern));
}

/**
 * Validate date string format
 */
export function validateDateString(dateStr: string): { valid: boolean; error?: string } {
  if (!dateStr || dateStr.trim().length === 0) {
    return { valid: true }; // Empty dates are valid (optional fields)
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Check if date is in the future (which might be suspicious)
  const now = new Date();
  if (date > new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
    return { valid: false, error: 'Date cannot be in the future' };
  }

  // Check if date is too old (before 1900)
  if (date.getFullYear() < 1900) {
    return { valid: false, error: 'Date is too old (before 1900)' };
  }

  return { valid: true };
}

/**
 * Batch validate multiple files
 */
export function validateFiles(files: File[]): { valid: boolean; errors: string[]; validFiles: File[] } {
  const errors: string[] = [];
  const validFiles: File[] = [];

  for (const file of files) {
    const result = validateFile(file);
    if (result.valid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${result.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validFiles
  };
}
