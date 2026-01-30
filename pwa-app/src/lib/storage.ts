import { CreditFields, RuleFlag, RiskProfile, AnalysisRecord } from './types';

export type { AnalysisRecord } from './types';

const STORAGE_KEY = 'credit_analyzer_history';
const MAX_HISTORY = 20;

/**
 * Save an analysis to localStorage
 */
export function saveAnalysis(
  fields: CreditFields,
  flags: RuleFlag[],
  riskProfile: RiskProfile,
  fileName?: string,
  tags?: string[]
): string {
  const history = getHistory();

  const record: AnalysisRecord = {
    id: generateId(),
    timestamp: Date.now(),
    fileName,
    fields,
    flags,
    riskProfile,
    tags,
  };

  // Add to beginning of history
  history.unshift(record);

  // Trim to max size
  if (history.length > MAX_HISTORY) {
    history.splice(MAX_HISTORY);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }

  return record.id;
}

/**
 * Get all saved analyses
 */
export function getHistory(): AnalysisRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Failed to read from localStorage:', e);
    return [];
  }
}

/**
 * Get a specific analysis by ID
 */
export function getAnalysis(id: string): AnalysisRecord | null {
  const history = getHistory();
  return history.find(r => r.id === id) || null;
}

/**
 * Delete an analysis
 */
export function deleteAnalysis(id: string): boolean {
  const history = getHistory();
  const index = history.findIndex(r => r.id === id);

  if (index === -1) return false;

  history.splice(index, 1);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return true;
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
    return false;
  }
}

/**
 * Clear all history
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
}

/**
 * Export all history as JSON
 */
export function exportHistory(): string {
  const history = getHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * Import history from JSON
 */
export function importHistory(json: string): number {
  try {
    const imported = JSON.parse(json) as AnalysisRecord[];
    const history = getHistory();

    // Merge, avoiding duplicates
    const existingIds = new Set(history.map(r => r.id));
    let added = 0;

    for (const record of imported) {
      if (!existingIds.has(record.id)) {
        history.push(record);
        added++;
      }
    }

    // Sort by timestamp descending
    history.sort((a, b) => b.timestamp - a.timestamp);

    // Trim to max
    if (history.length > MAX_HISTORY) {
      history.splice(MAX_HISTORY);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return added;
  } catch (e) {
    console.warn('Failed to import history:', e);
    return 0;
  }
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  // Within last hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return mins <= 1 ? 'Just now' : `${mins} minutes ago`;
  }

  // Within last 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  // Within last week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }

  // Otherwise show date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
