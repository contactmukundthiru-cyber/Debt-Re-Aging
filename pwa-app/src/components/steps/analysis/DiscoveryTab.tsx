'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
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
      {/* Hero Header - Apple/Institutional Style */}
      <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] -ml-40 -mb-40" />

        <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
              <span className="text-[10px] uppercase font-black tracking-[0.4em] text-blue-400 font-mono">Dossier Reinforcement</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter mb-6 leading-tight">
              Evidence <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-mono uppercase">MANIFEST</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed font-medium max-w-2xl">
              Systematically cataloging institutional evidence and corroborating data points. Finalizing the forensic archive for federal escalation or institutional challenge.
            </p>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-slate-900/60 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-center mb-8">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" className="stroke-slate-800" strokeWidth="6" />
                    <motion.circle
                      initial={{ strokeDashoffset: 276 }}
                      animate={{ strokeDashoffset: 276 - (276 * overallReadiness) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      cx="50" cy="50" r="44" fill="none"
                      className={`transition-all duration-1000 ${overallReadiness > 80 ? 'stroke-emerald-500' : overallReadiness > 40 ? 'stroke-blue-500' : 'stroke-rose-500'}`}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={276}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black tabular-nums font-mono">{overallReadiness}%</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Archive Ready</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">Evidence</p>
                  <p className="text-lg font-black text-blue-400 tabular-nums">{checkedEvidenceItems}/{totalEvidenceItems}</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">Refinement</p>
                  <p className="text-lg font-black text-indigo-400 tabular-nums">{answeredQuestions}/{totalQuestions}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Interrogatory Questions (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center justify-between px-2">
            <div>
              <h4 className="text-2xl font-black dark:text-white tracking-tight uppercase font-mono">Discovery Interrogatory</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black font-mono">Contextual Verification Vectors</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
               <span className="text-[10px] font-black text-indigo-400 font-mono uppercase italic">{flagsWithQuestions.length} MODULES DETECTED</span>
            </div>
          </div>

          {flagsWithQuestions.length > 0 ? (
            <div className="space-y-6">
              {flagsWithQuestions.map((flag, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="premium-card p-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/60 shadow-xl transition-all hover:shadow-2xl hover:border-indigo-500/30 group"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 font-mono font-black text-xs">
                      {flag.ruleId.split('_').pop()}
                    </div>
                    <div>
                      <h5 className="text-lg font-bold dark:text-white tracking-tight leading-none uppercase font-mono">{flag.ruleName}</h5>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">Module Identifier: {flag.ruleId}</span>
                    </div>
                  </div>

                  <div className="space-y-10">
                    {flag.discoveryQuestions?.map((q, j) => {
                      const isAnswered = !!discoveryAnswers[`${flag.ruleId}-${j}`]?.trim();
                      return (
                        <div key={j} className="space-y-4">
                          <label className="text-base font-bold text-slate-700 dark:text-slate-300 flex items-start gap-4 leading-relaxed group/label">
                            <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 mt-0 transition-all duration-500 ${isAnswered ? 'border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-200 dark:border-slate-800'}`}>
                              {isAnswered ? (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              ) : (
                                <span className="text-[10px] font-black text-slate-400 font-mono">{j+1}</span>
                              )}
                            </div>
                            <span className="flex-1 pt-0.5">{q}</span>
                          </label>
                          <textarea
                            className="w-full min-h-[140px] px-6 py-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/80 text-sm dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 outline-none resize-none transition-all placeholder:text-slate-500 font-medium"
                            placeholder="Enter detailed validation data..."
                            value={discoveryAnswers[`${flag.ruleId}-${j}`] || ''}
                            onChange={(e) => setDiscoveryAnswers(prev => ({ ...prev, [`${flag.ruleId}-${j}`]: e.target.value }))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="premium-card p-20 text-center bg-slate-50 dark:bg-slate-950/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-400">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-lg font-black text-slate-400 uppercase tracking-widest font-mono">Optimization Complete</p>
              <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">No further investigator input required for current data set. Evidence manifest is structurally sound.</p>
            </div>
          )}
        </div>

        {/* Evidence Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
           <div className="px-2">
              <h4 className="text-2xl font-black dark:text-white tracking-tight uppercase font-mono">Catalog Manifest</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black font-mono">Required Support Documentation</p>
          </div>

          <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 shadow-2xl sticky top-8">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Collection Sync</p>
                <h6 className="text-xl font-black dark:text-white tabular-nums font-mono">{evidenceProgress}%</h6>
              </div>
              <div className="w-2/3">
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${evidenceProgress}%` }}
                    className={`h-full transition-all duration-1000 ${evidenceProgress > 80 ? 'bg-emerald-500' : evidenceProgress > 40 ? 'bg-blue-500' : 'bg-rose-500'}`} 
                  />
                </div>
              </div>
            </div>

            <div className="mb-8 space-y-4">
              <button className="w-full py-5 rounded-[2rem] bg-slate-950 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3 group relative overflow-hidden">
                <span className="relative z-10">Export Interrogatory Brief</span>
                <svg className="w-5 h-5 relative z-10 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            </div>

            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-4 custom-scrollbar">
              {suggestedEvidence.map((evidence, i) => {
                const isChecked = discoveryAnswers[`ev-${i}`] === 'checked';
                return (
                  <label 
                    key={i} 
                    className={`flex items-start gap-6 p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-500 group shadow-sm ${
                      isChecked 
                        ? 'bg-emerald-500/5 border-emerald-500/30' 
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-[0.8rem] border-2 flex items-center justify-center shrink-0 mt-0 transition-all duration-500 ${
                      isChecked 
                        ? 'border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-500/20' 
                        : 'border-slate-300 dark:border-slate-700 dark:bg-slate-900 group-hover:border-emerald-400'
                    }`}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isChecked}
                        onChange={(e) => setDiscoveryAnswers(prev => ({ ...prev, [`ev-${i}`]: e.target.checked ? 'checked' : '' }))}
                      />
                      {isChecked && <svg className="w-3 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </div>
                    <span className={`text-sm font-bold leading-relaxed transition-colors uppercase tracking-tight ${
                      isChecked 
                        ? 'text-slate-800 dark:text-slate-100' 
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'
                    }`}>
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
