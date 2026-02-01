'use client';

import React from 'react';
import { CaseLaw } from '../../../lib/caselaw';
import { motion } from 'framer-motion';
import { Gavel, Scale, FileText, Search, Library, ExternalLink, ShieldCheck } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface CaseLawTabProps {
  relevantCaseLaw: CaseLaw[];
}

const CaseLawTab: React.FC<CaseLawTabProps> = ({ relevantCaseLaw }) => {
  if (relevantCaseLaw.length === 0) {
    return (
      <div className="relative p-1 rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl overflow-hidden shadow-2xl border border-white/5">
        <div className="relative z-10 p-32 text-center bg-slate-950/40 rounded-[3.8rem] backdrop-blur-3xl">
          <div className="w-32 h-32 mx-auto mb-10 rounded-[2.5rem] bg-slate-900 flex items-center justify-center border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Search className="w-12 h-12 text-slate-700 group-hover:text-blue-500 transition-colors relative z-10" />
          </div>
          <h3 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter italic font-mono">Precedent_Matrix::EMPTY</h3>
          <p className="text-slate-500 max-w-xl mx-auto font-black leading-relaxed uppercase text-[10px] tracking-[0.4em] font-mono italic">
            No specific legal precedents detected for current violation parameters. System is standing by for manual jurisprudential injection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-20 pb-40">
      {/* ELITE_AUDIT_HERO::JURISPRUDENTIAL_SIGNAL_MATRIX */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-br from-amber-600/20 via-orange-600/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
          
          <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-8">
               <div className="flex items-center gap-6 mb-12">
                  <div className="px-5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-3">
                      <Scale size={14} className="text-amber-400 animate-pulse" />
                      <span className="text-[10px] uppercase font-black tracking-[0.4em] text-amber-400 font-mono">Juris Matrix v5.0</span>
                  </div>
                  <div className="h-px w-10 bg-slate-800" />
                  <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Precedent_Index::ACTIVE</span>
              </div>

              <h2 className="text-7xl lg:text-[7.5rem] font-black text-white tracking-tighter mb-10 leading-[0.85] italic uppercase font-mono">
                Legal <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-600 tracking-[-0.05em]">PRECEDENT</span>
              </h2>
              
              <p className="text-2xl text-slate-400 leading-[1.4] font-bold italic tracking-tight max-w-3xl border-l-2 border-amber-500/30 pl-10">
                High-fidelity jurisprudential signals mapping <span className="text-white">federal court rulings</span> to active forensic findings. These precedents establish the mandatory liability standard for institutional accountability.
              </p>
            </div>

            <div className="lg:col-span-4 relative h-full">
               <div className="h-full bg-slate-900/30 backdrop-blur-3xl rounded-[4rem] border border-white/10 p-16 flex flex-col items-center justify-center shadow-inner group/indicator overflow-hidden min-h-[350px]">
                  <div className="absolute inset-0 opacity-[0.03] scale-[2.5] pointer-events-none group-hover/indicator:rotate-12 transition-transform duration-1000">
                    <Scale size={300} />
                  </div>
                  <div className="relative z-10 flex flex-col items-center">
                    <p className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.5em] mb-4">Nodes_Indexed</p>
                    <div className="flex flex-col items-center">
                       <span className="text-[10rem] font-black text-white leading-none tabular-nums tracking-tighter font-mono italic uppercase drop-shadow-2xl">{relevantCaseLaw.length}</span>
                       <div className="h-2 w-32 bg-amber-500/20 rounded-full overflow-hidden mt-6">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2 }}
                            className="h-full bg-amber-500 animate-pulse"
                          />
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Dossiers - High Density Forensic Layout */}
      <div className="grid grid-cols-1 gap-12">
        {relevantCaseLaw.map((law, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group/case relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 rounded-[4rem] blur-xl opacity-0 group-hover/case:opacity-100 transition duration-1000" />
            
            <div className="relative bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] overflow-hidden shadow-2xl p-16 group-hover/case:border-amber-500/20 transition-all duration-700">
                <div className="absolute top-0 left-0 w-3 h-full bg-gradient-to-b from-amber-500/40 via-orange-600/20 to-transparent opacity-30 group-hover/case:opacity-100 transition-opacity" />
                
                <div className="flex flex-col lg:flex-row gap-20 relative z-10">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-6 mb-12">
                            <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em] px-6 py-2.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 italic">
                                Precedent_Node::{String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="h-px w-12 bg-slate-800" />
                            <span className="text-[10px] font-mono font-black text-slate-700 uppercase tracking-[0.5em] italic">TYPE::FEDERAL_COMMAND</span>
                        </div>

                        <h4 className="text-5xl lg:text-6xl font-black text-white mb-6 group-hover/case:text-amber-400 transition-all tracking-tighter uppercase font-mono italic leading-[0.9]">
                            {law.case}
                        </h4>
                        
                        <div className="inline-flex items-center gap-4 px-6 py-3 bg-black/40 rounded-2xl border border-white/5 mb-16 shadow-inner group-hover/case:border-amber-500/20 transition-colors">
                            <Library size={14} className="text-amber-500" />
                            <p className="text-[11px] font-mono font-black text-slate-400 tracking-widest uppercase italic">{law.citation}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-16">
                          <div className="space-y-6">
                            <div className="flex items-center gap-4 text-slate-600 font-mono text-[10px] font-black uppercase tracking-[0.4em] italic group-hover/case:text-emerald-500 transition-colors">
                                <ShieldCheck size={16} className="text-emerald-500" />
                                Applicability_Vector
                            </div>
                            <p className="text-xl text-slate-400 leading-relaxed font-bold italic border-l-2 border-white/10 pl-10 group-hover/case:text-slate-200 transition-colors">
                                {law.relevance}
                            </p>
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-center gap-4 text-slate-600 font-mono text-[10px] font-black uppercase tracking-[0.4em] italic group-hover/case:text-amber-500 transition-colors">
                                <Gavel size={16} className="text-amber-500" />
                                Hardened_Ruling
                            </div>
                            <div className="p-10 rounded-[3rem] bg-black/40 border border-white/5 relative group/ruling overflow-hidden shadow-inner group-hover/case:bg-black/60 transition-all">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/case:opacity-[0.08] transition-opacity">
                                    <Scale size={100} className="text-amber-500" />
                                </div>
                                <p className="text-2xl italic text-slate-300 leading-relaxed relative z-10 font-bold tracking-tight">
                                  "{law.ruling}"
                                </p>
                            </div>
                          </div>
                        </div>
                    </div>

                    <div className="lg:w-64 flex lg:flex-col items-center justify-center gap-12 lg:border-l lg:border-white/5 lg:pl-16">
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-24 h-24 rounded-[2.5rem] bg-slate-900 flex items-center justify-center border border-white/10 shadow-2xl group-hover/case:border-amber-500/30 transition-all duration-500 cursor-pointer"
                        >
                          <FileText className="w-10 h-10 text-slate-600 group-hover/case:text-amber-500 transition-colors" />
                        </motion.div>
                        <div className="flex flex-col items-center gap-4">
                             <button 
                                title="View Full Case Dossier"
                                aria-label="View Full Case Dossier"
                                className="p-5 rounded-2xl bg-white/5 hover:bg-amber-500 border border-white/5 text-slate-400 hover:text-slate-950 transition-all duration-500 shadow-xl group/btn"
                             >
                                <ExternalLink size={24} className="group-hover/btn:scale-110 transition-transform" />
                             </button>
                             <span className="text-[9px] font-mono font-black text-slate-700 uppercase tracking-[0.5em] mt-2 italic group-hover/case:text-slate-400 transition-colors">View_Full_Dossier</span>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-16 rounded-[4rem] bg-slate-950/20 border-2 border-dashed border-white/5 text-center group active:scale-95 transition-transform">
        <p className="text-[11px] font-mono font-black text-slate-700 uppercase tracking-[0.6em] italic group-hover:text-amber-500 transition-colors">
            Institutional_Jurisprudence_Update_Scheduled::T-MINUS_04:00:00
        </p>
      </div>
    </div>
  );
};

export default CaseLawTab;
