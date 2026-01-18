'use strict';

import React from 'react';
import { RuleFlag } from '../../../lib/rules';

interface ForensicLabTabProps {
  flags: RuleFlag[];
}

const ForensicLabTab: React.FC<ForensicLabTabProps> = ({ flags }) => {
  const citations = Array.from(new Set(flags.flatMap(f => f.legalCitations)));
  const highSeverityFlags = flags.filter(f => f.severity === 'high');

  // Calculate Risk Distribution for Matrix
  const riskCounts = {
    high: highSeverityFlags.length,
    medium: flags.filter(f => f.severity === 'medium').length,
    low: flags.filter(f => f.severity === 'low').length,
  };

  return (
    <div className="fade-in space-y-8 pb-12">
      {/* Risk Matrix Header */}
      <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative flex flex-col md:flex-row justify-between items-start gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-500/80">Active Forensic Lab V4.4</span>
            </div>
            <h3 className="text-4xl font-bold tracking-tight mb-4">
              Statutory <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Risk Matrix</span>
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
              Advanced synthesis of detected violations against federal consumer protection statutes.
              Each data point represents a verified inconsistency mapped to specific legal liability.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 shrink-0 w-full md:w-auto">
            <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Citations</p>
              <p className="text-3xl font-bold text-blue-400">{citations.length}</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Critical</p>
              <p className="text-3xl font-bold text-red-500">{riskCounts.high}</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Coverage</p>
              <p className="text-3xl font-bold text-emerald-400">{Math.round((citations.length / 5) * 100)}%</p>
            </div>
          </div>
        </div>

        {/* The Matrix Visualization */}
        <div className="mt-12 grid grid-cols-3 gap-1 h-32 relative group">
          {/* Matrix Background labels */}
          <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between text-[8px] font-bold text-slate-600 uppercase py-2">
            <span>Impact</span>
            <span>Freq</span>
          </div>

          {['Low', 'Medium', 'High'].map((level, idx) => {
            const count = idx === 0 ? riskCounts.low : idx === 1 ? riskCounts.medium : riskCounts.high;
            const height = count > 0 ? Math.max(20, (count / flags.length) * 100) : 0;
            const color = idx === 0 ? 'bg-slate-500/20 text-slate-400' : idx === 1 ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';

            return (
              <div key={level} className="flex flex-col justify-end gap-2 group/bar">
                <div className="flex items-end justify-center h-full bg-white/5 rounded-xl border border-white/5 relative overflow-hidden transition-all duration-500 hover:bg-white/10">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-1000 ease-out border-t ${color.split(' ')[0]}`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity">
                    {count}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-600 uppercase text-center">{level}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Statutory Deep Dive */}
        <div className="premium-card p-8 bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div>
              <h4 className="text-lg font-bold dark:text-white">Statutory Deep Dive</h4>
              <p className="text-xs text-slate-400">Section-by-section liability mapping</p>
            </div>
          </div>

          <div className="space-y-6">
            {citations.map((cite, i) => (
              <div key={i} className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:border-blue-500/30">
                <div className="flex items-start gap-4">
                  <span className="shrink-0 font-mono text-[10px] px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md border border-blue-500/20 uppercase tracking-tighter">
                    {cite}
                  </span>
                  <div>
                    <p className="text-sm font-medium dark:text-white mb-1 group-hover:text-blue-500 transition-colors">
                      {cite === 'FCRA_605_a' ? '15 U.S.C. § 1681c(a)' :
                        cite === 'FCRA_623_a1' ? '15 U.S.C. § 1681s-2(a)(1)' :
                          cite === 'FCRA_611' ? '15 U.S.C. § 1681i' :
                            cite === 'FDCPA_807' ? '15 U.S.C. § 1692e' : 'Legal Citation'}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {cite === 'FCRA_605_a' && 'Prohibits the reporting of obsolete information (obsolescence doctrine). All verified derogatory data must cease reporting exactly 7 years after the DOFD.'}
                      {cite === 'FCRA_623_a1' && 'Directly prohibits furnishers of information from reporting any data they know or have reasonable cause to believe is inaccurate.'}
                      {cite === 'FCRA_611' && 'Defines the mandatory reinvestigation procedures that CRAs must follow when a consumer disputes the completeness or accuracy of reported data.'}
                      {cite === 'FDCPA_807' && 'Broadly prohibits debt collectors from using any false, deceptive, or misleading representation or means in connection with the collection of any debt.'}
                      {cite === 'METRO2_GUIDE' && 'The industry-standard formatting specification designed to ensure data integrity and compliance across all major credit bureaus.'}
                      {!['FCRA_605_a', 'FCRA_623_a1', 'FCRA_611', 'FDCPA_807', 'METRO2_GUIDE'].includes(cite) && 'Federal or state consumer protection statute governing the integrity of credit market data.'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Defense Rebuttal Synthesis */}
        <div className="premium-card p-8 bg-slate-900 border-none text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <h4 className="text-lg font-bold">Probable Defense Rebuttals</h4>
              <p className="text-xs text-slate-400 font-medium">Predicted creditor pushback & counter-strikes</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {highSeverityFlags.length > 0 ? highSeverityFlags.slice(0, 3).map((flag, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-rose-500" />
                  {flag.ruleId} Threat Analysis
                </p>
                <div className="grid gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">CRA Response Strategy:</p>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">Likely to claim "Verifiable Information" without providing the specific Metro 2 log data. Standard boilerplate rejection incoming.</p>
                  </div>
                  <div className="pt-3 border-t border-white/5">
                    <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Mandatory Rebuttal:</p>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">Demand the specific method of verification (MOV) under FCRA § 611(a)(6)(B)(iii). Non-compliance is a secondary violation.</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
                <svg className="w-12 h-12 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Low Threat Environment</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Evidence Synthesis Section */}
      <div className="premium-card p-8 bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <h4 className="text-lg font-bold dark:text-white">Evidence Synthesis</h4>
            <p className="text-xs text-slate-400">Verifiable artifacts for discovery</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highSeverityFlags.map((flag, i) => (
            <div key={i} className="p-6 bg-slate-50 dark:bg-slate-900/50 shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl hover:border-emerald-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">{flag.ruleId}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-6 font-medium leading-relaxed italic group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                "{flag.explanation}"
              </p>
              <div className="flex flex-wrap gap-2">
                {flag.suggestedEvidence.map((e, j) => (
                  <span key={j} className="text-[9px] font-bold text-slate-500 dark:text-slate-500 bg-white dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    {e}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {highSeverityFlags.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center grayscale opacity-50">
              <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Critical Syntheses Available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForensicLabTab;
