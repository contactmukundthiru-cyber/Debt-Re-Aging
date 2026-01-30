'use client';

import React from 'react';
import useLocalStorage from '../../../hooks/useLocalStorage';
import {
  buildDeadlineTracker,
  formatCountdown,
  formatDeadlineReport,
  DeadlineTracker
} from '../../../lib/countdown';
import { CreditFields, RuleFlag } from '../../../lib/rules';
import { ConsumerInfo } from '../../../lib/generator';
import {
  buildReminderEmail,
  buildNoResponseEmail,
  buildMOVRequest,
  buildNoResponseNotice,
  buildCFPBOutline
} from '../../../lib/follow-up-letters';

interface DeadlinesTabProps {
  fields: Partial<CreditFields>;
  consumer: ConsumerInfo;
  flags: RuleFlag[];
}

const buildIcs = (tracker: DeadlineTracker, reminders: number[]) => {
  const lines: string[] = [];

  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Credit Report Analyzer//Deadline Tracker//EN');

  tracker.countdowns.forEach((countdown, i) => {
    const dateStr = countdown.targetDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:deadline-${i}-${Date.now()}@creditanalyzer`);
    lines.push(`DTSTART:${dateStr}`);
    lines.push(`SUMMARY:${countdown.label} - ${tracker.creditorName}`);
    lines.push(`DESCRIPTION:${countdown.explanation}\\n\\nAction: ${countdown.action}`);

    reminders.forEach((offset) => {
      lines.push('BEGIN:VALARM');
      lines.push(`TRIGGER:-P${offset}D`);
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:Reminder - ${countdown.label}`);
      lines.push('END:VALARM');
    });

    lines.push('END:VEVENT');
  });

  tracker.milestones.forEach((milestone, i) => {
    if (milestone.passed) return;
    const dateStr = milestone.date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:milestone-${i}-${Date.now()}@creditanalyzer`);
    lines.push(`DTSTART:${dateStr}`);
    lines.push(`SUMMARY:${milestone.event} - ${tracker.creditorName}`);
    lines.push(`DESCRIPTION:${milestone.significance}`);

    reminders.forEach((offset) => {
      lines.push('BEGIN:VALARM');
      lines.push(`TRIGGER:-P${offset}D`);
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:Reminder - ${milestone.event}`);
      lines.push('END:VALARM');
    });

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
};

const DeadlinesTab: React.FC<DeadlinesTabProps> = ({ fields, consumer, flags }) => {
  const [disputeFiledDate, setDisputeFiledDate] = useLocalStorage<string>('cra_dispute_filed_date', '');
  const [reminders, setReminders] = useLocalStorage<number[]>('cra_deadline_reminders', [30, 7, 1]);
  const [copyStatus, setCopyStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const tracker = React.useMemo(() => {
    try {
      return buildDeadlineTracker(fields as CreditFields, disputeFiledDate || undefined);
    } catch (error) {
      console.warn('Failed to build deadline tracker', error);
      return null;
    }
  }, [fields, disputeFiledDate]);

  if (!tracker) {
    return (
      <div className="premium-card p-12 text-center bg-slate-50 dark:bg-slate-950/30 border-dashed border-slate-200 dark:border-slate-800">
        <h3 className="text-xl font-bold dark:text-white mb-2">No deadlines yet</h3>
        <p className="text-sm text-slate-500">Add the required dates (DOFD, last payment, state) to generate the deadline matrix.</p>
      </div>
    );
  }

  const reminderOptions = [30, 14, 7, 3, 1];

  const toggleReminder = (days: number) => {
    setReminders((prev) => {
      if (prev.includes(days)) {
        return prev.filter(item => item !== days);
      }
      return [...prev, days].sort((a, b) => b - a);
    });
  };

  const downloadTextReport = () => {
    const report = formatDeadlineReport(tracker);
    const blob = new Blob([report], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'deadline_tracker.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadCalendar = () => {
    const ics = buildIcs(tracker, reminders.length > 0 ? reminders : [7]);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'case_deadlines.ics';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const setCadence = (preset: number[]) => {
    setReminders(preset);
  };

  const buildEmail = (template: 'reminder' | 'no_response') => {
    const creditor = tracker.creditorName;
    const next = tracker.nextAction;
    if (template === 'reminder') {
      return buildReminderEmail(creditor, next.description, next.deadline.toLocaleDateString());
    }
    return buildNoResponseEmail(creditor);
  };

  const copyTemplate = async (template: 'reminder' | 'no_response') => {
    try {
      await navigator.clipboard.writeText(buildEmail(template));
      setCopyStatus('success');
    } catch (error) {
      console.warn('Failed to copy template', error);
      setCopyStatus('error');
    } finally {
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const buildMOV = () => buildMOVRequest(fields, consumer);
  const buildNotice = () => buildNoResponseNotice(fields, consumer, disputeFiledDate || undefined);
  const buildCFPB = () => buildCFPBOutline(fields, consumer, flags);

  return (
    <div className="space-y-8">
      <div className="premium-card p-6 bg-slate-950 text-white border-slate-800 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[120px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-500/10 rounded-full blur-[100px] -ml-28 -mb-28" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400 font-bold font-mono">Timeline Ops</p>
            <h3 className="text-3xl font-black tracking-tight mt-2">Deadline Command Matrix</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Live countdowns with preloaded reminders. Export calendar events to keep the case on strict compliance timing.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadCalendar}
              className="btn btn-secondary !px-5 !py-3 !rounded-xl !text-[11px] !font-bold !uppercase !tracking-widest bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Download Calendar
            </button>
            <button
              type="button"
              onClick={downloadTextReport}
              className="btn btn-secondary !px-5 !py-3 !rounded-xl !text-[11px] !font-bold !uppercase !tracking-widest border-white/20 text-white/80 hover:text-white"
            >
              Export Brief
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dispute Clock</p>
                <h4 className="text-lg font-bold dark:text-white">30/45-Day Response Window</h4>
              </div>
            </div>
            <div className="grid sm:grid-cols-[1fr_180px] gap-3 items-end">
              <div>
                <label className="field-label">Dispute Filed Date (optional)</label>
                <input
                  type="date"
                  value={disputeFiledDate}
                  onChange={(e) => setDisputeFiledDate(e.target.value)}
                  className="input rounded-xl"
                />
              </div>
              <button
                type="button"
                onClick={() => setDisputeFiledDate('')}
                className="btn btn-secondary !rounded-xl !px-4 !py-3"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Countdowns</p>
                <h4 className="text-lg font-bold dark:text-white">Active Deadline Stack</h4>
              </div>
              <span className="text-xs font-bold text-slate-500">{tracker.countdowns.length} tracked</span>
            </div>

            <div className="space-y-4">
              {tracker.countdowns.map((countdown, index) => (
                <div key={`${countdown.type}-${index}`} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">{formatCountdown(countdown)}</p>
                      <h5 className="text-base font-bold dark:text-white">{countdown.label}</h5>
                      <p className="text-xs text-slate-500 mt-1">{countdown.explanation}</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${countdown.urgency === 'expired'
                      ? 'bg-rose-500/10 text-rose-500'
                      : countdown.urgency === 'critical'
                        ? 'bg-amber-500/10 text-amber-500'
                        : countdown.urgency === 'warning'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {countdown.urgency}
                    </span>
                  </div>
                  <div className="mt-4 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Next Action</p>
                    <p className="text-sm font-semibold dark:text-white">{countdown.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Case Timeline</p>
                <h4 className="text-lg font-bold dark:text-white">Milestone Ledger</h4>
              </div>
            </div>
            <div className="space-y-4">
              {tracker.milestones.map((milestone, index) => (
                <div key={`${milestone.event}-${index}`} className="flex items-start gap-4">
                  <div className={`w-2 h-2 mt-2 rounded-full ${milestone.passed ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                  <div>
                    <p className="text-xs font-bold dark:text-white">{milestone.event}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">{milestone.date.toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500">{milestone.significance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="premium-card p-6 bg-slate-950 text-white border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Reminder Cadence</p>
            <div className="space-y-3">
              {reminderOptions.map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => toggleReminder(days)}
                  className={`w-full px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all ${reminders.includes(days)
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {days} Day Reminder
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCadence([30, 14, 7, 1])}
                className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-800 text-slate-400 hover:text-slate-200"
              >
                Standard Cadence
              </button>
              <button
                type="button"
                onClick={() => setCadence([45, 30, 14, 7, 3, 1])}
                className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-800 text-slate-400 hover:text-slate-200"
              >
                Escalation Cadence
              </button>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Next Action</p>
              <p className="text-sm font-semibold text-white">{tracker.nextAction.description}</p>
              <p className="text-[10px] text-slate-500 mt-2">Due {tracker.nextAction.deadline.toLocaleDateString()} ({tracker.nextAction.daysUntil} days)</p>
            </div>
          </div>

          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Auto Reminders</p>
            <p className="text-sm text-slate-500">Calendar export includes alert popups for each deadline and milestone based on your selected cadence.</p>
            <div className="mt-4">
              <button
                type="button"
                onClick={downloadCalendar}
                className="btn btn-primary w-full !rounded-xl !py-3"
              >
                Sync Calendar Now
              </button>
            </div>
          </div>

          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Email Templates</p>
            <p className="text-sm text-slate-500">Prebuilt outreach text for deadline reminders and no-response escalations.</p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => copyTemplate('reminder')}
                className="btn btn-secondary w-full !rounded-xl !py-3 !text-[11px] !uppercase !tracking-widest"
              >
                Copy Reminder Email
              </button>
              <button
                type="button"
                onClick={() => copyTemplate('no_response')}
                className="btn btn-secondary w-full !rounded-xl !py-3 !text-[11px] !uppercase !tracking-widest"
              >
                Copy No-Response Email
              </button>
              {copyStatus !== 'idle' && (
                <p className={`text-[10px] uppercase tracking-widest ${copyStatus === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {copyStatus === 'success' ? 'Copied to clipboard' : 'Copy failed'}
                </p>
              )}
            </div>
          </div>

          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Follow-Up Kit</p>
            <p className="text-sm text-slate-500">Auto-generated letters for escalation when deadlines are missed or investigations stall.</p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => downloadText(buildMOV(), 'method_of_verification_request.txt')}
                className="btn btn-secondary w-full !rounded-xl !py-3 !text-[11px] !uppercase !tracking-widest"
              >
                Download MOV Request
              </button>
              <button
                type="button"
                onClick={() => downloadText(buildNotice(), 'failure_to_investigate_notice.txt')}
                className="btn btn-secondary w-full !rounded-xl !py-3 !text-[11px] !uppercase !tracking-widest"
              >
                Download No-Response Notice
              </button>
              <button
                type="button"
                onClick={() => downloadText(buildCFPB(), 'cfpb_complaint_outline.txt')}
                className="btn btn-secondary w-full !rounded-xl !py-3 !text-[11px] !uppercase !tracking-widest"
              >
                Download CFPB Outline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeadlinesTab;
