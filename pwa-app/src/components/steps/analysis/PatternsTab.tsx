import React from 'react';
import { PatternInsight } from '../../../lib/analytics';

interface PatternsTabProps {
  patterns: PatternInsight[];
}

const PatternsTab: React.FC<PatternsTabProps> = ({ patterns }) => {
  if (patterns.length === 0) {
    return (
      <div className="panel-inset p-12 text-center dark:bg-slate-800/20">
        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-bold dark:text-white">Pattern Nullification</h3>
        <p className="text-sm text-slate-500">Forensic engine detected no systemic reporting anomalies in this tradeline.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {patterns.map((pattern, i) => {
        const isHigh = pattern.significance === 'high';
        return (
          <div key={i} className={`premium-card p-6 overflow-hidden relative group transition-all ${isHigh ? 'border-red-500/30 bg-red-50/10 dark:bg-red-950/5' : 'bg-slate-50/50 dark:bg-slate-900/50'
            }`}>
            <div className="flex items-start justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-2 h-2 rounded-full ${isHigh ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isHigh ? 'text-red-500' : 'text-slate-400'}`}>
                    {pattern.significance} Significance
                  </span>
                </div>
                <h4 className="text-xl font-bold dark:text-white mb-2 tracking-tight">{pattern.pattern}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  {pattern.description}
                </p>

                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/80 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex-1 min-w-[200px]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Legal Strategy</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      {pattern.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${isHigh ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
                </svg>
              </div>
            </div>

            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-slate-900/[0.02] dark:bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
};

export default PatternsTab;
