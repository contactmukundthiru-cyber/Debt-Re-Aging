'use client';

import React, { useMemo } from 'react';
import { RuleFlag, RiskProfile, CreditFields } from '../../../lib/rules';
import {
    simulateScoreImpact,
    getFICOWeights,
    calculateCategoryJump,
    ScoreSimulationResult
} from '../../../lib/score-simulator';

interface ScoreSimulatorTabProps {
    flags: RuleFlag[];
    fields: Partial<CreditFields>;
    riskProfile: RiskProfile;
}

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
            <div className="premium-card p-16 text-center bg-slate-50 dark:bg-slate-950/20 border-dashed border-slate-200 dark:border-slate-800">
                <svg className="w-20 h-20 mx-auto mb-6 text-emerald-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-xl font-bold dark:text-white mb-2">No Simulation Data</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Score simulation requires detected violations. Upload a credit report with issues to see projected improvements.
                </p>
            </div>
        );
    }

    return (
        <div className="fade-in space-y-10 pb-12">
            {/* Hero Section */}
            <div className="premium-card p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -ml-40 -mb-40" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-emerald-400 font-mono">AI Score Predictor</span>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-12 items-center">
                        {/* Current Score */}
                        <div className="text-center lg:text-left">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Current Estimated</p>
                            <div className="flex items-baseline gap-2 justify-center lg:justify-start">
                                <span className="text-6xl font-bold tabular-nums">{simulation.currentEstimatedScore}</span>
                                <span className="text-slate-500 text-sm">/850</span>
                            </div>
                            <p className="text-sm text-slate-400 mt-2">{simulation.currentScoreRange}</p>
                        </div>

                        {/* Arrow Animation */}
                        <div className="hidden lg:flex items-center justify-center">
                            <div className="relative">
                                <svg className="w-24 h-24 text-emerald-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                    <span className="text-2xl font-bold text-emerald-400">+{simulation.totalPotentialIncrease}</span>
                                    <p className="text-[8px] text-slate-500 uppercase tracking-wider">Potential</p>
                                </div>
                            </div>
                        </div>

                        {/* Projected Score */}
                        <div className="text-center lg:text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Projected After Disputes</p>
                            <div className="flex items-baseline gap-2 justify-center lg:justify-end">
                                <span className="text-6xl font-bold tabular-nums text-emerald-400">{simulation.projectedScoreAfterDisputes.realistic}</span>
                                <span className="text-emerald-500/50 text-sm">/850</span>
                            </div>
                            <p className="text-sm text-emerald-400/80 mt-2">{simulation.projectedScoreRange}</p>
                        </div>
                    </div>

                    {/* Category Jump Badge */}
                    {categoryJump.categoriesJumped > 0 && (
                        <div className="mt-8 flex justify-center">
                            <div className="px-6 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 inline-flex items-center gap-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Category Jump</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-300">{categoryJump.currentCategory}</span>
                                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    <span className="text-sm font-bold text-emerald-400">{categoryJump.projectedCategory}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Score Range Indicator */}
            <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 text-center">Projection Confidence Range</p>

                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="text-center flex-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Conservative</p>
                        <p className="text-2xl font-bold text-slate-500 tabular-nums">{simulation.projectedScoreAfterDisputes.conservative}</p>
                    </div>
                    <div className="text-center flex-1 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Realistic</p>
                        <p className="text-2xl font-bold text-emerald-500 tabular-nums">{simulation.projectedScoreAfterDisputes.realistic}</p>
                    </div>
                    <div className="text-center flex-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Optimistic</p>
                        <p className="text-2xl font-bold text-blue-500 tabular-nums">{simulation.projectedScoreAfterDisputes.optimistic}</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Financial Benefits */}
                <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold dark:text-white">Potential Savings</h4>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">Lifetime Financial Impact</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {simulation.financialBenefits.map((benefit, i) => (
                            <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 group hover:border-emerald-500/30 transition-all">
                                <div className="flex items-start justify-between mb-3">
                                    <h5 className="text-sm font-bold dark:text-white">{benefit.product}</h5>
                                    <span className="text-lg font-bold text-emerald-500 tabular-nums">
                                        ${benefit.lifetimeSavings.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                    <div>
                                        <span className="text-slate-400">Current: </span>
                                        <span className="font-bold text-rose-500">{benefit.currentRate}</span>
                                    </div>
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    <div>
                                        <span className="text-slate-400">Projected: </span>
                                        <span className="font-bold text-emerald-500">{benefit.projectedRate}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total Savings */}
                    <div className="mt-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Total Lifetime Savings</span>
                            <span className="text-3xl font-bold text-emerald-500 tabular-nums">${totalSavings.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Item-by-Item Impact */}
                <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold dark:text-white">Removal Impact</h4>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">Per-Item Score Projection</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {simulation.removalSimulations.map((sim, i) => (
                            <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-start justify-between mb-3">
                                    <h5 className="text-sm font-bold dark:text-white line-clamp-1 flex-1">{sim.itemDescription}</h5>
                                    <span className={`text-lg font-bold tabular-nums ${sim.confidence === 'high' ? 'text-emerald-500' :
                                            sim.confidence === 'medium' ? 'text-blue-500' : 'text-slate-400'
                                        }`}>
                                        +{sim.projectedScoreIncrease.mid}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 mb-3">
                                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${sim.confidence === 'high' ? 'bg-emerald-500' :
                                                    sim.confidence === 'medium' ? 'bg-blue-500' : 'bg-slate-400'
                                                }`}
                                            style={{ width: `${(sim.projectedScoreIncrease.mid / 50) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sim.confidence === 'high' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            sim.confidence === 'medium' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                        }`}>
                                        {sim.confidence}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                    <span>Range: +{sim.projectedScoreIncrease.low} to +{sim.projectedScoreIncrease.high}</span>
                                    <span>{sim.timeToReflect}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FICO Factor Weights */}
            <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold dark:text-white">FICO Score Factors</h4>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">How Your Score Is Calculated</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-5 gap-4">
                    {ficoWeights.map((factor, i) => {
                        const colors = ['emerald', 'blue', 'purple', 'amber', 'rose'];
                        const color = colors[i];
                        return (
                            <div
                                key={i}
                                className={`p-5 rounded-2xl bg-${color}-500/5 border border-${color}-500/20 text-center group hover:scale-105 transition-all`}
                            >
                                <div className={`text-3xl font-bold text-${color}-500 mb-2`}>{Math.round(factor.weight * 100)}%</div>
                                <h5 className="text-sm font-bold dark:text-white mb-1">{factor.category}</h5>
                                <p className="text-[10px] text-slate-400 leading-relaxed">{factor.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 12-Month Timeline */}
            <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold dark:text-white">12-Month Score Projection</h4>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Expected Recovery Timeline</p>
                    </div>
                </div>

                <div className="relative">
                    {/* Timeline Bar */}
                    <div className="flex items-end justify-between gap-1 h-48 mb-4">
                        {simulation.timeline.map((point, i) => {
                            const maxScore = 850;
                            const minScore = simulation.currentEstimatedScore - 20;
                            const range = maxScore - minScore;
                            const height = ((point.projectedScore - minScore) / range) * 100;

                            return (
                                <div
                                    key={i}
                                    className="flex-1 flex flex-col items-center gap-2"
                                >
                                    <div className="text-[10px] font-bold text-slate-400 tabular-nums">
                                        {point.projectedScore}
                                    </div>
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-500 ${i === 0 ? 'bg-slate-300 dark:bg-slate-700' :
                                                i === simulation.timeline.length - 1 ? 'bg-emerald-500' :
                                                    'bg-blue-500/50'
                                            }`}
                                        style={{ height: `${Math.max(10, height)}%` }}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Month Labels */}
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {simulation.timeline.filter((_, i) => i % 3 === 0).map((point, i) => (
                            <span key={i}>Mo {point.month}</span>
                        ))}
                    </div>
                </div>

                {/* Milestones */}
                <div className="mt-8 grid md:grid-cols-3 gap-4">
                    {simulation.timeline.filter(t => t.milestone).slice(0, 3).map((point, i) => (
                        <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Month {point.month}</span>
                            </div>
                            <p className="text-sm font-medium dark:text-white">{point.milestone}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScoreSimulatorTab;
