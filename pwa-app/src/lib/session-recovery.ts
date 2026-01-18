/**
 * Session Recovery Module
 * Provides automatic session recovery for the Credit Report Analyzer
 * Saves work-in-progress and recovers from unexpected browser closures
 */

const SESSION_KEY = 'credit_analyzer_session';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const AUTO_SAVE_INTERVAL_MS = 30 * 1000; // 30 seconds

export interface SessionData {
    timestamp: number;
    step: number;
    rawText: string;
    editableFields: any;
    consumerInfo: any;
    discoveryAnswers: Record<string, string>;
    version: string;
}


const VERSION = '4.4.0';

/**
 * Save current session state to localStorage
 */
export function saveSession(data: Omit<SessionData, 'timestamp' | 'version'>): void {
    try {
        const session: SessionData = {
            ...data,
            timestamp: Date.now(),
            version: VERSION,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
        console.warn('Failed to save session:', error);
    }
}

/**
 * Load session from localStorage if available and not expired
 */
export function loadSession(): SessionData | null {
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (!stored) return null;

        const session: SessionData = JSON.parse(stored);

        // Check if session is expired
        if (Date.now() - session.timestamp > SESSION_EXPIRY_MS) {
            clearSession();
            return null;
        }

        // Check version compatibility
        if (session.version !== VERSION) {
            // Could add migration logic here
            return null;
        }

        return session;
    } catch (error) {
        console.warn('Failed to load session:', error);
        return null;
    }
}

/**
 * Clear saved session
 */
export function clearSession(): void {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.warn('Failed to clear session:', error);
    }
}

/**
 * Check if there's a recoverable session
 */
export function hasRecoverableSession(): boolean {
    return loadSession() !== null;
}

/**
 * Format session timestamp for display
 */
export function formatSessionTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    if (isToday) {
        return `Today at ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });

    return `${dateStr} at ${timeStr}`;
}

/**
 * Hook for auto-saving session at regular intervals
 */
export function createAutoSaver(
    getData: () => Omit<SessionData, 'timestamp' | 'version'>
): { start: () => void; stop: () => void } {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = () => {
        // Save immediately
        saveSession(getData());

        // Then save at regular intervals
        intervalId = setInterval(() => {
            saveSession(getData());
        }, AUTO_SAVE_INTERVAL_MS);
    };

    const stop = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    return { start, stop };
}

/**
 * Get session summary for display
 */
export function getSessionSummary(session: SessionData): {
    creditor: string;
    step: string;
    time: string;
    hasData: boolean;
} {
    const stepNames: Record<number, string> = {
        1: 'Upload',
        2: 'Review',
        3: 'Verify',
        4: 'Analysis',
        5: 'Export',
        6: 'Track',
    };

    return {
        creditor: session.editableFields.furnisherOrCollector ||
            session.editableFields.originalCreditor ||
            'Unknown Account',
        step: stepNames[session.step] || `Step ${session.step}`,
        time: formatSessionTime(session.timestamp),
        hasData: !!session.rawText || Object.keys(session.editableFields).length > 0,
    };
}
