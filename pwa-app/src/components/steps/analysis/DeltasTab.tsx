'use client';

import React, { useMemo } from 'react';
import { DeltaResult } from '../../../lib/delta';

interface DeltasTabProps {
  deltas: DeltaResult[];
}

const DeltasTab: React.FC<DeltasTabProps> = ({ deltas }) => {
  const negativeCount = useMemo(() => deltas.filter(d => d.impact === 'negative').length, [deltas]);
  const positiveCount = useMemo(() => deltas.filter(d => d.impact === 'positive').length, [deltas]);

  if (deltas.length === 0) {
    return (
      <div className="premium-card p-16 text-center bg-slate-50 dark:bg-slate-950/20 border-dashed border-slate-200 dark:border-slate-800">
        <svg className="w-20 h-20 mx-auto mb-6 text-slate-200 dark:text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <h3 className="text-xl font-bold dark:text-white mb-2">No Delta Comparison Active</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">To use Delta Analysis, load a previous analysis from history while currently viewing a report. This enables forensic comparison between report snapshots.</p>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-10">
      {/* Hero Header */}
      <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-orange-400 font-mono">Forensic Comparison</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Delta <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">Analysis</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-lg">Tracking changes between credit report snapshots. Detects illegal modifications, re-aging patterns, and data manipulation over time.</p>
          </div>

          <div className="flex gap-4">
            <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Changes</p>
              <p className="text-2xl font-bold tabular-nums">{deltas.length}</p>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Negative</p>
              <p className="text-2xl font-bold text-rose-400 tabular-nums">{negativeCount}</p>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Positive</p>
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">{positiveCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delta Cards */}
      <div className="space-y-4">
        {deltas.map((delta, i) => {
          const impactConfig = {
            negative: { color: 'border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20', icon: 'text-rose-500', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
            positive: { color: 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20', icon: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
            neutral: { color: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900', icon: 'text-slate-400', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700' }
          }[delta.impact || 'neutral'];

          return (
            <div
              key={i}
              className={`premium-card p-6 ${impactConfig.color} transition-all hover:-translate-y-0.5 group overflow-hidden relative`}
            >
              {/* Background decorative element */}
              {delta.impact === 'negative' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
              )}

              <div className="flex items-start gap-6 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${impactConfig.badge} border transition-transform group-hover:scale-110`}>
                  {delta.impact === 'negative' ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  ) : delta.impact === 'positive' ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${impactConfig.badge}`}>
                      {delta.impact || 'Changed'}
                    </span>
                    <h4 className="text-lg font-bold dark:text-white tracking-tight">{delta.field}</h4>
                  </div>

                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Before:</span>
                      <code className="text-sm font-mono px-3 py-1 bg-slate-100 dark:bg-slate-950 rounded-lg text-slate-600 dark:text-slate-400 line-through">{delta.oldValue || '—'}</code>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 dark:text-slate-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">After:</span>
                      <code className={`text-sm font-mono px-3 py-1 rounded-lg font-bold ${delta.impact === 'negative' ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' :
                          delta.impact === 'positive' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' :
                            'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                        }`}>{delta.newValue || '—'}</code>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{delta.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeltasTab;
