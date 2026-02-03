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
        </div>
    );
};

export default CaseSummaryDashboard;
