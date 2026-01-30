'use client';

import React, { useMemo } from 'react';
import { DeltaResult, SeriesInsight, SeriesSnapshot, exportComparisonDossier, computeExpectedRemovalDate, exportComparisonCsv } from '../../../lib/delta';
import { exportComparisonDossierPdf } from '../../../lib/dossier-pdf';

interface DeltasTabProps {
  deltas: DeltaResult[];
  seriesInsights?: SeriesInsight[];
  seriesSnapshots?: SeriesSnapshot[];
  evidenceReadiness?: number;
}

const DeltasTab: React.FC<DeltasTabProps> = ({ deltas, seriesInsights = [], seriesSnapshots = [], evidenceReadiness = 0 }) => {
  const negativeCount = useMemo(() => deltas.filter(d => d.impact === 'negative').length, [deltas]);
  const positiveCount = useMemo(() => deltas.filter(d => d.impact === 'positive').length, [deltas]);
  const [activeInsightId, setActiveInsightId] = React.useState<string | null>(null);
  const activeInsight = seriesInsights.find(insight => insight.id === activeInsightId);
  const findInsightByType = (type: SeriesInsight['type']) => seriesInsights.find(insight => insight.type === type);
  const [replayIndex, setReplayIndex] = React.useState(0);
  const [replayPlaying, setReplayPlaying] = React.useState(false);
  const [replaySpeed, setReplaySpeed] = React.useState(1400);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [impactFilter, setImpactFilter] = React.useState<'all' | 'negative' | 'positive' | 'neutral'>('all');
  const [severityFilter, setSeverityFilter] = React.useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [deltaSort, setDeltaSort] = React.useState<'impact' | 'field' | 'direction'>('impact');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showChangedSnapshotsOnly, setShowChangedSnapshotsOnly] = React.useState(false);
  const insightScore = (insight: SeriesInsight) => {
    const base = insight.severity === 'high' ? 90 : insight.severity === 'medium' ? 70 : 50;
    const readinessBoost = evidenceReadiness >= 75 ? 8 : evidenceReadiness >= 50 ? 4 : 0;
    return Math.min(100, base + readinessBoost);
  };

  const prioritizedInsights = React.useMemo(() => {
    const weight = evidenceReadiness < 60 ? 1.1 : 1;
    const severityScore = (severity: SeriesInsight['severity']) => {
      if (severity === 'high') return 3 * weight;
      if (severity === 'medium') return 2 * weight;
      return 1;
    };
    return [...seriesInsights].sort((a, b) => severityScore(b.severity) - severityScore(a.severity));
  }, [evidenceReadiness, seriesInsights]);

  const filteredInsights = React.useMemo(() => {
    if (severityFilter === 'all') return prioritizedInsights;
    return prioritizedInsights.filter(insight => insight.severity === severityFilter);
  }, [prioritizedInsights, severityFilter]);

  const filteredDeltas = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = impactFilter === 'all' ? deltas : deltas.filter(delta => delta.impact === impactFilter);
    if (!term) return base;
    return base.filter(delta => {
      const haystack = `${delta.field} ${delta.oldValue} ${delta.newValue} ${delta.description}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [deltas, impactFilter, searchTerm]);
  const sortedDeltas = React.useMemo(() => {
    const impactRank = (impact: DeltaResult['impact']) => impact === 'negative' ? 3 : impact === 'neutral' ? 2 : 1;
    const sorted = [...filteredDeltas];
    if (deltaSort === 'field') {
      sorted.sort((a, b) => a.field.localeCompare(b.field));
    } else if (deltaSort === 'direction') {
      sorted.sort((a, b) => a.oldValue.localeCompare(b.oldValue));
    } else {
      sorted.sort((a, b) => impactRank(b.impact) - impactRank(a.impact));
    }
    return sorted;
  }, [deltaSort, filteredDeltas]);

  const impactCounts = React.useMemo(() => {
    return deltas.reduce((acc, delta) => {
      acc[delta.impact] += 1;
      return acc;
    }, { negative: 0, positive: 0, neutral: 0 });
  }, [deltas]);

  const displaySnapshots = React.useMemo(() => {
    if (!showChangedSnapshotsOnly) return seriesSnapshots;
    return seriesSnapshots.filter((snapshot, idx) => {
      const prev = seriesSnapshots[idx - 1];
      if (!prev) return true;
      return prev.dofd !== snapshot.dofd
        || prev.removal !== snapshot.removal
        || prev.value !== snapshot.value
        || prev.status !== snapshot.status
        || prev.lastPayment !== snapshot.lastPayment
        || prev.reported !== snapshot.reported;
    });
  }, [seriesSnapshots, showChangedSnapshotsOnly]);

  React.useEffect(() => {
    if (!replayPlaying || displaySnapshots.length === 0) return;
    const handle = window.setInterval(() => {
      setReplayIndex((prev) => (prev + 1) % displaySnapshots.length);
    }, replaySpeed);
    return () => window.clearInterval(handle);
  }, [displaySnapshots.length, replayPlaying, replaySpeed]);

  React.useEffect(() => {
    if (displaySnapshots.length === 0) return;
    setReplayIndex((prev) => Math.min(prev, displaySnapshots.length - 1));
  }, [displaySnapshots.length]);

  const latestSnapshot = seriesSnapshots[seriesSnapshots.length - 1];
  const expectedRemoval = computeExpectedRemovalDate(latestSnapshot?.dofd, latestSnapshot?.bureau);
  const removalDeltaDays = (() => {
    if (!expectedRemoval || !latestSnapshot?.removal) return null;
    const removalDate = new Date(latestSnapshot.removal);
    if (Number.isNaN(removalDate.getTime())) return null;
    return Math.round((removalDate.getTime() - expectedRemoval.expected.getTime()) / (1000 * 60 * 60 * 24));
  })();
  const slaWindows = (() => {
    if (!latestSnapshot?.reported) return null;
    const reportedDate = new Date(latestSnapshot.reported);
    if (Number.isNaN(reportedDate.getTime())) return null;
    const status = (latestSnapshot.status || '').toLowerCase();
    const extended = status.includes('supplement') || status.includes('additional') || status.includes('investigation');
    const baseDays = extended ? 45 : 30;
    const extendedDays = 45;
    const day30 = new Date(reportedDate.getTime());
    day30.setDate(day30.getDate() + baseDays);
    const day45 = new Date(reportedDate.getTime());
    day45.setDate(day45.getDate() + extendedDays);
    return { reportedDate, day30, day45, baseDays, extendedDays, extended };
  })();

  const slaStatus = (() => {
    if (!slaWindows) return null;
    const now = new Date();
    const status = now > slaWindows.day45 ? 'breach' : now > slaWindows.day30 ? 'warning' : 'on_track';
    return {
      status,
      daysTo30: Math.ceil((slaWindows.day30.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      daysTo45: Math.ceil((slaWindows.day45.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    };
  })();

  const summaryStats = React.useMemo(() => {
    const highCount = seriesInsights.filter(insight => insight.severity === 'high').length;
    const mediumCount = seriesInsights.filter(insight => insight.severity === 'medium').length;
    const lowCount = seriesInsights.filter(insight => insight.severity === 'low').length;
    const strongest = prioritizedInsights[0];
    return { highCount, mediumCount, lowCount, strongest };
  }, [prioritizedInsights, seriesInsights]);

  const confidenceScore = Math.min(
    100,
    Math.round((summaryStats.highCount * 12 + summaryStats.mediumCount * 7 + (evidenceReadiness || 0) * 0.5))
  );
  const readinessTag = confidenceScore >= 80 ? 'court_ready' : confidenceScore >= 60 ? 'review_ready' : 'needs_evidence';
  const typeBreakdown = React.useMemo(() => {
    const counts = seriesInsights.reduce((acc, insight) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1;
      return acc;
    }, {} as Record<SeriesInsight['type'], number>);
    return [
      { key: 'reaging', label: 'Re-aging', count: counts.reaging || 0 },
      { key: 'removal_extension', label: 'Removal', count: counts.removal_extension || 0 },
      { key: 'value_shift', label: 'Stated Value', count: counts.value_shift || 0 },
      { key: 'status_flip', label: 'Status', count: counts.status_flip || 0 },
      { key: 'reporting_shift', label: 'Reporting', count: counts.reporting_shift || 0 }
    ];
  }, [seriesInsights]);
  const changeHighlights = React.useMemo(() => {
    const highlights: Record<string, { field: string; from?: string; to?: string }[]> = {};
    seriesSnapshots.forEach((snapshot, idx) => {
      const prev = seriesSnapshots[idx - 1];
      if (!prev) return;
      const changed: { field: string; from?: string; to?: string }[] = [];
      if (prev.dofd !== snapshot.dofd) changed.push({ field: 'DOFD', from: prev.dofd, to: snapshot.dofd });
      if (prev.removal !== snapshot.removal) changed.push({ field: 'Removal', from: prev.removal, to: snapshot.removal });
      if (prev.value !== snapshot.value) changed.push({ field: 'Stated Value', from: prev.value, to: snapshot.value });
      if (prev.status !== snapshot.status) changed.push({ field: 'Status', from: prev.status, to: snapshot.status });
      if (prev.lastPayment !== snapshot.lastPayment) changed.push({ field: 'Last Pay', from: prev.lastPayment, to: snapshot.lastPayment });
      if (prev.reported !== snapshot.reported) changed.push({ field: 'Reported', from: prev.reported, to: snapshot.reported });
      highlights[snapshot.timestamp] = changed;
    });
    return highlights;
  }, [seriesSnapshots]);

  if (deltas.length === 0 && seriesInsights.length === 0 && seriesSnapshots.length === 0) {
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

      {seriesInsights.length > 0 && (
        <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Series Forensics</p>
              <h3 className="text-lg font-bold dark:text-white">Multi-report pattern detection</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{seriesInsights.length} patterns</span>
          </div>
          <div className="grid gap-4">
            {prioritizedInsights.map(insight => (
              <div key={insight.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                    insight.severity === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                    insight.severity === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {insight.severity}
                  </span>
                  <h4 className="text-sm font-semibold dark:text-white">{insight.title}</h4>
                  <span className="text-[10px] font-mono text-slate-400">Score {insightScore(insight)}%</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{insight.summary}</p>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                  {insight.evidence.map(item => (
                    <span key={item} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {seriesSnapshots.length > 0 && (
        <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Report Timeline</p>
              <h3 className="text-lg font-bold dark:text-white">Snapshot drift across time</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">{displaySnapshots.length} snapshots</span>
              <button
                type="button"
                className={`px-2 py-1 rounded-full border text-[10px] uppercase tracking-widest ${
                  showChangedSnapshotsOnly ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
                onClick={() => setShowChangedSnapshotsOnly((prev) => !prev)}
              >
                {showChangedSnapshotsOnly ? 'Changes Only' : 'Show All'}
              </button>
              <button
                type="button"
                className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                onClick={() => {
                  const content = exportComparisonDossier(deltas, seriesInsights, seriesSnapshots);
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'forensic_comparison_dossier.txt';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export Dossier
              </button>
              <button
                type="button"
                className="btn btn-primary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                onClick={() => exportComparisonDossierPdf(deltas, seriesInsights, seriesSnapshots, 'forensic_comparison_dossier.pdf', evidenceReadiness)}
              >
                Export PDF
              </button>
              <button
                type="button"
                className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                onClick={() => setReplayPlaying((prev) => !prev)}
              >
                {replayPlaying ? 'Stop Replay' : 'Play Replay'}
              </button>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
                Speed
                <input
                  type="range"
                  min={700}
                  max={2200}
                  step={200}
                  value={replaySpeed}
                  onChange={(e) => setReplaySpeed(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
                Scrub
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, displaySnapshots.length - 1)}
                  step={1}
                  value={replayIndex}
                  onChange={(e) => {
                    setReplayIndex(Number(e.target.value));
                    setReplayPlaying(false);
                  }}
                />
              </div>
            </div>
          </div>
          {displaySnapshots.length > 0 && (
            <div className="mb-4">
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${displaySnapshots.length <= 1 ? 100 : Math.round((replayIndex / (displaySnapshots.length - 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-2">Replay progress</p>
            </div>
          )}
          {expectedRemoval && (
            <div className="mb-4 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-slate-400">
              <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                Expected removal: {expectedRemoval.expected.toLocaleDateString('en-US')}
              </span>
              {removalDeltaDays !== null && (
                <span className={`px-2 py-1 rounded-lg ${removalDeltaDays > 30 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                  Delta: {removalDeltaDays > 0 ? `+${removalDeltaDays}` : removalDeltaDays} days
                </span>
              )}
            </div>
          )}
          <div className="space-y-3">
            {displaySnapshots.map((snapshot, idx) => {
              const prev = displaySnapshots[idx - 1];
              const dofdShift = prev?.dofd && snapshot.dofd && prev.dofd !== snapshot.dofd;
              const removalShift = prev?.removal && snapshot.removal && prev.removal !== snapshot.removal;
              const statusShift = prev?.status && snapshot.status && prev.status !== snapshot.status;
              const valueShift = prev?.value && snapshot.value && prev.value !== snapshot.value;
              const lastPayShift = prev?.lastPayment && snapshot.lastPayment && prev.lastPayment !== snapshot.lastPayment;
              const reportedShift = prev?.reported && snapshot.reported && prev.reported !== snapshot.reported;
              return (
              <div
                key={snapshot.timestamp}
                className={`grid md:grid-cols-[160px\_1fr] gap-4 rounded-2xl border p-4 transition-all duration-500 ${
                  replayPlaying && replayIndex === idx
                    ? 'border-indigo-500/60 bg-indigo-500/5 scale-[1.01]'
                    : 'border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/40 opacity-80'
                }`}
              >
                <div>
                  <p className="text-xs font-semibold dark:text-white">{snapshot.label}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Snapshot</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">DOFD</span>
                    <p className={`font-mono ${dofdShift ? 'text-rose-500 font-semibold' : ''}`}>{snapshot.dofd || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">Removal</span>
                    <p className={`font-mono ${removalShift ? 'text-amber-500 font-semibold' : ''}`}>{snapshot.removal || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">Stated Value</span>
                    <p className={`font-mono ${valueShift ? 'text-indigo-500 font-semibold' : ''}`}>{snapshot.value || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">Status</span>
                    <p className={`font-mono ${statusShift ? 'text-blue-500 font-semibold' : ''}`}>{snapshot.status || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">Last Pay</span>
                    <p className={`font-mono ${lastPayShift ? 'text-emerald-500 font-semibold' : ''}`}>{snapshot.lastPayment || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">Reported</span>
                    <p className={`font-mono ${reportedShift ? 'text-rose-500 font-semibold' : ''}`}>{snapshot.reported || '—'}</p>
                  </div>
                </div>
                {changeHighlights[snapshot.timestamp]?.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Field Change Summary</p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                      {changeHighlights[snapshot.timestamp].map(change => (
                        <button
                          key={change.field}
                          type="button"
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] uppercase tracking-widest text-slate-500"
                          onClick={() => window.dispatchEvent(new CustomEvent('cra:focus-field', { detail: { field: change.field === 'DOFD' ? 'dofd' : change.field === 'Removal' ? 'estimatedRemovalDate' : change.field === 'Stated Value' ? 'currentValue' : change.field === 'Status' ? 'accountStatus' : change.field === 'Last Pay' ? 'dateLastPayment' : 'dateReportedOrUpdated' } }))}
                        >
                          {change.field}: {change.from || '—'} → {change.to || '—'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {(dofdShift || removalShift || statusShift || valueShift || reportedShift) && (
                  <div className="md:col-span-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
                    {dofdShift && (
                      <span
                        className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        title={`Previous DOFD: ${prev?.dofd || '—'} → ${snapshot.dofd || '—'}`}
                        onClick={() => setActiveInsightId(findInsightByType('reaging')?.id || null)}
                      >
                        DOFD Shift
                      </span>
                    )}
                    {removalShift && (
                      <span
                        className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        title={`Previous Removal: ${prev?.removal || '—'} → ${snapshot.removal || '—'}`}
                        onClick={() => setActiveInsightId(findInsightByType('removal_extension')?.id || null)}
                      >
                        Removal Shift
                      </span>
                    )}
                    {statusShift && (
                      <span
                        className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        title={`Previous Status: ${prev?.status || '—'} → ${snapshot.status || '—'}`}
                        onClick={() => setActiveInsightId(findInsightByType('status_flip')?.id || null)}
                      >
                        Status Shift
                      </span>
                    )}
                    {valueShift && (
                      <span
                        className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                        title={`Previous Value: ${prev?.value || '—'} → ${snapshot.value || '—'}`}
                        onClick={() => setActiveInsightId(findInsightByType('value_shift')?.id || null)}
                      >
                        Value Shift
                      </span>
                    )}
                    {reportedShift && (
                      <span
                        className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        title={`Previous Reported: ${prev?.reported || '—'} → ${snapshot.reported || '—'}`}
                        onClick={() => setActiveInsightId(findInsightByType('reporting_shift')?.id || null)}
                      >
                        Reporting Shift
                      </span>
                    )}
                  </div>
                )}
              </div>
            )})}
          </div>
          {seriesInsights.length > 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">Anomaly Markers</p>
              <div className="flex flex-wrap gap-2">
                {prioritizedInsights.map(insight => (
                  <button
                    key={insight.id}
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest border ${
                      insight.severity === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      insight.severity === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                    onClick={() => setActiveInsightId(insight.id)}
                  >
                    {insight.title}
                  </button>
                ))}
              </div>
              {activeInsight && (
                <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{activeInsight.title}</p>
                    <button
                      type="button"
                      className="text-[10px] uppercase tracking-widest text-blue-500"
                      onClick={() => setDrawerOpen(true)}
                    >
                      Open Evidence Drawer
                    </button>
                  </div>
                  <p className="mb-2">{activeInsight.summary}</p>
                  <ul className="space-y-1">
                    {activeInsight.evidence.map(item => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className="mt-6 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">Liability Drift</p>
            <div className="flex items-end gap-2 h-20">
              {displaySnapshots.map((snapshot, idx) => {
                const prev = displaySnapshots[idx - 1];
                const dofdShift = prev?.dofd && snapshot.dofd && prev.dofd !== snapshot.dofd;
                const removalShift = prev?.removal && snapshot.removal && prev.removal !== snapshot.removal;
                const statusShift = prev?.status && snapshot.status && prev.status !== snapshot.status;
                const raw = snapshot.value || '';
                const value = Number.parseFloat(raw.replace(/[^0-9.-]/g, ''));
                const height = Number.isFinite(value) ? Math.max(8, Math.min(100, Math.round((value / 10000) * 100))) : 8;
                return (
                  <div key={snapshot.timestamp} className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div
                        className={`w-4 rounded-full transition-all duration-700 ${replayPlaying && replayIndex !== idx ? 'bg-indigo-500/20' : 'bg-indigo-500/70'}`}
                        style={{ height: `${height}%` }}
                      />
                      {(dofdShift || removalShift || statusShift) && (
                        <div
                          className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-rose-500"
                          title={`Anomaly: ${dofdShift ? 'DOFD shift' : ''}${removalShift ? ' Removal shift' : ''}${statusShift ? ' Status shift' : ''}`}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{snapshot.label.split(',')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {seriesInsights.length > 0 && (
        <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Forensic Summary</p>
              <h3 className="text-lg font-bold dark:text-white">Highest-impact anomalies</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Confidence {confidenceScore}%</span>
              <span className={`px-2 py-1 rounded-full text-[9px] uppercase tracking-widest border ${
                readinessTag === 'court_ready' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                readinessTag === 'review_ready' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}>
                {readinessTag.replace('_', ' ')}
              </span>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
            <span>Filter severity</span>
            {(['all', 'high', 'medium', 'low'] as const).map(level => (
              <button
                key={level}
                type="button"
                className={`px-2 py-1 rounded-full border ${
                  severityFilter === level ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
                onClick={() => setSeverityFilter(level)}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="mb-4">
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${confidenceScore}%` }}
              />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-2">Blend of severity + readiness</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
              <p className="text-[10px] uppercase tracking-widest text-rose-500 mb-1">High Severity</p>
              <p className="text-2xl font-bold text-rose-500">{summaryStats.highCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <p className="text-[10px] uppercase tracking-widest text-amber-500 mb-1">Medium Severity</p>
              <p className="text-2xl font-bold text-amber-500">{summaryStats.mediumCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Low Severity</p>
              <p className="text-2xl font-bold text-slate-600">{summaryStats.lowCount}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Anomaly Mix</p>
            <div className="flex flex-wrap gap-2">
              {typeBreakdown.map(item => (
                <span key={item.key} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] uppercase tracking-widest text-slate-500">
                  {item.label} {item.count}
                </span>
              ))}
            </div>
          </div>
          {summaryStats.strongest && (
            <div className="mt-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-400">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Top Anomaly</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{summaryStats.strongest.title}</p>
              <p className="mt-2">{summaryStats.strongest.summary}</p>
            </div>
          )}
          <div className="mt-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-400">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Next Best Action</p>
            <p className="text-sm font-semibold dark:text-white mb-3">
              {readinessTag === 'court_ready'
                ? 'Export dossier bundle and move to attorney review.'
                : readinessTag === 'review_ready'
                  ? 'Resolve timeline blockers and validate removal dates.'
                  : 'Complete evidence checklist to strengthen admissibility.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 4, tab: 'timeline' } }))}
              >
                Open Timeline
              </button>
              <button
                type="button"
                className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 4, tab: 'discovery' } }))}
              >
                Evidence Checklist
              </button>
              <button
                type="button"
                className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 5 } }))}
              >
                Export Pack
              </button>
            </div>
          </div>
          {filteredInsights.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Priority Order</p>
              <div className="flex flex-wrap gap-2">
                {filteredInsights.slice(0, 5).map(insight => (
                  <span key={insight.id} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] uppercase tracking-widest text-slate-500">
                    {insight.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

          {slaWindows && (
        <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">SLA Windows</p>
              <h3 className="text-lg font-bold dark:text-white">Reinvestigation timing</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{latestSnapshot?.bureau || 'Bureau'} SLA</span>
          </div>
          {slaStatus && (
            <div className="mb-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
              <span className={`px-2 py-1 rounded-lg border ${
                slaStatus.status === 'breach' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                slaStatus.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              }`}>
                {slaStatus.status === 'breach' ? 'SLA Breach' : slaStatus.status === 'warning' ? `Approaching ${slaWindows.baseDays}-day` : 'On track'}
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                30-day: {slaStatus.daysTo30} days
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                45-day: {slaStatus.daysTo45} days
              </span>
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Reported</p>
              <p className="font-mono">{slaWindows.reportedDate.toLocaleDateString('en-US')}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <p className="text-[10px] uppercase tracking-widest text-blue-500 mb-1">{slaWindows.baseDays}-Day SLA</p>
              <p className="font-mono text-blue-700">{slaWindows.day30.toLocaleDateString('en-US')}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <p className="text-[10px] uppercase tracking-widest text-amber-500 mb-1">45-Day SLA</p>
              <p className="font-mono text-amber-700">{slaWindows.day45.toLocaleDateString('en-US')}</p>
            </div>
          </div>
          {slaWindows.extended && (
            <p className="mt-3 text-[10px] uppercase tracking-widest text-amber-500">Extended SLA applied due to investigation status.</p>
          )}
        </div>
      )}

      {drawerOpen && activeInsight && (
        <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Anomaly Evidence Drawer</p>
              <h3 className="text-lg font-bold dark:text-white">{activeInsight.title}</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Score {insightScore(activeInsight)}%</span>
            <button
              type="button"
              className="text-[10px] uppercase tracking-widest text-slate-400"
              onClick={() => setDrawerOpen(false)}
            >
              Close
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{activeInsight.summary}</p>
          <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Evidence Extracts</p>
              <ul className="space-y-1">
                {activeInsight.evidence.map(item => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Jump to Fields</p>
                <div className="flex flex-wrap gap-2">
                  {activeInsight.type === 'reaging' && (
                    <button
                      type="button"
                      className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                      onClick={() => window.dispatchEvent(new CustomEvent('cra:focus-field', { detail: { field: 'dofd' } }))}
                    >
                      DOFD
                    </button>
                  )}
                  {activeInsight.type === 'removal_extension' && (
                    <button
                      type="button"
                      className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                      onClick={() => window.dispatchEvent(new CustomEvent('cra:focus-field', { detail: { field: 'estimatedRemovalDate' } }))}
                    >
                      Removal Date
                    </button>
                  )}
                  {activeInsight.type === 'status_flip' && (
                    <button
                      type="button"
                      className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                      onClick={() => window.dispatchEvent(new CustomEvent('cra:focus-field', { detail: { field: 'accountStatus' } }))}
                    >
                      Account Status
                    </button>
                  )}
                  {activeInsight.type === 'value_shift' && (
                    <button
                      type="button"
                      className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                      onClick={() => window.dispatchEvent(new CustomEvent('cra:focus-field', { detail: { field: 'currentValue' } }))}
                    >
                      Stated Value
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Recommended Actions</p>
              <ul className="space-y-1">
                <li>• Verify date fields in Step 3.</li>
                <li>• Add supporting documents to evidence checklist.</li>
                <li>• Review SLA deadlines and escalation triggers.</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                  onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 3 } }))}
                >
                  Open Verification
                </button>
                <button
                  type="button"
                  className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                  onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 4, tab: 'deadlines' } }))}
                >
                  Review Deadlines
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delta Cards */}
      <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Delta Filters</p>
            <h3 className="text-lg font-bold dark:text-white">Impact breakdown</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest">
            <input
              type="text"
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[10px]"
              placeholder="Search deltas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="button"
              className="px-2 py-1 rounded-full border bg-slate-100 text-slate-500"
              onClick={() => setSearchTerm('')}
            >
              Clear
            </button>
            <div className="flex items-center gap-2">
              {[
                { label: 'DOFD', term: 'dofd' },
                { label: 'Removal', term: 'removal' },
                { label: 'Balance', term: 'balance' },
                { label: 'Status', term: 'status' }
              ].map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  className={`px-2 py-1 rounded-full border ${
                    searchTerm.toLowerCase().includes(filter.term)
                      ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                  onClick={() => setSearchTerm(filter.term)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400">
              {sortedDeltas.length} / {deltas.length} results
            </span>
            <select
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[10px]"
              value={deltaSort}
              onChange={(e) => setDeltaSort(e.target.value as typeof deltaSort)}
            >
              <option value="impact">Sort: Impact</option>
              <option value="field">Sort: Field</option>
              <option value="direction">Sort: Before → After</option>
            </select>
            {(['all', 'negative', 'positive', 'neutral'] as const).map(level => (
              <button
                key={level}
                type="button"
                className={`px-2 py-1 rounded-full border ${
                  impactFilter === level ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
                onClick={() => setImpactFilter(level)}
              >
                {level}
                {level !== 'all' && (
                  <span className="ml-1 text-[9px] font-mono text-slate-400">
                    {impactCounts[level]}
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              className="px-2 py-1 rounded-full border bg-slate-900 text-white"
              onClick={() => {
                const csv = exportComparisonCsv(sortedDeltas);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'filtered_deltas.csv';
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {sortedDeltas.map((delta, i) => {
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
          {sortedDeltas.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-500 text-center">
              No deltas match the current filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeltasTab;
