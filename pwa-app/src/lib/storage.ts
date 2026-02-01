import { CreditFields, RuleFlag, RiskProfile, AnalysisRecord } from './types';
import { saveAnalysisToDB, getHistoryFromDB, deleteAnalysisFromDB, clearHistoryFromDB } from './dexie-storage';

export type { AnalysisRecord } from './types';

const STORAGE_KEY = 'credit_analyzer_history';
const MAX_HISTORY = 20;

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return 'audit_' + Math.random().toString(36).substring(2, 11);
}

/**
 * Save an analysis to both localStorage (for quick access) and IndexedDB (for long term)
 */
export async function saveAnalysis(
  fields: CreditFields,
  flags: RuleFlag[],
  riskProfile: RiskProfile,
  fileName?: string,
  tags?: string[]
): Promise<string> {
  const record: AnalysisRecord = {
    id: generateId(),
    timestamp: Date.now(),
    fileName,
    fields,
    flags,
    riskProfile,
    tags,
  };

  // 1. IndexedDB (Primary)
  await saveAnalysisToDB(record);

  // 2. LocalStorage (Legacy / Fallback / Fast Cache)
  const history = getHistory();
  history.unshift(record);
  if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('LocalStorage quota exceeded, using IndexedDB only');
  }

  return record.id;
}

/**
 * Get all saved analyses (Legacy sync version)
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
 * Get all saved analyses (Async version - uses IndexedDB)
 */
export async function getAllHistory(): Promise<AnalysisRecord[]> {
  const dbHistory = await getHistoryFromDB();
  if (dbHistory.length > 0) return dbHistory;
  
  // Fallback to localStorage if DB is empty
  return getHistory();
}

/**
 * Get a specific analysis by ID
 */
export async function getAnalysis(id: string): Promise<AnalysisRecord | null> {
  const history = await getAllHistory();
  return history.find(r => r.id === id) || null;
}

/**
 * Delete an analysis
 */
export async function deleteAnalysis(id: string): Promise<boolean> {
  // 1. IndexedDB
  await deleteAnalysisFromDB(id);

  // 2. LocalStorage
  const history = getHistory();
  const index = history.findIndex(r => r.id === id);

  if (index !== -1) {
    history.splice(index, 1);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {}
  }

  return true;
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  await clearHistoryFromDB();
  localStorage.removeItem(STORAGE_KEY);
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
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
