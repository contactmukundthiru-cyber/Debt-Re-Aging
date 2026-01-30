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
    <div className="space-y-16 pb-32">
      {/* ELITE_TEMPORAL_HERO::ZENITH_PROTOCOL */}
      <section className="relative rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-4xl group">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[160px] -mr-96 -mt-96 group-hover:bg-blue-400/20 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] -ml-40 -mb-40" />

        <div className="relative z-10 p-12 xl:p-20">
          <div className="flex flex-col xl:flex-row items-center gap-20">
            <div className="flex-1 space-y-10">
              <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[Clock, History, Calendar].map((Icon, i) => (
                    <div key={i} className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-slate-950 flex items-center justify-center text-blue-400 shadow-2xl relative" style={{ zIndex: 3 - i }}>
                      <Icon size={24} />
                    </div>
                  ))}
                </div>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-blue-500 font-mono italic animate-pulse">
                  System_Status::TEMPORAL_RECONSTRUCTION_ACTIVE
                </span>
              </div>

              <div className="space-y-6">
                <h1 className="text-7xl xl:text-8xl font-black text-white tracking-tighter leading-none font-mono italic">
                  CHRONO_<span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-emerald-400">FORENSICS</span>
                </h1>
                <p className="text-3xl text-slate-500 font-medium italic max-w-3xl leading-relaxed">
                  Mapping institutional account evolution through cross-referenced historical snapshots. Detecting unauthorized <span className="text-white">re-aging markers</span> and continuity gaps.
                </p>
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <button 
                  onClick={() => exportTimelinePdf(sortedEvents, integrityScore, bureau, clusterSummaries)}
                  className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-6 transition-all shadow-4xl hover:scale-105 group/btn"
                >
                  <span>EXPORT_TIMELINE_DOSSIER</span>
                  <Download size={20} className="group-hover/btn:-translate-y-1 transition-transform" />
                </button>
                <div className="px-10 py-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-6 group/share cursor-pointer hover:bg-white/10 transition-colors">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono italic">Encryption_Level</span>
                      <span className="text-lg font-black text-white font-mono uppercase">RSA_4096::SECURE</span>
                   </div>
                   <ShieldCheck className="text-emerald-500" size={24} />
                </div>
              </div>
            </div>

            {/* PERFORMANCE_TELEMETRY */}
            <div className="w-full xl:w-[500px] grid grid-cols-2 gap-8 ring-1 ring-white/5 p-8 rounded-[3.5rem] bg-black/40 backdrop-blur-2xl shadow-inner">
               <div className="col-span-2 p-10 bg-slate-900/50 rounded-[3rem] border border-white/5 relative overflow-hidden group/readiness">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover/readiness:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] font-mono italic">Integrity_Delta</span>
                    <Zap className="text-blue-400 animate-bounce" size={20} />
                  </div>
                  <div className="flex items-baseline gap-4 mb-4 relative z-10">
                    <span className="text-8xl font-black text-white tracking-tighter font-mono">{integrityScore}%</span>
                  </div>
                  <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-white/5 shadow-inner relative z-10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${integrityScore}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    />
                  </div>
               </div>

               <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Anomaly_Hits</span>
                  <div className="flex items-center gap-4">
                     <span className="text-4xl font-black text-rose-500 font-mono tracking-tighter leading-none">{violationCount}</span>
                     <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20 shadow-2xl">
                        <Radiation size={16} />
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Node_Sequence</span>
                  <div className="flex items-center gap-4">
                     <span className="text-4xl font-black text-white font-mono tracking-tighter leading-none">{sortedEvents.length}</span>
                     <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-2xl">
                        <Boxes size={16} />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid xl:grid-cols-12 gap-16">
        {/* SECTION::TEMPORAL_GRID */}
        <div className="xl:col-span-8 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
            {[
              { label: 'Open → DOFD', value: keyDates.openToDofd, icon: <Calendar size={18} />, color: 'blue' },
              { label: 'DOFD → C/O', value: keyDates.dofdToChargeoff, icon: <Radiation size={18} />, color: 'emerald' },
              { label: 'C/O → Removal', value: keyDates.chargeoffToRemoval, icon: <History size={18} />, color: 'indigo' },
              { label: 'Pay → Removal', value: keyDates.paymentToRemoval, icon: <ShieldCheck size={18} />, color: 'blue' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-950/60 p-8 rounded-[3rem] border border-white/5 shadow-2xl hover:border-blue-500/20 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-blue-500 group-hover:scale-125 transition-transform duration-700">
                  {stat.icon}
                </div>
                <div className="w-10 h-10 rounded-xl mb-6 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  {stat.icon}
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 font-mono">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tabular-nums tracking-tighter font-mono leading-none">
                    {stat.value !== null ? stat.value : '0'}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono uppercase tracking-widest font-black italic">Cycles</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 px-8">
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter font-mono italic flex items-center gap-5">
               <Fingerprint className="text-blue-500 group-hover:animate-pulse" size={36} />
               Institutional_<span className="text-blue-500">Continuity</span>
            </h3>
            
            <div className="flex flex-wrap items-center gap-4">
               <div className="relative group/search flex-grow sm:flex-grow-0">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/search:text-blue-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="QUERY_METADATA..." 
                    className="pl-16 pr-8 py-5 bg-black border border-white/5 rounded-full text-[10px] font-mono font-black text-white placeholder:text-slate-800 focus:outline-none focus:border-blue-500/30 w-full sm:w-80 shadow-inner tracking-widest uppercase italic"
                  />
               </div>
               <button className="flex items-center gap-3 px-8 py-5 bg-slate-900 border border-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-white transition-all font-mono hover:bg-slate-800 shadow-xl">
                  <Filter size={18} />
                  Filter_SEQ
               </button>
            </div>
          </div>

          <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 p-10 shadow-inner overflow-hidden relative">
             <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
             <ForensicTimeline events={sortedEvents} />
          </div>
        </div>

        {/* SECTION::LEGAL_VARIANCE_ENGINE */}
        <div className="xl:col-span-4 space-y-12">
          <div className="space-y-4 px-4 text-right">
            <h4 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">Process_Matrix</h4>
            <p className="text-[12px] text-slate-500 uppercase tracking-[0.4em] font-black font-mono">Temporal_Anomaly_Engine</p>
          </div>

          <div className="sticky top-12 space-y-10">
            {/* DRIFT_CARD */}
            <div className="p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-black rounded-[4rem] border border-white/10 shadow-4xl relative overflow-hidden group/drift">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600" />
               <div className="absolute bottom-[-10%] right-[-10%] p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                <Clock size={280} className="text-white" />
               </div>
               
               <div className="relative z-10 space-y-10">
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-2xl">
                        <Activity size={28} />
                     </div>
                     <div>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest font-mono">Drift_Analysis</span>
                        <h5 className="text-2xl font-black text-white uppercase italic tracking-tighter">Variance_Protocol</h5>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 flex items-center justify-between group/variance">
                        <div className="space-y-1">
                           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">Baseline_Expected</span>
                           <p className="text-3xl font-black text-white font-mono tracking-tighter">{keyDates.expectedRemoval ? formatDate(keyDates.expectedRemoval.toISOString()).split(',')[0] : 'UNDETECTED'}</p>
                        </div>
                        <Calendar className="text-slate-700 group-hover/variance:text-blue-500 transition-colors" size={24} />
                     </div>

                     <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 flex items-center justify-between group/variance">
                        <div className="space-y-1">
                           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">Inst_Reported</span>
                           <p className="text-3xl font-black text-white font-mono tracking-tighter">{keyDates.removal ? formatDate(keyDates.removal).split(',')[0] : 'NODE_EMPTY'}</p>
                        </div>
                        <Target className="text-slate-700 group-hover/variance:text-emerald-500 transition-colors" size={24} />
                     </div>
                  </div>

                  {keyDates.removalDeltaDays !== null && (
                     <div className={cn(
                       "p-12 rounded-[3.5rem] border text-center transition-all shadow-inner relative overflow-hidden",
                       keyDates.removalDeltaDays > 30 ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                     )}>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 font-mono opacity-60">
                          System_Conclusion::{keyDates.removalDeltaDays > 30 ? "ERR_CRITICAL_DRIFT" : "NOMINAL_OFFSET"}
                        </p>
                        <div className="flex items-center justify-center gap-6">
                           <span className={cn(
                             "text-8xl font-black font-mono tracking-tighter leading-none",
                             keyDates.removalDeltaDays > 30 ? "text-rose-500" : "text-emerald-500"
                           )}>
                             {keyDates.removalDeltaDays > 0 ? `+${keyDates.removalDeltaDays}` : keyDates.removalDeltaDays}
                           </span>
                           <div className="text-left border-l-2 border-white/10 pl-6">
                              <span className="text-xs font-black uppercase tracking-widest font-mono block text-white/40 italic">Unit::Days</span>
                              <span className="text-xs font-black uppercase tracking-widest font-mono block text-white italic">VARIANCE</span>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* AI_INSIGHT_LOCKER */}
            <div className="p-10 rounded-[4rem] bg-slate-950 border border-white/10 shadow-4xl relative overflow-hidden group/ai">
               <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-[2] group-hover:rotate-12 transition-transform duration-1000">
                 <Cpu size={120} className="text-indigo-500" />
               </div>

               <div className="relative z-10 space-y-10">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 flex-shrink-0">
                       <Zap size={24} />
                    </div>
                    <div className="space-y-1">
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest font-mono">Cognitive_Scan</span>
                       <h5 className="text-xl font-black text-white uppercase italic tracking-tighter">AI_Assessment</h5>
                    </div>
                  </div>

                  <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 relative">
                     <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                     <p className="text-xl text-slate-300 font-medium italic leading-relaxed font-mono">
                      "Pattern detection identified <span className="text-white font-black uppercase">{violationCount} mismatches</span>. reporting velocity suggests an anomaly depth of <span className="text-indigo-400 font-black">{(keyDates.removalDeltaDays || 0) / 30 > 2 ? 'SEVERE' : 'NOMINAL'}</span>."
                     </p>
                  </div>

                  <div 
                    onClick={() => setActiveTab && setActiveTab('briefing')}
                    className="flex items-center gap-6 p-10 rounded-[3rem] bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-4xl cursor-pointer group/final"
                  >
                    <div className="flex-1">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">Dossier_Finalization</span>
                      <span className="text-2xl font-black uppercase tracking-tighter font-mono italic leading-none">View_Case_Brief</span>
                    </div>
                    <ArrowRight size={32} className="group-hover/final:translate-x-2 transition-transform" />
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
