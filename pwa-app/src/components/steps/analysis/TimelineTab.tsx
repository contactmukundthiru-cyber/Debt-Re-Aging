'use client';

import React, { useMemo } from 'react';
import { TimelineEvent } from '../../../lib/analytics';
import { formatDate } from '../../../lib/i18n';

interface TimelineTabProps {
  timeline: TimelineEvent[];
}

const TimelineTab: React.FC<TimelineTabProps> = ({ timeline }) => {
  const sortedEvents = useMemo(() => [...timeline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [timeline]);
  const violationCount = useMemo(() => timeline.filter(e => e.type === 'violation' || e.flagged).length, [timeline]);

  if (timeline.length === 0) {
    return (
      <div className="premium-card p-16 text-center bg-slate-50 dark:bg-slate-950/20 border-dashed border-slate-200 dark:border-slate-800">
        <svg className="w-20 h-20 mx-auto mb-6 text-slate-200 dark:text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-xl font-bold dark:text-white mb-2">Chronology Deficit</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">Insufficient date data points to generate a comprehensive investigative timeline. Verify that key dates (DOFD, Charge-Off, etc.) are present in the source data.</p>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-10">
      {/* Hero Header */}
      <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-indigo-400 font-mono">Temporal Forensics</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Investigation <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Chronology</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-lg">Mapping tradeline evolution and identifying temporal anomalies that indicate re-aging or data manipulation.</p>
          </div>

          <div className="flex gap-4">
            <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Events</p>
              <p className="text-2xl font-bold tabular-nums">{sortedEvents.length}</p>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Flagged</p>
              <p className="text-2xl font-bold text-rose-400 tabular-nums">{violationCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Body */}
      <div className="premium-card p-10 bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Event Trace</p>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Violation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Standard</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-[4.5rem] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 via-slate-200 dark:via-slate-800 to-slate-200 dark:to-slate-800 rounded-full" />

          <div className="space-y-10">
            {sortedEvents.map((event, i) => {
              const isViolation = event.type === 'violation' || event.flagged;
              const prevEvent = i > 0 ? sortedEvents[i - 1] : null;
              const gapMonths = prevEvent ? (new Date(event.date).getTime() - new Date(prevEvent.date).getTime()) / (1000 * 60 * 60 * 24 * 30.44) : 0;
              const showGap = gapMonths > 12;

              return (
                <React.Fragment key={i}>
                  {showGap && (
                    <div className="relative flex items-center gap-8 py-2">
                      <div className="w-20 shrink-0" />
                      <div className="relative shrink-0 z-10">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-dashed border-amber-500/30 flex items-center justify-center">
                          <span className="text-lg text-amber-500 font-bold">···</span>
                        </div>
                      </div>
                      <div className="flex-grow py-3 px-5 rounded-xl border border-dashed border-amber-500/20 bg-amber-500/5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Reporting Vacuum: {Math.floor(gapMonths / 12)}Y {Math.floor(gapMonths % 12)}M</p>
                        <p className="text-[11px] text-amber-800/70 dark:text-amber-500/80 italic">No activity reported during this period. Potential data suppression or re-aging trigger.</p>
                      </div>
                    </div>
                  )}

                  <div className="relative flex items-start gap-8 group">
                    {/* Time Indicator */}
                    <div className="w-20 pt-2 text-right shrink-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{formatDate(event.date).split(',')[1]?.trim() || ''}</p>
                      <p className="text-base font-bold dark:text-white tabular-nums">{formatDate(event.date).split(',')[0]}</p>
                    </div>

                    {/* Node */}
                    <div className="relative shrink-0 z-10">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isViolation
                        ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30'
                        : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-indigo-400'
                        }`}>
                        {isViolation ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" /></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="6" /></svg>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`flex-grow p-6 rounded-2xl border transition-all ${isViolation
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500/20 shadow-lg shadow-rose-500/5'
                      : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 group-hover:border-indigo-500/30'
                      }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isViolation ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                          {event.type}
                        </p>
                        {isViolation && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                      </div>
                      <h4 className="text-lg font-bold dark:text-white mb-2">{event.label}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{event.description}</p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineTab;
