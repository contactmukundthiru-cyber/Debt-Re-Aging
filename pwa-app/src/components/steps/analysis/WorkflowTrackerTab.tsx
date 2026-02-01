'use client';

import React, { useState, useEffect } from 'react';
import {
    getWorkflowStatus,
    initializeDisputeWorkflow,
    updateWorkflowStep,
    DisputeWorkflow,
    WorkflowStep
} from '../../../lib/dispute-workflow';

import { 
    Activity, 
    ArrowRight, 
    CheckCircle2, 
    Clock, 
    Cpu, 
    Fingerprint, 
    Flag, 
    GanttChartSquare, 
    History, 
    Info, 
    Layers, 
    MessageSquare, 
    Network, 
    Play, 
    Radio, 
    ShieldCheck, 
    Target, 
    Terminal, 
    Workflow, 
    Zap 
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkflowTrackerTabProps {
    caseId: string;
}

const WorkflowTrackerTab: React.FC<WorkflowTrackerTabProps> = ({ caseId }) => {
    const [workflow, setWorkflow] = useState<DisputeWorkflow | null>(null);

    useEffect(() => {
        const existing = getWorkflowStatus(caseId);
        if (existing) {
            setWorkflow(existing);
        } else {
            const ws = initializeDisputeWorkflow(caseId, 'experian', ['Unverifiable Data', 'Inaccurate Metadata']);
            setWorkflow(ws);
        }
    }, [caseId]);

    const handleStepComplete = (stepId: string) => {
        if (!workflow) return;
        const updated = updateWorkflowStep(caseId, stepId, 'completed');
        if (updated) setWorkflow(updated);
    };

    if (!workflow) return null;

    const completedCount = workflow.steps.filter(s => s.status === 'completed').length;
    const progress = Math.round((completedCount / workflow.steps.length) * 100);

    return (
        <div className="fade-in space-y-20 pb-32">
            {/* ELITE_MISSION_CONTROL_HERO::STRATEGIC_SEQUENCE */}
            <section className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/30 via-blue-500/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
                    
                    <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
                        <div className="lg:col-span-7">
                             <div className="flex items-center gap-6 mb-12">
                                <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-3">
                                    <Target size={14} className="text-indigo-400 animate-pulse" />
                                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-indigo-400 font-mono">Mission Sequence Alpha</span>
                                </div>
                                <div className="h-px w-10 bg-slate-800" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Phase: {workflow.currentPhase.replace('_', ' ').toUpperCase()}</span>
                            </div>

                            <h2 className="text-7xl font-black text-white tracking-tighter mb-10 leading-[0.9] italic uppercase font-mono">
                                Mission <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 tracking-[-0.05em]">LIFECYCLE</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-xl font-medium italic border-l-2 border-indigo-500/30 pl-8">
                                Synthesizing statutory milestones, institutional deadlines, and adversarial transmission protocols into a single, kinetic mission trajectory.
                            </p>
                            
                            <div className="flex items-center gap-16">
                                 <div className="group/stat">
                                     <p className="text-[9px] uppercase text-slate-500 font-black tracking-[0.5em] font-mono mb-3">MISSION_ID</p>
                                     <div className="flex items-baseline gap-3">
                                        <p className="text-2xl font-black text-white font-mono tracking-tighter drop-shadow-2xl uppercase italic">CAS_{caseId.slice(0, 8)}</p>
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                     </div>
                                 </div>
                                 <div className="h-16 w-px bg-slate-800" />
                                 <div className="group/stat">
                                     <p className="text-[9px] uppercase text-slate-500 font-black tracking-[0.5em] font-mono mb-3">SEQUENCE_STATUS</p>
                                     <p className="text-5xl font-black text-indigo-400 font-mono tracking-tighter italic">KINETIC</p>
                                 </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 relative group/readiness">
                             <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-[3rem] blur-sm opacity-50 group-hover/readiness:opacity-100 transition-all" />
                             <div className="relative bg-slate-900/20 border border-white/10 p-12 rounded-[3.5rem] backdrop-blur-3xl shadow-inner min-h-[340px] flex flex-col justify-center overflow-hidden">
                                 <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Activity size={120} />
                                 </div>
                                 <div className="space-y-10 relative z-10">
                                     <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] font-mono">Trajectory_Completion</h4>
                                        <Zap size={16} className="text-indigo-500 animate-bounce" />
                                     </div>
                                     <div className="flex items-baseline gap-4">
                                        <span className="text-9xl font-black text-white font-mono tracking-tighter leading-none">{progress}</span>
                                        <span className="text-3xl font-black text-slate-600 font-mono">%</span>
                                     </div>
                                     <div className="h-4 w-full bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className="h-full bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400 shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                                        />
                                     </div>
                                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] text-center italic leading-relaxed">
                                        Mission progress is indexed against federal statutory response windows.
                                     </p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid lg:grid-cols-12 gap-16">
                {/* SEQUENTIAL_NODE_MATRIX */}
                <div className="lg:col-span-8 space-y-16">
                    <div className="flex items-center justify-between mb-4 px-4">
                        <div className="flex items-center gap-8">
                            <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xl">
                                <Workflow size={28} />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">Node Trajectory</h4>
                                <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold mt-1">SLA_Response_Compliance_Log</p>
                            </div>
                        </div>
                        <div className="px-6 py-2 bg-slate-900/50 border border-white/5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 font-mono italic animate-pulse">
                            Realtime_Sync
                        </div>
                    </div>

                    <div className="relative space-y-10 before:absolute before:left-[47px] before:top-20 before:bottom-20 before:w-px before:bg-gradient-to-b before:from-indigo-500/50 before:via-blue-500/20 before:to-transparent">
                        {workflow.steps.map((step, idx) => {
                             const isCompleted = step.status === 'completed';
                             const isInProgress = step.status === 'in_progress';
                             const isOverdue = step.status === 'overdue';

                             return (
                                <motion.div 
                                    key={step.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="relative pl-24 group"
                                >
                                    {/* NODE_MARKER */}
                                    <div className={cn(
                                        "absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl border-2 flex items-center justify-center z-20 transition-all duration-700 shadow-2xl skew-x-3",
                                        isCompleted ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] rotate-3" :
                                        isInProgress ? "bg-blue-500 border-blue-400 text-white animate-pulse" :
                                        isOverdue ? "bg-rose-600 border-rose-400 text-white shadow-[0_0_20px_rgba(225,29,72,0.5)]" :
                                        "bg-slate-950 border-white/10 text-slate-700"
                                    )}>
                                        {isCompleted ? <CheckCircle2 size={24} /> : <span className="text-xs font-black font-mono">{String(idx + 1).padStart(2, '0')}</span>}
                                    </div>

                                    <div className={cn(
                                        "relative overflow-hidden rounded-[3.5rem] border transition-all duration-700 p-10 xl:p-12",
                                        isCompleted ? "bg-slate-900/40 border-indigo-500/20 shadow-2xl" :
                                        isInProgress ? "bg-slate-900/80 border-blue-500/40 shadow-[0_40px_80px_rgba(0,0,0,0.5)] scale-[1.02] z-10" :
                                        "bg-slate-950/20 border-white/5 opacity-60 hover:opacity-100"
                                    )}>
                                        {/* BACKGROUND_ID */}
                                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none select-none">
                                            <span className="text-9xl font-black font-mono tracking-tighter">NODE_{idx + 1}</span>
                                        </div>

                                        <div className="relative z-10 space-y-8">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest font-mono italic">Sequence_Step_{idx + 1}</span>
                                                        <div className="h-px w-8 bg-indigo-500/20" />
                                                        {step.statutoryReference && (
                                                            <span className="text-[10px] font-mono text-slate-500 uppercase bg-black px-3 py-1 rounded-full border border-white/5">
                                                                REF::{step.statutoryReference}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{step.title}</h4>
                                                    <p className="text-lg text-slate-400 font-medium leading-relaxed italic">{step.description}</p>
                                                </div>

                                                {step.deadline && !isCompleted && (
                                                    <div className={cn(
                                                        "px-6 py-3 rounded-[1.5rem] border flex flex-col gap-1 shrink-0",
                                                        isOverdue ? "bg-rose-500/10 border-rose-500/20" : "bg-blue-500/5 border-white/5"
                                                    )}>
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Response_Deadline</span>
                                                        <div className="flex items-center gap-3">
                                                            <Clock size={14} className={isOverdue ? "text-rose-500" : "text-blue-500"} />
                                                            <span className={cn("text-sm font-black font-mono", isOverdue ? "text-rose-500" : "text-white")}>{new Date(step.deadline).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-6 pt-4">
                                                {!isCompleted ? (
                                                    <button
                                                        onClick={() => handleStepComplete(step.id)}
                                                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center gap-4 transition-all shadow-4xl hover:scale-105 group/btn"
                                                    >
                                                        <span>INITIALIZE_COMPLETION</span>
                                                        <Play size={14} className="group-hover/btn:translate-x-1" />
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-4 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                                        <ShieldCheck className="text-emerald-500" size={16} />
                                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest font-mono">
                                                            Authenticated_{new Date(step.completedAt!).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}

                                               <div className="flex -space-x-3 ml-auto opacity-40 group-hover:opacity-100 transition-opacity">
                                                    {[Cpu, Fingerprint, Network].map((Icon, i) => (
                                                        <div 
                                                            key={i} 
                                                            className={cn(
                                                                "w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-slate-600 shadow-2xl transition-transform hover:scale-110",
                                                                i === 0 ? "z-[3]" : i === 1 ? "z-[2]" : "z-[1]"
                                                            )}
                                                        >
                                                            <Icon size={16} />
                                                        </div>
                                                    ))}
                                               </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                             );
                        })}
                    </div>
                </div>

                {/* MISSION_STAKEHOLDERS_SIDEBAR */}
                <div className="lg:col-span-4 space-y-16">
                     <div className="relative group/comm">
                        <div className="absolute -inset-1 bg-gradient-to-b from-blue-500/20 to-transparent rounded-[4rem] blur-xl opacity-30 group-hover/comm:opacity-60 transition duration-700" />
                        <div className="relative p-12 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                            <div className="flex items-center justify-between mb-12">
                                <h3 className="text-2xl font-black text-white tracking-tighter flex items-center gap-6 uppercase italic">
                                    <Radio size={32} className="text-blue-500 group-hover/comm:animate-pulse" />
                                    Comm Tracker
                                </h3>
                                <div className="w-10 h-1 gap-1 flex">
                                    <div className="flex-1 bg-blue-500 animate-pulse" />
                                    <div className="flex-1 bg-blue-500/20" />
                                    <div className="flex-1 bg-blue-500/20" />
                                </div>
                            </div>
                            
                            <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                                {workflow.communications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-20">
                                        <MessageSquare size={64} className="mb-6" />
                                        <p className="text-[10px] font-black uppercase tracking-widest font-mono">No_Transmissions_Logged</p>
                                    </div>
                                ) : (
                                    workflow.communications.map((comm, idx) => (
                                        <div key={idx} className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 hover:border-blue-500/30 transition-all group/item relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] rotate-12 group-hover/item:rotate-0 transition-transform">
                                                <History size={60} />
                                            </div>
                                            <div className="relative z-10 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono italic">
                                                            {comm.direction.toUpperCase()} :: {comm.method.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="text-[8px] font-mono text-slate-700">{new Date(comm.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <h5 className="text-xl font-black text-white italic transition-colors group-hover/item:text-blue-400 uppercase tracking-tight">{comm.subject}</h5>
                                                {comm.trackingNumber && (
                                                    <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
                                                       <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest font-mono">Protocol_ID</span>
                                                       <span className="text-[10px] font-black text-white font-mono">{comm.trackingNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button className="relative z-10 w-full mt-10 py-6 bg-blue-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-blue-500 transition-all shadow-3xl active:scale-95 transform group/btn">
                                LOG_NEW_TRANSMISSION <ArrowRight size={16} className="group-hover/btn:translate-x-1" />
                            </button>
                        </div>
                     </div>

                     <div className="p-12 rounded-[4rem] bg-gradient-to-br from-indigo-700 to-slate-950 border border-indigo-500/30 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[400px] group/enf transition-all duration-1000">
                        <div className="absolute top-0 right-0 p-12 opacity-10 scale-[2.2] rotate-12 group-hover/enf:rotate-0 group-hover/enf:scale-[2.5] transition-transform duration-1000 ease-out">
                             <GanttChartSquare size={200} className="text-indigo-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-18 h-18 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-10 shadow-3xl border border-white/20 group-hover/enf:scale-110 transition-transform">
                                <Layers size={36} className="text-indigo-400" />
                            </div>
                            <h4 className="text-4xl font-black text-white tracking-tighter uppercase mb-4 italic leading-none">Strategic<br/>Forecasting</h4>
                            <p className="text-lg text-slate-300 leading-relaxed font-bold italic pr-6 group-hover:text-white transition-colors uppercase tracking-tight">
                                Analyzing mission trajectory variance to predict institutional settlement probability in next temporal window.
                            </p>
                        </div>
                        <div className="relative z-10 grid grid-cols-2 gap-4 mt-10 pt-10 border-t border-white/5">
                             <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono">Predicted_Halt</span>
                                <p className="text-2xl font-black text-indigo-400 font-mono tracking-tighter">14_DAYS</p>
                             </div>
                             <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono">Risk_Index</span>
                                <p className="text-2xl font-black text-rose-500 font-mono tracking-tighter">LOW_LVL</p>
                             </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowTrackerTab;
