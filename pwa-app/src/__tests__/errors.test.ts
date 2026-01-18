/**
 * Error Handling Tests
 */

import {
  getUserFriendlyError,
  classifyError,
  handleError,
  formatErrorForToast,
  safeExecute,
  validateRequiredFields,
  UserFriendlyError
} from '../lib/errors';

describe('getUserFriendlyError', () => {
  it('should return the correct error for known error keys', () => {
    const error = getUserFriendlyError('file_too_large');
    expect(error.title).toBe('File Too Large');
    expect(error.category).toBe('file_upload');
  });

  it('should return unknown_error for unrecognized keys', () => {
    const error = getUserFriendlyError('some_random_key');
    expect(error.title).toBe('Something Went Wrong');
    expect(error.category).toBe('unknown');
  });

  it('should include original error when provided', () => {
    const originalError = new Error('Original message');
    const error = getUserFriendlyError('file_too_large', originalError);
    expect(error.originalError).toBe(originalError);
  });
});

describe('classifyError', () => {
  it('should classify file size errors', () => {
    const error = new Error('File too large to process');
    expect(classifyError(error)).toBe('file_too_large');
  });

  it('should classify file type errors', () => {
    const error = new Error('Invalid file type provided');
    expect(classifyError(error)).toBe('invalid_file_type');
  });

  it('should classify storage quota errors', () => {
    const error = new Error('QuotaExceededError: storage quota exceeded');
    expect(classifyError(error)).toBe('storage_full');
  });

  it('should classify PDF errors', () => {
    const error = new Error('Failed to parse PDF');
    expect(classifyError(error)).toBe('pdf_extraction_failed');
  });

  it('should return unknown_error for unclassified errors', () => {
    const error = new Error('Something completely random');
    expect(classifyError(error)).toBe('unknown_error');
  });

  it('should handle non-Error objects', () => {
    expect(classifyError('string error')).toBe('unknown_error');
    expect(classifyError(null)).toBe('unknown_error');
    expect(classifyError(undefined)).toBe('unknown_error');
  });
});

describe('handleError', () => {
  it('should return a UserFriendlyError object', () => {
    const error = new Error('File too large');
    const result = handleError(error);

    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('suggestion');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('originalError');
  });

  it('should handle non-Error objects', () => {
    const result = handleError('string error');
    expect(result.title).toBe('Something Went Wrong');
    expect(result.originalError).toBeInstanceOf(Error);
  });
});

describe('formatErrorForToast', () => {
  it('should format error for toast display', () => {
    const error: UserFriendlyError = {
      title: 'Test Error',
      message: 'This is a test message',
      suggestion: 'Try something else',
      category: 'unknown'
    };

    const formatted = formatErrorForToast(error);
    expect(formatted).toBe('Test Error: This is a test message');
  });
});

describe('safeExecute', () => {
  it('should return success with data on successful execution', async () => {
    const result = await safeExecute(() => 'success');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('success');
    }
  });

  it('should return failure with error on exception', async () => {
    const result = await safeExecute(() => {
      throw new Error('Test error');
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toHaveProperty('title');
      expect(result.error).toHaveProperty('message');
    }
  });

  it('should use provided errorKey when specified', async () => {
    const result = await safeExecute(() => {
      throw new Error('Any error');
    }, 'file_too_large');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.title).toBe('File Too Large');
    }
  });

  it('should handle async functions', async () => {
    const result = await safeExecute(async () => {
      return Promise.resolve('async success');
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('async success');
    }
  });

  it('should handle async rejections', async () => {
    const result = await safeExecute(async () => {
      return Promise.reject(new Error('Async error'));
    });

    expect(result.success).toBe(false);
  });
});

describe('validateRequiredFields', () => {
  it('should return null when all required fields are present', () => {
    const fields = { name: 'John', email: 'john@example.com' };
    const result = validateRequiredFields(fields, ['name', 'email']);
    expect(result).toBeNull();
  });

  it('should return error when required fields are missing', () => {
    const fields = { name: 'John' };
    const result = validateRequiredFields(fields, ['name', 'email']);

    expect(result).not.toBeNull();
    expect(result?.title).toBe('Missing Information');
    expect(result?.message).toContain('email');
    expect(result?.category).toBe('parsing');
  });

  it('should list all missing fields', () => {
    const fields = { name: 'John' };
    const result = validateRequiredFields(fields, ['name', 'email', 'phone']);

    expect(result?.message).toContain('email');
    expect(result?.message).toContain('phone');
  });

  it('should handle empty values as missing', () => {
    const fields = { name: '', email: 'john@example.com' };
    const result = validateRequiredFields(fields, ['name', 'email']);

    expect(result).not.toBeNull();
    expect(result?.message).toContain('name');
  });

  it('should handle null and undefined as missing', () => {
    const fields = { name: null, email: undefined, phone: 'present' };
    const result = validateRequiredFields(fields, ['name', 'email', 'phone']);

    expect(result).not.toBeNull();
    expect(result?.message).toContain('name');
    expect(result?.message).toContain('email');
    expect(result?.message).not.toContain('phone');
  });
});

describe('Error categories', () => {
  it('should have appropriate categories for all predefined errors', () => {
    const fileErrors = ['file_too_large', 'invalid_file_type', 'file_read_failed', 'pdf_extraction_failed'];
    const parsingErrors = ['no_account_data', 'invalid_date_format', 'incomplete_data'];
    const analysisErrors = ['analysis_failed', 'no_violations_check'];
    const exportErrors = ['pdf_generation_failed', 'download_failed'];
    const storageErrors = ['storage_full', 'storage_unavailable'];

    fileErrors.forEach(key => {
      expect(getUserFriendlyError(key).category).toBe('file_upload');
    });

    parsingErrors.forEach(key => {
      expect(getUserFriendlyError(key).category).toBe('parsing');
    });

    analysisErrors.forEach(key => {
      expect(getUserFriendlyError(key).category).toBe('analysis');
    });

    exportErrors.forEach(key => {
      expect(getUserFriendlyError(key).category).toBe('export');
    });

    storageErrors.forEach(key => {
      expect(getUserFriendlyError(key).category).toBe('storage');
    });
  });
});
