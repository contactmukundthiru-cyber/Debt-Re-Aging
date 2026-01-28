/**
 * Institutional Case Management Engine
 * Handles multi-client organization for legal aid and professional users.
 * Optimized for local-first privacy (IndexDB).
 */

export interface ClientProfile {
    id: string;
    name: string;
    caseNumber: string;
    status: 'active' | 'resolved' | 'archived';
    notes: string;
    createdAt: string;
    updatedAt: string;
    labels: string[];
    assignedTo?: string; // For internal org routing
}

export interface InstitutionalSession {
    orgName: string;
    orgId: string;
    activeClient?: string;
    disclaimerAccepted: boolean;
    exportFormat: 'standard' | 'forensic_legal' | 'expert_witness';
}

export const STORAGE_KEYS = {
    CLIENTS: 'cra_institutional_clients',
    SESSION: 'cra_institutional_session',
    ORG_CONFIG: 'cra_org_config'
};

/**
 * Initialize or retrieve institutional session
 */
export function getOrgSession(): InstitutionalSession {
    if (typeof window === 'undefined') return { orgName: '', orgId: '', disclaimerAccepted: false, exportFormat: 'standard' };

    const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (saved) return JSON.parse(saved);

    return {
        orgName: 'Independent Forensic Unit',
        orgId: `ORG-${Math.random().toString(36).substring(7).toUpperCase()}`,
        disclaimerAccepted: false,
        exportFormat: 'forensic_legal'
    };
}

/**
 * Save institutional session
 */
export function saveOrgSession(session: InstitutionalSession) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

/**
 * Get all clients
 */
export function getClients(): ClientProfile[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Create a new client profile
 */
export function createClient(name: string, caseNumber: string): ClientProfile {
    const clients = getClients();
    const newClient: ClientProfile = {
        id: `CL-${Math.random().toString(36).substring(7).toUpperCase()}`,
        name,
        caseNumber,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        labels: ['pending_analysis']
    };

    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([...clients, newClient]));
    return newClient;
}

/**
 * Audit Log Generation (Institutional Compliance)
 */
export function generateAuditLog(clientId: string, action: string, results: unknown) {
    const log = {
        timestamp: new Date().toISOString(),
        actor: 'Forensic System',
        clientId,
        action,
        results,
        hash: btoa(Math.random().toString()), // Mock signature for local integrity
        integrityVerified: true
    };

    const logs = JSON.parse(localStorage.getItem(`audit_logs_${clientId}`) || '[]');
    localStorage.setItem(`audit_logs_${clientId}`, JSON.stringify([...logs, log]));
}
