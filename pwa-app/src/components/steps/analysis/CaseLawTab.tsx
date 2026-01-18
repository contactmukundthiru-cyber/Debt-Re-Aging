'use strict';

import React from 'react';
import { CaseLaw } from '../../../lib/caselaw';

interface CaseLawTabProps {
  relevantCaseLaw: CaseLaw[];
}

const CaseLawTab: React.FC<CaseLawTabProps> = ({ relevantCaseLaw }) => {
  if (relevantCaseLaw.length === 0) {
    return (
      <div className="panel-inset p-12 text-center dark:bg-gray-800/20 dark:border-gray-700">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
        <h3 className="heading-md mb-1 dark:text-white">No Case Law Matches</h3>
        <p className="body-sm text-gray-500 dark:text-gray-400">No specific legal precedents were found for the detected violations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      {relevantCaseLaw.map((law, i) => (
        <div key={i} className="panel p-5 border-l-4 border-l-gray-900 dark:border-l-white dark:bg-gray-800/50 dark:border-gray-700 transition-all hover:translate-x-1">
          <div className="flex justify-between items-start mb-2">
            <h4 className="heading-sm font-bold dark:text-white">{law.case}</h4>
            <span className="mono text-[10px] bg-gray-100 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded uppercase">Legal Precedent</span>
          </div>
          <p className="mono text-xs text-gray-500 dark:text-gray-500 mb-3">{law.citation}</p>
          <div className="space-y-3">
            <div>
              <p className="label text-[10px] text-gray-400 dark:text-gray-500 uppercase">Relevance to your case</p>
              <p className="body-sm text-gray-700 dark:text-gray-300">{law.relevance}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-800">
              <p className="label text-[10px] text-gray-400 dark:text-gray-500 uppercase mb-1">Key Ruling</p>
              <p className="body-sm italic dark:text-gray-400">"{law.ruling}"</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CaseLawTab;
