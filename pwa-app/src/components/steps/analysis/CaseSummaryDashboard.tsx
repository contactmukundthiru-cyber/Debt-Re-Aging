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

    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
        >
            {/* Total Violations */}
            <motion.div variants={item} className="p-px rounded-[2.5rem] bg-gradient-to-br from-rose-500/20 to-transparent group hover:from-rose-500/40 transition-all duration-700 shadow-3xl">
                <div className="bg-slate-950/90 backdrop-blur-3xl rounded-[2.4rem] p-8 h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-500/20 transition-all duration-700 underline" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                <Radiation size={24} />
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono whitespace-nowrap">Node Detections</span>
                                <div className="flex items-center justify-end text-rose-500 text-[10px] font-black mt-1 font-mono">
                                    {highImpact} CRITICAL
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <h3 className="text-6xl font-black tracking-tighter text-white tabular-nums leading-none">
                                {flags.length}
                            </h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono italic">Primary Violations</p>
                        </div>

                        <div className="mt-8 grid grid-cols-6 gap-2">
                            {Array.from({ length: 18 }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={cn(
                                        "h-1 rounded-full transition-all duration-500",
                                        i < flags.length 
                                            ? (i < highImpact ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "bg-slate-700") 
                                            : "bg-slate-900 border border-white/5"
                                    )} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Forensic Leverage */}
            <motion.div variants={item} className="p-px rounded-[2.5rem] bg-gradient-to-br from-emerald-500/20 to-transparent group hover:from-emerald-500/40 transition-all duration-700 shadow-3xl">
                <div className="bg-slate-950/90 backdrop-blur-3xl rounded-[2.4rem] p-8 h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Success Factor</span>
                                <span className="block text-emerald-500 text-[10px] font-black mt-1 uppercase font-mono italic tracking-widest leading-none">High-Confidence</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-6xl font-black tracking-tighter text-white tabular-nums leading-none">
                                {avgProbability}%
                            </h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono italic">Leverage Index</p>
                        </div>

                        <div className="mt-8">
                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${avgProbability}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Case Integrity */}
            <motion.div variants={item} className="p-px rounded-[2.5rem] bg-gradient-to-br from-blue-500/20 to-transparent group hover:from-blue-500/40 transition-all duration-700 shadow-3xl">
                <div className="bg-slate-950/90 backdrop-blur-3xl rounded-[2.4rem] p-8 h-full relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-blue-500/20 transition-all duration-700" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Audit Phase</span>
                                <span className={cn(
                                    "block text-[10px] font-black uppercase mt-1 font-mono tracking-widest leading-none transition-colors duration-500",
                                    readiness > 80 ? "text-blue-400" : "text-amber-500"
                                )}>
                                    {readiness > 80 ? 'PHASE 04 READY' : 'REFINEMENT REQ.'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-6xl font-black tracking-tighter text-white tabular-nums leading-none">
                                {readiness}%
                            </h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono italic">Integrity Grade</p>
                        </div>

                        <div className="mt-8 flex items-center gap-3">
                            <div className="flex -space-x-1">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`w-3 h-3 rounded-full border border-slate-950 ${i * 25 <= readiness ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`} />
                            ))}
                            </div>
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest font-mono">Dossier Valid</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Institutional Impact */}
            <motion.div variants={item} className="p-px rounded-[2.5rem] bg-gradient-to-br from-indigo-500/20 to-transparent group hover:from-indigo-500/40 transition-all duration-700 shadow-3xl">
                <div className="bg-slate-950/90 backdrop-blur-3xl rounded-[2.4rem] p-8 h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-indigo-600/20 transition-colors duration-1000" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] group-hover:scale-110 transition-transform">
                                <Target className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] font-mono italic">Impact Factor</span>
                                <span className="block text-white text-[10px] font-black mt-1 uppercase font-mono tracking-widest leading-none">Institutional Shift</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                            <h3 className="text-6xl font-black tracking-tighter text-white tabular-nums leading-none">
                                {impactScore.toLocaleString()}
                            </h3>
                            <span className="text-slate-500 font-black text-xs font-mono">LU</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono italic">Liability Units</p>
                        </div>

                        <p className="mt-8 text-[9px] text-slate-500 leading-relaxed font-black uppercase tracking-[0.1em] font-mono">
                            Statutory leverage manifest.
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CaseSummaryDashboard;
