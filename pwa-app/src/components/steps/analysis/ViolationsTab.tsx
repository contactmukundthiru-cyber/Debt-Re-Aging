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
  Network,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useApp } from '../../../context/AppContext';

interface ViolationsTabProps {
  flags: RuleFlag[];
  expandedCard: number | null;
  setExpandedCard: (id: number | null) => void;
  translate: (key: string) => string;
}

const getFullStatuteName = (cite: string) => {
  const mapping: Record<string, { title: string; desc: string }> = {
    'FCRA_605_a': { title: '15 U.S.C. § 1681c(a)', desc: 'Obsolescence - Prohibits reporting information older than 7 years.' },
    'FCRA_605_c': { title: '15 U.S.C. § 1681c(c)', desc: 'Commencement of Period - Strictly defines when the 7-year clock begins.' },
    'FCRA_623_a1': { title: '15 U.S.C. § 1681s-2(a)(1)', desc: 'Accuracy - Prohibits reporting data known or suspected to be inaccurate.' },
    'FCRA_623_a2': { title: '15 U.S.C. § 1681s-2(a)(2)', desc: 'Duty to Correct - Requires updates when data is determined inaccurate.' },
    'FCRA_623_a5': { title: '15 U.S.C. § 1681s-2(a)(5)', desc: 'DOFD Reporting - Mandatory reporting of original delinquency dates.' },
    'FCRA_611': { title: '15 U.S.C. § 1681i', desc: 'Reinvestigation - Mandates reasonable investigation of consumer disputes.' },
    'FCRA_607_b': { title: '15 U.S.C. § 1681e(b)', desc: 'Maximum Accuracy - Agencies must follow procedures for absolute integrity.' },
    'FDCPA_807': { title: '15 U.S.C. § 1692e', desc: 'Deceptive Means - Prohibits false representations in debt collection.' },
    'FDCPA_807_2': { title: '15 U.S.C. § 1692e(2)', desc: 'False Representation - Misstating the character or legal status of debt.' },
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
  const { state } = useApp();
  const { isPrivacyMode } = state;
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterSeverity, setFilterSeverity] = React.useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showAnomalies, setShowAnomalies] = React.useState(false);

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || flag.severity === filterSeverity;
    const matchesCategory = showAnomalies ? true : (flag as any).category === 'violation';
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const highCount = flags.filter(f => f.severity === 'high').length;
  const medCount = flags.filter(f => f.severity === 'medium').length;
  const lowCount = flags.filter(f => f.severity === 'low').length;

  const SeveritySpectrum = () => (
    <div className="flex w-full h-2 rounded-full overflow-hidden bg-slate-100 mt-6 mb-2">
      <motion.div initial={{ width: 0 }} animate={{ width: `${(highCount / Math.max(1, flags.length)) * 100}%` }} className="bg-rose-500" />
      <motion.div initial={{ width: 0 }} animate={{ width: `${(medCount / Math.max(1, flags.length)) * 100}%` }} className="bg-amber-500" />
      <motion.div initial={{ width: 0 }} animate={{ width: `${(lowCount / Math.max(1, flags.length)) * 100}%` }} className="bg-blue-500" />
    </div>
  );

  if (flags.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-20 text-center border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">System Compliance Verified</h3>
        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
          Our forensic audit has concluded and no actionable violations or reporting anomalies were detected in the current record.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="p-10 lg:p-14 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Auditor Live
              </div>
              <div className="h-px w-12 bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Analysis Active</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              Violation <span className="text-slate-400">Inventory</span>
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed max-w-2xl">
              Identification of <span className="text-slate-900 font-semibold">{flags.length} potential issues</span> mapped to federal statutes and regulatory standards.
            </p>
            <div className="max-w-md">
              <SeveritySpectrum />
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                <span>{highCount} High</span>
                <span>{medCount} Med</span>
                <span>{lowCount} Low</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full lg:w-96 shrink-0">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Findings</p>
              <p className="text-3xl font-bold text-slate-900 tabular-nums">{flags.length}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Statutes</p>
              <p className="text-3xl font-bold text-slate-900 tabular-nums">{new Set(flags.flatMap(f => f.legalCitations)).size}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search findings, rules, or citations..."
            className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['all', 'high', 'medium', 'low'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={cn(
                "px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                filterSeverity === s
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredFlags.map((flag, i) => {
            const isExpanded = expandedCard === i;
            return (
              <motion.div
                key={flag.ruleId + i}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-white rounded-2xl border transition-all duration-200 overflow-hidden",
                  isExpanded ? "border-blue-200 shadow-lg shadow-blue-500/5" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div 
                  className="p-6 cursor-pointer flex items-start gap-4"
                  onClick={() => setExpandedCard(isExpanded ? null : i)}
                >
                  <div className={cn(
                    "p-3 rounded-xl shrink-0",
                    flag.severity === 'high' ? "bg-rose-50 text-rose-500" :
                    flag.severity === 'medium' ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-500"
                  )}>
                    {flag.severity === 'high' ? <ShieldAlert size={20} /> : 
                     flag.severity === 'medium' ? <AlertTriangle size={20} /> : <Info size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h4 className="text-base font-bold text-slate-900 truncate tracking-tight">{flag.ruleName}</h4>
                      <ChevronRight size={16} className={cn("text-slate-300 transition-transform", isExpanded ? "rotate-90" : "")} />
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{flag.explanation}</p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-50 bg-slate-50/20 p-8 pt-6">
                    <div className="grid lg:grid-cols-2 gap-10">
                      <div className="space-y-8">
                        <section>
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Contextual Basis</h5>
                          <p className="text-slate-600 text-sm leading-relaxed">{flag.whyItMatters}</p>
                        </section>
                        {flag.suggestedEvidence?.length > 0 && (
                          <section>
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Suggested Evidence</h5>
                            <div className="flex flex-wrap gap-2">
                              {flag.suggestedEvidence.map((ev, idx) => (
                                <span key={idx} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-600">
                                  {ev}
                                </span>
                              ))}
                            </div>
                          </section>
                        )}
                      </div>
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Statutory Authority</h5>
                          <div className="space-y-4">
                            {flag.legalCitations.map((cite, idx) => {
                              const statute = getFullStatuteName(cite);
                              return (
                                <div key={idx}>
                                  <p className="text-xs font-bold text-slate-900 mb-0.5">{statute.title}</p>
                                  <p className="text-[10px] text-slate-500 leading-normal">{statute.desc}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="bg-blue-600 p-6 rounded-2xl text-white">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Resolution Prob.</span>
                            <span className="text-2xl font-bold">{flag.successProbability}%</span>
                          </div>
                          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${flag.successProbability}%` }} className="h-full bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ViolationsTab;

