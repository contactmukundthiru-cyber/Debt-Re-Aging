'use strict';

import React from 'react';
import { RuleFlag } from '../../../lib/rules';

interface ForensicLabTabProps {
  flags: RuleFlag[];
}

const ForensicLabTab: React.FC<ForensicLabTabProps> = ({ flags }) => {
  const citations = Array.from(new Set(flags.flatMap(f => f.legalCitations)));
  const highSeverityFlags = flags.filter(f => f.severity === 'high');

  return (
    <div className="fade-in space-y-6">
      <div className="panel p-6 bg-gray-900 text-white border-none shadow-2xl dark:bg-black">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-serif mb-1 italic text-blue-400">The Forensic Lab</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Advanced Legal Analysis & Statutory Mapping</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 mb-1">Citations Tracked</p>
            <p className="text-2xl font-bold">{citations.length}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="heading-sm text-blue-300 border-b border-gray-800 pb-2">Statutory Basis</h4>
            <div className="space-y-4">
              {citations.map((cite, i) => (
                <div key={i} className="flex gap-4 fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="mono text-xs text-blue-500 bg-blue-900/30 px-2 py-1 h-fit rounded border border-blue-900/50">{cite}</span>
                  <div className="flex-1">
                    <p className="body-sm text-gray-300">
                      {cite === 'FCRA_605_a' && '15 U.S.C. § 1681c(a) - Prohibits reporting of obsolete information (7-year rule).'}
                      {cite === 'FCRA_623_a1' && '15 U.S.C. § 1681s-2(a)(1) - Prohibits furnishers from reporting inaccurate information.'}
                      {cite === 'FCRA_611' && '15 U.S.C. § 1681i - Procedure in case of disputed accuracy.'}
                      {cite === 'FDCPA_807' && '15 U.S.C. § 1692e - Prohibits false or misleading representations by collectors.'}
                      {cite === 'METRO2_GUIDE' && 'Industry standard for data integrity and accurate status reporting.'}
                      {!['FCRA_605_a', 'FCRA_623_a1', 'FCRA_611', 'FDCPA_807', 'METRO2_GUIDE'].includes(cite) && 'Federal or state consumer protection statute governing reporting accuracy.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="heading-sm text-blue-300 border-b border-gray-800 pb-2">Evidence Synthesis</h4>
            <div className="space-y-4">
              {highSeverityFlags.map((flag, i) => (
                <div key={i} className="p-3 bg-gray-800/50 rounded border border-gray-700 fade-in">
                  <p className="text-[10px] uppercase text-blue-400 font-bold mb-1 tracking-widest">{flag.ruleId}</p>
                  <p className="text-xs text-gray-400 mb-2 leading-tight">{flag.explanation}</p>
                  <div className="flex gap-2">
                    {flag.suggestedEvidence.slice(0, 2).map((e, j) => (
                      <span key={j} className="text-[9px] text-gray-500 flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {highSeverityFlags.length === 0 && (
                <p className="body-sm text-gray-500 italic text-center py-8">No high-severity violations to synthesize.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForensicLabTab;
