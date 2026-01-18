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

export const isValidCurrency = (value: string): boolean => {
  if (!value) return true;
  const cleaned = value.replace(/[$,\s]/g, '');
  return !Number.isNaN(Number(cleaned));
};

export const getCurrencyValidation = (value: string | undefined): { valid: boolean; message: string } => {
  if (!value) return { valid: true, message: '' };
  if (!isValidCurrency(value)) return { valid: false, message: 'Use numbers like 1234.56' };
  return { valid: true, message: '' };
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
