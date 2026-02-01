'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RiskProfile } from '../../../lib/rules';
import { cn } from '../../../lib/utils';

interface ScoreBreakdownTabProps {
  riskProfile: RiskProfile;
}

const ScoreBreakdownTab: React.FC<ScoreBreakdownTabProps> = ({ riskProfile }) => {
  return (
    <div className="fade-in space-y-10">
      {/* Hero Score Card */}
      <div className="premium-card p-12 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
          {/* Score Gauge */}
          <div className="relative w-52 h-52 flex-shrink-0">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-3xl" />
            <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
              <circle
                className="text-slate-800 stroke-current"
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
              <span className="text-6xl font-bold tracking-tight">{riskProfile.overallScore}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mt-1">Dispute Index</span>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${riskProfile.riskLevel === 'critical' ? 'bg-rose-500 shadow-rose-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`} />
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-400 font-mono">Dispute Viability Profile</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Strength: <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{riskProfile.disputeStrength.toUpperCase()}</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-xl mb-8">
              {riskProfile.recommendedApproach}
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <span className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/10">FCRA Compliant</span>
              <span className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/10">Forensic Ready</span>
              <span className="px-4 py-2 bg-emerald-500/10 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/20">Court Admissible</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {riskProfile.scoreBreakdown.map((cat, i) => {
          const isHigh = cat.impact > 60;
          const isMed = cat.impact > 30;
          const colorClass = isHigh ? 'rose' : isMed ? 'amber' : 'emerald';

          return (
            <div key={i} className="premium-card p-8 bg-white dark:bg-slate-900 flex flex-col group transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative">
              {/* Background Glow */}
              {isHigh && <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-16 -mt-16" />}

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors bg-${colorClass}-500/10 text-${colorClass}-500`}>
                  {cat.category === 'Statutory' ? (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  ) : cat.category === 'Accuracy' ? (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Impact Score</p>
                  <p className={`text-3xl font-bold tabular-nums ${isHigh ? 'text-rose-500' : isMed ? 'text-amber-500' : 'text-emerald-500'}`}>{cat.impact}%</p>
                </div>
              </div>

              <h4 className="text-lg font-bold dark:text-white mb-3 group-hover:text-emerald-500 transition-colors uppercase tracking-tight relative z-10">{cat.category} Analysis</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8 flex-1 relative z-10">
                {cat.description}
              </p>

              <div className="space-y-3 relative z-10">
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      isHigh ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 
                      isMed ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 
                      'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.impact}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
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
