'use client';

import React, { useState, useMemo } from 'react';
import { getStateLaws, STATE_LAWS } from '../../../lib/state-laws';
import { CreditFields } from '../../../lib/rules';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Gavel, 
    ShieldCheck, 
    Scale, 
    Info, 
    Globe, 
    ExternalLink, 
    Clock, 
    AlertTriangle,
    Flag,
    Lock,
    CheckCircle2,
    Radiation,
    Terminal,
    ChevronRight,
    Zap,
    Cpu
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface StatuteTrackerTabProps {
    fields: Partial<CreditFields>;
}

const StatuteTrackerTab: React.FC<StatuteTrackerTabProps> = ({ fields }) => {
    const [selectedState, setSelectedState] = useState(fields.stateCode || 'CA');

    const law = useMemo(() => getStateLaws(selectedState), [selectedState]);

    const calculateExpiry = (dateStr: string | undefined, years: number) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        date.setFullYear(date.getFullYear() + years);
        return date;
    };

    const solTypes = [
        { label: 'Written Contracts', key: 'writtenContracts' as keyof typeof law.sol },
        { label: 'Oral Contracts', key: 'oralContracts' as keyof typeof law.sol },
        { label: 'Promissory Notes', key: 'promissoryNotes' as keyof typeof law.sol },
        { label: 'Open Accounts', key: 'openAccounts' as keyof typeof law.sol }
    ];

    return (
        <div className="fade-in space-y-12 pb-32">
            {/* Elite Jurisdictional Header */}
            <div className="relative p-1 rounded-[3.5rem] bg-gradient-to-br from-blue-900 to-slate-950 overflow-hidden shadow-3xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] -mr-80 -mt-80" />
                <div className="relative z-10 p-12 bg-slate-950/90 rounded-[3.3rem] backdrop-blur-3xl border border-white/5">
                    <div className="grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-12">
                             <div className="flex items-center gap-4 mb-8">
                                <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2">
                                    <Globe size={12} className="text-blue-400" />
                                    <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-blue-400 font-mono">Jurisdictional Node</span>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Nexus: {law.name}</span>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            <h2 className="text-6xl font-black text-white tracking-tight mb-8 leading-tight">
                                Jurisdictional <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Statute Matrix</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-xl font-medium">
                                Cross-referencing state-specific legal constraints, consumer protections, and usury limits for high-fidelity compliance audits.
                            </p>
                            
                            <div className="flex items-center gap-12">
                                 <div className="space-y-1">
                                     <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Primary State</p>
                                     <p className="text-5xl font-black text-white font-mono tracking-tighter">{selectedState}</p>
                                 </div>
                                 <div className="h-12 w-px bg-slate-800" />
                                 <div className="space-y-1">
                                     <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Protection Tier</p>
                                     <p className="text-4xl font-black text-blue-500 font-mono tracking-tighter">GOLD</p>
                                 </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 relative group">
                             <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
                             <div className="relative bg-black/40 border border-white/10 p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl overflow-hidden min-h-[300px] flex flex-col justify-center">
                                 <div className="space-y-6">
                                     <div className="flex items-center justify-between mb-4 px-2">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono">Archive Select</h4>
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                     </div>
                                     <select
                                        value={selectedState}
                                        onChange={(e) => setSelectedState(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-[1.5rem] px-8 py-5 text-sm font-black text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer tracking-widest uppercase hover:bg-slate-900 shadow-xl font-mono"
                                     >
                                        {Object.keys(STATE_LAWS).sort().map(code => (
                                            <option key={code} value={code} className="bg-slate-950">{code} &middot; {STATE_LAWS[code].name}</option>
                                        ))}
                                     </select>
                                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center italic px-4">
                                        Adjusting jurisdiction recomputes temporal thresholds across the forensic dataset.
                                     </p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-12">
                {/* SOL Matrix */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-2xl font-black text-white flex items-center gap-4">
                            <span className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                            Statute of Limitations Spectrum
                        </h3>
                        <div className="flex items-center gap-4">
                             <div className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 font-mono">
                                <Clock size={12} className="text-blue-500" /> Temporal Matrix Active
                             </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={selectedState}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                            className="grid md:grid-cols-2 gap-8"
                        >
                            {solTypes.map((type, idx) => {
                                const years = law.sol[type.key];
                                const expiry = calculateExpiry(fields.dateLastPayment, years);
                                const isExpired = expiry ? expiry < new Date() : false;

                                return (
                                    <div key={type.key} className="bg-slate-950 border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                            <Gavel size={80} />
                                        </div>
                                        
                                        <div className="flex items-center justify-between mb-8">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 font-mono">{type.label}</p>
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-inner border border-white/5 font-mono",
                                                isExpired ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                                            )}>
                                                {years}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-end justify-between mb-10">
                                            <p className="text-6xl font-black text-white tracking-tighter font-mono">{years}<span className="text-xl text-slate-500 ml-2 italic">YR</span></p>
                                            {fields.dateLastPayment && (
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1 font-mono">SOL Limit</p>
                                                    <p className="text-[11px] font-black text-blue-400 font-mono uppercase tracking-tighter italic">{expiry?.toLocaleDateString()}</p>
                                                </div>
                                            )}
                                        </div>

                                        <button className={cn(
                                            "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] font-mono border transition-all",
                                            isExpired 
                                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white" 
                                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white"
                                        )}>
                                            {isExpired ? 'Statute :: Expired' : 'Statute :: Active'}
                                        </button>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>

                    {/* Warning Manifest */}
                    <div className="p-12 rounded-[3.5rem] bg-slate-900 border border-white/5 relative overflow-hidden group shadow-3xl">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                             <Lock size={120} className="text-white" />
                        </div>
                        <div className="relative z-10 flex gap-10 items-start">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xl shadow-amber-500/10">
                                <AlertTriangle size={32} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-4 group-hover:text-amber-400 transition-colors">Forensic Alert: <br/>Re-aging / Restart Risk</h4>
                                <p className="text-lg text-slate-400 leading-relaxed font-medium">
                                    Implicit acknowledgment or partial payment can <span className="text-amber-500 font-black">RESTART</span> the SOL timer in current jurisdiction. 
                                    Do not initiate fiscal movement without a pre-authenticated <span className="text-white underline decoration-amber-500 underline-offset-8">Pay-for-Delete</span> manifest.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statutory Shield Sidebar */}
                <div className="lg:col-span-4 space-y-12">
                     <div className="p-10 rounded-[3.5rem] bg-slate-950 border border-white/5 shadow-3xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-white tracking-tight mb-10 flex items-center gap-4 uppercase">
                                <ShieldCheck size={28} className="text-emerald-500" />
                                Protections
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Mini-CFPA / State FDCPA', active: law.consumerProtections.hasMiniCFPA },
                                    { label: 'Debt Buyer Transcript Law', active: law.consumerProtections.hasDebtBuyerLaw },
                                    { label: 'Medical Debt Shield', active: law.consumerProtections.hasMedicalDebtProtections },
                                    { label: 'Legal Right of Action', active: law.consumerProtections.hasPrivateRightOfAction }
                                ].map((p, i) => (
                                    <div key={i} className={cn(
                                        "p-6 rounded-[2.2rem] border transition-all duration-500 group cursor-default",
                                        p.active 
                                            ? "bg-slate-900 border-white/5 hover:border-emerald-500/30" 
                                            : "bg-slate-950 border-white/5 opacity-40 grayscale"
                                    )}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest font-mono", p.active ? "text-emerald-400" : "text-slate-500")}>{p.label}</p>
                                            {p.active ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Info size={14} className="text-slate-700" />}
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">
                                            {p.active ? "Institutional safeguards authenticated." : "Standard federal baseline active."}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>

                     <div className="p-12 rounded-[3.5rem] bg-indigo-600 border border-indigo-500 relative overflow-hidden shadow-3xl flex flex-col justify-between min-h-[400px] group">
                        <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                             <Scale size={180} className="text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-8 shadow-2xl">
                                <Scale size={32} className="text-white" />
                            </div>
                            <h4 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Enforcement</h4>
                            <p className="text-sm font-black text-white/60 mb-8 font-mono tracking-widest uppercase">{law.regulatoryBody.name}</p>
                            <p className="text-lg text-white/80 leading-relaxed font-medium italic pr-6 group-hover:text-white transition-colors">
                                Primary agency for state-level consumer compliance and institution oversight.
                            </p>
                        </div>
                        <a
                            href={law.regulatoryBody.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 w-full mt-10 py-5 bg-white text-slate-950 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-slate-100 transition-all shadow-2xl active:scale-95 transform"
                        >
                            Open Portal <ExternalLink size={14} />
                        </a>
                     </div>
                </div>
            </div>

            {/* Interest Ceilings Ledger */}
            <div className="p-12 bg-slate-950 border border-white/5 rounded-[4rem] shadow-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 flex gap-4 opacity-5">
                    <Terminal size={140} className="text-blue-500" />
                </div>
                <div className="flex items-center justify-between mb-16 px-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/5">
                            <Cpu size={24} className="text-blue-500" />
                        </div>
                        Usury Ceiling Matrix
                    </h3>
                    <div className="px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                         <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] font-mono">Interest Caps Restricted</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                    {[
                        { label: 'Court Judgments', value: law.interestCaps.judgments, icon: Gavel, color: 'text-indigo-500' },
                        { label: 'Medical Debt', value: law.interestCaps.medical, icon: ShieldCheck, color: 'text-emerald-500' },
                        { label: 'Consumer Debt', value: law.interestCaps.consumer, icon: Scale, color: 'text-blue-500' }
                    ].map((cap, i) => (
                        <div key={i} className="group cursor-default relative">
                             <div className="flex items-center gap-4 mb-8 text-slate-500 group-hover:text-white transition-colors">
                                <cap.icon size={20} className={cap.color} />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono">{cap.label}</span>
                             </div>
                             <div className="flex items-end gap-3">
                                <p className="text-7xl font-black text-white tracking-tighter font-mono group-hover:scale-105 transition-transform origin-left">{cap.value}%</p>
                                <div className={cn("h-3 w-3 rounded-full mb-6", cap.color.replace('text-', 'bg-'))} />
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatuteTrackerTab;
