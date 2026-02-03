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
  GitBranch,
  ShieldAlert
} from 'lucide-react';
import { cn, maskSensitiveInText } from '../../../lib/utils';
import { DeltaResult, SeriesInsight, SeriesSnapshot, exportComparisonDossier, computeExpectedRemovalDate, exportComparisonCsv } from '../../../lib/delta';
import { exportComparisonDossierPdf } from '../../../lib/dossier-pdf';
import { useApp } from '../../../context/AppContext';

interface DeltasTabProps {
  deltas: DeltaResult[];
  seriesInsights?: SeriesInsight[];
  seriesSnapshots?: SeriesSnapshot[];
  evidenceReadiness?: number;
}

const DeltasTab: React.FC<DeltasTabProps> = ({ deltas, seriesInsights = [], seriesSnapshots = [], evidenceReadiness = 0 }) => {
  const { state: { isPrivacyMode } } = useApp();
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
      <div className="flex flex-col items-center justify-center p-32 text-center bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 text-slate-300 mx-auto group-hover:scale-110 transition-transform duration-500">
            <History className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Historical Drift Analysis</h3>
          <p className="text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
            To use Delta Analysis, load a previous snapshot from history. This enables comparative forensics and tracks how the record evolves over time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="contents">
    <div className="fade-in space-y-12 pb-32">
      {/* INSTITUTIONAL_DRIFT_HERO */}
      <section className="relative">
        <div className="relative bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/40 p-12">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[100px] -mr-64 -mt-64" />
          
          <div className="relative z-10 grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-12 xl:col-span-7">
               <div className="flex items-center gap-4 mb-8">
                  <div className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full flex items-center gap-2">
                      <Zap size={13} className="text-blue-600" />
                      <span className="text-[11px] uppercase font-bold tracking-wider text-blue-700">Drift Reconstruction v5.4</span>
                  </div>
                  <div className="h-px w-8 bg-slate-200" />
                  <span className="text-[11px] uppercase font-semibold tracking-wider text-slate-400">Analysis Verified</span>
              </div>

              <h2 className="text-6xl xl:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-[0.9]">
                  Comparative <br/>
                  <span className="text-blue-600">Forensics</span>
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-10 max-w-2xl font-medium border-l-3 border-blue-100 pl-8">
                  Structural variance analysis across <span className="text-slate-900 font-bold">{seriesSnapshots.length} Secured Snapshots</span>. Identifying unauthorized metadata shifts and illegal re-aging vectors within the record lifecycle.
              </p>
              
              <div className="flex flex-wrap items-center gap-6">
                <button 
                   onClick={() => exportComparisonDossierPdf(deltas, seriesInsights, seriesSnapshots)}
                   className="group flex items-center gap-4 px-8 py-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                >
                   <span className="font-bold text-sm tracking-tight">Export Delta Dossier</span>
                   <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                </button>
                
                <div className="flex items-center gap-10 bg-slate-50 px-8 py-4 rounded-2xl border border-slate-200">
                   <div>
                       <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">Confidence</p>
                       <p className="text-2xl font-bold text-slate-900 tracking-tight">{confidenceScore}%</p>
                   </div>
                   <div className="h-8 w-px bg-slate-200" />
                   <div>
                       <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">Readiness</p>
                       <p className="text-lg font-bold text-slate-700 tracking-tight">{(evidenceReadiness >= 75 ? 'Optimal' : evidenceReadiness >= 50 ? 'Stable' : 'Incomplete')}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-5 relative">
                 <div className="relative bg-slate-50 border border-slate-200 p-10 rounded-[2.5rem] shadow-inner min-h-[300px] flex flex-col justify-center overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 text-slate-200/50">
                        <Activity size={100} strokeWidth={1} />
                     </div>
                     <div className="space-y-8 relative z-10">
                         <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Detected Drift Nodes</h4>
                            <div className="flex gap-1">
                               <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                               <div className="w-1 h-1 rounded-full bg-blue-300 animate-pulse delay-75" />
                               <div className="w-1 h-1 rounded-full bg-blue-200 animate-pulse delay-150" />
                            </div>
                         </div>
                         <div className="flex items-baseline gap-3">
                            <span className="text-8xl font-bold text-slate-900 tracking-tighter leading-none">{deltas.length}</span>
                            <span className="text-2xl font-bold text-slate-400 tracking-tight">DATA POINTS</span>
                         </div>
                         <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (deltas.length / 50) * 100)}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="h-full bg-blue-600 rounded-full"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-8 pt-2">
                            <div className="space-y-1">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Negative Drift</span>
                               <p className="text-3xl font-bold text-slate-900 tracking-tight">{negativeCount}</p>
                            </div>
                            <div className="space-y-1 text-right">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Structural Fixes</span>
                               <p className="text-3xl font-bold text-slate-900 tracking-tight">{positiveCount}</p>
                            </div>
                         </div>
                     </div>
                 </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* INSIGHT_SEQUENCER */}
        <div className="lg:col-span-8 space-y-12">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                   <Target size={24} />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Strategic Vectors</h4>
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Anomaly Detection Engine</p>
                </div>
             </div>
             
             <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                {['all', 'high', 'medium', 'low'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSeverityFilter(tier as any)}
                    className={cn(
                      "px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                      severityFilter === tier ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {tier}
                  </button>
                ))}
             </div>
          </div>

          <div className="grid gap-8">
            <AnimatePresence mode="popLayout">
              {filteredInsights.map((insight, i) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="group relative"
                >
                  <div className="relative bg-white border border-slate-200 border-b-4 border-b-slate-300 rounded-[2.5rem] p-10 transition-all hover:translate-y-[-2px] hover:border-b-blue-500 flex flex-col shadow-lg shadow-slate-200/30 overflow-hidden min-h-[400px]">
                    <div className="absolute top-0 right-0 p-10 text-slate-50 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000 grayscale">
                       <Radiation size={150} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between mb-8">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm font-bold text-xs",
                          insight.severity === 'high' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-blue-50 text-blue-600 border-blue-100"
                        )}>
                          {insight.type.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Vector Analysis</span>
                           <h5 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                              {maskSensitiveInText(insight.title, isPrivacyMode)}
                           </h5>
                        </div>
                      </div>
                      <div className={cn(
                        "px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                        insight.severity === 'high' ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-blue-50 border-blue-100 text-blue-600"
                      )}>
                         {insight.severity} Severity
                      </div>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-between pt-8 border-t border-slate-100">
                        <p className="text-xl text-slate-600 font-medium leading-relaxed mb-10 max-w-2xl">
                           {maskSensitiveInText(insight.summary, isPrivacyMode)}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                           <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Impact Shift</span>
                              <div className="flex items-center gap-2">
                                 <TrendingUp size={16} className="text-emerald-500" />
                                 <span className="text-xl font-bold text-slate-900 tracking-tight">+{insightScore(insight)}%</span>
                              </div>
                           </div>
                           <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                 <span className="text-xl font-bold text-slate-900 tracking-tight">Active</span>
                              </div>
                           </div>
                           <div className="hidden md:flex items-center justify-end">
                              <button 
                                className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 uppercase tracking-wider transition-all"
                              >
                                 View Details
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
        <div className="lg:col-span-4 space-y-12">
          <div className="sticky top-12 space-y-8">
            {/* RECORD_EVOLUTION_PLAYBACK */}
            <div className="relative group">
               <div className="relative p-10 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 p-10 text-slate-50 pointer-events-none">
                    <History size={100} strokeWidth={1} />
                  </div>

                  <div className="relative z-10 space-y-10 flex-1 flex flex-col">
                    <div className="flex items-center justify-between">
                       <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm group-hover:scale-105 transition-transform">
                          <GitBranch size={24} />
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sequence ID</span>
                          <span className="text-xl font-bold text-slate-900 tracking-tight">Timeline Evolution</span>
                       </div>
                    </div>

                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200 space-y-8 flex-1 flex flex-col justify-between">
                       <div className="space-y-6">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Playback Monitor</span>
                             </div>
                             <span className="text-[11px] font-bold text-slate-400">{replayIndex + 1} / {displaySnapshots.length}</span>
                          </div>
                          
                          <div className="space-y-5">
                             <div className="flex items-baseline justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Timestamp</span>
                                <span className="text-lg font-bold text-slate-900 tracking-tight">
                                   {maskSensitiveInText(String(displaySnapshots[replayIndex]?.timestamp || ''), isPrivacyMode)}
                                </span>
                             </div>
                             <div className="h-px w-full bg-slate-200" />
                             <div className="flex items-baseline justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Reported</span>
                                <span className="text-lg font-bold text-slate-900 tracking-tight">
                                   {maskSensitiveInText(displaySnapshots[replayIndex]?.reported || '---', isPrivacyMode)}
                                </span>
                             </div>
                             <div className="h-px w-full bg-slate-200" />
                             <div className="flex items-baseline justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Status</span>
                                <span className="text-lg font-bold text-slate-600 tracking-tight">
                                   {maskSensitiveInText(displaySnapshots[replayIndex]?.status || 'No Data', isPrivacyMode)}
                                </span>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-8">
                          <div className="flex items-center justify-center gap-6">
                             <button 
                               onClick={() => setReplayPlaying(!replayPlaying)}
                               className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                             >
                                {replayPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                             </button>
                             <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div 
                                  animate={{ width: `${((replayIndex + 1) / displaySnapshots.length) * 100}%` }}
                                  className="h-full bg-blue-600"
                                />
                             </div>
                          </div>
                          
                          <button 
                             onClick={() => setDrawerOpen(true)}
                             className="w-full bg-white border border-slate-200 p-6 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-all shadow-sm group/btn"
                           >
                             <div className="text-left">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Navigation</span>
                                <span className="text-lg font-bold text-slate-900 tracking-tight">Inspect Full Matrix</span>
                             </div>
                             <ArrowRight size={24} className="text-slate-400 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* STRATEGIC_TRAJECTORY_STATS */}
            <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white border border-slate-800 relative overflow-hidden shadow-xl group/stats">
                <div className="relative z-10 flex items-center gap-8">
                   <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                      <Hash size={24} className="text-blue-400" />
                   </div>
                   <div className="space-y-1 flex-grow">
                      <h5 className="text-lg font-bold tracking-tight">System Convergence</h5>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-[200px]">
                         Verified <span className="text-white">{deltas.length} Drift Nodes</span> indicating systemic activity.
                      </p>
                   </div>
                   <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">CRC</span>
                      <span className="text-lg font-bold text-emerald-400">VALID</span>
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
