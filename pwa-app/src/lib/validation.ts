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
 * Normalizes a date string into YYYY-MM-DD format
 * Handles common formats like MM/DD/YYYY, MM/YYYY, and text dates
 */
export const normalizeDate = (dateStr: string | undefined): string | undefined => {
  if (!dateStr) return undefined;
  const clean = dateStr.trim();
  
  // Already in YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  
  // Handle MM/DD/YYYY or MM-DD-YYYY
  const mdyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (mdyMatch) {
    let [_, m, d, y] = mdyMatch;
    if (y.length === 2) y = (parseInt(y) > 50 ? '19' : '20') + y;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Handle MM/YYYY
  const myMatch = clean.match(/^(\d{1,2})[\/\-](\d{2,4})$/);
  if (myMatch) {
    let [_, m, y] = myMatch;
    if (y.length === 2) y = (parseInt(y) > 50 ? '19' : '20') + y;
    return `${y}-${m.padStart(2, '0')}-01`;
  }

  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {}

  return dateStr;
};

/**
 * Normalizes a currency or numeric string to a clean numeric string (1234.56)
 * Includes basic OCR error correction for common character swaps.
 */
export const normalizeNumeric = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  
  // Basic OCR correction: O->0, S->5, B->8, I/L->1
  let cleaned = value.toUpperCase()
    .replace(/O/g, '0')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/[IL]/g, '1')
    .replace(/[$,\s]/g, '');
    
  if (Number.isNaN(Number(cleaned))) return value;
  return cleaned;
};

/**
 * Gets validation status and message for a date field
 */
export const getDateValidation = (value: string | undefined, required: boolean): { valid: boolean; message: string; normalized?: string } => {
  if (!value && required) return { valid: false, message: 'Required field' };
  if (!value) return { valid: true, message: '' };
  
  const normalized = normalizeDate(value);
  if (normalized && isValidDate(normalized)) {
    return { valid: true, message: '', normalized };
  }
  
  return { valid: false, message: 'Format: YYYY-MM-DD or MM/DD/YYYY' };
};

export const isValidNumeric = (value: string): boolean => {
  if (!value) return true;
  const cleaned = value.replace(/[$,\s]/g, '');
  return !Number.isNaN(Number(cleaned));
};

export const getNumericValidation = (value: string | undefined): { valid: boolean; message: string; normalized?: string } => {
  if (!value) return { valid: true, message: '' };
  const normalized = normalizeNumeric(value);
  if (normalized && isValidNumeric(normalized)) {
    return { valid: true, message: '', normalized };
  }
  return { valid: false, message: 'Use numbers like 1,234.56' };
};

const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  if (!isValidDate(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export type DateOrderIssue = {
  field: string;
  message: string;
  severity: 'blocking' | 'warning';
};

export const getDateOrderIssues = (fields: Record<string, string | undefined>): DateOrderIssue[] => {
  const issues: DateOrderIssue[] = [];
  const opened = parseDate(fields.dateOpened);
  const dofd = parseDate(fields.dofd);
  const chargeOff = parseDate(fields.chargeOffDate);
  const lastPayment = parseDate(fields.dateLastPayment);
  const updated = parseDate(fields.dateReportedOrUpdated);

  if (opened && dofd && dofd < opened) {
    issues.push({ field: 'dofd', message: 'Date of first delinquency is before account open date.', severity: 'blocking' });
  }
  if (chargeOff && dofd && chargeOff < dofd) {
    issues.push({ field: 'chargeOffDate', message: 'Charge-off date is before first delinquency.', severity: 'blocking' });
  }
  if (updated && opened && updated < opened) {
    issues.push({ field: 'dateReportedOrUpdated', message: 'Last reported is before account open date.', severity: 'warning' });
  }
  if (lastPayment && dofd && lastPayment > dofd) {
    issues.push({ field: 'dateLastPayment', message: 'Last payment is after first delinquency.', severity: 'warning' });
  }

  return issues;
};

/**
 * Normalizes all applicable fields in a CreditFields object
 */
export const normalizeCreditFields = (fields: Record<string, string | undefined>): Record<string, string | undefined> => {
  const result: Record<string, string | undefined> = { ...fields };
  
  for (const key in result) {
    const value = result[key];
    if (!value) continue;
    
    if (key.toLowerCase().includes('date') || key === 'dofd') {
      result[key] = normalizeDate(value) || value;
    } else if (
      key.toLowerCase().includes('value') || 
      key.toLowerCase().includes('amount') || 
      key.toLowerCase().includes('balance') || 
      key === 'creditLimit' ||
      key === 'initialValue' ||
      key === 'originalAmount'
    ) {
      result[key] = normalizeNumeric(value) || value;
    }
  }
  
  return result;
};
