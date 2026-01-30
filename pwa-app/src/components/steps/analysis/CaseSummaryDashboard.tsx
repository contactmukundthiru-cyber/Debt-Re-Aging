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
  Target
} from 'lucide-react';
import { cn } from '../../../lib/utils';

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
    const highImpact = flags.filter(f => f.severity === 'high').length;
    const impactScore = flags.reduce((acc, f) => acc + (f.severity === 'high' ? 100 : f.severity === 'medium' ? 50 : 10), 0);
    const avgProbability = flags.length > 0
        ? Math.round(flags.reduce((acc, f) => acc + f.successProbability, 0) / flags.length)
        : 0;

    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
            {/* Total Violations */}
            <motion.div variants={item} className="premium-card relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-rose-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center ring-1 ring-rose-500/20">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detections</span>
                            <div className="flex items-center text-rose-500 text-[10px] font-bold">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                                {highImpact} Critical
                            </div>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">{flags.length}</h3>
                        <span className="text-xs text-slate-500 font-medium">Violations</span>
                    </div>
                    <div className="mt-4 flex gap-1">
                        {Array.from({ length: Math.min(flags.length, 12) }).map((_, i) => (
                            <div 
                                key={i} 
                                className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    i < highImpact ? "bg-rose-500" : "bg-slate-200 dark:bg-slate-800"
                                )} 
                            />
                        ))}
                        {flags.length > 12 && <span className="text-[8px] text-slate-400 ml-1">+{flags.length - 12}</span>}
                    </div>
                </div>
            </motion.div>

            {/* Forensic Leverage */}
            <motion.div variants={item} className="premium-card relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center ring-1 ring-emerald-500/20">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Success Prob.</span>
                            <span className="text-emerald-500 text-[10px] font-bold italic">High Confidence</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">{avgProbability}%</h3>
                    </div>
                    <div className="mt-4">
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${avgProbability}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Trial Readiness */}
            <motion.div variants={item} className="premium-card relative overflow-hidden group">
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center ring-1 ring-blue-500/20">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Case Grade</span>
                            <span className={cn(
                                "text-[10px] font-bold uppercase",
                                readiness > 80 ? "text-blue-500" : "text-amber-500"
                            )}>
                                {readiness > 80 ? 'Court Ready' : 'Audit Needed'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">{readiness}%</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] text-slate-500 font-medium">Compliance Integrity Validated</span>
                    </div>
                </div>
            </motion.div>

            {/* Forensic Impact */}
            <motion.div 
                variants={item} 
                className="premium-card bg-slate-900 dark:bg-black border-slate-800 dark:border-white/10 relative overflow-hidden group shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-colors" />
                <div className="p-5 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                            <Target className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Impact Factor</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold tracking-tight text-white tabular-nums">
                            {impactScore.toLocaleString()}
                        </h3>
                        <span className="text-emerald-500 font-bold text-xs">PTS</span>
                    </div>
                    <p className="mt-4 text-[10px] text-slate-400 leading-relaxed font-medium">
                        Forensic Severity Index based on statutory liability weight.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CaseSummaryDashboard;
