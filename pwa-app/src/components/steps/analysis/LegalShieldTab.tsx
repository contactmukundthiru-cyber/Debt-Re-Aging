'use strict';

import React from 'react';
import { generateStateGuidance, getStateLaws } from '../../../lib/state-laws';
import { CreditFields } from '../../../lib/rules';

interface LegalShieldTabProps {
  editableFields: Partial<CreditFields>;
}

const LegalShieldTab: React.FC<LegalShieldTabProps> = ({ editableFields }) => {
  if (!editableFields.stateCode) {
    return (
      <div className="panel-inset p-12 text-center dark:bg-gray-800/20 dark:border-gray-700">
        <p className="body-md text-gray-500 dark:text-gray-400">Please provide your state in Step 3 to see local protections.</p>
      </div>
    );
  }

  const guidance = generateStateGuidance(
    editableFields.stateCode,
    editableFields.dateLastPayment,
    editableFields.accountType,
    editableFields.currentBalance
  );
  const stateInfo = getStateLaws(editableFields.stateCode);

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded flex items-center justify-center heading-lg shadow-lg">
          {editableFields.stateCode}
        </div>
        <div>
          <h3 className="heading-md dark:text-white">{stateInfo.name} Jurisdictional Protection</h3>
          <p className="body-sm text-gray-500 dark:text-gray-400">State-specific consumer defense mapping</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="panel p-5 border-l-4 border-l-blue-500 dark:bg-gray-800/50 dark:border-gray-700">
          <h4 className="heading-sm mb-3 dark:text-white">Statute of Limitations</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-700">
              <span className="body-sm dark:text-gray-400">Status</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                guidance.solStatus === 'expired' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                guidance.solStatus === 'expiring' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
              }`}>
                {guidance.solStatus}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-700">
              <span className="body-sm dark:text-gray-400">Expiry Date</span>
              <span className="mono text-sm dark:text-white">{guidance.solExpiry || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="body-sm dark:text-gray-400">Written Contract SOL</span>
              <span className="mono text-sm dark:text-white">{stateInfo.sol.writtenContracts} Years</span>
            </div>
          </div>
        </div>

        <div className="panel p-5 border-l-4 border-l-purple-500 dark:bg-gray-800/50 dark:border-gray-700">
          <h4 className="heading-sm mb-3 dark:text-white">Interest Rate Caps</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-700">
              <span className="body-sm dark:text-gray-400">Judgment Cap</span>
              <span className="mono text-sm dark:text-white">{stateInfo.interestCaps.judgments}%</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-700">
              <span className="body-sm dark:text-gray-400">Medical Cap</span>
              <span className="mono text-sm dark:text-white">{stateInfo.interestCaps.medical}%</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="body-sm dark:text-gray-400">Consumer Cap</span>
              <span className="mono text-sm dark:text-white">{stateInfo.interestCaps.consumer}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel p-5 dark:bg-gray-800/50 dark:border-gray-700">
        <h4 className="heading-sm mb-4 dark:text-white">State-Specific Protections</h4>
        <div className="grid sm:grid-cols-2 gap-4">
          {guidance.protections.map((p, i) => (
            <div key={i} className="flex items-start gap-3">
              <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="body-sm text-gray-700 dark:text-gray-300">{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="panel p-5 bg-amber-50/30 dark:bg-amber-900/10 dark:border-gray-700">
          <h4 className="heading-sm mb-4 flex items-center gap-2 dark:text-white">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Strategic Recommendations
          </h4>
          <ul className="space-y-2">
            {guidance.recommendations.map((r, i) => (
              <li key={i} className="body-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-5 dark:bg-gray-800/50 dark:border-gray-700">
          <h4 className="heading-sm mb-4 dark:text-white">Legal Resources</h4>
          <ul className="space-y-2">
            {guidance.legalResources.map((r, i) => (
              <li key={i} className="body-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel p-4 border-dashed dark:bg-gray-800/50 dark:border-gray-700">
        <h4 className="heading-sm mb-2 dark:text-white">Key Statutes</h4>
        <div className="flex flex-wrap gap-2">
          {stateInfo.keyStatutes.map((s, i) => (
            <span key={i} className="mono text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded border dark:border-gray-600">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LegalShieldTab;
