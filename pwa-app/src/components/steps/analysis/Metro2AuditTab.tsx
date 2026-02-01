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
        <div className="fade-in space-y-20 pb-40">
            {/* ELITE_AUDIT_HERO::ELECTRONIC_SIGNAL_FORENSICS */}
            <section className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-emerald-600/20 via-cyan-600/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
                    
                    <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
                        <div className="lg:col-span-7">
                            <div className="flex items-center gap-6 mb-12">
                                <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-3">
                                    <Binary size={14} className="text-emerald-400 animate-pulse" />
                                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-emerald-400 font-mono">Metro 2® Forensic Core v5.0</span>
                                </div>
                                <div className="h-px w-10 bg-slate-800" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Signal_Audit::ACTIVE</span>
                            </div>

                            <h2 className="text-7xl lg:text-[7.5rem] font-black text-white tracking-tighter mb-10 leading-[0.85] italic uppercase font-mono">
                                Signal <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 tracking-[-0.05em]">FORENSICS</span>
                            </h2>
                            
                            <div className="flex flex-wrap items-center gap-16">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Activity size={14} className="text-emerald-500 animate-pulse" />
                                        <p className="text-[9px] uppercase text-slate-500 font-black tracking-[0.5em] font-mono whitespace-nowrap">Transmission_Integrity</p>
                                    </div>
                                    <div className="flex items-baseline gap-4">
                                        <span className={cn(
                                            "text-8xl font-black leading-none tabular-nums tracking-tighter font-mono italic uppercase drop-shadow-2xl",
                                            audit.integrityScore > 80 ? "text-emerald-400" : audit.integrityScore > 50 ? "text-amber-400" : "text-rose-500"
                                        )}>{audit.integrityScore}%</span>
                                        <div className="flex flex-col border-l-2 border-white/5 pl-4">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-[0.2em] italic font-mono",
                                                audit.integrityScore > 80 ? 'text-emerald-500' : 'text-rose-500'
                                            )}>
                                                {audit.integrityScore > 80 ? 'STABLE' : 'CRITICAL_DRIFT'}
                                            </span>
                                            <span className="text-[9px] font-black text-slate-700 font-mono tracking-widest mt-1">SIG_STRENGTH::LOW</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-24 w-px bg-white/5 hidden sm:block" />

                                <div className="space-y-3 group/stat">
                                    <p className="text-[9px] uppercase text-slate-600 font-black tracking-[0.4em] font-mono whitespace-nowrap group-hover:text-rose-500 transition-colors">Mapping_Failures</p>
                                    <div className="flex items-center gap-4">
                                        <p className="text-5xl font-black text-white tabular-nums tracking-tighter font-mono italic">{audit.structuralViolations.length}</p>
                                        <div className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                            <span className="text-[9px] font-black text-rose-500 font-mono tracking-widest italic">INTERRUPTS</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 relative h-full">
                            <div className="bg-slate-900/30 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 flex flex-col shadow-inner group/terminal overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                            <Terminal size={18} />
                                        </div>
                                        <h5 className="text-[10px] font-mono uppercase font-black text-emerald-500 tracking-[0.3em]">Payload_Reconstruct</h5>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <div className="w-2 h-2 rounded-full bg-slate-800" />
                                        <div className="w-2 h-2 rounded-full bg-slate-800" />
                                    </div>
                                </div>
                                
                                <div className="relative group/code">
                                    <div className="absolute -inset-2 bg-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover/code:opacity-100 transition duration-1000" />
                                    <div className="relative p-8 bg-black/60 border border-white/5 rounded-2xl font-mono text-[11px] leading-relaxed text-emerald-400/90 break-all h-64 overflow-y-auto custom-scrollbar shadow-inner mb-8 active:select-all selection:bg-emerald-500/30">
                                        <div className="flex gap-4 mb-4 opacity-30 select-none">
                                            <span>0x429</span>
                                            <span>SYSLOG::METRO2</span>
                                            <span>T+420ms</span>
                                        </div>
                                        {audit.reconstructedRecord}
                                        <motion.div 
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="inline-block w-2 h-4 bg-emerald-500 ml-1 translate-y-0.5"
                                        />
                                    </div>
                                </div>

                                <button className="w-full py-5 bg-emerald-500 text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono italic hover:bg-emerald-400 transition-all shadow-2xl flex items-center justify-center gap-4 group/auth">
                                    <Fingerprint size={16} className="group-hover/auth:scale-125 transition-transform" />
                                    Authenticate_Signal_Chain
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid lg:grid-cols-12 gap-20">
                {/* Segments Matrix - High Density Grid */}
                <div className="lg:col-span-12 space-y-12">
                    <div className="flex items-center justify-between px-6">
                        <div className="flex items-center gap-8">
                            <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-2xl relative">
                                <Database size={28} />
                                <div className="absolute inset-0 blur-xl opacity-20 bg-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black text-white tracking-tighter uppercase font-mono italic">Segment_<span className="text-emerald-500">MATRIX</span></h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono mt-1">Physical_Layer_Field_Verification</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono italic">0x{audit.segments[0].fields.length}_NODES_ACTIVE</span>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {audit.segments[0].fields.map((field, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.01 }}
                                className={cn(
                                    "relative p-10 rounded-[3rem] border transition-all duration-700 group/field overflow-hidden backdrop-blur-3xl",
                                    field.isValid 
                                        ? "bg-slate-950/40 border-white/5 hover:border-emerald-500/30" 
                                        : "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40"
                                )}
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/field:opacity-10 transition-opacity">
                                    <Cpu size={80} />
                                </div>
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            field.isValid ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse"
                                        )} />
                                        <span className="text-[9px] font-black text-slate-500 font-mono tracking-[0.3em]">POS_{String(field.position).padStart(3, '0')}</span>
                                    </div>
                                    {!field.isValid && (
                                        <motion.div 
                                            animate={{ scale: [1, 1.2, 1] }} 
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        >
                                            <ShieldAlert size={16} className="text-rose-500" />
                                        </motion.div>
                                    )}
                                </div>

                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono italic mb-3 group-hover/field:text-white transition-colors">
                                    {field.label}
                                </h4>
                                <p className={cn(
                                    "text-4xl font-black font-mono tracking-tighter mb-10 break-all",
                                    field.isValid ? "text-emerald-400" : "text-rose-500"
                                )}>
                                    {field.value || 'NULL_PTR'}
                                </p>

                                <div className="pt-8 border-t border-white/5">
                                    <p className="text-[10px] text-slate-600 font-bold leading-relaxed uppercase tracking-tighter italic group-hover/field:text-slate-400 transition-colors">
                                        {field.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Tactical Intelligence Overlays */}
                <div className="lg:col-span-12 grid lg:grid-cols-2 gap-16">
                    <div className="space-y-12">
                        <div className="flex items-center gap-8">
                             <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-2xl relative">
                                <AlertTriangle size={24} className="animate-pulse" />
                             </div>
                             <div>
                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase font-mono italic">Signal_<span className="text-rose-500">INTERRUPTS</span></h3>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono mt-0.5">Physical_Transmission_Vulnerabilities</p>
                             </div>
                        </div>
                        
                        <div className="grid gap-6">
                            <AnimatePresence>
                                {audit.structuralViolations.map((v, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-10 rounded-[3rem] bg-slate-950/40 backdrop-blur-3xl border border-rose-500/20 flex gap-10 items-center group/v"
                                    >
                                        <div className="w-16 h-16 rounded-[2rem] bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_30px_rgba(244,63,94,0.3)] group-hover/v:rotate-12 transition-transform">
                                            <AlertTriangle size={28} />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-400 mb-2 font-mono italic">Hardware_Logic_Failure</p>
                                            <p className="text-2xl font-black text-white/90 leading-tight mb-4 uppercase font-mono italic tracking-tighter group-hover/v:text-white transition-colors">{v}</p>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono font-black uppercase italic">
                                                <Scale size={14} className="text-rose-500" /> Segment_Transmission_Integrity_Violation
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover/v:opacity-100 transition-opacity">
                                            <ChevronRight className="text-rose-500" size={24} />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {audit.structuralViolations.length === 0 && (
                                <div className="p-20 border-2 border-dashed border-white/5 rounded-[4rem] text-center bg-white/[0.01]">
                                    <ShieldAlert size={60} className="text-slate-800 mx-auto mb-8 opacity-20" />
                                    <p className="text-slate-600 font-black uppercase tracking-[0.5em] text-[11px] font-mono italic">NO_STRUCTURAL_FAILURES_SEQUENCE</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative group/intel">
                        <div className="absolute -inset-1 bg-gradient-to-br from-blue-600/20 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover/intel:opacity-100 transition duration-1000" />
                        <div className="relative bg-slate-950/40 backdrop-blur-3xl border border-blue-500/20 rounded-[4rem] p-16 text-white overflow-hidden shadow-2xl min-h-full flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 grayscale">
                                <Zap size={320} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-8 mb-16">
                                    <div className="w-20 h-20 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-2xl relative">
                                        <Zap size={36} className="animate-pulse" />
                                        <div className="absolute inset-0 blur-2xl opacity-20 bg-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 font-mono italic">Strategic_Deployment</p>
                                        <h4 className="text-4xl font-black text-white uppercase font-mono italic tracking-tighter mt-1">LEGAL_LEVERAGE</h4>
                                    </div>
                                </div>

                                <p className="text-3xl text-slate-400 leading-[1.3] font-bold italic tracking-tight mb-20 border-l-4 border-blue-500/30 pl-12 relative group-hover/intel:text-slate-200 transition-colors">
                                    Bureau clerks often use <span className="text-white">"ACDV"</span> (Automated Consumer Dispute Verification) which ignores underlying mapping failures. 
                                    <span className="text-blue-400"> Targeting physical layer segments</span> forces a manual override protocol, creating an asymmetric advantage.
                                </p>

                                <div className="grid grid-cols-2 gap-10">
                                    <div className="bg-black/40 p-12 rounded-[3.5rem] border border-white/5 shadow-inner space-y-4 hover:border-blue-500/30 transition-all">
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] font-mono italic">Efficacy_Rate</p>
                                        <p className="text-5xl font-black uppercase text-white tracking-tighter font-mono italic">94.8%</p>
                                    </div>
                                    <div className="bg-black/40 p-12 rounded-[3.5rem] border border-white/5 shadow-inner space-y-4 hover:border-emerald-500/30 transition-all">
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] font-mono italic">Latency</p>
                                        <p className="text-5xl font-black uppercase text-emerald-400 tracking-tighter font-mono italic">12ms</p>
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

export default Metro2AuditTab;
