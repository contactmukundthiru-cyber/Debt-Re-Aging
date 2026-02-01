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
    <div className="fade-in space-y-20 pb-32">
      {/* ELITE_DISCOVERY_HERO::MANIFEST_VECTOR_V5 */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 via-indigo-500/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
          
          <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-7">
               <div className="flex items-center gap-6 mb-12">
                  <div className="px-5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-3">
                      <Microscope size={14} className="text-blue-400 animate-pulse" />
                      <span className="text-[10px] uppercase font-black tracking-[0.4em] text-blue-400 font-mono">Forensic Manifest v5.0</span>
                  </div>
                  <div className="h-px w-10 bg-slate-800" />
                  <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Status: Vector_Assembly</span>
              </div>

              <h2 className="text-7xl font-black text-white tracking-tighter mb-10 leading-[0.9] italic uppercase font-mono">
                  Manifest <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 tracking-[-0.05em]">VECTOR</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-xl font-medium italic border-l-2 border-blue-500/30 pl-8">
                  Consolidating statutory variances into a weaponized evidence locker. Cross-referencing institutional metadata to finalize the adversarial dossier.
              </p>
              
              <div className="flex items-center gap-16">
                   <div className="group/stat">
                       <p className="text-[9px] uppercase text-slate-500 font-black tracking-[0.5em] font-mono mb-3">ENCRYPTION_LAYER</p>
                       <div className="flex items-baseline gap-3">
                          <p className="text-2xl font-black text-white font-mono tracking-tighter drop-shadow-2xl uppercase italic">AES_CURVE_256</p>
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                       </div>
                   </div>
                   <div className="h-16 w-px bg-slate-800" />
                   <div className="group/stat">
                       <p className="text-[9px] uppercase text-slate-500 font-black tracking-[0.5em] font-mono mb-3">INTEGRITY_INDEX</p>
                       <p className="text-5xl font-black text-blue-400 font-mono tracking-tighter italic uppercase">Authenticated</p>
                   </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative group/telemetry">
                 <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/20 to-transparent rounded-[3rem] blur-sm opacity-50 group-hover/telemetry:opacity-100 transition-all" />
                 <div className="relative bg-slate-900/20 border border-white/10 p-12 rounded-[3.5rem] backdrop-blur-3xl shadow-inner min-h-[340px] flex flex-col justify-center overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Fingerprint size={120} />
                     </div>
                     <div className="space-y-10 relative z-10">
                         <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] font-mono italic">Overall_Readiness</h4>
                            <Zap size={16} className="text-blue-500 animate-bounce" />
                         </div>
                         <div className="flex items-baseline gap-4">
                            <span className="text-9xl font-black text-white font-mono tracking-tighter leading-none">{overallReadiness}</span>
                            <span className="text-3xl font-black text-slate-600 font-mono">%</span>
                         </div>
                         <div className="h-4 w-full bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${overallReadiness}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="space-y-1">
                               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Evidence_Nodes</span>
                               <p className="text-2xl font-black text-white font-mono tracking-tighter">{checkedEvidenceItems}/{totalEvidenceItems}</p>
                            </div>
                            <div className="space-y-1">
                               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono italic">Inquiry_Payload</span>
                               <p className="text-2xl font-black text-white font-mono tracking-tighter">{answeredQuestions}/{totalQuestions}</p>
                            </div>
                         </div>
                     </div>
                 </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-16">
        {/* INTERROGATORY_MATRIX */}
        <div className="lg:col-span-8 space-y-16">
          <div className="flex items-center justify-between mb-4 px-4">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 rounded-[2rem] bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-2xl">
                <Terminal size={28} />
              </div>
              <div>
                <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">Interrogatory Matrix</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold mt-1">Cross-Reference Verification Nodes</p>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <AnimatePresence mode="popLayout">
              {flagsWithQuestions.length > 0 ? (
                flagsWithQuestions.map((flag, i) => (
                  <motion.div 
                    key={flag.ruleId}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    className="group relative"
                  >
                    <div className="absolute -inset-px bg-gradient-to-br from-blue-500/20 to-transparent rounded-[3.5rem] opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                    <div className="relative bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 transition-all duration-700 flex flex-col shadow-2xl overflow-hidden min-h-[400px]">
                      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none select-none group-hover:scale-110 transition-transform duration-1000">
                         <span className="text-9xl font-black font-mono tracking-tighter italic">MOD_{flag.ruleId.split('_').pop()}</span>
                      </div>
                      
                      <div className="relative z-10 flex items-center justify-between mb-12">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-2xl font-mono font-black text-xs italic">
                            {flag.ruleId.split('_').pop()}
                          </div>
                          <div className="space-y-1">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono italic">Extraction_Node::{flag.ruleId}</span>
                             <h5 className="text-4xl font-black text-white italic tracking-tighter group-hover:text-blue-400 transition-colors uppercase font-mono leading-none">{flag.ruleName}</h5>
                          </div>
                        </div>
                        <div className="px-6 py-2 bg-black/40 rounded-full border border-white/5">
                           <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest font-mono italic animate-pulse">Awaiting_Data_Packet</span>
                        </div>
                      </div>

                      <div className="relative z-10 grid gap-10">
                        {flag.discoveryQuestions?.map((q, j) => (
                          <div key={j} className="space-y-6 relative group/q">
                            <div className="flex items-start gap-6">
                               <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-[10px] font-mono font-black text-slate-500 group-focus-within/q:text-blue-400 transition-colors shrink-0 mt-1">
                                  {String(j + 1).padStart(2, '0')}
                               </div>
                               <p className="text-2xl text-slate-400 font-medium italic leading-relaxed group-hover/q:text-slate-200 transition-colors pr-10">
                                  {q}
                                </p>
                            </div>
                            <div className="relative pl-16">
                              <textarea
                                value={discoveryAnswers[`${flag.ruleId}-${j}`] || ''}
                                onChange={(e) => setDiscoveryAnswers(prev => ({
                                  ...prev,
                                  [`${flag.ruleId}-${j}`]: e.target.value
                                }))}
                                placeholder="Ask a question about your report or violations..."
                                className="w-full bg-black/60 border border-white/5 rounded-[2.5rem] p-12 text-white placeholder:text-slate-800 focus:outline-none focus:border-slate-500/50 focus:ring-4 focus:ring-slate-500/10 transition-all font-mono italic text-xl min-h-[180px] resize-none shadow-inner"
                              />
                              <div className="absolute bottom-10 right-10 opacity-10 group-focus-within/q:opacity-100 transition-opacity">
                                 <Fingerprint size={32} className="text-blue-500" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-[4rem] p-32 text-center bg-slate-950/40 border border-white/5 shadow-2xl relative overflow-hidden group/empty">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent opacity-0 group-hover/empty:opacity-100 transition-opacity" />
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-emerald-500 shadow-inner border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <ShieldCheck size={40} />
                  </div>
                  <h3 className="text-4xl font-black text-white italic tracking-tighter font-mono uppercase mb-4">Optimization_Complete</h3>
                  <p className="text-xl text-slate-500 font-medium italic max-w-sm mx-auto">No further investigator input required for current structural dataset. The evidence manifest is verified sound.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* EVIDENCE_LOCKER_VAULT */}
        <div className="lg:col-span-4 space-y-16">
          <div className="space-y-4 px-4 text-right">
            <h4 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">Evidence_Vault</h4>
            <p className="text-[12px] text-slate-500 uppercase tracking-[0.4em] font-black font-mono">Physical_Asset_Validation</p>
          </div>

          <div className="sticky top-12 space-y-12">
            <div className="relative group/vault">
               <div className="absolute -inset-1 bg-gradient-to-b from-blue-500/20 to-transparent rounded-[4rem] blur-xl opacity-30 group-hover/vault:opacity-60 transition duration-700" />
               <div className="relative p-12 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-[3] -rotate-12 transition-transform group-hover/vault:rotate-0 duration-1000">
                    <FolderLock size={120} />
                  </div>

                  <div className="relative z-10 space-y-12 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                       <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-2xl transition-transform group-hover/vault:scale-110">
                          <Boxes size={32} />
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest font-mono block mb-1">Integrity_Hash</span>
                          <span className="text-[11px] font-mono text-slate-700 truncate max-w-[120px] block">0xFD82...E9A1</span>
                       </div>
                    </div>

                    <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar max-h-[500px]">
                      {suggestedEvidence.map((item, i) => (
                        <div 
                          key={i}
                          onClick={() => setDiscoveryAnswers(prev => ({
                            ...prev,
                            [`ev-${item}`]: prev[`ev-${item}`] === 'checked' ? '' : 'checked'
                          }))}
                          className={cn(
                            "p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer group/item flex items-center gap-6 overflow-hidden relative",
                            discoveryAnswers[`ev-${item}`] === 'checked'
                              ? "bg-blue-500/10 border-blue-500/40 shadow-blue-500/10"
                              : "bg-black/20 border-white/5 hover:border-white/10"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-700",
                            discoveryAnswers[`ev-${item}`] === 'checked'
                              ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] rotate-3"
                              : "bg-slate-950 border-white/10 text-transparent"
                          )}>
                            <ShieldCheck size={24} strokeWidth={3} />
                          </div>
                          <div className="flex-1">
                             <span className={cn(
                                "block text-xl font-black italic transition-colors uppercase tracking-tight leading-none mb-1",
                                discoveryAnswers[`ev-${item}`] === 'checked' ? "text-white" : "text-slate-500 group-hover/item:text-slate-300"
                              )}>
                                {item}
                              </span>
                              <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest font-black italic">Artifact_Secured</span>
                          </div>
                          {discoveryAnswers[`ev-${item}`] === 'checked' && (
                             <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-8 block">
                      <button 
                        onClick={() => setActiveTab('deltas')}
                        className="relative w-full group/final overflow-hidden rounded-[3rem] p-px bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-400"
                      >
                         <div className="relative flex items-center gap-6 p-10 rounded-[2.9rem] bg-slate-950 group-hover/final:bg-transparent transition-all duration-700 text-white shadow-4xl cursor-pointer">
                            <div className="flex-1 text-left">
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">Final_Protocol</span>
                              <span className="text-3xl font-black uppercase tracking-tighter font-mono italic leading-none">Assemble_Dossier</span>
                            </div>
                            <ArrowRight size={36} className="group-hover/final:translate-x-2 transition-transform duration-700" />
                         </div>
                      </button>
                    </div>
                  </div>
               </div>
            </div>

            {/* STRATEGIC_COUNCIL_BANNER */}
            <div className="p-12 rounded-[4rem] bg-gradient-to-br from-slate-900 to-black border border-white/5 relative overflow-hidden shadow-2xl group/banner">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <div className="relative z-10 flex items-center gap-10">
                   <div className="w-20 h-20 bg-blue-500/5 rounded-full flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-700">
                      <Activity size={32} className="text-blue-500 animate-pulse" />
                   </div>
                   <div className="space-y-2 flex-grow">
                      <h5 className="text-2xl font-black text-white italic uppercase tracking-tight">Mission_Trajectory_Variance</h5>
                      <p className="text-sm text-slate-500 font-medium italic max-w-lg leading-relaxed uppercase tracking-tight pr-10">
                         Data collection efficiency is indexed at <span className="text-blue-500">OPTIMAL</span>. Ensure all physical artifacts match digital metadata hashes before assembly.
                      </p>
                   </div>
                   <div className="text-right shrink-0">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest font-mono italic block mb-1">Hash_Reference</span>
                      <span className="text-xl font-black text-white font-mono tracking-tighter italic">0xAF...721</span>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryTab;
