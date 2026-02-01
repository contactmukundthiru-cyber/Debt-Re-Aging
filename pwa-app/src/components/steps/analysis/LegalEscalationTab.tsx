'use client';

import React, { useState } from 'react';
import { RuleFlag, CreditFields, RiskProfile } from '../../../lib/rules';
import { generateForensicAffidavit } from '../../../lib/affidavit';
import { ConsumerInfo } from '../../../lib/generator';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, 
    ShieldAlert, 
    Briefcase, 
    Copy, 
    Terminal, 
    Scale, 
    Mail, 
    PenTool,
    Zap,
    Lock
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface LegalEscalationTabProps {
    flags: RuleFlag[];
    fields: Partial<CreditFields>;
    riskProfile: RiskProfile;
    consumerInfo?: ConsumerInfo;
}

const LegalEscalationTab: React.FC<LegalEscalationTabProps> = ({
    flags,
    fields,
    riskProfile,
    consumerInfo
}) => {
    const [activeDocument, setActiveDocument] = useState<'affidavit' | 'cfpb' | 'attorney'>('affidavit');

    const consumer: ConsumerInfo = consumerInfo || {
        name: '[FULL NAME]',
        address: '[ADDRESS]',
        city: '[CITY]',
        state: '[STATE]',
        zip: '[ZIP]',
        dob: '[DOB]',
        ssn: '[SSN]',
        email: '[EMAIL]',
        phone: '[PHONE]'
    };

    const affidavitText = generateForensicAffidavit(fields, flags, riskProfile, consumer);

    const generateCFPBText = () => {
        return `Identify Yourself: I am a consumer reporting security concerns regarding the integrity of my credit file data.

Issue Description:
The reporting entity has failed to maintain reasonable procedures to ensure maximum possible accuracy of the information concerning the individual about whom the report relates (FCRA Section 607(b)).

Specific Violations:
${flags.map(f => `- ${f.ruleName}: ${f.explanation}`).join('\n')}

Forensic Evidence:
A forensic audit of the Metro 2® compliance structures indicates that the data supplied by the furnisher does not comport with the standard data reporting format required for accuracy. Specifically, the "Compliance Condition Code" and "Date of First Delinquency" fields show irregularities that prevent accurate calculation of the Obsolescence Date.

Attempted Resolution:
I have previously disputed this information, but the bureau responded with a generic 'verification' without providing the Method of Verification (MOV) as requested under FCRA 611(a)(7).`;
    };

    const generateAttorneyText = () => {
        return `ATTORNEY CASE REFERRAL SUMMARY
[PRIVILEGED AND CONFIDENTIAL - ATTORNEY WORK PRODUCT]

CLIENT: ${consumer.name}
DATE: ${new Date().toLocaleDateString()}
CASE ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}

1. EXECUTIVE CASE SUMMARY
Potential FCRA/FDCPA litigation matter involving ${flags.filter(f => f.severity === 'high').length} high-severity violations.
Primary Defendant(s): ${fields.furnisherOrCollector || 'Unknown Furnisher'}
Forensic Impact Assessment: HIGH SEVERITY (Statutory Accountability Eligible)

2. VIOLATION MATRIX
${flags.map((f, i) => `[${i + 1}] ${f.ruleName}
   - Severity: ${f.severity}
   - Statute: ${f.legalCitations.join(', ')}
   - Evidence: ${f.fieldValues ? Object.entries(f.fieldValues).map(([k, v]) => `${k}=${v}`).join(', ') : 'N/A'}`).join('\n\n')}

3. PROCEDURAL HISTORY
- Initial Dispute Sent: [DATE]
- Bureau Response: [DATE] - Failed to correct
- Method of Verification Request: [DATE] - Ignored/Insufficient

4. WILLFUL NON-COMPLIANCE MARKERS
The volume and nature of these errors (${flags.length} total) suggests a systemic failure to maintain reasonable procedures (FCRA § 607(b)), rather than isolated clerical error.

5. ATTACHED EXHIBITS
- Exhibit A: Original Credit Report (Redacted)
- Exhibit B: Metro 2® Forensic Audit
- Exhibit C: Certified Mail Receipts`;
    };

    const getDocumentText = () => {
        if (activeDocument === 'affidavit') return affidavitText;
        if (activeDocument === 'cfpb') return generateCFPBText();
        return generateAttorneyText();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="fade-in space-y-20 pb-40">
            {/* ELITE_AUDIT_HERO::KINETIC_ESCALATION_LAB */}
            <section className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-slate-600/20 via-slate-500/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
                    
                    <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
                        <div className="lg:col-span-12 mb-12 border-b border-white/5 pb-12">
                             <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                                <div className="text-center md:text-left">
                                    <div className="flex items-center gap-6 mb-8 justify-center md:justify-start">
                                        <div className="px-5 py-2 bg-slate-500/10 border border-slate-500/20 rounded-full flex items-center gap-3">
                                            <Zap size={14} className="text-slate-400 animate-pulse" />
                                            <span className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-400 font-mono">Escalation Matrix v5.0</span>
                                        </div>
                                        <div className="h-px w-10 bg-slate-800" />
                                        <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Node_Selection::ACTIVE</span>
                                    </div>
                                    <h2 className="text-7xl lg:text-[7.5rem] font-black text-white tracking-tighter mb-6 leading-[0.85] italic uppercase font-mono">
                                        Kinetic <br/>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-white to-slate-400 tracking-[-0.05em]">ESCALATION</span>
                                    </h2>
                                </div>

                                <div className="flex bg-slate-900/30 p-3 rounded-[3rem] border border-white/10 backdrop-blur-3xl shadow-inner relative group/nav">
                                    {[
                                        { id: 'affidavit', label: 'Forensic_Affidavit', icon: <PenTool size={18} /> },
                                        { id: 'cfpb', label: 'CFPB_Narrative', icon: <Mail size={18} /> },
                                        { id: 'attorney', label: 'Legal_Dossier', icon: <Briefcase size={18} /> }
                                    ].map(btn => (
                                        <button
                                            key={btn.id}
                                            onClick={() => setActiveDocument(btn.id as any)}
                                            className={cn(
                                                "px-10 py-5 rounded-[2.2rem] flex items-center gap-4 transition-all relative overflow-hidden group/btn min-w-[180px]",
                                                activeDocument === btn.id ? "text-slate-950" : "text-slate-500 hover:text-white"
                                            )}
                                        >
                                            {activeDocument === btn.id && (
                                                <motion.div 
                                                    layoutId="activeEscalationTab" 
                                                    className="absolute inset-0 bg-white shadow-2xl"
                                                    transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
                                                />
                                            )}
                                            <span className="relative z-10 transition-transform group-hover/btn:scale-110">{btn.icon}</span>
                                            <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] font-mono italic">{btn.label}</span>
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </div>

                        <div className="lg:col-span-8">
                            <p className="text-2xl text-slate-400 leading-[1.4] font-bold italic tracking-tight max-w-4xl border-l-2 border-slate-500/30 pl-12 mb-16">
                                Converting forensic audit streams into <span className="text-white">Valid Statutory Instruments</span>. These documents are calibrated to bypass institutional clerical filters and engage <span className="text-slate-300">Tier-1 Legal Response Protocols</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid lg:grid-cols-12 gap-20">
                {/* Document Preview - High Density Forensic Terminal */}
                <div className="lg:col-span-8">
                    <div className="relative p-1 rounded-[4rem] bg-gradient-to-br from-slate-800 to-slate-950 shadow-2xl group/preview overflow-hidden">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-500/5 rounded-full blur-[100px] -mr-40 -mt-40 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-1000" />
                        <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[3.8rem] overflow-hidden flex flex-col h-[850px] border border-white/5 relative shadow-inner">
                            {/* Paper Texture Overlay */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10 pointer-events-none mix-blend-overlay" />
                            
                            <div className="p-12 border-b border-white/5 flex justify-between items-center relative z-10 bg-black/20 backdrop-blur-md">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[2rem] bg-slate-900 flex items-center justify-center border border-white/10 group-hover/preview:border-slate-500/30 transition-colors">
                                        <FileText size={28} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] font-mono italic">
                                            {activeDocument === 'affidavit' ? 'COMMAND_PACK::SWORN_STATEMENT' :
                                                activeDocument === 'cfpb' ? 'COMMAND_PACK::REGULATORY_DRIVE' : 'COMMAND_PACK::ATTORNEY_DOSSIER'}
                                        </span>
                                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic font-mono mt-1">
                                             Instrument_Alpha_01
                                        </h4>
                                    </div>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(getDocumentText())}
                                    className="px-10 py-5 bg-white text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono italic hover:bg-slate-600 hover:text-white transition-all flex items-center gap-4 shadow-3xl group/copy"
                                >
                                    <Copy size={16} className="group-hover/copy:rotate-12 transition-transform" />
                                    Copy_To_Buffer
                                </button>
                            </div>
                            
                            <div className="flex-grow p-16 overflow-y-auto font-mono text-[13px] leading-[1.8] whitespace-pre-wrap text-slate-300 relative z-10 custom-scrollbar selection:bg-slate-500/30">
                                <div className="max-w-4xl mx-auto py-10">
                                    {getDocumentText()}
                                    <motion.div 
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="inline-block w-3 h-5 bg-slate-500 ml-1 translate-y-1"
                                    />
                                </div>
                            </div>

                            <div className="p-10 border-t border-white/5 bg-black/40 flex justify-center text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] font-mono italic relative z-10">
                                Institutional_Grade_Output // MISSION_CRITICAL // {new Date().getFullYear()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Sidebar - Deployment Metrics */}
                <div className="lg:col-span-4 space-y-12">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-16 rounded-[4.5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 shadow-2xl relative overflow-hidden group/intel min-h-[500px] flex flex-col justify-between"
                    >
                        <div className="absolute top-0 right-0 p-16 opacity-[0.02] scale-[2.5] rotate-12 group-hover/intel:rotate-0 transition-transform duration-1000 grayscale pointer-events-none select-none">
                             <ShieldAlert size={200} className="text-white" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-8 mb-16">
                                <div className="w-16 h-16 rounded-[2rem] bg-slate-600/10 flex items-center justify-center text-slate-400 border border-slate-500/20 shadow-2xl relative">
                                    <Zap size={28} className="animate-pulse" />
                                    <div className="absolute inset-0 blur-2xl opacity-20 bg-slate-500" />
                                </div>
                                <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic font-mono">Deployment_<span className="text-slate-300">STRATEGY</span></h4>
                            </div>

                            <div className="space-y-12">
                                <div className="group/stat">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] font-mono mb-4 group-hover/stat:text-slate-400 transition-colors italic">Primary_Target</p>
                                    <p className="text-2xl font-black text-white uppercase tracking-tighter italic font-mono">{fields.furnisherOrCollector || 'INSTITUTION_UNKNOWN'}</p>
                                </div>
                                <div className="group/stat">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] font-mono mb-4 group-hover/stat:text-slate-400 transition-colors italic">Liability_Magnitude</p>
                                    <div className="flex items-center gap-4">
                                        <p className="text-4xl font-black text-white uppercase tracking-tighter italic font-mono leading-none">{flags.length}</p>
                                        <div className="px-3 py-1 bg-slate-500/10 border border-slate-500/20 rounded-lg">
                                            <span className="text-[9px] font-black text-slate-400 font-mono italic">FAILURES</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-12 border-t border-white/5">
                                    <p className="text-xl text-slate-400 leading-relaxed font-bold italic border-l-2 border-slate-500/30 pl-10 relative group-hover/intel:text-slate-200 transition-colors">
                                        "Affidavits create a <span className="text-slate-300 italic">Static Legal Reality</span>. By converting audit streams into sworn statements, you bypass the friction of automated bureau processing."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="p-16 rounded-[4.5rem] bg-slate-700 border border-slate-500 relative overflow-hidden group/command shadow-2xl shadow-slate-900/30 flex flex-col justify-between min-h-[350px]">
                        <div className="absolute top-0 right-0 p-16 opacity-20 scale-[2.5] -rotate-12 group-hover/command:rotate-0 transition-transform duration-1000 grayscale select-none pointer-events-none">
                            <Terminal size={100} className="text-white" />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.5em] font-mono mb-8 italic">Next_Command_Cycle</h4>
                            <p className="text-2xl text-white font-black leading-tight italic tracking-tighter mb-10 group-hover/command:translate-x-2 transition-transform">
                                Execute certified mail protocols with <span className="underline decoration-white/30 decoration-4 underline-offset-8">Return Receipt Received</span>.
                            </p>
                        </div>
                        <button className="w-full py-6 bg-slate-950 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] font-mono italic hover:scale-[1.02] active:scale-[0.98] transition-all shadow-3xl flex items-center justify-center gap-6 relative overflow-hidden group/btn">
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            <span className="relative z-10 flex items-center gap-6">
                               Assemble_Dossier_Pack
                               <Briefcase size={20} className="group-hover/btn:translate-x-2 transition-transform duration-500" />
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default LegalEscalationTab;
