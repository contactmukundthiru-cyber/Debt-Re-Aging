'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Workflow, 
  Cpu, 
  ShieldCheck, 
  History, 
  Play, 
  Pause, 
  Download, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Target, 
  Radiation, 
  Fingerprint,
  Activity,
  ArrowRight,
  TrendingUp,
  Boxes,
  Hash
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { DeltaResult, SeriesInsight, SeriesSnapshot, exportComparisonDossier, computeExpectedRemovalDate, exportComparisonCsv } from '../../../lib/delta';
import { exportComparisonDossierPdf } from '../../../lib/dossier-pdf';

interface DeltasTabProps {
  deltas: DeltaResult[];
  seriesInsights?: SeriesInsight[];
  seriesSnapshots?: SeriesSnapshot[];
  evidenceReadiness?: number;
}

function DeltasRoot({ children }: { children: React.ReactNode }) {
  return <div className="contents">{children}</div>;
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
    <DeltasRoot>
    <div className="fade-in space-y-24 pb-32">
      {/* ELITE_HERO::FORENSIC_RECONSTRUCTION */}
      <div className="relative group overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-16 px-6">
          <div className="flex-1 space-y-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-[2px] bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
              <span className="text-[12px] font-black text-orange-500 uppercase tracking-[0.6em] font-mono italic">Sector_Forensics_04</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-baseline gap-4">
                <span className="text-[150px] font-black text-white leading-none tracking-tighter font-mono italic select-none opacity-20 absolute -top-12 -left-8 pointer-events-none">DELTA</span>
                <h2 className="text-[110px] font-black text-white leading-[0.85] tracking-tighter uppercase font-mono italic relative z-10">
                  Forensic<br />
                  <span className="text-orange-500">Reconstruction</span>
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-10 max-w-2xl bg-black/20 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 shadow-3xl">
              <div className="shrink-0 w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
                <Workflow className="text-orange-500" size={32} />
              </div>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                Structural variance analysis across <span className="text-white font-mono font-bold tracking-tighter">SNAPSHOT_SERIES::{seriesSnapshots.length}</span>. Detecting unauthorized metadata shifts and illegal re-aging vectors within the institutional ecosystem.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-[450px] space-y-12">
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-slate-950/40 border-l-4 border-orange-500 p-8 rounded-r-[2.5rem] shadow-3xl group/metric hover:bg-slate-900/60 transition-all">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono mb-2 flex items-center gap-2">
                  <Activity size={12} /> DRIFT_NODE
                </p>
                <p className="text-8xl font-black text-white tabular-nums tracking-tighter font-mono">{deltas.length}</p>
                <p className="text-[9px] font-bold text-orange-500/50 uppercase tracking-widest mt-4 font-mono">STATUS::DETECTED</p>
              </div>
              
              <div className="bg-slate-950/40 border-l-4 border-rose-500 p-8 rounded-r-[2.5rem] shadow-3xl group/metric hover:bg-slate-900/60 transition-all">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono mb-2 flex items-center gap-2">
                  <Radiation size={12} className="text-rose-500" /> RISK_VECTORS
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-8xl font-black text-rose-500 tabular-nums tracking-tighter font-mono">{negativeCount}</p>
                  <span className="text-2xl font-black text-rose-900 font-mono tracking-tighter">V</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-3xl p-10 rounded-[3rem] shadow-3xl flex items-center justify-between group hover:border-emerald-500/40 transition-all duration-500">
              <div className="space-y-2">
                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] font-mono">FIX_VECTORS_AVAIL</p>
                <p className="text-4xl font-black text-white tabular-nums tracking-tighter font-mono">{positiveCount} SECURED</p>
              </div>
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <ShieldCheck className="text-emerald-500" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Neural Overlay Background */}
        <div className="absolute top-0 right-0 -z-10 opacity-20 pointer-events-none translate-x-1/4 -translate-y-1/4">
          <div className="w-[800px] h-[800px] bg-gradient-to-br from-orange-500/10 via-rose-500/5 to-transparent rounded-full blur-[150px] animate-pulse" />
        </div>
      </div>

      {seriesInsights.length > 0 && (
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Target className="w-5 h-5 text-orange-500" />
                <p className="text-[12px] font-black uppercase tracking-[0.5em] text-orange-500 font-mono italic">Strategic_Intelligence</p>
              </div>
              <h3 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic">
                Pattern <span className="text-slate-600">Vectors</span>
              </h3>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {['all', 'high', 'medium', 'low'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s as any)}
                  className={cn(
                    "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] font-mono border transition-all",
                    severityFilter === s 
                      ? "bg-orange-500 text-white border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]" 
                      : "bg-slate-950 border-white/5 text-slate-500 hover:border-white/20"
                  )}
                >
                  {s}_SEVERITY
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-10">
            {filteredInsights.map((insight, idx) => (
              <motion.div 
                key={insight.id} 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.1, type: "spring" }}
                className="relative overflow-hidden rounded-[3.5rem] border-2 border-white/5 p-12 bg-slate-950 shadow-3xl group/node hover:border-orange-500/30 transition-all duration-700"
              >
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:rotate-12 transition-transform duration-1000">
                  <Fingerprint size={180} />
                </div>

                <div className="flex items-start justify-between gap-8 mb-10 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-500 group-hover/node:rotate-6",
                      insight.severity === 'high' ? 'bg-rose-500/20 text-rose-500 shadow-rose-500/10' :
                      insight.severity === 'medium' ? 'bg-orange-500/20 text-orange-500 shadow-orange-500/10' :
                      'bg-slate-800 text-slate-500'
                    )}>
                      {insight.type === 'reaging' ? <Radiation className="w-8 h-8" /> : 
                       insight.type === 'removal_extension' ? <Activity className="w-8 h-8" /> :
                       <Zap className="w-8 h-8" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg",
                          insight.severity === 'high' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-900 text-slate-400 border border-white/5'
                        )}>
                          {insight.severity}_SEVERITY
                        </span>
                        <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest italic group-hover/node:text-orange-500/40 transition-colors">NODE::{insight.id.slice(0, 6).toUpperCase()}</span>
                      </div>
                      <h4 className="text-3xl font-black text-white uppercase tracking-tighter font-mono italic">{insight.title}</h4>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono mb-2">PROBABILITY</p>
                    <p className="text-4xl font-black text-orange-500 font-mono tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">{insightScore(insight)}%</p>
                  </div>
                </div>

                <p className="text-xl text-slate-400 mb-10 leading-relaxed font-medium italic relative z-10">
                  {insight.summary}
                </p>

                <div className="flex flex-wrap gap-4 relative z-10">
                  {insight.evidence.map((evidence, eIdx) => (
                    <div key={eIdx} className="px-6 py-3 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-3 group-hover/node:border-orange-500/20 transition-all">
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25rem] font-mono group-hover/node:text-white transition-colors">{evidence}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-16">
        {/* REPLAY_ENGINE::TEMPORAL_STREAM */}
        <div className="lg:col-span-8 space-y-12">
           <div className="relative p-12 bg-slate-950 border border-white/10 rounded-[4rem] shadow-3xl overflow-hidden group">
              <div className="absolute top-0 right-0 p-16 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
                <History size={240} />
              </div>

              <div className="flex items-start justify-between mb-16 relative z-10 px-4">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-orange-600 text-white flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.4)] border border-orange-400/20">
                    <History className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase font-mono italic">Temporal <span className="text-orange-500">Reconstruction</span></h3>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono mt-2">REPLAYING_{displaySnapshots.length}_SEQUENCE_STATES</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 bg-black/40 p-3 rounded-3xl border border-white/5 shadow-2xl">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className={cn(
                        "w-16 h-16 flex items-center justify-center rounded-2xl transition-all border shadow-2xl",
                        replayPlaying 
                            ? "bg-orange-600 border-orange-400 text-white animate-pulse" 
                            : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
                    )}
                    onClick={() => setReplayPlaying((prev) => !prev)}
                  >
                    {replayPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                  </motion.button>
                  
                  <div className="h-12 w-[1px] bg-white/5 mx-2" />

                  <button
                    type="button"
                    className="px-10 py-5 rounded-2xl bg-slate-900 border border-white/10 text-[11px] font-black uppercase tracking-[0.4em] text-white hover:bg-orange-600 hover:border-orange-400 transition-all shadow-2xl font-mono flex items-center gap-4 group/btn"
                    onClick={() => exportComparisonDossierPdf(deltas, seriesInsights, seriesSnapshots, 'forensic_comparison_dossier.pdf', evidenceReadiness)}
                  >
                    <FileText size={20} className="group-hover/btn:scale-110 transition-transform" />
                    EXPORT_DOSSIER
                  </button>
                </div>
              </div>

              {/* CONTROLS::SCRUBBER_LAB */}
              <div className="grid md:grid-cols-2 gap-16 mb-16 px-6 relative z-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-orange-500" />
                      <span className="text-[11px] font-black uppercase tracking-[0.4em] font-mono text-slate-500">Replay_Velocity</span>
                    </div>
                    <span className="text-[10px] font-black text-orange-500 font-mono tracking-[0.2em] bg-orange-600/10 border border-orange-500/20 px-3 py-1 rounded-lg">
                      {Math.round((2200 - replaySpeed) / 15)}X_REALTIME
                    </span>
                  </div>
                  <div className="relative group/range p-1">
                    <input
                        type="range"
                        min={700}
                        max={2200}
                        step={200}
                        value={replaySpeed}
                        onChange={(e) => setReplaySpeed(Number(e.target.value))}
                        className="w-full h-2 bg-slate-900 rounded-full appearance-none cursor-pointer accent-orange-600 border border-white/5"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Workflow className="w-4 h-4 text-blue-500" />
                       <span className="text-[11px] font-black uppercase tracking-[0.4em] font-mono text-slate-500">Sequence_Scrub</span>
                    </div>
                     <span className="text-[10px] font-black text-blue-400 font-mono tracking-[0.2em] bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-lg">
                       NODE::{replayIndex + 1}_OF_{displaySnapshots.length}
                     </span>
                  </div>
                  <div className="relative group/range p-1">
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
                        className="w-full h-2 bg-slate-900 rounded-full appearance-none cursor-pointer accent-blue-600 border border-white/5"
                    />
                  </div>
                </div>
              </div>

              {/* STREAM::ENTITY_NODES */}
              <div className="space-y-8 max-h-[900px] overflow-y-auto pr-8 custom-scrollbar relative z-10 px-4">
                <AnimatePresence mode="popLayout">
                  {displaySnapshots.map((snapshot, idx) => {
                    const prev = displaySnapshots[idx - 1];
                    const isFocus = replayIndex === idx;
                    const shifts = [
                      { label: 'DOFD', val: snapshot.dofd, shift: prev?.dofd && snapshot.dofd && prev.dofd !== snapshot.dofd, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
                      { label: 'Removal', val: snapshot.removal, shift: prev?.removal && snapshot.removal && prev.removal !== snapshot.removal, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
                      { label: 'Liability', val: snapshot.value, shift: prev?.value && snapshot.value && prev.value !== snapshot.value, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
                      { label: 'Status', val: snapshot.status, shift: prev?.status && snapshot.status && prev.status !== snapshot.status, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' }
                    ];

                    return (
                      <motion.div
                        key={snapshot.timestamp}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ 
                          opacity: isFocus ? 1 : 0.25, 
                          scale: isFocus ? 1.02 : 1, 
                          y: 0,
                          filter: isFocus ? 'blur(0px)' : 'blur(1px)'
                        }}
                        className={cn(
                          "p-10 rounded-[3.5rem] border-2 transition-all duration-700 relative overflow-hidden",
                          isFocus 
                            ? "bg-slate-900 border-orange-500/40 shadow-4xl ring-1 ring-orange-500/20"
                            : "bg-black/20 border-white/5"
                        )}
                      >
                         {isFocus && (
                           <motion.div 
                             layoutId="node-glow"
                             className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" 
                           />
                         )}

                        <div className="flex items-center justify-between gap-6 mb-10">
                           <div className="flex items-center gap-6">
                              <span className={cn(
                                "w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-[13px] font-black font-mono shadow-2xl transition-all",
                                isFocus ? "bg-orange-600 border-orange-400 text-white scale-110" : "bg-slate-950 border-white/5 text-slate-700"
                              )}>
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <div>
                                <h5 className="text-2xl font-black text-white tracking-tighter uppercase font-mono italic">{snapshot.label}</h5>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono mt-1">STREAM_STATE::VERIFIED_STRUCTURAL</p>
                              </div>
                           </div>
                           
                           {isFocus && (
                              <div className="flex items-center gap-4 px-6 py-2.5 bg-orange-600/10 rounded-full border border-orange-500/20 shadow-2xl">
                                 <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
                                 <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono text-orange-500">PAYLOAD_ACTIVE</span>
                              </div>
                           )}
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                           {shifts.map(s => (
                              <div key={s.label} className="space-y-3">
                                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic">{s.label}</p>
                                 <div className={cn(
                                   "px-6 py-4 rounded-2xl border text-[14px] font-black tabular-nums font-mono flex items-center justify-between",
                                   s.shift ? (isFocus ? s.color : "border-white/10 text-slate-400 grayscale") : (isFocus ? "bg-black/40 border-white/5 text-white shadow-inner" : "border-transparent text-slate-800")
                                 )}>
                                   <span className="truncate">{s.val || 'NULL_DATA'}</span>
                                   {s.shift && isFocus && <TrendingUp size={14} className="shrink-0 ml-2" />}
                                 </div>
                                 {s.shift && isFocus && (
                                   <div className="flex items-center gap-2 animate-pulse px-2">
                                      <div className={cn("w-1.5 h-1.5 rounded-full", s.color.split(' ')[1].replace('text-', 'bg-'))} />
                                      <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] font-mono", s.color.split(' ')[0])}>DRIFT_DETECTED</span>
                                   </div>
                                 )}
                              </div>
                           ))}
                        </div>

                        {changeHighlights[snapshot.timestamp]?.length > 0 && isFocus && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-10 pt-10 border-t border-white/5 space-y-6"
                          >
                             <div className="flex items-center gap-3">
                               <Cpu className="w-4 h-4 text-slate-600" />
                               <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono">Sequence_Delta_Metadata</p>
                             </div>
                             <div className="flex flex-wrap gap-4">
                                {changeHighlights[snapshot.timestamp].map((c, cIdx) => (
                                   <div key={cIdx} className="px-6 py-3.5 bg-black rounded-2xl border border-white/5 flex items-center gap-6 shadow-2xl hover:border-orange-500/20 transition-all group/chip">
                                      <span className="text-[11px] font-black text-slate-500 font-mono tracking-[0.2em] uppercase">{c.field}</span>
                                      <div className="flex items-center gap-4">
                                        <span className="text-[11px] font-bold text-slate-700 font-mono line-through tracking-tighter">{c.from || 'EMPTY'}</span>
                                        <ArrowRight className="w-4 h-4 text-orange-500 group-hover/chip:translate-x-1 transition-transform" />
                                        <span className="text-[11px] font-black text-orange-500 font-mono tracking-tighter">{c.to || 'NULL'}</span>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
           </div>
        </div>

        {/* INSTITUTIONAL_SIDEBAR::INTEGRITY_MATRIX */}
        <div className="lg:col-span-4 space-y-12">
            {/* INTEGRITY_GAUGE */}
            <div className="bg-slate-950 border border-white/10 rounded-[3.5rem] p-12 shadow-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:rotate-12 transition-transform duration-1000">
                    <Target size={200} />
                </div>
                
                <div className="relative z-10 space-y-12 text-left">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                        <div className="w-2 h-10 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                        <div>
                            <h4 className="text-[12px] font-black text-white uppercase tracking-[0.5em] font-mono leading-none mb-1">Dossier Integrity</h4>
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">Forensic Confidence Rating</p>
                        </div>
                    </div>

                    <div className="flex items-end justify-between">
                        <div className="space-y-4">
                            <p className="text-7xl font-black text-white font-mono tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{confidenceScore}%</p>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-2.5 h-2.5 rounded-full",
                                    readinessTag === 'court_ready' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                    readinessTag === 'review_ready' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' :
                                    'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                                )} />
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.3em] font-mono italic",
                                    readinessTag === 'court_ready' ? 'text-emerald-500' :
                                    readinessTag === 'review_ready' ? 'text-orange-500' :
                                    'text-rose-500'
                                )}>
                                    {readinessTag.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner relative">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${confidenceScore}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className="h-full bg-gradient-to-r from-orange-600 via-orange-400 to-emerald-500 rounded-full relative shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.1)_50%,rgba(255,255,255,.1)_75%,transparent_75%,transparent)] bg-[length:15px_15px] animate-[progress_1s_linear_infinite]" />
                        </motion.div>
                    </div>

                    <div className="pt-8 border-t border-white/5 space-y-6">
                        <div className="flex items-center gap-3">
                            <Boxes className="w-4 h-4 text-slate-600" />
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono">Anomaly_Distribution</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {typeBreakdown.map(item => (
                                <div key={item.key} className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2 group/stat hover:border-orange-500/20 transition-all">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono italic">{item.label}</span>
                                    <span className="text-2xl font-black text-orange-500 font-mono tracking-tighter tabular-nums drop-shadow-[0_0_5px_rgba(249,115,22,0.2)]">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

           {/* MONITOR::SLA_GUARD_ELITE */}
           {slaWindows && (
             <div className="relative p-12 bg-slate-950 border border-white/10 rounded-[3.5rem] shadow-3xl overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:rotate-12 transition-transform duration-1000">
                    <Clock size={200} />
               </div>
               
               <div className="relative z-10 space-y-10">
                 <div className="flex items-center gap-5 border-b border-white/5 pb-8">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
                       <Clock className="w-9 h-9" />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black text-white uppercase tracking-[0.5em] font-mono leading-none mb-1">Timeline SLA Guard</h4>
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">Statutory Discovery Window</p>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="space-y-4">
                       <div className="flex justify-between items-baseline mb-2 px-2">
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-[0.3em] font-mono italic",
                            slaStatus?.status === 'breach' ? 'text-rose-500' : slaStatus?.status === 'warning' ? 'text-orange-500' : 'text-emerald-500'
                          )}>
                            {slaStatus?.status === 'breach' ? 'PROTOCOL_BREACH' : 'PROTOCOL_COMPLIANCE'}
                          </p>
                          <span className="text-2xl font-black text-white font-mono tracking-tighter tabular-nums px-2">
                            {Math.round(Math.max(0, 100 - ((slaStatus?.daysTo30 || 0) / 30 * 100)))}%
                          </span>
                       </div>
                       <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, 100 - ((slaStatus?.daysTo30 || 0) / 30 * 100))}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className={cn(
                              "h-full rounded-full shadow-2xl relative",
                              slaStatus?.status === 'breach' ? 'bg-rose-600 shadow-rose-500/30' : 'bg-indigo-600 shadow-indigo-500/30'
                            )}
                          >
                             <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.1)_50%,rgba(255,255,255,.1)_75%,transparent_75%,transparent)] bg-[length:10px_10px] animate-[progress_2s_linear_infinite]" />
                          </motion.div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 space-y-2 group/stat hover:border-indigo-500/20 transition-all">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] font-mono italic">30D_Discovery</p>
                          <div className="flex items-center justify-between">
                             <span className="text-3xl font-black text-white font-mono tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">{slaStatus?.daysTo30}D</span>
                             <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                          </div>
                       </div>
                       <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 space-y-2 group/stat hover:border-rose-500/20 transition-all text-right">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] font-mono italic">45D_Statutory</p>
                          <div className="flex items-center justify-between flex-row-reverse">
                             <span className="text-3xl font-black text-white font-mono tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">{slaStatus?.daysTo45}D</span>
                             <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                          </div>
                       </div>
                    </div>
                 </div>
               </div>
             </div>
           )}

           {/* PROTOCOL::DECISION_HUB_ELITE */}
           <div className="relative p-12 bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-[4rem] shadow-4xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 animate-pulse" />
              <div className="relative z-10 space-y-12 text-left">
                 <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <ShieldCheck className="w-8 h-8 text-indigo-200" />
                       <h4 className="text-3xl font-black text-white tracking-tighter uppercase font-mono italic">Decision Protocol</h4>
                    </div>
                    <p className="text-indigo-100 text-lg font-medium leading-relaxed italic border-l-2 border-white/20 pl-8">
                       {readinessTag === 'court_ready'
                         ? 'Forensic reconstruction is secured. Patterns verified to federal statute. Proceed to litigation packaging.'
                         : 'Reconstruction incomplete. System detects insufficient metadata to support federal escalation.'}
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 4, tab: 'timeline' } }))}
                      className="w-full py-6 px-10 rounded-2xl bg-white text-indigo-950 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-indigo-50 transition-all shadow-4xl flex items-center justify-between group font-mono italic"
                    >
                      Audit Temporal Map
                      <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 4, tab: 'discovery' } }))}
                      className="w-full py-6 px-10 rounded-2xl bg-indigo-500/20 text-white font-black text-[11px] uppercase tracking-[0.4em] border-2 border-white/10 hover:bg-indigo-500/40 transition-all flex items-center justify-between group font-mono italic backdrop-blur-3xl"
                    >
                      Catalogue Evidence
                      <Boxes className="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* FEED::SEQUENCE_LOG_ELITE */}
      <div className="space-y-16 mt-32">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-12 px-6">
           <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Workflow className="w-5 h-5 text-orange-500" />
                <p className="text-[12px] font-black uppercase tracking-[0.5em] text-orange-500 font-mono italic">Institutional_Liability_Deltas</p>
              </div>
              <h3 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic">Sequence <span className="text-slate-600">Log</span></h3>
           </div>
           
           <div className="flex flex-wrap items-center gap-4 bg-slate-950 p-4 rounded-3xl border border-white/10 shadow-3xl backdrop-blur-3xl">
             {(['all', 'negative', 'positive', 'neutral'] as const).map(level => (
               <button
                 key={level}
                 onClick={() => setImpactFilter(level)}
                 className={cn(
                   "px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden font-mono",
                   impactFilter === level 
                     ? "bg-orange-600 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] border border-orange-400/50" 
                     : "text-slate-500 hover:text-white border border-transparent hover:border-white/10 shadow-none"
                 )}
               >
                 {level} <span className="text-[10px] opacity-40 ml-3 font-mono">[{level === 'all' ? deltas.length : impactCounts[level]}]</span>
               </button>
             ))}
           </div>
        </div>

        <div className="grid gap-10 px-4">
          <AnimatePresence mode="popLayout">
            {sortedDeltas.map((delta, i) => {
              const impactConfig = {
                negative: { color: 'border-rose-500/30 bg-rose-500/5 backdrop-blur-3xl shadow-3xl', icon: <AlertTriangle className="w-12 h-12 text-rose-500" />, label: 'RISK_INCREASE', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/10 shadow-3xl' },
                positive: { color: 'border-emerald-500/30 bg-emerald-500/5 backdrop-blur-3xl shadow-3xl', icon: <CheckCircle className="w-12 h-12 text-emerald-500" />, label: 'LIABILITY_DECREASE', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10 shadow-3xl' },
                neutral: { color: 'border-white/10 bg-slate-950 backdrop-blur-3xl shadow-3xl', icon: <Eye className="w-12 h-12 text-slate-500" />, label: 'STRUCTURAL_CHANGE', badge: 'bg-slate-900 text-slate-400 border-white/5 shadow-inner' }
              }[delta.impact || 'neutral'];

              return (
                <motion.div
                  key={delta.field + i}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: i * 0.05, type: "spring" }}
                  className={cn(
                    "relative p-12 rounded-[4rem] border-2 shadow-3xl transition-all duration-700 hover:scale-[1.01] group overflow-hidden",
                    impactConfig.color
                  )}
                >
                  <div className="absolute top-0 right-0 p-16 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000">
                     <Hash size={200} />
                  </div>

                  <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center gap-16">
                    <div className={cn(
                      "w-28 h-28 rounded-[2.5rem] flex items-center justify-center shrink-0 border-2 shadow-3xl transition-all duration-500 group-hover:rotate-12",
                      impactConfig.badge
                    )}>
                      {impactConfig.icon}
                    </div>

                    <div className="flex-1 space-y-10 w-full">
                      <div className="flex flex-wrap items-center gap-8">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-[0.5em] px-6 py-2.5 rounded-2xl border shadow-2xl font-mono italic",
                          impactConfig.badge
                        )}>
                          {impactConfig.label}
                        </span>
                        <h4 className="text-4xl font-black text-white tracking-tighter uppercase font-mono italic">{delta.field}</h4>
                        <div className="ml-auto flex items-center gap-4 text-slate-700 font-mono text-[10px] font-black uppercase tracking-widest italic group-hover:text-orange-500/40 transition-colors">
                            <Fingerprint size={14} />
                            DRIFT_ID::#{delta.field.slice(0, 3).toUpperCase()}_{i+1000}
                        </div>
                      </div>

                      <div className="grid xl:grid-cols-11 gap-8 items-center">
                        <div className="xl:col-span-4 space-y-4">
                           <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic px-4">SEQUENCE_PRIOR</p>
                           <div className="px-8 py-6 bg-black rounded-[2rem] border border-white/5 shadow-inner group/val">
                              <code className="text-lg font-black text-slate-700 font-mono line-through opacity-40 tracking-tighter block truncate">{delta.oldValue || 'UNDEFINED'}</code>
                           </div>
                        </div>
                        
                        <div className="xl:col-span-1 flex justify-center">
                           <div className="w-14 h-14 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-4xl group-hover:scale-110 group-hover:bg-orange-600 group-hover:border-orange-400 transition-all duration-500">
                              <ArrowRight className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors" />
                           </div>
                        </div>

                        <div className="xl:col-span-4 space-y-4">
                           <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic px-4">SEQUENCE_RESOLUTION</p>
                           <div className={cn(
                             "px-8 py-6 rounded-[2rem] border shadow-4xl transition-all group-hover:shadow-orange-500/10 bg-black",
                             impactConfig.badge.split(' ')[0],
                           )}>
                              <code className={cn(
                                "text-lg font-black font-mono tracking-tighter block truncate",
                                delta.impact === 'negative' ? 'text-rose-500' : delta.impact === 'positive' ? 'text-emerald-500' : 'text-slate-300'
                              )}>
                                {delta.newValue || 'NULL_STATE'}
                              </code>
                           </div>
                        </div>

                        <div className="xl:col-span-2 flex justify-end">
                            <motion.button 
                                whileHover={{ scale: 1.1, x: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => window.dispatchEvent(new CustomEvent('cra:focus-field', { detail: { field: delta.field.toLowerCase() } }))}
                                className="w-20 h-20 rounded-[1.8rem] bg-slate-950 text-white shadow-4xl border border-white/5 flex items-center justify-center hover:bg-orange-600 hover:border-orange-400 transition-all duration-500"
                            >
                                <Play size={24} className="ml-1" />
                            </motion.button>
                        </div>
                      </div>

                      <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-5xl italic border-l-2 border-white/5 pl-8">
                        {delta.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </DeltasRoot>
  );
};

export default DeltasTab;
