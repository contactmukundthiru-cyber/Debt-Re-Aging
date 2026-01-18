/**
 * Evidence Chain of Custody Module
 * Provides cryptographic integrity verification and audit trails
 * for court-admissible documentation
 */

export interface EvidenceItem {
    id: string;
    type: 'document' | 'screenshot' | 'letter' | 'response' | 'recording' | 'other';
    filename: string;
    description: string;
    uploadedAt: string;
    hash: string;
    size: number;
    mimeType: string;
    metadata: EvidenceMetadata;
    chainOfCustody: CustodyEvent[];
}

export interface EvidenceMetadata {
    source: string;
    dateObtained: string;
    obtainedBy: string;
    relevantTo: string[];
    notes: string;
    isOriginal: boolean;
    authenticatedBy?: string;
}

export interface CustodyEvent {
    timestamp: string;
    action: 'created' | 'viewed' | 'exported' | 'modified' | 'shared' | 'verified';
    actor: string;
    details: string;
    previousHash?: string;
    newHash?: string;
}

export interface EvidencePackage {
    id: string;
    name: string;
    createdAt: string;
    items: EvidenceItem[];
    summary: string;
    totalSize: number;
    integrityHash: string;
    exportFormat: 'pdf' | 'zip' | 'json';
}

export interface IntegrityReport {
    isValid: boolean;
    checkedAt: string;
    itemsChecked: number;
    itemsPassed: number;
    itemsFailed: number;
    failedItems: string[];
    overallHash: string;
    certificateReady: boolean;
}

/**
 * Calculate SHA-256 hash of file content
 */
export async function calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate hash of string content
 */
export async function calculateStringHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a unique evidence ID
 */
export function generateEvidenceId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `EV-${timestamp}-${random}`.toUpperCase();
}

/**
 * Create a new evidence item from a file
 */
export async function createEvidenceItem(
    file: File,
    metadata: Partial<EvidenceMetadata>
): Promise<EvidenceItem> {
    const hash = await calculateFileHash(file);
    const id = generateEvidenceId();
    const now = new Date().toISOString();

    return {
        id,
        type: getEvidenceType(file.type),
        filename: file.name,
        description: metadata.notes || file.name,
        uploadedAt: now,
        hash,
        size: file.size,
        mimeType: file.type,
        metadata: {
            source: metadata.source || 'User Upload',
            dateObtained: metadata.dateObtained || now,
            obtainedBy: metadata.obtainedBy || 'Consumer',
            relevantTo: metadata.relevantTo || [],
            notes: metadata.notes || '',
            isOriginal: metadata.isOriginal ?? true,
            authenticatedBy: metadata.authenticatedBy
        },
        chainOfCustody: [
            {
                timestamp: now,
                action: 'created',
                actor: 'System',
                details: `Evidence item created. Original hash: ${hash.substring(0, 16)}...`
            }
        ]
    };
}

function getEvidenceType(mimeType: string): EvidenceItem['type'] {
    if (mimeType.startsWith('image/')) return 'screenshot';
    if (mimeType === 'application/pdf') return 'document';
    if (mimeType.startsWith('audio/')) return 'recording';
    return 'other';
}

/**
 * Add a custody event to an evidence item
 */
export function addCustodyEvent(
    item: EvidenceItem,
    action: CustodyEvent['action'],
    actor: string,
    details: string
): EvidenceItem {
    const event: CustodyEvent = {
        timestamp: new Date().toISOString(),
        action,
        actor,
        details,
        previousHash: item.hash
    };

    return {
        ...item,
        chainOfCustody: [...item.chainOfCustody, event]
    };
}

/**
 * Verify the integrity of an evidence item against its stored hash
 */
export async function verifyEvidenceIntegrity(
    item: EvidenceItem,
    currentFile: File
): Promise<{ isValid: boolean; currentHash: string; expectedHash: string }> {
    const currentHash = await calculateFileHash(currentFile);
    return {
        isValid: currentHash === item.hash,
        currentHash,
        expectedHash: item.hash
    };
}

/**
 * Create an evidence package from multiple items
 */
export async function createEvidencePackage(
    name: string,
    items: EvidenceItem[],
    summary: string
): Promise<EvidencePackage> {
    const id = `PKG-${Date.now().toString(36).toUpperCase()}`;
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);

    // Create integrity hash from all item hashes
    const combinedHashes = items.map(i => i.hash).join('');
    const integrityHash = await calculateStringHash(combinedHashes);

    return {
        id,
        name,
        createdAt: new Date().toISOString(),
        items,
        summary,
        totalSize,
        integrityHash,
        exportFormat: 'zip'
    };
}

/**
 * Generate an integrity report for a package
 */
export function generateIntegrityReport(
    pkg: EvidencePackage,
    verificationResults: Map<string, boolean>
): IntegrityReport {
    const itemsPassed = Array.from(verificationResults.values()).filter(v => v).length;
    const itemsFailed = pkg.items.length - itemsPassed;
    const failedItems = pkg.items
        .filter(item => verificationResults.get(item.id) === false)
        .map(item => item.filename);

    return {
        isValid: itemsFailed === 0,
        checkedAt: new Date().toISOString(),
        itemsChecked: pkg.items.length,
        itemsPassed,
        itemsFailed,
        failedItems,
        overallHash: pkg.integrityHash,
        certificateReady: itemsFailed === 0
    };
}

/**
 * Generate a custody certificate for court submission
 */
export function generateCustodyCertificate(
    item: EvidenceItem,
    integrityValid: boolean
): string {
    const cert = `
═══════════════════════════════════════════════════════════════════════════════
                        CHAIN OF CUSTODY CERTIFICATE
═══════════════════════════════════════════════════════════════════════════════

EVIDENCE IDENTIFICATION
─────────────────────────────────────────────────────────────────────────────────
Evidence ID:        ${item.id}
Filename:           ${item.filename}
Type:               ${item.type.toUpperCase()}
File Size:          ${formatFileSize(item.size)}
MIME Type:          ${item.mimeType}

CRYPTOGRAPHIC VERIFICATION
─────────────────────────────────────────────────────────────────────────────────
SHA-256 Hash:       ${item.hash}
Integrity Status:   ${integrityValid ? '✓ VERIFIED - No modifications detected' : '✗ FAILED - File has been modified'}
Verification Date:  ${new Date().toISOString()}

METADATA
─────────────────────────────────────────────────────────────────────────────────
Source:             ${item.metadata.source}
Date Obtained:      ${item.metadata.dateObtained}
Obtained By:        ${item.metadata.obtainedBy}
Original Document:  ${item.metadata.isOriginal ? 'Yes' : 'No'}
${item.metadata.authenticatedBy ? `Authenticated By:   ${item.metadata.authenticatedBy}` : ''}

CHAIN OF CUSTODY LOG
─────────────────────────────────────────────────────────────────────────────────
${item.chainOfCustody.map((event, i) =>
        `${i + 1}. [${event.timestamp}] ${event.action.toUpperCase()}\n   Actor: ${event.actor}\n   Details: ${event.details}`
    ).join('\n\n')}

═══════════════════════════════════════════════════════════════════════════════
This certificate was automatically generated by Credit Report Analyzer.
The SHA-256 cryptographic hash provides tamper-evident verification of document
integrity since the time of initial capture.
═══════════════════════════════════════════════════════════════════════════════
`;

    return cert.trim();
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generate a timeline visualization of custody events
 */
export function generateCustodyTimeline(item: EvidenceItem): string {
    let timeline = `CUSTODY TIMELINE FOR: ${item.filename}\n`;
    timeline += `${'─'.repeat(60)}\n\n`;

    item.chainOfCustody.forEach((event, i) => {
        const date = new Date(event.timestamp);
        const icon = {
            created: '📥',
            viewed: '👁️',
            exported: '📤',
            modified: '✏️',
            shared: '🔗',
            verified: '✓'
        }[event.action] || '•';

        timeline += `${icon} ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
        timeline += `   ${event.action.toUpperCase()} by ${event.actor}\n`;
        timeline += `   ${event.details}\n`;
        if (i < item.chainOfCustody.length - 1) {
            timeline += `   │\n`;
        }
    });

    return timeline;
}

/**
 * Export evidence package as structured JSON
 */
export function exportPackageAsJSON(pkg: EvidencePackage): string {
    return JSON.stringify({
        ...pkg,
        exportedAt: new Date().toISOString(),
        format: 'Credit Report Analyzer Evidence Package v1.0'
    }, null, 2);
}

/**
 * Validate package integrity
 */
export async function validatePackageIntegrity(pkg: EvidencePackage): Promise<boolean> {
    const combinedHashes = pkg.items.map(i => i.hash).join('');
    const calculatedHash = await calculateStringHash(combinedHashes);
    return calculatedHash === pkg.integrityHash;
}
