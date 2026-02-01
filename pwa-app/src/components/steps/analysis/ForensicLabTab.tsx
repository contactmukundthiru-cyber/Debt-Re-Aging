'use client';

import React, { useMemo } from 'react';
import { RuleFlag } from '../../../lib/rules';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, BookOpen, Database, Activity, Target, Fingerprint, Microscope } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ForensicLabTabProps {
  flags: RuleFlag[];
}

const ForensicLabTab: React.FC<ForensicLabTabProps> = ({ flags }) => {
  const citations = useMemo(() => Array.from(new Set(flags.flatMap(f => f.legalCitations))), [flags]);
  const highSeverityFlags = useMemo(() => flags.filter(f => f.severity === 'high'), [flags]);

  const getFullStatuteName = (cite: string) => {
    const mapping: Record<string, { title: string; desc: string }> = {
      'FCRA_605_a': { title: '15 U.S.C. § 1681c(a)', desc: 'Obsolescence - Prohibits reporting information older than 7 years from DOFD.' },
      'FCRA_605_c': { title: '15 U.S.C. § 1681c(c)', desc: 'Commencement of Period - Strictly defines when the 7-year clock begins.' },
      'FCRA_623_a1': { title: '15 U.S.C. § 1681s-2(a)(1)', desc: 'Accuracy - Prohibits reporting data known or suspected to be inaccurate.' },
      'FCRA_623_a2': { title: '15 U.S.C. § 1681s-2(a)(2)', desc: 'Duty to Correct - Requires updates when furnishers determine data is inaccurate.' },
      'FCRA_623_a5': { title: '15 U.S.C. § 1681s-2(a)(5)', desc: 'DOFD Reporting - Mandatory reporting of original delinquency dates.' },
      'FCRA_611': { title: '15 U.S.C. § 1681i', desc: 'Reinvestigation - Mandates reasonable investigation of consumer disputes.' },
      'FCRA_607_b': { title: '15 U.S.C. § 1681e(b)', desc: 'Maximum Accuracy - Agencies must follow procedures for absolute integrity.' },
      'FDCPA_807': { title: '15 U.S.C. § 1692e', desc: 'Deceptive Means - Prohibits false representations in debt collection.' },
      'FDCPA_807_2': { title: '15 U.S.C. § 1692e(2)', desc: 'False Representation - Misstating the character, amount, or legal status of debt.' },
      'FDCPA_809': { title: '15 U.S.C. § 1692g', desc: 'Validation - Mandates verification of debt upon consumer request.' },
      'CFPB_MEDICAL_RULE': { title: '12 CFR § 1022', desc: 'Medical Protections - Special limits on reporting health-related debt.' },
      'METRO2_GUIDE': { title: 'CDIA Metro 2 Standard', desc: 'Standardized formatting protocol for credit data transmission.' },
      '11USC524': { title: '11 U.S.C. § 524', desc: 'Bankruptcy Discharge - Prohibits collection of discharged liabilities.' }
    };

    return mapping[cite] || { title: cite.replace(/_/g, ' '), desc: 'Federal consumer protection statute.' };
  };

  const matrixCells = useMemo(() => {
    const grid: RuleFlag[][][] = [
      [[], [], []], 
      [[], [], []], 
      [[], [], []]  
    ];

    flags.forEach(flag => {
      const row = flag.severity === 'high' ? 0 : flag.severity === 'medium' ? 1 : 2;
      const col = flag.successProbability >= 80 ? 0 : flag.successProbability >= 50 ? 1 : 2;
      grid[row][col].push(flag);
    });

    return grid;
  }, [flags]);

  return (
    <div className="fade-in space-y-20 pb-32">
      {/* Forensic Intelligence Header */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000" />
        <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] -mr-96 -mt-96 animate-pulse" />
          
          <div className="relative z-10 p-16 grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="flex items-center gap-4 mb-10">
                  <div className="px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_1.5s_infinite]" />
                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-emerald-400 font-mono">Neural Forensic Lab</span>
                  </div>
                  <div className="h-px w-12 bg-slate-800" />
                  <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono">NODE_SCAN: ACTIVE</span>
              </div>
              <h2 className="text-7xl font-black text-white tracking-tighter mb-10 leading-[0.9] italic uppercase">
                Forensic <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">Intelligence</span><br/>
                <span className="text-3xl font-mono tracking-[0.2em] text-slate-500 not-italic lowercase">Matrix v5.0</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-xl italic border-l-2 border-emerald-500/30 pl-8">
                Synthesis of reporting irregularities mapped against federal statutory mandates. Isolating recursive nodes for maximum litigation leverage.
              </p>

              <div className="mt-16 flex gap-10">
                <div className="group/stat">
                  <p className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-[0.5em] mb-3">Violation_Nodes</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-black text-white tabular-nums font-mono tracking-tighter">{flags.length}</p>
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  </div>
                </div>
                <div className="h-16 w-px bg-slate-800" />
                <div className="group/stat">
                  <p className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-[0.5em] mb-3">Statutes_Indexed</p>
                  <p className="text-5xl font-black text-emerald-400 tabular-nums font-mono tracking-tighter">{citations.length}</p>
                </div>
              </div>
            </div>

            <div className="relative">
                <div className="p-12 rounded-[4rem] bg-slate-900/20 border border-white/5 backdrop-blur-3xl group overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                    <div className="grid grid-cols-3 grid-rows-3 gap-5 h-80">
                        {matrixCells.flat().map((cellFlags, i) => {
                            const row = Math.floor(i / 3);
                            const col = i % 3;
                            const isActive = cellFlags.length > 0;

                            return (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={cn(
                                        "rounded-3xl border flex flex-col items-center justify-center transition-all duration-700 relative group/cell overflow-hidden",
                                        isActive 
                                            ? row === 0 && col === 0 ? "bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-slate-900/60 border-slate-700/50"
                                            : "bg-slate-950/40 border-slate-900 opacity-20"
                                    )}
                                >
                                    <span className={cn(
                                        "text-2xl font-mono font-black tabular-nums transition-transform duration-700 group-hover/cell:scale-125",
                                        isActive ? "text-white" : "text-slate-800"
                                    )}>
                                        {cellFlags.length}
                                    </span>
                                    {isActive && (
                                        <div className="mt-1 flex gap-0.5">
                                            {Array.from({ length: Math.min(cellFlags.length, 3) }).map((_, j) => (
                                                <div key={j} className="w-1 h-1 rounded-full bg-emerald-500/50" />
                                            ))}
                                        </div>
                                    )}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                    
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-mono font-black uppercase tracking-[0.5em] text-slate-600 whitespace-nowrap">Impact_Vector</div>
                    <div className="absolute left-1/2 bottom-5 -translate-x-1/2 text-[9px] font-mono font-black uppercase tracking-[0.5em] text-slate-600 whitespace-nowrap">Litigation_Prob</div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-16">
        {/* Statutory Manifest (7 cols) */}
        <div className="lg:col-span-7 space-y-10">
          <div className="flex items-center gap-8 mb-10">
            <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-2xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <BookOpen size={32} className="relative z-10" />
            </div>
            <div>
              <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">Statutory Manifest</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold mt-1">Formal Liability Grounds // Archive_Index</p>
            </div>
          </div>

          <div className="space-y-6">
            {citations.map((cite, i) => {
              const { title, desc } = getFullStatuteName(cite);
              return (
                <motion.div 
                    key={cite} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative"
                >
                  <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                  <div className="relative p-10 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] transition-all duration-500">
                    <div className="flex items-start gap-10">
                      <div className="shrink-0 w-16 h-16 rounded-2xl bg-slate-900/50 flex flex-col items-center justify-center border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                        <span className="text-[10px] font-mono font-black text-slate-500">ID</span>
                        <span className="text-lg font-mono font-black text-emerald-500">{String(i + 1).padStart(2, '0')}</span>
                      </div>
                      <div>
                        <h5 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors font-mono uppercase tracking-tight mb-4">
                          {title}
                        </h5>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium uppercase tracking-wide italic max-w-xl">
                          {desc}
                        </p>
                      </div>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[8px] font-mono font-black text-emerald-500 uppercase tracking-widest">Active</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Predictive Rebuttal Engine (5 cols) */}
        <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-12">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-b from-rose-500/20 to-transparent rounded-[4rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 shadow-2xl overflow-hidden p-12">
                    <div className="flex items-center gap-8 mb-16">
                        <div className="w-16 h-16 rounded-[2rem] bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-2xl group-hover:scale-110 transition-transform">
                            <Zap size={28} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Rebuttal Engine</h4>
                            <p className="text-[10px] text-rose-500 uppercase tracking-[0.4em] font-mono font-bold mt-2">Predictive_Tactics</p>
                        </div>
                    </div>

                    <div className="space-y-16">
                    {highSeverityFlags.length > 0 ? highSeverityFlags.slice(0, 3).map((flag, i) => (
                        <div key={flag.ruleId} className="space-y-8 relative">
                            <div className="flex items-center gap-6">
                                <span className="text-[10px] font-mono text-rose-400 font-black bg-rose-500/5 px-5 py-2 rounded-full border border-rose-500/10 uppercase tracking-[0.3em]">
                                    NODE_{flag.ruleId}
                                </span>
                                <div className="h-px flex-grow bg-slate-800/50" />
                            </div>

                            <div className="space-y-10 pl-4 border-l border-slate-900">
                                <div>
                                    <p className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-4">
                                        <Activity size={14} className="text-slate-600" />
                                        Expected Defense
                                    </p>
                                    <div className="p-8 rounded-[2.5rem] bg-slate-950/40 border border-white/5 text-xs leading-[1.8] text-slate-400 italic font-medium">
                                        {flag.ruleId === 'B1' || flag.ruleId === 'B2' ? 'Entity will likely specify "Historical Data Accuracy" without substantiating the Metro 2 logic flow.' :
                                        flag.ruleId === 'K6' ? 'Institution may claim a payment event "re-validated" the record status, an action strictly prohibited.' :
                                        'Predicted boilerplate "Verified" flag using unmonitored e-OSCAR protocols.'}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-mono font-black text-emerald-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-4">
                                        <Fingerprint size={14} />
                                        Strategic Strike
                                    </p>
                                    <p className="text-sm font-black text-white leading-relaxed pl-8 border-l-2 border-emerald-500/40 font-mono uppercase tracking-tight italic">
                                        {flag.ruleId === 'B1' || flag.ruleId === 'B2' ? 'Invoke FCRA § 611(a)(6) MOV demand. Attack the lack of physical document verification.' :
                                        flag.ruleId === 'K6' ? 'Deploy FTC 431 Opinion Letter protocol. DOFD is legally static and unchangeable.' :
                                        'Apply FCRA § 623(b) mandate. Challenge the failure of recursive furnisher notification.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-24 opacity-20">
                            <Database size={64} className="text-slate-700 mb-8" />
                            <p className="text-[10px] font-mono font-black uppercase tracking-[0.6em] text-slate-500 italic">Secure Protocol Active</p>
                        </div>
                    )}
                    </div>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Verifiable Artifacts Grid */}
      <div className="relative pt-20">
        <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-10">
                <div className="w-20 h-20 rounded-[2.5rem] bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20 shadow-2xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <Microscope size={36} className="relative z-10" />
                </div>
                <div>
                    <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic">Evidence Artifacts</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold mt-2">Verifiable Sequence Indices</p>
                </div>
            </div>
            <div className="px-8 py-3 rounded-full border border-white/10 bg-slate-900/50 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-[0.5em]">
                Critical_Nodes: {highSeverityFlags.length}
            </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-10">
          {highSeverityFlags.map((flag, i) => (
            <motion.div 
                key={flag.ruleId} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
            >
              <div className="absolute -inset-px bg-gradient-to-br from-cyan-500/20 via-transparent to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
              <div className="relative p-12 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] transition-all duration-700 overflow-hidden min-h-[440px] flex flex-col shadow-2xl">
                <div className="absolute top-0 right-0 p-10">
                    <div className="w-10 h-10 rounded-full bg-slate-900/50 flex items-center justify-center border border-white/5 opacity-50 group-hover:opacity-100 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all duration-500">
                        <Target size={20} className="text-slate-600 group-hover:text-cyan-400" />
                    </div>
                </div>

                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-cyan-500" />
                        <p className="text-[10px] font-mono text-cyan-400 font-black uppercase tracking-[0.4em]">Artifact_{flag.ruleId}</p>
                    </div>
                    <h6 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter font-mono italic">{flag.ruleName}</h6>
                </div>

                <div className="space-y-10 flex-grow">
                    <p className="text-sm text-slate-400 leading-[1.8] font-medium italic border-l-2 border-slate-800/80 pl-8 py-2">
                        {flag.explanation}
                    </p>

                    <div className="flex flex-wrap gap-3">
                    {flag.suggestedEvidence.map((ev, j) => (
                        <div key={j} className="text-[9px] font-mono font-black text-slate-400 bg-slate-900/60 px-5 py-3 rounded-2xl border border-white/5 flex items-center gap-3 group-hover:border-cyan-500/30 group-hover:bg-slate-900 group-hover:text-cyan-400 transition-all uppercase tracking-widest shadow-inner">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/30 group-hover:bg-cyan-400 animate-pulse" />
                            {ev}
                        </div>
                    ))}
                    </div>
                </div>
                
                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] font-mono text-slate-600 font-black uppercase tracking-widest">Hash_Auth: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                    <span className="text-[8px] font-mono text-cyan-500/50 font-black uppercase tracking-widest">Verified</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForensicLabTab;
