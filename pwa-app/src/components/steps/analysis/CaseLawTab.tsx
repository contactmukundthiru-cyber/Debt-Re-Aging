'use client';

import React from 'react';
import { CaseLaw } from '../../../lib/caselaw';

interface CaseLawTabProps {
  relevantCaseLaw: CaseLaw[];
}

const CaseLawTab: React.FC<CaseLawTabProps> = ({ relevantCaseLaw }) => {
  if (relevantCaseLaw.length === 0) {
    return (
      <div className="premium-card p-16 text-center bg-slate-50 dark:bg-slate-950/20 border-dashed border-slate-200 dark:border-slate-800">
        <svg className="w-20 h-20 mx-auto mb-6 text-slate-200 dark:text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
        <h3 className="text-xl font-bold dark:text-white mb-2">No Case Law Matches</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">No specific legal precedents were found for the detected violations. Consult with an FCRA attorney for tailored case law research.</p>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-10">
      {/* Hero Header */}
      <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-amber-400 font-mono">Legal Research Engine</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Case Law <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Repository</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-lg">Relevant precedents from federal courts supporting your FCRA/FDCPA claims. Use these citations to bolster dispute letters and legal filings.</p>
          </div>

          <div className="px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Precedents</p>
            <p className="text-3xl font-bold tabular-nums text-amber-400">{relevantCaseLaw.length}</p>
          </div>
        </div>
      </div>

      {/* Case Cards */}
      <div className="space-y-6">
        {relevantCaseLaw.map((law, i) => (
          <div key={i} className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-all group hover:border-amber-500/30 hover:-translate-y-0.5 overflow-hidden relative">
            {/* Left Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-orange-500" />

            <div className="flex flex-col lg:flex-row justify-between gap-8">
              <div className="flex-1 pl-4">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">Legal Precedent</span>
                </div>

                <h4 className="text-xl font-bold dark:text-white mb-2 group-hover:text-amber-500 transition-colors">{law.case}</h4>
                <p className="text-xs font-mono text-slate-400 mb-6">{law.citation}</p>

                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      Relevance to Your Case
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{law.relevance}</p>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      Key Ruling
                    </p>
                    <p className="text-sm italic text-slate-600 dark:text-slate-400 leading-relaxed border-l-2 border-amber-500/30 pl-4">
                      "{law.ruling}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex lg:flex-col items-center gap-4 lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-8">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">#{String(i + 1).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseLawTab;
