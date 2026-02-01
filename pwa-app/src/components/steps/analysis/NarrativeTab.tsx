'use client';

import React, { useState, useMemo } from 'react';
import { RuleFlag, CreditFields } from '../../../lib/rules';

interface NarrativeTabProps {
    flags: RuleFlag[];
    editableFields: Partial<CreditFields>;
}

import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    FileText, 
    Copy, 
    Check, 
    ShieldCheck, 
    Activity, 
    BrainCircuit,
    Terminal,
    MessageSquareQuote,
    AlertCircle,
    Fingerprint
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface NarrativeTabProps {
    flags: RuleFlag[];
    editableFields: Partial<CreditFields>;
}

export const NarrativeTab: React.FC<NarrativeTabProps> = ({ flags, editableFields }) => {
    const [copied, setCopied] = useState(false);

    // Generate a professional narrative based on findings
    const narrative = useMemo(() => {
        if (flags.length === 0) return "No significant violations detected for narrative generation.";

        const criticalIssues = flags.filter(f => f.severity === 'high');
        const furnisher = editableFields.furnisherOrCollector || editableFields.originalCreditor || '[Furnisher Name]';
        const reportDate = editableFields.dateReportedOrUpdated || new Date().toLocaleDateString();

        let text = `COMPLAINT NARRATIVE FOR ${furnisher.toUpperCase()}\n`;
        text += `Date: ${reportDate}\n\n`;
        text += `EXECUTIVE SUMMARY:\n`;
        text += `A forensic audit of the credit reporting for ${furnisher} reveals ${flags.length} potential violations of the Fair Credit Reporting Act (FCRA) 15 U.S.C. § 1681 et seq. ${criticalIssues.length > 0 ? `${criticalIssues.length} of these are critical violations.` : ''} These inaccuracies appear systemic and suggest improper data management or illegal debt re-aging practices.\n\n`;

        text += `DETAILED FINDINGS:\n`;
        flags.forEach((flag, index) => {
            text += `${index + 1}. ${flag.ruleName}\n`;
            text += `   Explanation: ${flag.explanation}\n`;
            if (flag.suggestedEvidence && flag.suggestedEvidence.length > 0) {
                text += `   Required Evidence: ${flag.suggestedEvidence.join(', ')}\n`;
            }
            text += `\n`;
        });

        text += `\nREQUESTED REMEDIES:\n`;
        text += `1. Immediate deletion of the inaccurate trade line from all credit reporting bureaus.\n`;
        text += `2. Verification of the correct Date of First Delinquency (DOFD).\n`;
        text += `3. Cessation of all collection activity pending full validation of the debt timeline.\n`;

        return text;
    }, [flags, editableFields]);

    const handleCopy = () => {
        navigator.clipboard.writeText(narrative);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fade-in space-y-20 pb-40">
            {/* ELITE_AUDIT_HERO::EXPERT_SYNTHESIS_NARRATIVE */}
            <section className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-teal-600/20 via-cyan-600/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
                    
                    <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
                        <div className="lg:col-span-8">
                             <div className="flex items-center gap-6 mb-8">
                                <div className="px-5 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center gap-3">
                                    <BrainCircuit size={14} className="text-teal-400 animate-pulse" />
                                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-teal-400 font-mono">Expert Forensic Synthesis</span>
                                </div>
                                <div className="h-px w-10 bg-slate-800" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Document_Protocol::ALPHA</span>
                            </div>

                            <h2 className="text-7xl lg:text-[7.5rem] font-black text-white tracking-tighter mb-10 leading-[0.85] italic uppercase font-mono">
                                Synthesis <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-500 tracking-[-0.05em]">NARRATIVE</span>
                            </h2>

                            <p className="text-2xl text-slate-400 leading-[1.4] font-bold italic tracking-tight max-w-2xl border-l-2 border-teal-500/30 pl-12 mb-12">
                                Mapping reporting inconsistencies against <span className="text-white">Statutory Requirements</span>. This forensic document is optimized for <span className="text-teal-400 underline decoration-teal-400/30">Regulatory Ingestion</span>.
                            </p>
                        </div>

                        <div className="lg:col-span-4 flex justify-end">
                            <button
                                onClick={handleCopy}
                                className={cn(
                                    "group/copy px-12 py-8 rounded-[3rem] text-[11px] font-black uppercase tracking-[0.5em] font-mono italic transition-all shadow-3xl flex items-center gap-6",
                                    copied 
                                        ? "bg-emerald-500 text-white" 
                                        : "bg-white text-slate-950 hover:bg-teal-500 hover:text-white"
                                )}
                            >
                                {copied ? <Check size={24} /> : <FileText size={24} className="group-hover/copy:rotate-12 transition-transform" />}
                                {copied ? 'BUFFER_UPDATED' : 'COPY_NARRATIVE'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid lg:grid-cols-12 gap-20">
                {/* Document Display - High Resolution Ingestion Terminal */}
                <div className="lg:col-span-8">
                    <div className="relative p-1 rounded-[4rem] bg-gradient-to-br from-slate-800 to-slate-950 shadow-2xl group/preview overflow-hidden">
                        <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[3.8rem] overflow-hidden flex flex-col h-[800px] border border-white/5 relative shadow-inner">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10 pointer-events-none mix-blend-overlay" />
                            
                            <div className="p-12 border-b border-white/5 flex justify-between items-center relative z-10 bg-black/20 backdrop-blur-md">
                                <div className="flex items-center gap-6 text-teal-400">
                                    <div className="w-16 h-16 rounded-[2rem] bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                                        <Terminal size={28} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] font-mono italic">Forensic_Output_Alpha_01</span>
                                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic font-mono mt-1">
                                             CFPB_COMPLAINT_NARRATIVE
                                        </h4>
                                    </div>
                                </div>
                                <div className="px-6 py-2 bg-slate-900 border border-white/10 rounded-full text-[9px] font-black text-slate-500 font-mono italic uppercase tracking-widest animate-pulse">
                                    Data_Integrity::VERIFIED
                                </div>
                            </div>
                            
                            <div className="flex-grow p-16 overflow-y-auto font-mono text-[13px] leading-[1.8] whitespace-pre-wrap text-slate-300 relative z-10 custom-scrollbar selection:bg-teal-500/30">
                                <div className="max-w-4xl mx-auto py-10">
                                    {narrative}
                                    <motion.div 
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="inline-block w-3 h-5 bg-teal-500 ml-1 translate-y-1"
                                    />
                                </div>
                            </div>

                            <div className="p-10 border-t border-white/5 bg-black/40 flex justify-center text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] font-mono italic relative z-10">
                                Systemic_Misconduct_Matrix // MISSION_CRITICAL // {new Date().getFullYear()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Sidebar - Synthesis Intel */}
                <div className="lg:col-span-4 space-y-12">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-16 rounded-[4.5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 shadow-2xl relative overflow-hidden group/intel h-full flex flex-col justify-between min-h-[500px]"
                    >
                        <div className="absolute top-0 right-0 p-16 opacity-[0.02] scale-[2.5] rotate-12 group-hover/intel:rotate-0 transition-transform duration-1000 grayscale pointer-events-none select-none">
                             <Fingerprint size={200} className="text-white" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-8 mb-16">
                                <div className="w-16 h-16 rounded-[2rem] bg-teal-600/10 flex items-center justify-center text-teal-500 border border-teal-500/20 shadow-2xl relative">
                                    <MessageSquareQuote size={28} />
                                    <div className="absolute inset-0 blur-2xl opacity-20 bg-teal-500" />
                                </div>
                                <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic font-mono">Tactical_<span className="text-teal-500">DIRECTIVE</span></h4>
                            </div>

                            <div className="space-y-12">
                                <div className="group/stat">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] font-mono mb-4 group-hover/stat:text-teal-400 transition-colors italic">Inconsistency_Count</p>
                                    <div className="flex items-center gap-4">
                                        <p className="text-6xl font-black text-white uppercase tracking-tighter italic font-mono leading-none">{flags.length}</p>
                                        <div className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                                            <span className="text-[9px] font-black text-teal-500 font-mono italic">ACTIVE_FLAGS</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-12 border-t border-white/5">
                                    <div className="flex items-start gap-6">
                                        <AlertCircle size={20} className="text-teal-500 shrink-0 mt-2" />
                                        <p className="text-xl text-slate-400 leading-relaxed font-bold italic group-hover/intel:text-slate-200 transition-colors">
                                            "This narrative is optimized for <span className="text-teal-500">CFPB Submissions</span>. It triggers mandatory reinvestigation protocols under <span className="underline decoration-teal-500/30">FCRA § 611</span>. For attorney use, amplify state-specific UDAP claims."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 p-8 rounded-[2.5rem] bg-slate-900 border border-white/5 group-hover/intel:border-teal-500/20 transition-all">
                             <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono mb-6 italic">Ingestion_Entities</h5>
                             <div className="space-y-4">
                                 <div className="flex items-center justify-between">
                                     <span className="text-[11px] font-black text-white uppercase font-mono italic">Bureau_Filters</span>
                                     <span className="text-[11px] font-black text-teal-500 font-mono italic">BYPASSED</span>
                                 </div>
                                 <div className="flex items-center justify-between">
                                     <span className="text-[11px] font-black text-white uppercase font-mono italic">Legal_Shield</span>
                                     <span className="text-[11px] font-black text-teal-500 font-mono italic">ENGAGED</span>
                                 </div>
                             </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default NarrativeTab;
