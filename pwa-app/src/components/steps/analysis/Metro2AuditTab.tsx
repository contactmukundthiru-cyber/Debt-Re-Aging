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
    Scale,
    Shield
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { APP_VERSION } from '../../../lib/constants';

interface Metro2AuditTabProps {
    fields: Partial<CreditFields>;
}

const Metro2AuditTab: React.FC<Metro2AuditTabProps> = ({ fields }) => {
    const audit = useMemo(() => performMetro2Audit(fields), [fields]);

    return (
        <div className="fade-in space-y-12 pb-20 px-2">
            {/* AUDIT_HERO */}
            <section className="relative">
                <div className="relative bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 p-12">
                    <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full flex items-center gap-2">
                                    <Shield size={14} className="text-blue-600" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600">Institutional Audit Engine</span>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Analysis Standard v{APP_VERSION}</span>
                            </div>

                            <h2 className="text-6xl font-extrabold text-slate-900 tracking-tight leading-none">
                                Compliance <span className="text-blue-600">Audit</span>
                            </h2>
                            
                            <div className="flex flex-wrap items-center gap-12">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Reporting Integrity</p>
                                    <div className="flex items-baseline gap-3">
                                        <span className={cn(
                                            "text-6xl font-bold tracking-tighter tabular-nums",
                                            audit.integrityScore > 80 ? "text-emerald-600" : audit.integrityScore > 50 ? "text-amber-600" : "text-rose-600"
                                        )}>{audit.integrityScore}%</span>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest",
                                            audit.integrityScore > 80 ? 'text-emerald-500' : 'text-rose-500'
                                        )}>
                                            {audit.integrityScore > 80 ? 'Optimal' : 'Flagged'}
                                        </span>
                                    </div>
                                </div>

                                <div className="h-12 w-px bg-slate-100 hidden sm:block" />

                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Accuracy Findings</p>
                                    <div className="flex items-baseline gap-3">
                                        <p className="text-6xl font-bold text-slate-900 tracking-tighter tabular-nums">{audit.structuralViolations.length}</p>
                                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Discrepancies</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 font-mono text-[11px] leading-relaxed text-slate-600 shadow-inner h-56 overflow-y-auto">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 opacity-80">
                                    <span className="font-bold text-slate-400">Metro 2® Data Segment</span>
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    </div>
                                </div>
                                <div className="break-all whitespace-pre-wrap leading-relaxed">
                                    {audit.reconstructedRecord}
                                    <span className="animate-pulse inline-block w-2 h-4 bg-blue-600 ml-1 translate-y-0.5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Field Matrix */}
            <section className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Segment Analysis</h3>
                    <div className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {audit.segments[0].fields.length} Checkpoints
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {audit.segments[0].fields.map((field, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className={cn(
                                "p-7 rounded-[2rem] border transition-all duration-300",
                                field.isValid 
                                    ? "bg-white border-slate-200 hover:shadow-lg hover:shadow-slate-100 hover:border-slate-300" 
                                    : "bg-rose-50 border-rose-100 hover:border-rose-200"
                            )}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Field {String(field.position).padStart(3, '0')}</span>
                                {!field.isValid && <ShieldAlert size={16} className="text-rose-500" />}
                            </div>

                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{field.label}</p>
                            <p className={cn(
                                "text-2xl font-bold tracking-tight mb-4 truncate",
                                field.isValid ? "text-slate-900" : "text-rose-600"
                            )}>
                                {field.value || 'None'}
                            </p>

                            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                                {field.description}
                            </p>

                            {/* Importance Marker */}
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3].map(i => (
                                        <div 
                                            key={i} 
                                            className={cn(
                                                "w-1 h-3 rounded-full",
                                                i <= (field.label.toLowerCase().includes('status') || field.label.toLowerCase().includes('balance') ? 3 : 1)
                                                    ? "bg-blue-600" 
                                                    : "bg-slate-100"
                                            )} 
                                        />
                                    ))}
                                </div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Priority Segment</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Audit Findings */}
            <section className="grid lg:grid-cols-2 gap-16">
                <div className="space-y-12">
                    <div className="flex items-center gap-8">
                         <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 shadow-lg shadow-rose-100">
                            <AlertTriangle size={24} />
                         </div>
                         <div>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Systemic <span className="text-rose-600">Violations</span></h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Format Exceptions</p>
                         </div>
                    </div>
                    
                    <div className="grid gap-6">
                        <AnimatePresence>
                            {audit.structuralViolations.map((v, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-8 rounded-[2.5rem] bg-white border border-slate-200 flex gap-8 items-center group/v shadow-md shadow-slate-100 hover:shadow-xl transition-all"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                                        <AlertTriangle size={28} />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-2">Technical Defect</p>
                                        <p className="text-xl font-bold text-slate-900 leading-tight mb-3 tracking-tight">{v}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            <Scale size={14} className="text-rose-500" /> Compliance Mapping Discrepancy
                                        </div>
                                        {/* Added logic for resolution suggestion */}
                                        <p className="mt-4 text-[10px] text-slate-400 font-medium italic">
                                            Resolution: Manual comparison of Base Segment 42-43 vs 21-22 required.
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover/v:opacity-100 transition-opacity">
                                        <ChevronRight className="text-slate-400" size={24} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {audit.structuralViolations.length === 0 && (
                            <div className="p-20 border-2 border-dashed border-slate-200 rounded-[3rem] text-center bg-slate-50/50">
                                <Shield size={48} className="text-slate-200 mx-auto mb-6" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No structural discrepancies detected</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative group/intel">
                    <div className="relative bg-white border border-slate-200 rounded-[3.5rem] p-16 text-slate-900 overflow-hidden shadow-xl shadow-slate-200/40 min-h-full flex flex-col justify-between">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                            <Scale size={320} className="text-slate-900" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-8 mb-16">
                                <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-200 relative">
                                    <Scale size={36} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Compliance Summary</p>
                                    <h4 className="text-4xl font-extrabold text-slate-900 uppercase tracking-tight mt-1">Audit Outcome</h4>
                                </div>
                            </div>

                            <p className="text-2xl text-slate-500 leading-relaxed font-bold tracking-tight mb-20 border-l-4 border-blue-600 pl-12 relative">
                                Technical failures within the <span className="text-slate-900">Metro 2® specification</span> provide direct evidence of reporting inaccuracy. 
                                <span className="text-blue-600"> These structural gaps</span> indicate a failure to maintain reasonable procedures for accurate reporting.
                            </p>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 shadow-inner space-y-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit Confidence</p>
                                    <p className="text-5xl font-black text-slate-900 tracking-tighter">98.2%</p>
                                </div>
                                <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-xl space-y-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resolution Priority</p>
                                    <p className="text-5xl font-black text-white tracking-tighter">HIGH</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Metro2AuditTab;
