'use strict';

import React from 'react';
import { RuleFlag } from '../../../lib/rules';
import { TabId } from '../../../lib/constants';

interface DiscoveryTabProps {
  flags: RuleFlag[];
  discoveryAnswers: Record<string, string>;
  setDiscoveryAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
}

const DiscoveryTab: React.FC<DiscoveryTabProps> = ({
  flags,
  discoveryAnswers,
  setDiscoveryAnswers,
  setActiveTab
}) => {
  const suggestedEvidence = Array.from(new Set(flags.flatMap(f => f.suggestedEvidence)));

  return (
    <div className="fade-in space-y-6">
      <div className="panel p-6 bg-blue-50/30 dark:bg-blue-900/10 border-dashed dark:border-blue-900/30">
        <h3 className="heading-md mb-2 flex items-center gap-2 dark:text-blue-400">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Forensic Discovery Questionnaire
        </h3>
        <p className="body-sm text-gray-600 dark:text-gray-400 mb-6">
          Answer these targeted questions to uncover hidden violations and strengthen your evidence package.
        </p>

        <div className="space-y-8">
          {flags.filter(f => (f.discoveryQuestions?.length ?? 0) > 0).map((flag, i) => (
            <div key={i} className="space-y-4 fade-in">
              <div className="flex items-center gap-2">
                <span className="badge badge-dark text-[9px] dark:bg-gray-700">{flag.ruleId}</span>
                <h4 className="heading-sm text-gray-900 dark:text-white">{flag.ruleName}</h4>
              </div>
              <div className="grid gap-4">
                {flag.discoveryQuestions?.map((q, j) => (
                  <div key={j} className="space-y-2">
                    <label className="body-sm font-medium text-gray-700 dark:text-gray-300">{q}</label>
                    <textarea
                      className="textarea h-20 text-sm dark:bg-gray-900 dark:border-gray-800 dark:text-white"
                      placeholder="Your answer here..."
                      value={discoveryAnswers[`${flag.ruleId}-${j}`] || ''}
                      onChange={(e) => setDiscoveryAnswers(prev => ({ ...prev, [`${flag.ruleId}-${j}`]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-6 dark:bg-gray-800/50 dark:border-gray-700">
        <h3 className="heading-md mb-4 dark:text-white">Evidence Checklist</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {suggestedEvidence.map((evidence, i) => (
            <label key={i} className="flex items-start gap-3 p-3 rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer group">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-900"
                checked={discoveryAnswers[`ev-${i}`] === 'checked'}
                onChange={(e) => setDiscoveryAnswers(prev => ({ ...prev, [`ev-${i}`]: e.target.checked ? 'checked' : '' }))}
              />
              <span className="body-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                {evidence}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscoveryTab;
