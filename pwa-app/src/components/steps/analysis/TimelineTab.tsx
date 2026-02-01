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
  Target,
  Boxes,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface TimelineTabProps {
  timeline: TimelineEvent[];
  bureau?: string;
  setActiveTab?: (tab: any) => void;
}

const TimelineTab: React.FC<TimelineTabProps> = ({ timeline, bureau, setActiveTab }) => {
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
      <div className="flex flex-col items-center justify-center p-32 text-center bg-slate-950/40 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-rose-500/5 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-center mb-10 text-slate-500 shadow-inner mx-auto group-hover:scale-110 transition-transform">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 font-mono italic">Chronology Deficit</h3>
          <p className="text-slate-500 max-w-sm mx-auto font-medium leading-relaxed italic uppercase tracking-tight text-sm">
            Insufficient temporal metadata detected for sequence reconstruction. Upload institutional historical snapshots to initialize the forensic timeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-20 pb-32">
      {/* ELITE_CHRONO_HERO::ZENITH_PROTOCOL_V5 */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-br from-blue-600/20 via-emerald-600/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
          
          <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-12 xl:col-span-7">
               <div className="flex items-center gap-6 mb-12">
                  <div className="px-5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-3">
                      <Clock size={14} className="text-blue-400 animate-pulse" />
                      <span className="text-[10px] uppercase font-black tracking-[0.4em] text-blue-400 font-mono">Temporal Forensic v5.0</span>
                  </div>
                  <div className="h-px w-10 bg-slate-800" />
                  <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Record_Sync::SECURED</span>
              </div>

              <h2 className="text-7xl xl:text-8xl font-black text-white tracking-tighter mb-10 leading-[0.9] italic uppercase font-mono">
                  Chrono <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 tracking-[-0.05em]">FORENSICS</span>
              </h2>
              <p className="text-slate-400 text-lg xl:text-xl leading-relaxed mb-12 max-w-2xl font-medium italic border-l-2 border-emerald-500/30 pl-8">
                  Mapping institutional account evolution through cross-referenced historical snapshots. Detecting unauthorized <span className="text-white">re-aging markers</span> and continuity gaps within the sequence.
              </p>
              
              <div className="flex flex-wrap items-center gap-8">
                <button 
                   onClick={() => exportTimelinePdf(sortedEvents, integrityScore, bureau, clusterSummaries)}
                   title="Export Timeline Dossier as PDF"
                   aria-label="Export Timeline Dossier"
                   className="relative group/btn overflow-hidden rounded-[2rem] p-px bg-gradient-to-br from-blue-500 via-indigo-600 to-emerald-400"
                >
                   <div className="relative flex items-center gap-6 px-10 py-5 rounded-[1.9rem] bg-slate-950 group-hover/btn:bg-transparent transition-all duration-700 text-white cursor-pointer">
                      <span className="font-black uppercase tracking-widest text-sm font-mono italic">Export_Dossier</span>
                      <Download size={20} className="group-hover/btn:-translate-y-1 transition-transform duration-700" />
                   </div>
                </button>
                
                <div className="flex items-center gap-12 bg-black/40 px-10 py-5 rounded-[2rem] border border-white/5">
                   <div className="group/stat">
                       <p className="text-[9px] uppercase text-slate-500 font-black tracking-[0.5em] font-mono mb-2">Integrity_Hash</p>
                       <p className="text-xl font-black text-white font-mono tracking-tighter uppercase italic">CRC_Verified</p>
                   </div>
                   <div className="h-8 w-px bg-slate-800" />
                   <div className="group/stat">
                       <p className="text-[9px] uppercase text-slate-500 font-black tracking-[0.5em] font-mono mb-2">Sequence_Key</p>
                       <p className="text-xl font-black text-emerald-400 font-mono tracking-tighter italic uppercase">0x8B...F42</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-5 relative group/telemetry">
                 <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-[3rem] blur-sm opacity-50 group-hover/telemetry:opacity-100 transition-all" />
                 <div className="relative bg-slate-900/20 border border-white/10 p-12 rounded-[3.5rem] backdrop-blur-3xl shadow-inner min-h-[340px] flex flex-col justify-center overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-[4] rotate-12">
                        <History size={120} />
                     </div>
                     <div className="space-y-10 relative z-10">
                         <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] font-mono italic">Integrity_Index</h4>
                            <Zap size={16} className="text-emerald-500 animate-bounce" />
                         </div>
                         <div className="flex items-baseline gap-4">
                            <span className="text-9xl font-black text-white font-mono tracking-tighter leading-none">{integrityScore}</span>
                            <span className="text-3xl font-black text-slate-600 font-mono">%</span>
                         </div>
                         <div className="h-4 w-full bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${integrityScore}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="space-y-1">
                               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Anomaly_Hits</span>
                               <p className="text-3xl font-black text-rose-500 font-mono tracking-tighter">{violationCount}</p>
                            </div>
                            <div className="space-y-1 text-right">
                               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Node_Sequence</span>
                               <p className="text-3xl font-black text-white font-mono tracking-tighter">{sortedEvents.length}</p>
                            </div>
                         </div>
                     </div>
                 </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-16">
        {/* TEMPORAL_RECONSTRUCTION_MATRIX */}
        <div className="lg:col-span-8 space-y-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
            {[
              { label: 'Open → DOFD', value: keyDates.openToDofd, icon: <Calendar size={18} />, color: 'slate' },
              { label: 'DOFD → C/O', value: keyDates.dofdToChargeoff, icon: <Radiation size={18} />, color: 'slate' },
              { label: 'C/O → Removal', value: keyDates.chargeoffToRemoval, icon: <History size={18} />, color: 'slate' },
              { label: 'Pay → Removal', value: keyDates.paymentToRemoval, icon: <ShieldCheck size={18} />, color: 'slate' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className="absolute -inset-px bg-gradient-to-br from-white/5 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-slate-950/60 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-blue-500/20 transition-all overflow-hidden h-full flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.02] text-white group-hover:scale-125 transition-transform duration-1000 grayscale">
                    {stat.icon}
                  </div>
                  <div className="w-10 h-10 rounded-xl mb-8 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 font-mono">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-5xl font-black text-white tabular-nums tracking-tighter font-mono leading-none">
                         {stat.value !== null ? stat.value : '00'}
                       </span>
                       <span className="text-[9px] text-slate-700 font-mono uppercase tracking-widest font-extrabold italic">CYCLES</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-12">
             <div className="flex items-center justify-between px-8">
               <div className="flex items-center gap-8">
                  <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xl">
                     <Fingerprint size={28} />
                  </div>
                  <div>
                    <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic">Sequence Recon</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold mt-1">Institutional Continuity Map</p>
                  </div>
               </div>
               
               <div className="relative group/search hidden md:block">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/search:text-blue-500 transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search timeline or events..." 
                    className="pl-14 pr-6 py-4 bg-black/60 border border-white/5 rounded-full text-[9px] font-mono font-black text-white placeholder:text-slate-800 focus:outline-none focus:border-slate-500/40 w-72 shadow-inner tracking-widest uppercase italic"
                  />
               </div>
             </div>

             <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 p-12 shadow-2xl overflow-hidden relative group/timeline">
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none opacity-50 group-hover/timeline:opacity-100 transition-opacity duration-1000" />
                <div className="relative z-10 scale-[0.98] origin-top">
                   <ForensicTimeline events={sortedEvents} />
                </div>
             </div>
          </div>
        </div>

        {/* SEQUENCE_ORCHESTRATION_ENGINE */}
        <div className="lg:col-span-4 space-y-16">
          <div className="space-y-4 px-4 text-right">
            <h4 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">Process_Nodes</h4>
            <p className="text-[12px] text-slate-500 uppercase tracking-[0.4em] font-black font-mono">Sequential_Verification</p>
          </div>
          
          <div className="sticky top-12 space-y-12">
            <div className="relative group/matrix">
               <div className="absolute -inset-1 bg-gradient-to-b from-indigo-500/20 to-transparent rounded-[4rem] blur-xl opacity-30 group-hover/matrix:opacity-60 transition duration-700" />
               <div className="relative p-12 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-[3] -rotate-12 transition-transform group-hover/matrix:rotate-0 duration-1000">
                    <Target size={120} />
                  </div>

                  <div className="relative z-10 flex-1 flex flex-col gap-12">
                    <div className="flex items-center justify-between">
                       <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-2xl">
                          <Cpu size={32} />
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest font-mono block mb-1">State_ID</span>
                          <span className="text-2xl font-black text-white font-mono tracking-tighter italic">ACTIVE_SEQ</span>
                       </div>
                    </div>

                    <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar max-h-[500px]">
                      {clusterSummaries.map((cluster, i) => (
                        <div 
                          key={i}
                          className="group/item relative overflow-hidden"
                        >
                           <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                           <div className="relative p-8 rounded-[2.5rem] bg-black/20 border border-white/5 hover:border-rose-500/30 transition-all duration-500">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                    <Radiation size={18} />
                                  </div>
                                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest font-mono italic animate-pulse">Violation_Cluster</span>
                                </div>
                                <span className="text-2xl font-black text-white font-mono">{cluster.score}%</span>
                              </div>
                              <div className="space-y-4">
                                 <div className="flex items-center justify-between text-slate-500 italic text-sm">
                                    <span>Origin</span>
                                    <span className="text-slate-200 font-bold uppercase">{cluster.startLabel}</span>
                                 </div>
                                 <div className="h-px w-full bg-white/5" />
                                 <div className="flex items-center justify-between text-slate-500 italic text-sm">
                                    <span>Termination</span>
                                    <span className="text-slate-200 font-bold uppercase">{cluster.endLabel}</span>
                                 </div>
                                 <div className="flex items-center gap-4 pt-4">
                                    <div className="flex-1 h-3 bg-black rounded-full overflow-hidden border border-white/5">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${cluster.score}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className="h-full bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                                      />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-600 font-mono italic">THREAT_LVL</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-8 space-y-4">
                      <div className="p-8 rounded-[2.5rem] bg-blue-500 border border-blue-400 text-white flex items-center justify-between shadow-4xl group/cta cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">
                         <div className="text-left">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">Dossier_Status</span>
                            <span className="text-2xl font-black uppercase tracking-tighter font-mono italic leading-none">Compile_Results</span>
                         </div>
                         <ArrowRight size={32} className="group-hover/cta:translate-x-2 transition-transform duration-500" />
                      </div>
                      <div className="p-6 text-center">
                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] font-mono italic">End_of_Sequence_Verification</span>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* STRATEGIC_COUNCIL_WARNING */}
            <div className="p-12 rounded-[4rem] bg-gradient-to-br from-rose-950/20 to-black border border-rose-500/10 relative overflow-hidden shadow-2xl group/warn">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <div className="relative z-10 flex items-center gap-8">
                   <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform duration-700">
                      <Radiation size={28} className="text-rose-500 animate-pulse" />
                   </div>
                   <div className="space-y-1">
                      <h5 className="text-xl font-black text-rose-500 italic uppercase tracking-tight">Temporal_Anomalies</h5>
                      <p className="text-[11px] text-slate-500 font-medium italic uppercase tracking-tight leading-relaxed">
                         Detected unauthorized frequency shifts in reporting clusters. Reconstruction suggests <span className="text-rose-400 font-bold">RE-AGING</span> likely.
                      </p>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineTab;
