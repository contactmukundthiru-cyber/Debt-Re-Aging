'use client';

import React, { useMemo } from 'react';
import { calculateLiability, LiabilityReport } from '../../../lib/liability';
import { RuleFlag } from '../../../lib/rules';

interface LiabilityRadarTabProps {
    flags: RuleFlag[];
}

const LiabilityRadarTab: React.FC<LiabilityRadarTabProps> = ({ flags }) => {
    const liability = useMemo(() => calculateLiability(flags), [flags]);

    return (
        <div className="fade-in space-y-10 pb-12">
            {/* Total Liability Hero */}
            <div className="premium-card p-10 bg-slate-950 border-rose-900 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-rose-500 font-mono">Liability Risk Assessment</span>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tight mb-2">
                            Forensic <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Severity Assessment</span>
                        </h2>
                        <p className="text-slate-400 text-sm max-w-lg">
                            Assessing the qualitative impact of non-compliance for the reporting entities based on detected violations.
                        </p>
                    </div>

                    <div className="text-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[200px]">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Severity Score</p>
                        <p className="text-6xl font-black text-white tabular-nums">{liability.overallSeverityScore}</p>
                        <div className="mt-4 flex items-center gap-2 justify-center">
                            <span className={`h-2 w-2 rounded-full ${liability.overallSeverityScore > 200 ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{liability.overallSeverityScore > 200 ? 'Critical Severity' : 'Standard Severity'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Detailed Assessments */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-3 px-2">
                        <span className="w-1 h-6 bg-rose-500 rounded-full" />
                        Violation Breakdown
                    </h3>
                    <div className="space-y-4">
                        {liability.assessments.map((assessment, i) => (
                            <div key={i} className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:scale-[1.01] transition-transform">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest font-mono mb-1">{assessment.statute} &middot; {assessment.section}</p>
                                        <h4 className="text-lg font-bold dark:text-white">{assessment.violationType}</h4>
                                    </div>
                                    <span className="text-xl font-black tabular-nums dark:text-white">{assessment.forensicSeverity}</span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex-grow h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-rose-500"
                                            style={{ width: `${(assessment.forensicSeverity / 150) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Impact: {assessment.impactPotential}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Punitive Potential */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-3 px-2">
                        <span className="w-1 h-6 bg-orange-500 rounded-full" />
                        Legal Strategy
                    </h3>

                    <div className="p-8 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${liability.litigationReady ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-slate-800 text-slate-400'}`}>
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Litigation Readiness</p>
                                <p className="text-xl font-bold dark:text-white">{liability.litigationReady ? 'Candidate for Legal Action' : 'Administrative Resolution'}</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-500 leading-relaxed mb-8">
                            {liability.litigationReady
                                ? "The severity and volume of these violations meet the threshold for contingency-fee litigation. An attorney would likely view this as a high-severity case due to 'Willful Non-Compliance' markers."
                                : "These violations are best resolved through the administrative dispute process and CFPB escalation. If the bureau 'verifies' these items despite this evidence, the forensic weight will increase significantly."
                            }
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-bold text-slate-500">Risk Multiplier</span>
                                <span className="text-sm font-black dark:text-white">x{liability.riskMultiplier}.0</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-bold text-slate-500">Attorney Fee Potential</span>
                                <span className="text-sm font-black text-emerald-500">Recoverable</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                        <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2 italic">Forensic Disclaimer</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                            This calculation is for strategic demonstration purposes only. It assesses statutory vulnerability rather than monetary value. This application is not a law firm and does not provide legal advice.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiabilityRadarTab;
