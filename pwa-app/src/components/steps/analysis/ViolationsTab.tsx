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
  Target
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
    <div className="space-y-8">
      {/* Search & Filter - Institutional Grade */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-grow group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search forensic patterns, rules, or citations..."
            className="w-full pl-14 pr-6 py-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none dark:text-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-[24px] flex gap-1 border border-slate-200 dark:border-slate-800">
          {(['all', 'high', 'medium', 'low'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={cn(
                "px-6 py-3 rounded-[18px] text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
                filterSeverity === s
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-xl">
            <Scale size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Forensic Match Count</p>
            <p className="text-2xl font-bold dark:text-white tabular-nums">{filteredFlags.length} <span className="text-slate-400 text-lg font-medium">Potential Issues</span></p>
          </div>
        </div>
        
        <div className="hidden md:flex gap-3">
          {['high', 'medium', 'low'].map(severity => {
            const count = flags.filter(f => f.severity === severity).length;
            return (
              <div
                key={severity}
                className={cn(
                  "px-5 py-2.5 rounded-2xl border flex items-center gap-3 transition-all",
                  severity === 'high' ? "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400" :
                  severity === 'medium' ? "bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400" :
                  "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  severity === 'high' ? "bg-rose-500" : severity === 'medium' ? "bg-orange-500" : "bg-slate-400"
                )} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{severity}</span>
                <span className="font-bold tabular-nums text-sm">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Animated Violation Cards */}
      <div className="space-y-4">
        {filteredFlags.map((flag, i) => {
          const isExpanded = expandedCard === i;
          
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              layout
              className={cn(
                "rounded-[32px] transition-all duration-500 border overflow-hidden",
                isExpanded 
                  ? "bg-white dark:bg-slate-900 border-emerald-500/40 shadow-[0_32px_64px_-16px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20" 
                  : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900"
              )}
            >
              <div 
                className="p-8 cursor-pointer relative"
                onClick={() => setExpandedCard(isExpanded ? null : i)}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-5">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border",
                        flag.severity === 'high' ? "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/30 text-rose-600 dark:text-rose-400" :
                        flag.severity === 'medium' ? "bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/30 text-orange-600 dark:text-orange-400" :
                        "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
                      )}>
                        {flag.severity} RISK
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg">RULE::{flag.ruleId}</span>
                      
                      <div className="flex items-center gap-3 ml-auto pr-8">
                         <div className="text-right">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Success Factor</p>
                            <div className="flex items-center gap-2">
                               <div className="h-1 w-20 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${flag.successProbability}%` }}
                                    className={cn(
                                        "h-full transition-all duration-1000",
                                        flag.successProbability > 70 ? 'bg-emerald-500' : 'bg-orange-500'
                                    )}
                                 />
                               </div>
                               <span className="text-[10px] font-bold dark:text-white">{flag.successProbability}%</span>
                            </div>
                         </div>
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-bold dark:text-white mb-3 group-hover:text-emerald-500 transition-colors">
                      {flag.ruleName}
                    </h4>
                    <p className={cn(
                      "text-sm leading-relaxed text-slate-600 dark:text-slate-400 transition-all",
                      isExpanded ? "" : "line-clamp-2"
                    )}>
                      {flag.explanation}
                    </p>
                  </div>

                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0",
                    isExpanded ? "bg-emerald-500 text-white rotate-180" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}>
                    <ChevronDown size={20} />
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 space-y-10">
                        <div className="grid lg:grid-cols-2 gap-10">
                          {/* Left Column: Forensic Logic */}
                          <div className="space-y-8">
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <Info size={14} className="text-emerald-500" />
                                <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Strategic Impact</h5>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800">
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 italic">
                                  "{flag.whyItMatters}"
                                </p>
                              </div>
                            </div>

                            {flag.legalCitations.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <BookOpen size={14} className="text-indigo-500" />
                                  <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Institutional Foundation</h5>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {flag.legalCitations.map((cite, j) => (
                                    <span key={j} className="text-[10px] font-bold px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-xl border border-indigo-500/10">
                                      {cite}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Tactical Evidence */}
                          <div className="space-y-8">
                            {flag.suggestedEvidence.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <ClipboardList size={14} className="text-orange-500" />
                                  <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Verification Protocol</h5>
                                </div>
                                <div className="space-y-3">
                                  {flag.suggestedEvidence.map((e, j) => (
                                    <div key={j} className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                      <Zap size={14} className="text-emerald-500" />
                                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{e}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {flag.bureauTactics && Object.keys(flag.bureauTactics).length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <Target size={14} className="text-rose-500" />
                                  <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Execution Vector</h5>
                                </div>
                                <div className="space-y-3">
                                  {Object.entries(flag.bureauTactics).map(([bureau, tactic], j) => (
                                    <div key={j} className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2 block">{bureau} Target</span>
                                      <p className="text-xs text-slate-400 leading-relaxed font-mono italic">"{tactic}"</p>
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
      </div>
    </div>
  );
};

export default ViolationsTab;
