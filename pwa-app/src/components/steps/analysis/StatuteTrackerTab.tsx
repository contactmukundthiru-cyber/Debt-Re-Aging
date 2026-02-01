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
        { label: 'Written_Contracts', key: 'writtenContracts' as keyof typeof law.sol },
        { label: 'Oral_Contracts', key: 'oralContracts' as keyof typeof law.sol },
        { label: 'Promissory_Notes', key: 'promissoryNotes' as keyof typeof law.sol },
        { label: 'Open_Accounts', key: 'openAccounts' as keyof typeof law.sol }
    ];

    return (
        <div className="fade-in space-y-20 pb-32">
            {/* Elite Jurisdictional Header */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 via-indigo-500/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
                    
                    <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
                        <div className="lg:col-span-7">
                             <div className="flex items-center gap-6 mb-12">
                                <div className="px-5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-3">
                                    <Globe size={14} className="text-blue-400 animate-pulse" />
                                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-blue-400 font-mono">Jurisdictional Node v5.0</span>
                                </div>
                                <div className="h-px w-10 bg-slate-800" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Nexus: {law.name}</span>
                            </div>

                            <h2 className="text-7xl font-black text-white tracking-tighter mb-10 leading-[0.9] italic uppercase">
                                Jurisdictional <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-indigo-600">Statute Matrix</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-xl font-medium italic border-l-2 border-blue-500/30 pl-8">
                                Cross-referencing state-specific legal constraints, consumer protections, and usury limits for high-fidelity compliance audits across the North American financial landscape.
                            </p>
                            
                            <div className="flex items-center gap-16">
                                 <div className="group/stat">
                                     <p className="text-[9px] uppercase text-slate-500 font-black tracking-[0.5em] font-mono mb-3">Primary_Jurisdiction</p>
                                     <div className="flex items-baseline gap-3">
                                        <p className="text-6xl font-black text-white font-mono tracking-tighter drop-shadow-2xl">{selectedState}</p>
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                     </div>
                                 </div>
                                 <div className="h-16 w-px bg-slate-800" />
                                 <div className="group/stat">
                                     <p className="text-[9px] uppercase text-slate-500 font-black tracking-[0.5em] font-mono mb-3">Protection_Tier</p>
                                     <p className="text-5xl font-black text-blue-400 font-mono tracking-tighter italic">GOLD_LEVEL</p>
                                 </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 relative group/select">
                             <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/20 to-transparent rounded-[3rem] blur-sm opacity-50 group-hover/select:opacity-100 transition-all" />
                             <div className="relative bg-slate-900/20 border border-white/10 p-12 rounded-[3.5rem] backdrop-blur-3xl shadow-inner min-h-[340px] flex flex-col justify-center">
                                 <div className="space-y-8">
                                     <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono">Archive_Index_Search</h4>
                                        <Terminal size={12} className="text-blue-500" />
                                     </div>
                                     <div className="relative group/field">
                                        <label htmlFor="state-selector" className="sr-only">Select State Jurisdiction</label>
                                        <select
                                            id="state-selector"
                                            title="Select State Jurisdiction"
                                            value={selectedState}
                                            onChange={(e) => setSelectedState(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded-[2rem] px-10 py-6 text-sm font-black text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer tracking-[0.2em] uppercase hover:bg-slate-900 shadow-2xl font-mono italic"
                                        >
                                            {Object.keys(STATE_LAWS).sort().map(code => (
                                                <option key={code} value={code} className="bg-slate-950">{code} :: {STATE_LAWS[code].name.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover/field:text-blue-400 transition-colors">
                                            <ChevronRight size={20} className="rotate-90" />
                                        </div>
                                     </div>
                                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] text-center italic px-6 leading-relaxed">
                                        Adjusting jurisdiction recomputes temporal thresholds across the global analytic dataset.
                                     </p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-16">
                {/* SOL Matrix */}
                <div className="lg:col-span-8 space-y-16">
                    <div className="flex items-center justify-between mb-4 px-4">
                        <div className="flex items-center gap-8">
                            <div className="w-16 h-16 rounded-[2rem] bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-2xl">
                                <Clock size={28} />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">Temporal Spectrum</h4>
                                <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold mt-1">Institutional Statutory Compliance</p>
                            </div>
                        </div>
                        <div className="px-6 py-2 bg-slate-900/50 border border-white/5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 font-mono italic animate-pulse">
                            Matrix Active
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={selectedState}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "circOut" }}
                            className="grid md:grid-cols-2 gap-10"
                        >
                            {solTypes.map((type, idx) => {
                                const years = law.sol[type.key];
                                const expiry = calculateExpiry(fields.dateLastPayment, years);
                                const isExpired = expiry ? expiry < new Date() : false;

                                return (
                                    <div key={type.key} className="group relative">
                                        <div className="absolute -inset-px bg-gradient-to-br from-blue-500/20 to-transparent rounded-[3.5rem] opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                                        <div className="relative bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 transition-all duration-700 flex flex-col shadow-2xl overflow-hidden">
                                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-700">
                                                <Gavel size={100} />
                                            </div>
                                            
                                            <div className="flex items-center justify-between mb-10">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", isExpired ? "bg-rose-500 animate-pulse" : "bg-emerald-500")} />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 font-mono">{type.label}</p>
                                                </div>
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-inner border border-white/5 font-mono text-xl",
                                                    isExpired ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                )}>
                                                    {years}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-baseline justify-between mb-12">
                                                <div className="flex items-baseline gap-2">
                                                    <p className="text-7xl font-black text-white tracking-tighter font-mono">{years}</p>
                                                    <span className="text-xl font-black text-slate-600 italic uppercase">Year</span>
                                                </div>
                                                {fields.dateLastPayment && (
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 font-mono">Dossier_Lock</p>
                                                        <p className="text-sm font-black text-blue-400 font-mono uppercase tracking-tighter italic">{expiry?.toLocaleDateString()}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className={cn(
                                                "w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono border text-center transition-all duration-500 shadow-inner",
                                                isExpired 
                                                    ? "bg-rose-500/5 text-rose-500 border-rose-500/10 group-hover:bg-rose-500 group-hover:text-white" 
                                                    : "bg-emerald-500/5 text-emerald-500 border-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white"
                                            )}>
                                                {isExpired ? 'Statute_Expired' : 'Statute_Enforceable'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>

                    {/* Warning Manifest */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-amber-500/20 to-transparent rounded-[4rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                        <div className="relative p-12 rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-1/4 -translate-y-1/4">
                                <Radiation size={200} className="text-amber-500" />
                            </div>
                            <div className="relative z-10 flex gap-12 items-start">
                                <div className="w-20 h-20 rounded-[2.5rem] bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform duration-500">
                                    <AlertTriangle size={36} />
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none group-hover:text-amber-400 transition-colors">Neural_Alert: <br/>Temporal_Reset_Risk</h4>
                                    <p className="text-lg text-slate-400 leading-[1.8] font-medium italic border-l-2 border-amber-500/30 pl-8">
                                        Implicit acknowledgment or partial payment can <span className="text-amber-400 font-black tracking-widest uppercase underline decoration-2 underline-offset-8">restart</span> the SOL timer in current jurisdiction. 
                                        Do not transmit fiscal signals without a pre-authenticated <span className="text-white font-black underline decoration-blue-500 decoration-2 underline-offset-8">Nexus Protocol</span> clearance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statutory Shield Sidebar */}
                <div className="lg:col-span-4 space-y-16">
                     <div className="relative group/shield">
                        <div className="absolute -inset-1 bg-gradient-to-b from-emerald-500/20 to-transparent rounded-[4rem] blur-xl opacity-30 group-hover/shield:opacity-60 transition duration-700" />
                        <div className="relative p-12 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] shadow-2xl overflow-hidden min-h-[500px]">
                            <h3 className="text-2xl font-black text-white tracking-tighter flex items-center gap-6 uppercase italic mb-12">
                                <ShieldCheck size={32} className="text-emerald-500 group-hover/shield:rotate-12 transition-transform" />
                                Protections
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { label: 'Mini-CFPA / State FDCPA', active: law.consumerProtections.hasMiniCFPA },
                                    { label: 'Debt Buyer Transcript Law', active: law.consumerProtections.hasDebtBuyerLaw },
                                    { label: 'Medical Debt Shield', active: law.consumerProtections.hasMedicalDebtProtections },
                                    { label: 'Legal Right of Action', active: law.consumerProtections.hasPrivateRightOfAction }
                                ].map((p, i) => (
                                    <div key={i} className={cn(
                                        "p-8 rounded-[2.5rem] border transition-all duration-700 group/item cursor-default overflow-hidden relative",
                                        p.active 
                                            ? "bg-slate-950/40 border-white/5 hover:border-emerald-500/30" 
                                            : "bg-slate-950/20 border-white/5 opacity-20 grayscale scale-95"
                                    )}>
                                        <div className="flex items-center justify-between mb-4">
                                            <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] font-mono transition-colors", p.active ? "text-emerald-400" : "text-slate-600")}>{p.label}</p>
                                            {p.active ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Lock size={12} className="text-slate-800" />}
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-relaxed italic">
                                            {p.active ? "Institutional safeguards authenticated." : "Standard federal baseline active."}
                                        </p>
                                        {p.active && <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>

                     <div className="p-12 rounded-[4rem] bg-gradient-to-br from-indigo-700 to-indigo-900 border border-indigo-500 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[440px] group/enf transition-all duration-1000">
                        <div className="absolute top-0 right-0 p-12 opacity-10 scale-[2.2] rotate-12 group-hover/enf:rotate-0 group-hover/enf:scale-[2.5] transition-transform duration-1000 ease-out">
                             <Scale size={200} className="text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-18 h-18 rounded-3xl bg-white/20 backdrop-blur-2xl flex items-center justify-center mb-10 shadow-3xl border border-white/30 group-hover/enf:scale-110 transition-transform">
                                <Scale size={36} className="text-white" />
                            </div>
                            <h4 className="text-4xl font-black text-white tracking-tighter uppercase mb-2 italic">Enforcement</h4>
                            <p className="text-[10px] font-black text-white/50 mb-10 font-mono tracking-[0.3em] uppercase">{law.regulatoryBody.name}</p>
                            <p className="text-lg text-white/80 leading-relaxed font-bold italic pr-6 group-hover:text-white transition-colors uppercase tracking-tight">
                                Primary executive agency for state-level consumer compliance and adversarial institution oversight.
                            </p>
                        </div>
                        <a
                            href={law.regulatoryBody.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 w-full mt-10 py-6 bg-white text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-3xl active:scale-95 transform group/btn"
                        >
                            Open_Nexus_Portal <ExternalLink size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        </a>
                     </div>
                </div>
            </div>

            {/* Interest Ceilings Ledger */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative p-16 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 p-16 flex gap-6 opacity-5">
                        <Terminal size={180} className="text-blue-500" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-20 px-4">
                        <div className="flex items-center gap-10">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-slate-900 flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                                <Cpu size={36} className="text-blue-500 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Usury Ceiling Matrix</h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-black mt-3">Fiscal_Restriction_Ledger</p>
                            </div>
                        </div>
                        <div className="px-8 py-3 bg-blue-500/10 border border-blue-500/20 rounded-full">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] font-mono">Caps_Locked: ACTIVE</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-24 relative px-4">
                        {[
                            { label: 'Court_Judgments', value: law.interestCaps.judgments, icon: Gavel, color: 'text-indigo-400' },
                            { label: 'Medical_Debt', value: law.interestCaps.medical, icon: ShieldCheck, color: 'text-emerald-400' },
                            { label: 'Consumer_Debt', value: law.interestCaps.consumer, icon: Scale, color: 'text-blue-400' }
                        ].map((cap, i) => (
                            <div key={i} className="group/item cursor-default relative">
                                <div className="flex items-center gap-6 mb-10 text-slate-500 group-hover/item:text-white transition-colors">
                                    <cap.icon size={24} className={cap.color} />
                                    <span className="text-[11px] font-black uppercase tracking-[0.5em] font-mono">{cap.label}</span>
                                </div>
                                <div className="flex items-end gap-4">
                                    <p className="text-8xl font-black text-white tracking-tighter font-mono group-hover/item:scale-110 transition-transform origin-left drop-shadow-2xl">{cap.value}</p>
                                    <div className="flex flex-col mb-4">
                                        <span className="text-2xl font-black text-slate-500 font-mono italic uppercase">%</span>
                                        <div className={cn("h-4 w-4 rounded-full mt-2 animate-pulse shadow-[0_0_10px_currentColor]", cap.color)} />
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-white/5 opacity-40 group-hover/item:opacity-100 transition-opacity">
                                    <p className="text-[8px] font-mono font-black text-slate-600 uppercase tracking-widest italic group-hover/item:text-slate-400">Statutory_Cap_Enforced</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatuteTrackerTab;
