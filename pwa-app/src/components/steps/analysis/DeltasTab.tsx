'use strict';

import React from 'react';
import { DeltaResult } from '../../../lib/delta';

interface DeltasTabProps {
  deltas: DeltaResult[];
}

const DeltasTab: React.FC<DeltasTabProps> = ({ deltas }) => {
  if (deltas.length === 0) {
    return (
      <div className="panel-inset p-12 text-center dark:bg-gray-800/20 dark:border-gray-700">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="heading-md mb-1 dark:text-white">No Comparison Active</h3>
        <p className="body-sm text-gray-500 dark:text-gray-400">To use Delta Analysis, open a previous analysis from history while currently viewing a report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 fade-in">
      <div className="panel p-0 overflow-hidden border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
        <div className="bg-gray-50/50 dark:bg-gray-800 p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h4 className="heading-sm dark:text-white">Forensic Delta Analysis</h4>
          <span className="badge badge-dark">Comparative Evidence</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {deltas.map((delta, i) => (
            <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                delta.impact === 'negative' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                delta.impact === 'positive' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {delta.impact === 'negative' ? '↓' : delta.impact === 'positive' ? '↑' : '•'}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{delta.field}</span>
                  <span className="mono text-xs line-through text-gray-400 dark:text-gray-500">{delta.oldValue}</span>
                  <svg className="w-3 h-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  <span className={`text-sm font-bold ${
                    delta.impact === 'negative' ? 'text-red-600 dark:text-red-400' :
                    delta.impact === 'positive' ? 'text-green-600 dark:text-green-400' :
                    'text-gray-900 dark:text-white'
                  }`}>{delta.newValue}</span>
                </div>
                <p className="body-sm text-gray-600 dark:text-gray-400">{delta.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeltasTab;
