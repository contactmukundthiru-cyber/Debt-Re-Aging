'use client';

import React, { useMemo } from 'react';
import { simulateAdversarialLogic, SimulationResult } from '../../../lib/adversarial';
import { RuleFlag, RiskProfile } from '../../../lib/rules';

interface TacticalSimulatorTabProps {
    flags: RuleFlag[];
    riskProfile: RiskProfile;
}

const TacticalSimulatorTab: React.FC<TacticalSimulatorTabProps> = ({ flags, riskProfile }) => {
    const simulation = useMemo(() => simulateAdversarialLogic(flags, riskProfile), [flags, riskProfile]);

    return (
        <div className="fade-in space-y-10 pb-12">
            {/* Risk Hero */}
            <div className="premium-card p-10 bg-slate-950 border-blue-900 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />

                <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-blue-400 font-mono">Adversarial Decision Modeling</span>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tight mb-4 leading-tight">
                            Simulating <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Collector Logic</span>
                        </h2>
                        <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
                            This simulation models the internal cost-benefit analysis a bureau or collector performs when they receive your dispute formatted with these forensic markers.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Bureaus Processing Cost</p>
                            <p className="text-3xl font-black text-white tabular-nums">${simulation.estimatedComplianceCost}</p>
                            <p className="text-[9px] text-slate-500 mt-2 font-medium">Their cost to "verify" this record.</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Forensic Settlement Floor</p>
                            <p className="text-3xl font-black text-emerald-400 tabular-nums">${simulation.settlementThreshold}</p>
                            <p className="text-[9px] text-slate-500 mt-2 font-medium">Estimated walk-away value.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decision Tree Path */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-3 px-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full" />
                    Strategic Response Path
                </h3>

                <div className="relative">
                    {/* Connection Line */}
                    <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-slate-100 dark:bg-slate-800 hidden md:block" />

                    <div className="space-y-12 relative z-10">
                        {simulation.pathOfLeastResistance.map((node, i) => (
                            <div key={node.id} className="flex flex-col md:flex-row gap-8 items-start group">
                                <div className={`w-20 h-20 rounded-[2rem] shrink-0 flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-xl transition-all group-hover:scale-110 ${node.outcome === 'delete' ? 'bg-emerald-500 text-white' :
                                        node.outcome === 'human_review' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'
                                    }`}>
                                    <span className="text-lg font-black">{i + 1}</span>
                                </div>

                                <div className="premium-card flex-grow p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h4 className="text-xl font-bold dark:text-white mb-1">{node.label}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Likelihood: {node.probability}%</p>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${node.outcome === 'delete' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-800'
                                            }`}>
                                            Outcome: {node.outcome.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium italic">"{node.reasoning}"</p>

                                    {node.counterTactic && (
                                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
                                            <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            <div>
                                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Recommended Maneuver</p>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{node.counterTactic}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Probability Matrix */}
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { label: 'Technical Bypass', val: simulation.tactic === 'technical_fault' ? 'High' : 'Low', desc: 'Ability to force deletion through metadata inconsistencies.' },
                    { label: 'Administrative Stress', val: simulation.estimatedComplianceCost > 300 ? 'Severe' : 'Moderate', desc: 'The burden on their operations to process your dispute.' },
                    { label: 'Bribe Potential', val: simulation.settlementThreshold < 1000 ? 'Viable' : 'Tough', desc: 'Chance they will delete in exchange for a "nuisance settlement".' }
                ].map((m, i) => (
                    <div key={i} className="premium-card p-6 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-4 tracking-widest">{m.label}</p>
                        <p className="text-2xl font-black dark:text-white mb-2">{m.val}</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{m.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TacticalSimulatorTab;
