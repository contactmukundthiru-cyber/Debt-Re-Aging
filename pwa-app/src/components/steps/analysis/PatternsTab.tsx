'use client';

import React from 'react';
import { PatternInsight } from '../../../lib/analytics';

interface PatternsTabProps {
  patterns: PatternInsight[];
}

const PatternsTab: React.FC<PatternsTabProps> = ({ patterns }) => {
  const highCount = patterns.filter(p => p.significance === 'high').length;

  if (patterns.length === 0) {
    return (
      <div className="premium-card p-16 text-center bg-slate-50 dark:bg-slate-950/20 border-dashed border-slate-200 dark:border-slate-800">
        <svg className="w-20 h-20 mx-auto mb-6 text-emerald-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-xl font-bold dark:text-white mb-2">Pattern Nullification</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">Forensic engine detected no systemic reporting anomalies in this tradeline. This is a positive indicator of data integrity.</p>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-10">
      {/* Hero Header */}
      <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-purple-400 font-mono">Pattern Recognition AI</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Behavioral <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Anomalies</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-lg">Machine learning-detected patterns that indicate systemic reporting misconduct or coordinated data manipulation across bureaus.</p>
          </div>

          <div className="flex gap-4">
            <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Patterns</p>
              <p className="text-2xl font-bold tabular-nums">{patterns.length}</p>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Critical</p>
              <p className="text-2xl font-bold text-rose-400 tabular-nums">{highCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Cards */}
      <div className="grid gap-6">
        {patterns.map((pattern, i) => {
          const isHigh = pattern.significance === 'high';
          return (
            <div key={i} className={`premium-card p-8 overflow-hidden relative group transition-all hover:-translate-y-0.5 ${isHigh ? 'border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10' : 'bg-white dark:bg-slate-900'}`}>
              {/* Background Glow */}
              {isHigh && <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />}

              <div className="flex items-start justify-between gap-8 relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${isHigh ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-400'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isHigh ? 'text-rose-500' : 'text-slate-400'}`}>
                      {pattern.significance} Significance
                    </span>
                  </div>

                  <h4 className={`text-2xl font-bold tracking-tight mb-3 ${isHigh ? 'text-rose-600 dark:text-rose-400' : 'dark:text-white'} group-hover:text-purple-500 transition-colors`}>
                    {pattern.pattern}
                  </h4>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-3xl">
                    {pattern.description}
                  </p>

                  <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      Recommended Strategy
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                      {pattern.recommendation}
                    </p>
                  </div>
                </div>

                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 ${isHigh ? 'bg-rose-500 text-white shadow-2xl shadow-rose-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-purple-500/10 group-hover:text-purple-500'} transition-all`}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatternsTab;
