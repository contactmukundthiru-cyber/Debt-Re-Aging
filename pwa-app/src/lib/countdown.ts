/**
 * Statute Countdown & Deadline Tracker
 * Calculate and track important dates and deadlines
 */

import { CreditFields } from './rules';
import { getStateLaws } from './state-laws';

export interface CountdownResult {
  type: 'reporting_removal' | 'sol_expiration' | 'dispute_deadline' | 'response_deadline';
  label: string;
  targetDate: Date;
  daysRemaining: number;
  isExpired: boolean;
  urgency: 'critical' | 'warning' | 'normal' | 'expired';
  explanation: string;
  action: string;
}

export interface DeadlineTracker {
  accountId: string;
  creditorName: string;
  countdowns: CountdownResult[];
  nextAction: {
    description: string;
    deadline: Date;
    daysUntil: number;
  };
  milestones: Milestone[];
}

export interface Milestone {
  date: Date;
  event: string;
  significance: string;
  passed: boolean;
}

/**
 * Calculate 7-year removal date from DOFD
 */
export function calculateRemovalDate(dofd: string): Date {
  const dofdDate = new Date(dofd);
  // 7 years + 180 days (6 months) from DOFD
  const removalDate = new Date(dofdDate);
  removalDate.setFullYear(removalDate.getFullYear() + 7);
  removalDate.setDate(removalDate.getDate() + 180);
  return removalDate;
}

/**
 * Calculate SOL expiration for a state
 */
export function calculateSOLExpiration(
  lastPaymentDate: string,
  stateCode: string,
  debtType: 'written' | 'oral' | 'promissory' | 'open' = 'written'
): Date | null {
  const laws = getStateLaws(stateCode);
  if (!laws) return null;

  const typeMap: Record<string, keyof typeof laws.sol> = {
    written: 'writtenContracts',
    oral: 'oralContracts',
    promissory: 'promissoryNotes',
    open: 'openAccounts'
  };
  const solYears = laws.sol[typeMap[debtType]];
  const lastPayment = new Date(lastPaymentDate);

  const expiration = new Date(lastPayment);
  expiration.setFullYear(expiration.getFullYear() + solYears);

  return expiration;
}

/**
 * Calculate all countdowns for an account
 */
export function calculateCountdowns(
  fields: CreditFields,
  disputeFiledDate?: string
): CountdownResult[] {
  const countdowns: CountdownResult[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 7-Year Reporting Removal
  if (fields.dofd) {
    const removalDate = calculateRemovalDate(fields.dofd);
    const daysRemaining = Math.ceil((removalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    countdowns.push({
      type: 'reporting_removal',
      label: '7-Year Reporting Limit',
      targetDate: removalDate,
      daysRemaining: Math.max(0, daysRemaining),
      isExpired: daysRemaining <= 0,
      urgency: daysRemaining <= 0 ? 'expired' :
               daysRemaining <= 30 ? 'critical' :
               daysRemaining <= 180 ? 'warning' : 'normal',
      explanation: daysRemaining <= 0
        ? 'This account has exceeded the 7-year reporting limit and should be removed immediately.'
        : `This account should be removed from your credit report in ${daysRemaining} days.`,
      action: daysRemaining <= 0
        ? 'Dispute immediately citing FCRA §605 - account is past reporting limit.'
        : daysRemaining <= 30
        ? 'Prepare dispute letter for removal. Account is approaching reporting limit.'
        : 'Monitor and note removal date on calendar.'
    });
  }

  // Statute of Limitations
  if (fields.dateLastPayment && fields.stateCode) {
    const solExpiration = calculateSOLExpiration(fields.dateLastPayment, fields.stateCode);
    if (solExpiration) {
      const daysRemaining = Math.ceil((solExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      countdowns.push({
        type: 'sol_expiration',
        label: 'Statute of Limitations',
        targetDate: solExpiration,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired: daysRemaining <= 0,
        urgency: daysRemaining <= 0 ? 'expired' :
                 daysRemaining <= 90 ? 'critical' :
                 daysRemaining <= 365 ? 'warning' : 'normal',
        explanation: daysRemaining <= 0
          ? 'The statute of limitations has expired. This debt is time-barred and cannot be sued upon.'
          : `Creditor has ${daysRemaining} days remaining to file a lawsuit for this debt.`,
        action: daysRemaining <= 0
          ? 'Debt is time-barred. If sued, raise SOL as affirmative defense. Do NOT make any payment.'
          : 'Do not acknowledge debt or make payments that could restart the SOL clock.'
      });
    }
  }

  // 30-Day Dispute Response Deadline
  if (disputeFiledDate) {
    const disputeFiled = new Date(disputeFiledDate);
    const responseDeadline = new Date(disputeFiled);
    responseDeadline.setDate(responseDeadline.getDate() + 30);

    const daysRemaining = Math.ceil((responseDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    countdowns.push({
      type: 'response_deadline',
      label: '30-Day Investigation Deadline',
      targetDate: responseDeadline,
      daysRemaining: Math.max(0, daysRemaining),
      isExpired: daysRemaining <= 0,
      urgency: daysRemaining <= 0 ? 'expired' :
               daysRemaining <= 5 ? 'critical' :
               daysRemaining <= 10 ? 'warning' : 'normal',
      explanation: daysRemaining <= 0
        ? 'Credit bureau has failed to respond within the required 30 days. This is an FCRA violation.'
        : `Credit bureau must respond to your dispute within ${daysRemaining} days.`,
      action: daysRemaining <= 0
        ? 'File CFPB complaint for failure to investigate. Item may be automatically deleted.'
        : 'Monitor for response. Prepare follow-up if no response received.'
    });
  }

  // Sort by urgency and days remaining
  return countdowns.sort((a, b) => {
    const urgencyOrder = { expired: 0, critical: 1, warning: 2, normal: 3 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return a.daysRemaining - b.daysRemaining;
  });
}

/**
 * Build complete deadline tracker
 */
export function buildDeadlineTracker(
  fields: CreditFields,
  disputeFiledDate?: string
): DeadlineTracker {
  const countdowns = calculateCountdowns(fields, disputeFiledDate);

  const milestones = buildMilestones(fields);

  const nextCountdown = countdowns.find(c => !c.isExpired) || countdowns[0];

  return {
    accountId: fields.originalCreditor || 'unknown',
    creditorName: fields.furnisherOrCollector || fields.originalCreditor || 'Unknown',
    countdowns,
    nextAction: {
      description: nextCountdown?.action || 'No immediate action required',
      deadline: nextCountdown?.targetDate || new Date(),
      daysUntil: nextCountdown?.daysRemaining || 0
    },
    milestones
  };
}

/**
 * Build timeline milestones
 */
function buildMilestones(fields: CreditFields): Milestone[] {
  const milestones: Milestone[] = [];
  const today = new Date();

  if (fields.dateOpened) {
    const date = new Date(fields.dateOpened);
    milestones.push({
      date,
      event: 'Account Opened',
      significance: 'Original account creation date',
      passed: date < today
    });
  }

  if (fields.dateLastPayment) {
    const date = new Date(fields.dateLastPayment);
    milestones.push({
      date,
      event: 'Last Payment Made',
      significance: 'SOL clock starts from this date',
      passed: date < today
    });
  }

  if (fields.dofd) {
    const date = new Date(fields.dofd);
    milestones.push({
      date,
      event: 'First Delinquency (DOFD)',
      significance: '7-year reporting clock starts here',
      passed: date < today
    });

    // Add 7-year milestone
    const sevenYears = new Date(date);
    sevenYears.setFullYear(sevenYears.getFullYear() + 7);
    milestones.push({
      date: sevenYears,
      event: '7 Years from DOFD',
      significance: 'Base reporting period ends',
      passed: sevenYears < today
    });

    // Add 7 years + 180 days milestone
    const removalDate = calculateRemovalDate(fields.dofd);
    milestones.push({
      date: removalDate,
      event: 'Required Removal Date',
      significance: 'Account must be removed by this date',
      passed: removalDate < today
    });
  }

  if (fields.chargeOffDate) {
    const date = new Date(fields.chargeOffDate);
    milestones.push({
      date,
      event: 'Charge-Off',
      significance: 'Account written off as loss',
      passed: date < today
    });
  }

  // Sort chronologically
  return milestones.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Format countdown display
 */
export function formatCountdown(countdown: CountdownResult): string {
  if (countdown.isExpired) {
    return `EXPIRED - ${countdown.label}`;
  }

  if (countdown.daysRemaining === 0) {
    return `TODAY - ${countdown.label}`;
  }

  if (countdown.daysRemaining === 1) {
    return `TOMORROW - ${countdown.label}`;
  }

  if (countdown.daysRemaining < 30) {
    return `${countdown.daysRemaining} DAYS - ${countdown.label}`;
  }

  if (countdown.daysRemaining < 365) {
    const months = Math.floor(countdown.daysRemaining / 30);
    return `${months} MONTH${months > 1 ? 'S' : ''} - ${countdown.label}`;
  }

  const years = (countdown.daysRemaining / 365).toFixed(1);
  return `${years} YEARS - ${countdown.label}`;
}

/**
 * Get urgency color class
 */
export function getUrgencyColor(urgency: CountdownResult['urgency']): string {
  switch (urgency) {
    case 'expired': return 'text-red-600 bg-red-50';
    case 'critical': return 'text-red-500 bg-red-50';
    case 'warning': return 'text-amber-500 bg-amber-50';
    case 'normal': return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Generate calendar events (iCal format)
 */
export function generateCalendarEvents(tracker: DeadlineTracker): string {
  const events: string[] = [];

  events.push('BEGIN:VCALENDAR');
  events.push('VERSION:2.0');
  events.push('PRODID:-//Credit Report Analyzer//Deadline Tracker//EN');

  tracker.countdowns.forEach((countdown, i) => {
    const dateStr = countdown.targetDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    events.push('BEGIN:VEVENT');
    events.push(`UID:deadline-${i}-${Date.now()}@creditanalyzer`);
    events.push(`DTSTART:${dateStr}`);
    events.push(`SUMMARY:${countdown.label} - ${tracker.creditorName}`);
    events.push(`DESCRIPTION:${countdown.explanation}\\n\\nAction: ${countdown.action}`);
    events.push('END:VEVENT');
  });

  tracker.milestones.forEach((milestone, i) => {
    if (!milestone.passed) {
      const dateStr = milestone.date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      events.push('BEGIN:VEVENT');
      events.push(`UID:milestone-${i}-${Date.now()}@creditanalyzer`);
      events.push(`DTSTART:${dateStr}`);
      events.push(`SUMMARY:${milestone.event} - ${tracker.creditorName}`);
      events.push(`DESCRIPTION:${milestone.significance}`);
      events.push('END:VEVENT');
    }
  });

  events.push('END:VCALENDAR');

  return events.join('\r\n');
}

/**
 * Format deadline report
 */
export function formatDeadlineReport(tracker: DeadlineTracker): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('        DEADLINE & COUNTDOWN TRACKER');
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push(`Account: ${tracker.creditorName}`);
  lines.push(`Generated: ${new Date().toLocaleDateString()}`);
  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('ACTIVE COUNTDOWNS');
  lines.push('─'.repeat(60));

  tracker.countdowns.forEach(countdown => {
    const status = countdown.isExpired ? '⚠️ EXPIRED' :
                   countdown.urgency === 'critical' ? '🔴 CRITICAL' :
                   countdown.urgency === 'warning' ? '🟡 WARNING' : '🟢 NORMAL';

    lines.push('');
    lines.push(`${status} ${countdown.label}`);
    lines.push(`  Target Date: ${countdown.targetDate.toLocaleDateString()}`);
    lines.push(`  Days Remaining: ${countdown.isExpired ? 'PAST DUE' : countdown.daysRemaining}`);
    lines.push(`  Status: ${countdown.explanation}`);
    lines.push(`  Action: ${countdown.action}`);
  });

  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('TIMELINE MILESTONES');
  lines.push('─'.repeat(60));

  tracker.milestones.forEach(milestone => {
    const marker = milestone.passed ? '✓' : '○';
    lines.push(`${marker} ${milestone.date.toLocaleDateString()} - ${milestone.event}`);
    lines.push(`    ${milestone.significance}`);
  });

  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('NEXT ACTION');
  lines.push('─'.repeat(60));
  lines.push(`${tracker.nextAction.description}`);
  lines.push(`Due: ${tracker.nextAction.deadline.toLocaleDateString()} (${tracker.nextAction.daysUntil} days)`);

  return lines.join('\n');
}

/**
 * Check if any deadlines need attention
 */
export function hasUrgentDeadlines(tracker: DeadlineTracker): boolean {
  return tracker.countdowns.some(c =>
    c.urgency === 'expired' || c.urgency === 'critical'
  );
}

/**
 * Get summary of deadlines
 */
export function getDeadlineSummary(tracker: DeadlineTracker): {
  expired: number;
  critical: number;
  warning: number;
  normal: number;
} {
  return {
    expired: tracker.countdowns.filter(c => c.urgency === 'expired').length,
    critical: tracker.countdowns.filter(c => c.urgency === 'critical').length,
    warning: tracker.countdowns.filter(c => c.urgency === 'warning').length,
    normal: tracker.countdowns.filter(c => c.urgency === 'normal').length
  };
}
