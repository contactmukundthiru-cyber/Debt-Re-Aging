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
        <div className="fade-in space-y-20 pb-40">
            {/* ELITE_AUDIT_HERO::ADVERSARIAL_LOGIC_MAZE */}
            <section className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-indigo-600/20 via-cyan-600/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
                    
                    <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
                        <div className="lg:col-span-8">
                             <div className="flex items-center gap-6 mb-8">
                                <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-3">
                                    <Cpu size={14} className="text-indigo-400 animate-pulse" />
                                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-indigo-400 font-mono">Cognitive Core v5.0</span>
                                </div>
                                <div className="h-px w-10 bg-slate-800" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Sync_Status::ACTIVE</span>
                            </div>

                            <h2 className="text-7xl lg:text-[7.5rem] font-black text-white tracking-tighter mb-10 leading-[0.85] italic uppercase font-mono">
                                Adversarial <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-500 to-blue-500 tracking-[-0.05em]">MAZE</span>
                            </h2>

                            <p className="text-2xl text-slate-400 leading-[1.4] font-bold italic tracking-tight max-w-2xl border-l-2 border-indigo-500/30 pl-12 mb-12">
                                Mapping <span className="text-white font-black">Algorithmic Decision Paths</span>. By simulating pressure on institutional verification layers, we identify the specific nodes where automation fails.
                            </p>

                            <div className="flex flex-wrap items-center gap-12 sm:gap-20 pt-10 border-t border-white/5">
                                 <div className="space-y-2">
                                     <p className="text-[10px] uppercase text-slate-600 font-black tracking-[0.5em] font-mono italic">Pressure_Load</p>
                                     <p className="text-5xl font-black text-white font-mono tracking-tighter italic">{Math.round(simulation.institutionalCompliancePressure / 5)}<span className="text-2xl text-slate-700">LU</span></p>
                                 </div>
                                 <div className="space-y-2">
                                     <p className="text-[10px] uppercase text-slate-600 font-black tracking-[0.5em] font-mono italic">Bypass_Prob</p>
                                     <p className="text-5xl font-black text-indigo-500 font-mono tracking-tighter italic">72%</p>
                                 </div>
                                 <div className="px-10 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono italic text-white flex items-center gap-4">
                                    <Binary size={18} className="text-indigo-400" />
                                    Logic_Engine::[ PROBABILISTIC ]
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 self-stretch">
                             <div className="h-full bg-slate-900 border border-white/10 p-12 rounded-[4rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden group/vector flex flex-col justify-center gap-10 text-center lg:text-left">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-[2.5] text-white rotate-12 pointer-events-none group-hover/vector:rotate-0 transition-transform duration-1000">
                                    <Sword size={100} />
                                </div>
                                <div className="relative z-10 space-y-8">
                                    <div className="flex flex-col lg:flex-row items-center gap-6">
                                        <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-4xl group-hover/vector:scale-110 transition-transform">
                                            <Sword size={32} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest font-mono italic mb-1">Tactical_Vector</p>
                                            <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter font-mono leading-none">{simulation.tactic.replace('_', ' ')}</h4>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-slate-950/80 rounded-[2.5rem] border border-white/5 font-mono text-sm leading-relaxed text-slate-500 italic">
                                        <span className="text-indigo-500 font-black">$ MONITORING_VECTORS...</span><br/>
                                        Internal risk mitigation index: [ {Math.round(simulation.internalRiskMitigationScore)} ]. Logic shift recommended to maximize institutional yield.
                                    </div>
                                    <button className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono italic hover:bg-indigo-500 transition-all shadow-4xl flex items-center justify-center gap-4">
                                        <Lock size={18} />
                                        Initialize_Counter_Tactics
                                    </button>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* LOGIC_PATH_MATRIX */}
            <div className="space-y-12">
                <div className="flex items-center justify-between px-10">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] font-mono italic flex items-center gap-4">
                        <Activity size={16} className="text-indigo-500" /> Probabilistic_Logic_Flow::ACTIVE
                    </h3>
                </div>

                <div className="grid gap-10 relative px-4">
                    <div className="absolute left-[67px] top-12 bottom-12 w-1 bg-gradient-to-b from-indigo-500/40 via-slate-800 to-transparent hidden lg:block rounded-full" />
                    
                    <AnimatePresence>
                        {simulation.pathOfLeastResistance.map((node, i) => (
                            <motion.div
                                key={node.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative flex flex-col lg:flex-row items-start gap-12 group/node"
                            >
                                {/* Node Sequence Beacon */}
                                <div className={cn(
                                    "relative z-10 w-28 h-28 rounded-[3rem] flex items-center justify-center shrink-0 border-2 transition-all duration-700",
                                    node.outcome === 'delete' 
                                        ? "bg-indigo-500 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.4)] text-white" 
                                        : node.outcome === 'human_review'
                                            ? "bg-cyan-600 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] text-white"
                                            : "bg-slate-950 border-white/10 text-slate-600 group-hover/node:border-indigo-500/50"
                                )}>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black opacity-60 font-mono tracking-widest mb-1 italic">NODE</p>
                                        <p className="text-4xl font-black font-mono italic tabular-nums leading-none">0{i + 1}</p>
                                    </div>
                                </div>

                                {/* Node Data Terminal */}
                                <div className="flex-grow pt-2 w-full">
                                    <div className="p-12 rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 hover:border-indigo-500/30 transition-all duration-700 relative overflow-hidden shadow-2xl">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none opacity-0 group-hover/node:opacity-100 transition-opacity" />

                                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10 pb-8 border-b border-white/5">
                                            <div className="flex items-center gap-6">
                                                <div className={cn(
                                                    "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] font-mono italic border",
                                                    node.outcome === 'delete' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                                )}>
                                                    {node.outcome.replace('_', ' ')}_PHASE
                                                </div>
                                                <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest italic uppercase">{node.id}</span>
                                            </div>
                                            <div className="flex items-center gap-10">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic mb-1 font-mono">NODE_CERTAINTY</p>
                                                    <p className="text-3xl font-black text-white font-mono italic tracking-tighter tabular-nums leading-none">{node.probability}%</p>
                                                </div>
                                                {node.counterTactic && (
                                                    <div className="px-5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                                                        <Zap size={14} className="text-amber-500" />
                                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest font-mono">TACTIC_DEPLOYED</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <h4 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter font-mono italic leading-none group-hover/node:text-indigo-400 transition-colors">
                                            {node.label}
                                        </h4>
                                        <p className="text-2xl text-slate-400 leading-relaxed font-bold italic tracking-tight mb-10 max-w-4xl opacity-80 group-hover/node:opacity-100 transition-opacity">
                                            "{node.reasoning}"
                                        </p>

                                        {node.counterTactic && (
                                            <div className="p-8 rounded-[3rem] bg-indigo-600/5 border border-indigo-500/20 flex items-start gap-8 group/lever transition-colors hover:bg-indigo-600/10">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0 shadow-2xl">
                                                    <Target size={24} className="text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] font-mono mb-2 italic">Active_Execution_Leverage</p>
                                                    <p className="text-xl text-white font-black italic uppercase tracking-tight">{node.counterTactic}</p>
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

            {/* ADVISORY_INTELLIGENCE_WRAPPER */}
            <div className="relative group/advisory p-16 rounded-[4.5rem] bg-slate-900 border border-white/10 shadow-4xl overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] -mr-96 -mt-96 pointer-events-none group-hover/advisory:bg-indigo-500/15 transition-all duration-1000" />
                
                <div className="relative z-10 grid lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-8 space-y-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-white/10 backdrop-blur-3xl flex items-center justify-center shadow-4xl border border-white/10">
                                <Compass size={32} className="text-white animate-spin-slow" />
                            </div>
                            <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic font-mono">Neural_Advisory</h4>
                        </div>
                        <p className="text-3xl text-slate-300 leading-[1.3] font-bold italic tracking-tight border-l-2 border-indigo-500/30 pl-16">
                            Execution matrix indicates that <span className="text-white font-black uppercase tracking-tighter underline decoration-indigo-500 decoration-4">Institutional Verification</span> is currently dominant. 
                            To achieve deletion, we must shift the pressure to the <span className="text-indigo-400 font-extrabold">Algorithmic Edge</span> by deploying a high-velocity Notice of Intent protocol.
                        </p>
                    </div>
                    
                    <div className="lg:col-span-4 bg-black/40 p-12 rounded-[4rem] backdrop-blur-3xl border border-white/10 shadow-inner flex flex-col items-center justify-center text-center">
                        <div className="mb-6">
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-indigo-500 font-mono italic">Simulated_Certainty</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-8xl font-black text-white font-mono tracking-tighter italic tabular-nums leading-none">98.4</span>
                            <span className="text-2xl font-black text-indigo-800 font-mono">%</span>
                        </div>
                        <div className="mt-8 flex items-center gap-4 py-2 px-6 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                             <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                             <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono">DossierIntegrity_VALID</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdversarialMazeTab;
