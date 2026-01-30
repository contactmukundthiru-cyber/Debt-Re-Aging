'use client';

import React from 'react';
import { FIELD_CONFIG, ACCOUNT_TYPES, STATUSES, STATES, Step } from '../../lib/constants';
import { ConsumerInfo } from '../../lib/types';
import { getDateValidation, getCurrencyValidation, getDateOrderIssues } from '../../lib/validation';
import { CreditFields } from '../../lib/types';
import { ParsedFields, getExtractionQuality } from '../../lib/parser';

import { getSmartRecommendations, SmartRecommendation } from '../../lib/intelligence';

interface Step3VerifyProps {
  editableFields: Partial<CreditFields>;
  setEditableFields: React.Dispatch<React.SetStateAction<Partial<CreditFields>>>;
  activeParsedFields: ParsedFields | null;
  rawText: string;
  consumer: ConsumerInfo;
  setConsumer: React.Dispatch<React.SetStateAction<ConsumerInfo>>;
  runAnalysis: () => void;
  isAnalyzing: boolean;
  setStep: (step: Step) => void;
  showHelp: string | null;
  setShowHelp: (key: string | null) => void;
}

const Step3Verify: React.FC<Step3VerifyProps> = ({
  editableFields,
  setEditableFields,
  activeParsedFields,
  rawText,
  consumer,
  setConsumer,
  runAnalysis,
  isAnalyzing,
  setStep,
  showHelp,
  setShowHelp,
}) => {
  const [showWorkbench, setShowWorkbench] = React.useState(false);
  const [showSmartFixes, setShowSmartFixes] = React.useState(true);

  const recommendations = React.useMemo(() => getSmartRecommendations(editableFields), [editableFields]);
  const recommendedFixes = recommendations.filter(rec => rec.suggestedValue);

  const applyAllFixes = () => {
    setEditableFields(prev => {
      const next = { ...prev };
      recommendedFixes.forEach(rec => {
        if (rec.suggestedValue) {
          next[rec.field] = rec.suggestedValue as any;
        }
      });
      return next;
    });
  };

  const dateFields = FIELD_CONFIG.filter(f => f.section === 'dates');
  const amountFields = FIELD_CONFIG.filter(f => f.section === 'amounts');

  const dateIssues = dateFields
    .map(field => {
      const value = (editableFields as Record<string, string>)[field.key] || '';
      const validation = getDateValidation(value, !!field.required);
      return {
        key: field.key,
        label: field.label,
        required: !!field.required,
        valid: validation.valid,
        message: validation.message
      };
    })
    .filter(issue => !issue.valid);

  const amountIssues = amountFields
    .map(field => {
      const value = (editableFields as Record<string, string>)[field.key] || '';
      const validation = getCurrencyValidation(value);
      return {
        key: field.key,
        label: field.label,
        valid: validation.valid,
        message: validation.message
      };
    })
    .filter(issue => !issue.valid);

  const blockingIssues = dateIssues.filter(issue => issue.required);
  const logicalIssues = getDateOrderIssues(editableFields as Record<string, string | undefined>);
  const logicalBlocking = logicalIssues.filter(issue => issue.severity === 'blocking');
  const logicalWarnings = logicalIssues.filter(issue => issue.severity === 'warning');
  const canAnalyze = blockingIssues.length === 0 && logicalBlocking.length === 0;

  const quality = activeParsedFields ? getExtractionQuality(activeParsedFields) : null;

  const jumpToField = (fieldKey: string) => {
    const element = document.getElementById(fieldKey);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (element as HTMLInputElement | HTMLSelectElement).focus();
  };

  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ field?: string }>).detail;
      if (detail?.field) {
        jumpToField(detail.field);
      }
    };
    window.addEventListener('cra:focus-field', handler as EventListener);
    return () => window.removeEventListener('cra:focus-field', handler as EventListener);
  }, []);

  return (
    <div className="fade-in max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl mb-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-cyan-400 font-mono">Data Validation Suite</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Verify <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">Forensic Indicators</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-lg">Accurate data points are essential for institutional-grade violation mapping and legal defensibility.</p>
          </div>

          <button
            onClick={() => setShowWorkbench(!showWorkbench)}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${showWorkbench
              ? 'bg-white text-slate-900 shadow-xl'
              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
            {showWorkbench ? 'Hide Workbench' : 'Forensic Workbench'}
          </button>
        </div>
      </div>

      {/* Extraction Quality Panel */}
      {quality && (
        <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
          <div className="relative z-10 flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-5">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-lg" />
                <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="3"></circle>
                  <circle cx="18" cy="18" r="14" fill="none" className="stroke-emerald-500" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${quality.score * 0.88}, 100`}></circle>
                </svg>
                <span className="absolute text-lg font-bold tabular-nums dark:text-white">{quality.score}%</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Extraction Confidence</p>
                <p className="text-base font-bold text-emerald-500">{quality.description}</p>
              </div>
            </div>
            <div className="h-12 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block" />
            <div className="flex-grow">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Detected Fields</p>
              <div className="flex flex-wrap gap-2">
                {quality.details.map((detail, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    {detail}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Recommendations Panel */}
      {recommendations.length > 0 && showSmartFixes && (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="premium-card p-6 bg-emerald-500/5 border-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest dark:text-emerald-400">Smart Forensic Corrections</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">AI-detected inconsistencies ({recommendations.length})</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {recommendedFixes.length > 0 && (
                  <button
                    onClick={applyAllFixes}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                  >
                    Apply All ({recommendedFixes.length})
                  </button>
                )}
                <button
                  onClick={() => setShowSmartFixes(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/10 shadow-sm flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${rec.type === 'error' ? 'bg-rose-500' : rec.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <h4 className="text-xs font-bold dark:text-white uppercase tracking-tight">{rec.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{rec.description}</p>
                  </div>
                  {rec.suggestedValue && (
                    <button
                      onClick={() => setEditableFields(prev => ({ ...prev, [rec.field]: rec.suggestedValue }))}
                      className="w-full py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                    >
                      {rec.actionLabel}: {rec.suggestedValue}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(blockingIssues.length > 0 || logicalBlocking.length > 0 || logicalWarnings.length > 0) && (
        <div className="premium-card p-6 mb-10 bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Case Quality Drilldown</p>
              <h3 className="text-lg font-bold dark:text-white">Blocking Issues & Warnings</h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {blockingIssues.length + logicalBlocking.length} blocking • {logicalWarnings.length} warnings
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
              <p className="text-[10px] uppercase tracking-widest text-rose-500 mb-2">Blocking</p>
              {(blockingIssues.length === 0 && logicalBlocking.length === 0) ? (
                <p className="text-xs text-slate-500">No blocking issues found.</p>
              ) : (
                <div className="space-y-2">
                  {blockingIssues.map(issue => (
                    <button
                      key={issue.key}
                      type="button"
                      onClick={() => jumpToField(issue.key)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-500/20 text-left"
                    >
                      <span className="text-xs font-semibold text-rose-500">{issue.label}: {issue.message}</span>
                      <span className="text-[9px] uppercase tracking-widest text-rose-400">Jump</span>
                    </button>
                  ))}
                  {logicalBlocking.map(issue => (
                    <button
                      key={issue.field}
                      type="button"
                      onClick={() => jumpToField(issue.field)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-500/20 text-left"
                    >
                      <span className="text-xs font-semibold text-rose-500">{issue.message}</span>
                      <span className="text-[9px] uppercase tracking-widest text-rose-400">Jump</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
              <p className="text-[10px] uppercase tracking-widest text-amber-500 mb-2">Warnings</p>
              {logicalWarnings.length === 0 ? (
                <p className="text-xs text-slate-500">No warnings detected.</p>
              ) : (
                <div className="space-y-2">
                  {logicalWarnings.map(issue => (
                    <button
                      key={issue.field}
                      type="button"
                      onClick={() => jumpToField(issue.field)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/20 text-left"
                    >
                      <span className="text-xs font-semibold text-amber-600">{issue.message}</span>
                      <span className="text-[9px] uppercase tracking-widest text-amber-500">Jump</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`transition-all duration-500 grid gap-8 ${showWorkbench ? 'lg:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>
        <div className="space-y-8">
          {/* Account Info Section */}
          <div className="premium-card overflow-hidden bg-white dark:bg-slate-900">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold dark:text-white">Identity & Account Meta</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Core forensic identifiers</p>
              </div>
            </div>
            <div className="p-8 grid sm:grid-cols-2 gap-8">
              {FIELD_CONFIG.filter(f => f.section === 'account').map(field => (
                <div key={field.key} className="relative group">
                  <label
                    htmlFor={field.key}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2 cursor-help group-hover:text-emerald-500 transition-colors"
                    onMouseEnter={() => setShowHelp(field.key)}
                    onMouseLeave={() => setShowHelp(null)}
                  >
                    {field.label}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                  </label>
                  {showHelp === field.key && field.help && (
                    <div className="absolute z-50 left-0 bottom-full mb-2 p-3 glass-panel bg-slate-900 text-white text-[10px] font-medium max-w-xs shadow-2xl">
                      {field.help}
                    </div>
                  )}
                  {field.key === 'accountType' ? (
                    <select
                      id={field.key}
                      className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-slate-950 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer ${activeParsedFields?.[field.key]?.confidence === 'Low' ? 'border-amber-300 ring-2 ring-amber-500/10' : 'border-slate-200 dark:border-slate-800'
                        }`}
                      value={(editableFields as Record<string, string>)[field.key] || ''}
                      onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                    >
                      <option value="">Select Category...</option>
                      {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : field.key === 'accountStatus' ? (
                    <select
                      id={field.key}
                      className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-slate-950 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer ${activeParsedFields?.[field.key]?.confidence === 'Low' ? 'border-amber-300 ring-2 ring-amber-500/10' : 'border-slate-200 dark:border-slate-800'
                        }`}
                      value={(editableFields as Record<string, string>)[field.key] || ''}
                      onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                    >
                      <option value="">Select Status...</option>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        id={field.key}
                        type="text"
                        className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-slate-950 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner ${activeParsedFields?.[field.key]?.confidence === 'Low' ? 'border-amber-300 ring-2 ring-amber-500/10' : 'border-slate-200 dark:border-slate-800'
                          }`}
                        value={(editableFields as Record<string, string>)[field.key] || ''}
                        onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                      />
                      {activeParsedFields?.[field.key]?.confidence === 'Low' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-amber-500" title="Low confidence extraction - please verify">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Amounts & Dates Section */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Financial Section */}
            <div className="premium-card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest dark:text-white">Financial Quantifiers</p>
              </div>
              <div className="p-6 space-y-6">
                {FIELD_CONFIG.filter(f => f.section === 'amounts').map(field => {
                  const fieldValue = (editableFields as Record<string, string>)[field.key] || '';
                  const validation = getCurrencyValidation(fieldValue);
                  return (
                    <div key={field.key} className="relative group">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">{field.label}</label>
                      <input
                        type="text"
                        className={`w-full h-10 px-4 rounded-xl border font-mono text-sm transition-all ${!validation.valid ? 'border-red-500 bg-red-50/30' : 'border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white'
                          }`}
                        value={fieldValue}
                        onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder="$0.00"
                      />
                      {!validation.valid && <p className="text-[10px] text-red-500 mt-1 font-bold">{validation.message}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date Section */}
            <div className="premium-card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest dark:text-white">Forensic Chronology</p>
              </div>
              <div className="p-6 space-y-6">
                {FIELD_CONFIG.filter(f => f.section === 'dates').map(field => {
                  const fieldValue = (editableFields as Record<string, string>)[field.key] || '';
                  const validation = getDateValidation(fieldValue, !!field.required);
                  return (
                    <div key={field.key} className="relative group">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block flex items-center justify-between">
                        <span>{field.label} {field.required && <span className="text-red-500">*</span>}</span>
                        {fieldValue && validation.valid && <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>}
                      </label>
                      <input
                        type="text"
                        className={`w-full h-10 px-4 rounded-xl border font-mono text-sm transition-all ${!validation.valid ? 'border-red-500 bg-red-50/30' : 'border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white'
                          }`}
                        value={fieldValue}
                        onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder="YYYY-MM-DD"
                      />
                      {!validation.valid && <p className="text-[10px] text-red-500 mt-1 font-bold">{validation.message}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Consumer Info */}
          <div className="premium-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest dark:text-white">Consumer Attribution</p>
            </div>
            <div className="p-8 grid sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Legal Name</label>
                <input
                  type="text"
                  className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-sm"
                  value={consumer.name || ''}
                  onChange={(e) => setConsumer(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Address</label>
                <input
                  type="text"
                  className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-sm"
                  value={consumer.address || ''}
                  onChange={(e) => setConsumer(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">State Jurisdiction</label>
                <select
                  className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-sm appearance-none"
                  value={consumer.state || ''}
                  onChange={(e) => {
                    setConsumer(prev => ({ ...prev, state: e.target.value }));
                    setEditableFields(prev => ({ ...prev, stateCode: e.target.value }));
                  }}
                >
                  <option value="">Select...</option>
                  {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className="btn btn-secondary !py-3 !px-8 !rounded-xl"
              onClick={() => setStep(2)}
              disabled={isAnalyzing}
            >
              Back to Triage
            </button>
            <button
              type="button"
              className="btn btn-primary !h-14 !px-12 !rounded-xl shadow-xl shadow-emerald-500/10 flex items-center gap-3 active:scale-95 transition-transform"
              onClick={runAnalysis}
              disabled={isAnalyzing || !canAnalyze}
            >
              {isAnalyzing ? (
                <>
                  <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white" />
                  <span>Analyzing Heuristics...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span>Initiate Forensic Scan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showWorkbench && (
          <div className="lg:sticky lg:top-8 h-fit space-y-4 fade-in">
            <div className="premium-card p-6 bg-slate-900 border-none text-white h-[calc(100vh-160px)] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Forensic Source Evidence</p>
                <button onClick={() => setShowWorkbench(false)} className="text-slate-500 hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <textarea
                className="flex-grow w-full bg-slate-950/50 border border-slate-800 rounded-xl p-6 font-mono text-xs leading-relaxed text-slate-300 resize-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                value={rawText}
                readOnly
              />
              <p className="text-[9px] text-slate-500 mt-4 leading-normal italic text-center">
                Review source data for OCR discrepancies while verifying fields on the left.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step3Verify;
