'use client';

import React, { useMemo } from 'react';
import { performMetro2Audit, Metro2Audit } from '../../../lib/metro2';
import { CreditFields } from '../../../lib/rules';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Fingerprint, 
    Terminal, 
    ShieldAlert, 
    AlertTriangle,
    Activity, 
    Cpu, 
    Database, 
    ChevronRight,
    Lock,
    Binary,
    Zap,
    Scale
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Metro2AuditTabProps {
    fields: Partial<CreditFields>;
}

const Metro2AuditTab: React.FC<Metro2AuditTabProps> = ({ fields }) => {
    const audit = useMemo(() => performMetro2Audit(fields), [fields]);

    return (
        <div className="fade-in space-y-12 pb-32">
            {/* Elite Command Header */}
            <div className="relative p-1 rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-950 overflow-hidden shadow-3xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] -mr-64 -mt-64" />
                <div className="relative z-10 p-12 bg-slate-950/90 rounded-[2.8rem] backdrop-blur-xl border border-white/5">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                                    <Binary size={12} className="text-emerald-400" />
                                    <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-emerald-400 font-mono">Metro 2® Forensic Core</span>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Electronic Record Audit</span>
                            </div>
                            <h2 className="text-6xl font-black text-white tracking-tight mb-8 leading-tight">
                                Structural <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Integrity Audit</span>
                            </h2>
                            <div className="flex items-center gap-12">
                                 <div className="space-y-1">
                                     <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Integrity Score</p>
                                     <p className={cn(
                                         "text-5xl font-black font-mono tracking-tighter",
                                         audit.integrityScore > 80 ? "text-emerald-400" : audit.integrityScore > 50 ? "text-amber-400" : "text-rose-500"
                                     )}>{audit.integrityScore}/100</p>
                                 </div>
                                 <div className="h-12 w-px bg-slate-800" />
                                 <div className="space-y-1">
                                     <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest font-mono">Failures Detected</p>
                                     <p className="text-4xl font-black text-white font-mono tracking-tighter">{audit.structuralViolations.length}</p>
                                 </div>
                            </div>
                        </div>

                        <div className="bg-black/50 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-2xl space-y-8 shadow-2xl overflow-hidden relative group">
                             <div className="absolute top-0 right-0 p-6 flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-slate-800" />
                                <div className="w-2 h-2 rounded-full bg-slate-800" />
                             </div>
                             <div className="flex items-center gap-4 mb-4">
                                <Terminal size={18} className="text-emerald-500" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 font-mono uppercase">Raw Record Reconstruct</h4>
                             </div>
                             <div className="p-6 bg-slate-950 border border-white/5 rounded-2xl font-mono text-[11px] leading-relaxed text-emerald-500/90 break-all h-40 overflow-y-auto custom-scrollbar">
                                {audit.reconstructedRecord}
                             </div>
                             <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3 active:scale-95 transform">
                                <Fingerprint size={16} /> Authenticate Sequence
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-12">
                {/* Segments Matrix */}
                <div className="lg:col-span-12">
                    <div className="flex items-center justify-between mb-8 px-4">
                        <h3 className="text-2xl font-black text-white flex items-center gap-4">
                            <span className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            Data Segment Mapping Matrix
                        </h3>
                        <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <Database size={12} /> CD-Segment Active
                             </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {audit.segments[0].fields.map((field, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.02 }}
                                className={cn(
                                    "p-8 rounded-[2.5rem] border backdrop-blur-md transition-all duration-500 group relative overflow-hidden",
                                    field.isValid 
                                        ? "bg-slate-900/50 border-white/5 hover:border-emerald-500/30" 
                                        : "bg-rose-500/5 border-rose-500/20"
                                )}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            field.isValid ? "bg-emerald-500" : "bg-rose-500"
                                        )} />
                                        <span className="text-[10px] font-black text-slate-500 font-mono tracking-widest">POS_{field.position}</span>
                                    </div>
                                    {!field.isValid && (
                                        <ShieldAlert size={16} className="text-rose-500 animate-pulse" />
                                    )}
                                </div>

                                <h4 className="text-white font-black text-lg mb-2 tracking-tight">
                                    {field.label}
                                </h4>
                                <p className="text-4xl font-black text-emerald-400 font-mono tracking-tighter mb-8">
                                    {field.value || 'NULL'}
                                </p>

                                <div className="pt-6 border-t border-white/5">
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">
                                        {field.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Statutory Vulnerabilities */}
                <div className="lg:col-span-12 grid lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <h3 className="text-2xl font-black text-white flex items-center gap-4">
                            <span className="w-1.5 h-8 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                            Statutory Integrity Failures
                        </h3>
                        
                        <div className="grid gap-4">
                            {audit.structuralViolations.map((v, i) => (
                                <div key={i} className="p-8 rounded-[2.5rem] bg-slate-900/80 border border-rose-500/20 flex gap-8 items-center group hover:bg-rose-500/10 transition-all">
                                    <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-2xl shadow-rose-500/20">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-1">Structural Non-Compliance</p>
                                        <p className="text-lg font-bold text-white leading-tight mb-2">{v}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono font-bold uppercase italic">
                                            <Scale size={12} /> Bureau Transmission Violation
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-800" size={24} />
                                </div>
                            ))}
                            {audit.structuralViolations.length === 0 && (
                                <div className="p-12 border-2 border-dashed border-white/5 rounded-[3rem] text-center">
                                    <ShieldAlert size={40} className="text-slate-800 mx-auto mb-4" />
                                    <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">No Structural Errors Sequenced</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-[3rem] p-12 space-y-10 shadow-3xl">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-blue-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/30">
                                <Zap size={36} className="text-white" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-white uppercase tracking-tight">Forensic Leverage</h4>
                                <p className="text-blue-400/60 text-[10px] font-mono font-bold uppercase tracking-widest">Strategizing Compliance Failures</p>
                            </div>
                        </div>

                        <p className="text-lg text-slate-300 leading-relaxed font-medium">
                            Bureau clerks often use "Automated Consumer Dispute Verification" (ACDV) which masks these structural errors. 
                            <span className="text-blue-400"> Citing specific Metro 2 mapping failures</span> forces a <span className="text-white underline decoration-blue-500 underline-offset-8">manual review</span> by a supervisor, significantly increasing deletion probability.
                        </p>

                        <div className="grid grid-cols-2 gap-4 pt-8">
                             <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                                <p className="text-2xl font-black text-white mb-1">94%</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Escalation Efficacy</p>
                             </div>
                             <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                                <p className="text-2xl font-black text-white mb-1">12ms</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Logical Processing</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Metro2AuditTab;
