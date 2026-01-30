import React from 'react';
import { RuleFlag, RiskProfile } from '../../../lib/types';

interface CaseSummaryDashboardProps {
    flags: RuleFlag[];
    riskProfile: RiskProfile;
    readiness: number;
}

const CaseSummaryDashboard: React.FC<CaseSummaryDashboardProps> = ({ flags, riskProfile, readiness }) => {
    const highImpact = flags.filter(f => f.severity === 'high').length;
    const impactScore = flags.reduce((acc, f) => acc + (f.severity === 'high' ? 100 : f.severity === 'medium' ? 50 : 10), 0);
    const avgProbability = flags.length > 0
        ? Math.round(flags.reduce((acc, f) => acc + f.successProbability, 0) / flags.length)
        : 0;

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Total Violations */}
            <div className="premium-card p-4 bg-slate-900/50 border-slate-800 flex flex-col justify-between group hover:border-rose-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] font-mono">Detections</span>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white tabular-nums">{flags.length}</h3>
                    <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-wider">
                        {highImpact} Critical Failures
                    </p>
                </div>
            </div>

            {/* Forensic Leverage */}
            <div className="premium-card p-4 bg-slate-900/50 border-slate-800 flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] font-mono">Leverage</span>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white tabular-nums">{avgProbability}%</h3>
                    <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${avgProbability}%` }} />
                    </div>
                </div>
            </div>

            {/* Trial Readiness */}
            <div className="premium-card p-4 bg-slate-900/50 border-slate-800 flex flex-col justify-between group hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] font-mono">Forensic Grade</span>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white tabular-nums">{readiness}%</h3>
                    <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase tracking-wider">
                        {readiness > 80 ? 'Courtroom Ready' : readiness > 40 ? 'Verifying Claims' : 'Audit Required'}
                    </p>
                </div>
            </div>

            {/* Forensic Impact */}
            <div className="premium-card p-4 bg-slate-950 border-emerald-500/20 flex flex-col justify-between group hover:border-emerald-500/50 transition-all overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl -mr-12 -mt-12" />
                <div className="flex items-center justify-between mb-2 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-[0.2em] font-mono">Impact Score</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-white tabular-nums">
                        {impactScore.toLocaleString()}
                        <span className="text-xs text-emerald-500 ml-1">pts</span>
                    </h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 font-mono">Forensic Severity Index</p>
                </div>
            </div>
        </div>
    );
};

export default CaseSummaryDashboard;

