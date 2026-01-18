/**
 * Dispute Workflow Automation Engine
 * Tracks disputes, deadlines, and automates follow-up reminders
 */

export interface WorkflowStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    deadline?: string;
    completedAt?: string;
    statutoryReference?: string;
}

export interface DisputeWorkflow {
    id: string;
    caseId: string;
    name: string;
    type: 'bureau' | 'furnisher' | 'collector' | 'cfpb';
    status: DisputeWorkflowStatus;
    currentPhase: string;
    createdAt: string;
    updatedAt: string;
    targetEntity: TargetEntity;
    violation: ViolationReference;
    steps: WorkflowStep[];
    timeline: WorkflowEvent[];
    deadlines: Deadline[];
    documents: DocumentReference[];
    communications: Communication[];
    outcome?: DisputeOutcome;
}

export type DisputeWorkflowStatus =
    | 'draft'
    | 'ready_to_send'
    | 'sent'
    | 'acknowledged'
    | 'investigating'
    | 'responded'
    | 'escalated'
    | 'resolved'
    | 'closed';

export interface TargetEntity {
    name: string;
    type: 'equifax' | 'experian' | 'transunion' | 'furnisher' | 'collector' | 'cfpb';
    address?: string;
    email?: string;
    phone?: string;
    fax?: string;
    onlinePortal?: string;
}

export interface ViolationReference {
    ruleId: string;
    ruleName: string;
    severity: 'high' | 'medium' | 'low';
    explanation: string;
}

export interface WorkflowEvent {
    id: string;
    timestamp: string;
    type: 'status_change' | 'document_added' | 'communication' | 'deadline_set' | 'reminder' | 'note';
    description: string;
    actor: 'user' | 'system' | 'entity';
    data?: Record<string, unknown>;
}

export interface Deadline {
    id: string;
    type: '30_day_response' | '45_day_extended' | 'furnisher_5_day' | 'validation_30_day' | 'custom';
    name: string;
    dueDate: string;
    status: 'pending' | 'approaching' | 'overdue' | 'met' | 'extended';
    remindersSent: number;
    nextReminderDate?: string;
}

export interface DocumentReference {
    id: string;
    type: 'dispute_letter' | 'evidence' | 'response' | 'tracking' | 'other';
    name: string;
    addedAt: string;
    hash?: string;
}

export interface Communication {
    id: string;
    timestamp: string;
    direction: 'outbound' | 'inbound';
    method: 'mail' | 'certified_mail' | 'email' | 'phone' | 'fax' | 'online_portal';
    subject: string;
    summary: string;
    trackingNumber?: string;
    deliveryConfirmed?: boolean;
    deliveryDate?: string;
}

export interface DisputeOutcome {
    resolution: 'deleted' | 'corrected' | 'verified' | 'no_response' | 'partial';
    resolvedAt: string;
    details: string;
    scoreImpact?: number;
    followUpRequired: boolean;
    nextSteps?: string[];
}

// Bureau contact information
const BUREAU_CONTACTS: Record<string, TargetEntity> = {
    equifax: {
        name: 'Equifax Information Services LLC',
        type: 'equifax',
        address: 'P.O. Box 740256, Atlanta, GA 30374-0256',
        phone: '1-800-685-1111',
        onlinePortal: 'https://www.equifax.com/personal/disputes/'
    },
    experian: {
        name: 'Experian',
        type: 'experian',
        address: 'P.O. Box 4500, Allen, TX 75013',
        phone: '1-888-397-3742',
        onlinePortal: 'https://www.experian.com/disputes/main.html'
    },
    transunion: {
        name: 'TransUnion Consumer Solutions',
        type: 'transunion',
        address: 'P.O. Box 2000, Chester, PA 19016-2000',
        phone: '1-800-916-8800',
        onlinePortal: 'https://www.transunion.com/credit-disputes/dispute-your-credit'
    }
};

/**
 * Generate a unique workflow ID
 */
function generateWorkflowId(): string {
    return `WF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

/**
 * Create a new dispute workflow
 */
export function createDisputeWorkflow(
    caseId: string,
    type: DisputeWorkflow['type'],
    targetEntity: TargetEntity,
    violation: ViolationReference
): DisputeWorkflow {
    const id = generateWorkflowId();
    const now = new Date().toISOString();

    const steps: WorkflowStep[] = [
        {
            id: 'step-1',
            title: 'Initial Investigation',
            description: 'Determine the specific violation and legal basis.',
            status: 'completed',
            completedAt: now,
            statutoryReference: 'FCRA § 623(a)'
        },
        {
            id: 'step-2',
            title: 'Evidence Gathering',
            description: 'Collect all supporting documentation for the claim.',
            status: 'in_progress',
            statutoryReference: 'FCRA § 611(a)'
        },
        {
            id: 'step-3',
            title: 'Draft Dispute Letter',
            description: 'Prepare the professional dispute letter for the bureau.',
            status: 'pending'
        },
        {
            id: 'step-4',
            title: 'Send Certified Mail',
            description: 'Transmit the dispute and track the delivery.',
            status: 'pending'
        },
        {
            id: 'step-5',
            title: 'Monitor 30-Day Clock',
            description: 'Wait for the statutory response period to conclude.',
            status: 'pending',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    return {
        id,
        caseId,
        name: `${type.toUpperCase()} Dispute - ${violation.ruleName}`,
        type,
        status: 'draft',
        currentPhase: 'investigation',
        createdAt: now,
        updatedAt: now,
        targetEntity,
        violation,
        steps,
        timeline: [
            {
                id: `EVT-${Date.now()}`,
                timestamp: now,
                type: 'status_change',
                description: 'Dispute workflow created',
                actor: 'system'
            }
        ],
        deadlines: [],
        documents: [],
        communications: []
    };
}

/**
 * Persist workflow to local storage
 */
export function saveWorkflow(workflow: DisputeWorkflow) {
    if (typeof window === 'undefined') return;
    const key = `dispute_workflow_${workflow.caseId}`;
    localStorage.setItem(key, JSON.stringify(workflow));
}

/**
 * Load workflow from local storage
 */
export function getWorkflowStatus(caseId: string): DisputeWorkflow | null {
    if (typeof window === 'undefined') return null;
    const key = `dispute_workflow_${caseId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
}

/**
 * Initialize a default workflow for a case
 */
export function initializeDisputeWorkflow(caseId: string, bureau: 'equifax' | 'experian' | 'transunion', violationsText: string[]): DisputeWorkflow {
    const contact = BUREAU_CONTACTS[bureau];
    const violation: ViolationReference = {
        ruleId: 'MULTI',
        ruleName: 'Multiple Discrepancies',
        severity: 'high',
        explanation: violationsText.join('; ')
    };

    const workflow = createDisputeWorkflow(caseId, 'bureau', contact, violation);
    saveWorkflow(workflow);
    return workflow;
}

/**
 * Update a specific step in the workflow
 */
export function updateWorkflowStep(caseId: string, stepId: string, status: WorkflowStep['status']): DisputeWorkflow | null {
    const workflow = getWorkflowStatus(caseId);
    if (!workflow) return null;

    const updatedSteps = workflow.steps.map(step => {
        if (step.id === stepId) {
            return {
                ...step,
                status,
                completedAt: status === 'completed' ? new Date().toISOString() : step.completedAt
            };
        }
        return step;
    });

    const updatedWorkflow = {
        ...workflow,
        steps: updatedSteps,
        updatedAt: new Date().toISOString()
    };

    saveWorkflow(updatedWorkflow);
    return updatedWorkflow;
}

/**
 * Update workflow status
 */
export function updateWorkflowStatus(
    workflow: DisputeWorkflow,
    newStatus: DisputeWorkflowStatus,
    notes?: string
): DisputeWorkflow {
    const now = new Date().toISOString();
    const event: WorkflowEvent = {
        id: `EVT-${Date.now()}`,
        timestamp: now,
        type: 'status_change',
        description: `Status changed from ${workflow.status} to ${newStatus}${notes ? `: ${notes}` : ''}`,
        actor: 'user'
    };

    return {
        ...workflow,
        status: newStatus,
        updatedAt: now,
        timeline: [...workflow.timeline, event]
    };
}

/**
 * Add a deadline to the workflow
 */
export function addDeadline(
    workflow: DisputeWorkflow,
    type: Deadline['type'],
    customName?: string,
    customDays?: number
): DisputeWorkflow {
    const now = new Date();
    let days = 30;
    let name = 'Response Deadline';

    switch (type) {
        case '30_day_response':
            days = 30;
            name = 'Bureau 30-Day Response';
            break;
        case '45_day_extended':
            days = 45;
            name = 'Extended Investigation Period';
            break;
        case 'furnisher_5_day':
            days = 5;
            name = 'Furnisher 5-Day Notification';
            break;
        case 'validation_30_day':
            days = 30;
            name = 'Debt Validation Period';
            break;
        case 'custom':
            days = customDays || 30;
            name = customName || 'Custom Deadline';
            break;
    }

    const dueDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const reminderDate = new Date(dueDate.getTime() - 5 * 24 * 60 * 60 * 1000);

    const deadline: Deadline = {
        id: `DL-${Date.now()}`,
        type,
        name,
        dueDate: dueDate.toISOString(),
        status: 'pending',
        remindersSent: 0,
        nextReminderDate: reminderDate.toISOString()
    };

    const event: WorkflowEvent = {
        id: `EVT-${Date.now()}`,
        timestamp: now.toISOString(),
        type: 'deadline_set',
        description: `Deadline set: ${name} due ${dueDate.toLocaleDateString()}`,
        actor: 'system',
        data: { deadlineId: deadline.id }
    };

    return {
        ...workflow,
        updatedAt: now.toISOString(),
        deadlines: [...workflow.deadlines, deadline],
        timeline: [...workflow.timeline, event]
    };
}

/**
 * Record a communication
 */
export function addCommunication(
    workflow: DisputeWorkflow,
    communication: Omit<Communication, 'id' | 'timestamp'>
): DisputeWorkflow {
    const now = new Date().toISOString();
    const comm: Communication = {
        ...communication,
        id: `COMM-${Date.now()}`,
        timestamp: now
    };

    const event: WorkflowEvent = {
        id: `EVT-${Date.now()}`,
        timestamp: now,
        type: 'communication',
        description: `${communication.direction === 'outbound' ? 'Sent' : 'Received'} ${communication.method}: ${communication.subject}`,
        actor: communication.direction === 'outbound' ? 'user' : 'entity',
        data: { communicationId: comm.id }
    };

    // If sending certified mail, set status to sent
    let newStatus = workflow.status;
    if (communication.direction === 'outbound' && workflow.status === 'ready_to_send') {
        newStatus = 'sent';
    }

    return {
        ...workflow,
        status: newStatus,
        updatedAt: now,
        communications: [...workflow.communications, comm],
        timeline: [...workflow.timeline, event]
    };
}

/**
 * Record dispute outcome
 */
export function setOutcome(
    workflow: DisputeWorkflow,
    outcome: Omit<DisputeOutcome, 'resolvedAt'>
): DisputeWorkflow {
    const now = new Date().toISOString();
    const fullOutcome: DisputeOutcome = {
        ...outcome,
        resolvedAt: now
    };

    const event: WorkflowEvent = {
        id: `EVT-${Date.now()}`,
        timestamp: now,
        type: 'status_change',
        description: `Dispute resolved: ${outcome.resolution}. ${outcome.details}`,
        actor: 'user'
    };

    return {
        ...workflow,
        status: 'resolved',
        updatedAt: now,
        outcome: fullOutcome,
        timeline: [...workflow.timeline, event]
    };
}

/**
 * Check and update deadline statuses
 */
export function updateDeadlineStatuses(workflow: DisputeWorkflow): DisputeWorkflow {
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const updatedDeadlines = workflow.deadlines.map(deadline => {
        if (deadline.status === 'met' || deadline.status === 'extended') {
            return deadline;
        }

        const dueDate = new Date(deadline.dueDate);

        if (now > dueDate) {
            return { ...deadline, status: 'overdue' as const };
        } else if (fiveDaysFromNow > dueDate) {
            return { ...deadline, status: 'approaching' as const };
        }

        return deadline;
    });

    return {
        ...workflow,
        deadlines: updatedDeadlines
    };
}

/**
 * Get pending reminders for all workflows
 */
export function getPendingReminders(workflows: DisputeWorkflow[]): {
    workflowId: string;
    workflowName: string;
    deadline: Deadline;
    daysRemaining: number;
}[] {
    const now = new Date();
    const reminders: {
        workflowId: string;
        workflowName: string;
        deadline: Deadline;
        daysRemaining: number;
    }[] = [];

    workflows.forEach(workflow => {
        workflow.deadlines
            .filter(d => d.status === 'pending' || d.status === 'approaching')
            .forEach(deadline => {
                const dueDate = new Date(deadline.dueDate);
                const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

                if (daysRemaining <= 7 && daysRemaining >= 0) {
                    reminders.push({
                        workflowId: workflow.id,
                        workflowName: workflow.name,
                        deadline,
                        daysRemaining
                    });
                }
            });
    });

    return reminders.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Generate workflow summary
 */
export function generateWorkflowSummary(workflow: DisputeWorkflow): string {
    let summary = `DISPUTE WORKFLOW SUMMARY\n`;
    summary += `${'═'.repeat(60)}\n\n`;

    summary += `ID: ${workflow.id}\n`;
    summary += `Name: ${workflow.name}\n`;
    summary += `Status: ${workflow.status.toUpperCase()}\n`;
    summary += `Type: ${workflow.type.toUpperCase()}\n`;
    summary += `Created: ${new Date(workflow.createdAt).toLocaleDateString()}\n\n`;

    summary += `TARGET ENTITY\n`;
    summary += `${'─'.repeat(40)}\n`;
    summary += `${workflow.targetEntity.name}\n`;
    if (workflow.targetEntity.address) summary += `${workflow.targetEntity.address}\n`;
    summary += `\n`;

    summary += `VIOLATION\n`;
    summary += `${'─'.repeat(40)}\n`;
    summary += `${workflow.violation.ruleName} [${workflow.violation.severity.toUpperCase()}]\n`;
    summary += `${workflow.violation.explanation}\n\n`;

    if (workflow.deadlines.length > 0) {
        summary += `DEADLINES\n`;
        summary += `${'─'.repeat(40)}\n`;
        workflow.deadlines.forEach(d => {
            const icon = d.status === 'overdue' ? '⚠️' : d.status === 'approaching' ? '⏰' : '📅';
            summary += `${icon} ${d.name}: ${new Date(d.dueDate).toLocaleDateString()} [${d.status.toUpperCase()}]\n`;
        });
        summary += `\n`;
    }

    if (workflow.communications.length > 0) {
        summary += `COMMUNICATIONS (${workflow.communications.length})\n`;
        summary += `${'─'.repeat(40)}\n`;
        workflow.communications.forEach(c => {
            const arrow = c.direction === 'outbound' ? '→' : '←';
            summary += `${arrow} ${new Date(c.timestamp).toLocaleDateString()} | ${c.method.toUpperCase()} | ${c.subject}\n`;
        });
        summary += `\n`;
    }

    if (workflow.outcome) {
        summary += `OUTCOME\n`;
        summary += `${'─'.repeat(40)}\n`;
        summary += `Resolution: ${workflow.outcome.resolution.toUpperCase()}\n`;
        summary += `${workflow.outcome.details}\n`;
        if (workflow.outcome.scoreImpact) {
            summary += `Score Impact: +${workflow.outcome.scoreImpact} points\n`;
        }
    }

    return summary;
}

/**
 * Get bureau contact information
 */
export function getBureauContact(bureau: 'equifax' | 'experian' | 'transunion'): TargetEntity {
    return BUREAU_CONTACTS[bureau];
}

/**
 * Batch create workflows for all three bureaus
 */
export function createTriBureauDisputes(
    caseId: string,
    violation: ViolationReference
): DisputeWorkflow[] {
    const bureaus: ('equifax' | 'experian' | 'transunion')[] = ['equifax', 'experian', 'transunion'];

    return bureaus.map(bureau =>
        createDisputeWorkflow(caseId, 'bureau', getBureauContact(bureau), violation)
    );
}

/**
 * Calculate workflow statistics
 */
export function calculateWorkflowStats(workflows: DisputeWorkflow[]): {
    total: number;
    byStatus: Record<DisputeWorkflowStatus, number>;
    successRate: number;
    averageResolutionDays: number;
    overdueCount: number;
} {
    const byStatus: Record<DisputeWorkflowStatus, number> = {
        draft: 0,
        ready_to_send: 0,
        sent: 0,
        acknowledged: 0,
        investigating: 0,
        responded: 0,
        escalated: 0,
        resolved: 0,
        closed: 0
    };

    workflows.forEach(w => {
        byStatus[w.status]++;
    });

    const resolved = workflows.filter(w => w.outcome);
    const successful = resolved.filter(w =>
        w.outcome?.resolution === 'deleted' ||
        w.outcome?.resolution === 'corrected'
    );

    const resolutionDays = resolved
        .map(w => {
            const created = new Date(w.createdAt);
            const resolvedAt = new Date(w.outcome!.resolvedAt);
            return (resolvedAt.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
        });

    const overdueCount = workflows.reduce((count, w) =>
        count + w.deadlines.filter(d => d.status === 'overdue').length, 0
    );

    return {
        total: workflows.length,
        byStatus,
        successRate: resolved.length > 0 ? (successful.length / resolved.length) * 100 : 0,
        averageResolutionDays: resolutionDays.length > 0
            ? resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length
            : 0,
        overdueCount
    };
}
