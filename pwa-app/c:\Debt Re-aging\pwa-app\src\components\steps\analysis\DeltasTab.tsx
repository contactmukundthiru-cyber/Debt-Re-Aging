'use client';

import React, { useMemo } from 'react';
import { DeltaResult, SeriesInsight, SeriesSnapshot, exportComparisonDossier } from '../../../lib/delta';
import { exportComparisonDossierPdf } from '../../../lib/dossier-pdf';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRightLeft, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  FileSearch, 
  Download,
  Filter,
  Activity,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatDate } from '../../../lib/i18n';

interface DeltasTabProps {
  deltas: DeltaResult[];
  seriesInsights?: SeriesInsight[];
  seriesSnapshots?: SeriesSnapshot[];
  evidenceReadiness?: number;
}

const DeltasTab: React.FC<DeltasTabProps> = ({ deltas, seriesInsights = [], seriesSnapshots = [], evidenceReadiness = 0 }) => {
  const [activeInsightId, setActiveInsightId] = React.useState<string | null>(null);
  const [replayIndex, setReplayIndex] = React.useState(0);
  const [replayPlaying, setReplayPlaying] = React.useState(false);
  const [impactFilter, setImpactFilter] = React.useState<'all' | 'negative' | 'positive' | 'neutral'>('all');
  
  const activeInsight = seriesInsights.find(insight => insight.id === activeInsightId);

  const filteredDeltas = useMemo(() => {
    if (impactFilter === 'all') return deltas;
    return deltas.filter(d => d.impact === impactFilter);
  }, [deltas, impactFilter]);

  const stats = useMemo(() => ({
    high: seriesInsights.filter(i => i.severity === 'high').length,
    medium: seriesInsights.filter(i => i.severity === 'medium').length,
    low: seriesInsights.filter(i => i.severity === 'low').length,
    totalDeltas: deltas.length
  }), [seriesInsights, deltas]);

  const confidenceScore = Math.min(100, Math.round((stats.high * 15 + stats.medium * 8 + (evidenceReadiness || 0) * 0.4)));

  const currentSnapshot = seriesSnapshots[replayIndex] || (seriesSnapshots.length > 0 ? seriesSnapshots[0] : null);
  const totalSnapshots = seriesSnapshots.length;

  React.useEffect(() => {
    if (!replayPlaying || totalSnapshots === 0) return;
    const timer = setInterval(() => {
      setReplayIndex(prev => (prev + 1) % totalSnapshots);
    }, 1500);
    return () => clearInterval(timer);
  }, [replayPlaying, totalSnapshots]);

  if (deltas.length === 0 && seriesInsights.length === 0 && seriesSnapshots.length === 0) {
    return (
      <div className="p-20 text-center bg-slate-50 dark:bg-slate-900/40 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800">
        <ArrowRightLeft className="w-16 h-16 mx-auto mb-6 text-slate-300 dark:text-slate-700" />
        <h3 className="text-xl font-bold dark:text-white mb-2">Comparative Forensics Offline</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">No longitudinal data found. Differential analysis requires multiple account snapshots for re-aging detection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Top Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-slate-950 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Activity size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-orange-500/30">
                Differential Engine
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/30">
                {seriesSnapshots.length} Snapshots
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Forensic Deltas</h1>
            <p className="text-slate-400 text-lg max-w-xl">Longitudinal tracking of account metadata across bureau report iterations to identify latent re-aging.</p>
            
            <div className="flex items-center gap-12 mt-10">
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-widest">Impact Confidence</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-white">{confidenceScore}</span>
                  <span className="text-slate-500 font-bold mb-1 text-sm">/ 100</span>
                </div>
              </div>
              <div className="h-12 w-px bg-slate-800" />
              <div className="flex gap-6">
                <div>
                  <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Critical</p>
                  <p className="text-2xl font-bold text-rose-500">{stats.high}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Warning</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.medium}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col"
        >
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-6">Execution Suite</p>
          <div className="space-y-4 flex-1">
            <button 
              onClick={() => exportComparisonDossierPdf(deltas, seriesInsights, seriesSnapshots, evidenceReadiness)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-slate-950 text-white p-2 rounded-xl group-hover:scale-110 transition-transform">
                  <Download size={16} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold dark:text-white">Export Dossier</p>
                  <p className="text-[10px] text-slate-500">Full investigative brief</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
            
            <button className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 text-white p-2 rounded-xl group-hover:scale-110 transition-transform">
                  <ShieldCheck size={16} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold dark:text-white">Evidence Lock</p>
                  <p className="text-[10px] text-slate-500">Validate snapshots</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Liability Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <p className="text-xs font-medium dark:text-slate-300">Active Non-Compliance Detected</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Replay Interface */}
      {seriesSnapshots.length > 0 && currentSnapshot && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <Zap className="text-orange-500" size={20} />
                Timeline Reconstruction
              </h3>
              <p className="text-xs text-slate-500">Visualizing account metadata shifts through historical snapshots.</p>
            </div>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-full gap-2">
              <button 
                onClick={() => setReplayIndex(prev => Math.max(0, prev - 1))}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-shadow shadow-sm disabled:opacity-30"
                disabled={replayIndex === 0}
              >
                <ChevronLeft size={16} className="dark:text-white" />
              </button>
              <button 
                onClick={() => setReplayPlaying(!replayPlaying)}
                className="w-10 h-10 flex items-center justify-center bg-slate-950 text-white rounded-full hover:scale-105 transition-transform"
              >
                {replayPlaying ? <Pause size={16} /> : <Play size={16} className="ml-1" />}
              </button>
              <button 
                onClick={() => setReplayIndex(prev => Math.min(totalSnapshots - 1, prev + 1))}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-shadow shadow-sm disabled:opacity-30"
                disabled={replayIndex === totalSnapshots - 1}
              >
                <ChevronRight size={16} className="dark:text-white" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Timestamp', value: formatDate(currentSnapshot.timestamp).split(',')[0], icon: Activity },
              { label: 'DOFD', value: currentSnapshot.dofd || '—', icon: AlertTriangle },
              { label: 'Removal', value: currentSnapshot.removal || '—', icon: FileSearch },
              { label: 'Reported', value: formatDate(currentSnapshot.reported || '').split(',')[0], icon: Zap },
              { label: 'Status', value: currentSnapshot.status || '—', color: 'text-orange-500' }
            ].map((field, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1">{field.label}</p>
                <p className={cn("text-xs font-bold dark:text-white truncate", field.color)}>{field.value}</p>
              </div>
            ))}
          </div>

          {/* Timeline Progress */}
          <div className="mt-10 relative px-2">
            <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-slate-950 dark:bg-emerald-500"
                 initial={{ width: 0 }}
                 animate={{ width: `${((replayIndex + 1) / totalSnapshots) * 100}%` }}
               />
            </div>
            <div className="flex justify-between mt-3">
              {seriesSnapshots.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setReplayIndex(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === replayIndex ? "bg-slate-950 dark:bg-emerald-500 scale-150" : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300"
                  )}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Delta Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold dark:text-white">Differential Log</h3>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select 
                value={impactFilter}
                onChange={(e) => setImpactFilter(e.target.value as any)}
                className="bg-transparent text-xs font-bold dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="all">ALL IMPACTS</option>
                <option value="negative">NEGATIVE ONLY</option>
                <option value="positive">POSITIVE ONLY</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredDeltas.map((delta, i) => (
                <motion.div 
                  key={`${delta.field}-${i}`}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        delta.impact === 'negative' ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : 
                        delta.impact === 'positive' ? "bg-emerald-500" : "bg-slate-400"
                      )} />
                      <p className="text-sm font-bold dark:text-white uppercase tracking-tight">{delta.field}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
                      delta.impact === 'negative' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" : 
                      delta.impact === 'positive' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : 
                      "bg-slate-50 dark:bg-slate-800 text-slate-500"
                    )}>
                      {delta.impact}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] uppercase text-slate-400 font-bold mb-1">Previous</p>
                      <p className="text-xs font-medium dark:text-slate-500 truncate">{delta.oldValue || '—'}</p>
                    </div>
                    <ChevronRight className="text-slate-300" size={14} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] uppercase text-slate-400 font-bold mb-1">Detected</p>
                      <p className="text-xs font-bold dark:text-white truncate">{delta.newValue || '—'}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {delta.description}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Forensic Insights */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold dark:text-white px-2">Analysis Findings</h3>
          <div className="space-y-4">
            {seriesInsights.map((insight, i) => (
              <motion.div 
                key={insight.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveInsightId(insight.id)}
                className={cn(
                  "p-6 rounded-[32px] border transition-all cursor-pointer group relative overflow-hidden",
                  activeInsightId === insight.id 
                    ? "bg-slate-950 text-white border-slate-800 shadow-2xl ring-2 ring-orange-500/50" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    insight.severity === 'high' ? "bg-rose-500/10 text-rose-500" : "bg-orange-500/10 text-orange-500"
                  )}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className={cn(
                      "text-sm font-bold mb-1",
                      activeInsightId === insight.id ? "text-white" : "dark:text-white"
                    )}>
                      {insight.title}
                    </h4>
                    <p className={cn(
                      "text-xs leading-relaxed",
                      activeInsightId === insight.id ? "text-slate-400" : "text-slate-500"
                    )}>
                      {insight.summary}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                    insight.severity === 'high' ? "bg-rose-500/20 text-rose-500" : "bg-orange-500/20 text-orange-400"
                  )}>
                    {insight.severity} Severity
                  </span>
                  <ChevronRight size={14} className={activeInsightId === insight.id ? "text-white" : "text-slate-400"} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeltasTab;
