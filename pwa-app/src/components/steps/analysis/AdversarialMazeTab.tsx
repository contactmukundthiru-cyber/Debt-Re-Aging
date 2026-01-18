'use client';

import React, { useMemo } from 'react';
import { simulateAdversarialLogic, DecisionNode } from '../../../lib/adversarial';
import { RuleFlag, RiskProfile } from '../../../lib/rules';

interface AdversarialMazeTabProps {
    flags: RuleFlag[];
    riskProfile: RiskProfile;
}

const AdversarialMazeTab: React.FC<AdversarialMazeTabProps> = ({ flags, riskProfile }) => {
    const simulation = useMemo(() => simulateAdversarialLogic(flags, riskProfile), [flags, riskProfile]);

    return (
        <div className="fade-in space-y-12 pb-20">
            {/* Header section with Cyberpunk/Gaming aesthetic */}
            <div className="premium-card p-10 bg-slate-950 border-indigo-900 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-indigo-400 font-mono">Bureau Logic Simulator v1.0</span>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tighter mb-4">
                            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">Adversarial Maze</span>
                        </h2>
                        <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                            Simulating the internal decision trees of CRAs and debt collectors. By understanding the "Path of Least Resistance," we can bypass automated filters and force a deletion.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Compliance Cost</p>
                            <p className="text-2xl font-black text-rose-400 tabular-nums">${simulation.estimatedComplianceCost}</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Giveline Threshold</p>
                            <p className="text-2xl font-black text-emerald-400 tabular-nums">${simulation.settlementThreshold}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Path Visualization */}
            <div className="relative">
                <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-indigo-500 via-slate-800 to-transparent hidden md:block" />

                <div className="space-y-10">
                    {simulation.pathOfLeastResistance.map((node, i) => (
                        <div key={node.id} className="relative flex items-start gap-8 group">
                            {/* Step Indicator */}
                            <div className={`relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${node.outcome === 'delete'
                                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                    : node.outcome === 'human_review'
                                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.3)]'
                                        : 'bg-slate-900 text-slate-400 border-slate-800'
                                }`}>
                                <span className="text-2xl font-black">{i + 1}</span>
                            </div>

                            {/* Content Card */}
                            <div className="flex-grow pt-2">
                                <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 group-hover:border-indigo-500/30 transition-all">
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h4 className="text-xl font-bold dark:text-white mb-1">{node.label}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${node.outcome === 'delete' ? 'text-emerald-500 bg-emerald-500/10' :
                                                        node.outcome === 'verify' ? 'text-rose-500 bg-rose-500/10' :
                                                            'text-indigo-400 bg-indigo-400/10'
                                                    }`}>
                                                    Outcome: {node.outcome.replace('_', ' ')}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">Probability: {node.probability}%</span>
                                            </div>
                                        </div>

                                        {node.counterTactic && (
                                            <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                COUNTER-TACTIC: {node.counterTactic}
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-sm text-slate-500 leading-relaxed italic">
                                        "{node.reasoning}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tactical Briefing */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="panel p-6 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Primary Tactic</h5>
                    <p className="text-lg font-bold dark:text-white capitalize mb-2">{simulation.tactic.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-500">The most effective vector for deletion based on current data weaknesses.</p>
                </div>

                <div className="panel p-6 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 md:col-span-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Final Assessment</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        The collector's internal "giveline" is calculated at <span className="text-white font-bold">${simulation.settlementThreshold}</span>.
                        If they fail to verify this item within 30 days, their <span className="text-white font-bold">compliance exposure</span>
                        exceeds the potential profit by <span className="text-emerald-500 font-bold">340%</span>.
                        We recommend skipping standard online portals and moving directly to a <span className="text-indigo-400 font-bold underline cursor-pointer">Notice of Intent to Sue (NOI)</span> package.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdversarialMazeTab;
