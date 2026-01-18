'use strict';

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
  setExpandedCard,
  translate
}) => {
  if (flags.length === 0) {
    return (
      <div className="panel-inset p-12 text-center dark:bg-gray-800/20 dark:border-gray-700">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="heading-md mb-1 dark:text-white">No Obvious Violations</h3>
        <p className="body-sm text-gray-500 dark:text-gray-400">Manual review by a professional is still recommended.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {flags.map((flag, i) => {
        const isExpanded = expandedCard === i;
        const severityColor =
          flag.severity === 'high' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
            flag.severity === 'medium' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' :
              'text-slate-400 bg-slate-500/10 border-slate-500/20';

        return (
          <div
            key={i}
            className={`group transition-all duration-300 ${isExpanded
              ? 'ring-2 ring-emerald-500/20 shadow-2xl shadow-emerald-900/10'
              : 'hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5'
              }`}
          >
            <div
              className={`premium-card p-6 cursor-pointer transition-colors ${isExpanded ? 'bg-white dark:bg-slate-900 border-emerald-500/30' : 'bg-white/50 dark:bg-slate-900/50'
                }`}
              onClick={() => setExpandedCard(isExpanded ? null : i)}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${severityColor}`}>
                      {flag.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">REF: {flag.ruleId}</span>
                  </div>
                  <h4 className="text-lg font-bold tracking-tight dark:text-white mb-2 group-hover:text-emerald-500 transition-colors">
                    {flag.ruleName}
                  </h4>
                  <p className={`text-sm text-slate-600 dark:text-slate-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {flag.explanation}
                  </p>

                  {!isExpanded && (
                    <div className="flex items-center gap-3 mt-4">
                      <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${flag.successProbability > 80 ? 'bg-emerald-500' :
                            flag.successProbability > 50 ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                          style={{ width: `${flag.successProbability}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{flag.successProbability}% Strength</span>
                    </div>
                  )}
                </div>
                <div className={`w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 'text-slate-400'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-8 fade-in">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Impact Analysis</p>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          {flag.whyItMatters}
                        </p>
                      </div>

                      {flag.legalCitations.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Legal Citable Basis</p>
                          <div className="flex flex-wrap gap-2">
                            {flag.legalCitations.map((cite, j) => (
                              <span key={j} className="text-[10px] font-mono px-3 py-1.5 bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-500/10">
                                {cite}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      {flag.suggestedEvidence.length > 0 && (
                        <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            Required Evidence
                          </p>
                          <ul className="space-y-3">
                            {flag.suggestedEvidence.map((e, j) => (
                              <li key={j} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                {e}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {flag.bureauTactics && Object.keys(flag.bureauTactics).length > 0 && (
                        <div className="bg-amber-500/5 rounded-2xl p-6 border border-amber-500/10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Tactical Advantage
                          </p>
                          <div className="space-y-4">
                            {Object.entries(flag.bureauTactics).map(([bureau, tactic], j) => (
                              <div key={j} className="bg-white/50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                <span className="text-[9px] font-bold text-slate-900 dark:text-white uppercase mb-1 block">{bureau} Strategy</span>
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
