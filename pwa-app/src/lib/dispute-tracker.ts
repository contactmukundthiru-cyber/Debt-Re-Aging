/**
 * Dispute Tracker
 * Track dispute status, deadlines, and outcomes
 */

export interface Dispute {
  id: string;
  createdAt: string;
  updatedAt: string;

  // Account information
  account: {
    creditor: string;
    collector?: string;
    accountNumber?: string;
    value: string;
    accountType: string;
  };

  // Dispute details
  type: 'bureau' | 'furnisher' | 'validation' | 'cfpb' | 'legal';
  bureau?: 'experian' | 'equifax' | 'transunion';
  reason: string;
  violations: string[]; // Rule IDs

  // Status tracking
  status: DisputeStatus;
  statusHistory: StatusChange[];

  // Deadlines
  deadlines: {
    submissionDate: string;
    responseDeadline: string;
    escalationDeadline?: string;
  };

  // Communication
  communications: Communication[];

  // Documents
  documents: DisputeDocument[];

  // Outcome
  outcome?: DisputeOutcome;

  // Notes
  notes: string;
}

export type DisputeStatus =
  | 'draft'
  | 'submitted'
  | 'investigating'
  | 'response_received'
  | 'escalated'
  | 'resolved_favorable'
  | 'resolved_unfavorable'
  | 'closed';

export interface StatusChange {
  date: string;
  fromStatus: DisputeStatus;
  toStatus: DisputeStatus;
  notes?: string;
}

export interface Communication {
  id: string;
  date: string;
  type: 'sent' | 'received';
  method: 'mail' | 'email' | 'phone' | 'online';
  recipient?: string;
  sender?: string;
  subject: string;
  summary: string;
  trackingNumber?: string;
  documentId?: string;
}

export interface DisputeDocument {
  id: string;
  name: string;
  type: 'dispute_letter' | 'response' | 'evidence' | 'credit_report' | 'receipt' | 'other';
  dateAdded: string;
  notes?: string;
  content?: string;
  tags?: string[];
  source?: string;
}

export interface DisputeOutcome {
  result: 'deleted' | 'corrected' | 'verified' | 'no_response' | 'partial';
  date: string;
  details: string;
  scoreImpact?: number;
  followUpRequired: boolean;
  followUpActions?: string[];
}

const STORAGE_KEY = 'credit_disputes';

/**
 * Load all disputes from storage
 */
export function loadDisputes(): Dispute[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save disputes to storage
 */
function saveDisputes(disputes: Dispute[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(disputes));
}

/**
 * Create new dispute
 */
export function createDispute(
  account: Dispute['account'],
  type: Dispute['type'],
  reason: string,
  violations: string[],
  bureau?: Dispute['bureau']
): Dispute {
  const now = new Date().toISOString();
  const submissionDate = now.split('T')[0];

  // Calculate response deadline (30 days for bureaus, varies for others)
  const responseDate = new Date();
  responseDate.setDate(responseDate.getDate() + 30);

  const dispute: Dispute = {
    id: `DSP-${Date.now().toString(36).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    account,
    type,
    bureau,
    reason,
    violations,
    status: 'draft',
    statusHistory: [{
      date: now,
      fromStatus: 'draft',
      toStatus: 'draft',
      notes: 'Dispute created'
    }],
    deadlines: {
      submissionDate,
      responseDeadline: responseDate.toISOString().split('T')[0]
    },
    communications: [],
    documents: [],
    notes: ''
  };

  const disputes = loadDisputes();
  disputes.unshift(dispute);
  saveDisputes(disputes);

  return dispute;
}

/**
 * Update dispute status
 */
export function updateDisputeStatus(
  disputeId: string,
  newStatus: DisputeStatus,
  notes?: string
): Dispute | null {
  const disputes = loadDisputes();
  const index = disputes.findIndex(d => d.id === disputeId);

  if (index === -1) return null;

  const dispute = disputes[index];
  const now = new Date().toISOString();

  dispute.statusHistory.push({
    date: now,
    fromStatus: dispute.status,
    toStatus: newStatus,
    notes
  });

  dispute.status = newStatus;
  dispute.updatedAt = now;

  saveDisputes(disputes);
  return dispute;
}

/**
 * Add communication to dispute
 */
export function addCommunication(
  disputeId: string,
  communication: Omit<Communication, 'id'>
): Dispute | null {
  const disputes = loadDisputes();
  const index = disputes.findIndex(d => d.id === disputeId);

  if (index === -1) return null;

  const dispute = disputes[index];

  dispute.communications.push({
    ...communication,
    id: `COM-${Date.now().toString(36)}`
  });

  dispute.updatedAt = new Date().toISOString();
  saveDisputes(disputes);

  return dispute;
}

/**
 * Add document to dispute
 */
export function addDocument(
  disputeId: string,
  document: Omit<DisputeDocument, 'id' | 'dateAdded'>
): Dispute | null {
  const disputes = loadDisputes();
  const index = disputes.findIndex(d => d.id === disputeId);

  if (index === -1) return null;

  const dispute = disputes[index];

  dispute.documents.push({
    ...document,
    id: `DOC-${Date.now().toString(36)}`,
    dateAdded: new Date().toISOString()
  });

  dispute.updatedAt = new Date().toISOString();
  saveDisputes(disputes);

  return dispute;
}

/**
 * Update dispute notes
 */
export function updateDisputeNotes(
  disputeId: string,
  notes: string
): Dispute | null {
  const disputes = loadDisputes();
  const index = disputes.findIndex(d => d.id === disputeId);

  if (index === -1) return null;

  const dispute = disputes[index];
  dispute.notes = notes;
  dispute.updatedAt = new Date().toISOString();

  saveDisputes(disputes);
  return dispute;
}

/**
 * Update document tags
 */
export function updateDocumentTags(
  disputeId: string,
  documentId: string,
  tags: string[]
): Dispute | null {
  const disputes = loadDisputes();
  const index = disputes.findIndex(d => d.id === disputeId);

  if (index === -1) return null;

  const dispute = disputes[index];
  const doc = dispute.documents.find(item => item.id === documentId);

  if (!doc) return null;

  doc.tags = tags;
  dispute.updatedAt = new Date().toISOString();

  saveDisputes(disputes);
  return dispute;
}

/**
 * Set dispute outcome
 */
export function setDisputeOutcome(
  disputeId: string,
  outcome: Omit<DisputeOutcome, 'date'>
): Dispute | null {
  const disputes = loadDisputes();
  const index = disputes.findIndex(d => d.id === disputeId);

  if (index === -1) return null;

  const dispute = disputes[index];
  const now = new Date().toISOString();

  dispute.outcome = {
    ...outcome,
    date: now
  };

  // Update status based on outcome
  const newStatus: DisputeStatus =
    outcome.result === 'deleted' || outcome.result === 'corrected' ? 'resolved_favorable' :
    outcome.result === 'verified' ? 'resolved_unfavorable' :
    outcome.result === 'no_response' ? 'escalated' : 'closed';

  dispute.statusHistory.push({
    date: now,
    fromStatus: dispute.status,
    toStatus: newStatus,
    notes: `Outcome: ${outcome.result}`
  });

  dispute.status = newStatus;
  dispute.updatedAt = now;

  saveDisputes(disputes);
  return dispute;
}

/**
 * Get disputes needing attention
 */
export function getUrgentDisputes(): Dispute[] {
  const disputes = loadDisputes();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return disputes.filter(d => {
    // Active disputes only
    if (['resolved_favorable', 'resolved_unfavorable', 'closed'].includes(d.status)) {
      return false;
    }

    // Check response deadline
    const deadline = new Date(d.deadlines.responseDeadline);
    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return daysUntil <= 7; // Due within 7 days
  });
}

/**
 * Get dispute by ID
 */
export function getDispute(disputeId: string): Dispute | null {
  const disputes = loadDisputes();
  return disputes.find(d => d.id === disputeId) || null;
}

/**
 * Delete dispute
 */
export function deleteDispute(disputeId: string): boolean {
  const disputes = loadDisputes();
  const index = disputes.findIndex(d => d.id === disputeId);

  if (index === -1) return false;

  disputes.splice(index, 1);
  saveDisputes(disputes);

  return true;
}

/**
 * Get dispute statistics
 */
export function getDisputeStats(): {
  total: number;
  active: number;
  resolved: number;
  successRate: number;
  avgResolutionDays: number;
  byStatus: Record<DisputeStatus, number>;
  byType: Record<Dispute['type'], number>;
} {
  const disputes = loadDisputes();

  const byStatus: Record<DisputeStatus, number> = {
    draft: 0,
    submitted: 0,
    investigating: 0,
    response_received: 0,
    escalated: 0,
    resolved_favorable: 0,
    resolved_unfavorable: 0,
    closed: 0
  };

  const byType: Record<Dispute['type'], number> = {
    bureau: 0,
    furnisher: 0,
    validation: 0,
    cfpb: 0,
    legal: 0
  };

  let totalResolutionDays = 0;
  let resolvedCount = 0;

  disputes.forEach(d => {
    byStatus[d.status]++;
    byType[d.type]++;

    if (d.outcome) {
      resolvedCount++;
      const created = new Date(d.createdAt);
      const resolved = new Date(d.outcome.date);
      totalResolutionDays += Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    }
  });

  const resolved = byStatus.resolved_favorable + byStatus.resolved_unfavorable + byStatus.closed;
  const successRate = resolved > 0
    ? Math.round((byStatus.resolved_favorable / resolved) * 100)
    : 0;

  return {
    total: disputes.length,
    active: disputes.length - resolved,
    resolved,
    successRate,
    avgResolutionDays: resolvedCount > 0 ? Math.round(totalResolutionDays / resolvedCount) : 0,
    byStatus,
    byType
  };
}

/**
 * Get status display info
 */
export function getStatusInfo(status: DisputeStatus): {
  label: string;
  color: string;
  description: string;
} {
  const info: Record<DisputeStatus, { label: string; color: string; description: string }> = {
    draft: {
      label: 'Draft',
      color: 'gray',
      description: 'Dispute letter not yet sent'
    },
    submitted: {
      label: 'Submitted',
      color: 'blue',
      description: 'Dispute sent, awaiting response'
    },
    investigating: {
      label: 'Investigating',
      color: 'yellow',
      description: 'Bureau/furnisher investigating claim'
    },
    response_received: {
      label: 'Response Received',
      color: 'purple',
      description: 'Response received, needs review'
    },
    escalated: {
      label: 'Escalated',
      color: 'orange',
      description: 'Escalated to CFPB or legal action'
    },
    resolved_favorable: {
      label: 'Resolved (Favorable)',
      color: 'green',
      description: 'Dispute resolved in your favor'
    },
    resolved_unfavorable: {
      label: 'Resolved (Unfavorable)',
      color: 'red',
      description: 'Dispute not resolved favorably'
    },
    closed: {
      label: 'Closed',
      color: 'gray',
      description: 'Dispute closed'
    }
  };

  return info[status];
}

/**
 * Calculate days until deadline
 */
export function getDaysUntilDeadline(dispute: Dispute): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dispute.deadlines.responseDeadline);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format dispute timeline
 */
export function formatDisputeTimeline(dispute: Dispute): string {
  const lines: string[] = [];

  lines.push('DISPUTE TIMELINE');
  lines.push('─'.repeat(40));

  // Status changes
  dispute.statusHistory.forEach(change => {
    const date = new Date(change.date).toLocaleDateString();
    lines.push(`${date} - ${change.toStatus.replace('_', ' ').toUpperCase()}`);
    if (change.notes) lines.push(`    ${change.notes}`);
  });

  // Communications
  if (dispute.communications.length > 0) {
    lines.push('');
    lines.push('COMMUNICATIONS:');
    dispute.communications.forEach(comm => {
      const date = new Date(comm.date).toLocaleDateString();
      const direction = comm.type === 'sent' ? '→' : '←';
      lines.push(`${date} ${direction} ${comm.subject}`);
      if (comm.trackingNumber) lines.push(`    Tracking: ${comm.trackingNumber}`);
    });
  }

  // Outcome
  if (dispute.outcome) {
    lines.push('');
    lines.push('OUTCOME:');
    lines.push(`Result: ${dispute.outcome.result.toUpperCase()}`);
    lines.push(`Date: ${new Date(dispute.outcome.date).toLocaleDateString()}`);
    lines.push(`Details: ${dispute.outcome.details}`);
    if (dispute.outcome.scoreImpact) {
      lines.push(`Score Impact: ${dispute.outcome.scoreImpact > 0 ? '+' : ''}${dispute.outcome.scoreImpact} points`);
    }
  }

  return lines.join('\n');
}

/**
 * Export disputes as CSV
 */
export function exportDisputesCSV(): string {
  const disputes = loadDisputes();

  const headers = [
    'ID', 'Created', 'Status', 'Type', 'Bureau', 'Creditor', 'Balance',
    'Reason', 'Response Deadline', 'Outcome', 'Resolution Date'
  ];

  const rows = disputes.map(d => [
    d.id,
    new Date(d.createdAt).toLocaleDateString(),
    d.status,
    d.type,
    d.bureau || 'N/A',
    d.account.creditor,
    d.account.value,
    d.reason.substring(0, 50),
    d.deadlines.responseDeadline,
    d.outcome?.result || 'Pending',
    d.outcome ? new Date(d.outcome.date).toLocaleDateString() : 'N/A'
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

/**
 * Generate dispute report
 */
export function generateDisputeReport(): string {
  const stats = getDisputeStats();
  const urgent = getUrgentDisputes();
  const disputes = loadDisputes();

  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('          DISPUTE MANAGEMENT REPORT');
  lines.push('═'.repeat(60));
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');

  lines.push('SUMMARY:');
  lines.push(`  Total Disputes: ${stats.total}`);
  lines.push(`  Active: ${stats.active}`);
  lines.push(`  Resolved: ${stats.resolved}`);
  lines.push(`  Success Rate: ${stats.successRate}%`);
  lines.push(`  Avg Resolution: ${stats.avgResolutionDays} days`);
  lines.push('');

  lines.push('BY STATUS:');
  Object.entries(stats.byStatus).forEach(([status, count]) => {
    if (count > 0) {
      lines.push(`  ${status.replace('_', ' ')}: ${count}`);
    }
  });
  lines.push('');

  if (urgent.length > 0) {
    lines.push('⚠️ URGENT (Deadline within 7 days):');
    urgent.forEach(d => {
      const days = getDaysUntilDeadline(d);
      lines.push(`  - ${d.account.creditor}: ${days} days remaining`);
    });
    lines.push('');
  }

  lines.push('ACTIVE DISPUTES:');
  disputes
    .filter(d => !['resolved_favorable', 'resolved_unfavorable', 'closed'].includes(d.status))
    .forEach(d => {
      const days = getDaysUntilDeadline(d);
      lines.push('');
      lines.push(`  ${d.id} - ${d.account.creditor}`);
      lines.push(`    Status: ${d.status}`);
      lines.push(`    Type: ${d.type}${d.bureau ? ` (${d.bureau})` : ''}`);
      lines.push(`    Deadline: ${d.deadlines.responseDeadline} (${days} days)`);
    });

  return lines.join('\n');
}
