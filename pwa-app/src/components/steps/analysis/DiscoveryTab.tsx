'use client';

import React, { useMemo } from 'react';
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
  setDiscoveryAnswers
}) => {
  const suggestedEvidence = useMemo(() => Array.from(new Set(flags.flatMap(f => f.suggestedEvidence))), [flags]);
  const flagsWithQuestions = useMemo(() => flags.filter(f => (f.discoveryQuestions?.length ?? 0) > 0), [flags]);

  // Calculate progress
  const totalEvidenceItems = suggestedEvidence.length;
  const checkedEvidenceItems = Object.keys(discoveryAnswers).filter(k => k.startsWith('ev-') && discoveryAnswers[k] === 'checked').length;
  const evidenceProgress = totalEvidenceItems > 0 ? Math.round((checkedEvidenceItems / totalEvidenceItems) * 100) : 0;

  const totalQuestions = flagsWithQuestions.reduce((acc, f) => acc + (f.discoveryQuestions?.length || 0), 0);
  const answeredQuestions = flagsWithQuestions.reduce((acc, f) => {
    return acc + (f.discoveryQuestions?.filter((_, j) => discoveryAnswers[`${f.ruleId}-${j}`]?.trim().length > 0).length || 0);
  }, 0);
  const questionProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const overallReadiness = Math.round((evidenceProgress + questionProgress) / 2);

  return (
    <div className="fade-in space-y-10 pb-12">
      {/* Hero Section with Progress */}
      <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-blue-400 font-mono">Forensic Discovery Engine</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
              Evidence <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Workbench</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed font-medium max-w-lg">
              Systematically gather and catalog supporting documentation. Your answers here directly strengthen litigation readiness and CFPB complaint viability.
            </p>
          </div>

          {/* Readiness Gauge */}
          <div className="bg-slate-900/50 p-8 rounded-[2rem] border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-center mb-8">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" className="stroke-slate-800" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    className={`transition-all duration-1000 ${overallReadiness > 80 ? 'stroke-emerald-500' : overallReadiness > 40 ? 'stroke-blue-500' : 'stroke-slate-600'}`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={263.8}
                    strokeDashoffset={263.8 - (263.8 * overallReadiness) / 100}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold tabular-nums">{overallReadiness}%</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Readiness</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Evidence</p>
                <p className="text-lg font-bold text-blue-400 tabular-nums">{checkedEvidenceItems}/{totalEvidenceItems}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Questions</p>
                <p className="text-lg font-bold text-indigo-400 tabular-nums">{answeredQuestions}/{totalQuestions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Discovery Questions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h4 className="text-xl font-bold dark:text-white">Targeted Discovery</h4>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Interrogatory-style questions</p>
            </div>
          </div>

          {flagsWithQuestions.length > 0 ? (
            <div className="space-y-6">
              {flagsWithQuestions.map((flag, i) => (
                <div key={i} className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-500/30 group">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">{flag.ruleId}</span>
                    <h5 className="text-sm font-bold dark:text-white uppercase tracking-tight">{flag.ruleName}</h5>
                  </div>
                  <div className="space-y-6">
                    {flag.discoveryQuestions?.map((q, j) => {
                      const isAnswered = !!discoveryAnswers[`${flag.ruleId}-${j}`]?.trim();
                      return (
                        <div key={j} className="space-y-3">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isAnswered ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-700'}`}>
                              {isAnswered && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                            </div>
                            {q}
                          </label>
                          <textarea
                            className="w-full h-24 px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all placeholder:text-slate-400"
                            placeholder="Provide a detailed response to strengthen your case..."
                            value={discoveryAnswers[`${flag.ruleId}-${j}`] || ''}
                            onChange={(e) => setDiscoveryAnswers(prev => ({ ...prev, [`${flag.ruleId}-${j}`]: e.target.value }))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="premium-card p-16 text-center bg-slate-50 dark:bg-slate-950/20 border-dashed border-slate-200 dark:border-slate-800">
              <svg className="w-16 h-16 mx-auto text-slate-200 dark:text-slate-800 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Targeted Questions Available</p>
              <p className="text-xs text-slate-500 mt-2">The detected violations do not require additional consumer input.</p>
            </div>
          )}
        </div>

        {/* Evidence Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <div>
              <h4 className="text-xl font-bold dark:text-white">Evidence Manifest</h4>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Verify document access</p>
            </div>
          </div>

          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 sticky top-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collected</p>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${evidenceProgress > 80 ? 'bg-emerald-500' : evidenceProgress > 40 ? 'bg-blue-500' : 'bg-slate-400'}`} style={{ width: `${evidenceProgress}%` }} />
                </div>
                <span className="text-xs font-bold tabular-nums dark:text-white">{evidenceProgress}%</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {suggestedEvidence.map((evidence, i) => {
                const isChecked = discoveryAnswers[`ev-${i}`] === 'checked';
                return (
                  <label key={i} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all group ${isChecked ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isChecked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-700 group-hover:border-emerald-400'}`}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isChecked}
                        onChange={(e) => setDiscoveryAnswers(prev => ({ ...prev, [`ev-${i}`]: e.target.checked ? 'checked' : '' }))}
                      />
                      {isChecked && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </div>
                    <span className={`text-sm font-medium leading-relaxed transition-colors ${isChecked ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'}`}>
                      {evidence}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryTab;
