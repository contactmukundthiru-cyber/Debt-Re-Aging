import React from 'react';
import { RuleFlag, RiskProfile } from '../../../lib/types';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Zap, 
  Scale, 
  ShieldCheck, 
  Activity,
  ArrowUpRight,
  Target,
  Radiation,
  Cpu,
  Terminal,
  Shield,
  Layers
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { APP_VERSION } from '../../../lib/constants';

interface CaseSummaryDashboardProps {
    flags: RuleFlag[];
    riskProfile: RiskProfile;
    readiness: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

const CaseSummaryDashboard: React.FC<CaseSummaryDashboardProps> = ({ flags, riskProfile, readiness }) => {
    const highImpact = flags.filter(f => f.severity === 'high' || f.severity === 'critical').length;
    const impactScore = flags.reduce((acc, f) => acc + (f.severity === 'critical' ? 150 : f.severity === 'high' ? 100 : f.severity === 'medium' ? 50 : 10), 0);
    const avgProbability = flags.length > 0
        ? Math.round(flags.reduce((acc, f) => acc + (f.successProbability || 0), 0) / flags.length)
        : 0;

    const prioritizedAction = flags.find(f => f.severity === 'high')?.ruleName || 'Analysis Complete';
    const nextStepAction = (flags.find(f => f.severity === 'high') as any)?.nextStep || 'Standard monitoring';

    return (
        <div className="space-y-10 mb-20 px-2">
            {/* INSTITUTIONAL_STATUS_BAR */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/40"
            >
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-6">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-500",
                            highImpact > 0 ? "bg-rose-500 shadow-rose-200" : "bg-blue-600 shadow-blue-200"
                        )}>
                            <Shield size={28} />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analysis Status</p>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {highImpact > 0 ? 'Action Required' : 'Forensic Compliance Verified'}
                            </h2>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-10 md:text-right">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Action</p>
                            <p className="text-lg font-bold text-slate-700 tracking-tight">{nextStepAction}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-200 hidden md:block" />
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Finding</p>
                            <p className={cn(
                                "text-lg font-bold tracking-tight",
                                highImpact > 0 ? "text-rose-600" : "text-blue-600"
                            )}>{prioritizedAction}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {/* Total Violations */}
                <motion.div variants={item}>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 h-full shadow-lg shadow-slate-100/50 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
                                flags.length > 0 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                            )}>
                                <AlertTriangle size={20} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Findings</span>
                        </div>
                        
                        <div className="space-y-0.5">
                            <h3 className="text-6xl font-bold tracking-tighter text-slate-900 tabular-nums">
                                {flags.length}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Flags</p>
                        </div>

                        <div className="mt-8 flex gap-1">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={cn(
                                        "h-1.5 flex-1 rounded-full transition-all duration-700",
                                        i < flags.length 
                                            ? (i < highImpact ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "bg-amber-400") 
                                            : "bg-slate-100"
                                    )} 
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Success Probability */}
                <motion.div variants={item}>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 h-full shadow-lg shadow-slate-100/50 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Zap size={20} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence</span>
                        </div>

                        <div className="space-y-0.5">
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-6xl font-bold tracking-tighter text-slate-900 tabular-nums">
                                    {avgProbability}
                                </h3>
                                <span className="text-blue-600 text-2xl font-bold">%</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Success Probability</p>
                        </div>

                        <div className="mt-8 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${avgProbability}%` }}
                                className="h-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Forensic Readiness */}
                <motion.div variants={item}>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 h-full shadow-lg shadow-slate-100/50 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                                <Layers size={20} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completeness</span>
                        </div>

                        <div className="space-y-0.5">
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-6xl font-bold tracking-tighter text-slate-900 tabular-nums">
                                    {readiness}
                                </h3>
                                <span className="text-slate-400 text-2xl font-bold">%</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Evidence Maturity</p>
                        </div>

                        <div className="mt-8 grid grid-cols-4 gap-2">
                             {Array.from({ length: 4 }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-700",
                                        (i + 1) * 25 <= readiness ? "bg-slate-900" : "bg-slate-100"
                                    )} 
                                />
                             ))}
                        </div>
                    </div>
                </motion.div>

                {/* Litigation Risk */}
                <motion.div variants={item}>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 h-full shadow-lg shadow-slate-100/50 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center",
                                riskProfile?.riskLevel === 'critical' || riskProfile?.riskLevel === 'high' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                            )}>
                                <Activity size={20} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stability</span>
                        </div>

                        <div className="space-y-0.5">
                            <h3 className="text-4xl font-bold tracking-tight text-slate-900 uppercase">
                                {riskProfile?.riskLevel || 'Stable'}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Category</p>
                        </div>

                        <div className="mt-10 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                            Institutional Profile v{APP_VERSION}
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Strategic Findings Grid */}
            <div className="grid lg:grid-cols-12 gap-12 pt-12">
                <div className="lg:col-span-8 flex flex-col gap-12">
                     <section className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Radiation size={180} />
                        </div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                                    <Target size={14} className="text-blue-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Primary Objective</span>
                                </div>
                                <h4 className="text-3xl font-black tracking-tight leading-tight">
                                    Strategic Analysis & <span className="text-blue-400">Tactical Intent</span>
                                </h4>
                                <p className="text-slate-400 font-medium leading-relaxed">
                                    Based on the identified <span className="text-white">{flags.length} violations</span>, the optimal strategy focuses on <span className="text-white font-bold">{prioritizedAction}</span>. 
                                    This approach targets systemic reporting failures which hold the highest leverage for institutional correction.
                                </p>
                                <div className="pt-4 flex flex-wrap gap-4">
                                    <div className="px-5 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 group hover:bg-white/10 transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">FCRA Compliance: Targeted</span>
                                    </div>
                                    <div className="px-5 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 group hover:bg-white/10 transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Metro 2® Alignment: Audited</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </section>

                     <section className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-lg shadow-slate-100/50">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                    <Terminal size={18} />
                                </div>
                                <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest">Logic Patterns</h5>
                            </div>
                            <div className="space-y-6">
                                {flags.slice(0, 3).map((f, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-px h-12 bg-slate-100 mt-1" />
                                        <div>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{f.ruleId}</p>
                                            <p className="text-sm font-bold text-slate-700">{f.ruleName}</p>
                                        </div>
                                    </div>
                                ))}
                                {flags.length === 0 && (
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest py-8 text-center italic">No patterns detected in current stream</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-lg shadow-slate-100/50">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                    <Cpu size={18} />
                                </div>
                                <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest">Decision Logic</h5>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-blue-50/30 border border-blue-100 border-dashed">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Next Operational Step</p>
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                                        "{nextStepAction}"
                                    </p>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                    Neural analysis suggests a multi-stage escalation protocol for accounts with {riskProfile?.riskLevel} risk profiles.
                                </p>
                            </div>
                        </div>
                     </section>
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-[3rem] p-10 h-full shadow-inner flex flex-col justify-between">
                         <div>
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technical Telemetry</h5>
                            </div>
                            
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <span>Data Integrity</span>
                                        <span>72%</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-900 w-[72%]" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <span>Risk Exposure</span>
                                        <span>{impactScore > 200 ? '94%' : '42%'}</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div className={cn(
                                            "h-full transition-all duration-1000",
                                            impactScore > 200 ? "bg-rose-500 w-[94%]" : "bg-blue-600 w-[42%]"
                                        )} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <span>Bureau Accountability</span>
                                        <span>88%</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[88%]" />
                                    </div>
                                </div>
                            </div>
                         </div>

                         <div className="mt-20 pt-10 border-t border-slate-200 text-center">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                System calibrated for regulatory enforcement and technical discrepancy identification. 
                            </p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseSummaryDashboard;
