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
  CheckCircle2,
  Workflow,
  ShieldAlert,
  GanttChartSquare,
  Network
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ViolationsTabProps {
  flags: RuleFlag[];
  expandedCard: number | null;
  setExpandedCard: (id: number | null) => void;
  translate: (key: string) => string;
}

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

  const highCount = flags.filter(f => f.severity === 'high').length;
  const medCount = flags.filter(f => f.severity === 'medium').length;
  const lowCount = flags.filter(f => f.severity === 'low').length;

  const SeveritySpectrum = () => (
    <div className="flex w-full h-4 rounded-full overflow-hidden bg-slate-900 border border-white/5 shadow-inner mt-10">
      <motion.div initial={{ width: 0 }} animate={{ width: `${(highCount / flags.length) * 100}%` }} className="bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
      <motion.div initial={{ width: 0 }} animate={{ width: `${(medCount / flags.length) * 100}%` }} className="bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
      <motion.div initial={{ width: 0 }} animate={{ width: `${(lowCount / flags.length) * 100}%` }} className="bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
    </div>
  );

  if (flags.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] p-32 text-center border border-white/5 shadow-3xl"
      >
        <div className="w-32 h-32 bg-emerald-500/10 rounded-[3rem] shadow-2xl flex items-center justify-center mx-auto mb-10 border border-emerald-500/20">
          <ShieldCheck className="w-16 h-16 text-emerald-500" />
        </div>
        <h3 className="text-4xl font-black text-white mb-6 tracking-tight uppercase font-mono italic">Compliance_Verified</h3>
        <p className="text-slate-400 text-xl max-w-xl mx-auto leading-relaxed font-medium">
          No forensic violations detected. The data set aligns with institutional reporting protocols. <span className="text-emerald-500/80">Structural integrity confirmed.</span>
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-16 pb-32">
      {/* SECTION_HEADER::PRO_ANALYSIS_MATRIX */}
      <div className="relative p-16 bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 shadow-3xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-[160px] -mr-96 -mt-96" />
        
        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-16">
          <div className="flex-1 space-y-8">
            <div className="flex items-center gap-5">
              <div className="flex -space-x-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl">
                    <Workflow className="w-5 h-5 text-emerald-500/60" />
                  </div>
                ))}
              </div>
              <div className="h-px w-32 bg-gradient-to-r from-white/10 to-transparent" />
              <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.6em] font-mono italic">Institutional_Audit_Engine</span>
            </div>

            <div className="space-y-4">
               <h2 className="text-7xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">
                 Violation <span className="text-slate-600">Matrix</span>
               </h2>
               <p className="text-2xl text-slate-400 font-medium leading-relaxed max-w-4xl italic">
                 Mapping detected data variances against the statutory framework. Every entry here represents a <span className="text-white">LITIGATION_VECTOR</span> or regulatory breach identified within the legacy record.
               </p>
               
               <SeveritySpectrum />
               <div className="flex justify-between mt-4">
                  <span className="text-[10px] font-mono text-rose-500 uppercase tracking-widest font-bold">{highCount} Critical</span>
                  <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">{medCount} Warning</span>
                  <span className="text-[10px] font-mono text-blue-500 uppercase tracking-widest font-bold">{lowCount} Minor</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 w-full xl:w-[500px] shrink-0">
             <div className="bg-slate-950/80 p-10 rounded-[3rem] border border-white/5 shadow-4xl group/metric relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] scale-150 rotate-12">
                   <Network size={100} />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 font-mono">NODE_COUNT</p>
                <div className="flex items-baseline gap-3">
                   <p className="text-7xl font-black text-white tabular-nums tracking-tighter font-mono">{flags.length}</p>
                   <span className="text-emerald-500 text-sm font-bold font-mono">ACTV</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full mt-6 overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" 
                  />
                </div>
             </div>

             <div className="bg-slate-950/80 p-10 rounded-[3rem] border border-white/5 shadow-4xl group/metric relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] scale-150 rotate-12">
                   <ShieldAlert size={100} />
                </div>
                <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest mb-4 font-mono">PRIORITY_EXP</p>
                <div className="flex items-baseline gap-3">
                   <p className="text-7xl font-black text-rose-500 tabular-nums tracking-tighter font-mono">{flags.filter(f => f.severity === 'high').length}</p>
                   <span className="text-rose-600/50 text-sm font-bold font-mono">CRIT</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full mt-6 overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(flags.filter(f => f.severity === 'high').length / Math.max(1, flags.length)) * 100}%` }}
                    className="h-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" 
                  />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* SEARCH_AND_CONTROL::APPLE_REFINEMENT */}
      <div className="grid xl:grid-cols-12 gap-8 items-center px-4">
        <div className="xl:col-span-8 relative group">
          <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
            <Search className="w-7 h-7 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search forensic patterns, rules, or citations..."
            className="w-full pl-24 pr-12 py-10 rounded-[3rem] border border-white/5 bg-slate-950/20 backdrop-blur-3xl text-xl focus:ring-[15px] focus:ring-slate-500/10 focus:border-slate-500/30 transition-all outline-none text-white shadow-4xl placeholder:text-slate-700 font-mono italic"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="xl:col-span-4 bg-slate-950/40 p-3 rounded-[3rem] flex gap-3 border border-white/5 shadow-4xl backdrop-blur-3xl">
          {(['all', 'high', 'medium', 'low'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={cn(
                "flex-1 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden font-mono",
                filterSeverity === s
                  ? 'bg-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-400/50'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ANIMATED_VIOLATION_MATRIX::ELITE_PROTOCOLS */}
      <div className="grid gap-12">
        <AnimatePresence mode="popLayout">
          {filteredFlags.map((flag, i) => {
            const isExpanded = expandedCard === i;
            
            return (
              <motion.div
                key={flag.ruleId + i}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                className={cn(
                  "relative group rounded-[4rem] border transition-all duration-700 overflow-hidden",
                  isExpanded 
                    ? "bg-slate-900 border-white/20 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.7)] ring-1 ring-white/10" 
                    : "bg-slate-950/20 border-white/5 hover:border-white/10 hover:shadow-4xl"
                )}
              >
                <div 
                  className="p-12 xl:p-16 cursor-pointer relative"
                  onClick={() => setExpandedCard(isExpanded ? null : i)}
                >
                  {/* BACKGROUND_ARTIFACTS */}
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className={cn(
                        "absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] -mr-80 -mt-80 transition-colors duration-1000",
                        flag.severity === 'high' ? 'bg-rose-500/10' : flag.severity === 'medium' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                    )} />
                  </div>

                  <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-16">
                    <div className="flex-1 space-y-10">
                      <div className="flex flex-wrap items-center gap-8">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-4 h-4 rounded-full shadow-2xl",
                            flag.severity === 'high' ? "bg-rose-500 shadow-rose-500/50" :
                            flag.severity === 'medium' ? "bg-amber-500 shadow-amber-500/50" :
                            "bg-emerald-500 shadow-emerald-500/50"
                          )} />
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.5em] font-mono italic",
                            flag.severity === 'high' ? "text-rose-500" :
                            flag.severity === 'medium' ? "text-amber-500" :
                            "text-emerald-500"
                          )}>
                             RISK_NODE::{flag.severity}
                          </span>
                        </div>

                        <div className="h-4 w-px bg-white/10" />

                        <div className="px-6 py-2 bg-slate-900 rounded-2xl border border-white/5 shadow-inner">
                           <span className="text-[10px] font-mono font-black text-slate-500 tracking-widest uppercase">VECTOR_ID::{flag.ruleId}</span>
                        </div>

                        <div className="flex items-center gap-8 ml-auto xl:ml-0">
                           <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-5">
                                 <div className="h-2 w-48 bg-black rounded-full overflow-hidden border border-white/5">
                                   <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${flag.successProbability}%` }}
                                      className={cn(
                                          "h-full relative",
                                          flag.successProbability > 75 ? 'bg-emerald-500' : 'bg-amber-400'
                                      )}
                                   />
                                 </div>
                                 <span className="text-[11px] font-black text-white font-mono">{flag.successProbability}%_PROBABILITY</span>
                              </div>
                           </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <h4 className="text-5xl font-black text-white group-hover:text-emerald-500 transition-colors tracking-tighter uppercase font-mono italic leading-none">
                          {flag.ruleName}
                        </h4>
                        <p className={cn(
                          "text-2xl leading-relaxed text-slate-500 font-medium italic",
                          isExpanded ? "" : "line-clamp-1"
                        )}>
                          {flag.explanation}
                        </p>
                      </div>
                    </div>

                    <div className={cn(
                      "w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all shrink-0 border-2 shadow-4xl",
                      isExpanded 
                        ? "bg-emerald-600 text-white border-emerald-400 rotate-180" 
                        : "bg-slate-950 text-slate-600 border-white/5 group-hover:border-emerald-500/50 group-hover:text-emerald-500"
                    )}>
                      <ChevronDown size={32} strokeWidth={4} />
                    </div>
                  </div>

                  {/* EXPANDED_NODE_ANALYSIS */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-16 pt-16 border-t border-white/5 space-y-16 relative z-10">
                          <div className="grid xl:grid-cols-2 gap-16">
                            {/* FORENSIC_LOGIC_STREAM */}
                            <div className="space-y-10">
                              <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-2xl">
                                  <Fingerprint size={28} />
                                </div>
                                <div className="space-y-1">
                                  <h5 className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-500 font-mono italic">Forensic_Logic</h5>
                                  <p className="text-xs text-slate-600 font-black uppercase tracking-widest font-mono">Cognitive Extraction Matrix</p>
                                </div>
                              </div>
                              
                              <div className="bg-black/50 p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden group/logic shadow-inner">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] scale-150 rotate-12">
                                  <Radiation size={150} />
                                </div>
                                <p className="text-3xl leading-relaxed text-slate-300 font-black italic relative z-10 tracking-tight leading-tight">
                                  "{flag.whyItMatters}"
                                </p>
                              </div>

                              {flag.legalCitations.length > 0 && (
                                <div className="pt-8 space-y-6">
                                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 font-mono italic">Statutory_Framework_Manifest</p>
                                  <div className="grid gap-4">
                                    {flag.legalCitations.map((cite, j) => {
                                      const statute = getFullStatuteName(cite);
                                      return (
                                        <div key={j} className="p-8 rounded-[2.5rem] bg-slate-900 border border-cyan-500/20 shadow-4xl group/statute hover:bg-slate-800 transition-all">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-[14px] font-black text-cyan-400 font-mono uppercase tracking-[0.2em] italic">
                                              {statute.title}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-600 uppercase font-black">{cite}</span>
                                          </div>
                                          <p className="text-sm text-slate-500 italic leading-relaxed group-hover/statute:text-slate-300 transition-colors">
                                            {statute.desc}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* TACTICAL_EVIDENCE_STREAM */}
                            <div className="space-y-10">
                              <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20 shadow-2xl">
                                  <Boxes size={28} />
                                </div>
                                <div className="space-y-1">
                                  <h5 className="text-[11px] font-black uppercase tracking-[0.5em] text-cyan-500 font-mono italic">Tactical_Evidence</h5>
                                  <p className="text-xs text-slate-600 font-black uppercase tracking-widest font-mono">Discovery Loadouts</p>
                                </div>
                              </div>

                              <div className="grid gap-4">
                                {flag.suggestedEvidence.map((item, j) => (
                                  <div key={j} className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-slate-950/50 border border-white/5 hover:border-cyan-500/30 transition-all group/item shadow-xl hover:shadow-cyan-500/5">
                                    <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-cyan-500 font-mono text-sm font-black shadow-inner">
                                      {j + 1}
                                    </div>
                                    <span className="text-xl text-slate-400 font-medium italic group-hover:text-white transition-colors">{item}</span>
                                    <CheckCircle2 className="w-6 h-6 ml-auto text-slate-800 group-hover/item:text-cyan-500 transition-all duration-500" />
                                  </div>
                                ))}
                              </div>

                              {flag.bureauTactics && Object.keys(flag.bureauTactics).length > 0 && (
                                <div className="pt-10 space-y-8">
                                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 font-mono italic">Institutional_Countermeasures</p>
                                  <div className="grid gap-6">
                                    {Object.entries(flag.bureauTactics).map(([bureau, tactic], j) => (
                                      <div key={j} className="bg-black p-10 rounded-[3.5rem] border border-white/5 shadow-inner relative overflow-hidden group/tactic">
                                        <div className="absolute top-0 right-0 px-10 py-4 bg-emerald-500/10 rounded-bl-[2.5rem] border-b border-l border-emerald-500/20 shadow-2xl">
                                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] font-mono italic">{bureau}_TARGET</span>
                                        </div>
                                        <p className="text-xl text-slate-500 leading-relaxed font-mono italic pr-12 group-hover/tactic:text-slate-300 transition-all duration-700">
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
