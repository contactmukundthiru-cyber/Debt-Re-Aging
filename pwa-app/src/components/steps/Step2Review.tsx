'use client';

import React, { useMemo, useState } from 'react';
import { CreditFields, RuleFlag, RiskProfile } from '../../lib/rules';
import { ForensicSummary } from '../../lib/analytics';
import { Step } from '../../lib/constants';
import { ParsedFields } from '../../lib/parser';

interface AnalyzedAccount {
  id: string;
  fields: CreditFields;
  parsedFields?: ParsedFields;
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
  setActiveParsedFields: (fields: ParsedFields | null) => void;
  setStep: (step: Step) => void;
  fieldsToSimple: (fields: ParsedFields) => CreditFields;
  parseCreditReport: (text: string) => ParsedFields;
}

export const Step2Review: React.FC<Step2ReviewProps> = ({
  analyzedAccounts,
  executiveSummary,
  flags,
  fileName,
  rawText,
  setRawText,
  setEditableFields,
  setActiveParsedFields,
  setStep,
  fieldsToSimple,
  parseCreditReport,
}) => {
  const [sortKey, setSortKey] = useState<'risk' | 'violations' | 'balance' | 'name'>('risk');
  const [searchTerm, setSearchTerm] = useState('');

  const parseBalance = (value?: string) => {
    if (!value) return 0;
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const sortedAccounts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = query
      ? analyzedAccounts.filter(acc => {
        const name = (acc.fields.furnisherOrCollector || acc.fields.originalCreditor || '').toLowerCase();
        return name.includes(query);
      })
      : analyzedAccounts;
    const cloned = [...filtered];
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
  }, [analyzedAccounts, sortKey, searchTerm]);

  const analyzeAccount = (account: AnalyzedAccount) => {
    setEditableFields(account.fields);
    setActiveParsedFields(account.parsedFields || null);
    setRawText(account.rawText);
    setStep(3);
  };

  return (
    <div className="fade-in max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="premium-card p-12 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl mb-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-indigo-400 font-mono">Forensic Triage Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {analyzedAccounts.length > 1 ? (
              <>Account <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Forensic Triage</span></>
            ) : (
              <>Review <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Extracted Evidence</span></>
            )}
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            {analyzedAccounts.length > 1
              ? `Forensic engine isolated ${analyzedAccounts.length} distinct tradelines. Select a high-risk target for deep analysis.`
              : 'Verify OCR/extraction integrity before launching forensic violation mapping.'}
          </p>
        </div>
      </div>

      {analyzedAccounts.length > 1 && executiveSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="premium-card p-6 bg-slate-950 border-slate-800 text-white shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 relative z-10">Tradelines</p>
            <p className="text-5xl font-bold tabular-nums relative z-10">{executiveSummary.totalAccounts}</p>
          </div>
          <div className="premium-card p-6 bg-rose-500/5 border-rose-500/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-3 relative z-10">Violations</p>
            <p className="text-5xl font-bold tabular-nums text-rose-500 relative z-10">{executiveSummary.totalViolations}</p>
          </div>
          <div className="premium-card p-6 bg-amber-500/5 border-amber-500/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-3 relative z-10">High Risk</p>
            <p className="text-5xl font-bold tabular-nums text-amber-500 relative z-10">{executiveSummary.criticalAccounts}</p>
          </div>
          <div className="premium-card p-6 bg-emerald-500/5 border-emerald-500/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-3 relative z-10">Est. Recovery</p>
            <p className="text-4xl font-bold tabular-nums text-emerald-500 relative z-10">${executiveSummary.totalEstimatedDamages.toLocaleString()}</p>
          </div>

          {executiveSummary.discrepancies.length > 0 && (
            <div className="lg:col-span-4 premium-card p-8 border-amber-500/20 bg-amber-500/5 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -mr-24 -mt-24" />
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-amber-600 dark:text-amber-400">Cross-Bureau Inconsistencies</h4>
                  <p className="text-sm text-amber-500/70">Data discrepancies detected across bureau reports</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 relative z-10">
                {executiveSummary.discrepancies.map((d, i) => (
                  <div key={i} className="bg-white/60 dark:bg-slate-900/40 p-5 rounded-2xl border border-amber-200/50 dark:border-amber-800/30">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">{d.field}</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">{d.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {d.values.map((v, j) => (
                        <span key={j} className="text-[10px] font-bold bg-amber-100/50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30 text-amber-800 dark:text-amber-200 tabular-nums">{v}</span>
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
          <div className="premium-card p-6 mb-8 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Target Prioritization</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select a tradeline for deep forensic mapping.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  className="w-48 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white text-xs"
                  placeholder="Filter by creditor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white text-xs appearance-none cursor-pointer pr-8"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                >
                  <option value="risk">High Risk First</option>
                  <option value="violations">Violation Count</option>
                  <option value="balance">Highest Balance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 mb-10">
            {sortedAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => analyzeAccount(acc)}
                className="premium-card p-6 text-left hover:border-emerald-500/30 transition-all group relative overflow-hidden bg-white/50 dark:bg-slate-900/50"
              >
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`w-2 h-2 rounded-full ${acc.flags.length > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <p className="text-xl font-bold dark:text-white tracking-tight">
                        {acc.fields.furnisherOrCollector || acc.fields.originalCreditor || 'Unknown Entity'}
                      </p>
                    </div>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span className="flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> ${acc.fields.currentBalance || '0.00'}</span>
                      <span className="flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> {acc.fields.accountType || 'N/A'}</span>
                      <span className={`flex items-center gap-1.5 ${acc.flags.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        {acc.flags.length} Potential Infractions
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="premium-card p-8 mb-8 bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <h3 className="text-xs font-bold dark:text-white uppercase tracking-widest">{fileName || 'Manual Source Extraction'}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-tighter">Raw Data Stream | {rawText.length.toLocaleString()} Chars</p>
              </div>
            </div>
            <button
              onClick={() => setRawText('')}
              className="text-[10px] font-bold text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-800 hover:text-rose-500 hover:border-rose-500 transition-all uppercase"
            >
              Clear Buffer
            </button>
          </div>

          <textarea
            className="w-full h-80 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 font-mono text-xs leading-relaxed text-slate-600 dark:text-slate-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner resize-none relative z-10 custom-scrollbar"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Extracted text will appear here. You can manually refine the data buffer if required..."
          />
        </div>
      )}

      <div className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 mb-12">
        <button
          type="button"
          className="btn btn-secondary !py-4 !px-12 !rounded-2xl dark:text-white"
          onClick={() => setStep(1)}
        >
          Back to Input
        </button>
        {analyzedAccounts.length <= 1 && (
          <button
            type="button"
            className="btn btn-primary !py-4 !px-12 !rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform"
            onClick={() => {
              const parsed = parseCreditReport(rawText);
              setActiveParsedFields(parsed);
              setEditableFields(fieldsToSimple(parsed));
              setStep(3);
            }}
          >
            Launch Forensic Scan
          </button>
        )}
      </div>
    </div>
  );
};

export default Step2Review;
