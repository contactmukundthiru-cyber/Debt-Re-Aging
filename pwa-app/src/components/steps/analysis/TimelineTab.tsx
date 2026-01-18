import React from 'react';
import { TimelineEvent } from '../../../lib/analytics';
import { formatDate } from '../../../lib/i18n';

interface TimelineTabProps {
  timeline: TimelineEvent[];
}

const TimelineTab: React.FC<TimelineTabProps> = ({ timeline }) => {
  if (timeline.length === 0) {
    return (
      <div className="panel-inset p-12 text-center dark:bg-slate-800/20">
        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-bold dark:text-white">Chronology Deficit</h3>
        <p className="text-sm text-slate-500">Insufficient date data points to generate an investigative timeline.</p>
      </div>
    );
  }

  // Find the "Forensic Gap" if any (e.g. huge jump in dates or re-aging events)
  const sortedEvents = [...timeline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="premium-card p-8 bg-slate-50/50 dark:bg-slate-950/20">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Investigation Chronology</h3>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Mapping tradeline evolution & reporting anomalies</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Violation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Standard</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[3.25rem] top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-800 rounded-full" />

        <div className="space-y-12">
          {sortedEvents.map((event, i) => {
            const isViolation = event.type === 'violation' || event.flagged;
            const prevEvent = i > 0 ? sortedEvents[i - 1] : null;
            const gapMonths = prevEvent ? (new Date(event.date).getTime() - new Date(prevEvent.date).getTime()) / (1000 * 60 * 60 * 24 * 30.44) : 0;
            const showGap = gapMonths > 12;

            return (
              <React.Fragment key={i}>
                {showGap && (
                  <div className="relative flex items-center gap-8 py-4 -ml-2">
                    <div className="w-16 shrink-0" />
                    <div className="relative shrink-0 z-10">
                      <div className="w-12 h-6 rounded-full bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-400">···</span>
                      </div>
                    </div>
                    <div className="flex-grow py-3 px-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Reporting Vacuum: {Math.floor(gapMonths / 12)}Y {Math.floor(gapMonths % 12)}M</p>
                      <p className="text-[10px] text-slate-500 italic">No activity reported during this period. Potential data suppression or re-aging trigger.</p>
                    </div>
                  </div>
                )}

                <div className="relative flex items-start gap-8 group">
                  {/* Time Indicator */}
                  <div className="w-16 pt-1 text-right shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{formatDate(event.date).split(',')[1]}</p>
                    <p className="text-sm font-bold dark:text-white tabular-nums">{formatDate(event.date).split(',')[0]}</p>
                  </div>

                  {/* Node */}
                  <div className="relative shrink-0 z-10">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${isViolation
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        {isViolation ? <path d="M12 8v4m0 4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" /> : <circle cx="12" cy="12" r="10" />}
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-grow p-5 rounded-2xl border transition-all ${isViolation
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-500/20'
                    : 'bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                    }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isViolation ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
                      {event.type}
                    </p>
                    <h4 className="text-base font-bold dark:text-white mb-1">{event.label}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{event.description}</p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimelineTab;
