/**
 * Credit Report Parser v2.0 - Enterprise-Grade Multi-Format Parser
 * Handles Experian, Equifax, TransUnion, AnnualCreditReport.com, Credit Karma,
 * and various third-party credit monitoring services
 */

import { CreditFields } from './types';
import { normalizeNumeric } from './validation';

export interface ExtractedField {
  value: string;
  confidence: 'High' | 'Medium' | 'Low';
  sourceText: string;
  bureau?: string;
}

export interface ParsedFields {
  [key: string]: ExtractedField;
}

export interface ParsedAccount {
  id: string;
  fields: CreditFields;
  parsedFields?: ParsedFields;
  rawText: string;
  bureau?: string;
  confidence: number;
}

// Comprehensive date patterns
const DATE_PATTERNS: Array<{ pattern: RegExp; format: string }> = [
  { pattern: /\b(\d{4})-(\d{2})-(\d{2})\b/, format: 'YYYY-MM-DD' },
  { pattern: /\b(\d{2})\/(\d{2})\/(\d{4})\b/, format: 'MM/DD/YYYY' },
  { pattern: /\b(\d{2})-(\d{2})-(\d{4})\b/, format: 'MM-DD-YYYY' },
  { pattern: /\b(\d{1,2})\/(\d{1,2})\/(\d{2})\b/, format: 'M/D/YY' },
  { pattern: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.\-]+\d{1,2},?\s+\d{4}\b/i, format: 'Month DD, YYYY' },
  { pattern: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.\-]+\d{4}\b/i, format: 'Month YYYY' },
  { pattern: /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i, format: 'DD Month YYYY' },
];

// Bureau-specific field patterns
const BUREAU_PATTERNS: Record<string, Record<string, RegExp[]>> = {
  experian: {
    originalCreditor: [
      /original\s*creditor[:\s]*([A-Za-z0-9\s&\-\.']+?)(?:\n|$|account)/i,
      /sold\s*to[:\s]*([A-Za-z0-9\s&\-\.']+)/i,
    ],
    dofd: [
      /date\s*of\s*1st\s*delinquency[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
      /fcra\s*compliance\s*date[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    ],
  },
  equifax: {
    dofd: [
      /date\s*first\s*delinquent[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
      /date\s*of\s*first\s*delinquency[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    ],
  },
  transunion: {
    dofd: [
      /date\s*of\s*first\s*delinquency[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
      /fcra\s*date[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    ],
  },
};

// Comprehensive field extraction patterns
const FIELD_PATTERNS: Record<string, RegExp[]> = {
  originalCreditor: [
    /original\s*creditor[:\s]*([A-Za-z0-9\s&\-\.']+?)(?:\n|\||$|account|balance)/i,
    /sold\s*(?:to|by)[:\s]*([A-Za-z0-9\s&\-\.']+)/i,
    /transferred\s*(?:from|to)[:\s]*([A-Za-z0-9\s&\-\.']+)/i,
    /purchased\s*from[:\s]*([A-Za-z0-9\s&\-\.']+)/i,
  ],
  phone: [
    /(?:phone|tel|contact|customer\s*service)[:\s]*(\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4})/i,
    /\b(\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4})\b/
  ],
  furnisherOrCollector: [
    /(?:collection|collector|agency|furnisher)[:\s]*([A-Za-z0-9\s&\-\.']+?)(?:\n|$)/i,
    /reported\s*by[:\s]*([A-Za-z0-9\s&\-\.']+)/i,
    /creditor\s*(?:name)?[:\s]*([A-Za-z0-9\s&\-\.']+?)(?:\n|$|account)/i,
    /company\s*name[:\s]*([A-Za-z0-9\s&\-\.']+)/i,
    /subscriber\s*name[:\s]*([A-Za-z0-9\s&\-\.']+)/i,
    /^([A-Z][A-Z0-9\s&\-\.]+(?:COLLECTION|RECOVERY|ASSOC|LLC|INC|CORP))/im,
  ],
  accountNumber: [
    /account\s*(?:number|#|no\.?)[:\s]*([A-Za-z0-9\*\-]+)/i,
    /acct\s*(?:#|no\.?)[:\s]*([A-Za-z0-9\*\-]+)/i,
  ],
  accountType: [
    /account\s*type[:\s]*(collection|charge[\s\-]?off|open|closed|installment|revolving|mortgage|auto|student|medical|credit\s*card)/i,
    /type[:\s]*(collection|charge[\s\-]?off|installment|revolving)/i,
    /loan\s*type[:\s]*([A-Za-z\s]+)/i,
    /(?:^|\n)(collection|charge[\s\-]?off)\s*account/im,
  ],
  accountStatus: [
    /(?:account\s*)?status[:\s]*([A-Za-z\s\-]+?)(?:\.|,|\n|$)/i,
    /(?:pay\s*)?status[:\s]*([A-Za-z0-9\s\-]+?)(?:\.|,|\n|$)/i,
    /current\s*status[:\s]*([A-Za-z\s\-]+)/i,
    /account\s*condition[:\s]*([A-Za-z\s\-]+)/i,
  ],
  currentValue: [
    /(?:current\s*)?balance[:\s]*\$?([\d,]+\.?\d*)/i,
    /(?:amount\s*)?owed[:\s]*\$?([\d,]+\.?\d*)/i,
    /balance\s*owed[:\s]*\$?([\d,]+\.?\d*)/i,
    /unpaid\s*balance[:\s]*\$?([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.?\d*)\s*(?:balance|owed|due)/i,
    /remaining\s*balance[:\s]*\$?([\d,]+\.?\d*)/i,
    /(?:stated\s*)?value[:\s]*([\d,]+\.?\d*)/i,
  ],
  initialValue: [
    /original\s*(?:amount|balance|debt)[:\s]*\$?([\d,]+\.?\d*)/i,
    /(?:high\s*)?credit[:\s]*\$?([\d,]+\.?\d*)/i,
    /credit\s*limit[:\s]*\$?([\d,]+\.?\d*)/i,
    /original\s*loan\s*amount[:\s]*\$?([\d,]+\.?\d*)/i,
    /principal[:\s]*\$?([\d,]+\.?\d*)/i,
    /initial\s*value[:\s]*([\d,]+\.?\d*)/i,
  ],
  creditLimit: [
    /credit\s*limit[:\s]*\$?([\d,]+\.?\d*)/i,
    /limit[:\s]*\$?([\d,]+\.?\d*)/i,
  ],
  dateOpened: [
    /(?:date\s*)?opened[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /open\s*date[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /account\s*opened[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /originated[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  dateReportedOrUpdated: [
    /(?:date\s*)?(?:last\s*)?reported[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /(?:date\s*)?(?:last\s*)?updated[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /as\s*of[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  dofd: [
    /(?:date\s*(?:of\s*)?)?(?:first\s*)?delinquen(?:cy|t)[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /dofd[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /fcra\s*(?:compliance\s*)?date[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /first\s*(?:reported|major)\s*delinquency[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /date\s*of\s*1st\s*delinquency[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /date\s*first\s*delinquent[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /120\s*days\s*past\s*due\s*date[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  chargeOffDate: [
    /charge[\s\-]?off\s*(?:date)?[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /charged[\s\-]?off[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /date\s*charged\s*off[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  dateLastPayment: [
    /(?:date\s*(?:of\s*)?)?last\s*(?:payment|paid)[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /last\s*payment\s*(?:date)?[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /most\s*recent\s*payment[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  dateLastActivity: [
    /(?:date\s*(?:of\s*)?)?last\s*activity[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /last\s*(?:reported|updated)[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  estimatedRemovalDate: [
    /(?:estimated\s*)?(?:date\s*of\s*)?remov(?:al|ed)(?:\s*on)?[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /scheduled\s*to\s*be\s*removed\s*(?:on)?[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /on\s*file\s*until[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /remov(?:al|ed)\s*date[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  remarks: [
    /(?:remarks|comments|notes)[:\s]+([A-Za-z0-9\s\.,&\'\-\(\)\!/]+?)(?:\n|\||$)/i,
    /consumer\s*statement[:\s]+([A-Za-z0-9\s\.,&\'\-\(\)\!/]+?)(?:\n|\||$)/i,
    /subscriber\s*remarks[:\s]+([A-Za-z0-9\s\.,&\'\-\(\)\!/]+?)(?:\n|\||$)/i,
    /remarks?[:\s]*([A-Za-z0-9\s\-\.,&\'\-\(\)\!/]+?)(?:\n|$)/i,
  ],
};

// Common collection agency identifiers
const COLLECTION_AGENCIES = [
  'portfolio recovery', 'midland', 'cavalry', 'lvnv', 'encore capital',
  'asset acceptance', 'convergent', 'ic system', 'transworld',
  'credence', 'enhanced recovery', 'national credit', 'collections',
];

/**
 * Detect bureau from text content
 */
function detectBureau(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes('experian') || lower.includes('fcra compliance date')) return 'experian';
  if (lower.includes('equifax') || lower.includes('subscriber name')) return 'equifax';
  if (lower.includes('transunion') || lower.includes('trans union')) return 'transunion';
  return null;
}

/**
 * Normalize a date string to YYYY-MM-DD format
 */
export function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;

  const cleaned = dateStr.trim().replace(/\s+/g, ' ');

  // YYYY-MM-DD
  const iso = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // MM/DD/YYYY or MM-DD-YYYY
  const mdy = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mdy) {
    const month = mdy[1].padStart(2, '0');
    const day = mdy[2].padStart(2, '0');
    return `${mdy[3]}-${month}-${day}`;
  }

  // M/D/YY (short year)
  const mdyShort = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (mdyShort) {
    const year = parseInt(mdyShort[3]) > 50 ? `19${mdyShort[3]}` : `20${mdyShort[3]}`;
    const month = mdyShort[1].padStart(2, '0');
    const day = mdyShort[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Month name formats
  const monthNames: Record<string, string> = {
    jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
    apr: '04', april: '04', may: '05', jun: '06', june: '06',
    jul: '07', july: '07', aug: '08', august: '08', sep: '09', sept: '09', september: '09',
    oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12'
  };

  // Month DD, YYYY
  const monthFirst = cleaned.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[\s\.\-,]+(\d{1,2})[\s,]+(\d{4})/i);
  if (monthFirst) {
    const month = monthNames[monthFirst[1].toLowerCase().substring(0, 3)];
    const day = monthFirst[2].padStart(2, '0');
    return `${monthFirst[3]}-${month}-${day}`;
  }

  // DD Month YYYY
  const dayFirst = cleaned.match(/^(\d{1,2})[\s\-]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[\s\-,]+(\d{4})/i);
  if (dayFirst) {
    const month = monthNames[dayFirst[2].toLowerCase().substring(0, 3)];
    const day = dayFirst[1].padStart(2, '0');
    return `${dayFirst[3]}-${month}-${day}`;
  }

  // Month YYYY (assume 1st of month)
  const monthYear = cleaned.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[\s\.\-,]+(\d{4})/i);
  if (monthYear) {
    const month = monthNames[monthYear[1].toLowerCase().substring(0, 3)];
    return `${monthYear[2]}-${month}-01`;
  }

  return null;
}

/**
 * Extract a date from surrounding text
 */
export function extractDate(text: string): string | null {
  for (const { pattern } of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) return normalizeDate(match[0]);
  }
  return null;
}

/**
 * Check if text contains collection account indicators
 */
function isCollectionAccount(text: string): boolean {
  const lower = text.toLowerCase();
  if (lower.includes('collection') || lower.includes('charge-off') || lower.includes('charged off')) return true;
  return COLLECTION_AGENCIES.some(agency => lower.includes(agency));
}

/**
 * Segment a full credit report into individual accounts
 */
export function segmentAccounts(text: string): string[] {
  const lines = text.split('\n');
  const segments: string[] = [];
  let currentSegment: string[] = [];

  const boundaryPatterns = [
    /^={3,}$/,
    /^-{3,}$/,
    /^\*{3,}$/,
    /^(account|tradeline|creditor)[:\s]/i,
    /^[A-Z][A-Z\s&\-\.]{5,}(?:BANK|CREDIT|FINANCIAL|FUNDING|RECOVERY|COLLECTION|LLC|INC)/,
    /^[A-Z\s]{4,}\s{3,}\d{4,}/, // Name followed by balance
    /\b(?:original\s+creditor|furnisher|collector):/i,
    /\baccount\s+number:\s*[\dX*]+/i
  ];

  for (const line of lines) {
    const isBoundary = boundaryPatterns.some(p => p.test(line.trim()));
    if (isBoundary && currentSegment.length > 0) {
      const segmentText = currentSegment.join('\n').trim();
      if (segmentText.length > 50) segments.push(segmentText);
      currentSegment = [line];
    } else {
      currentSegment.push(line);
    }
  }

  if (currentSegment.length > 0) {
    const segmentText = currentSegment.join('\n').trim();
    if (segmentText.length > 50) segments.push(segmentText);
  }

  return segments.length > 0 ? segments : (text.trim().length > 50 ? [text] : []);
}

/**
 * Detect and repair spaced-out text often found in mainframe exports or OCR
 * E.g., "A C C O U N T  N U M B E R" -> "ACCOUNT NUMBER"
 */
function repairSpacedText(text: string): string {
  // First, detect if the text has significant spacing between letters
  // At least 4 instances of "Character Space Character"
  const spacedMatches = text.match(/([A-Z]\s[A-Z]\s[A-Z]\s[A-Z])/g);
  if (!spacedMatches || spacedMatches.length < 2) return text;

  return text
    .replace(/\b([A-Z])\s(?=[A-Z]\b)/g, '$1') // Merge single characters separated by spaces
    .replace(/\b([A-Z])\s(?=[A-Z]\b)/g, '$1') // Second pass for remaining spaces
    .replace(/\s{3,}/g, '  '); // Normalize extremely large gaps
}

/**
 * Main parsing function - extracts structured data from credit report text
 */
export function parseCreditReport(rawText: string): ParsedFields {
  const text = repairSpacedText(rawText);
  const results: ParsedFields = {};
  const bureau = detectBureau(text);
  const bureauPatterns = bureau ? BUREAU_PATTERNS[bureau] || {} : {};

  for (const [fieldName, patterns] of Object.entries(FIELD_PATTERNS)) {
    let bestMatch: ExtractedField | null = null;
    const allPatterns = [...(bureauPatterns[fieldName] || []), ...patterns];

    for (const pattern of allPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let value = match[1].trim().replace(/[\.,;:]+$/, '').replace(/\s+/g, ' ');
        let confidence: 'High' | 'Medium' | 'Low' = 'Medium';

        // Date field normalization
        if (fieldName.includes('date') || fieldName.includes('Date') || fieldName === 'dofd') {
          const normalized = normalizeDate(value) || extractDate(value);
          if (normalized) {
            value = normalized;
            confidence = 'High';
          } else if (value.length > 20) {
            const extracted = extractDate(value);
            if (extracted) {
              value = extracted;
              confidence = 'Medium';
            } else continue;
          } else {
            confidence = 'Low';
          }
        }

        // Monetary field cleanup
        if (fieldName.includes('balance') || fieldName.includes('Amount') ||
          fieldName.includes('Limit') || fieldName === 'creditLimit') {
          const numMatch = value.match(/[\d,]+\.?\d*/);
          if (numMatch) {
            value = numMatch[0];
            confidence = 'High';
          }
        }

        // Bureau standardization
        if (fieldName === 'bureau') {
          confidence = 'High';
          value = value.replace(/\s+/g, '');
          value = value.toLowerCase() === 'transunion' ? 'TransUnion' :
            value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        }

        // Account type standardization
        if (fieldName === 'accountType') {
          value = value.toLowerCase()
            .replace(/charge[\s\-]?off/g, 'Charge-off')
            .replace(/collection/g, 'Collection')
            .replace(/credit\s*card/g, 'Credit Card')
            .replace(/installment/g, 'Installment')
            .replace(/revolving/g, 'Revolving')
            .replace(/mortgage/g, 'Mortgage')
            .replace(/auto/g, 'Auto Loan')
            .replace(/student/g, 'Student Loan');
          value = value.charAt(0).toUpperCase() + value.slice(1);
        }

        // Skip short values for certain fields
        if (['originalCreditor', 'furnisherOrCollector'].includes(fieldName) && value.length < 3) continue;

        if (!bestMatch || confidence === 'High') {
          bestMatch = { value, confidence, sourceText: match[0].substring(0, 80), bureau: bureau || undefined };
          if (confidence === 'High') break;
        }
      }
    }

    results[fieldName] = bestMatch || { value: '', confidence: 'Low', sourceText: '' };
  }

  // Auto-detect collection account type
  if (!results.accountType?.value && isCollectionAccount(text)) {
    results.accountType = { value: 'Collection', confidence: 'Medium', sourceText: 'Auto-detected' };
  }

  // Set bureau if detected
  if (bureau && !results.bureau?.value) {
    results.bureau = { value: bureau.charAt(0).toUpperCase() + bureau.slice(1), confidence: 'High', sourceText: 'Auto-detected' };
  }

  return results;
}

/**
 * Parse multiple accounts from a full credit report
 */
export function parseMultipleAccounts(text: string): ParsedAccount[] {
  const sections = segmentAccounts(text);
  const accounts: ParsedAccount[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const parsed = parseCreditReport(section);
    const fields = fieldsToSimple(parsed);
    const quality = getExtractionQuality(parsed);

    if (fields.furnisherOrCollector || fields.originalCreditor || fields.currentValue) {
      accounts.push({
        id: `account-${i + 1}`,
        fields,
        parsedFields: parsed,
        rawText: section.substring(0, 500),
        bureau: parsed.bureau?.value,
        confidence: quality.score
      });
    }
  }

  return accounts;
}

/**
 * Convert parsed fields to simple key-value for rule engine with normalization
 */
export function fieldsToSimple(parsed: ParsedFields): CreditFields {
  const simple: CreditFields = {};
  for (const [key, field] of Object.entries(parsed)) {
    if (!field.value) continue;
    
    let normalized = field.value;
    // Hardening: Normalize dates and numeric values before they hit the rules logic
    if (key.toLowerCase().includes('date') || key === 'dofd') {
      normalized = normalizeDate(field.value) || field.value;
    } else if (
      key.toLowerCase().includes('value') || 
      key.toLowerCase().includes('amount') || 
      key.toLowerCase().includes('balance') || 
      key === 'creditLimit' ||
      key === 'initialValue' ||
      key === 'originalAmount'
    ) {
      normalized = normalizeNumeric(field.value) || field.value;
    }
    
    (simple as Record<string, string>)[key] = normalized;
  }
  return simple;
}

/**
 * Get extraction quality score
 */
export function getExtractionQuality(parsed: ParsedFields): { score: number; description: string; details: string[] } {
  const fields = Object.values(parsed);
  const total = fields.length;
  const highConf = fields.filter(f => f.confidence === 'High').length;
  const medConf = fields.filter(f => f.confidence === 'Medium').length;
  const hasValue = fields.filter(f => f.value).length;

  const score = Math.round((highConf * 100 + medConf * 60 + (hasValue - highConf - medConf) * 20) / total);

  const details: string[] = [];
  const criticalFields = ['dofd', 'currentValue', 'furnisherOrCollector'];
  const missingCritical = criticalFields.filter(f => !parsed[f]?.value);
  if (missingCritical.length > 0) details.push(`Missing critical: ${missingCritical.join(', ')}`);

  const dateFields = ['dofd', 'dateOpened', 'chargeOffDate', 'dateLastPayment', 'estimatedRemovalDate'];
  const lowConfDates = dateFields.filter(f => parsed[f]?.value && parsed[f]?.confidence !== 'High');
  if (lowConfDates.length > 0) details.push(`Verify dates: ${lowConfDates.join(', ')}`);

  let description = 'Poor extraction - verify all fields';
  if (score >= 80) description = 'Excellent extraction quality';
  else if (score >= 60) description = 'Good extraction - verify highlighted fields';
  else if (score >= 40) description = 'Fair extraction - manual review recommended';

  return { score, description, details };
}

/**
 * Validate extracted data for common issues
 */
export function validateExtraction(fields: CreditFields): string[] {
  const warnings: string[] = [];

  if (fields.dofd && fields.dateOpened) {
    const dofd = new Date(fields.dofd);
    const opened = new Date(fields.dateOpened);
    if (dofd < opened) warnings.push('DOFD is before account open date - verify dates');
  }

  if (fields.chargeOffDate && fields.dofd) {
    const chargeOff = new Date(fields.chargeOffDate);
    const dofd = new Date(fields.dofd);
    if (chargeOff < dofd) warnings.push('Charge-off date is before DOFD - verify dates');
  }

  if (fields.currentValue && fields.initialValue) {
    const current = parseFloat(fields.currentValue.replace(/[$,]/g, ''));
    const initial = parseFloat(fields.initialValue.replace(/[$,]/g, ''));
    if (current > initial * 3) warnings.push('Current value is 3x+ initial value - verify figures');
  }

  if (fields.accountStatus) {
    const status = fields.accountStatus.toLowerCase();
    if (status.includes('paid') && fields.currentValue) {
      const val = parseFloat(fields.currentValue.replace(/[$,]/g, ''));
      if (val > 0) warnings.push('Status shows paid but value is not zero');
    }
  }

  return warnings;
}
