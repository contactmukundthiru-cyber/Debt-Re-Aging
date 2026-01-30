'use client';

import React from 'react';
import { RuleFlag } from '../../../lib/rules';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Scale, 
  ShieldCheck, 
  Zap, 
  ChevronDown,
  Info,
  BookOpen,
  ClipboardList,
  Target,
  Activity,
  Cpu,
  Fingerprint,
  Radiation,
  Boxes,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ViolationsTabProps {
  flags: RuleFlag[];
  expandedCard: number | null;
  setExpandedCard: (id: number | null) => void;
  translate: (key: string) => string;
}

const ViolationsTab: React.FC<ViolationsTabProps> = ({
  flags,
  expandedCard,
  setExpandedCard
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterSeverity, setFilterSeverity] = React.useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || flag.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  if (flags.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-50 dark:bg-slate-900/50 rounded-[40px] p-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800"
      >
        <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[32px] shadow-xl flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-12 h-12 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold dark:text-white mb-4 tracking-tight">Institutional Compliance Verified</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">No forensic violations detected. The data set aligns with standard reporting protocols, though manual auditing remains recommended for subtle depth-discrepancies.</p>
      </motion.div>
    );
  }

  return (
    <div className="fade-in space-y-12 pb-24">
      {/* SECTION_HEADER::VIOLATION_MATRIX */}
      <div className="relative p-12 bg-slate-950 rounded-[3rem] border border-white/10 shadow-3xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -ml-40 -mb-40" />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-12">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] font-mono">Forensic Violation Engine</span>
              </div>
              <div className="h-px w-24 bg-gradient-to-r from-emerald-500/50 to-transparent" />
            </div>

            <h2 className="text-6xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">
              Violation <span className="text-emerald-500">Matrix</span>
            </h2>
            
            <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-3xl">
              Mapping detected data variances against the statutory framework. Every entry here represents a <span className="text-white italic">HIGH-PROBABILITY LITIGATION VECTOR</span> or regulatory breach identified within the institutional record.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full xl:w-auto">
            <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl group/metric">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 font-mono">NODE_COUNT::01</p>
              <p className="text-5xl font-black text-white tabular-nums tracking-tighter font-mono">{flags.length}</p>
              <div className="h-1 w-full bg-slate-800 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>
            
            <div className="bg-rose-500/10 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-rose-500/20 shadow-2xl group/metric">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 font-mono">CRITICAL_VECTORS::02</p>
              <p className="text-5xl font-black text-rose-500 tabular-nums tracking-tighter font-mono">{flags.filter(f => f.severity === 'high').length}</p>
              <div className="h-1 w-full bg-rose-500/20 rounded-full mt-4 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(flags.filter(f => f.severity === 'high').length / Math.max(1, flags.length)) * 100}%` }}
                  className="h-full bg-rose-500" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH_AND_FILTER::CLINICAL_GRADE */}
      <div className="flex flex-col xl:flex-row gap-8">
        <div className="relative flex-grow group">
          <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
            <Search className="w-6 h-6 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search forensic patterns, rules, or citations..."
            className="w-full pl-20 pr-10 py-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20 backdrop-blur-xl text-lg focus:ring-[12px] focus:ring-emerald-500/5 transition-all outline-none dark:text-white shadow-2xl placeholder:text-slate-600 font-mono italic"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-900/50 p-2 rounded-[2.5rem] flex gap-2 border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-inner">
          {(['all', 'high', 'medium', 'low'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={cn(
                "px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden font-mono",
                filterSeverity === s
                  ? 'bg-slate-950 text-white shadow-2xl scale-105'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <span className="relative z-10">{s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ANIMATED_VIOLATION_MATRIX::DYNAMIC_GRID */}
      <div className="grid gap-10">
        <AnimatePresence mode="popLayout">
          {filteredFlags.map((flag, i) => {
            const isExpanded = expandedCard === i;
            
            return (
              <motion.div
                key={flag.ruleId + i}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "relative group rounded-[3.5rem] border transition-all duration-700 overflow-hidden",
                  isExpanded 
                    ? "bg-white dark:bg-slate-900 border-emerald-500/50 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.5)] ring-1 ring-emerald-500/20" 
                    : "bg-white dark:bg-slate-950/30 border-white/5 hover:border-white/20 hover:shadow-2xl hover:bg-slate-900/40"
                )}
              >
                <div 
                  className="p-10 xl:p-14 cursor-pointer relative"
                  onClick={() => setExpandedCard(isExpanded ? null : i)}
                >
                  {/* BACKGROUND_ARTIFACTS */}
                  {isExpanded && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -mr-64 -mt-64 animate-pulse" />
                      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] -ml-40 -mb-40" />
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
                    <div className="flex-1 space-y-8">
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full animate-pulse",
                            flag.severity === 'high' ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]" :
                            flag.severity === 'medium' ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]" :
                            "bg-slate-500"
                          )} />
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.4em] font-mono",
                            flag.severity === 'high' ? "text-rose-500" :
                            flag.severity === 'medium' ? "text-amber-500" :
                            "text-slate-500"
                          )}>
                             Risk_Level::{flag.severity}
                          </span>
                        </div>

                        <div className="h-4 w-px bg-white/10" />

                        <div className="flex items-center gap-3 px-5 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md shadow-sm">
                           <span className="text-[10px] font-mono font-black text-slate-400 tracking-widest leading-none">ID::{flag.ruleId}</span>
                        </div>

                        <div className="flex items-center gap-6 ml-auto lg:ml-0">
                           <div className="flex flex-col">
                              <div className="flex items-center gap-4">
                                 <div className="h-1.5 w-32 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                   <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${flag.successProbability}%` }}
                                      className={cn(
                                          "h-full relative",
                                          flag.successProbability > 75 ? 'bg-emerald-500' : 'bg-amber-500'
                                      )}
                                   />
                                 </div>
                                 <span className="text-xs font-black dark:text-white font-mono">{flag.successProbability}% PROBABILITY</span>
                              </div>
                           </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-4xl font-black dark:text-white group-hover:text-emerald-400 transition-colors tracking-tighter uppercase font-mono italic leading-none">
                          {flag.ruleName}
                        </h4>
                        <p className={cn(
                          "text-xl leading-relaxed text-slate-600 dark:text-slate-400 font-medium",
                          isExpanded ? "" : "line-clamp-1"
                        )}>
                          {flag.explanation}
                        </p>
                      </div>
                    </div>

                    <div className={cn(
                      "w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all shrink-0 border shadow-3xl",
                      isExpanded 
                        ? "bg-slate-950 text-white border-emerald-500/50 rotate-180" 
                        : "bg-white dark:bg-slate-950 text-slate-400 dark:border-white/10 group-hover:border-emerald-500/50 group-hover:text-emerald-500"
                    )}>
                      <ChevronDown size={32} strokeWidth={3} />
                    </div>
                  </div>

                  {/* EXPANDED_NODE_ANALYSIS */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-14 pt-14 border-t border-white/5 space-y-14 relative z-10">
                          <div className="grid lg:grid-cols-2 gap-12">
                            {/* FORENSIC_LOGIC_ENGINE */}
                            <div className="space-y-8">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                  <Fingerprint size={24} />
                                </div>
                                <div>
                                  <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 font-mono">Forensic Logic</h5>
                                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Cognitive Extraction</p>
                                </div>
                              </div>
                              
                              <div className="bg-slate-950/40 p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group/logic shadow-2xl">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-[2] rotate-12 transition-transform group-hover/logic:scale-[2.2]">
                                  <Radiation size={120} />
                                </div>
                                <p className="text-2xl leading-relaxed text-slate-300 font-bold italic relative z-10 tracking-tight">
                                  "{flag.whyItMatters}"
                                </p>
                              </div>

                              {flag.legalCitations.length > 0 && (
                                <div className="pt-6">
                                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 font-mono mb-6">Statutory_Framework</p>
                                  <div className="flex flex-wrap gap-3">
                                    {flag.legalCitations.map((cite, j) => (
                                      <span key={j} className="text-[11px] font-black px-6 py-3 bg-white/5 text-cyan-400 rounded-full border border-cyan-500/20 shadow-lg font-mono uppercase tracking-widest">
                                        {cite}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* TACTICAL_EVIDENCE_STREAM */}
                            <div className="space-y-8">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20">
                                  <Boxes size={24} />
                                </div>
                                <div>
                                  <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 font-mono">Tactical Evidence</h5>
                                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Manifest Assembly</p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                {flag.suggestedEvidence.map((item, j) => (
                                  <div key={j} className="flex items-center gap-6 p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors group/item shadow-xl">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 font-mono text-xs font-black">
                                      {j + 1}
                                    </div>
                                    <span className="text-base text-slate-300 font-medium">{item}</span>
                                    <CheckCircle2 className="w-5 h-5 ml-auto text-slate-700 group-hover/item:text-cyan-500 transition-colors" />
                                  </div>
                                ))}
                              </div>

                              {flag.bureauTactics && Object.keys(flag.bureauTactics).length > 0 && (
                                <div className="pt-8 space-y-6">
                                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 font-mono">Institutional_Countermeasures</p>
                                  <div className="grid gap-4">
                                    {Object.entries(flag.bureauTactics).map(([bureau, tactic], j) => (
                                      <div key={j} className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group/tactic">
                                        <div className="absolute top-0 right-0 px-6 py-3 bg-emerald-500/10 rounded-bl-3xl border-b border-l border-emerald-500/20">
                                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] font-mono">{bureau} Target</span>
                                        </div>
                                        <p className="text-lg text-slate-400 leading-relaxed font-mono italic pr-12 group-hover/tactic:text-slate-200 transition-colors">
                                          {tactic}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {filteredFlags.length === 0 && (
        <div className="py-40 text-center space-y-8 bg-slate-900/20 rounded-[4rem] border border-dashed border-white/10">
          <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
            <Search className="w-10 h-10 text-slate-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white uppercase font-mono tracking-tighter">No forensic matches</h3>
            <p className="text-slate-500 font-medium">No violations meet the current filter criteria.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationsTab;
