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
      <div className="relative p-1 rounded-[3rem] bg-gradient-to-b from-slate-800 to-slate-950 overflow-hidden shadow-2xl">
        <div className="relative z-10 p-20 text-center bg-slate-950/90 rounded-[2.8rem] backdrop-blur-xl border border-white/5">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
            <Search className="w-10 h-10 text-slate-700" />
          </div>
          <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Precedent Matrix Empty</h3>
          <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed uppercase text-[10px] tracking-[0.2em]">
            No specific legal precedents detected for current violation parameters. System is standing by for manual jurisprudential injection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-12 pb-32">
      {/* Jurisprudential Signal Header */}
      <div className="relative p-1 rounded-[3rem] bg-gradient-to-b from-slate-800 to-slate-950 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay"></div>
        <div className="relative z-10 p-12 bg-slate-950/90 rounded-[2.8rem] backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] -mr-80 -mt-80" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
                  <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-amber-500 font-mono">Matrix ID: JURIS-X</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500 font-mono">Status: INDEXED</span>
              </div>
              <h2 className="text-6xl font-black text-white tracking-tight mb-8 leading-[1.1]">
                Institutional <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500">Precedent Matrix</span>
              </h2>
              <p className="text-slate-400 text-xl leading-relaxed font-light">
                High-fidelity jurisprudential signals mapping federal court rulings to active forensic findings. These precedents establish the mandatory liability standard.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-10 rounded-full bg-slate-900 border border-slate-800 shadow-inner min-w-[200px] h-[200px] relative">
              <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full border-t-amber-500 animate-[spin_10s_linear_infinite]" />
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 relative z-10">Nodes Found</p>
              <p className="text-6xl font-black tabular-nums text-white relative z-10 font-mono tracking-tighter">{relevantCaseLaw.length}</p>
              <div className="mt-2 text-[8px] font-mono text-amber-500/60 uppercase tracking-[0.3em]">Precision Ver. 01</div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Dossiers */}
      <div className="grid grid-cols-1 gap-8">
        {relevantCaseLaw.map((law, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0 rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            
            <div className="relative p-10 bg-slate-950 border border-slate-800/80 rounded-[2.5rem] overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500/50 to-orange-600/50" />
                
                <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-4 mb-8">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] px-4 py-1.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                                Institutional Precedent #{String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Type: FEDERAL_RULING</span>
                        </div>

                        <h4 className="text-3xl font-black text-white mb-3 group-hover:text-amber-400 transition-colors uppercase tracking-tight">
                            {law.case}
                        </h4>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 mb-10">
                            <Library size={12} className="text-slate-500" />
                            <p className="text-xs font-mono font-bold text-slate-400 tracking-tighter">{law.citation}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                Forensic Applicability
                            </div>
                            <p className="text-slate-400 text-sm leading-[1.8] font-medium border-l border-slate-800 pl-6">
                                {law.relevance}
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                                <Gavel size={14} className="text-amber-500" />
                                Hardened Ruling
                            </div>
                            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 relative group/ruling overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Scale size={40} className="text-amber-500" />
                                </div>
                                <p className="text-base italic text-slate-300 leading-relaxed relative z-10 font-serif">
                                  "{law.ruling}"
                                </p>
                            </div>
                          </div>
                        </div>
                    </div>

                    <div className="lg:w-48 flex lg:flex-col items-center justify-center gap-8 lg:border-l lg:border-slate-800/50 lg:pl-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center border border-slate-800 shadow-2xl group-hover:border-amber-500/50 transition-colors">
                          <FileText className="w-8 h-8 text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                             <button className="p-3 rounded-xl bg-slate-800 hover:bg-amber-500 text-slate-400 hover:text-white transition-all transform hover:scale-110">
                                <ExternalLink size={18} />
                             </button>
                             <span className="text-[8px] font-mono text-slate-600 uppercase tracking-[0.4em] mt-2">Access Node</span>
                        </div>
                    </div>
                </div>
                
                {/* Background Pattern */}
                <div className="absolute bottom-0 right-0 opacity-[0.02] pointer-events-none transform translate-x-1/4 translate-y-1/4">
                    <Scale size={300} strokeWidth={1} />
                </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-12 rounded-[3rem] bg-slate-900/30 border border-slate-800 border-dashed text-center">
        <p className="text-xs font-mono text-slate-600 uppercase tracking-[0.4em]">
            Institutional Jurisprudence Update Scheduled: T-MINUS 04:00:00
        </p>
      </div>
    </div>
  );
};

export default CaseLawTab;
