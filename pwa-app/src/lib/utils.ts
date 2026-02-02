import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskPII(text: string | undefined): string {
  if (!text) return '';
  
  // If it's a small string (like a state code or status), don't mask
  if (text.length <= 4 && !/^\d+$/.test(text)) return text;
  
  // If it looks like a full date (YYYY-MM-DD or MM/DD/YYYY)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(text)) {
    return '****-**-**';
  }

  // If it looks like a currency amount
  if (/^\$?\d+(,\d{3})*(\.\d{2})?$/.test(text)) {
    return '$*,***.**';
  }

  // If it looks like an account number (digits, dashes, stars)
  if (/^[0-9\-\*]{5,}$/.test(text)) {
    return `****${text.slice(-4)}`;
  }

  // If it's a name or general string, mask each word
  const parts = text.split(' ');
  return parts.map(p => {
    if (p.length <= 1) return p;
    return p[0] + '*'.repeat(p.length - 1);
  }).join(' ');
}

/**
 * Generate a deterministic case fingerprint/hash for forensic verification.
 */
export function generateForensicHash(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase();
  return `ZEN-V5-${hex.padStart(8, '0')}`;
}

/**
 * Advanced PII masking for full sentences/explanations
 * Uses regex to find and mask sensitive patterns within text
 */
export function maskSensitiveInText(text: string, isActive: boolean): string {
  if (!isActive) return text;
  
  let masked = text;
  
  // Mask dates like 2023-01-01 or 01/01/2023
  masked = masked.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '****-**-**');
  masked = masked.replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, '**/**/****');
  
  // Mask currency like $1,234.56
  masked = masked.replace(/\$\d{1,3}(,\d{3})*(\.\d{2})?/g, '$*,***.**');
  
  // Mask potential account numbers (sequences of 8+ digits or stars)
  masked = masked.replace(/\b[0-9\*]{8,}\b/g, (match) => '****' + match.slice(-4));

  return masked;
}
