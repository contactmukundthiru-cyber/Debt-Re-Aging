'use client';

import React, { useMemo, useState } from 'react';
import { CreditFields, RuleFlag, RiskProfile } from '../../lib/rules';
import { ForensicSummary } from '../../lib/analytics';
import { Step } from '../../lib/constants';
import { ParsedFields } from '../../lib/parser';

interface AnalyzedAccount {
  id: string;
  fields: CreditFields;
  flags: RuleFlag[];
  risk: RiskProfile;
  rawText: string;
}

interface Step2ReviewProps {
  analyzedAccounts: AnalyzedAccount[];
  executiveSummary: ForensicSummary | null;
  flags: RuleFlag[];
  discoveryAnswers: Record<string, string>;
  fileName: string | null;
  rawText: string;
  setRawText: (text: string) => void;
  setEditableFields: (fields: CreditFields) => void;
  setStep: (step: Step) => void;
  fieldsToSimple: (fields: ParsedFields) => CreditFields;
  parseCreditReport: (text: string) => ParsedFields;
}

export const Step2Review: React.FC<Step2ReviewProps> = ({
  analyzedAccounts,
  executiveSummary,
  flags,
  discoveryAnswers,
  fileName,
  rawText,
  setRawText,
  setEditableFields,
  setStep,
  fieldsToSimple,
  parseCreditReport,
}) => {
  const [sortKey, setSortKey] = useState<'risk' | 'violations' | 'balance' | 'name'>('risk');

  const parseBalance = (value?: string) => {
    if (!value) return 0;
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const sortedAccounts = useMemo(() => {
    const cloned = [...analyzedAccounts];
    cloned.sort((a, b) => {
      if (sortKey === 'violations') {
        return b.flags.length - a.flags.length;
      }
      if (sortKey === 'balance') {
        return parseBalance(b.fields.currentBalance) - parseBalance(a.fields.currentBalance);
      }
      if (sortKey === 'name') {
        const aName = a.fields.furnisherOrCollector || a.fields.originalCreditor || '';
        const bName = b.fields.furnisherOrCollector || b.fields.originalCreditor || '';
        return aName.localeCompare(bName);
      }
      return b.risk.overallScore - a.risk.overallScore;
    });
    return cloned;
  }, [analyzedAccounts, sortKey]);

  const analyzeAccount = (account: AnalyzedAccount) => {
    setEditableFields(account.fields);
    setRawText(account.rawText);
    setStep(3);
  };

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="heading-lg mb-2 dark:text-white">
          {analyzedAccounts.length > 1 ? 'Select Accounts to Analyze' : 'Review Extracted Text'}
        </h2>
        <p className="body-md text-gray-600 dark:text-gray-400">
          {analyzedAccounts.length > 1 
            ? `We found ${analyzedAccounts.length} accounts in your report. Select one to proceed with forensic analysis.`
            : 'Verify the text was extracted correctly. Edit if needed.'}
        </p>
      </div>

      {analyzedAccounts.length > 1 && executiveSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="panel p-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900">
            <p className="label text-gray-400 dark:text-gray-500 mb-1">Total Found</p>
            <p className="text-3xl font-bold">{executiveSummary.totalAccounts}</p>
            <p className="text-[10px] mt-1 text-gray-500">Accounts segmented</p>
          </div>
          <div className="panel p-4 border-red-100 bg-red-50/30 dark:bg-red-900/10">
            <p className="label text-red-500 mb-1">Violations</p>
            <p className="text-3xl font-bold text-red-600">{executiveSummary.totalViolations}</p>
            <p className="text-[10px] mt-1 text-red-400">Potential FCRA counts</p>
          </div>
          <div className="panel p-4 border-amber-100 bg-amber-50/30 dark:bg-amber-900/10">
            <p className="label text-amber-500 mb-1">Critical</p>
            <p className="text-3xl font-bold text-amber-600">{executiveSummary.criticalAccounts}</p>
            <p className="text-[10px] mt-1 text-amber-400">High-risk tradelines</p>
          </div>
          <div className="panel p-4 border-green-100 bg-green-50/30 dark:bg-green-900/10">
            <p className="label text-green-500 mb-1">Est. Damages</p>
            <p className="text-2xl font-bold text-green-600">${executiveSummary.totalEstimatedDamages.toLocaleString()}</p>
            <p className="text-[10px] mt-1 text-green-400">Liability projection</p>
          </div>
          
          {/* Forensic Readiness Card */}
          {(() => {
            const totalPossible = Array.from(new Set(flags.flatMap(f => f.suggestedEvidence))).length;
            const checkedCount = Object.keys(discoveryAnswers).filter(k => k.startsWith('ev-') && discoveryAnswers[k] === 'checked').length;
            const readiness = totalPossible > 0 ? Math.round((checkedCount / totalPossible) * 100) : 0;
            
            return (
              <div className="panel p-4 border-blue-100 bg-blue-50/30 dark:bg-blue-900/10">
                <p className="label text-blue-500 mb-1">Discovery Progress</p>
                <p className="text-2xl font-bold text-blue-600">{readiness}%</p>
                <p className="text-[10px] mt-1 text-blue-400">Evidence verified</p>
              </div>
            );
          })()}

          {executiveSummary.discrepancies.length > 0 && (
            <div className="md:col-span-4 panel p-4 border-amber-200 bg-amber-50/50 dark:bg-amber-900/20">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h4 className="heading-sm text-amber-900 dark:text-amber-200">Material Discrepancies Detected</h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {executiveSummary.discrepancies.map((d, i) => (
                  <div key={i} className="bg-white/50 dark:bg-black/20 p-3 rounded border border-amber-100 dark:border-amber-800/30">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-tighter mb-1">{d.field}</p>
                    <p className="body-sm text-amber-700 dark:text-amber-400 mb-2">{d.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {d.values.map((v, j) => (
                        <span key={j} className="mono text-[10px] bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-200">{v}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {analyzedAccounts.length > 1 ? (
        <>
          <div className="panel p-4 mb-4 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="label text-gray-500 dark:text-gray-400">Account Triage</p>
                <p className="body-sm text-gray-600 dark:text-gray-400">
                  Sort by risk or violations, then choose the tradeline to analyze.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Sort</label>
                <select
                  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                >
                  <option value="risk">Highest Risk</option>
                  <option value="violations">Most Violations</option>
                  <option value="balance">Highest Balance</option>
                  <option value="name">Name (A–Z)</option>
                </select>
                <button
                  type="button"
                  className="btn btn-secondary text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700"
                  onClick={() => analyzeAccount(sortedAccounts[0])}
                  disabled={sortedAccounts.length === 0}
                >
                  Analyze Top Risk
                </button>
              </div>
            </div>
          </div>
          <div className="grid gap-4 mb-8">
            {sortedAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => analyzeAccount(acc)}
                className="panel p-4 text-left hover:border-gray-900 transition-all group dark:bg-gray-900 dark:border-gray-800 dark:hover:border-white"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="heading-md mb-1 dark:text-white">
                      {acc.fields.furnisherOrCollector || acc.fields.originalCreditor || 'Unknown Account'}
                    </p>
                    <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>Balance: ${acc.fields.currentBalance || '0.00'}</span>
                      <span>Type: {acc.fields.accountType || 'N/A'}</span>
                      <span className={`font-medium ${acc.flags.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {acc.flags.length} potential violations
                      </span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {fileName && (
            <div className="panel-inset p-3 mb-4 flex items-center gap-3 dark:bg-gray-900 dark:border-gray-800">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="body-sm font-medium dark:text-gray-300">{fileName}</span>
              <span className="mono text-xs text-gray-400 ml-auto">{rawText.length.toLocaleString()} chars</span>
            </div>
          )}

          <div className="mb-6">
            <textarea
              className="textarea h-80 font-mono text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Extracted text will appear here..."
            />
          </div>
        </>
      )}

      <div className="flex justify-between">
        <button type="button" className="btn btn-secondary dark:bg-gray-800 dark:text-white dark:border-gray-700" onClick={() => setStep(1)}>
          Back
        </button>
        {analyzedAccounts.length <= 1 && (
          <button type="button" className="btn btn-primary" onClick={() => {
            const parsed = parseCreditReport(rawText);
            setEditableFields(fieldsToSimple(parsed));
            setStep(3);
          }}>
            Continue to Verify
          </button>
        )}
      </div>
    </div>
  );
};

export default Step2Review;
