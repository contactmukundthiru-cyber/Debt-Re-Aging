'use client';

import React, { useMemo, useEffect } from 'react';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { CreditFields, RuleFlag } from '../../../lib/rules';
import { buildDeadlineTracker } from '../../../lib/countdown';
import { TabId } from '../../../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    FileSearch, 
    Rocket, 
    ArrowRight, 
    ShieldCheck, 
    ListTodo,
    ChevronRight,
    Trophy,
    Target,
    Zap,
    Cpu,
    Radiation,
    Terminal,
    Fingerprint
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ReviewMissionTabProps {
  flags: RuleFlag[];
  fields: Partial<CreditFields>;
  discoveryAnswers: Record<string, string>;
  setActiveTab: (tab: TabId) => void;
}

interface ReviewTask {
  id: string;
  label: string;
  done: boolean;
}

const ReviewMissionTab: React.FC<ReviewMissionTabProps> = ({ flags, fields, discoveryAnswers, setActiveTab }) => {
  const [tasks, setTasks] = useLocalStorage<ReviewTask[]>('cra_review_checklist_v1', []);

  const criticalFlags = useMemo(() => flags.filter(flag => flag.severity === 'high' || flag.severity === 'critical').slice(0, 3), [flags]);
  const tracker = useMemo(() => {
    try {
      return buildDeadlineTracker(fields as CreditFields);
    } catch {
      return null;
    }
  }, [fields]);

  const deadlines = tracker?.countdowns.filter(item => item.daysRemaining <= 30 && !item.isExpired) || [];

  const totalEvidence = Array.from(new Set(flags.flatMap(flag => flag.suggestedEvidence))).length;
  const checkedEvidence = Object.keys(discoveryAnswers).filter(key => key.startsWith('ev-') && discoveryAnswers[key] === 'checked').length;
  const readiness = totalEvidence > 0 ? Math.round((checkedEvidence / totalEvidence) * 100) : 0;

  useEffect(() => {
    if (tasks.length > 0) return;
    const baseline: ReviewTask[] = [
      { id: 'review-violations', label: 'Verify high-severity forensic markers', done: false },
      { id: 'update-deadlines', label: 'Validate institutional response windows', done: false },
      { id: 'verify-fields', label: 'Audit workbench data integrity (DOFD/Status)', done: false },
      { id: 'prep-docs', label: 'Initiate Document Forge for final extraction', done: false }
    ];
    setTasks(baseline);
  }, [setTasks, tasks.length]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, done: !task.done } : task));
  };

  const completedTasks = tasks.filter(t => t.done).length;

  return (
    <div className="fade-in space-y-12 pb-32">
      {/* Mission Control Header */}
      <div className="relative p-1 rounded-[3.5rem] bg-gradient-to-br from-emerald-800 to-slate-950 overflow-hidden shadow-3xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] -mr-80 -mt-80" />
        <div className="relative z-10 p-12 bg-slate-950/90 rounded-[3.3rem] backdrop-blur-3xl border border-white/5">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                            <Radiation size={12} className="text-emerald-400" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-emerald-400 font-mono">Case Deployment Portal</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Final Protocol Review</span>
                    </div>
                    <h2 className="text-6xl font-black text-white tracking-tight mb-8 leading-tight">
                        Mission <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Readiness Node</span>
                    </h2>
                    
                    <div className="flex items-center gap-12">
                         <div className="space-y-1">
                             <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Archive Integrity</p>
                             <p className="text-3xl font-black text-white font-mono tracking-tighter">
                                {readiness}<span className="text-xl text-emerald-500">%</span>
                             </p>
                         </div>
                         <div className="h-12 w-px bg-slate-800" />
                         <div className="space-y-1">
                             <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Task Execution</p>
                             <p className="text-3xl font-black text-white font-mono tracking-tighter">{completedTasks}/{tasks.length}</p>
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 relative">
                    {[
                        { label: 'Violations', tab: 'violations', icon: AlertTriangle, color: 'text-rose-500' },
                        { label: 'Deadlines', tab: 'deadlines', icon: Clock, color: 'text-blue-500' },
                        { label: 'Evidence', tab: 'discovery', icon: FileSearch, color: 'text-emerald-500' },
                        { label: 'Doc Forge', tab: 'lettereditor', icon: Rocket, color: 'text-amber-500' }
                    ].map((btn, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(btn.tab as TabId)}
                            className="bg-slate-900/50 border border-white/5 hover:border-emerald-500/30 p-8 rounded-[2.5rem] text-left transition-all duration-500 group relative overflow-hidden backdrop-blur-xl"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                 <btn.icon size={80} />
                            </div>
                            <div className={cn("w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", btn.color)}>
                                <btn.icon size={24} />
                            </div>
                            <p className="text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] flex items-center justify-between font-mono">
                                {btn.label}
                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
            {/* Tactical Briefing Ledger */}
            <div className="flex items-center justify-between px-4">
                <h3 className="text-2xl font-black text-white flex items-center gap-4">
                    <span className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    Forensic Briefing Ledger
                </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="p-10 rounded-[3rem] bg-slate-950 border border-rose-500/20 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Radiation size={100} className="text-rose-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 font-mono">High Impact Markers</h4>
                            <span className="text-[10px] font-black text-slate-500 font-mono tracking-widest uppercase italic">Tier-1</span>
                        </div>
                        <div className="space-y-4">
                            {criticalFlags.length === 0 ? (
                                 <p className="text-slate-500 text-xs font-medium italic">No critical anomalies detected in current archive.</p>
                            ) : (
                                criticalFlags.map((flag, idx) => (
                                    <div key={idx} className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-rose-500/20 transition-colors cursor-default">
                                        <p className="text-sm font-black text-white leading-tight mb-2 tracking-tight group-hover:text-rose-400 transition-colors uppercase">{flag.ruleName}</p>
                                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed italic font-medium">"{flag.explanation}"</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-10 rounded-[3rem] bg-slate-950 border border-blue-500/20 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Clock size={100} className="text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 font-mono">Institutional Watch</h4>
                            <span className="text-[10px] font-black text-slate-500 font-mono tracking-widest uppercase italic">30D Matrix</span>
                        </div>
                        <div className="space-y-4">
                            {deadlines.length === 0 ? (
                                <p className="text-slate-500 text-xs font-medium italic">All institutional windows currently dormant.</p>
                            ) : (
                                deadlines.slice(0, 3).map((deadline, idx) => (
                                    <div key={idx} className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-blue-500/20 transition-colors cursor-default">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-sm font-black text-white tracking-tight uppercase group-hover:text-blue-400 transition-colors">{deadline.label}</p>
                                            <span className="text-[10px] font-black text-blue-500 tabular-nums font-mono tracking-widest">T-{deadline.daysRemaining}D</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">EXP: {deadline.targetDate.toLocaleDateString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Execution Manifest */}
            <div className="p-12 rounded-[3.5rem] bg-slate-950 border border-emerald-500/10 relative overflow-hidden shadow-3xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 -rotate-12">
                     <Terminal size={160} className="text-emerald-500" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                         <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                <ListTodo size={28} className="text-white" />
                            </div>
                            Tactical Execution Manifest
                        </h3>
                        <div className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest font-mono italic">Sequence Verified</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {tasks.map((task) => (
                            <button
                                key={task.id}
                                onClick={() => toggleTask(task.id)}
                                className={cn(
                                    "p-8 rounded-[2.5rem] border text-left transition-all duration-500 group relative overflow-hidden flex items-center gap-6",
                                    task.done 
                                        ? "bg-emerald-500/5 border-emerald-500/30" 
                                        : "bg-slate-900/50 border-white/5 hover:border-emerald-500/30"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-500",
                                    task.done 
                                        ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" 
                                        : "bg-black/40 border-slate-800 text-slate-700 group-hover:border-emerald-500/30"
                                )}>
                                    <CheckCircle2 size={20} className={cn("transition-transform duration-500", task.done ? "scale-100" : "scale-0 rotate-90")} />
                                </div>
                                <span className={cn(
                                    "text-lg font-bold transition-all duration-500 tracking-tight",
                                    task.done ? "text-emerald-400 opacity-60" : "text-slate-300"
                                )}>
                                    {task.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
            <div className="p-12 rounded-[3.5rem] bg-gradient-to-br from-indigo-900 to-slate-950 border border-white/5 relative overflow-hidden group shadow-3xl min-h-[600px] flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <Trophy size={160} className="text-white" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-12">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                            <Fingerprint size={32} className="text-white" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono mb-1">Authenticated</p>
                            <h4 className="text-2xl font-black text-white tracking-tight uppercase">Master Advisory</h4>
                         </div>
                    </div>

                    <p className="text-xl text-slate-300 leading-relaxed font-medium mb-12 italic">
                        The current archive demonstrates <span className="text-white font-bold">systemic structural failures</span>. All preliminary tactical markers have been verified to 94% forensic certainty.
                    </p>

                    <div className="space-y-6">
                         {[
                            { label: 'Neural Matching', val: 'Match' },
                            { label: 'Transmission Code', val: 'Verified' },
                            { label: 'Statutory Vector', val: 'High' }
                         ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">{item.label}</span>
                                <span className="text-[11px] font-black text-white uppercase tracking-tighter">{item.val}</span>
                             </div>
                         ))}
                    </div>
                </div>

                <div className="relative z-10 mt-12">
                    <button 
                        onClick={() => setActiveTab('lettereditor')}
                        className="w-full py-6 bg-white text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-emerald-400 hover:text-white transition-all shadow-2xl active:scale-95 transform flex items-center justify-center gap-4"
                    >
                        Initialize Forge <Zap size={16} />
                    </button>
                    <p className="text-center text-[9px] font-black text-slate-600 uppercase tracking-widest mt-6 italic">Protocol 04.99 // Secure Handshake</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewMissionTab;
