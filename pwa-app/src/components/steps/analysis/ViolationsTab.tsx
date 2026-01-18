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
    <div className="space-y-3">
      {flags.map((flag, i) => (
        <div
          key={i}
          className={`issue-card issue-card-${flag.severity} cursor-pointer dark:bg-gray-800/50 transition-all hover:shadow-md`}
          onClick={() => setExpandedCard(expandedCard === i ? null : i)}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`issue-badge issue-badge-${flag.severity}`}>{flag.severity}</span>
                <span className="mono text-xs text-gray-400 dark:text-gray-500">{flag.ruleId}</span>
              </div>
              <h4 className="heading-md mb-1 dark:text-white">{flag.ruleName}</h4>
              <p className="body-sm text-gray-600 dark:text-gray-400 line-clamp-2">{flag.explanation}</p>
              
              {/* Success Probability Meter */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      flag.successProbability > 80 ? 'bg-green-500' :
                      flag.successProbability > 50 ? 'bg-amber-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${flag.successProbability}%` }}
                  />
                </div>
                <span className="mono text-[9px] text-gray-400 dark:text-gray-500 font-medium">{flag.successProbability}% Winning Prob.</span>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedCard === i ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {expandedCard === i && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3 fade-in">
              <div>
                <p className="label text-xs mb-1 dark:text-gray-400">Why This Matters</p>
                <p className="body-sm dark:text-gray-300">{flag.whyItMatters}</p>
              </div>
              {flag.suggestedEvidence.length > 0 && (
                <div>
                  <p className="label text-xs mb-1 dark:text-gray-400">Suggested Evidence</p>
                  <ul className="body-sm list-disc list-inside text-gray-600 dark:text-gray-400">
                    {flag.suggestedEvidence.map((e, j) => <li key={j}>{e}</li>)}
                  </ul>
                </div>
              )}
              {flag.legalCitations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {flag.legalCitations.map((cite, j) => (
                    <span key={j} className="mono text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded border dark:border-gray-600">{cite}</span>
                  ))}
                </div>
              )}

              {/* Bureau Specific Tactics */}
              {flag.bureauTactics && Object.keys(flag.bureauTactics).length > 0 && (
                <div className="mt-4 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded border border-amber-100 dark:border-amber-800/30">
                  <p className="label text-[9px] text-amber-600 dark:text-amber-400 mb-2 uppercase font-bold tracking-widest">Bureau-Specific Strategy</p>
                  <div className="space-y-2">
                    {Object.entries(flag.bureauTactics).map(([bureau, tactic], j) => (
                      <div key={j} className="flex gap-2">
                        <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase w-16 flex-shrink-0">{bureau}:</span>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">{tactic}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ViolationsTab;
