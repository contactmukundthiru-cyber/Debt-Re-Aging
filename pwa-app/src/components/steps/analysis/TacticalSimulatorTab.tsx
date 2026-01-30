'use client';

import React, { useMemo } from 'react';
import { simulateAdversarialLogic, SimulationResult } from '../../../lib/adversarial';
import { RuleFlag, RiskProfile } from '../../../lib/rules';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    ShieldAlert, 
    Cpu, 
    Network, 
    FileText, 
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    ChevronRight,
    Terminal,
    Target,
    Activity
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TacticalSimulatorTabProps {
    flags: RuleFlag[];
    riskProfile: RiskProfile;
}

const TacticalSimulatorTab: React.FC<TacticalSimulatorTabProps> = ({ flags, riskProfile }) => {
    const simulation = useMemo(() => simulateAdversarialLogic(flags, riskProfile), [flags, riskProfile]);

    return (
        <div className="fade-in space-y-12 pb-32">
            {/* Elite Tactical Header */}
            <div className="relative p-1 rounded-[3.5rem] bg-gradient-to-br from-blue-900 to-slate-950 overflow-hidden shadow-3xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] -mr-64 -mt-64" />
                <div className="relative z-10 p-12 bg-slate-950/90 rounded-[3.3rem] backdrop-blur-3xl border border-white/5">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2">
                                    <Activity size={12} className="text-blue-400" />
                                    <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-blue-400 font-mono">Institutional Waveform Simulator</span>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Adversarial Outcome Modeling</span>
                            </div>
                            <h2 className="text-6xl font-black text-white tracking-tight mb-8 leading-tight">
                                Outcome <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Forecasting</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-xl font-medium">
                                Modeling the internal decision vectors that financial institutions navigate when encountering high-fidelity forensic data collisions.
                            </p>
                            
                            <div className="flex items-center gap-12">
                                 <div className="space-y-1">
                                     <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Compliance Load</p>
                                     <p className="text-5xl font-black text-white font-mono tracking-tighter">
                                        {simulation.institutionalCompliancePressure}<span className="text-xl text-blue-500">/100</span>
                                     </p>
                                 </div>
                                 <div className="h-12 w-px bg-slate-800" />
                                 <div className="space-y-1">
                                     <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Mitigation Index</p>
                                     <p className="text-5xl font-black text-emerald-400 font-mono tracking-tighter">{simulation.internalRiskMitigationScore}</p>
                                 </div>
                            </div>
                        </div>

                        <div className="relative group">
                             <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
                             <div className="relative bg-black/40 border border-white/10 p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl overflow-hidden min-h-[400px] flex flex-col justify-center">
                                 <div className="space-y-10">
                                     <div className="p-8 bg-slate-900/50 border border-white/5 rounded-[2rem]">
                                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 font-mono">Primary Tactical Vector</p>
                                         <p className="text-3xl font-black text-white tracking-tight uppercase group-hover:text-blue-400 transition-colors">
                                            {simulation.tactic.replace('_', ' ')}
                                         </p>
                                     </div>
                                     <div className="grid grid-cols-2 gap-4">
                                         <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5 text-center">
                                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Efficacy</p>
                                             <p className="text-2xl font-black text-emerald-400 uppercase tracking-tighter">High</p>
                                         </div>
                                         <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5 text-center">
                                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Velocity</p>
                                             <p className="text-2xl font-black text-blue-400 uppercase tracking-tighter">32ms</p>
                                         </div>
                                     </div>
                                     <button className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 transform">
                                        <Target size={16} /> Engrave Strategy
                                     </button>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategic Trajectory Matrix */}
            <div className="space-y-10">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-4">
                        <span className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        Forensic Response Trajectory
                    </h3>
                    <div className="flex items-center gap-4">
                         <div className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 font-mono">
                            <Terminal size={12} className="text-blue-500" /> SEQUENCE_ACTIVE
                         </div>
                    </div>
                </div>

                <div className="grid gap-12 relative">
                    <div className="absolute left-[47px] top-10 bottom-10 w-px bg-gradient-to-b from-blue-500 via-slate-800 to-transparent hidden lg:block" />
                    
                    <AnimatePresence>
                        {simulation.pathOfLeastResistance.map((node, i) => (
                            <motion.div
                                key={node.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative flex flex-col lg:flex-row items-start gap-10 group"
                            >
                                {/* Response Node */}
                                <div className={cn(
                                    "relative z-10 w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 border-2 transition-all duration-700",
                                    node.outcome === 'delete' 
                                        ? "bg-emerald-500 border-emerald-400 shadow-2xl shadow-emerald-500/40 text-white" 
                                        : node.outcome === 'human_review'
                                            ? "bg-blue-600 border-blue-400 shadow-2xl shadow-blue-600/40 text-white"
                                            : "bg-slate-900 border-white/10 text-slate-400"
                                )}>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black opacity-60 mb-1 leading-none uppercase">Step</p>
                                        <p className="text-3xl font-black font-mono">0{i + 1}</p>
                                    </div>
                                </div>

                                {/* Node Details Card */}
                                <div className="flex-grow pt-2 w-full">
                                    <div className="p-10 rounded-[3rem] bg-slate-950 border border-white/5 hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden backdrop-blur-xl shadow-2xl">
                                        <div className="absolute top-0 right-0 p-8 flex gap-4">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">Certainty</p>
                                                <p className="text-2xl font-black text-white font-mono">{node.probability}%</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mb-6">
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                node.outcome === 'delete' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                                            )}>
                                                {node.outcome.replace('_', ' ')}
                                            </div>
                                            <span className="w-1 h-1 bg-slate-800 rounded-full" />
                                            <span className="text-[10px] font-black text-slate-500 font-mono tracking-widest uppercase">NODE::{node.id}</span>
                                        </div>

                                        <h4 className="text-2xl font-black text-white mb-6 tracking-tight group-hover:text-blue-400 transition-colors">
                                            {node.label}
                                        </h4>
                                        <p className="text-slate-400 text-lg leading-relaxed font-medium italic opacity-80 group-hover:opacity-100 transition-opacity border-l-2 border-slate-800 pl-6 mb-10">
                                            "{node.reasoning}"
                                        </p>

                                        {node.counterTactic && (
                                            <div className="p-8 rounded-[2.5rem] bg-slate-900/50 border border-white/5 flex flex-col sm:flex-row gap-8 items-center cursor-default hover:bg-slate-900 transition-colors">
                                                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-lg">
                                                    <Zap size={28} className="text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] font-mono mb-2">Institutional Counter-Measure</p>
                                                    <p className="text-white font-bold text-lg leading-tight uppercase tracking-tight">{node.counterTactic}</p>
                                                </div>
                                                <ChevronRight className="ml-auto text-slate-800" size={24} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Simulation Key Metrics */}
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { icon: ShieldAlert, label: 'Liability Exposure', val: 'CRITICAL', color: 'rose', sub: 'Non-compliance threshold reached.' },
                    { icon: Network, label: 'Algorithmic Match', val: 'e-OSCAR Logic', color: 'indigo', sub: 'Matches automated filters.' },
                    { icon: FileText, label: 'Audit Readiness', val: 'HIGH FIDELITY', color: 'emerald', sub: 'Data verified for submission.' },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-950 border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-[40px] -mr-12 -mt-12 group-hover:bg-${stat.color}-500/10 transition-all`} />
                        <stat.icon size={28} className={`text-${stat.color}-500 mb-8`} />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">{stat.label}</p>
                        <p className="text-3xl font-black text-white tracking-tighter mb-4">{stat.val}</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{stat.sub}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TacticalSimulatorTab;
