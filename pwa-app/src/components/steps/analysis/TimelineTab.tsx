import React, { useMemo } from 'react';
import { TimelineEvent } from '../../../lib/analytics';
import { exportTimelinePdf } from '../../../lib/timeline-pdf';
import { formatDate } from '../../../lib/i18n';
import ForensicTimeline from './ForensicTimeline';
import { 
  FileText, 
  Clock, 
  History, 
  Calendar,
  Radiation,
  Download, 
  Share2, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Fingerprint, 
  Search, 
  Filter, 
  Cpu, 
  Terminal,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface TimelineTabProps {
  timeline: TimelineEvent[];
  bureau?: string;
}

const TimelineTab: React.FC<TimelineTabProps> = ({ timeline, bureau }) => {
  const sortedEvents = useMemo(() => [...timeline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [timeline]);
  const violationCount = useMemo(() => timeline.filter(e => e.type === 'violation' || e.flagged).length, [timeline]);
  
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
    
    const monthsBetween = (start?: string | Date, end?: string | Date) => {
      if (!start || !end) return null;
      const s = new Date(start);
      const e = new Date(end);
      const diff = Math.abs(e.getTime() - s.getTime());
      return Math.round(diff / (1000 * 60 * 60 * 24 * 30.44));
    };

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

  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center bg-slate-950 rounded-[4rem] border-2 border-dashed border-slate-800 shadow-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5" />
        <div className="relative z-10">
          <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] border border-white/5 flex items-center justify-center mb-10 text-slate-500 shadow-2xl mx-auto">
            <Clock className="w-12 h-12 animate-pulse" />
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-6">Chronology Deficit</h3>
          <p className="text-slate-400 max-w-lg mx-auto font-medium leading-relaxed italic">
            Insufficient temporal metadata detected for sequence reconstruction. Upload institutional historical snapshots to initialize the forensic timeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32">
      {/* SECTION_HEADER::TEMPORAL_FORENSICS */}
      <div className="relative p-12 bg-slate-950 rounded-[3rem] border border-white/10 shadow-3xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -ml-40 -mb-40" />
        
        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-12">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-md">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] font-mono">Temporal Integrity Lab</span>
              </div>
              <div className="h-px w-24 bg-gradient-to-r from-blue-500/50 to-transparent" />
            </div>

            <h2 className="text-6xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">
              Chronological <span className="text-blue-500">Forensics</span>
            </h2>
            
            <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-3xl italic border-l-2 border-white/5 pl-8">
              Mapping account evolution through cross-referenced historical snapshots. Detecting <span className="text-white">unauthorized re-aging markers</span>, continuity gaps, and institutional data drift.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <button 
              onClick={() => exportTimelinePdf(sortedEvents, integrityScore, bureau, clusterSummaries)}
              className="px-10 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2.5rem] border border-white/10 transition-all duration-300 flex items-center justify-center gap-4 font-black group/btn shadow-2xl hover:scale-[1.02]"
            >
              <Download size={22} className="group-hover/btn:-translate-y-1 transition-transform text-white/80" />
              <span className="font-mono text-xs uppercase tracking-[0.2em]">Export PDF Dossier</span>
            </button>
            <button className="p-6 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-[2rem] border border-white/10 transition-all shadow-2xl flex items-center justify-center">
              <Share2 size={28} />
            </button>
          </div>
        </div>

        {/* METRIC_GRID::FORENSIC_SNAPSHOT */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16 pt-16 border-t border-white/5">
          <div className="p-10 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 hover:border-blue-500/20 transition-all group/stat">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 font-mono">NODE_SCORE::01</p>
            <div className="flex items-baseline gap-3">
               <span className="text-5xl font-black text-white tabular-nums tracking-tighter font-mono">{integrityScore}%</span>
               <span className="text-[10px] font-bold text-blue-500 uppercase font-mono tracking-widest leading-none">VALID</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-blue-500 w-[60%]" />
            </div>
          </div>

          <div className="p-10 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 hover:border-rose-500/20 transition-all group/stat">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 font-mono">ANOMALY_HITS::02</p>
            <div className="flex items-baseline gap-3">
               <span className="text-5xl font-black text-rose-500 tabular-nums tracking-tighter font-mono">{violationCount}</span>
               <span className="text-[10px] font-bold text-rose-600 uppercase font-mono tracking-widest leading-none">FLAGGED</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-rose-500 w-[20%]" />
            </div>
          </div>

          <div className="p-10 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 hover:border-emerald-500/20 transition-all group/stat">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 font-mono">NODE_COUNT::03</p>
            <div className="flex items-baseline gap-3">
               <span className="text-5xl font-black text-white tabular-nums tracking-tighter font-mono">{sortedEvents.length}</span>
               <span className="text-[10px] font-bold text-emerald-500 uppercase font-mono tracking-widest leading-none">NODES</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full mt-6 overflow-hidden">
               <div className="h-full bg-emerald-500 w-[85%]" />
            </div>
          </div>

          <div className="p-10 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 hover:border-blue-500/20 transition-all group/stat">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 font-mono">TARGET_ENTITY::04</p>
            <div className="flex items-baseline gap-3">
               <span className="text-4xl font-black text-white uppercase tracking-tighter truncate font-mono italic">{bureau || 'GLOBAL'}</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full mt-6 overflow-hidden">
               <div className="h-full bg-blue-500 w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-start text-white">
        {/* LEFT_COLUMN::TIMELINE_RECONSTRUCTION */}
        <div className="lg:col-span-8 space-y-12">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Open → DOFD', value: keyDates.openToDofd, icon: <Calendar size={18} />, color: 'blue' },
              { label: 'DOFD → C/O', value: keyDates.dofdToChargeoff, icon: <Radiation size={18} />, color: 'amber' },
              { label: 'C/O → Removal', value: keyDates.chargeoffToRemoval, icon: <History size={18} />, color: 'emerald' },
              { label: 'Pay → Removal', value: keyDates.paymentToRemoval, icon: <ShieldCheck size={18} />, color: 'indigo' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-white/20 transition-all group relative overflow-hidden"
              >
                <div className={cn(
                  "absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-125 transition-transform duration-700",
                  `text-${stat.color}-500`
                )}>
                  {stat.icon}
                </div>
                <div className={cn("w-10 h-10 rounded-xl mb-6 flex items-center justify-center border", `bg-${stat.color}-500/10 border-${stat.color}-500/20 text-${stat.color}-500`)}>
                  {stat.icon}
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 font-mono">{stat.label}</p>
                <p className="text-3xl font-black text-white tabular-nums tracking-tighter font-mono leading-none">
                  {stat.value !== null ? stat.value : '—'}
                  <span className="text-[10px] text-slate-600 font-mono ml-2 uppercase tracking-widest font-black italic">Cycles</span>
                </p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 px-4">
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter font-mono italic flex items-center gap-5">
               <Fingerprint className="text-blue-500" size={36} />
               Institutional <span className="text-blue-500">Continuity</span>
            </h3>
            
            <div className="flex flex-wrap items-center gap-4">
               <div className="relative group/search flex-grow sm:flex-grow-0">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/search:text-blue-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="QUERY_METADATA..." 
                    className="pl-16 pr-8 py-5 bg-slate-950/40 border border-white/5 rounded-full text-[10px] font-mono font-black text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500/30 w-full sm:w-80 shadow-inner tracking-widest uppercase italic"
                  />
               </div>
               <button className="flex items-center gap-3 px-8 py-5 bg-slate-900 border border-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-white transition-all font-mono hover:bg-slate-800 shadow-xl">
                  <Filter size={18} />
                  Filter_SEQ
               </button>
            </div>
          </div>

          <ForensicTimeline events={sortedEvents} />
        </div>

        {/* Right Action/Forensic Sidebars */}
        <div className="lg:col-span-4 space-y-10 sticky top-32">
           {/* Removal Window Analysis */}
           <div className="p-10 bg-slate-950 rounded-[3.5rem] border border-white/10 shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-rose-500" />
              <div className="absolute top-4 right-4 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-700">
                <Clock size={160} className="text-white" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-1 h-8 bg-blue-500 rounded-full" />
                   <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-500 font-mono">Temporal Variance Matrix</h4>
                </div>
                
                <div className="space-y-8">
                   <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 hover:border-blue-500/20 transition-all flex items-center justify-between group/item">
                      <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono mb-2">Calculated Baseline</p>
                         <p className="text-2xl font-black text-white font-mono tracking-tighter uppercase">{keyDates.expectedRemoval ? formatDate(keyDates.expectedRemoval.toISOString()).split(',')[0] : 'UNDETECTED'}</p>
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover/item:scale-110 transition-transform">
                         <Clock size={24} />
                      </div>
                   </div>

                   <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 hover:border-blue-500/20 transition-all flex items-center justify-between group/item">
                      <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono mb-2">Institutional Reported</p>
                         <p className="text-2xl font-black text-white font-mono tracking-tighter uppercase">{keyDates.removal ? formatDate(keyDates.removal).split(',')[0] : 'N/A'}</p>
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover/item:scale-110 transition-transform">
                         <FileText size={24} />
                      </div>
                   </div>

                   {keyDates.removalDeltaDays !== null && (
                     <div className={cn(
                       "p-8 rounded-[3rem] border text-center transition-all shadow-3xl group/delta",
                       keyDates.removalDeltaDays > 30 ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                     )}>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 font-mono">Variance Detection</p>
                        <div className="flex items-center justify-center gap-3">
                           <span className="text-5xl font-black font-mono tracking-tight group-hover/delta:scale-110 transition-transform inline-block">
                             {keyDates.removalDeltaDays > 0 ? `+${keyDates.removalDeltaDays}` : keyDates.removalDeltaDays}
                           </span>
                           <span className="text-[10px] font-bold uppercase tracking-widest font-mono italic opacity-60">Sequence<br/>Shift Days</span>
                        </div>
                     </div>
                   )}
                </div>
              </div>
           </div>

           {/* AI Anomaly Insights Panel */}
           <div className="p-10 bg-slate-950 rounded-[3.5rem] border border-white/10 shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                 <Cpu size={140} className="text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-1 h-8 bg-blue-500 rounded-full" />
                   <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] font-mono">Cognitive Assessment</h4>
                </div>

                <div className="space-y-8">
                  <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 hover:border-blue-500/20 transition-all">
                    <p className="text-sm text-slate-400 font-medium italic leading-relaxed">
                      "Pattern detection identified <span className="text-white font-bold">{violationCount} discrepancies</span> between institutional metadata and federal reporting windows. Calculated reporting velocity suggests an anomaly depth of <span className="text-blue-400 font-mono">{(keyDates.removalDeltaDays || 0) / 30 > 2 ? 'SEVERE' : 'NOMINAL'}</span>."
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase font-mono tracking-[0.2em] text-slate-500">
                      <span>Temporal Confidence</span>
                      <span className="text-emerald-500">{integrityScore}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${integrityScore}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('cra:navigate', { detail: { step: 5 } }))}
                    className="w-full py-6 px-10 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-[2rem] border border-blue-500/20 text-[11px] font-black uppercase tracking-[0.3em] font-mono transition-all flex items-center justify-center gap-3 group/nexus"
                  >
                    Request Process Final Brief
                    <Terminal size={16} className="group-hover/nexus:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
           </div>

           {/* Temporal Anomaly Clusters */}
           {clusterSummaries.length > 0 && (
             <div className="p-10 bg-slate-900/40 rounded-[3.5rem] border border-white/10 shadow-3xl">
               <div className="flex items-center gap-4 mb-10">
                   <div className="w-1 h-8 bg-emerald-500 rounded-full" />
                   <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] font-mono">Anomaly Clusters</h4>
               </div>
               
               <div className="space-y-6">
                 {clusterSummaries.map((cluster, idx) => (
                   <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 hover:border-emerald-500/30 transition-all group"
                   >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[11px] font-black text-emerald-500 uppercase font-mono tracking-widest">CLUSTER_V{idx+1}</span>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                           <span className="text-[9px] font-black text-emerald-500 font-mono">{cluster.size} VECTORS</span>
                        </div>
                      </div>
                      <p className="text-sm font-black text-white leading-tight uppercase tracking-tighter mb-6 italic">
                        {cluster.startLabel} <span className="text-slate-600 font-normal">→</span> {cluster.endLabel}
                      </p>
                      <div className="space-y-3">
                         <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase font-mono tracking-widest">
                            <span>Threat Score</span>
                            <span className="text-emerald-500">{cluster.score}%</span>
                         </div>
                         <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${cluster.score}%` }}
                              className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                            />
                         </div>
                      </div>
                   </motion.div>
                 ))}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default TimelineTab;
