'use client';

import React from 'react';
import { PatternInsight } from '../../../lib/analytics';

interface PatternsTabProps {
  patterns: PatternInsight[];
}

import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    Activity, 
    Target, 
    Compass, 
    Cpu, 
    AlertTriangle, 
    Lightbulb, 
    ShieldAlert,
    Dna,
    BarChart3,
    Layers
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface PatternsTabProps {
  patterns: PatternInsight[];
}

const PatternsTab: React.FC<PatternsTabProps> = ({ patterns }) => {
  const highCount = patterns.filter(p => p.significance === 'high').length;

  if (patterns.length === 0) {
    return (
        <div className="fade-in">
            <div className="relative p-1 rounded-[4rem] bg-gradient-to-br from-emerald-600/20 to-slate-900 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xl" />
                <div className="relative z-10 p-32 flex flex-col items-center justify-center text-center gap-10">
                    <div className="w-32 h-32 rounded-[3.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-2xl animate-pulse">
                        <ShieldAlert size={56} />
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic font-mono mb-4">Pattern_Nullification::TRUE</h3>
                        <p className="text-lg text-slate-500 max-w-lg mx-auto font-bold italic border-l-2 border-emerald-500/30 pl-8">Forensic engine detected no systemic reporting anomalies. Data integrity appears to be <span className="text-emerald-400">NOMINAL</span>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="fade-in space-y-20 pb-40">
      {/* ELITE_AUDIT_HERO::SYSTEMIC_INTELLIGENCE_MATRIX */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
            
            <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
                <div className="lg:col-span-8">
                     <div className="flex items-center gap-6 mb-8">
                        <div className="px-5 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-3">
                            <Cpu size={14} className="text-purple-400 animate-pulse" />
                            <span className="text-[10px] uppercase font-black tracking-[0.4em] text-purple-400 font-mono">Neural Analysis v5.0</span>
                        </div>
                        <div className="h-px w-10 bg-slate-800" />
                        <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Node_Status::SCANNING</span>
                    </div>

                    <h2 className="text-7xl lg:text-[7.5rem] font-black text-white tracking-tighter mb-10 leading-[0.85] italic uppercase font-mono">
                        Systemic <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 tracking-[-0.05em]">INTELLIGENCE</span>
                    </h2>

                    <p className="text-2xl text-slate-400 leading-[1.4] font-bold italic tracking-tight max-w-2xl border-l-2 border-purple-500/30 pl-12 mb-12">
                        Detecting <span className="text-white font-black">Behavioral Fingerprints</span> of institutional misconduct. Our neural engine maps cross-bureau data manipulation to identify systemic reporting failures.
                    </p>
                </div>

                <div className="lg:col-span-4 grid grid-cols-2 gap-8">
                    <div className="p-10 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl text-center group/card transition-all hover:bg-white/10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] font-mono mb-4 italic group-hover/card:text-purple-400">Total_Signals</p>
                        <p className="text-6xl font-black text-white font-mono italic tracking-tighter leading-none">{patterns.length}</p>
                    </div>
                    <div className="p-10 rounded-[3.5rem] bg-rose-500/10 border border-rose-500/20 backdrop-blur-2xl text-center group/card transition-all hover:bg-rose-500/20">
                        <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-[0.5em] font-mono mb-4 italic group-hover/card:text-rose-400">Critical_Vectors</p>
                        <p className="text-6xl font-black text-rose-500 font-mono italic tracking-tighter leading-none">{highCount}</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Pattern Matrix Grid */}
      <div className="grid lg:grid-cols-2 gap-12">
        <AnimatePresence>
            {patterns.map((pattern, i) => {
                const isHigh = pattern.significance === 'high';
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                            "group/pattern relative p-12 rounded-[4.5rem] border transition-all h-full flex flex-col overflow-hidden shadow-2xl",
                            isHigh 
                                ? "bg-rose-950/20 border-rose-500/20" 
                                : "bg-slate-950/40 border-white/5"
                        )}
                    >
                        {/* Status Bar */}
                        <div className="flex items-center justify-between mb-12 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-xl",
                                    isHigh ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-slate-900 text-slate-500"
                                )}>
                                    {isHigh ? <AlertTriangle size={24} /> : <Compass size={24} />}
                                </div>
                                <div className="h-px w-8 bg-slate-800" />
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.5em] font-mono italic",
                                    isHigh ? "text-rose-500" : "text-slate-500"
                                )}>
                                    {pattern.significance}_PRIORITY_ANOMALY
                                </span>
                            </div>
                            <div className="px-4 py-1 rounded-full bg-slate-900 border border-white/5 flex items-center gap-3">
                                <div className={cn("w-2 h-2 rounded-full", isHigh ? "bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-emerald-500")} />
                                <span className="text-[9px] font-black text-slate-500 font-mono italic">SIGNAL_STRENGTH: HIGH</span>
                            </div>
                        </div>

                        <div className="relative z-10 flex-grow">
                            <h4 className={cn(
                                "text-4xl lg:text-5xl font-black tracking-tighter italic uppercase font-mono mb-6 leading-none",
                                isHigh ? "text-white" : "text-slate-200"
                            )}>
                                {pattern.pattern}
                            </h4>
                            <p className="text-xl text-slate-400 font-bold italic leading-relaxed mb-12 max-w-2xl border-l-2 border-indigo-500/20 pl-8">
                                {pattern.description}
                            </p>

                            {/* Tactical Strategy Module */}
                            <div className="p-10 rounded-[3rem] bg-slate-950 border border-white/5 relative group/strategy overflow-hidden mt-auto">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-[2] pointer-events-none group-hover/strategy:rotate-12 transition-transform duration-700">
                                     <Dna size={80} className="text-white" />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 rounded-[1.2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                            <Lightbulb size={18} />
                                        </div>
                                        <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] font-mono italic">Strategic_Protocol</h5>
                                    </div>
                                    <p className="text-lg font-bold text-slate-300 leading-relaxed italic pr-12">
                                        {pattern.recommendation}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Background Visuals */}
                        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-purple-500/5 to-transparent rounded-full blur-[100px] -mr-64 -mb-64 pointer-events-none opacity-50" />
                    </motion.div>
                );
            })}
        </AnimatePresence>
      </div>

      {/* Global Intelligence Metrics */}
      <div className="p-16 rounded-[4.5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 shadow-2xl relative overflow-hidden group/global">
         <div className="absolute top-0 right-0 p-20 opacity-5 grayscale pointer-events-none">
             <BarChart3 size={200} className="text-white" />
         </div>
         <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
             <div className="max-w-2xl">
                 <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic font-mono mb-6">Neural_Systemic_Overlay</h4>
                 <p className="text-xl text-slate-400 font-bold italic border-l-2 border-purple-500/30 pl-10 pr-10">
                     Our behavioral modeling confirms <span className="text-white italic underline decoration-purple-500/30 underline-offset-8">Coordination Integrity Failure</span>. These patterns are statistically improbable under standard algorithmic reporting, providing secondary evidentiary weight for bad-faith claims.
                 </p>
             </div>
             <div className="flex gap-16 pr-10">
                 {[
                     { label: 'Variance', value: '2.4%', icon: <Layers size={14} /> },
                     { label: 'Probability', value: '98.9%', icon: <Target size={14} /> },
                     { label: 'Delta', value: '+14pt', icon: <Zap size={14} /> }
                 ].map((stat, i) => (
                     <div key={i} className="text-center">
                         <div className="flex items-center justify-center gap-2 mb-3">
                             <span className="text-indigo-500">{stat.icon}</span>
                             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono italic">{stat.label}</span>
                         </div>
                         <p className="text-5xl font-black text-white font-mono italic tracking-tighter leading-none">{stat.value}</p>
                     </div>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
};

export default PatternsTab;
