import Dexie, { Table } from 'dexie';
import { AnalysisRecord } from './types';

export class ForensicDatabase extends Dexie {
  history!: Table<AnalysisRecord>;

  constructor() {
    super('ForensicAnalyzerDB');
    this.version(1).stores({
      history: 'id, timestamp, fileName'
    });
  }
}

export const db = new ForensicDatabase();

/**
 * Save an analysis to IndexedDB
 */
export async function saveAnalysisToDB(record: AnalysisRecord): Promise<string> {
  await db.history.put(record);
  return record.id;
}

/**
 * Get all history from IndexedDB
 */
export async function getHistoryFromDB(): Promise<AnalysisRecord[]> {
  return await db.history.orderBy('timestamp').reverse().toArray();
}

/**
 * Delete an analysis from IndexedDB
 */
export async function deleteAnalysisFromDB(id: string): Promise<void> {
  await db.history.delete(id);
}

/**
 * Clear all history from IndexedDB
 */
export async function clearHistoryFromDB(): Promise<void> {
  await db.history.clear();
}
