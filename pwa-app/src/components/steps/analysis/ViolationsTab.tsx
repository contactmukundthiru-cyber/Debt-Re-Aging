'use client';

import React from 'react';
import { RuleFlag } from '../../../lib/rules';

interface ViolationsTabProps {
  flags: RuleFlag[];
  expandedCard: number | null;
  setExpandedCard: (id: number | null) => void;
  translate: (key: string) => string;
}

const ViolationsTab: React.FC<ViolationsTabProps> = ({
  flags,
  expandedCard,
  setExpandedCard
}) => {
  if (flags.length === 0) {
    return (
      <div className="premium-card p-16 text-center bg-slate-50 dark:bg-slate-950/20 border-dashed border-slate-200 dark:border-slate-800">
        <svg className="w-20 h-20 mx-auto mb-6 text-emerald-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h3 className="text-xl font-bold dark:text-white mb-2">Clean Audit Report</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">No automatic violations were detected during the forensic scan. A manual review by a qualified credit law attorney is still recommended for hidden discrepancies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="glass-panel p-6 flex flex-wrap items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detected Violations</p>
            <p className="text-2xl font-bold dark:text-white tabular-nums">{flags.length} Issues</p>
          </div>
        </div>
        <div className="flex gap-4">
          {['high', 'medium', 'low'].map(severity => {
            const count = flags.filter(f => f.severity === severity).length;
            const colors = {
              high: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
              medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
              low: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            };
            return (
              <div key={severity} className={`px-4 py-2 rounded-xl border ${colors[severity as keyof typeof colors]}`}>
                <span className="text-[10px] font-bold uppercase tracking-widest">{severity}: </span>
                <span className="text-sm font-bold tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Violation Cards */}
      {flags.map((flag, i) => {
        const isExpanded = expandedCard === i;
        const severityConfig = {
          high: { color: 'text-rose-500 bg-rose-500/10 border-rose-500/30', glow: 'shadow-rose-500/10', icon: '🔴' },
          medium: { color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', glow: 'shadow-amber-500/10', icon: '🟡' },
          low: { color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', glow: 'shadow-slate-500/10', icon: '⚪' }
        }[flag.severity];

        return (
          <div
            key={i}
            className={`group transition-all duration-300 ${isExpanded ? `ring-2 ring-emerald-500/20 shadow-2xl ${severityConfig.glow}` : 'hover:shadow-xl hover:-translate-y-0.5'}`}
          >
            <div
              className={`premium-card p-8 cursor-pointer transition-colors overflow-hidden relative ${isExpanded ? 'bg-white dark:bg-slate-900 border-emerald-500/30' : 'bg-white/80 dark:bg-slate-900/50'}`}
              onClick={() => setExpandedCard(isExpanded ? null : i)}
            >
              {/* Decorative Glow */}
              {isExpanded && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
              )}

              <div className="flex justify-between items-start gap-6 relative z-10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${severityConfig.color}`}>
                      {flag.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">REF: {flag.ruleId}</span>
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="h-1 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${flag.successProbability > 80 ? 'bg-emerald-500' : flag.successProbability > 50 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${flag.successProbability}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 tabular-nums">{flag.successProbability}%</span>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold tracking-tight dark:text-white mb-3 group-hover:text-emerald-500 transition-colors">
                    {flag.ruleName}
                  </h4>
                  <p className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {flag.explanation}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 transition-all duration-300 ${isExpanded ? 'rotate-180 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 'text-slate-400'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-8 fade-in relative z-10">
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Impact & Citations */}
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" />
                          Why This Matters
                        </p>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {flag.whyItMatters}
                        </p>
                      </div>

                      {flag.legalCitations.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Legal Foundation</p>
                          <div className="flex flex-wrap gap-2">
                            {flag.legalCitations.map((cite, j) => (
                              <span key={j} className="text-[10px] font-mono px-3 py-1.5 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-500/10">
                                {cite}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Evidence & Tactics */}
                    <div className="space-y-6">
                      {flag.suggestedEvidence.length > 0 && (
                        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            Supporting Evidence
                          </p>
                          <ul className="space-y-3">
                            {flag.suggestedEvidence.map((e, j) => (
                              <li key={j} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                                {e}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {flag.bureauTactics && Object.keys(flag.bureauTactics).length > 0 && (
                        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Bureau-Specific Strategy
                          </p>
                          <div className="space-y-3">
                            {Object.entries(flag.bureauTactics).map(([bureau, tactic], j) => (
                              <div key={j} className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[9px] font-bold text-slate-900 dark:text-white uppercase mb-1 block">{bureau}</span>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal italic">"{tactic}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ViolationsTab;
