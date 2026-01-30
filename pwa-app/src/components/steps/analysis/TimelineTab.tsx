'use client';

import React, { useMemo } from 'react';
import { TimelineEvent } from '../../../lib/analytics';
import { exportTimelinePdf } from '../../../lib/timeline-pdf';
import { formatDate } from '../../../lib/i18n';

interface TimelineTabProps {
  timeline: TimelineEvent[];
  bureau?: string;
}

const TimelineTab: React.FC<TimelineTabProps> = ({ timeline, bureau }) => {
  const sortedEvents = useMemo(() => [...timeline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [timeline]);
  const violationCount = useMemo(() => timeline.filter(e => e.type === 'violation' || e.flagged).length, [timeline]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [autoPlay, setAutoPlay] = React.useState(false);
  const [speedMs, setSpeedMs] = React.useState(1400);
  const [selectedEvent, setSelectedEvent] = React.useState<TimelineEvent | null>(null);
  const integrityScore = React.useMemo(() => {
    const flagged = violationCount;
    const total = Math.max(sortedEvents.length, 1);
    return Math.max(30, Math.round(100 - (flagged / total) * 60));
  }, [sortedEvents.length, violationCount]);

  const violationClusters = React.useMemo(() => {
    const clusters: { start: number; end: number; size: number }[] = [];
    let start = -1;
    sortedEvents.forEach((event, idx) => {
      const isViolation = event.type === 'violation' || event.flagged;
      if (isViolation && start === -1) {
        start = idx;
      }
      if (!isViolation && start !== -1) {
        const end = idx - 1;
        if (end - start + 1 >= 2) {
          clusters.push({ start, end, size: end - start + 1 });
        }
        start = -1;
      }
    });
    if (start !== -1) {
      const end = sortedEvents.length - 1;
      if (end - start + 1 >= 2) {
        clusters.push({ start, end, size: end - start + 1 });
      }
    }
    return clusters;
  }, [sortedEvents]);

  const clusterSummaries = React.useMemo(() => {
    return violationClusters.map(cluster => {
      const startEvent = sortedEvents[cluster.start];
      const endEvent = sortedEvents[cluster.end];
      const months = Math.round((new Date(endEvent.date).getTime() - new Date(startEvent.date).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      const score = Math.min(100, cluster.size * 12 + Math.max(0, months) * 2);
      return {
        ...cluster,
        startLabel: startEvent.label,
        endLabel: endEvent.label,
        spanMonths: months,
        score
      };
    }).sort((a, b) => b.score - a.score);
  }, [sortedEvents, violationClusters]);

  const integrityTrend = React.useMemo(() => {
    let score = 100;
    return sortedEvents.map(event => {
      const penalty = event.type === 'violation' || event.flagged ? 8 : 0;
      score = Math.max(30, score - penalty);
      return score;
    });
  }, [sortedEvents]);

  const severityTrend = React.useMemo(() => {
    return sortedEvents.map((event, idx) => {
      const prevEvent = idx > 0 ? sortedEvents[idx - 1] : null;
      const gapMonths = prevEvent ? (new Date(event.date).getTime() - new Date(prevEvent.date).getTime()) / (1000 * 60 * 60 * 24 * 30.44) : 0;
      const isViolation = event.type === 'violation' || event.flagged;
      const evidenceStrength = event.evidenceSnippets ? Math.min(event.evidenceSnippets.length, 3) : 0;
      const score = Math.min(100, (isViolation ? 70 : 20) + Math.min(20, gapMonths) + evidenceStrength * 5);
      return score;
    });
  }, [sortedEvents]);

  const confidenceTrend = React.useMemo(() => {
    return sortedEvents.map(event => {
      const evidence = event.evidenceSnippets ? Math.min(event.evidenceSnippets.length, 3) : 0;
      const base = event.type === 'violation' || event.flagged ? 70 : 20;
      return Math.min(100, base + evidence * 10);
    });
  }, [sortedEvents]);

  React.useEffect(() => {
    setActiveIndex(sortedEvents.length > 0 ? sortedEvents.length - 1 : 0);
  }, [sortedEvents]);

  React.useEffect(() => {
    if (!autoPlay || sortedEvents.length === 0) return;
    const handle = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % sortedEvents.length);
    }, speedMs);
    return () => window.clearInterval(handle);
  }, [autoPlay, sortedEvents.length, speedMs]);

  const monthsBetween = (start?: Date, end?: Date) => {
    if (!start || !end) return null;
    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.round(diff / (1000 * 60 * 60 * 24 * 30.44));
  };

  const keyDates = React.useMemo(() => {
    const findByType = (type: TimelineEvent['type']) => sortedEvents.find(event => event.type === type)?.date;
    const opened = findByType('account');
    const delinquency = findByType('delinquency');
    const chargeoff = findByType('chargeoff');
    const removal = findByType('removal');
    const payment = findByType('payment');
    const expectedRemoval = delinquency ? new Date(new Date(delinquency).getTime() + (365 * 7 + 180) * 24 * 60 * 60 * 1000) : null;
    const removalDeltaDays = expectedRemoval && removal
      ? Math.round((new Date(removal).getTime() - expectedRemoval.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      opened,
      delinquency,
      chargeoff,
      removal,
      payment,
      openToDofd: monthsBetween(opened, delinquency),
      dofdToChargeoff: monthsBetween(delinquency, chargeoff),
      chargeoffToRemoval: monthsBetween(chargeoff, removal),
      paymentToRemoval: monthsBetween(payment, removal),
      expectedRemoval,
      removalDeltaDays
    };
  }, [sortedEvents]);

  const fieldForEvent = (eventType: TimelineEvent['type']) => {
    switch (eventType) {
      case 'account':
        return 'dateOpened';
      case 'delinquency':
        return 'dofd';
      case 'chargeoff':
        return 'chargeOffDate';
      case 'payment':
        return 'dateLastPayment';
      case 'removal':
        return 'estimatedRemovalDate';
      default:
        return undefined;
    }
  };

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
            <div className="px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Integrity</p>
              <p className="text-2xl font-bold text-emerald-300 tabular-nums">{integrityScore}%</p>
            </div>
            {bureau && (
              <div className="px-6 py-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Bureau</p>
                <p className="text-sm font-bold text-indigo-200">{bureau}</p>
              </div>
            )}
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
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Violation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Standard</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
              onClick={() => setAutoPlay((prev) => !prev)}
            >
              {autoPlay ? 'Stop' : 'Auto-Play'}
            </button>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
              Speed
              <input
                type="range"
                min={800}
                max={2400}
                step={200}
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
              onClick={() => exportTimelinePdf(sortedEvents, integrityScore, bureau, clusterSummaries)}
            >
              Export Timeline PDF
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6 text-xs text-slate-600 dark:text-slate-400">
          <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-3 bg-white/70 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Open → DOFD</p>
            <p className="text-lg font-semibold">{keyDates.openToDofd !== null ? `${keyDates.openToDofd} mo` : '—'}</p>
          </div>
          <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-3 bg-white/70 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">DOFD → Charge-Off</p>
            <p className="text-lg font-semibold">{keyDates.dofdToChargeoff !== null ? `${keyDates.dofdToChargeoff} mo` : '—'}</p>
          </div>
          <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-3 bg-white/70 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Charge-Off → Removal</p>
            <p className="text-lg font-semibold">{keyDates.chargeoffToRemoval !== null ? `${keyDates.chargeoffToRemoval} mo` : '—'}</p>
          </div>
          <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-3 bg-white/70 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Payment → Removal</p>
            <p className="text-lg font-semibold">{keyDates.paymentToRemoval !== null ? `${keyDates.paymentToRemoval} mo` : '—'}</p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-indigo-700 dark:text-indigo-200">
          <p className="text-[10px] uppercase tracking-widest text-indigo-500 mb-2">Legal Clock Delta</p>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-indigo-500/20 bg-white/70 dark:bg-slate-900/40 p-3">
              <p className="text-[10px] uppercase tracking-widest text-indigo-500 mb-1">Expected Removal</p>
              <p className="text-sm font-semibold">{keyDates.expectedRemoval ? keyDates.expectedRemoval.toLocaleDateString('en-US') : '—'}</p>
            </div>
            <div className="rounded-xl border border-indigo-500/20 bg-white/70 dark:bg-slate-900/40 p-3">
              <p className="text-[10px] uppercase tracking-widest text-indigo-500 mb-1">Reported Removal</p>
              <p className="text-sm font-semibold">{keyDates.removal ? new Date(keyDates.removal).toLocaleDateString('en-US') : '—'}</p>
            </div>
            <div className="rounded-xl border border-indigo-500/20 bg-white/70 dark:bg-slate-900/40 p-3">
              <p className="text-[10px] uppercase tracking-widest text-indigo-500 mb-1">Delta (days)</p>
              <p className={`text-sm font-semibold ${keyDates.removalDeltaDays !== null && keyDates.removalDeltaDays > 30 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {keyDates.removalDeltaDays !== null ? `${keyDates.removalDeltaDays > 0 ? '+' : ''}${keyDates.removalDeltaDays}` : '—'}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-widest text-indigo-500">Bureau timing benchmark: {bureau || 'Default'} • FCRA 7y + 180d</p>
        </div>

        {clusterSummaries.length > 0 && (
          <div className="mb-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-700 dark:text-rose-300">
            <p className="text-[10px] uppercase tracking-widest text-rose-500 mb-3">Violation Clusters</p>
            <div className="grid md:grid-cols-2 gap-3">
              {clusterSummaries.map(cluster => (
                <div key={`${cluster.start}-${cluster.end}`} className="rounded-xl border border-rose-500/20 bg-white/70 dark:bg-slate-900/40 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-rose-500 mb-1">Cluster ({cluster.size} events)</p>
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    {cluster.startLabel} → {cluster.endLabel} • {cluster.spanMonths} mo span
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-rose-500 mt-2">Cluster Score {cluster.score}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute left-[4.5rem] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 via-slate-200 dark:via-slate-800 to-slate-200 dark:to-slate-800 rounded-full" />

          <div className="mb-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">Risk Density</p>
            <div className="flex items-end gap-2 h-20">
              {sortedEvents.map((event, idx) => {
                const isViolation = event.type === 'violation' || event.flagged;
                const evidence = event.evidenceSnippets ? Math.min(event.evidenceSnippets.length, 3) : 0;
                const height = isViolation ? 90 : 35 + evidence * 10;
                return (
                  <div key={`${event.label}-${idx}`} className="flex flex-col items-center gap-2">
                    <div className={`w-4 rounded-full ${isViolation ? 'bg-rose-500/70' : 'bg-slate-300/60'}`} style={{ height: `${Math.min(height, 100)}%` }} />
                    <span className="text-[10px] text-slate-400">{formatDate(event.date).split(',')[0]}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 text-[10px] uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500/70" />Violation cluster</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-300/70" />Standard event</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500/70" />High evidence</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500/70" />Moderate evidence</span>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">Severity Heatmap</p>
            <div className="flex gap-1">
              {severityTrend.map((score, idx) => (
                <div
                  key={`${score}-${idx}`}
                  className={`h-3 flex-1 rounded-full ${score >= 85 ? 'bg-rose-500/70' : score >= 70 ? 'bg-amber-500/70' : 'bg-slate-300/70'}`}
                  title={`Event ${idx + 1}: ${score}%`}
                />
              ))}
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">Integrity Trend</p>
            <div className="flex items-end gap-2 h-20">
              {integrityTrend.map((score, idx) => (
                <div key={`${score}-${idx}`} className="flex flex-col items-center gap-2">
                  <div className="w-4 rounded-full bg-emerald-500/70" style={{ height: `${Math.max(8, Math.min(100, score))}%` }} />
                  <span className="text-[10px] text-slate-400">{sortedEvents[idx]?.label?.split(' ')[0]}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-widest text-slate-400">Integrity declines with flagged violations</p>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">Confidence Trend</p>
            <div className="flex items-end gap-2 h-20">
              {confidenceTrend.map((score, idx) => (
                <div key={`${score}-${idx}`} className="flex flex-col items-center gap-2">
                  <div className="w-4 rounded-full bg-emerald-500/70" style={{ height: `${Math.max(8, Math.min(100, score))}%` }} />
                  <span className="text-[10px] text-slate-400">{sortedEvents[idx]?.label?.split(' ')[0]}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-widest text-slate-400">Evidence volume drives confidence</p>
          </div>

          <div className="space-y-10">
            {sortedEvents.map((event, i) => {
              const isViolation = event.type === 'violation' || event.flagged;
              const prevEvent = i > 0 ? sortedEvents[i - 1] : null;
              const gapMonths = prevEvent ? (new Date(event.date).getTime() - new Date(prevEvent.date).getTime()) / (1000 * 60 * 60 * 24 * 30.44) : 0;
              const showGap = gapMonths > 12;
              const active = activeIndex === i;
              const gapThresholds = bureau?.toLowerCase().includes('equifax')
                ? { low: 6, medium: 10, high: 20 }
                : bureau?.toLowerCase().includes('experian')
                  ? { low: 6, medium: 12, high: 24 }
                  : { low: 6, medium: 12, high: 24 };
              const gapSeverity = gapMonths >= gapThresholds.high
                ? 'high'
                : gapMonths >= gapThresholds.medium
                  ? 'medium'
                  : gapMonths >= gapThresholds.low
                    ? 'low'
                    : null;
              const inCluster = violationClusters.some(cluster => i >= cluster.start && i <= cluster.end);
              const evidenceStrength = event.evidenceSnippets ? Math.min(event.evidenceSnippets.length, 3) : 0;
              const severityScore = Math.min(100, (isViolation ? 70 : 20) + (gapSeverity === 'high' ? 20 : gapSeverity === 'medium' ? 12 : gapSeverity === 'low' ? 6 : 0) + evidenceStrength * 5);

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

                  <div className={`relative flex items-start gap-8 group transition-all duration-500 ${active ? 'scale-[1.01]' : 'opacity-80'}`}>
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
                      } ${active ? 'ring-2 ring-indigo-500/30' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isViolation ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                {event.type}
              </p>
                        {isViolation && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                        {event.tag && (
                          <span className="px-2 py-1 rounded-full text-[9px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {event.tag}
                          </span>
                        )}
                        {event.evidenceSnippets && (
                          <span className={`px-2 py-1 rounded-full text-[9px] uppercase tracking-widest border ${
                            event.evidenceSnippets.length >= 3 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            event.evidenceSnippets.length === 2 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            Evidence {Math.min(event.evidenceSnippets.length, 3)}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-[9px] uppercase tracking-widest border ${
                          severityScore >= 85 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          severityScore >= 70 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          Severity {severityScore}%
                        </span>
                        {inCluster && (
                          <span className="px-2 py-1 rounded-full text-[9px] uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            Violation Cluster
                          </span>
                        )}
                        {gapMonths > gapThresholds.low && (
                          <span className={`px-2 py-1 rounded-full text-[9px] uppercase tracking-widest border ${
                            gapSeverity === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            gapSeverity === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            Gap {Math.round(gapMonths)} mo
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold dark:text-white mb-2">{event.label}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{event.description}</p>
                      {isViolation && (
                        <button
                          type="button"
                          className="mt-4 btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                          onClick={() => setSelectedEvent(event)}
                        >
                          View Evidence
                        </button>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <div className="mt-6 flex items-center gap-4 text-[10px] uppercase tracking-widest text-slate-400">
            <span>Active event</span>
            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              {sortedEvents[activeIndex]?.label || '—'}
            </span>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Event Evidence Drawer</p>
              <h3 className="text-lg font-bold dark:text-white">{selectedEvent.label}</h3>
            </div>
            <button
              type="button"
              className="text-[10px] uppercase tracking-widest text-slate-400"
              onClick={() => setSelectedEvent(null)}
            >
              Close
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{selectedEvent.description}</p>
          <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Evidence Context</p>
              <ul className="space-y-1">
                <li>• Event date: {formatDate(selectedEvent.date)}</li>
                <li>• Event type: {selectedEvent.type}</li>
                {bureau && <li>• Bureau: {bureau}</li>}
              </ul>
              {selectedEvent.evidenceSnippets && selectedEvent.evidenceSnippets.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">OCR Excerpts</p>
                  <ul className="space-y-1">
                    {selectedEvent.evidenceSnippets.map((snippet) => (
                      <li key={snippet} className="text-[11px] text-slate-500">“{snippet}”</li>
                    ))}
                  </ul>
                </div>
              )}
              {!selectedEvent.evidenceSnippets && (
                <p className="mt-4 text-[10px] uppercase tracking-widest text-slate-400">No OCR excerpts captured yet.</p>
              )}
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Recommended Actions</p>
              <ul className="space-y-1">
                <li>• Verify date fields in Step 3.</li>
                <li>• Cross-check with previous report snapshots.</li>
                <li>• Add supporting evidence to the checklist.</li>
              </ul>
              {fieldForEvent(selectedEvent.type) && (
                <button
                  type="button"
                  className="mt-4 btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                  onClick={() => window.dispatchEvent(new CustomEvent('cra:focus-field', { detail: { field: fieldForEvent(selectedEvent.type) } }))}
                >
                  Jump to Field
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineTab;
