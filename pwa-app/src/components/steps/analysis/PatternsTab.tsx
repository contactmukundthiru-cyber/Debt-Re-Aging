'use strict';

import React from 'react';
import { PatternInsight } from '../../../lib/analytics';

interface PatternsTabProps {
  patterns: PatternInsight[];
}

const PatternsTab: React.FC<PatternsTabProps> = ({ patterns }) => {
  if (patterns.length === 0) {
    return (
      <div className="panel-inset p-12 text-center dark:bg-gray-800/20 dark:border-gray-700">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="heading-md mb-1 dark:text-white">No Patterns Detected</h3>
        <p className="body-sm text-gray-500 dark:text-gray-400">No significant reporting patterns were identified in this account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {patterns.map((pattern, i) => (
        <div key={i} className={`panel p-4 border-l-4 dark:bg-gray-800/50 dark:border-gray-700 ${
          pattern.significance === 'high' ? 'border-l-red-500' :
          pattern.significance === 'medium' ? 'border-l-amber-500' : 'border-l-gray-300'
        }`}>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h4 className="heading-sm dark:text-white">{pattern.pattern}</h4>
            <span className={`text-xs uppercase tracking-wider font-medium ${
              pattern.significance === 'high' ? 'text-red-600' :
              pattern.significance === 'medium' ? 'text-amber-600' : 'text-gray-500'
            }`}>
              {pattern.significance}
            </span>
          </div>
          <p className="body-sm text-gray-600 dark:text-gray-400 mb-3">{pattern.description}</p>
          <p className="body-sm dark:text-gray-300">
            <span className="font-medium">Recommendation:</span> {pattern.recommendation}
          </p>
        </div>
      ))}
    </div>
  );
};

export default PatternsTab;
