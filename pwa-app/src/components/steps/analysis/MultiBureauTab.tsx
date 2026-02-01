'use client';

import React, { useState, useMemo } from 'react';
import { CreditFields } from '../../../lib/rules';
import {
    BureauName,
    BureauData,
    compareMultipleBureaus,
    generateComparisonReport,
    calculateDisputePriority,
    BureauComparisonResult
} from '../../../lib/multi-bureau';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, 
    Activity, 
    Layers, 
    AlertTriangle, 
    CheckCircle2, 
    ArrowRightLeft,
    TrendingUp,
    Zap,
    Scale,
    Fingerprint,
    Search,
    RefreshCcw,
    Database,
    Binary,
    Cpu,
    ArrowUpRight,
    ArrowDownRight,
    Globe,
    Lock
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface MultiBureauTabProps {
    bureauData?: BureauData[];
    fields?: Partial<CreditFields>;
    rawText?: string;
}

const MultiBureauTab: React.FC<MultiBureauTabProps> = ({ bureauData: initialData = [], fields, rawText }) => {
    const [bureauData, setBureauData] = useState<BureauData[]>(initialData);
    const [activeBureau, setActiveBureau] = useState<BureauName | null>(null);
    const [showComparison, setShowComparison] = useState(false);

    // Assign current data to a bureau
    const assignToBureau = (bureau: BureauName) => {
        const existingIndex = bureauData.findIndex(b => b.bureau === bureau);
        const newData: BureauData = {
            bureau,
            fields: fields as Partial<CreditFields>,
            rawText: rawText || "",
            uploadDate: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            const updated = [...bureauData];
            updated[existingIndex] = newData;
            setBureauData(updated);
        } else {
            setBureauData([...bureauData, newData]);
        }
        setActiveBureau(bureau);
    };

    const comparison = useMemo(() =>
        bureauData.length >= 2 ? compareMultipleBureaus(bureauData) : null,
        [bureauData]
    );

    const disputePriority = useMemo(() =>
        comparison ? calculateDisputePriority(comparison) : null,
        [comparison]
    );

    const bureaus: { name: BureauName; color: string; icon: any; gradient: string }[] = [
        {
            name: 'Equifax',
            color: 'rose',
            icon: ShieldCheck,
            gradient: 'from-rose-500/20 to-pink-500/10'
        },
        {
            name: 'Experian',
            color: 'blue',
            icon: Search,
            gradient: 'from-blue-500/20 to-indigo-500/10'
        },
        {
            name: 'TransUnion',
            color: 'emerald',
            icon: Globe,
            gradient: 'from-emerald-500/20 to-teal-500/10'
        }
    ];

    const getBureauStatus = (bureau: BureauName) => {
        return bureauData.find(b => b.bureau === bureau);
    };

    return (
        <div className="pb-32 font-sans selection:bg-purple-500/30 space-y-16">
            {/* CROSS_BUREAU_HERO::PROTOCOL_ZENITH */}
            <header className="relative rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-4xl group">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[160px] -mr-96 -mt-96 group-hover:bg-purple-400/20 transition-colors duration-1000" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] -ml-40 -mb-40" />
                
                <div className="relative z-10 p-12 xl:p-20">
                    <div className="flex flex-col xl:flex-row items-center gap-20">
                        <div className="flex-1 space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="flex -space-x-3">
                                    {[Layers, ArrowRightLeft, Database].map((Icon, i) => (
                                        <div key={i} className={cn("w-14 h-14 rounded-2xl bg-slate-900 border-2 border-slate-950 flex items-center justify-center text-purple-400 shadow-2xl relative", i === 0 ? "z-[3]" : i === 1 ? "z-[2]" : "z-[1]")}>
                                            <Icon size={24} />
                                        </div>
                                    ))}
                                </div>
                                <div className="h-4 w-px bg-white/10" />
                                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-purple-500 font-mono italic animate-pulse">
                                    System_Status::SYNAPTIC_BUREAU_LINK_ACTIVE
                                </span>
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-7xl xl:text-8xl font-black text-white tracking-tighter leading-none font-mono italic uppercase">
                                    MULTI_<span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400">BUREAU</span>
                                </h1>
                                <p className="text-2xl text-slate-500 font-medium italic max-w-3xl leading-relaxed border-l-4 border-purple-500/20 pl-10 ml-2">
                                    Compare institutional data models across Equifax, Experian, and TransUnion. Detect synthetic variances and consolidate forensic leverage.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-8 pt-4">
                                {bureauData.length >= 2 && (
                                    <button
                                        onClick={() => setShowComparison(!showComparison)}
                                        className="px-12 py-6 bg-purple-600 hover:bg-purple-500 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm flex items-center gap-6 transition-all shadow-4xl group/btn"
                                    >
                                        <Layers size={20} className="group-hover/btn:rotate-12 transition-transform" />
                                        <span>{showComparison ? 'HIDE_ANALYSIS' : 'INITIALIZE_COMPARISON'}</span>
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                            <ArrowDownRight size={16} className={cn("transition-transform duration-500", showComparison && "rotate-180")} />
                                        </div>
                                    </button>
                                )}
                                <div className="px-10 py-6 bg-slate-900/60 border border-white/5 rounded-[2.5rem] backdrop-blur-2xl flex items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                        <span className="text-xl font-black text-white font-mono">{bureauData.length}/3</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono italic">NODES_SYNCED</span>
                                </div>
                            </div>
                        </div>

                        {/* SIGNAL_STRENGTH_VISUALIZER */}
                        <div className="w-full xl:w-[450px] relative">
                             <div className="absolute inset-0 bg-purple-500/20 blur-[100px] scale-75 animate-pulse" />
                             <div className="relative p-12 bg-black/60 backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-4xl space-y-10">
                                 <div className="flex items-baseline justify-between">
                                     <span className="text-sm font-black text-slate-500 uppercase tracking-[0.4em] font-mono italic">Sync_Integrity</span>
                                     <span className="text-4xl font-black text-white font-mono tracking-tighter">98.4%</span>
                                 </div>
                                 <div className="grid grid-cols-3 gap-4 h-32 items-end">
                                     {[40, 70, 90, 60, 80, 100, 85, 95, 75].map((h, i) => (
                                         <motion.div 
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ delay: i * 0.05, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                                            className="w-full bg-gradient-to-t from-purple-600 to-indigo-400 rounded-full opacity-60"
                                         />
                                     ))}
                                 </div>
                                 <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">Satellite_Uplink</span>
                                     <div className="flex items-center gap-3">
                                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                         <span className="text-xs font-black text-emerald-500 font-mono uppercase italic">Encrypted</span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* BUREAU_ASSIGNMENT_VECTORS */}
            <div className="grid md:grid-cols-3 gap-10">
                {bureaus.map((bureau, idx) => {
                    const status = getBureauStatus(bureau.name);
                    const isActive = activeBureau === bureau.name;
                    const Icon = bureau.icon;

                    return (
                        <motion.div
                            key={bureau.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => assignToBureau(bureau.name)}
                            className={cn(
                                "group relative rounded-[3.5rem] p-12 border-2 transition-all duration-700 cursor-pointer overflow-hidden shadow-4xl bg-slate-950/40 backdrop-blur-3xl",
                                status ? `border-${bureau.color}-500/40` : "border-white/5 hover:border-white/20",
                                isActive && "ring-4 ring-emerald-500/30"
                            )}
                        >
                            <div className={cn(
                                "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-br",
                                bureau.name === 'Equifax' ? "from-rose-500" : bureau.name === 'Experian' ? "from-blue-500" : "from-emerald-500"
                            )} />

                            <div className="relative z-10 space-y-12">
                                <div className="flex items-start justify-between">
                                    <div className={cn(
                                        "w-20 h-20 rounded-[2rem] flex items-center justify-center border-2 shadow-2xl relative transition-transform duration-700 group-hover:scale-110",
                                        status ? `bg-${bureau.color}-500/10 text-${bureau.color}-500 border-${bureau.color}-500/20` : "bg-white/5 text-slate-500 border-white/5"
                                    )}>
                                        <Icon size={32} />
                                        {status && <div className="absolute inset-0 blur-xl opacity-20 bg-current animate-pulse" />}
                                    </div>
                                    {status && (
                                        <div className="px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 font-mono">DATA_LOCK</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase font-mono italic mb-4">{bureau.name}</h3>
                                    {status ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-1">Upload</p>
                                                    <p className="text-xs font-black text-white font-mono">{new Date(status.uploadDate).toLocaleDateString()}</p>
                                                </div>
                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-1">Vectors</p>
                                                    <p className="text-xs font-black text-white font-mono">{Object.keys(status.fields).filter(k => status.fields[k as keyof typeof status.fields]).length}_F</p>
                                                </div>
                                            </div>
                                            <button className="w-full py-5 rounded-[2rem] bg-slate-900 border border-white/5 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-800 transition-all font-mono italic">RE_SYNCHRONIZE_CORE</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            <p className="text-lg text-slate-500 italic leading-relaxed font-medium">No institutional telemetry captured. Extract current manifest to this node.</p>
                                            <button
                                                disabled={!rawText}
                                                className={cn(
                                                    "w-full py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all shadow-4xl font-mono",
                                                    rawText ? `bg-${bureau.color}-600 text-white hover:bg-${bureau.color}-500 shadow-${bureau.color}-500/20` : "bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5"
                                                )}
                                            >
                                                <RefreshCcw size={18} className={cn(rawText && "animate-spin-slow")} />
                                                MAP_CURRENT_DATA
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {comparison && showComparison && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        className="space-y-16"
                    >
                        <div className="grid md:grid-cols-4 gap-8">
                            {[
                                { label: 'SYNCHRONIZED_NODES', value: comparison.bureausCompared.length, color: 'text-purple-400', icon: Database },
                                { label: 'TOTAL_DISCREPANCIES', value: comparison.totalDiscrepancies, color: 'text-amber-500', icon: AlertTriangle },
                                { label: 'CRITICAL_VECTORS', value: comparison.criticalDiscrepancies, color: 'text-rose-500', icon: Zap },
                                { label: 'MISSION_PRIORITY', value: disputePriority?.priority.toUpperCase(), color: disputePriority?.priority === 'immediate' ? 'text-rose-500' : 'text-blue-500', icon: Scale }
                            ].map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={i} className="p-10 rounded-[3rem] bg-slate-950/60 border border-white/10 shadow-4xl text-center space-y-4 group hover:border-purple-500/30 transition-all backdrop-blur-2xl">
                                        <div className="flex justify-center">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-purple-400 transition-colors">
                                                <Icon size={24} />
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 font-mono italic">{stat.label}</p>
                                        <p className={cn("text-5xl font-black font-mono tracking-tighter italic", stat.color)}>{stat.value}</p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-12">
                            <div className="flex items-center justify-between px-8">
                                <div className="space-y-4">
                                    <h3 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none flex items-center gap-6">
                                        <Binary className="text-amber-500" size={48} />
                                        Synthetic_Variances
                                    </h3>
                                    <p className="text-[12px] text-slate-500 uppercase tracking-[0.4em] font-black font-mono">Comparative_Inconsistency_Matrix</p>
                                </div>
                                <div className="px-8 py-3 bg-amber-500/10 border border-amber-500/20 rounded-[1.5rem] backdrop-blur-xl">
                                    <span className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono italic">
                                        {comparison.fieldDiscrepancies.length}_DETECTIONS
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-10">
                                {comparison.fieldDiscrepancies.map((discrepancy, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className={cn(
                                            "rounded-[3.5rem] p-12 border-2 transition-all duration-700 shadow-4xl backdrop-blur-3xl group relative overflow-hidden",
                                            discrepancy.severity === 'critical' ? "bg-rose-950/20 border-rose-500/30" : discrepancy.severity === 'high' ? "bg-amber-950/20 border-amber-500/30" : "bg-slate-950/40 border-white/10"
                                        )}
                                    >
                                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-[2] pointer-events-none group-hover:scale-[2.5] group-hover:opacity-[0.05] transition-all duration-1000">
                                            <Binary size={120} />
                                        </div>

                                        <div className="relative z-10 flex flex-col xl:flex-row gap-12">
                                            <div className="flex-1 space-y-10">
                                                <div className="flex items-center gap-8">
                                                    <div className={cn(
                                                        "w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 group-hover:scale-110 shadow-2xl relative",
                                                        discrepancy.severity === 'critical' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                    )}>
                                                        <AlertTriangle size={28} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-4 mb-3">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono italic">VARIANCE_IDENT_0{i+1}</span>
                                                            <div className={cn(
                                                                "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono border",
                                                                discrepancy.severity === 'critical' ? "text-rose-500 border-rose-500/20 bg-rose-500/5" : "text-amber-500 border-amber-500/20 bg-amber-500/5"
                                                            )}>
                                                                {discrepancy.severity.toUpperCase()}_IMPACT
                                                            </div>
                                                        </div>
                                                        <h4 className="text-4xl font-black text-white tracking-tighter uppercase font-mono italic">{discrepancy.fieldLabel}</h4>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-6">
                                                    {bureaus.map(b => (
                                                        <div key={b.name} className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] space-y-3 shadow-inner relative overflow-hidden group/tile hover:border-purple-500/30 transition-all">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono italic">{b.name}</span>
                                                                <div className={cn("w-1.5 h-1.5 rounded-full", discrepancy.values[b.name] ? `bg-${b.color}-500 shadow-[0_0_8px_rgba(var(--${b.color}-rgb),0.8)]` : "bg-slate-700")} />
                                                            </div>
                                                            <p className={cn("text-xl font-black font-mono tracking-tighter italic", discrepancy.values[b.name] ? "text-white" : "text-slate-700")}>
                                                                {discrepancy.values[b.name] || 'NULL_SET'}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="xl:w-[450px] space-y-8">
                                                 {discrepancy.potentialViolation && (
                                                     <div className="p-10 bg-rose-600/10 border border-rose-500/20 rounded-[3rem] shadow-inner group/viol relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover/viol:rotate-12 transition-transform">
                                                            <Fingerprint size={48} />
                                                        </div>
                                                        <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em] font-mono italic mb-4">Statutory_Breach</p>
                                                        <p className="text-xl text-rose-100 font-bold italic leading-relaxed">{discrepancy.potentialViolation}</p>
                                                     </div>
                                                 )}
                                                 <div className="p-10 bg-emerald-600/10 border border-emerald-500/20 rounded-[3rem] shadow-inner relative overflow-hidden">
                                                     <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                                                            <Zap size={48} />
                                                        </div>
                                                     <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] font-mono italic mb-4">Strategic_Payload</p>
                                                     <p className="text-xl text-emerald-100 font-bold italic leading-relaxed">{discrepancy.recommendation}</p>
                                                 </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="p-16 rounded-[4rem] bg-emerald-950/20 border border-emerald-500/20 shadow-4xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-24 opacity-[0.03] scale-[3] pointer-events-none group-hover:scale-[3.5] transition-transform duration-1000">
                                    <CheckCircle2 size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                                    <div className="space-y-6">
                                        <h4 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic leading-none">INTEGRITY_STasis</h4>
                                        <p className="text-2xl text-emerald-500/80 font-medium italic">Confirmed institutional consistency across {comparison.matchedFields.length} critical data points.</p>
                                    </div>
                                    <div className="flex -space-x-6">
                                        {comparison.matchedFields.slice(0, 5).map((field, i) => (
                                            <div key={i} className="w-20 h-20 rounded-[2rem] bg-slate-900 border-4 border-slate-950 flex flex-col items-center justify-center shadow-2xl transform hover:-translate-y-4 transition-transform duration-500 cursor-help group/tag">
                                                <CheckCircle2 className="text-emerald-500 mb-1" size={16} />
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter font-mono">{field.split('_')[0]}</span>
                                            </div>
                                        ))}
                                        {comparison.matchedFields.length > 5 && (
                                            <div className="w-20 h-20 rounded-[2rem] bg-slate-900 border-4 border-slate-950 flex items-center justify-center shadow-2xl text-emerald-500 font-black font-mono">
                                                +{comparison.matchedFields.length - 5}
                                            </div>
                                        )}
                                    </div>
                                </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MultiBureauTab;
