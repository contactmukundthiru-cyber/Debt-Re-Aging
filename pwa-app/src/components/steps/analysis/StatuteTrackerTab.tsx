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
    Shield,
    ChevronRight,
    Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { APP_VERSION } from '../../../lib/constants';

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
        <div className="fade-in space-y-12 pb-32 px-2">
            {/* Jurisdictional Header */}
            <section className="relative">
                <div className="relative bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 p-12">
                    <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full flex items-center gap-2">
                                    <Globe size={14} className="text-blue-600" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600">Statutory Analysis Engine</span>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Standard v{APP_VERSION}</span>
                            </div>

                            <h2 className="text-6xl font-extrabold text-slate-900 tracking-tight leading-none">
                                Statute <span className="text-blue-600">Compliance</span>
                            </h2>
                            <p className="text-slate-500 text-lg leading-relaxed max-w-xl font-medium">
                                Cross-referencing state-specific legal constraints, consumer protections, and usury limits for jurisdictional compliance audits.
                            </p>
                            
                            <div className="flex items-center gap-12">
                                 <div>
                                     <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">State Jurisdiction</p>
                                     <div className="flex items-baseline gap-2">
                                        <p className="text-6xl font-bold text-slate-900 tracking-tighter tabular-nums">{selectedState}</p>
                                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                                     </div>
                                 </div>
                                 <div className="h-12 w-px bg-slate-100 hidden sm:block" />
                                 <div>
                                     <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Protection Level</p>
                                     <p className="text-2xl font-bold text-blue-600 tracking-tight uppercase">High Priority</p>
                                 </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                             <div className="bg-slate-50 border border-slate-200 p-10 rounded-[2.5rem] shadow-inner">
                                 <div className="space-y-6">
                                     <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Jurisdiction</h4>
                                        <Scale size={16} className="text-blue-600" />
                                     </div>
                                     <div className="relative group">
                                        <select
                                            id="state-selector"
                                            title="Select State Jurisdiction"
                                            value={selectedState}
                                            onChange={(e) => setSelectedState(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer shadow-sm hover:border-slate-300"
                                        >
                                            {Object.keys(STATE_LAWS).sort().map(code => (
                                                <option key={code} value={code}>{code} - {STATE_LAWS[code].name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronRight size={18} className="rotate-90" />
                                        </div>
                                     </div>
                                     <p className="text-[10px] text-slate-500 font-semibold text-center italic leading-relaxed">
                                        Updating jurisdiction recomputes temporal thresholds across the analytical dataset.
                                     </p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid lg:grid-cols-12 gap-12">
                {/* SOL Matrix */}
                <div className="lg:col-span-8 space-y-12">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100 shadow-sm">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Temporal Thresholds</h4>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Institutional Statutory Limits</p>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={selectedState}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid md:grid-cols-2 gap-8"
                        >
                            {solTypes.map((type) => {
                                const years = law.sol[type.key];
                                const expiry = calculateExpiry(fields.dateLastPayment, years);
                                const isExpired = expiry ? expiry < new Date() : false;

                                return (
                                    <div key={type.key} className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-2 h-2 rounded-full", isExpired ? "bg-rose-500" : "bg-emerald-500")} />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{type.label}</p>
                                            </div>
                                            <div className={cn(
                                                "px-3 py-1 rounded-lg font-bold text-xs",
                                                isExpired ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                                            )}>
                                                {years} Years
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-baseline justify-between mb-8">
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-6xl font-bold text-slate-900 tracking-tighter tabular-nums">{years}</p>
                                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Limit</span>
                                            </div>
                                            {fields.dateLastPayment && (
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expiration</p>
                                                    <p className="text-lg font-bold text-blue-600 tabular-nums">{expiry?.toLocaleDateString()}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className={cn(
                                            "w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border text-center transition-all duration-300",
                                            isExpired 
                                                ? "bg-rose-50 text-rose-600 border-rose-100" 
                                                : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        )}>
                                            {isExpired ? 'Statute Expired' : 'Active Limitation'}
                                        </div>

                                        {/* Legal Authority Citation */}
                                        <div className="mt-6 flex items-start gap-2 group/cite">
                                            <Scale size={12} className="text-slate-400 mt-1" />
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                                Authority: {law.keyStatutes.find(s => s.toLowerCase().includes('sol')) || law.keyStatutes[0] || 'State Limitation Code'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>

                    {/* Legal Context & Citations */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-10 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform" />
                            <div className="relative z-10">
                                <h4 className="text-lg font-black text-slate-900 tracking-tight mb-6">Legislative Basis</h4>
                                <div className="space-y-4">
                                    {law.keyStatutes.map((statute, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-slate-200 text-blue-600 shrink-0">
                                                <Gavel size={14} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 leading-tight py-1">{statute}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-10 rounded-[2.5rem] bg-slate-900 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform" />
                            <div className="relative z-10">
                                <h4 className="text-lg font-black text-blue-400 tracking-tight mb-6">Tolling Factors</h4>
                                <div className="space-y-4">
                                    {law.specialNotes.map((note, i) => (
                                        <div key={i} className="flex items-start gap-4">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                            <p className="text-xs font-medium text-slate-300 leading-relaxed italic">"{note}"</p>
                                        </div>
                                    ))}
                                    {law.specialNotes.length === 0 && (
                                        <p className="text-xs font-medium text-slate-400">Standard tolling rules apply based on federal guidelines.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warning Notice */}
                    <div className="relative p-10 rounded-[2.5rem] bg-amber-50 border border-amber-100 shadow-xl shadow-amber-100/20">
                        <div className="flex gap-8 items-start">
                            <div className="w-14 h-14 rounded-2xl bg-white text-amber-500 flex items-center justify-center shrink-0 border border-amber-200 shadow-sm">
                                <AlertTriangle size={28} />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Limitation Notice</h4>
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    Implicit acknowledgment or partial payment can <span className="text-amber-700 font-bold underline decoration-2 underline-offset-4">restart</span> the Statute of Limitations clock in this jurisdiction. 
                                    Do not initiate contact or make offers without confirming the current enforceable status.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Protections Sidebar */}
                <div className="lg:col-span-4 space-y-12">
                     <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-4 uppercase mb-10">
                            <ShieldCheck size={24} className="text-emerald-500" />
                            Safeguards
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: 'State-Level FDCPA', active: law.consumerProtections.hasMiniCFPA },
                                { label: 'Debt Buyer Transcript', active: law.consumerProtections.hasDebtBuyerLaw },
                                { label: 'Medical Debt Protection', active: law.consumerProtections.hasMedicalDebtProtections },
                                { label: 'Private Right of Action', active: law.consumerProtections.hasPrivateRightOfAction }
                            ].map((p, i) => (
                                <div key={i} className={cn(
                                    "p-6 rounded-3xl border transition-all duration-300",
                                    p.active 
                                        ? "bg-white border-slate-200 shadow-sm hover:border-emerald-200" 
                                        : "bg-slate-50 border-slate-100 opacity-40 grayscale"
                                )}>
                                    <div className="flex items-center justify-between">
                                        <p className={cn("text-xs font-bold uppercase tracking-widest", p.active ? "text-slate-900" : "text-slate-500")}>{p.label}</p>
                                        {p.active ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Lock size={12} className="text-slate-400" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>

                     <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-blue-200/50 flex flex-col justify-between min-h-[400px]">
                        <div className="space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                                <Scale size={28} className="text-white" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-3xl font-bold tracking-tight uppercase">Regulatory</h4>
                                <p className="text-[10px] font-bold text-white/60 font-mono tracking-widest uppercase">{law.regulatoryBody.name}</p>
                            </div>
                            <p className="text-lg text-white/90 leading-relaxed font-semibold">
                                Primary agency for state-level consumer compliance and adversarial institution oversight.
                            </p>
                        </div>
                        <a
                            href={law.regulatoryBody.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full mt-10 py-5 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-lg shadow-white/10"
                        >
                            Open Agency Portal <ExternalLink size={14} />
                        </a>
                     </div>
                </div>
            </div>

            {/* Interest Caps */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-xl shadow-slate-200/50">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex gap-8 items-center">
                        <div className="w-16 h-16 rounded-[2rem] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
                            <Zap size={32} />
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-3xl font-bold text-slate-900 tracking-tight leading-none uppercase">Usury Limits</h4>
                            <p className="text-slate-500 leading-relaxed font-medium">
                                Maximum legal interest rates defined by state statute. Charges exceeding these thresholds represent a significant compliance violation.
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-10 min-w-[300px]">
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Legal Rate</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-5xl font-bold text-slate-900 tracking-tighter tabular-nums">{law.interestRates.legal}</p>
                                <span className="text-blue-600 font-bold text-xl">%</span>
                            </div>
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Judgement</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-5xl font-bold text-slate-900 tracking-tighter tabular-nums">{law.interestRates.judgement}</p>
                                <span className="text-blue-600 font-bold text-xl">%</span>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatuteTrackerTab;
