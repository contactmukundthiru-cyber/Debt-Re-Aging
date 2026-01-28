import React from 'react';
import { RuleFlag, RiskProfile } from '../../../lib/rules';

interface CaseSummaryDashboardProps {
    flags: RuleFlag[];
    riskProfile: RiskProfile;
    readiness: number;
}

const CaseSummaryDashboard: React.FC<CaseSummaryDashboardProps> = ({ flags, riskProfile, readiness }) => {
    const highImpact = flags.filter(f => f.severity === 'high').length;
    const avgProbability = flags.length > 0
        ? Math.round(flags.reduce((acc, f) => acc + f.successProbability, 0) / flags.length)
        : 0;

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-in fade-in slide-in-from-top-6 duration-700">
            {/* Total Violations */}
            <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Findings</span>
                </div>
                <div>
                    <h3 className="text-3xl font-black dark:text-white tabular-nums">{flags.length}</h3>
                    <p className="text-xs text-rose-500 font-bold mt-1">
                        {highImpact} High Impact Violations
                    </p>
                </div>
            </div>

            {/* Settlement Probability */}
            <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Win Probability</span>
                </div>
                <div>
                    <h3 className="text-3xl font-black dark:text-white tabular-nums">{avgProbability}%</h3>
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${avgProbability}%` }} />
                    </div>
                </div>
            </div>

            {/* Trial Readiness */}
            <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trial Readiness</span>
                </div>
                <div>
                    <h3 className="text-3xl font-black dark:text-white tabular-nums">{readiness}%</h3>
                    <p className="text-xs text-blue-500 font-bold mt-1">
                        {readiness > 80 ? 'Litigation Ready' : readiness > 40 ? 'Gathering Evidence' : 'Needs Investigation'}
                    </p>
                </div>
            </div>

            {/* Damages Estimate */}
            <div className="premium-card p-6 bg-slate-950 border-emerald-500/30 flex flex-col justify-between group hover:scale-[1.02] transition-all overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16V7" /></svg>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Potential Recovery</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-3xl font-black text-white tabular-nums">
                        ${(flags.length * 1000).toLocaleString()}
                        <span className="text-xs text-emerald-500 ml-1">+</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Est. Statutory Damages</p>
                </div>
            </div>
        </div>
    );
};

export default CaseSummaryDashboard;
