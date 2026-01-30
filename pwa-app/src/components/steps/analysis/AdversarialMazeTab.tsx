'use client';

import React, { useMemo } from 'react';
import { simulateAdversarialLogic, DecisionNode } from '../../../lib/adversarial';
import { RuleFlag, RiskProfile } from '../../../lib/rules';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    ShieldAlert, 
    Cpu, 
    Binary, 
    Lock, 
    Target, 
    ChevronRight,
    Sword,
    AlertCircle,
    Activity,
    Compass
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface AdversarialMazeTabProps {
    flags: RuleFlag[];
    riskProfile: RiskProfile;
}

const AdversarialMazeTab: React.FC<AdversarialMazeTabProps> = ({ flags, riskProfile }) => {
    const simulation = useMemo(() => simulateAdversarialLogic(flags, riskProfile), [flags, riskProfile]);

    return (
        <div className="fade-in space-y-12 pb-32">
            {/* Elite Terminal Header */}
            <div className="relative p-1 rounded-[3rem] bg-gradient-to-br from-indigo-800 to-slate-950 overflow-hidden shadow-3xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] -mr-64 -mt-64" />
                <div className="relative z-10 p-12 bg-slate-950/90 rounded-[2.8rem] backdrop-blur-xl border border-white/5">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
                                    <Cpu size={12} className="text-indigo-400" />
                                    <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-indigo-400 font-mono">Adversarial Logic Core v4.4</span>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Neural Path Simulation</span>
                            </div>
                            <h2 className="text-6xl font-black text-white tracking-tight mb-8 leading-tight">
                                Cognitive <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Tactical Maze</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-xl font-medium">
                                Simulating the internal decision trees of bureau automation. By engineering high-pressure data collisions, we force the algorithmic "Path of Least Resistance" to concede.
                            </p>
                            
                            <div className="flex items-center gap-12">
                                 <div className="space-y-1">
                                     <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Institutional Pressure</p>
                                     <p className="text-5xl font-black text-rose-500 font-mono tracking-tighter">
                                        {Math.round(simulation.institutionalCompliancePressure / 5)}<span className="text-xl"> LU</span>
                                     </p>
                                 </div>
                                 <div className="h-12 w-px bg-slate-800" />
                                 <div className="space-y-1">
                                     <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Bypass Probability</p>
                                     <p className="text-5xl font-black text-emerald-400 font-mono tracking-tighter">72%</p>
                                 </div>
                            </div>
                        </div>

                        <div className="relative group">
                             <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-700" />
                             <div className="relative bg-black/40 border border-white/10 p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl overflow-hidden min-h-[400px] flex flex-col justify-center">
                                 <div className="space-y-8">
                                     <div className="flex items-center gap-6">
                                         <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                            <Sword size={28} className="text-indigo-400" />
                                         </div>
                                         <div>
                                             <h4 className="text-xl font-black text-white uppercase tracking-tight">Current Vector</h4>
                                             <p className="text-indigo-400 text-[10px] font-mono font-black uppercase tracking-widest">{simulation.tactic.replace('_', ' ')}</p>
                                         </div>
                                     </div>
                                     <div className="p-6 bg-slate-950/50 border border-white/5 rounded-2xl font-mono text-[11px] leading-relaxed text-slate-400">
                                         <span className="text-indigo-500 font-bold">$ ANALYZING_VECTORS...</span><br/>
                                         Internal mitigation index at {Math.round(simulation.internalRiskMitigationScore)}. 
                                         Collision detected in automated verification layers. Recommend switching to high-velocity statutory escalation to maximize yield.
                                     </div>
                                     <button className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95 transform">
                                        <Lock size={16} /> Deploy Counter-Tactics
                                     </button>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulated Logic Path */}
            <div className="space-y-10">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-4">
                        <span className="w-1.5 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                        Probabilistic Execution Path
                    </h3>
                    <div className="flex items-center gap-4">
                         <div className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Activity size={12} className="text-indigo-500" /> Real-time Simulation
                         </div>
                    </div>
                </div>

                <div className="grid gap-8 relative">
                    <div className="absolute left-[47px] top-10 bottom-10 w-px bg-gradient-to-b from-indigo-500/50 via-slate-800 to-transparent hidden lg:block" />
                    
                    <AnimatePresence>
                        {simulation.pathOfLeastResistance.map((node, i) => (
                            <motion.div
                                key={node.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative flex flex-col lg:flex-row items-start gap-10 group"
                            >
                                {/* Sequence Node */}
                                <div className={cn(
                                    "relative z-10 w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 border-2 transition-all duration-700",
                                    node.outcome === 'delete' 
                                        ? "bg-emerald-500 border-emerald-400 shadow-2xl shadow-emerald-500/40 text-white" 
                                        : node.outcome === 'human_review'
                                            ? "bg-indigo-600 border-indigo-400 shadow-2xl shadow-indigo-600/40 text-white"
                                            : "bg-slate-900 border-white/10 text-slate-400"
                                )}>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black opacity-60 mb-1">NODE</p>
                                        <p className="text-3xl font-black font-mono">0{i + 1}</p>
                                    </div>
                                    
                                    {/* Link decoration */}
                                    <div className="absolute top-1/2 -right-4 w-4 h-px bg-indigo-500/30 hidden lg:block" />
                                </div>

                                {/* Node Data Card */}
                                <div className="flex-grow pt-2 w-full">
                                    <div className="p-10 rounded-[3rem] bg-slate-950 border border-white/5 hover:border-indigo-500/30 transition-all duration-500 group relative overflow-hidden backdrop-blur-xl">
                                        <div className="absolute top-0 right-0 p-8 flex gap-4">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Probability</p>
                                                <p className="text-xl font-black text-white font-mono">{node.probability}%</p>
                                            </div>
                                            {node.counterTactic && (
                                                <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                                                    <Zap size={12} className="text-amber-500" />
                                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Tactic Leveraged</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mb-6">
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                node.outcome === 'delete' ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"
                                            )}>
                                                {node.outcome.replace('_', ' ')} Phase
                                            </div>
                                            <span className="w-1 h-1 bg-slate-800 rounded-full" />
                                            <span className="text-[10px] font-black text-slate-500 font-mono tracking-widest uppercase italic">{node.id}</span>
                                        </div>

                                        <h4 className="text-2xl font-black text-white mb-4 tracking-tight group-hover:text-indigo-400 transition-colors">
                                            {node.label}
                                        </h4>
                                        <p className="text-slate-400 text-lg leading-relaxed font-medium italic opacity-80 group-hover:opacity-100 transition-opacity">
                                            "{node.reasoning}"
                                        </p>

                                        {node.counterTactic && (
                                            <div className="mt-8 pt-8 border-t border-white/5 flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                                    <Target size={18} className="text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Active Leverage / Counter-Tactic</p>
                                                    <p className="text-white font-bold">{node.counterTactic}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Strategic Summary */}
            <div className="p-12 rounded-[3.5rem] bg-indigo-600 text-white relative overflow-hidden shadow-3xl group">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] -mr-64 -mt-64 group-hover:bg-white/15 transition-all duration-700" />
                <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                                <Compass size={24} className="text-white" />
                            </div>
                            <h4 className="text-3xl font-black tracking-tight uppercase">Master Advisory</h4>
                        </div>
                        <p className="text-xl text-white/80 leading-relaxed font-medium">
                            Internal mitigation indices suggest that standard automated logic will verify this item. 
                            <span className="text-white font-bold"> To bypass the maze</span>, we recommend moving directly to a 
                            <span className="underline decoration-white/40 underline-offset-8 decoration-2 px-2 uppercase font-black text-white">Notice of Intent to Sue (NOI)</span> 
                            protocol. This leverages the 72% bypass probability by creating a high-priority institutional alert.
                        </p>
                    </div>
                    <div className="lg:col-span-4 bg-black/20 p-8 rounded-[2.5rem] backdrop-blur-xl border border-white/10 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-4 font-mono">Path Integrity</p>
                        <p className="text-6xl font-black mb-2 tabular-nums tracking-tighter">98.4<span className="text-2xl text-white/50">%</span></p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 italic">Simulated Certainty</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdversarialMazeTab;
