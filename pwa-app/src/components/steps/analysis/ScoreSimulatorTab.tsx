'use client';

import React, { useMemo } from 'react';
import { RuleFlag, RiskProfile, CreditFields } from '../../../lib/rules';
import {
    simulateScoreImpact,
    getFICOWeights,
    calculateCategoryJump,
    ScoreSimulationResult
} from '../../../lib/score-simulator';
import { motion } from 'framer-motion';
import { 
    Cpu, 
    TrendingUp, 
    ArrowRight, 
    DollarSign, 
    Shield, 
    Target, 
    Calendar,
    ChevronRight,
    Zap,
    Activity,
    Lock
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ScoreSimulatorTabProps {
    flags: RuleFlag[];
    fields: Partial<CreditFields>;
    riskProfile: RiskProfile;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

const ScoreSimulatorTab: React.FC<ScoreSimulatorTabProps> = ({
    flags,
    fields,
    riskProfile
}) => {
    const simulation = useMemo(() =>
        simulateScoreImpact(flags, fields, riskProfile),
        [flags, fields, riskProfile]
    );

    const categoryJump = useMemo(() =>
        calculateCategoryJump(
            simulation.currentEstimatedScore,
            simulation.projectedScoreAfterDisputes.realistic
        ),
        [simulation]
    );

    const ficoWeights = getFICOWeights();

    const totalSavings = simulation.financialBenefits.reduce(
        (sum, b) => sum + b.lifetimeSavings, 0
    );

    if (flags.length === 0) {
        return (
            <div className="min-h-[600px] flex flex-col items-center justify-center p-20 bg-slate-950/20 rounded-[4rem] border-2 border-dashed border-white/5">
                <div className="w-24 h-24 rounded-[2.5rem] bg-slate-500/10 border border-slate-500/20 flex items-center justify-center mb-8">
                    <Lock size={40} className="text-slate-500/50" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter italic">Simulation Locked</h3>
                <p className="text-sm text-slate-500 max-w-md text-center font-mono uppercase tracking-widest leading-relaxed">
                    Score simulation requires active violation nodes. Initialize forensic scan to unlock fiscal projection data.
                </p>
                <div className="mt-12 px-8 py-3 rounded-full bg-slate-900 border border-white/5 text-[10px] font-mono text-slate-600 uppercase tracking-[0.4em]">Waiting for Data...</div>
            </div>
        );
    }

    return (
        <div className="fade-in space-y-20 pb-32">
            {/* Neural Projection Hero */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-slate-500/20 via-slate-500/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-500/5 rounded-full blur-[120px] -mr-96 -mt-96" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-20">
                        <div className="text-center lg:text-left flex-1">
                            <div className="flex items-center gap-4 mb-10 justify-center lg:justify-start">
                                <div className="px-5 py-2 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center gap-3">
                                    <Cpu size={14} className="text-slate-500 animate-pulse" />
                                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-400 font-mono">Neural Fiscal Engine v5.0</span>
                                </div>
                            </div>
                            
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 mb-4 font-mono">Current_Dossier_Estimate</p>
                            <div className="flex items-baseline gap-4 justify-center lg:justify-start">
                                <span className="text-9xl font-black tracking-tighter text-white tabular-nums drop-shadow-2xl">{simulation.currentEstimatedScore}</span>
                                <span className="text-slate-600 font-mono text-xl font-bold">/ 850</span>
                            </div>
                            <div className="mt-6 inline-flex items-center gap-3 px-6 py-2 rounded-full bg-slate-950/50 border border-white/5">
                                <Activity size={12} className="text-slate-500" />
                                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">{simulation.currentScoreRange}</span>
                            </div>
                        </div>

                        {/* Centered Transformation UI */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-2 border-slate-500/20 border-t-slate-500 animate-[spin_4s_linear_infinite]" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-slate-400 tabular-nums">+{simulation.totalPotentialIncrease}</span>
                                    <span className="text-[8px] font-mono text-slate-500 font-black uppercase tracking-widest">Shift</span>
                                </div>
                            </div>
                            <div className="h-12 w-px bg-gradient-to-b from-slate-500/50 to-transparent" />
                        </div>

                        <div className="text-center lg:text-right flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 mb-4 font-mono">Quantum_Post_Dispute</p>
                            <div className="flex items-baseline gap-4 justify-center lg:justify-end">
                                <span className="text-9xl font-black tracking-tighter text-slate-400 tabular-nums drop-shadow-[0_0_30px_rgba(100,116,139,0.3)]">{simulation.projectedScoreAfterDisputes.realistic}</span>
                                <span className="text-slate-500/30 font-mono text-xl font-bold">/ 850</span>
                            </div>
                            <div className="mt-6 inline-flex items-center gap-3 px-6 py-2 rounded-full bg-slate-500/10 border border-slate-500/20">
                                <Target size={12} className="text-slate-500" />
                                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">{simulation.projectedScoreRange}</span>
                            </div>
                        </div>
                    </div>

                    {/* Category Jump Banner */}
                    {categoryJump.categoriesJumped > 0 && (
                        <div className="mt-20 relative px-10 py-6 rounded-[2.5rem] bg-slate-900/40 border border-white/5 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-slate-500/5 opacity-50" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center border border-slate-500/20">
                                        <TrendingUp size={20} className="text-slate-500" />
                                    </div>
                                    <div className="h-10 w-px bg-slate-800" />
                                    <div className="flex items-center gap-8">
                                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest font-mono line-through opacity-50">{categoryJump.currentCategory}</span>
                                        <ArrowRight size={20} className="text-slate-500" />
                                        <span className="text-xl font-black text-white uppercase tracking-tighter italic">{categoryJump.projectedCategory}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Grade Upgrade</div>
                                    <div className="text-[8px] font-mono text-slate-600 font-bold uppercase tracking-[0.2em] mt-1">Confirmed by Neural Core</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-Header Confidence Matrix */}
            <div className="grid lg:grid-cols-3 gap-10">
                {[
                    { label: 'Conservative', score: simulation.projectedScoreAfterDisputes.conservative, color: 'slate' },
                    { label: 'Realistic_Baseline', score: simulation.projectedScoreAfterDisputes.realistic, color: 'slate' },
                    { label: 'Optimistic_Peak', score: simulation.projectedScoreAfterDisputes.optimistic, color: 'slate' }
                ].map((range, i) => (
                    <div key={i} className={cn(
                        "p-10 rounded-[3rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-500",
                        range.color === 'slate' && "border-slate-500/20 shadow-[0_0_40px_rgba(100,116,139,0.1)]"
                    )}>
                        <div className="flex items-center justify-between mb-8">
                            <p className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.4em]">{range.label}</p>
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                "bg-slate-500"
                            )} />
                        </div>
                        <h4 className={cn(
                            "text-6xl font-black tabular-nums tracking-tighter",
                            "text-slate-400"
                        )}>{range.score}</h4>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-16">
                {/* Visual Impact Artifacts (7 cols) */}
                <div className="lg:col-span-12 space-y-16">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-slate-500/10 text-slate-400 flex items-center justify-center border border-slate-500/20 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-slate-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <Target size={32} className="relative z-10" />
                        </div>
                        <div>
                            <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic">Removal Artifacts</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold mt-2">Per-Node Impact Projection</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {simulation.removalSimulations.map((sim, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative"
                            >
                                <div className="absolute -inset-px bg-gradient-to-br from-slate-500/10 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                                <div className="relative p-10 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] transition-all duration-500 flex flex-col min-h-[300px]">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="px-4 py-1.5 rounded-full bg-slate-500/5 border border-slate-500/10 text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest">
                                            Phase: {sim.timeToReflect}
                                        </div>
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            "bg-slate-500"
                                        )} />
                                    </div>

                                    <h5 className="text-lg font-black text-white uppercase tracking-tighter italic mb-4 leading-tight group-hover:text-slate-400 transition-colors">
                                        {sim.itemDescription}
                                    </h5>
                                    
                                    <div className="mt-auto space-y-6">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-white tabular-nums tracking-tighter">+{sim.projectedScoreIncrease.mid}</span>
                                            <span className="text-[10px] font-mono font-black text-slate-600 uppercase tracking-widest">Points</span>
                                        </div>

                                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(sim.projectedScoreIncrease.mid / 50) * 100}%` }}
                                                transition={{ duration: 1.5, ease: "circOut" }}
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    "bg-slate-500"
                                                )}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 font-black uppercase tracking-[0.2em]">
                                            <span>Confidence: {sim.confidence}</span>
                                            <span className="text-white">Est. Impact</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Financial Lifecycle Analysis */}
            <div className="grid lg:grid-cols-12 gap-16">
                <div className="lg:col-span-7 space-y-12">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-slate-500/10 text-slate-500 flex items-center justify-center border border-slate-500/20 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-slate-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <DollarSign size={32} className="relative z-10" />
                        </div>
                        <div>
                            <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic">Fiscal Lifecycle</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold mt-2">Projected Debt Servicing Delta</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {simulation.financialBenefits.map((benefit, i) => (
                            <div key={i} className="group relative">
                                <div className="absolute -inset-px bg-gradient-to-r from-slate-500/10 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative p-10 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] transition-all duration-500 flex items-center justify-between">
                                    <div className="flex items-center gap-10">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-900/50 flex flex-col items-center justify-center border border-white/5 group-hover:border-slate-500/30 transition-colors">
                                            <span className="text-[10px] font-mono font-black text-slate-500">PRD</span>
                                            <span className="text-lg font-mono font-black text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                                        </div>
                                        <div>
                                            <h5 className="text-xl font-black text-white uppercase tracking-tight mb-2 italic">{benefit.product}</h5>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-mono font-black text-slate-500/80 uppercase tracking-[0.2em]">{benefit.currentRate}</span>
                                                <ChevronRight size={12} className="text-slate-700" />
                                                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-[0.2em]">{benefit.projectedRate}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-white tabular-nums tracking-tighter group-hover:text-slate-400 transition-colors">${benefit.lifetimeSavings.toLocaleString()}</div>
                                        <div className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest mt-1">Life_Cycle_SAVINGS</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-12 rounded-[3.5rem] bg-slate-500/5 border border-slate-500/20 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap size={80} className="text-slate-500" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.5em] mb-4">Total_Aggregated_Delta</p>
                            <div className="flex items-baseline gap-4">
                                <span className="text-7xl font-black text-white tabular-nums tracking-tighter">${totalSavings.toLocaleString()}</span>
                                <span className="text-slate-500 font-black text-xl font-mono uppercase tracking-widest italic">USD</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-6 font-medium italic max-w-md uppercase leading-relaxed tracking-wide">
                                Cumulative interest expense elimination projected across all institutional lending products over active liability terms.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Score Factor Weights (5 cols) */}
                <div className="lg:col-span-5 space-y-12">
                     <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-slate-500/10 text-slate-400 flex items-center justify-center border border-slate-500/20 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-slate-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <Shield size={32} className="relative z-10" />
                        </div>
                        <div>
                            <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">Neural Weights</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold mt-2">FICO Calculation Protocol</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {ficoWeights.map((factor, i) => (
                            <div key={i} className="p-8 rounded-[2.5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 group hover:border-slate-500/20 transition-all duration-500">
                                <div className="flex items-center justify-between mb-6">
                                    <h5 className="text-lg font-black text-white uppercase tracking-tighter italic">{factor.category}</h5>
                                    <span className="text-2xl font-black text-slate-400 font-mono tracking-tighter">{Math.round(factor.weight * 100)}%</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium uppercase tracking-wide border-l border-slate-900 pl-6 italic">
                                    {factor.description}
                                </p>
                                <div className="mt-8 w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                     <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${factor.weight * 100}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className="h-full bg-slate-500/50 rounded-full transition-all duration-1000 group-hover:bg-slate-400 group-hover:shadow-[0_0_10px_rgba(100,116,139,0.5)]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recovery Sequence Timeline */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-t from-slate-500/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden p-16 shadow-2xl">
                     <div className="flex items-center justify-between mb-20">
                        <div className="flex items-center gap-10">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 text-white flex items-center justify-center border border-white/10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <Calendar size={32} className="relative z-10" />
                            </div>
                            <div>
                                <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic">Recovery Sequence</h4>
                                <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold mt-2">12-Month Synthetic Projection</p>
                            </div>
                        </div>
                        <div className="px-8 py-3 rounded-full border border-white/10 text-[10px] font-mono text-slate-400 font-black uppercase tracking-[0.5em]">
                            Model_Lock: FINAL
                        </div>
                    </div>

                    <div className="relative px-10">
                        {/* Timeline Visualization */}
                        <div className="flex items-end justify-between h-64 gap-3 relative mb-12">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between opacity-5">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-full h-px bg-white" />
                                ))}
                            </div>

                            {simulation.timeline.map((point, i) => {
                                const maxScore = 850;
                                const minScore = simulation.currentEstimatedScore - 20;
                                const range = maxScore - minScore;
                                const height = ((point.projectedScore - minScore) / range) * 100;
                                
                                return (
                                    <div key={i} className="relative flex-1 group/month">
                                        <div className="absolute inset-0 -top-10 opacity-0 group-hover/month:opacity-100 transition-opacity flex flex-col items-center">
                                            <div className="px-3 py-1.5 bg-white rounded-xl text-[10px] font-black text-slate-950 font-mono shadow-xl mb-2">
                                                {point.projectedScore}
                                            </div>
                                            <div className="w-px h-10 bg-gradient-to-t from-white/20 to-white" />
                                        </div>

                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            transition={{ delay: i * 0.05, duration: 1, ease: "circOut" }}
                                            className={cn(
                                                "w-full rounded-2xl relative transition-all duration-500 group-hover/month:opacity-100",
                                                i === 0 ? "bg-slate-800/40" : 
                                                i < 3 ? "bg-slate-500/30 group-hover/month:bg-slate-500/50" : 
                                                "bg-slate-500/20 group-hover/month:bg-slate-500/40"
                                            )}
                                        />
                                        <div className="mt-6 text-center">
                                            <p className="text-[10px] font-mono font-black text-slate-600 uppercase tracking-widest group-hover/month:text-white transition-colors">
                                                {point.month}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoreSimulatorTab;
