/**
 * Credit Report Parser - Extracts structured data from text
 */

import { CreditFields } from './rules';

interface ExtractedField {
  value: string;
  confidence: 'High' | 'Medium' | 'Low';
  sourceText: string;
}

interface ParsedFields {
  [key: string]: ExtractedField;
}

// Date patterns to search for
const DATE_PATTERNS: Array<{ pattern: RegExp; format: string }> = [
  { pattern: /\b(\d{4})-(\d{2})-(\d{2})\b/, format: 'YYYY-MM-DD' },
  { pattern: /\b(\d{2})\/(\d{2})\/(\d{4})\b/, format: 'MM/DD/YYYY' },
  { pattern: /\b(\d{2})-(\d{2})-(\d{4})\b/, format: 'MM-DD-YYYY' },
  { pattern: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/i, format: 'Mon DD, YYYY' },
];

// Field extraction patterns
const FIELD_PATTERNS: Record<string, RegExp[]> = {
  originalCreditor: [
    /original\s*creditor[:\s]*([A-Za-z0-9\s&\-\.]+)/i,
    /sold\s*(?:to|by)[:\s]*([A-Za-z0-9\s&\-\.]+)/i,
  ],
  furnisherOrCollector: [
    /(?:collection|collector|agency|furnisher)[:\s]*([A-Za-z0-9\s&\-\.]+)/i,
    /reported\s*by[:\s]*([A-Za-z0-9\s&\-\.]+)/i,
    /creditor\s*name[:\s]*([A-Za-z0-9\s&\-\.]+)/i,
  ],
  accountType: [
    /account\s*type[:\s]*(collection|charge[\s\-]?off|open|closed|installment|revolving)/i,
    /type[:\s]*(collection|charge[\s\-]?off)/i,
  ],
  accountStatus: [
    /(?:account\s*)?status[:\s]*([A-Za-z\s]+?)(?:\.|,|$)/i,
    /(?:pay\s*)?status[:\s]*([A-Za-z0-9\s]+?)(?:\.|,|$)/i,
  ],
  currentBalance: [
    /(?:current\s*)?balance[:\s]*\$?([\d,]+\.?\d*)/i,
    /(?:amount\s*)?owed[:\s]*\$?([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.?\d*)\s*(?:balance|owed)/i,
  ],
  originalAmount: [
    /original\s*(?:amount|balance)[:\s]*\$?([\d,]+\.?\d*)/i,
    /(?:high\s*)?credit[:\s]*\$?([\d,]+\.?\d*)/i,
  ],
  dateOpened: [
    /(?:date\s*)?opened[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /open\s*date[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  dofd: [
    /(?:date\s*(?:of\s*)?)?(?:first\s*)?delinquen(?:cy|t)[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /dofd[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /fcra\s*date[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /first\s*reported[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  chargeOffDate: [
    /charge[\s\-]?off\s*(?:date)?[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /charged[\s\-]?off[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  dateLastPayment: [
    /(?:date\s*(?:of\s*)?)?last\s*(?:payment|paid)[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /last\s*payment\s*(?:date)?[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  dateLastActivity: [
    /(?:date\s*(?:of\s*)?)?last\s*activity[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /last\s*(?:reported|updated)[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  estimatedRemovalDate: [
    /(?:estimated\s*)?(?:removal|drop[\s\-]?off)\s*(?:date)?[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
    /falls?\s*off[:\s]*([A-Za-z0-9\/\-,\s]+)/i,
  ],
  paymentHistory: [
    /payment\s*history[:\s]*([A-Za-z0-9\s\-]+)/i,
    /history[:\s]*([XCOU0123456789\s\-]+)/i,
  ],
  bureau: [
    /(experian|equifax|transunion)/i,
  ],
};

/**
 * Normalize a date string to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;

  const cleaned = dateStr.trim();

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

  // Month name format
  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const monthMatch = cleaned.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s+(\d{4})/i);
  if (monthMatch) {
    const month = monthNames[monthMatch[1].toLowerCase().substring(0, 3)];
    const day = monthMatch[2].padStart(2, '0');
    return `${monthMatch[3]}-${month}-${day}`;
  }

  return null;
}

/**
 * Extract a date from surrounding text
 */
function extractDate(text: string): string | null {
  for (const { pattern } of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return normalizeDate(match[0]);
    }
  }
  return null;
}

/**
 * Main parsing function - extracts structured data from credit report text
 */
export function parseCreditReport(text: string): ParsedFields {
  const results: ParsedFields = {};
  const textLower = text.toLowerCase();

  for (const [fieldName, patterns] of Object.entries(FIELD_PATTERNS)) {
    let bestMatch: ExtractedField | null = null;

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let value = match[1].trim();
        let confidence: 'High' | 'Medium' | 'Low' = 'Medium';

        // For date fields, try to normalize
        if (fieldName.includes('date') || fieldName === 'dofd') {
          const normalized = normalizeDate(value) || extractDate(value);
          if (normalized) {
            value = normalized;
            confidence = 'High';
          } else {
            confidence = 'Low';
          }
        }

        // For monetary fields, clean up
        if (fieldName.includes('balance') || fieldName.includes('Amount')) {
          value = value.replace(/[^\d.,]/g, '');
          if (value) confidence = 'High';
        }

        // Bureau detection is usually high confidence
        if (fieldName === 'bureau') {
          confidence = 'High';
          value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        }

        if (!bestMatch || confidence === 'High') {
          bestMatch = {
            value,
            confidence,
            sourceText: match[0].substring(0, 60)
          };

          if (confidence === 'High') break;
        }
      }
    }

    if (bestMatch) {
      results[fieldName] = bestMatch;
    } else {
      results[fieldName] = { value: '', confidence: 'Low', sourceText: '' };
    }
  }

  return results;
}

/**
 * Convert parsed fields to simple key-value for rule engine
 */
export function fieldsToSimple(parsed: ParsedFields): CreditFields {
  const simple: CreditFields = {};

  for (const [key, field] of Object.entries(parsed)) {
    if (field.value) {
      (simple as any)[key] = field.value;
    }
  }

  return simple;
}

/**
 * Get extraction quality score
 */
export function getExtractionQuality(parsed: ParsedFields): { score: number; description: string } {
  const fields = Object.values(parsed);
  const total = fields.length;
  const highConf = fields.filter(f => f.confidence === 'High').length;
  const medConf = fields.filter(f => f.confidence === 'Medium').length;
  const hasValue = fields.filter(f => f.value).length;

  const score = Math.round((highConf * 100 + medConf * 60 + (hasValue - highConf - medConf) * 20) / total);

  let description = 'Poor extraction - please verify all fields';
  if (score >= 80) description = 'Excellent extraction quality';
  else if (score >= 60) description = 'Good extraction - verify highlighted fields';
  else if (score >= 40) description = 'Fair extraction - manual review recommended';

  return { score, description };
}

export { normalizeDate, extractDate };
