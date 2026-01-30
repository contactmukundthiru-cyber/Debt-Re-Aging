/**
 * Metro 2 Format Validator
 * Validates credit reporting data against Metro 2 industry standards
 */

import { CreditFields } from './rules';

export interface Metro2ValidationResult {
  isValid: boolean;
  errors: Metro2Error[];
  warnings: Metro2Warning[];
  compliance: {
    score: number;
    level: 'compliant' | 'minor_issues' | 'major_issues' | 'non_compliant';
  };
  recommendations: string[];
}

export interface Metro2Error {
  code: string;
  field: string;
  message: string;
  requirement: string;
  severity: 'error' | 'critical';
}

export interface Metro2Warning {
  code: string;
  field: string;
  message: string;
  suggestion: string;
}

// Metro 2 Field Requirements based on CDIA guidelines
const METRO2_REQUIREMENTS = {
  // Date fields - Format MMDDYYYY
  dateFormats: ['MMDDYYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'],

  // Required fields for collection accounts
  collectionRequired: [
    'originalCreditor',
    'dofd',
    'currentValue',
    'accountStatus'
  ],

  // Required fields for all accounts
  baseRequired: [
    'furnisherOrCollector',
    'accountStatus'
  ],

  // Account status codes (base segment field 17)
  validStatusCodes: [
    '11', '13', '61', '62', '63', '64', '65', '71', '78', '80', '82', '83', '84', '88', '89', '93', '94', '95', '96', '97'
  ],

  // Account type codes (base segment field 14)
  validAccountTypes: [
    '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '15', '17', '18', '19', '20', '25', '26', '29', '43', '47', '48', '50', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '77', '78', '89', '90', '91', '92', '93', '94', '95'
  ],

  // Payment rating codes (base segment field 17A)
  validPaymentRatings: [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'G', 'L'
  ],

  // Special comment codes
  specialCommentCodes: {
    'AW': 'Account acquired from another lender',
    'B': 'Account payments managed by credit counseling agency',
    'M': 'Account closed at consumer\'s request',
    'O': 'Account assigned to internal collections',
    'R': 'Purchased by another lender',
    'S': 'Closed due to transfer',
    'V': 'Voluntarily surrendered'
  }
};

/**
 * Validate credit fields against Metro 2 standards
 */
export function validateMetro2(fields: CreditFields): Metro2ValidationResult {
  const errors: Metro2Error[] = [];
  const warnings: Metro2Warning[] = [];

  // 1. Check required fields based on account type
  validateRequiredFields(fields, errors);

  // 2. Validate date formats and logic
  validateDates(fields, errors, warnings);

  // 3. Validate balance logic
  validateBalances(fields, errors, warnings);

  // 4. Validate status consistency
  validateStatus(fields, errors, warnings);

  // 5. Validate DOFD requirements
  validateDOFD(fields, errors, warnings);

  // 6. Check for common Metro 2 violations
  checkCommonViolations(fields, errors, warnings);

  // Calculate compliance score
  const score = calculateComplianceScore(errors, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    compliance: {
      score,
      level: score >= 90 ? 'compliant' :
             score >= 70 ? 'minor_issues' :
             score >= 50 ? 'major_issues' : 'non_compliant'
    },
    recommendations: generateRecommendations(errors, warnings)
  };
}

/**
 * Validate required fields
 */
function validateRequiredFields(fields: CreditFields, errors: Metro2Error[]): void {
  const accountType = (fields.accountType || '').toLowerCase();
  const isCollection = accountType.includes('collection');

  // Base required fields
  METRO2_REQUIREMENTS.baseRequired.forEach(field => {
    if (!fields[field as keyof CreditFields]) {
      errors.push({
        code: 'M2-REQ-001',
        field,
        message: `Required field "${field}" is missing`,
        requirement: 'Metro 2 Base Segment requires this field',
        severity: 'error'
      });
    }
  });

  // Collection-specific required fields
  if (isCollection) {
    METRO2_REQUIREMENTS.collectionRequired.forEach(field => {
      if (!fields[field as keyof CreditFields]) {
        errors.push({
          code: 'M2-REQ-002',
          field,
          message: `Required field "${field}" is missing for collection account`,
          requirement: 'Metro 2 requires DOFD, Original Creditor, and balance for collection accounts',
          severity: 'critical'
        });
      }
    });
  }
}

/**
 * Validate date formats and logic
 */
function validateDates(
  fields: CreditFields,
  errors: Metro2Error[],
  warnings: Metro2Warning[]
): void {
  const dateFields = ['dateOpened', 'dofd', 'chargeOffDate', 'dateLastPayment', 'dateReportedOrUpdated', 'estimatedRemovalDate'];

  dateFields.forEach(field => {
    const value = fields[field as keyof CreditFields] as string | undefined;
    if (value) {
      // Check if date is valid
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push({
          code: 'M2-DATE-001',
          field,
          message: `Invalid date format for "${field}": ${value}`,
          requirement: 'Metro 2 requires valid dates in MMDDYYYY or standard format',
          severity: 'error'
        });
      }

      // Check for future dates (except removal date)
      if (field !== 'estimatedRemovalDate' && date > new Date()) {
        errors.push({
          code: 'M2-DATE-002',
          field,
          message: `Future date detected for "${field}": ${value}`,
          requirement: 'Dates cannot be in the future (except estimated removal)',
          severity: 'critical'
        });
      }
    }
  });

  // Chronological validation
  if (fields.dateOpened && fields.dofd) {
    const opened = new Date(fields.dateOpened);
    const dofd = new Date(fields.dofd);
    if (dofd < opened) {
      errors.push({
        code: 'M2-DATE-003',
        field: 'dofd',
        message: 'DOFD cannot be before Date Opened',
        requirement: 'Metro 2 requires chronologically consistent dates',
        severity: 'critical'
      });
    }
  }

  if (fields.dofd && fields.chargeOffDate) {
    const dofd = new Date(fields.dofd);
    const chargeOff = new Date(fields.chargeOffDate);
    if (dofd > chargeOff) {
      errors.push({
        code: 'M2-DATE-004',
        field: 'dofd',
        message: 'DOFD cannot be after Charge-Off Date',
        requirement: 'Account must be delinquent before charge-off',
        severity: 'critical'
      });
    }
  }
}

/**
 * Validate balances
 */
function validateBalances(
  fields: CreditFields,
  errors: Metro2Error[],
  warnings: Metro2Warning[]
): void {
  const current = parseFloat((fields.currentValue || '0').replace(/[$,]/g, ''));
  const original = parseFloat((fields.originalAmount || '0').replace(/[$,]/g, ''));

  // Negative balance check
  if (current < 0) {
    errors.push({
      code: 'M2-BAL-001',
      field: 'currentValue',
      message: 'Balance cannot be negative',
      requirement: 'Metro 2 requires non-negative balance values',
      severity: 'error'
    });
  }

  // Balance exceeds original by significant amount
  if (original > 0 && current > original * 3) {
    warnings.push({
      code: 'M2-BAL-002',
      field: 'currentValue',
      message: `Current balance ($${current}) exceeds original ($${original}) by more than 200%`,
      suggestion: 'Verify fees and interest are properly documented'
    });
  }

  // Paid/Closed status with balance
  const status = (fields.accountStatus || '').toLowerCase();
  if ((status.includes('paid') || status.includes('closed')) && current > 0) {
    errors.push({
      code: 'M2-BAL-003',
      field: 'currentValue',
      message: `Account status is "${status}" but balance is $${current}`,
      requirement: 'Paid/Closed accounts must report zero value balance per Metro 2',
      severity: 'critical'
    });
  }
}

/**
 * Validate account status
 */
function validateStatus(
  fields: CreditFields,
  errors: Metro2Error[],
  warnings: Metro2Warning[]
): void {
  const status = fields.accountStatus || '';
  const accountType = (fields.accountType || '').toLowerCase();
  const balance = parseFloat((fields.currentValue || '0').replace(/[$,]/g, ''));

  // Collection with "Open" status but no recent activity
  if (accountType.includes('collection') && status.toLowerCase() === 'open') {
    if (fields.dateLastPayment) {
      const lastPayment = new Date(fields.dateLastPayment);
      const monthsAgo = (Date.now() - lastPayment.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsAgo > 24) {
        warnings.push({
          code: 'M2-STATUS-001',
          field: 'accountStatus',
          message: 'Collection marked "Open" with no payment activity in 24+ months',
          suggestion: 'Status may be inaccurate; collections typically transition to charged-off or transferred'
        });
      }
    }
  }

  // Charge-off status without charge-off date
  if (status.toLowerCase().includes('charged off') && !fields.chargeOffDate) {
    errors.push({
      code: 'M2-STATUS-002',
      field: 'chargeOffDate',
      message: 'Account shows charged-off status but no charge-off date',
      requirement: 'Metro 2 requires charge-off date when status indicates charge-off',
      severity: 'error'
    });
  }
}

/**
 * Validate DOFD requirements
 */
function validateDOFD(
  fields: CreditFields,
  errors: Metro2Error[],
  warnings: Metro2Warning[]
): void {
  const accountType = (fields.accountType || '').toLowerCase();
  const status = (fields.accountStatus || '').toLowerCase();
  const isNegative = accountType.includes('collection') ||
                     status.includes('charged off') ||
                     status.includes('delinquent');

  // DOFD required for negative accounts
  if (isNegative && !fields.dofd) {
    errors.push({
      code: 'M2-DOFD-001',
      field: 'dofd',
      message: 'DOFD is required for negative/collection accounts',
      requirement: 'Metro 2 Field 25 (DOFD) is mandatory for accounts with delinquent history',
      severity: 'critical'
    });
  }

  // DOFD should not change
  // (This would require historical comparison)

  // Removal date validation
  if (fields.dofd && fields.estimatedRemovalDate) {
    const dofd = new Date(fields.dofd);
    const removal = new Date(fields.estimatedRemovalDate);

    // Calculate expected removal (7 years + 180 days)
    const expectedRemoval = new Date(dofd);
    expectedRemoval.setFullYear(expectedRemoval.getFullYear() + 7);
    expectedRemoval.setDate(expectedRemoval.getDate() + 180);

    const diffDays = Math.abs((removal.getTime() - expectedRemoval.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      warnings.push({
        code: 'M2-DOFD-002',
        field: 'estimatedRemovalDate',
        message: `Removal date differs from expected by ${Math.round(diffDays)} days`,
        suggestion: 'Removal should be 7 years + 180 days from DOFD per FCRA §605'
      });
    }
  }
}

/**
 * Check for common Metro 2 violations
 */
function checkCommonViolations(
  fields: CreditFields,
  errors: Metro2Error[],
  warnings: Metro2Warning[]
): void {
  // Collection reporting original creditor account as their own
  if (fields.furnisherOrCollector && fields.originalCreditor) {
    const furnisher = fields.furnisherOrCollector.toLowerCase();
    const original = fields.originalCreditor.toLowerCase();

    if (!furnisher.includes('collection') && furnisher !== original) {
      warnings.push({
        code: 'M2-COMMON-001',
        field: 'furnisherOrCollector',
        message: 'Furnisher appears different from original creditor but not identified as collection agency',
        suggestion: 'Collection accounts should clearly identify collection agency status'
      });
    }
  }

  // Payment history pattern validation
  if (fields.paymentHistory) {
    const history = fields.paymentHistory.toUpperCase();
    const hasChargeOff = history.includes('CO') || history.includes('9');

    if (hasChargeOff && !fields.chargeOffDate) {
      warnings.push({
        code: 'M2-COMMON-002',
        field: 'paymentHistory',
        message: 'Payment history shows charge-off but no charge-off date reported',
        suggestion: 'Include charge-off date for consistency'
      });
    }
  }
}

/**
 * Calculate compliance score
 */
function calculateComplianceScore(errors: Metro2Error[], warnings: Metro2Warning[]): number {
  let score = 100;

  // Deduct for errors
  errors.forEach(error => {
    if (error.severity === 'critical') {
      score -= 15;
    } else {
      score -= 10;
    }
  });

  // Deduct for warnings
  warnings.forEach(() => {
    score -= 3;
  });

  return Math.max(0, score);
}

/**
 * Generate recommendations based on validation results
 */
function generateRecommendations(errors: Metro2Error[], warnings: Metro2Warning[]): string[] {
  const recommendations: string[] = [];

  // Critical errors
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  if (criticalErrors.length > 0) {
    recommendations.push(`Address ${criticalErrors.length} critical Metro 2 compliance errors immediately.`);

    if (criticalErrors.some(e => e.code.includes('DOFD'))) {
      recommendations.push('DOFD errors are particularly strong grounds for dispute - cite Metro 2 Field 25 requirements.');
    }

    if (criticalErrors.some(e => e.code.includes('DATE'))) {
      recommendations.push('Date inconsistencies suggest re-aging - request complete account history.');
    }

    if (criticalErrors.some(e => e.code.includes('BAL'))) {
      recommendations.push('Balance errors on paid accounts must be corrected to zero value under Metro 2 guidelines.');
    }
  }

  // Regular errors
  if (errors.length > criticalErrors.length) {
    recommendations.push('Include all Metro 2 compliance issues in your dispute letter.');
  }

  // Warnings
  if (warnings.length > 0) {
    recommendations.push('Document warning items as supporting evidence of improper reporting.');
  }

  // General
  if (errors.length === 0 && warnings.length === 0) {
    recommendations.push('Account appears Metro 2 compliant based on available data.');
    recommendations.push('Consider requesting full Metro 2 data from bureau for comprehensive review.');
  }

  return recommendations;
}

/**
 * Format validation report
 */
export function formatMetro2Report(result: Metro2ValidationResult): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('        METRO 2 COMPLIANCE VALIDATION');
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push(`Overall Status: ${result.isValid ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
  lines.push(`Compliance Score: ${result.compliance.score}/100`);
  lines.push(`Compliance Level: ${result.compliance.level.replace('_', ' ').toUpperCase()}`);
  lines.push('');

  if (result.errors.length > 0) {
    lines.push('─'.repeat(60));
    lines.push(`ERRORS (${result.errors.length}):`);
    lines.push('─'.repeat(60));
    result.errors.forEach((e, i) => {
      lines.push(`\n${i + 1}. [${e.code}] ${e.severity.toUpperCase()}`);
      lines.push(`   Field: ${e.field}`);
      lines.push(`   Issue: ${e.message}`);
      lines.push(`   Requirement: ${e.requirement}`);
    });
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('─'.repeat(60));
    lines.push(`WARNINGS (${result.warnings.length}):`);
    lines.push('─'.repeat(60));
    result.warnings.forEach((w, i) => {
      lines.push(`\n${i + 1}. [${w.code}]`);
      lines.push(`   Field: ${w.field}`);
      lines.push(`   Issue: ${w.message}`);
      lines.push(`   Suggestion: ${w.suggestion}`);
    });
    lines.push('');
  }

  lines.push('─'.repeat(60));
  lines.push('RECOMMENDATIONS:');
  lines.push('─'.repeat(60));
  result.recommendations.forEach((r, i) => {
    lines.push(`${i + 1}. ${r}`);
  });

  return lines.join('\n');
}

/**
 * Get Metro 2 field reference
 */
export function getMetro2FieldReference(field: string): string {
  const references: Record<string, string> = {
    'dofd': 'Field 25 - Date of First Delinquency',
    'dateOpened': 'Field 11 - Date Opened',
    'currentValue': 'Field 21 - Current Balance',
    'originalAmount': 'Field 22 - Original Loan Amount / Original Limit',
    'accountStatus': 'Field 17 - Account Status',
    'paymentHistory': 'Field 17A - Payment Rating',
    'dateLastPayment': 'Field 18 - Date of Last Payment',
    'chargeOffDate': 'Field 19 - Date of Account Information',
    'originalCreditor': 'J2 Segment - Original Creditor Name',
    'furnisherOrCollector': 'Field 2 - Account Holder Name'
  };

  return references[field] || 'See Metro 2 Format Guide';
}
