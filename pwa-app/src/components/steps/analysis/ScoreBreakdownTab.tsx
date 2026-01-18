'use strict';

import React from 'react';
import { RiskProfile } from '../../../lib/rules';

interface ScoreBreakdownTabProps {
  riskProfile: RiskProfile;
}

const ScoreBreakdownTab: React.FC<ScoreBreakdownTabProps> = ({ riskProfile }) => {
  return (
    <div className="fade-in space-y-8">
      {/* Risk Level Summary Card */}
      <div className="premium-card p-8 bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="relative w-40 h-40 flex-shrink-0 group">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
            <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
              <circle
                className="text-slate-200 dark:text-slate-800 stroke-current"
                strokeWidth="6"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
              <circle
                className={`stroke-current transition-all duration-1000 ${riskProfile.riskLevel === 'critical' ? 'text-rose-500' :
                  riskProfile.riskLevel === 'high' ? 'text-orange-500' :
                    riskProfile.riskLevel === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                  }`}
                strokeWidth="6"
                strokeDasharray={263.8}
                strokeDashoffset={263.8 - (263.8 * riskProfile.overallScore) / 100}
                strokeLinecap="round"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
              <span className="text-4xl font-bold tracking-tight dark:text-white">{riskProfile.overallScore}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Index</span>
            </div>
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${riskProfile.riskLevel === 'critical' ? 'bg-red-500' : 'bg-emerald-500'
                  }`} />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Dispute Viability Profile</h3>
              </div>
              <h2 className="text-3xl font-bold tracking-tight dark:text-white">
                Strength: <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">{riskProfile.disputeStrength.toUpperCase()}</span>
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              {riskProfile.recommendedApproach}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">FCRA COMPLIANT</span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">FORENSIC READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {riskProfile.scoreBreakdown.map((cat, i) => {
          const isHigh = cat.impact > 60;
          const isMed = cat.impact > 30;

          return (
            <div key={i} className="premium-card p-6 bg-white dark:bg-slate-950 flex flex-col group transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isHigh ? 'bg-rose-500/10 text-rose-500' : isMed ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                  {cat.category === 'Statutory' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  ) : cat.category === 'Accuracy' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Impact Score</p>
                  <p className={`text-xl font-bold ${isHigh ? 'text-rose-500' : isMed ? 'text-amber-500' : 'text-emerald-500'}`}>{cat.impact}%</p>
                </div>
              </div>

              <h4 className="text-sm font-bold dark:text-white mb-2 group-hover:text-blue-500 transition-colors uppercase tracking-tight">{cat.category} Analysis</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1 italic">
                {cat.description}
              </p>

              <div className="space-y-3">
                <div className="h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    style={{ width: `${cat.impact}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Standard</span>
                  <span>Forensic Conflict</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoreBreakdownTab;
