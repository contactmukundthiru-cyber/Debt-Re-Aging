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
  Hash,
  GitBranch
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

  const latestSnapshot = seriesSnapshots[seriesSnapshots.length - 1];
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

  if (deltas.length === 0 && seriesInsights.length === 0 && seriesSnapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-32 text-center bg-slate-950/40 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-transparent to-slate-500/5 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-center mb-10 text-slate-500 shadow-inner mx-auto group-hover:scale-110 transition-transform">
            <History className="w-10 h-10 animate-pulse" />
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 font-mono italic">No Delta Series</h3>
          <p className="text-slate-500 max-w-sm mx-auto font-medium leading-relaxed italic uppercase tracking-tight text-sm">
            To use Delta Analysis, load a previous analysis snapshot from history. This enables comparative forensics across the record evolution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="contents">
    <div className="fade-in space-y-20 pb-32">
      {/* ELITE_DELTA_HERO::FORENSIC_VECTOR_V5 */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-br from-slate-600/20 via-slate-500/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
          
          <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-12 xl:col-span-7">
               <div className="flex items-center gap-6 mb-12">
                  <div className="px-5 py-2 bg-slate-500/10 border border-slate-500/20 rounded-full flex items-center gap-3">
                      <Zap size={14} className="text-slate-400 animate-pulse" />
                      <span className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-400 font-mono">Delta Reconstruction v5.0</span>
                  </div>
                  <div className="h-px w-10 bg-slate-800" />
                  <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Status: Vector_Analyzed</span>
              </div>

              <h2 className="text-7xl xl:text-[7rem] font-black text-white tracking-tighter mb-10 leading-[0.85] italic uppercase font-mono">
                  Forensic <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-white to-slate-400 tracking-[-0.05em]">RECON</span>
              </h2>
              <p className="text-slate-400 text-lg xl:text-xl leading-relaxed mb-12 max-w-2xl font-medium italic border-l-2 border-slate-500/30 pl-8">
                  Structural variance analysis across <span className="text-white font-mono font-bold">{seriesSnapshots.length} SECURED SNAPSHOTS</span>. Detecting unauthorized metadata shifts and illegal re-aging vectors within the institutional ecosystem.
              </p>
              
              <div className="flex flex-wrap items-center gap-8">
                <button 
                   onClick={() => exportComparisonDossierPdf(deltas, seriesInsights, seriesSnapshots)}
                   title="Export Delta Dossier as PDF"
                   aria-label="Export Delta Dossier"
                   className="relative group/btn overflow-hidden rounded-[2rem] p-px bg-gradient-to-br from-slate-500 via-slate-600 to-slate-400"
                >
                   <div className="relative flex items-center gap-6 px-10 py-5 rounded-[1.9rem] bg-slate-950 group-hover/btn:bg-transparent transition-all duration-700 text-white cursor-pointer">
                      <span className="font-black uppercase tracking-widest text-sm font-mono italic">Export_Delta_Dossier</span>
                      <Download size={20} className="group-hover/btn:-translate-y-1 transition-transform duration-700" />
                   </div>
                </button>
                
                <div className="flex items-center gap-12 bg-black/40 px-10 py-5 rounded-[2rem] border border-white/5">
                   <div className="group/stat">
                       <p className="text-[9px] uppercase text-slate-500 font-black tracking-[0.5em] font-mono mb-2">Confidence_Score</p>
                       <p className="text-3xl font-black text-white font-mono tracking-tighter uppercase italic">{confidenceScore}%</p>
                   </div>
                   <div className="h-8 w-px bg-slate-800" />
                   <div className="group/stat">
                       <p className="text-[9px] uppercase text-slate-500 font-black tracking-[0.5em] font-mono mb-2">Readiness_Tier</p>
                       <p className="text-xl font-black text-slate-400 font-mono tracking-tighter italic uppercase">{(evidenceReadiness >= 75 ? 'HIGH' : evidenceReadiness >= 50 ? 'MEDIUM' : 'LOW').replace('_', ' ')}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-5 relative group/telemetry">
                 <div className="absolute -inset-0.5 bg-gradient-to-br from-slate-500/20 to-transparent rounded-[3rem] blur-sm opacity-50 group-hover/telemetry:opacity-100 transition-all" />
                 <div className="relative bg-slate-900/20 border border-white/10 p-12 rounded-[3.5rem] backdrop-blur-3xl shadow-inner min-h-[340px] flex flex-col justify-center overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-[4] rotate-12">
                        <Cpu size={120} />
                     </div>
                     <div className="space-y-10 relative z-10">
                         <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono italic">Drift_Nodes_Detected</h4>
                            <Activity size={16} className="text-slate-400 animate-pulse" />
                         </div>
                         <div className="flex items-baseline gap-4">
                            <span className="text-9xl font-black text-white font-mono tracking-tighter leading-none">{deltas.length}</span>
                            <span className="text-3xl font-black text-slate-600 font-mono">NODES</span>
                         </div>
                         <div className="h-4 w-full bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(deltas.length / 50) * 100}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="h-full bg-gradient-to-r from-slate-500 via-slate-400 to-slate-300 shadow-[0_0_20px_rgba(100,116,139,0.5)]"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="space-y-1">
                               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Negative_Drift</span>
                               <p className="text-3xl font-black text-slate-400 font-mono tracking-tighter">{negativeCount}</p>
                            </div>
                            <div className="space-y-1 text-right">
                               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Structural_Fixes</span>
                               <p className="text-3xl font-black text-slate-400 font-mono tracking-tighter">{positiveCount}</p>
                            </div>
                         </div>
                     </div>
                 </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-16">
        {/* INSIGHT_SEQUENCER */}
        <div className="lg:col-span-8 space-y-16">
          <div className="flex items-center justify-between px-4">
             <div className="flex items-center gap-8">
                <div className="w-16 h-16 rounded-[2rem] bg-slate-500/10 text-slate-400 flex items-center justify-center border border-slate-500/20 shadow-2xl">
                   <Target size={28} />
                </div>
                <div>
                  <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">Strategic Vectors</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold mt-1">High-Severity Anomaly Detection</p>
                </div>
             </div>
             
             <div className="flex items-center gap-4 bg-black/40 p-2 rounded-full border border-white/5">
                {['all', 'high', 'medium', 'low'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSeverityFilter(tier as any)}
                    title={`Filter by ${tier} severity`}
                    aria-label={`Filter by ${tier} severity`}
                    className={cn(
                      "px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest font-mono transition-all",
                      severityFilter === tier ? "bg-slate-500 text-white shadow-lg shadow-slate-500/20" : "text-slate-500 hover:text-white"
                    )}
                  >
                    {tier}
                  </button>
                ))}
             </div>
          </div>

          <div className="grid gap-10">
            <AnimatePresence mode="popLayout">
              {filteredInsights.map((insight, i) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  className="group relative"
                >
                  <div className="absolute -inset-px bg-gradient-to-br from-slate-500/20 to-transparent rounded-[3.5rem] opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                  <div className="relative bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 transition-all duration-700 flex flex-col shadow-2xl overflow-hidden min-h-[500px]">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none select-none group-hover:scale-110 transition-transform duration-1000 grayscale">
                       <Radiation size={150} />
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between mb-12">
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl font-mono font-black text-xs italic",
                          insight.severity === 'high' ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}>
                          {insight.type.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono italic">Vector_Analysis::{insight.type}</span>
                           <h5 className="text-4xl font-black text-white italic tracking-tighter group-hover:text-slate-400 transition-colors uppercase font-mono leading-none">{insight.title}</h5>
                        </div>
                      </div>
                      <div className={cn(
                        "px-6 py-2 rounded-full border flex items-center gap-3",
                        insight.severity === 'high' ? "bg-slate-500/10 border-slate-500/20 text-slate-400" : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                      )}>
                         <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                         <span className="text-[9px] font-black uppercase tracking-widest font-mono italic">{insight.severity}_Severity</span>
                      </div>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-between pt-10 border-t border-white/5">
                        <p className="text-2xl text-slate-400 font-medium italic leading-relaxed mb-12 max-w-2xl pr-10">
                           {insight.summary}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                           <div className="space-y-2">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Impact_Shift</span>
                              <div className="flex items-center gap-3">
                                 <TrendingUp size={16} className="text-slate-400" />
                                 <span className="text-xl font-black text-white font-mono tracking-tighter italic">+{insightScore(insight)}%</span>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Temporal_Delta</span>
                              <div className="flex items-center gap-3">
                                 <Clock size={16} className="text-slate-500" />
                                 <span className="text-xl font-black text-white font-mono tracking-tighter italic">ACTIVE</span>
                              </div>
                           </div>
                           <div className="col-span-2 hidden md:flex items-center justify-end gap-6">
                              <button 
                                title="View Field Mappings"
                                aria-label="View Field Mappings"
                                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-[0.3em] font-mono italic transition-all"
                              >
                                 View_Mappings
                              </button>
                           </div>
                        </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* HUD_CONTROL_PANEL */}
        <div className="lg:col-span-4 space-y-16">
          <div className="space-y-4 px-4 text-right">
            <h4 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">Process_Matrix</h4>
            <p className="text-[12px] text-slate-500 uppercase tracking-[0.4em] font-black font-mono">Realtime_Sequence_HUD</p>
          </div>

          <div className="sticky top-12 space-y-12">
            {/* RECORD_EVOLUTION_PLAYBACK */}
            <div className="relative group/evolution">
               <div className="absolute -inset-1 bg-gradient-to-b from-slate-500/20 to-transparent rounded-[4rem] blur-xl opacity-30 group-hover/evolution:opacity-60 transition duration-700" />
               <div className="relative p-12 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-[3] -rotate-12">
                    <History size={120} />
                  </div>

                  <div className="relative z-10 space-y-12 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                       <div className="w-16 h-16 rounded-3xl bg-slate-500/10 flex items-center justify-center text-slate-400 border border-slate-500/20 shadow-2xl group-hover/evolution:scale-110 transition-transform">
                          <GitBranch size={32} />
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono block mb-1">Sequence_ID</span>
                          <span className="text-2xl font-black text-white font-mono tracking-tighter italic uppercase">Evolution</span>
                       </div>
                    </div>

                    <div className="bg-black/40 rounded-[3rem] p-10 border border-white/5 space-y-10 flex-1 flex flex-col justify-between group/monitor">
                       <div className="space-y-8">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <span className="w-3 h-3 rounded-full bg-slate-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Playback_Monitor</span>
                             </div>
                             <span className="text-[10px] font-black text-slate-400 font-mono italic">{replayIndex + 1}/{displaySnapshots.length}</span>
                          </div>
                          
                          <div className="space-y-6">
                             <div className="flex items-baseline justify-between">
                                <span className="text-sm font-black text-slate-700 uppercase italic font-mono">Timestamp</span>
                                <span className="text-xl font-black text-white font-mono italic">{displaySnapshots[replayIndex]?.timestamp}</span>
                             </div>
                             <div className="h-px w-full bg-white/5" />
                             <div className="flex items-baseline justify-between">
                                <span className="text-sm font-black text-slate-700 uppercase italic font-mono">Reported</span>
                                <span className="text-xl font-black text-white font-mono italic">{displaySnapshots[replayIndex]?.reported || '---'}</span>
                             </div>
                             <div className="h-px w-full bg-white/5" />
                             <div className="flex items-baseline justify-between">
                                <span className="text-sm font-black text-slate-700 uppercase italic font-mono">Status_Key</span>
                                <span className="text-xl font-black text-slate-400 font-mono italic">{displaySnapshots[replayIndex]?.status || 'NO_DATA'}</span>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-10">
                          <div className="flex items-center justify-center gap-8">
                             <button 
                               onClick={() => setReplayPlaying(!replayPlaying)}
                               title={replayPlaying ? "Pause Playback" : "Start Playback"}
                               aria-label={replayPlaying ? "Pause Playback" : "Start Playback"}
                               className="w-20 h-20 rounded-full bg-slate-500 text-white flex items-center justify-center shadow-4xl transform hover:scale-110 active:scale-95 transition-all"
                             >
                                {replayPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
                             </button>
                             <div className="flex-1 h-3 bg-black rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                  animate={{ width: `${((replayIndex + 1) / displaySnapshots.length) * 100}%` }}
                                  className="h-full bg-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.5)]"
                                />
                             </div>
                          </div>
                          
                          <div className="p-px rounded-[2rem] bg-gradient-to-br from-slate-500 to-slate-600 group/btn shadow-4xl cursor-pointer overflow-hidden transition-all hover:scale-[1.02]">
                             <div 
                                onClick={() => setDrawerOpen(true)}
                                className="bg-slate-950 p-8 rounded-[1.9rem] flex items-center justify-between group-hover/btn:bg-transparent transition-all"
                              >
                                <div className="text-left">
                                   <span className="text-[10px] font-black text-white/50 uppercase tracking-widest block mb-1">Full_Matrix</span>
                                   <span className="text-2xl font-black text-white font-mono italic uppercase tracking-tighter leading-none">Inspect_Nodes</span>
                                </div>
                                <ArrowRight size={32} className="text-white group-hover/btn:translate-x-2 transition-transform duration-500" />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* STRATEGIC_TRAJECTORY_STATS */}
            <div className="p-12 rounded-[4rem] bg-gradient-to-br from-slate-900 to-black border border-white/5 relative overflow-hidden shadow-2xl group/stats">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <div className="relative z-10 flex items-center gap-10">
                   <div className="w-20 h-20 bg-slate-500/5 rounded-full flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-700">
                      <Hash size={32} className="text-slate-400 animate-pulse" />
                   </div>
                   <div className="space-y-2 flex-grow">
                      <h5 className="text-2xl font-black text-white italic uppercase tracking-tight">System_Convergence</h5>
                      <p className="text-sm text-slate-500 font-medium italic max-w-lg leading-relaxed uppercase tracking-tight pr-10">
                         Verification of <span className="text-slate-400">{deltas.length} DRIFT_NODES</span> suggests systemic <span className="text-white font-bold">RE-AGING</span> across the series.
                      </p>
                   </div>
                   <div className="text-right shrink-0">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest font-mono italic block mb-1">CRC_CHECK</span>
                      <span className="text-xl font-black text-white font-mono tracking-tighter italic">VALID</span>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default DeltasTab;
