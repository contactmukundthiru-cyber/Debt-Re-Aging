'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RuleFlag } from '../../../lib/rules';
import { TabId } from '../../../lib/constants';
import { 
  FileSearch, 
  Boxes, 
  ShieldCheck, 
  Database, 
  Network, 
  Terminal, 
  ArrowRight, 
  Microscope,
  Cpu,
  Fingerprint,
  Zap,
  Activity,
  Layers,
  Container,
  FolderLock
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DiscoveryTabProps {
  flags: RuleFlag[];
  discoveryAnswers: Record<string, string>;
  setDiscoveryAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
}

const DiscoveryTab: React.FC<DiscoveryTabProps> = ({
  flags,
  discoveryAnswers,
  setDiscoveryAnswers,
  setActiveTab
}) => {
  const suggestedEvidence = useMemo(() => Array.from(new Set(flags.flatMap(f => f.suggestedEvidence))), [flags]);
  const flagsWithQuestions = useMemo(() => flags.filter(f => (f.discoveryQuestions?.length ?? 0) > 0), [flags]);

  // Calculate progress
  const totalEvidenceItems = suggestedEvidence.length;
  const checkedEvidenceItems = Object.keys(discoveryAnswers).filter(k => k.startsWith('ev-') && discoveryAnswers[k] === 'checked').length;
  const evidenceProgress = totalEvidenceItems > 0 ? Math.round((checkedEvidenceItems / totalEvidenceItems) * 100) : 0;

  const totalQuestions = flagsWithQuestions.reduce((acc, f) => acc + (f.discoveryQuestions?.length || 0), 0);
  const answeredQuestions = flagsWithQuestions.reduce((acc, f) => {
    return acc + (f.discoveryQuestions?.filter((_, j) => discoveryAnswers[`${f.ruleId}-${j}`]?.trim().length > 0).length || 0);
  }, 0);
  const questionProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const overallReadiness = Math.round((evidenceProgress + questionProgress) / 2);

  return (
    <div className="space-y-16 pb-32">
      {/* ELITE_DISCOVERY_HERO::PROTOCOL_ZULU */}
      <section className="relative rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-4xl group">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[160px] -mr-96 -mt-96 group-hover:bg-blue-400/20 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] -ml-40 -mb-40" />

        <div className="relative z-10 p-12 xl:p-20">
          <div className="flex flex-col xl:flex-row items-center gap-20">
            <div className="flex-1 space-y-10">
              <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[Microscope, FileSearch, Database].map((Icon, i) => (
                    <div key={i} className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-slate-950 flex items-center justify-center text-blue-400 shadow-2xl relative" style={{ zIndex: 3 - i }}>
                      <Icon size={24} />
                    </div>
                  ))}
                </div>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-blue-500 font-mono italic animate-pulse">
                  System_Status::EVIDENCE_ASSEMBLY_ACTIVE
                </span>
              </div>

              <div className="space-y-6">
                <h1 className="text-7xl xl:text-8xl font-black text-white tracking-tighter leading-none font-mono italic">
                  MANIFEST_<span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-cyan-400">VECTOR</span>
                </h1>
                <p className="text-3xl text-slate-500 font-medium italic max-w-3xl leading-relaxed">
                  Consolidating statutory variances into a weaponized evidence locker. Execute cross-reference protocols to finalize dossier.
                </p>
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <button className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-6 transition-all shadow-4xl hover:scale-105 group/btn">
                  <span>INIT_SYSTEM_AUDIT</span>
                  <Terminal size={20} className="group-hover/btn:rotate-12 transition-transform" />
                </button>
                <div className="px-10 py-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-6">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono italic">Encryption_Level</span>
                      <span className="text-lg font-black text-white font-mono uppercase">RSA_4096::ACTIVE</span>
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
                    <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] font-mono italic">Readiness_Delta</span>
                    <Zap className="text-blue-400 animate-bounce" size={20} />
                  </div>
                  <div className="flex items-baseline gap-4 mb-4 relative z-10">
                    <span className="text-8xl font-black text-white tracking-tighter font-mono">{overallReadiness}%</span>
                  </div>
                  <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-white/5 shadow-inner relative z-10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${overallReadiness}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    />
                  </div>
               </div>

               <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Evidence_Nodes</span>
                  <div className="flex items-center gap-4">
                     <span className="text-4xl font-black text-white font-mono tracking-tighter leading-none">{checkedEvidenceItems}/{totalEvidenceItems}</span>
                     <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-2xl">
                        <Container size={16} />
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Inquiry_Payload</span>
                  <div className="flex items-center gap-4">
                     <span className="text-4xl font-black text-white font-mono tracking-tighter leading-none">{answeredQuestions}/{totalQuestions}</span>
                     <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-2xl">
                        <Layers size={16} />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid xl:grid-cols-12 gap-16">
        {/* SECTION::INTERROGATORY_MATRIX */}
        <div className="xl:col-span-8 space-y-12">
          <div className="flex items-center justify-between px-8">
            <div className="space-y-4">
              <h4 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">Discovery_Interrogatory</h4>
              <p className="text-[12px] text-slate-500 uppercase tracking-[0.4em] font-black font-mono">Cross_Reference_Verification_Nodes</p>
            </div>
          </div>

          <div className="space-y-12">
            <AnimatePresence mode="popLayout">
              {flagsWithQuestions.length > 0 ? (
                flagsWithQuestions.map((flag, i) => (
                  <motion.div 
                    key={flag.ruleId}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    className="rounded-[3.5rem] bg-slate-900/40 border border-white/5 overflow-hidden shadow-4xl group/card"
                  >
                    <div className="p-10 xl:p-12 space-y-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-2xl font-mono font-black text-xs">
                            {flag.ruleId.split('_').pop()}
                          </div>
                          <div>
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">Module_ID::{flag.ruleId}</span>
                             <h5 className="text-3xl font-black text-white italic tracking-tighter group-hover/card:text-blue-400 transition-colors uppercase font-mono leading-none">{flag.ruleName}</h5>
                          </div>
                        </div>
                        <div className="px-6 py-2 bg-black rounded-full border border-white/5">
                           <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest font-mono italic">Status::Awaiting_Data</span>
                        </div>
                      </div>

                      <div className="grid gap-6">
                        {flag.discoveryQuestions?.map((q, j) => (
                          <div key={j} className="space-y-4 relative group/q">
                            <div className="flex items-center gap-6 mb-2">
                               <div className="w-8 h-8 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center text-[10px] font-mono font-black text-slate-500 group-focus-within/q:text-blue-400 transition-colors">
                                  {String(j + 1).padStart(2, '0')}
                               </div>
                               <p className="text-xl text-slate-400 font-medium italic leading-relaxed group-hover/q:text-slate-200 transition-colors">
                                  {q}
                                </p>
                            </div>
                            <div className="relative">
                              <textarea
                                value={discoveryAnswers[`${flag.ruleId}-${j}`] || ''}
                                onChange={(e) => setDiscoveryAnswers(prev => ({
                                  ...prev,
                                  [`${flag.ruleId}-${j}`]: e.target.value
                                }))}
                                placeholder="EXECUTE_STRING_ENTRY..."
                                className="w-full bg-black/60 border border-white/5 rounded-[2rem] p-10 text-white placeholder:text-slate-800 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all font-mono italic text-lg min-h-[160px] resize-none shadow-inner"
                              />
                              <div className="absolute bottom-6 right-8 opacity-20 group-focus-within/q:opacity-100 transition-opacity">
                                 <Fingerprint size={24} className="text-blue-500" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-[4rem] p-32 text-center bg-slate-950/40 border-2 border-dashed border-white/5">
                  <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-slate-700 shadow-inner">
                    <ShieldCheck size={40} />
                  </div>
                  <h3 className="text-4xl font-black text-white italic tracking-tighter font-mono uppercase mb-4">Optimization_Complete</h3>
                  <p className="text-xl text-slate-500 font-medium italic max-w-sm mx-auto">No further investigator input required for current data set. Evidence manifest is structurally sound.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* SECTION::EVIDENCE_CHECKLIST_LOCKER */}
        <div className="xl:col-span-4 space-y-12">
          <div className="space-y-4 px-4">
            <h4 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">Evidence_Locker</h4>
            <p className="text-[12px] text-slate-500 uppercase tracking-[0.4em] font-black font-mono">Physical_Asset_Validation</p>
          </div>

          <div className="sticky top-12 space-y-10">
            <div className="p-12 rounded-[4rem] bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/10 shadow-4xl relative overflow-hidden group/locker">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-[3] -rotate-12 transition-transform group-hover/locker:rotate-0 duration-1000">
                <FolderLock size={120} />
              </div>

              <div className="relative z-10 space-y-12">
                <div className="flex items-center justify-between">
                   <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-2xl">
                      <Boxes size={32} />
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest font-mono block mb-1">Integrity_Hash</span>
                      <span className="text-xs font-mono text-slate-600 truncate max-w-[120px] block">0xFD82...E9A1</span>
                   </div>
                </div>

                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                  {suggestedEvidence.map((item, i) => (
                    <div 
                      key={i}
                      onClick={() => setDiscoveryAnswers(prev => ({
                        ...prev,
                        [`ev-${item}`]: prev[`ev-${item}`] === 'checked' ? '' : 'checked'
                      }))}
                      className={cn(
                        "p-8 rounded-[2.5rem] border transition-all cursor-pointer group/item flex items-center gap-6",
                        discoveryAnswers[`ev-${item}`] === 'checked'
                          ? "bg-indigo-500/10 border-indigo-500/40 shadow-indigo-500/10"
                          : "bg-black/40 border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center transition-all",
                        discoveryAnswers[`ev-${item}`] === 'checked'
                          ? "bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                          : "bg-slate-900 border-white/10 text-transparent"
                      )}>
                        <ShieldCheck size={20} strokeWidth={3} />
                      </div>
                      <span className={cn(
                        "flex-1 text-xl font-medium italic transition-colors",
                        discoveryAnswers[`ev-${item}`] === 'checked' ? "text-white" : "text-slate-500 group-hover/item:text-slate-300"
                      )}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-8 block">
                  <div 
                    onClick={() => setActiveTab('deltas')}
                    className="flex items-center gap-6 p-10 rounded-[3rem] bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-4xl cursor-pointer group/final"
                  >
                    <div className="flex-1">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">Final_Protocol</span>
                      <span className="text-2xl font-black uppercase tracking-tighter font-mono italic leading-none">Assemble_Final_Case</span>
                    </div>
                    <ArrowRight size={32} className="group-hover/final:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* SYSTEM_STATS_TICKER */}
            <div className="grid grid-cols-2 gap-4">
               {[
                 { label: 'Latency', value: '14ms', icon: Activity, color: 'text-emerald-500' },
                 { label: 'Uptime', value: '99.9%', icon: Zap, color: 'text-amber-500' }
               ].map((stat, i) => (
                 <div key={i} className="bg-slate-950/60 p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
                    <stat.icon className={stat.color} size={16} />
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">{stat.label}</span>
                       <span className="text-base font-black text-white font-mono">{stat.value}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryTab;
