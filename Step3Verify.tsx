'use client';

import React from 'react';
import { FIELD_CONFIG, ACCOUNT_TYPES, STATUSES, STATES, Step } from '../../lib/constants';
import { ConsumerInfo } from '../../lib/types';
import { getDateValidation, getNumericValidation, getDateOrderIssues } from '../../lib/validation';
import { CreditFields } from '../../lib/types';
import { ParsedFields, getExtractionQuality } from '../../lib/parser';
import { maskPII, cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';

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

const Step3Verify = React.memo<Step3VerifyProps>((props) => {
  const {
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
  } = props;
  const { state } = useApp();
  const { isPrivacyMode } = state;
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
  const valueFields = FIELD_CONFIG.filter(f => f.section === 'values');

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

  const valueIssues = valueFields
    .map(field => {
      const value = (editableFields as Record<string, string>)[field.key] || '';
      const validation = getNumericValidation(value);
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
    <div className="fade-in max-w-5xl mx-auto px-4 sm:px-0 pb-20">
      {/* Hero Header */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 overflow-hidden relative shadow-xl shadow-slate-200/50 mb-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-[100px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-50 rounded-full blur-[100px] -ml-32 -mb-32 opacity-60" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Institutional Validation Suite</span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
              Verify <span className="text-blue-600 tracking-tighter">Indicators</span>
            </h2>
            <p className="text-slate-500 text-base font-bold tracking-tight max-w-lg">Validated data points are essential for legal defensibility and forensic mapping.</p>
          </div>

          <button
            onClick={() => setShowWorkbench(!showWorkbench)}
            className={`px-8 py-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 shadow-lg ${showWorkbench
              ? 'bg-slate-900 text-white shadow-slate-300'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
            {showWorkbench ? 'Exit Workbench' : 'Forensic Workbench'}
          </button>
        </div>
      </div>

      {/* Extraction Quality Panel */}
      {quality && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 mb-10 shadow-lg shadow-slate-100/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-16 -mt-16" />
          <div className="relative z-10 flex flex-wrap items-center gap-10">
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-50 rounded-full blur-md" />
                <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" className="stroke-slate-100" strokeWidth="3"></circle>
                  <circle cx="18" cy="18" r="15" fill="none" className="stroke-blue-600" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${quality.score * 0.94}, 100`}></circle>
                </svg>
                <span className="absolute text-xl font-black tabular-nums text-slate-900">{quality.score}%</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Extraction Confidence</p>
                <p className="text-lg font-bold text-blue-600">{quality.description}</p>
              </div>
            </div>
            <div className="h-12 w-px bg-slate-100 hidden lg:block" />
            <div className="flex-grow">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Audited Fields</p>
              <div className="flex flex-wrap gap-2.5">
                {quality.details.map((detail, i) => (
                  <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-600 font-bold uppercase tracking-widest">
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
          <div className="bg-blue-600 rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl shadow-blue-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Intelligent Corrections</p>
                  <p className="text-xl font-bold text-white tracking-tight">Audit Findings ({recommendations.length})</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {recommendedFixes.length > 0 && (
                  <button
                    onClick={applyAllFixes}
                    className="px-5 py-2 rounded-xl bg-white text-blue-600 text-[11px] font-extrabold uppercase tracking-widest shadow-lg hover:scale-105 transition-transform"
                  >
                    Apply All ({recommendedFixes.length})
                  </button>
                )}
                <button
                  onClick={() => setShowSmartFixes(false)}
                  className="w-10 h-10 rounded-xl bg-black/10 text-white hover:bg-black/20 flex items-center justify-center transition-colors"
                  aria-label="Dismiss"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`w-2 h-2 rounded-full ${rec.type === 'error' ? 'bg-white shadow-[0_0_8px_white]' : rec.type === 'warning' ? 'bg-amber-300 shadow-[0_0_8px_rgb(252,211,77)]' : 'bg-blue-300 shadow-[0_0_8px_rgb(147,197,253)]'}`} />
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">{rec.title}</h4>
                    </div>
                    <p className="text-sm text-blue-50/80 font-semibold leading-relaxed mb-6">{rec.description}</p>
                  </div>
                  {rec.suggestedValue && (
                    <button
                      onClick={() => setEditableFields(prev => ({ ...prev, [rec.field]: rec.suggestedValue }))}
                      className="w-full py-3 bg-white text-blue-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-sm"
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
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 mb-10 shadow-lg shadow-slate-100/50">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
               </div>
               <div>
                  <h3 className="text-lg font-bold text-slate-900">Compliance Exceptions</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Case Quality Audit</p>
               </div>
            </div>
            <span className="text-xs font-bold text-slate-500 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              {blockingIssues.length + logicalBlocking.length} Critical • {logicalWarnings.length} Notices
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-[2rem] border border-rose-100 bg-rose-50/30">
              <p className="text-[10px] uppercase font-bold tracking-widest text-rose-500 mb-4">Critical Exceptions</p>
              {(blockingIssues.length === 0 && logicalBlocking.length === 0) ? (
                <p className="text-sm font-semibold text-slate-400">Compliance verified. No critical issues.</p>
              ) : (
                <div className="space-y-3">
                  {blockingIssues.map(issue => (
                    <button
                      key={issue.key}
                      type="button"
                      onClick={() => jumpToField(issue.key)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-3 rounded-xl bg-white border border-rose-100 text-left shadow-sm hover:border-rose-300 transition-colors group"
                    >
                      <span className="text-xs font-bold text-rose-600">{issue.label}: {issue.message}</span>
                      <span className="text-[9px] uppercase tracking-widest text-rose-400 group-hover:translate-x-1 transition-transform">Solve</span>
                    </button>
                  ))}
                  {logicalBlocking.map(issue => (
                    <button
                      key={issue.field}
                      type="button"
                      onClick={() => jumpToField(issue.field)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-3 rounded-xl bg-white border border-rose-100 text-left shadow-sm hover:border-rose-300 transition-colors group"
                    >
                      <span className="text-xs font-bold text-rose-600">{issue.message}</span>
                      <span className="text-[9px] uppercase tracking-widest text-rose-400 group-hover:translate-x-1 transition-transform">Solve</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 rounded-[2rem] border border-amber-100 bg-amber-50/30">
              <p className="text-[10px] uppercase font-bold tracking-widest text-amber-600 mb-4">Quality Notices</p>
              {logicalWarnings.length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">No data quality notices.</p>
              ) : (
                <div className="space-y-3">
                  {logicalWarnings.map(issue => (
                    <button
                      key={issue.field}
                      type="button"
                      onClick={() => jumpToField(issue.field)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-3 rounded-xl bg-white border border-amber-100 text-left shadow-sm hover:border-amber-300 transition-colors group"
                    >
                      <span className="text-xs font-bold text-amber-600">{issue.message}</span>
                      <span className="text-[9px] uppercase tracking-widest text-amber-400 group-hover:translate-x-1 transition-transform">Solve</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`transition-all duration-500 grid gap-10 ${showWorkbench ? 'lg:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>
        <div className="space-y-10">
          {/* Account Info Section */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-lg shadow-slate-100/50">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Identity & Account Metadata</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Core forensic identifiers</p>
              </div>
            </div>
            <div className="p-10 grid sm:grid-cols-2 gap-10">
              {FIELD_CONFIG.filter(f => f.section === 'account').map(field => (
                <div key={field.key} className="relative group">
                  <label
                    htmlFor={field.key}
                    className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2 cursor-help group-hover:text-blue-600 transition-colors"
                    onMouseEnter={() => setShowHelp(field.key)}
                    onMouseLeave={() => setShowHelp(null)}
                  >
                    {field.label}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                  </label>
                  {showHelp === field.key && field.help && (
                    <div className="absolute z-50 left-0 bottom-full mb-3 p-4 bg-slate-900 text-white text-[11px] font-bold leading-relaxed max-w-xs shadow-2xl rounded-2xl">
                      {field.help}
                    </div>
                  )}
                  {field.key === 'accountType' ? (
                    <div className="relative">
                      <select
                        id={field.key}
                        className={`w-full h-14 px-5 rounded-2xl border bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none cursor-pointer ${activeParsedFields?.[field.key]?.confidence === 'Low' ? 'border-amber-300 ring-2 ring-amber-500/10 bg-amber-50' : 'border-slate-100'
                          }`}
                        value={(editableFields as Record<string, string>)[field.key] || ''}
                        onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                      >
                        <option value="">Select Category...</option>
                        {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                      </div>
                    </div>
                  ) : field.key === 'accountStatus' ? (
                    <div className="relative">
                      <select
                        id={field.key}
                        className={`w-full h-14 px-5 rounded-2xl border bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none cursor-pointer ${activeParsedFields?.[field.key]?.confidence === 'Low' ? 'border-amber-300 ring-2 ring-amber-500/10 bg-amber-50' : 'border-slate-100'
                          }`}
                        value={(editableFields as Record<string, string>)[field.key] || ''}
                        onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                      >
                        <option value="">Select Status...</option>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        id={field.key}
                        type="text"
                        className={`w-full h-14 px-5 rounded-2xl border bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all ${activeParsedFields?.[field.key]?.confidence === 'Low' ? 'border-amber-300 ring-2 ring-amber-500/10 bg-amber-50' : 'border-slate-100'
                          } ${isPrivacyMode && field.key === 'accountNumber' ? 'opacity-50' : ''}`}
                        value={isPrivacyMode && field.key === 'accountNumber' ? maskPII((editableFields as Record<string, string>)[field.key] || '') : ((editableFields as Record<string, string>)[field.key] || '')}
                        onChange={(e) => !isPrivacyMode && setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                        readOnly={isPrivacyMode && field.key === 'accountNumber'}
                        placeholder={`Enter ${field.label}...`}
                      />
                      {activeParsedFields?.[field.key]?.confidence === 'Low' && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-amber-500" title="Low confidence extraction - please verify">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Numeric Valuations & Dates Section */}
          <div className="grid md:grid-cols-2 gap-10">
            {/* Quantitative Data Section */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-lg shadow-slate-100/50">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                </div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Quantitative Indicators</h3>
              </div>
              <div className="p-8 space-y-8">
                {FIELD_CONFIG.filter(f => f.section === 'values').map(field => {
                  const fieldValue = (editableFields as Record<string, string>)[field.key] || '';
                  const validation = getNumericValidation(fieldValue);
                  return (
                    <div key={field.key} className="relative group">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2.5 block px-1">{field.label}</label>
                      <div className="relative">
                        <input
                          type="text"
                          className={`w-full h-12 px-5 rounded-2xl border font-bold text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:bg-white ${!validation.valid ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-slate-100 bg-slate-50 text-slate-900'
                            }`}
                          value={fieldValue}
                          onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder="0.00"
                        />
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      </div>
                      {!validation.valid && <p className="text-[10px] text-rose-500 mt-2 font-black uppercase tracking-wider px-1">{validation.message}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date Section */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-lg shadow-slate-100/50">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Forensic Chronology</h3>
              </div>
              <div className="p-8 space-y-8">
                {FIELD_CONFIG.filter(f => f.section === 'dates').map(field => {
                  const fieldValue = (editableFields as Record<string, string>)[field.key] || '';
                  const validation = getDateValidation(fieldValue, !!field.required);
                  return (
                    <div key={field.key} className="relative group">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2.5 block px-1 flex items-center justify-between">
                        <span>{field.label} {field.required && <span className="text-rose-500 font-black">*</span>}</span>
                        {fieldValue && validation.valid && (
                          <div className="w-4 h-4 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                          </div>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className={`w-full h-12 px-5 rounded-2xl border font-bold text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:bg-white ${!validation.valid ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-slate-100 bg-slate-50 text-slate-900'
                            }`}
                          value={fieldValue}
                          onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder="YYYY-MM-DD"
                        />
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-l-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      </div>
                      {!validation.valid && <p className="text-[10px] text-rose-500 mt-2 font-black uppercase tracking-wider px-1">{validation.message}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Consumer Info */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-lg shadow-slate-100/50">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center shadow-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Consumer Attribution</h3>
            </div>
            <div className="p-8 grid sm:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label htmlFor="consumer-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Legal Name</label>
                <input
                  id="consumer-name"
                  type="text"
                  placeholder="Full Legal Name"
                  title="Consumer Legal Name"
                  className={cn("w-full h-12 px-5 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all", isPrivacyMode && "opacity-50")}
                  value={isPrivacyMode ? maskPII(consumer.name || '') : (consumer.name || '')}
                  onChange={(e) => !isPrivacyMode && setConsumer(prev => ({ ...prev, name: e.target.value }))}
                  readOnly={isPrivacyMode}
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="consumer-address" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Current Address</label>
                <input
                  id="consumer-address"
                  type="text"
                  placeholder="Street, City, Zip"
                  title="Consumer Current Address"
                  className={cn("w-full h-12 px-5 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all", isPrivacyMode && "opacity-50")}
                  value={isPrivacyMode ? maskPII(consumer.address || '') : (consumer.address || '')}
                  onChange={(e) => !isPrivacyMode && setConsumer(prev => ({ ...prev, address: e.target.value }))}
                  readOnly={isPrivacyMode}
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="state-jurisdiction" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">State Jurisdiction</label>
                <div className="relative">
                  <select
                    id="state-jurisdiction"
                    title="State Jurisdiction"
                    className="w-full h-12 px-5 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
                    value={consumer.state || ''}
                    onChange={(e) => {
                      setConsumer(prev => ({ ...prev, state: e.target.value }));
                      setEditableFields(prev => ({ ...prev, stateCode: e.target.value }));
                    }}
                  >
                    <option value="">Select...</option>
                    {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-800">
            <button
              type="button"
              className="w-full sm:w-auto px-10 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-white transition-colors"
              onClick={() => setStep(2)}
              disabled={isAnalyzing}
            >
              Back to Triage
            </button>
            <button
              type="button"
              className="w-full sm:w-auto h-16 px-12 rounded-2xl bg-blue-600 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={runAnalysis}
              disabled={isAnalyzing || !canAnalyze}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scanning...</span>
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
            <div className="bg-white rounded-[3rem] p-10 border border-slate-200/50 flex flex-col h-[calc(100vh-160px)] shadow-2xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600">Forensic Source</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Raw Evidence Layer</p>
                </div>
                <button 
                  onClick={() => setShowWorkbench(false)} 
                  className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-grow flex flex-col bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 opacity-20" />
                <textarea
                  id="source-evidence-text"
                  title="Forensic Source Evidence"
                  placeholder="Source Text for Verification"
                  className="flex-grow w-full bg-transparent border-none focus:ring-0 p-0 font-mono text-xs leading-relaxed text-slate-600 resize-none selection:bg-indigo-100 selection:text-indigo-900"
                  value={rawText}
                  readOnly
                />
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    SHA-256 Integrity Verified
                  </p>
                </div>
                <p className="text-[9px] text-slate-400 mt-4 leading-normal text-center font-medium">
                  Review original OCR data to audit extraction accuracy.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

Step3Verify.displayName = 'Step3Verify';

export default Step3Verify;
