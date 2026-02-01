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
        <div className="fade-in">
            <div className="relative p-1 rounded-[4rem] bg-gradient-to-br from-slate-600/20 to-slate-900 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xl" />
                <div className="relative z-10 p-32 flex flex-col items-center justify-center text-center gap-10">
                    <div className="w-32 h-32 rounded-[3.5rem] bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400 shadow-2xl animate-pulse">
                        <Clock size={56} />
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic font-mono mb-4">Temporal_Sync::FAILED</h3>
                        <p className="text-lg text-slate-500 max-w-lg mx-auto font-bold italic border-l-2 border-slate-500/30 pl-8">No active deadlines detected. Date of First Delinquency (DOFD) and state residence are <span className="text-slate-300">REQUIRED</span> for temporal mapping.</p>
                    </div>
                </div>
            </div>
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

  const downloadCalendar = () => {
    const ics = buildIcs(tracker, reminders.length > 0 ? reminders : [7]);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'case_deadlines.ics';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const copyTemplate = async (template: 'reminder' | 'no_response') => {
    const buildEmail = (template: 'reminder' | 'no_response') => {
        const creditor = tracker.creditorName;
        const next = tracker.nextAction;
        if (template === 'reminder') {
          return buildReminderEmail(creditor, next.description, next.deadline.toLocaleDateString());
        }
        return buildNoResponseEmail(creditor);
    };

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

  return (
    <div className="fade-in space-y-20 pb-40">
        {/* ELITE_AUDIT_HERO::TEMPORAL_RESPONSE_MATRIX */}
        <section className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-slate-600/20 via-slate-500/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
            <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
                
                <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
                    <div className="lg:col-span-8">
                         <div className="flex items-center gap-6 mb-8">
                            <div className="px-5 py-2 bg-slate-500/10 border border-slate-500/20 rounded-full flex items-center gap-3">
                                <Timer size={14} className="text-slate-300 animate-pulse" />
                                <span className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-300 font-mono">Temporal Core v5.0</span>
                            </div>
                            <div className="h-px w-10 bg-slate-800" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Sync_Status::ACTIVE</span>
                        </div>

                        <h2 className="text-7xl lg:text-[7.5rem] font-black text-white tracking-tighter mb-10 leading-[0.85] italic uppercase font-mono">
                            Temporal <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-white to-slate-400 tracking-[-0.05em]">RESPONSE</span>
                        </h2>

                        <p className="text-2xl text-slate-400 leading-[1.4] font-bold italic tracking-tight max-w-2xl border-l-2 border-slate-500/30 pl-12 mb-12">
                            Executing <span className="text-white font-black">Strict Compliance Windows</span>. Statutory clocks are currently ticking. Failure to respond within these windows constitutes willful neglect under FCRA precedent.
                        </p>

                        <div className="flex flex-wrap items-center gap-12 sm:gap-20 pt-10 border-t border-white/5">
                             <div className="space-y-2">
                                 <p className="text-[10px] uppercase text-slate-600 font-black tracking-[0.5em] font-mono italic">Countdowns_Active</p>
                                 <p className="text-5xl font-black text-white font-mono tracking-tighter italic">{tracker.countdowns.length}</p>
                             </div>
                             <div className="space-y-2">
                                 <p className="text-[10px] uppercase text-slate-600 font-black tracking-[0.5em] font-mono italic">Reminders_Configured</p>
                                 <p className="text-5xl font-black text-slate-400 font-mono tracking-tighter italic">{reminders.length}</p>
                             </div>
                             <button
                                onClick={downloadCalendar}
                                className="px-10 py-5 bg-white text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono italic hover:bg-slate-600 hover:text-white transition-all shadow-3xl flex items-center gap-4"
                            >
                                <Calendar size={18} />
                                Sync_Temporal_Cal
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-4 self-stretch">
                         <div className="h-full bg-slate-900 border border-white/10 p-12 rounded-[4rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden group/input flex flex-col justify-center">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-[2.5] text-white rotate-12 pointer-events-none group-hover/input:rotate-0 transition-transform duration-1000">
                                <Calendar size={100} />
                            </div>
                            <div className="relative z-10 space-y-12">
                                <div>
                                    <label htmlFor="filing-init-date" className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 font-mono mb-6 italic">Filing_Initialization</label>
                                    <input
                                        id="filing-init-date"
                                        title="Initial Dispute Filing Date"
                                        type="date"
                                        className="w-full bg-slate-950 border border-white/5 rounded-[2rem] px-8 py-6 text-white text-xl outline-none focus:ring-2 focus:ring-slate-500/30 transition-all font-mono font-black italic shadow-inner"
                                        value={disputeFiledDate}
                                        onChange={(e) => setDisputeFiledDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 font-mono italic">Recall_Cadence</p>
                                    <div className="flex flex-wrap gap-3">
                                        {reminderOptions.map(days => (
                                            <button
                                                key={days}
                                                onClick={() => toggleReminder(days)}
                                                className={cn(
                                                    "px-6 py-3 rounded-xl border text-[10px] font-black font-mono transition-all",
                                                    reminders.includes(days) 
                                                        ? "bg-slate-500 border-slate-400 text-white shadow-lg" 
                                                        : "bg-slate-950 border-white/5 text-slate-500 hover:border-slate-500"
                                                )}
                                            >
                                                {days}D
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </section>

        <div className="grid lg:grid-cols-12 gap-20">
            {/* Countdown Matrix Stack */}
            <div className="lg:col-span-8 space-y-8">
                <div className="flex items-center justify-between mb-8 px-8">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] font-mono italic flex items-center gap-4">
                        <Activity size={16} className="text-slate-400" /> Compliance_Stack::ACTIVE
                    </h3>
                </div>

                <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                        {tracker.countdowns.map((cd, idx) => {
                            const isExpired = cd.urgency === 'expired';
                            const isCritical = cd.urgency === 'critical';
                            return (
                                <motion.div
                                    key={`${cd.type}-${idx}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={cn(
                                        "group/cd p-10 rounded-[3.5rem] bg-slate-950/40 backdrop-blur-3xl border transition-all shadow-2xl relative overflow-hidden",
                                        isExpired ? "border-slate-500/30 bg-slate-950/10 shadow-slate-950/20" :
                                        isCritical ? "border-slate-500/30 shadow-slate-950/20" :
                                        "border-white/5 hover:border-slate-500/30"
                                    )}
                                >
                                    {/* Urgency Badge */}
                                    <div className="absolute top-0 right-0 p-10 flex items-center gap-4">
                                         <div className={cn(
                                             "px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.3em] font-mono border italic",
                                             isExpired ? "bg-slate-600 text-white border-slate-400" :
                                             isCritical ? "bg-slate-500 text-white border-slate-400 shadow-lg shadow-slate-500/20" :
                                             "bg-slate-900 text-slate-400 border-slate-500/20"
                                         )}>
                                             {cd.urgency}
                                         </div>
                                    </div>

                                    <div className="relative z-10 grid md:grid-cols-12 gap-12 items-center">
                                        <div className="md:col-span-4 flex flex-col items-center md:items-start">
                                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono mb-2 italic">Temporal_Delta</span>
                                             <p className={cn(
                                                 "text-6xl font-black font-mono tracking-tighter italic leading-none",
                                                 isExpired ? "text-slate-400" : "text-white"
                                             )}>
                                                 {formatCountdown(cd)}
                                             </p>
                                        </div>

                                        <div className="hidden md:block md:col-span-1 h-20 w-px bg-white/5 mx-auto" />

                                        <div className="md:col-span-7">
                                            <div className="flex items-center gap-4 mb-4">
                                                <h5 className="text-2xl font-black text-white italic uppercase tracking-tighter font-mono">{cd.label}</h5>
                                                {isExpired && <AlertTriangle size={16} className="text-slate-400 animate-pulse" />}
                                            </div>
                                            <p className="text-sm font-bold text-slate-400 italic mb-6 leading-relaxed pr-20">{cd.explanation}</p>
                                            
                                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group/action transition-colors hover:bg-white/10">
                                                <div className="flex items-center gap-4">
                                                    <MousePointer2 size={16} className="text-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono italic">Tactical_Action: <span className="text-white">{cd.action}</span></span>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-600 group-hover/action:translate-x-2 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Sidebar Controls */}
            <div className="lg:col-span-4 space-y-12">
                 <div className="p-16 rounded-[4.5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 shadow-2xl relative overflow-hidden group/intel h-full flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.02] scale-[2.5] rotate-12 group-hover/intel:rotate-0 transition-transform duration-1000 grayscale pointer-events-none select-none">
                         <ShieldAlert size={200} className="text-white" />
                    </div>
                    
                    <div className="relative z-10 w-full">
                        <div className="flex items-center gap-8 mb-16 px-4">
                            <div className="w-16 h-16 rounded-[2rem] bg-slate-600/10 flex items-center justify-center text-slate-400 border border-slate-500/20 shadow-2xl relative">
                                <Activity size={28} className="animate-pulse" />
                            </div>
                            <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic font-mono">Milestone_Log</h4>
                        </div>

                        <div className="relative border-l-2 border-slate-800 ml-12 pl-12 space-y-20 pb-20">
                            {tracker.milestones.map((milestone, i) => {
                                const isPassed = milestone.passed;
                                return (
                                    <div key={i} className={cn("relative group/ms transition-opacity", !isPassed && "opacity-40 grayscale")}>
                                        <div className={cn(
                                            "absolute -left-[57px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all bg-slate-950 border-2",
                                            isPassed ? "border-slate-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "border-slate-800"
                                        )}>
                                            {isPassed && <div className="w-2 h-2 rounded-full bg-slate-500" />}
                                        </div>
                                        <div className="pt-1">
                                            <span className="text-[9px] font-mono text-slate-500 italic mb-2 block font-black uppercase tracking-widest">{milestone.date.toLocaleDateString()}</span>
                                            <p className={cn(
                                                "text-xl font-black uppercase tracking-tighter font-mono italic leading-none mb-4",
                                                isPassed ? "text-white" : "text-slate-600"
                                            )}>{milestone.event}</p>
                                            <p className="text-sm font-bold text-slate-500 italic leading-snug pr-8">{milestone.significance}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-16 bg-gradient-to-br from-slate-600/10 to-transparent border border-white/10 rounded-[3.5rem] p-12 space-y-10 shadow-3xl relative overflow-hidden w-full">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover/intel:rotate-[-20deg] transition-transform duration-700">
                             <Mail size={100} className="text-slate-300" />
                        </div>
                        <div className="relative z-10 w-full">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] font-mono mb-10 italic">Outreach_Protocols</h4>
                            <div className="space-y-6">
                                <button
                                    onClick={() => copyTemplate('reminder')}
                                    className="w-full flex items-center justify-between p-8 rounded-[2rem] bg-slate-950/80 border border-white/5 hover:border-slate-500 transition-all group/btn"
                                >
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] font-mono italic mb-2 group-hover/btn:text-slate-300 transition-colors">Manifest_Export</p>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Internal_Reminder_Draft</p>
                                    </div>
                                    <Zap size={20} className="text-slate-800 group-hover/btn:text-slate-400 transition-colors" />
                                </button>
                                <button
                                    onClick={() => copyTemplate('no_response')}
                                    className="w-full flex items-center justify-between p-8 rounded-[2rem] bg-slate-950/80 border border-white/5 hover:border-slate-500 transition-all group/btn"
                                >
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] font-mono italic mb-2 group-hover/btn:text-slate-400 transition-colors">Escalation_Notice</p>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Non_Response_Protocol</p>
                                    </div>
                                    <ShieldAlert size={20} className="text-slate-800 group-hover/btn:text-slate-400 transition-colors" />
                                </button>
                            </div>
                            {copyStatus === 'success' && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mt-8 py-4 bg-slate-500/10 border border-slate-500/20 rounded-xl text-center"
                                >
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono italic">Sync_Authorized</span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default DeadlinesTab;
