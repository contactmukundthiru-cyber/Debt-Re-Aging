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
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
            {/* Total Violations */}
            <motion.div variants={item} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-rose-500/30 via-transparent to-transparent rounded-[2.5rem] opacity-50 blur-sm group-hover:opacity-100 transition-all duration-700" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.4rem] p-8 h-full overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-500/15 transition-all duration-700" />
                    
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <Radiation size={22} className="group-hover:rotate-12 transition-transform" />
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] font-mono leading-none block mb-2">Detection Node</span>
                                <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500 text-[9px] font-black font-mono">
                                    {highImpact} CRITICAL
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-7xl font-black tracking-tighter text-white tabular-nums leading-none">
                                    {flags.length}
                                </h3>
                                <span className="text-rose-500 font-mono text-[9px] font-bold tracking-widest uppercase animate-pulse">Live</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono italic">Violations Manifest</p>
                        </div>

                        <div className="mt-10 grid grid-cols-6 gap-1.5">
                            {Array.from({ length: 18 }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={cn(
                                        "h-1 rounded-full transition-all duration-700 ease-out",
                                        i < flags.length 
                                            ? (i < highImpact ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]" : "bg-slate-700") 
                                            : "bg-slate-900 border border-white/5"
                                    )} 
                                />
                            ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-[8px] font-mono text-slate-600 font-bold uppercase tracking-widest">
                            <span>Matrix Seq_01</span>
                            <span>{Math.round((flags.length/18)*100)}% Load</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Forensic Leverage */}
            <motion.div variants={item} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/30 via-transparent to-transparent rounded-[2.5rem] opacity-50 blur-sm group-hover:opacity-100 transition-all duration-700" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.4rem] p-8 h-full overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/15 transition-all duration-700" />
                    
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <Zap size={22} className="group-hover:rotate-12 transition-transform" />
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] font-mono leading-none block mb-2">Success Proxy</span>
                                <span className="text-emerald-500 text-[9px] font-black uppercase font-mono italic tracking-widest">Neural Logic</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <div className="flex items-baseline gap-2">
                                <h3 className="text-7xl font-black tracking-tighter text-white tabular-nums leading-none">
                                    {avgProbability}
                                </h3>
                                <span className="text-emerald-500 font-mono text-2xl font-black">%</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono italic">Leverage Index</p>
                        </div>

                        <div className="mt-10">
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${avgProbability}%` }}
                                    transition={{ duration: 2, ease: "circOut" }}
                                    className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                                />
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[8px] font-mono text-slate-600 font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Signal Stable</span>
                                <span>v5.2.0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Case Integrity */}
            <motion.div variants={item} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/30 via-transparent to-transparent rounded-[2.5rem] opacity-50 blur-sm group-hover:opacity-100 transition-all duration-700" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.4rem] p-8 h-full overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-blue-500/15 transition-all duration-700" />
                    
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <ShieldCheck size={22} className="group-hover:rotate-12 transition-transform" />
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] font-mono leading-none block mb-2">Audit Phase</span>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[8px] font-black uppercase font-mono tracking-widest leading-none border transition-colors duration-500",
                                    readiness > 80 ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                )}>
                                    {readiness > 80 ? 'PHASE 04 READY' : 'REFINEMENT REQ.'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-7xl font-black tracking-tighter text-white tabular-nums leading-none">
                                    {readiness}
                                </h3>
                                <span className="text-blue-500 font-mono text-2xl font-black">%</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono italic">Integrity Grade</p>
                        </div>

                        <div className="mt-10 flex items-center justify-between">
                            <div className="flex gap-1.5">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={cn(
                                    "w-4 h-1.5 rounded-full transition-all duration-700",
                                    i * 25 <= readiness ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" : "bg-slate-900 border border-white/5"
                                )} />
                            ))}
                            </div>
                            <span className="text-[8px] text-slate-600 font-mono font-bold uppercase tracking-widest">Dossier Locked</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Institutional Impact */}
            <motion.div variants={item} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-[2.5rem] opacity-30 blur-sm group-hover:opacity-60 transition-all duration-700" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.4rem] p-8 h-full overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-[80px] -mr-20 -mt-20 transition-colors duration-1000" />
                    
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.4)] group-hover:scale-110 transition-transform duration-500">
                                <Target size={22} className="group-hover:rotate-12 transition-transform" />
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] font-mono leading-none block mb-2">Liability Map</span>
                                <span className="text-white text-[9px] font-black uppercase font-mono tracking-widest">Inst. Sync</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-7xl font-black tracking-tighter text-white tabular-nums leading-none">
                                    {impactScore}
                                </h3>
                                <span className="text-slate-500 font-black text-xs font-mono">LU</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono italic">Liability Potential</p>
                        </div>

                        <div className="mt-10 flex items-center justify-between">
                            <div className="w-full h-1.5 bg-slate-900 rounded-full relative">
                                <div className="absolute top-0 left-[40%] w-0.5 h-full bg-slate-700" />
                                <div className="absolute top-0 left-[70%] w-0.5 h-full bg-slate-700" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-[8px] font-mono text-slate-600 font-bold uppercase tracking-widest">
                            <span>Strategic Manifest</span>
                            <span className="text-white">Active</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CaseSummaryDashboard;
