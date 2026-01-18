'use strict';

import React from 'react';
import { RiskProfile } from '../../../lib/rules';

interface ScoreBreakdownTabProps {
  riskProfile: RiskProfile;
}

const ScoreBreakdownTab: React.FC<ScoreBreakdownTabProps> = ({ riskProfile }) => {
  return (
    <div className="fade-in space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        {riskProfile.scoreBreakdown.map((cat, i) => (
          <div key={i} className="panel p-5 border-gray-100 dark:border-gray-800 dark:bg-gray-800/50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="heading-sm text-gray-900 dark:text-white">{cat.category}</h4>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                cat.impact > 50 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                cat.impact > 20 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                Impact: {cat.impact}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-1000 ${
                  cat.impact > 50 ? 'bg-red-500' :
                  cat.impact > 20 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${cat.impact}%` }}
              />
            </div>
            <p className="body-sm text-gray-500 dark:text-gray-400">{cat.description}</p>
          </div>
        ))}
      </div>

      {/* Overall Risk Gauge */}
      <div className="panel p-6 bg-gray-50/30 dark:bg-gray-800/20 border-dashed dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-gray-200 dark:text-gray-700 stroke-current"
                strokeWidth="8"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className={`stroke-current transition-all duration-1000 ${
                  riskProfile.riskLevel === 'critical' ? 'text-red-600' :
                  riskProfile.riskLevel === 'high' ? 'text-orange-500' :
                  riskProfile.riskLevel === 'medium' ? 'text-amber-500' : 'text-green-500'
                }`}
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * riskProfile.overallScore) / 100}
                strokeLinecap="round"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-2xl font-bold dark:text-white">{riskProfile.overallScore}</span>
              <span className="text-[8px] uppercase tracking-widest text-gray-400 dark:text-gray-500">Risk Index</span>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="heading-md mb-2 dark:text-white">Dispute Strength: <span className="text-gray-900 dark:text-blue-400 underline decoration-2">{riskProfile.disputeStrength.toUpperCase()}</span></h3>
            <p className="body-sm text-gray-600 dark:text-gray-400 max-w-lg">
              {riskProfile.recommendedApproach}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreBreakdownTab;
