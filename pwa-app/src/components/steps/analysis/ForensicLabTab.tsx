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
    <div className="fade-in space-y-12 pb-32">
      {/* Forensic Intelligence Header */}
      <div className="relative p-1 rounded-[3rem] bg-gradient-to-b from-slate-800 to-slate-950 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay"></div>
        <div className="relative z-10 p-12 bg-slate-950/90 rounded-[2.8rem] backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] -mr-80 -mt-80" />
          
          <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-4 mb-8">
                  <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_2s_infinite]" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-emerald-500 font-mono">Neural Forensic Lab // V5.1</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500 font-mono">Status: ACTIVE_SCAN</span>
              </div>
              <h2 className="text-6xl font-black text-white tracking-tight mb-8 leading-[1.1]">
                Forensic <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">Intelligence Matrix</span>
              </h2>
              <p className="text-slate-400 text-xl leading-relaxed font-light max-w-xl">
                Hyper-accurate synthesis of reporting irregularities mapped against federal statutory mandates. This module isolates the critical nodes for litigation leverage.
              </p>

              <div className="mt-12 flex gap-6">
                <div className="px-8 py-5 rounded-[2rem] bg-slate-900/50 border border-slate-800 backdrop-blur-md">
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">Violation Nodes</p>
                  <p className="text-4xl font-black text-white tabular-nums font-mono">{flags.length}</p>
                </div>
                <div className="px-8 py-5 rounded-[2rem] bg-slate-900/50 border border-slate-800 backdrop-blur-md">
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">Statutes Indexed</p>
                  <p className="text-4xl font-black text-emerald-400 tabular-nums font-mono">{citations.length}</p>
                </div>
              </div>
            </div>

            <div className="relative">
                <div className="p-10 rounded-[3rem] bg-slate-900/40 border border-slate-800 backdrop-blur-xl group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                    <div className="grid grid-cols-3 grid-rows-3 gap-4 h-72">
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
                                        "rounded-2xl border flex items-center justify-center transition-all duration-500 relative group/cell",
                                        isActive 
                                            ? row === 0 && col === 0 ? "bg-emerald-500/20 border-emerald-500/40" : "bg-slate-800/80 border-slate-700 shadow-xl"
                                            : "bg-slate-950/40 border-slate-900 opacity-40"
                                    )}
                                >
                                    <span className={cn(
                                        "text-xl font-mono font-black tabular-nums",
                                        isActive ? "text-white" : "text-slate-800"
                                    )}>
                                        {cellFlags.length}
                                    </span>
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-500/0 group-hover/cell:ring-emerald-500/30 transition-all duration-500" />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                    
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[8px] font-mono font-bold uppercase tracking-[0.4em] text-slate-600 whitespace-nowrap">Impact Analysis</div>
                    <div className="absolute left-1/2 bottom-5 -translate-x-1/2 text-[8px] font-mono font-bold uppercase tracking-[0.4em] text-slate-600 whitespace-nowrap">Litigation Prob.</div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Statutory Manifest (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-2xl">
              <BookOpen size={28} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-white uppercase tracking-tight">Statutory Manifest</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-mono">Formal Liability Grounds</p>
            </div>
          </div>

          <div className="grid gap-6">
            {citations.map((cite, i) => {
              const { title, desc } = getFullStatuteName(cite);
              return (
                <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group p-1 rounded-[2rem] bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/80 transition-all duration-500"
                >
                  <div className="flex items-start gap-8 p-8">
                    <div className="shrink-0 w-16 h-16 rounded-2xl bg-slate-950 flex flex-col items-center justify-center border border-slate-800 group-hover:border-emerald-500/30 transition-colors">
                      <span className="text-xs font-mono font-bold text-slate-600">ID:{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <div>
                      <h5 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors font-mono uppercase truncate mb-3">
                        {title}
                      </h5>
                      <p className="text-sm text-slate-400 leading-relaxed font-medium uppercase text-[11px] tracking-tight">
                        {desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Predictive Rebuttal Engine (5 cols) */}
        <div className="lg:col-span-5">
            <div className="sticky top-12 space-y-8">
              <div className="p-1 rounded-[3rem] bg-gradient-to-b from-rose-500/20 to-slate-950 overflow-hidden shadow-2xl">
                <div className="relative p-12 bg-slate-950/90 rounded-[2.8rem] border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-6 mb-12">
                        <div className="w-16 h-16 rounded-[2rem] bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-2xl">
                            <Zap size={28} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight">Rebuttal Engine</h4>
                            <p className="text-[10px] text-rose-500 uppercase tracking-[0.3em] font-mono">Predictive Intel</p>
                        </div>
                    </div>

                    <div className="space-y-12">
                    {highSeverityFlags.length > 0 ? highSeverityFlags.slice(0, 3).map((flag, i) => (
                        <div key={i} className="space-y-6 relative">
                            <div className="flex items-center gap-4">
                                <span className="text-[9px] font-mono text-rose-400 font-black bg-rose-500/5 px-4 py-1.5 rounded-full border border-rose-500/10 uppercase tracking-widest">
                                    NODE_{flag.ruleId}
                                </span>
                                <div className="h-px flex-grow bg-slate-800" />
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.3em] mb-3 flex items-center gap-3">
                                        <Activity size={12} className="text-slate-700" />
                                        Expected Defense
                                    </p>
                                    <div className="p-6 rounded-[2rem] bg-slate-900/40 border border-slate-800 text-xs leading-[1.8] text-slate-300 italic">
                                        {flag.ruleId === 'B1' || flag.ruleId === 'B2' ? 'Entity will likely specify "Historical Data Accuracy" without substantiating the Metro 2 logic flow.' :
                                        flag.ruleId === 'K6' ? 'Institution may claim a payment event "re-validated" the record status, an action strictly prohibited.' :
                                        'Predicted boilerplate "Verified" flag using unmonitored e-OSCAR protocols.'}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-[0.3em] mb-3 flex items-center gap-3">
                                        <Fingerprint size={12} />
                                        Strategic Strike
                                    </p>
                                    <p className="text-sm font-black text-white leading-relaxed pl-6 border-l-2 border-emerald-500/40 font-mono uppercase tracking-tight">
                                        {flag.ruleId === 'B1' || flag.ruleId === 'B2' ? 'Invoke FCRA § 611(a)(6) MOV demand. Attack the lack of physical document verification.' :
                                        flag.ruleId === 'K6' ? 'Deploy FTC 431 Opinion Letter protocol. DOFD is legally static and unchangeable.' :
                                        'Apply FCRA § 623(b) mandate. Challenge the failure of recursive furnisher notification.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                            <Database size={48} className="text-slate-700 mb-6" />
                            <p className="text-[10px] font-mono font-black uppercase tracking-[0.5em] text-slate-600">Secure Protocol Active</p>
                        </div>
                    )}
                    </div>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Verifiable Artifacts Grid */}
      <div className="relative pt-12">
        <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[2rem] bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20 shadow-2xl">
                    <Microscope size={28} />
                </div>
                <div>
                    <h4 className="text-2xl font-black text-white uppercase tracking-tight">Evidence Artifacts</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-mono">Verifiable Data Points</p>
                </div>
            </div>
            <div className="px-6 py-2 rounded-full border border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Nodes: {highSeverityFlags.length}
            </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
          {highSeverityFlags.map((flag, i) => (
            <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-1 rounded-[2.5rem] bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <Target size={20} className="text-slate-800 group-hover:text-emerald-500/50 transition-colors" />
              </div>

              <div className="p-10">
                <div className="mb-8">
                    <p className="text-[9px] font-mono text-emerald-500 font-black mb-3 uppercase tracking-widest">Artifact {flag.ruleId}</p>
                    <h6 className="text-lg font-black text-white leading-tight uppercase tracking-tight font-mono">{flag.ruleName}</h6>
                </div>

                <div className="space-y-8">
                    <p className="text-xs text-slate-400 leading-relaxed font-medium italic border-l border-slate-800 pl-6">
                    "{flag.explanation}"
                    </p>

                    <div className="flex flex-wrap gap-2">
                    {flag.suggestedEvidence.map((ev, j) => (
                        <span key={j} className="text-[8px] font-mono font-bold text-slate-500 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3 group-hover:border-emerald-500/20 transition-all uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                        {ev}
                        </span>
                    ))}
                    </div>
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
