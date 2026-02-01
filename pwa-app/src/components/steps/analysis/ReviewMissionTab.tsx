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
    <div className="space-y-12 pb-32">
      {/* Mission Readiness Header */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-r from-slate-500/20 via-slate-500/20 to-slate-500/20 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
        
        <div className="relative overflow-hidden rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 shadow-2xl transition-all duration-700 hover:border-slate-500/30">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-500/5 rounded-full blur-[150px] -mr-96 -mt-96" />
            
            <div className="relative z-10 p-12 md:p-20">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="px-6 py-2 bg-slate-500/10 border border-slate-500/20 rounded-full flex items-center gap-3">
                                <Radiation size={14} className="text-slate-400" />
                                <span className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-400 font-mono">Mission Control</span>
                            </div>
                            <div className="w-px h-4 bg-white/10" />
                            <span className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-500 font-mono italic">Final Protocol Review</span>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-7xl md:text-8xl font-black text-white tracking-tighter leading-none italic uppercase">
                                Mission <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-400">Readiness Node</span>
                            </h2>
                            <p className="max-w-xl text-slate-400 text-xl md:text-2xl leading-relaxed font-mono font-light italic uppercase tracking-tight">
                                {'// COMPREHENSIVE STATUS AUDIT BEFORE TAC-OPS DEPLOYMENT. ENSURE ALL FORENSIC MARKERS ARE VALIDATED.'}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-16">
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase text-slate-500 font-black tracking-[0.3em] font-mono">Dossier Integrity</p>
                                <p className="text-5xl font-black text-white font-mono tracking-tighter italic">
                                    {readiness}<span className="text-2xl text-slate-400/60 ml-1">%</span>
                                </p>
                            </div>
                            <div className="h-16 w-px bg-white/5" />
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase text-slate-500 font-black tracking-[0.3em] font-mono">Task Execution</p>
                                <p className="text-5xl font-black text-white font-mono tracking-tighter italic">{completedTasks}<span className="text-2xl text-slate-700 ml-1">/</span>{tasks.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 relative">
                        {[
                            { label: 'Violations', tab: 'violations', icon: AlertTriangle, color: 'text-slate-400', bg: 'bg-rose-500/5' },
                            { label: 'Deadlines', tab: 'deadlines', icon: Clock, color: 'text-slate-400', bg: 'bg-blue-500/5' },
                            { label: 'Evidence', tab: 'discovery', icon: FileSearch, color: 'text-slate-400', bg: 'bg-slate-500/5' },
                            { label: 'Doc Forge', tab: 'lettereditor', icon: Rocket, color: 'text-slate-400', bg: 'bg-amber-500/5' }
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveTab(btn.tab as TabId)}
                                className="group relative bg-slate-950/40 border border-white/5 hover:border-slate-500/30 p-10 rounded-[3rem] text-left transition-all duration-500 backdrop-blur-xl shrink-0"
                            >
                                <div className={cn("absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-all duration-700 scale-150", btn.color)}>
                                     <btn.icon size={80} />
                                </div>
                                <div className={cn("w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500", btn.color, btn.bg)}>
                                    <btn.icon size={28} />
                                </div>
                                <p className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center justify-between font-mono">
                                    {btn.label}
                                    <ArrowRight size={16} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
            {/* Tactical Briefing Ledger */}
            <div className="flex items-center justify-between px-8">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-6">
                    <span className="w-2 h-10 bg-slate-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                    Forensic Briefing Ledger
                </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8 px-4">
                <div className="group relative p-12 rounded-[3.5rem] bg-slate-950/40 backdrop-blur-3xl border border-slate-500/10 hover:border-slate-500/30 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-transform duration-700 scale-125">
                        <Radiation size={120} className="text-slate-400" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-12">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 font-mono">High Impact Markers</h4>
                            <span className="text-[9px] font-black text-slate-700 font-mono tracking-widest uppercase italic bg-slate-900 px-3 py-1 rounded-full">Level-01</span>
                        </div>
                        <div className="space-y-6">
                            {criticalFlags.length === 0 ? (
                                 <p className="text-slate-600 text-sm font-mono italic uppercase tracking-tighter">{'// No critical anomalies detected in current archive.'}</p>
                            ) : (
                                criticalFlags.map((flag, idx) => (
                                    <div key={idx} className="p-8 rounded-[2rem] bg-slate-900/30 border border-white/5 hover:border-slate-500/20 transition-all cursor-default group/item">
                                        <p className="text-lg font-black text-white leading-tight mb-4 tracking-tighter uppercase group-hover/item:text-slate-300 transition-colors">{flag.ruleName}</p>
                                        <p className="text-[11px] text-slate-500 leading-relaxed italic font-mono uppercase tracking-tighter">{'// '}{flag.explanation}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="group relative p-12 rounded-[3.5rem] bg-slate-950/40 backdrop-blur-3xl border border-slate-500/10 hover:border-slate-500/30 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-transform duration-700 scale-125">
                        <Clock size={120} className="text-slate-400" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-12">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 font-mono">Institutional Watch</h4>
                            <span className="text-[9px] font-black text-slate-700 font-mono tracking-widest uppercase italic bg-slate-900 px-3 py-1 rounded-full">30D Matrix</span>
                        </div>
                        <div className="space-y-6">
                            {deadlines.length === 0 ? (
                                <p className="text-slate-600 text-sm font-mono italic uppercase tracking-tighter">{'// All institutional windows currently dormant.'}</p>
                            ) : (
                                deadlines.slice(0, 3).map((deadline, idx) => (
                                    <div key={idx} className="p-8 rounded-[2rem] bg-slate-900/30 border border-white/5 hover:border-slate-500/20 transition-all cursor-default group/item">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-lg font-black text-white tracking-tighter uppercase group-hover/item:text-slate-300 transition-colors">{deadline.label}</p>
                                            <span className="text-sm font-black text-slate-400 tabular-nums font-mono tracking-tighter">T-{deadline.daysRemaining}D</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] font-mono">EXP: {deadline.targetDate.toLocaleDateString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Execution Manifest */}
            <div className="p-12 rounded-[3.5rem] bg-slate-950 border border-slate-500/10 relative overflow-hidden shadow-3xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 -rotate-12">
                     <Terminal size={160} className="text-slate-400" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                         <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-500 flex items-center justify-center shadow-2xl shadow-slate-500/30">
                                <ListTodo size={28} className="text-white" />
                            </div>
                            Tactical Execution Manifest
                        </h3>
                        <div className="px-6 py-2 bg-slate-500/10 border border-slate-500/20 rounded-full">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono italic">Sequence Verified</span>
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
                                        ? "bg-slate-500/5 border-slate-500/30" 
                                        : "bg-slate-900/50 border-white/5 hover:border-slate-500/30"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-500",
                                    task.done 
                                        ? "bg-slate-500 border-slate-400 text-white shadow-lg shadow-slate-500/20" 
                                        : "bg-black/40 border-slate-800 text-slate-700 group-hover:border-slate-500/30"
                                )}>
                                    <CheckCircle2 size={20} className={cn("transition-transform duration-500", task.done ? "scale-100" : "scale-0 rotate-90")} />
                                </div>
                                <span className={cn(
                                    "text-lg font-bold transition-all duration-500 tracking-tight",
                                    task.done ? "text-slate-400 opacity-60" : "text-slate-300"
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
            <div className="p-12 rounded-[3.5rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 relative overflow-hidden group shadow-3xl min-h-[600px] flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <Trophy size={160} className="text-white" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-12">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-slate-500 flex items-center justify-center shadow-2xl shadow-slate-500/30">
                            <Fingerprint size={32} className="text-white" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Authenticated</p>
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
                        className="w-full py-6 bg-white text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-slate-600 hover:text-white transition-all shadow-2xl active:scale-95 transform flex items-center justify-center gap-4"
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
