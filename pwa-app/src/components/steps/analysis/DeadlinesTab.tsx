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
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, 
    Calendar, 
    Bell, 
    Download, 
    Mail, 
    AlertTriangle, 
    CheckCircle2, 
    Timer, 
    ChevronRight,
    MousePointer2,
    FileText,
    ShieldAlert,
    Activity,
    Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils';

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
    <div className="fade-in space-y-12 pb-32">
        {/* Elite Command Header */}
        <div className="relative p-1 rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-950 overflow-hidden shadow-3xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] -mr-64 -mt-64" />
            <div className="relative z-10 p-12 bg-slate-950/90 rounded-[2.8rem] backdrop-blur-xl border border-white/5">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
                                <Timer size={12} className="text-amber-400" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-amber-400 font-mono">Temporal Matrix Node</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Compliance Core</span>
                        </div>
                        <h2 className="text-6xl font-black text-white tracking-tight mb-8 leading-tight">
                            Compliance <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Temporal Matrix</span>
                        </h2>
                        <div className="flex items-center gap-12">
                             <div className="space-y-1">
                                 <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Countdowns</p>
                                 <p className="text-4xl font-black text-white font-mono tracking-tighter">{tracker.countdowns.length}</p>
                             </div>
                             <div className="h-12 w-px bg-slate-800" />
                             <div className="space-y-1">
                                 <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Active Reminders</p>
                                 <p className="text-4xl font-black text-amber-400 font-mono tracking-tighter">{reminders.length}</p>
                             </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-2xl space-y-8 shadow-2xl">
                         <div className="flex items-center gap-4 mb-2">
                            <Calendar size={18} className="text-amber-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 font-mono">Filing Initialization</h4>
                         </div>
                         <div className="grid sm:grid-cols-[1fr_auto] gap-4">
                            <input
                                type="date"
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                                value={disputeFiledDate}
                                onChange={(e) => setDisputeFiledDate(e.target.value)}
                            />
                            <button
                                onClick={() => setDisputeFiledDate('')}
                                className="px-8 bg-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all shadow-xl active:scale-95 transform"
                            >
                                Reset
                            </button>
                         </div>
                         <div className="flex gap-4">
                            <button
                                onClick={downloadCalendar}
                                className="flex-grow py-5 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-400 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 transform font-mono"
                            >
                                <Calendar size={16} /> Sync iCal Events
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
            {/* Countdown Matrix */}
            <div className="lg:col-span-8 space-y-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-4">
                        <span className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                        Compliance Tracking Stack
                    </h3>
                </div>

                <div className="grid gap-6">
                    {tracker.countdowns.map((cd, idx) => (
                        <motion.div
                            key={`${cd.type}-${idx}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "relative group p-10 rounded-[3rem] border border-white/5 backdrop-blur-xl transition-all duration-500 overflow-hidden",
                                cd.urgency === 'expired' ? "bg-rose-500/5 border-rose-500/30" :
                                cd.urgency === 'critical' ? "bg-orange-500/5 border-orange-500/30" :
                                "bg-slate-900/40"
                            )}
                        >
                            <div className="absolute top-0 right-0 p-10">
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] font-mono border",
                                    cd.urgency === 'expired' ? "bg-rose-500 text-white border-rose-400" :
                                    cd.urgency === 'critical' ? "bg-orange-500 text-white border-orange-400" :
                                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                )}>
                                    {cd.urgency}
                                </span>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-10">
                                <div className="text-center md:text-left min-w-[220px]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 font-mono mb-2">Temporal Offset</p>
                                    <p className={cn(
                                        "text-5xl font-black font-mono tracking-tighter shrink-0",
                                        cd.urgency === 'expired' ? "text-rose-500" : "text-white"
                                    )}>
                                        {formatCountdown(cd)}
                                    </p>
                                </div>

                                <div className="h-px md:h-24 w-full md:w-px bg-white/10" />

                                <div className="flex-grow space-y-4">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle size={16} className={cn(
                                            cd.urgency === 'expired' ? "text-rose-400" : "text-amber-400"
                                        )} />
                                        <h4 className="text-xl font-black text-white uppercase tracking-tight">
                                            {cd.label}
                                        </h4>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                        {cd.explanation}
                                    </p>
                                    <div className="pt-8 mt-4 border-t border-white/5 flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-xl">
                                            <MousePointer2 size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Execution Directive</p>
                                            <p className="text-sm font-bold text-white font-mono">{cd.action}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Sidebar Controls */}
            <div className="lg:col-span-4 space-y-8">
                {/* Reminders */}
                <div className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-10 shadow-2xl">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 font-mono mb-10 flex items-center gap-3">
                        <Bell size={14} className="text-amber-400" />
                        Trigger Presets
                    </h3>
                    <div className="space-y-4">
                        {reminderOptions.map(days => (
                            <button
                                key={days}
                                onClick={() => toggleReminder(days)}
                                className={cn(
                                    "w-full flex items-center justify-between p-6 rounded-2xl border transition-all active:scale-95 group",
                                    reminders.includes(days) 
                                        ? "bg-amber-500/10 border-amber-400/50 text-amber-400" 
                                        : "bg-slate-950 border-white/5 text-slate-600 hover:border-white/20 hover:text-slate-300"
                                )}
                            >
                                <span className="font-black text-[10px] uppercase tracking-[0.3em] font-mono">{days} Day Interval</span>
                                {reminders.includes(days) ? (
                                    <CheckCircle2 size={20} className="text-amber-400" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-800 group-hover:border-slate-700" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comms */}
                <div className="bg-gradient-to-br from-amber-600/10 to-transparent border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-20">
                        <Mail size={80} className="text-amber-400 rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-lg font-black text-white mb-6 uppercase tracking-tight">Outreach Manifests</h4>
                        <div className="space-y-4">
                            <button
                                onClick={() => copyTemplate('reminder')}
                                className="w-full flex items-center gap-5 p-5 bg-slate-900/80 border border-white/5 rounded-2xl hover:border-amber-400/50 transition-all text-left group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-500 border border-amber-500/10 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-amber-400 transition-colors">Forensic Status Check</p>
                                    <p className="text-[9px] text-slate-500 font-bold font-mono">Export Internal Reminder</p>
                                </div>
                            </button>
                            <button
                                onClick={() => copyTemplate('no_response')}
                                className="w-full flex items-center gap-5 p-5 bg-slate-900/80 border border-white/5 rounded-2xl hover:border-rose-500/50 transition-all text-left group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-rose-400 transition-colors">Statutory Lapse Notice</p>
                                    <p className="text-[9px] text-slate-500 font-bold font-mono">Export Escalation Draft</p>
                                </div>
                            </button>
                        </div>
                        {copyStatus === 'success' && (
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-6"
                            >
                                SYNC_SUCCESS
                            </motion.p>
                        )}
                    </div>
                </div>

                {/* Milestone Ledger */}
                <div className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] shadow-2xl">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 font-mono mb-10">Statutory Milestone Ledger</h3>
                    <div className="space-y-8">
                        {tracker.milestones.map((m, idx) => (
                            <div key={idx} className="flex gap-6 group">
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "w-3 h-3 rounded-full border-2 transition-all",
                                        m.passed 
                                            ? "bg-slate-700 border-slate-800" 
                                            : "bg-amber-500 border-amber-900 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-125"
                                    )} />
                                    {idx < tracker.milestones.length - 1 && (
                                        <div className={cn(
                                            "w-px flex-grow my-2",
                                            m.passed ? "bg-slate-800" : "bg-gradient-to-b from-amber-500/50 to-slate-800"
                                        )} />
                                    )}
                                </div>
                                <div className="pb-4">
                                    <p className={cn(
                                        "text-sm font-black uppercase tracking-tight",
                                        m.passed ? "text-slate-600 line-through" : "text-white"
                                    )}>
                                        {m.event}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] font-mono font-bold">
                                        <Calendar size={10} className="text-slate-600" />
                                        <span className="text-slate-500">{m.date.toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-3 font-medium leading-relaxed group-hover:text-slate-400 transition-colors">
                                        {m.significance}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DeadlinesTab;
