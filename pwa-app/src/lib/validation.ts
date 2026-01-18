/**
 * Validates a date string in YYYY-MM-DD format
 */
export const isValidDate = (dateStr: string): boolean => {
  if (!dateStr) return true; // Empty is OK for optional fields
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateStr;
};

/**
 * Gets validation status and message for a date field
 */
export const getDateValidation = (value: string | undefined, required: boolean): { valid: boolean; message: string } => {
  if (!value && required) return { valid: false, message: 'Required field' };
  if (!value) return { valid: true, message: '' };
  if (!isValidDate(value)) return { valid: false, message: 'Use YYYY-MM-DD format' };
  return { valid: true, message: '' };
};
