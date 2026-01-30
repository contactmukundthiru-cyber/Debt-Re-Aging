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
    <div className="fade-in space-y-12 pb-24">
      {/* SECTION_HEADER::FORENSIC_RECONSTRUCTION */}
      <div className="relative p-12 bg-slate-950 rounded-[3rem] border border-white/10 shadow-3xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] -ml-40 -mb-40" />
        
        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-12">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-md">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.4em] font-mono">Dossier Drift Replay</span>
              </div>
              <div className="h-px w-24 bg-gradient-to-r from-orange-500/50 to-transparent" />
            </div>
            
            <h2 className="text-6xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">
              Forensic <span className="text-orange-500">Reconstruction</span>
            </h2>
            
            <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-3xl">
              Structural variance analysis across <span className="text-white">SERIES::{seriesSnapshots.length}</span>. Detecting unauthorized metadata shifts, illegal re-aging vectors, and institutional data manipulation within the credit ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full xl:w-auto">
            <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl group/metric">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 font-mono">DRIFT_COUNT::01</p>
              <p className="text-5xl font-black text-white tabular-nums tracking-tighter">{deltas.length}</p>
              <div className="h-1 w-full bg-slate-800 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-orange-500 w-full" />
              </div>
            </div>
            
            <div className="bg-rose-500/10 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-rose-500/20 shadow-2xl group/metric">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 font-mono">RISK_VECTORS::02</p>
              <p className="text-5xl font-black text-rose-500 tabular-nums tracking-tighter">{negativeCount}</p>
              <div className="h-1 w-full bg-rose-500/20 rounded-full mt-4 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(negativeCount / Math.max(1, deltas.length)) * 100}%` }}
                  className="h-full bg-rose-500" 
                />
              </div>
            </div>

            <div className="bg-emerald-500/10 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-2xl group/metric">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 font-mono">FIX_VECTORS::03</p>
              <p className="text-5xl font-black text-emerald-500 tabular-nums tracking-tighter">{positiveCount}</p>
              <div className="h-1 w-full bg-emerald-500/20 rounded-full mt-4 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(positiveCount / Math.max(1, deltas.length)) * 100}%` }}
                  className="h-full bg-emerald-500" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {seriesInsights.length > 0 && (
        <div className="relative p-12 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-[3rem] shadow-3xl overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] transition-transform group-hover:rotate-12 group-hover:scale-125">
             <Fingerprint className="w-48 h-48" />
          </div>
          
          <div className="flex flex-wrap items-end justify-between gap-8 mb-12">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-orange-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 font-mono">Strategic Intelligence</p>
              </div>
              <h3 className="text-4xl font-black dark:text-white tracking-tighter uppercase font-mono italic">
                Cross-Series <span className="text-slate-500">Pattern Vectors</span>
              </h3>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="px-6 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                   {seriesInsights.length} DETECTION_NODES
                 </span>
               </div>
            </div>
          </div>
          
          <div className="grid xl:grid-cols-2 gap-8">
            {prioritizedInsights.map((insight, idx) => (
              <motion.div 
                key={insight.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl shadow-sm hover:shadow-2xl hover:border-orange-500/20 group/node"
              >
                <div className="flex items-start justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover/node:rotate-6",
                      insight.severity === 'high' ? 'bg-rose-500/20 text-rose-500' :
                      insight.severity === 'medium' ? 'bg-amber-500/20 text-amber-500' :
                      'bg-slate-500/20 text-slate-500'
                    )}>
                      {insight.type === 'reaging' ? <Radiation className="w-7 h-7" /> : 
                       insight.type === 'removal_extension' ? <Activity className="w-7 h-7" /> :
                       <Zap className="w-7 h-7" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                          insight.severity === 'high' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        )}>
                          {insight.severity}_SEVERITY
                        </span>
                        <span className="text-[10px] font-black text-slate-400 font-mono tracking-widest">NODE::{insight.id.slice(0, 4).toUpperCase()}</span>
                      </div>
                      <h4 className="text-xl font-black dark:text-white uppercase tracking-tighter font-mono">{insight.title}</h4>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono mb-1">PROBABILITY</p>
                    <p className="text-2xl font-black text-indigo-500 font-mono tabular-nums">{insightScore(insight)}%</p>
                  </div>
                </div>

                <p className="text-base text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                  {insight.summary}
                </p>

                <div className="flex flex-wrap gap-2">
                  {insight.evidence.map((evidence, eIdx) => (
                    <div key={eIdx} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50" />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest font-mono">{evidence}</span>
                    </div>
                  ))}
                </div>
                
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mb-16 opacity-0 group-hover/node:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-12">
        {/* REPLAY_ENGINE::TEMPORAL_STREAM */}
        <div className="lg:col-span-7 space-y-8">
           <div className="relative p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-[3rem] shadow-3xl overflow-hidden">
              <div className="flex items-start justify-between mb-12">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                    <History className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black dark:text-white tracking-tighter uppercase font-mono">Temporal Reconstruction</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mt-1">Replaying {displaySnapshots.length} Sequence States</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-950 text-white shadow-3xl border border-white/10"
                    onClick={() => setReplayPlaying((prev) => !prev)}
                  >
                    {replayPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </motion.button>
                  
                  <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

                  <button
                    type="button"
                    className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700"
                    onClick={() => exportComparisonDossierPdf(deltas, seriesInsights, seriesSnapshots, 'forensic_comparison_dossier.pdf', evidenceReadiness)}
                  >
                    <div className="flex items-center gap-3">
                       <FileText className="w-4 h-4" />
                       Download Bundle
                    </div>
                  </button>
                </div>
              </div>

              {/* CONTROLS::SPEED_AND_SCRUB */}
              <div className="grid md:grid-cols-2 gap-12 mb-12">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-indigo-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest font-mono text-slate-500">Replay Velocity</span>
                    </div>
                    <span className="text-[10px] font-black text-indigo-500 font-mono tracking-tighter bg-indigo-500/10 px-2 py-0.5 rounded-md">
                      {Math.round((2200 - replaySpeed) / 15)}X_REALTIME
                    </span>
                  </div>
                  <input
                    type="range"
                    min={700}
                    max={2200}
                    step={200}
                    value={replaySpeed}
                    onChange={(e) => setReplaySpeed(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Workflow className="w-3 h-3 text-orange-500" />
                       <span className="text-[9px] font-black uppercase tracking-widest font-mono text-slate-500">Sequence Scrub</span>
                    </div>
                     <span className="text-[10px] font-black text-orange-500 font-mono tracking-tighter bg-orange-500/10 px-2 py-0.5 rounded-md">
                       NODE::{replayIndex + 1} / {displaySnapshots.length}
                     </span>
                  </div>
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
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              </div>

              {/* STREAM::ENTITY_NODES */}
              <div className="space-y-6 max-h-[800px] overflow-y-auto pr-6 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {displaySnapshots.map((snapshot, idx) => {
                    const prev = displaySnapshots[idx - 1];
                    const isFocus = replayIndex === idx;
                    const shifts = [
                      { label: 'DOFD', val: snapshot.dofd, shift: prev?.dofd && snapshot.dofd && prev.dofd !== snapshot.dofd, color: 'text-rose-500' },
                      { label: 'Removal', val: snapshot.removal, shift: prev?.removal && snapshot.removal && prev.removal !== snapshot.removal, color: 'text-orange-500' },
                      { label: 'Liability', val: snapshot.value, shift: prev?.value && snapshot.value && prev.value !== snapshot.value, color: 'text-indigo-500' },
                      { label: 'Status', val: snapshot.status, shift: prev?.status && snapshot.status && prev.status !== snapshot.status, color: 'text-blue-500' }
                    ];

                    return (
                      <motion.div
                        key={snapshot.timestamp}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ 
                          opacity: isFocus ? 1 : 0.4, 
                          scale: isFocus ? 1 : 0.98, 
                          x: 0,
                          filter: isFocus ? 'blur(0px)' : 'blur(0.5px)'
                        }}
                        className={cn(
                          "p-8 rounded-[2.5rem] border transition-all duration-700",
                          isFocus 
                            ? "bg-slate-950 text-white border-indigo-500/50 shadow-3xl ring-1 ring-indigo-500/20"
                            : "bg-slate-50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800/40"
                        )}
                      >
                        <div className="flex items-center justify-between gap-4 mb-8">
                           <div className="flex items-center gap-4">
                              <span className={cn(
                                "w-10 h-10 rounded-xl border flex items-center justify-center text-[10px] font-black font-mono shadow-md",
                                isFocus ? "bg-indigo-500 border-indigo-400 text-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                              )}>
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <div>
                                <h5 className="text-lg font-black tracking-tight uppercase font-mono">{snapshot.label}</h5>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono mt-0.5">Stream_State::Verified</p>
                              </div>
                           </div>
                           {isFocus && (
                              <div className="flex items-center gap-3 px-4 py-1.5 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                                 <Activity className="w-3 h-3 text-indigo-400 animate-pulse" />
                                 <span className="text-[9px] font-black uppercase tracking-[0.2em] font-mono text-indigo-400">Processing_Payload</span>
                              </div>
                           )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                           {shifts.map(s => (
                              <div key={s.label} className="space-y-1">
                                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">{s.label}</p>
                                 <p className={cn(
                                   "text-[13px] font-black tabular-nums font-mono",
                                   s.shift ? s.color : isFocus ? "text-white" : "text-slate-600 dark:text-slate-400"
                                 )}>
                                   {s.val || '—'}
                                 </p>
                                 {s.shift && (
                                   <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest animate-pulse mt-1">
                                      <div className={cn("w-1 h-1 rounded-full", s.color.replace('text-', 'bg-'))} />
                                      <span className={cn("font-mono", s.color)}>DRIFT_DETECTED</span>
                                   </div>
                                 )}
                              </div>
                           ))}
                        </div>

                        {changeHighlights[snapshot.timestamp]?.length > 0 && isFocus && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 pt-8 border-t border-white/10 space-y-4"
                          >
                             <div className="flex items-center gap-2">
                               <Cpu className="w-3 h-3 text-slate-500" />
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Sequence Delta Metadata</p>
                             </div>
                             <div className="flex flex-wrap gap-4">
                                {changeHighlights[snapshot.timestamp].map((c, cIdx) => (
                                   <div key={cIdx} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-[1.2rem] flex items-center gap-4 shadow-sm">
                                      <span className="text-[10px] font-black text-slate-400 font-mono tracking-tighter uppercase">{c.field}</span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-slate-600 font-mono line-through opacity-50">{c.from || 'EMPTY'}</span>
                                        <ArrowRight className="w-3 h-3 text-indigo-500" />
                                        <span className="text-[10px] font-black text-indigo-400 font-mono">{c.to || 'NULL'}</span>
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

        {/* RIGHT_COLUMN::ANALYTICS */}
        <div className="lg:col-span-5 space-y-12">
           {/* METRICS::CONFIDENCE_SCORE */}
           <div className="relative p-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-[3rem] shadow-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-500" />
              
              <div className="flex items-start justify-between mb-10">
                <div className="space-y-2">
                   <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-xl font-black dark:text-white tracking-tighter uppercase font-mono">Dossier Integrity</h4>
                   </div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Forensic Confidence Rating</p>
                </div>
                <div className="text-right">
                  <span className="text-5xl font-black text-indigo-500 font-mono tabular-nums tracking-tighter">{confidenceScore}%</span>
                </div>
              </div>

              <div className="space-y-8">
                <div className="h-6 w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl overflow-hidden shadow-inner p-1.5 border border-slate-200/50 dark:border-slate-800">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${confidenceScore}%` }}
                    className="h-full bg-gradient-to-r from-orange-500 to-indigo-500 rounded-xl relative"
                   >
                     <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.1)_50%,rgba(255,255,255,.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress_1s_linear_infinite]" />
                   </motion.div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 space-y-2 group/stat">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Risk Status</p>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          readinessTag === 'court_ready' ? 'bg-emerald-500 animate-pulse' : readinessTag === 'review_ready' ? 'bg-orange-500 animate-pulse' : 'bg-rose-500 animate-pulse'
                        )} />
                        <p className={cn(
                          "text-xs font-black uppercase tracking-widest font-mono",
                          readinessTag === 'court_ready' ? 'text-emerald-500' : readinessTag === 'review_ready' ? 'text-orange-500' : 'text-rose-500'
                        )}>
                          {readinessTag.replace('_', ' ')}
                        </p>
                      </div>
                   </div>
                   <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Structural Variation</p>
                       <p className="text-xs font-black text-indigo-500 uppercase tracking-widest font-mono">DETECTED_DRIFT</p>
                   </div>
                </div>

                <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-5">
                   <div className="flex items-center gap-2">
                      <Boxes className="w-3 h-3 text-slate-400" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Anomaly Vector Distribution</p>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {typeBreakdown.map(item => (
                       <div key={item.key} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3">
                         <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest font-mono">{item.label}</span>
                         <span className="text-[10px] font-black text-indigo-500 font-mono">::{item.count}</span>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
           </div>

           {/* MONITOR::SLA_GUARD */}
           {slaWindows && (
             <div className="relative p-10 bg-slate-950 text-white rounded-[3rem] shadow-3xl overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-rose-500/10 opacity-50" />
               <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
               
               <div className="relative z-10">
                 <div className="flex items-center gap-5 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-xl shadow-orange-500/10">
                       <Clock className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black tracking-tighter uppercase font-mono">Timeline SLA Guard</h4>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono mt-1">Investigation Discovery Window</p>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="space-y-3">
                       <div className="flex justify-between items-end">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Current Status</p>
                             <p className={cn(
                               "text-xs font-black uppercase tracking-widest font-mono",
                               slaStatus?.status === 'breach' ? 'text-rose-500' : slaStatus?.status === 'warning' ? 'text-orange-500' : 'text-emerald-500'
                             )}>
                               {slaStatus?.status === 'breach' ? 'PROTOCOL_BREACH' : 'PROTOCOL_COMPLIANCE'}
                             </p>
                          </div>
                          <span className="text-[10px] font-black text-slate-500 font-mono">
                            {Math.round(Math.max(0, 100 - ((slaStatus?.daysTo30 || 0) / 30 * 100)))}%_EXP_THRESHOLD
                          </span>
                       </div>
                       <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, 100 - ((slaStatus?.daysTo30 || 0) / 30 * 100))}%` }}
                            className={cn(
                              "h-full rounded-full shadow-2xl",
                              slaStatus?.status === 'breach' ? 'bg-rose-500 shadow-rose-500/40' : 'bg-emerald-500 shadow-emerald-500/40'
                            )}
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-5 rounded-[1.8rem] bg-white/5 border border-white/10 space-y-1">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">30D Discovery</p>
                          <div className="flex items-center justify-between">
                             <span className="text-lg font-black font-mono tabular-nums">{slaStatus?.daysTo30}D</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
                          </div>
                       </div>
                       <div className="p-5 rounded-[1.8rem] bg-white/5 border border-white/10 space-y-1">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">45D Statutory</p>
                          <div className="flex items-center justify-between">
                             <span className="text-lg font-black font-mono tabular-nums">{slaStatus?.daysTo45}D</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
                          </div>
                       </div>
                    </div>
                    
                    <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] font-mono">Sequence Start</p>
                          <p className="text-xs font-black font-mono tracking-tighter">{slaWindows.reportedDate.toLocaleDateString('en-US')}</p>
                       </div>
                       <div className="h-8 w-px bg-white/5" />
                       <div className="text-right space-y-1">
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] font-mono">SLA Termination</p>
                          <p className="text-xs font-black font-mono tracking-tighter text-orange-400">{slaWindows.day30.toLocaleDateString('en-US')}</p>
                       </div>
                    </div>
                 </div>
               </div>
             </div>
           )}

           {/* PROTOCOL::DECISION_HUB */}
           <div className="relative p-12 bg-indigo-600 text-white rounded-[3rem] shadow-4xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="relative z-10 space-y-10">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <ShieldCheck className="w-6 h-6" />
                       <h4 className="text-2xl font-black tracking-tighter uppercase font-mono italic">Decision Protocol</h4>
                    </div>
                    <p className="text-indigo-100 text-base font-medium leading-relaxed">
                       {readinessTag === 'court_ready'
                         ? 'Forensic reconstruction is complete. Institutional patterns verified. Proceed to federal escalation or litigation bundle.'
                         : 'Reconstruction incomplete. Additional sequence metadata required to bypass institutional defenses.'}
                    </p>
                 </div>
                 
                 <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 4, tab: 'timeline' } }))}
                      className="w-full py-5 px-8 rounded-2xl bg-white text-indigo-600 font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all shadow-xl flex items-center justify-between group"
                    >
                      Audit Temporal Map
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 4, tab: 'discovery' } }))}
                      className="w-full py-5 px-8 rounded-2xl bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] border border-white/20 hover:bg-indigo-400 transition-all flex items-center justify-between group"
                    >
                      Catalogue Evidence
                      <Boxes className="w-5 h-5 opacity-50" />
                    </motion.button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* FEED::SEQUENCE_LOG */}
      <div className="space-y-12 mt-24">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-12">
           <div className="space-y-2">
              <h3 className="text-4xl font-black dark:text-white tracking-tighter uppercase font-mono italic">Sequence <span className="text-slate-500">Log</span></h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Institutional Liability Deltas</p>
           </div>
           
           <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-inner">
             {(['all', 'negative', 'positive', 'neutral'] as const).map(level => (
               <button
                 key={level}
                 onClick={() => setImpactFilter(level)}
                 className={cn(
                   "px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                   impactFilter === level 
                     ? "bg-slate-950 text-white shadow-2xl scale-105" 
                     : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                 )}
               >
                 {level} <span className="text-[9px] opacity-40 ml-2">[{level === 'all' ? deltas.length : impactCounts[level]}]</span>
               </button>
             ))}
           </div>
        </div>

        <div className="grid gap-8">
          <AnimatePresence mode="popLayout">
            {sortedDeltas.map((delta, i) => {
              const impactConfig = {
                negative: { color: 'border-rose-500/30 bg-rose-50/10 dark:bg-rose-950/20', icon: <AlertTriangle className="w-10 h-10 text-rose-500" />, label: 'RISK_INCREASE', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
                positive: { color: 'border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/20', icon: <CheckCircle className="w-10 h-10 text-emerald-500" />, label: 'LIABILITY_DECREASE', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
                neutral: { color: 'border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/30', icon: <Eye className="w-10 h-10 text-slate-400" />, label: 'STRUCTURAL_CHANGE', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700' }
              }[delta.impact || 'neutral'];

              return (
                <motion.div
                  key={delta.field + i}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "relative p-12 rounded-[3.5rem] border-2 shadow-sm transition-all hover:shadow-4xl hover:scale-[1.01] group overflow-hidden",
                    impactConfig.color
                  )}
                >
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] transition-transform group-hover:scale-125">
                     <Hash className="w-48 h-48" />
                  </div>

                  <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                    <div className={cn(
                      "w-24 h-24 rounded-[2.5rem] flex items-center justify-center shrink-0 border-2 shadow-2xl transition-transform group-hover:rotate-12",
                      impactConfig.badge
                    )}>
                      {impactConfig.icon}
                    </div>

                    <div className="flex-1 space-y-8 w-full">
                      <div className="flex flex-wrap items-center gap-6">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-[0.4em] px-5 py-2 rounded-full border shadow-sm font-mono",
                          impactConfig.badge
                        )}>
                          {impactConfig.label}
                        </span>
                        <h4 className="text-3xl font-black dark:text-white tracking-tighter uppercase font-mono italic">{delta.field}</h4>
                      </div>

                      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-8 items-center">
                        <div className="space-y-3">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Sequence Prior</p>
                           <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 rounded-[1.8rem] border border-slate-200 dark:border-slate-800 shadow-inner group/val">
                              <code className="text-sm font-black text-slate-400 font-mono line-through opacity-40 tracking-tighter block truncate">{delta.oldValue || 'UNDEFINED'}</code>
                           </div>
                        </div>
                        
                        <div className="hidden xl:flex justify-center">
                           <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <ArrowRight className="w-5 h-5 text-indigo-500" />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Sequence Resolution</p>
                           <div className={cn(
                             "px-6 py-4 rounded-[1.8rem] border shadow-2xl transition-all group-hover:shadow-indigo-500/10",
                             impactConfig.badge.split(' ')[0],
                             "bg-white dark:bg-slate-950"
                           )}>
                              <code className={cn(
                                "text-sm font-black font-mono tracking-tighter block truncate",
                                delta.impact === 'negative' ? 'text-rose-500' : delta.impact === 'positive' ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-300'
                              )}>
                                {delta.newValue || 'NULL'}
                              </code>
                           </div>
                        </div>

                        <div className="hidden xl:block text-right">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">DRIFT_ID</p>
                           <p className="text-[10px] font-bold text-slate-500 font-mono uppercase">#{delta.field.slice(0, 3)}_{i+1000}</p>
                        </div>
                      </div>

                      <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-4xl">
                        {delta.description}
                      </p>
                    </div>
                    
                    <motion.button 
                      whileHover={{ scale: 1.1, x: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => window.dispatchEvent(new CustomEvent('cra:focus-field', { detail: { field: delta.field.toLowerCase() } }))}
                      className="p-6 rounded-[2.5rem] bg-slate-950 text-white shadow-4xl border border-white/10 shrink-0"
                    >
                       <Eye className="w-6 h-6" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DeltasTab;
