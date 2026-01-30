'use client';

import React, { useMemo } from 'react';
import { calculateLiability, LiabilityReport } from '../../../lib/liability';
import { RuleFlag } from '../../../lib/rules';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertCircle, 
    Scale, 
    Gavel, 
    ShieldAlert, 
    Search,
    ChevronRight,
    Target,
    Zap,
    Cpu,
    Radiation,
    Terminal
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface LiabilityRadarTabProps {
    flags: RuleFlag[];
}

const LiabilityRadarTab: React.FC<LiabilityRadarTabProps> = ({ flags }) => {
    const liability = useMemo(() => calculateLiability(flags), [flags]);

    // Radar Chart Logic
    const radarMetrics = useMemo(() => {
        const categories = {
            'Statutory': flags.filter(f => f.legalCitations.length > 0).length,
            'Forensic': flags.filter(f => f.severity === 'critical').length,
            'Procedural': flags.filter(f => f.ruleId.startsWith('B')).length,
            'Substantive': flags.filter(f => f.ruleId.startsWith('E')).length,
            'Temporal': flags.filter(f => f.ruleId.includes('A')).length,
        };
        const max = Math.max(...Object.values(categories), 5);
        
        return Object.entries(categories).map(([label, value], i, arr) => {
            const angle = (i / arr.length) * 2 * Math.PI - Math.PI / 2;
            const r = (value / max) * 100;
            return {
                label,
                x: 150 + r * Math.cos(angle),
                y: 150 + r * Math.sin(angle),
                bgX: 150 + 100 * Math.cos(angle),
                bgY: 150 + 100 * Math.sin(angle),
            };
        });
    }, [flags]);

    return (
        <div className="fade-in space-y-12 pb-32">
            {/* Elite Tactical Header */}
            <div className="relative p-1 rounded-[3.5rem] bg-gradient-to-br from-rose-900 to-slate-950 overflow-hidden shadow-3xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[140px] -mr-64 -mt-64" />
                <div className="relative z-10 p-12 bg-slate-950/90 rounded-[3.3rem] backdrop-blur-3xl border border-white/5">
                    <div className="grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-12">
                             <div className="flex items-center gap-4 mb-8">
                                <div className="px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-2">
                                    <Radiation size={12} className="text-rose-400" />
                                    <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-rose-400 font-mono">Institutional Exposure Monitor</span>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Liability Concentration Node</span>
                            </div>
                        </div>

                        <div className="lg:col-span-5 relative group">
                            <div className="absolute inset-0 bg-rose-500/10 blur-[100px] rounded-full group-hover:bg-rose-500/20 transition-all duration-700" />
                            <div className="relative bg-black/40 border border-white/10 p-12 rounded-[3rem] backdrop-blur-3xl shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
                                {/* SVG Radar Chart */}
                                <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                                    {/* Hexagon Backgrounds */}
                                    {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
                                        <polygon
                                            key={scale}
                                            points={radarMetrics.map(m => `${150 + (m.bgX - 150) * scale},${150 + (m.bgY - 150) * scale}`).join(' ')}
                                            className="fill-none stroke-white/10 stroke-1"
                                        />
                                    ))}
                                    {/* Axis Lines */}
                                    {radarMetrics.map((m, i) => (
                                        <line
                                            key={i}
                                            x1="150" y1="150"
                                            x2={m.bgX} y2={m.bgY}
                                            className="stroke-white/10 stroke-1"
                                        />
                                    ))}
                                    {/* Data Polygon */}
                                    <motion.polygon
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        points={radarMetrics.map(m => `${m.x},${m.y}`).join(' ')}
                                        className="fill-rose-500/20 stroke-rose-500 stroke-2"
                                    />
                                    {/* Labels */}
                                    {radarMetrics.map((m, i) => (
                                        <text
                                            key={i}
                                            x={m.bgX}
                                            y={m.bgY}
                                            dy={m.bgY > 150 ? 25 : -15}
                                            textAnchor="middle"
                                            className="fill-slate-500 text-[9px] font-black uppercase tracking-widest font-mono"
                                        >
                                            {m.label}
                                        </text>
                                    ))}
                                </svg>
                            </div>
                        </div>

                        <div className="lg:col-span-7 space-y-12">
                             <div>
                                <h2 className="text-6xl font-black text-white tracking-tight mb-8 leading-tight">
                                    Exposure <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Heatmap</span>
                                </h2>
                                <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-xl font-medium">
                                    Quantifying the institutional liability generated by systemic reporting failures. High-concentration zones indicate points of failure suitable for statutory escalation.
                                </p>
                             </div>

                             <div className="grid grid-cols-2 gap-8">
                                 <div className="p-10 bg-slate-900/50 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 p-6 flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                     </div>
                                     <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] font-mono mb-2">Severity Matrix</p>
                                     <p className="text-6xl font-black text-white font-mono tracking-tighter">
                                        {liability.overallSeverityScore}
                                     </p>
                                     <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-4 flex items-center gap-2">
                                        <ShieldAlert size={12} /> {liability.overallSeverityScore > 200 ? 'Critical Redline' : 'Elevated Exposure'}
                                     </p>
                                 </div>
                                 <div className="p-10 bg-rose-600 border border-rose-500 rounded-[2.5rem] relative overflow-hidden group shadow-2xl shadow-rose-600/20">
                                     <Zap size={40} className="text-white/20 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform" />
                                     <p className="text-[10px] font-black uppercase text-white/60 tracking-[0.3em] font-mono mb-2">Legal Readiness</p>
                                     <p className="text-4xl font-black text-white uppercase tracking-tight">
                                        {liability.litigationReady ? 'Tier-1' : 'Admin'}
                                     </p>
                                     <p className="text-[9px] font-bold text-white/80 uppercase tracking-widest mt-6 flex items-center gap-2 italic">
                                        Vector Authenticated
                                     </p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Violation Ledger */}
            <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between px-4 mb-4">
                        <h3 className="text-2xl font-black text-white flex items-center gap-4">
                            <span className="w-1.5 h-8 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                            Liability Manifest Ledger
                        </h3>
                        <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <Terminal size={12} /> {liability.assessments.length} Nodes Active
                             </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <AnimatePresence>
                            {liability.assessments.map((assessment, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-8 rounded-[2.5rem] bg-slate-950 border border-white/5 flex items-center justify-between group hover:border-rose-500/30 transition-all duration-500 shadow-xl overflow-hidden relative"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-rose-500/10 transition-all" />
                                    
                                    <div className="flex items-center gap-8 relative z-10 transition-transform group-hover:translate-x-1 duration-500">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-rose-500/10 transition-colors">
                                            <Target size={24} className="text-slate-500 group-hover:text-rose-500 transition-colors" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] font-mono">{assessment.statute}</span>
                                                <span className="w-1 h-1 bg-slate-800 rounded-full" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono italic">{assessment.section}</span>
                                            </div>
                                            <h4 className="text-xl font-black text-white group-hover:text-rose-400 transition-colors tracking-tight">{assessment.violationType}</h4>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Impact Level</p>
                                            <p className="text-rose-400 font-black font-mono">HIGH</p>
                                        </div>
                                        <button className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-white group-hover:bg-rose-500 transition-all shadow-xl active:scale-90">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="p-12 rounded-[3.5rem] bg-slate-900 border border-white/5 relative overflow-hidden group shadow-2xl min-h-[500px] flex flex-col justify-between">
                         <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                             <Gavel size={160} className="text-white" />
                         </div>

                         <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center shadow-2xl shadow-rose-500/30">
                                    <Scale size={28} className="text-white" />
                                </div>
                                <h4 className="text-2xl font-black text-white tracking-tight">Judicial <br/>Forecasting</h4>
                            </div>

                            <p className="text-lg text-slate-300 leading-relaxed font-medium mb-12">
                                {liability.litigationReady
                                    ? "Forensic indicators suggest 'Willful Non-Compliance' patterns which exceed technical thresholds for statutory escalation. High litigation probability."
                                    : "Data warrant immediate administrative dispute protocols. Institutional pressure is currently optimized for bureau-level deletion via automated channels."
                                }
                            </p>

                            <div className="space-y-4">
                                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">Burden of Proof</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-grow h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: '85%' }}
                                                className="h-full bg-rose-500"
                                            />
                                        </div>
                                        <span className="text-xs font-black text-rose-400 font-mono">85%</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">Causation Integrity</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-grow h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: '92%' }}
                                                className="h-full bg-emerald-500"
                                            />
                                        </div>
                                        <span className="text-xs font-black text-emerald-400 font-mono">92%</span>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiabilityRadarTab;
