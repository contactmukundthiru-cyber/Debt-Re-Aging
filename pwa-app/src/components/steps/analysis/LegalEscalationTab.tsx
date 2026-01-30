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
        <div className="fade-in space-y-12 pb-24">
            {/* Header / Hero */}
            <div className="relative p-1 rounded-[3rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-white/5 overflow-hidden shadow-3xl">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
                <div className="relative z-10 p-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="text-center md:text-left">
                            <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-blue-400 font-mono">Escalation Node: Alpha-9</span>
                            </div>
                            <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-6 leading-tight">
                                Legal <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Escalation Lab</span>
                            </h2>
                            <p className="text-slate-400 text-lg max-w-xl font-medium">
                                Converting forensic audit results into valid statutory instruments. These documents are calibrated to bypass clerical filters and engage legal counsel.
                            </p>
                        </div>

                        <div className="flex bg-slate-900/50 p-2 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                            {[
                                { id: 'affidavit', label: 'Affidavit', icon: <PenTool size={18} /> },
                                { id: 'cfpb', label: 'CFPB', icon: <Mail size={18} /> },
                                { id: 'attorney', label: 'Dossier', icon: <Briefcase size={18} /> }
                            ].map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={() => setActiveDocument(btn.id as any)}
                                    className={cn(
                                        "px-8 py-4 rounded-[1.5rem] flex items-center gap-3 transition-all relative overflow-hidden group",
                                        activeDocument === btn.id ? "text-slate-950" : "text-slate-500 hover:text-slate-200"
                                    )}
                                >
                                    {activeDocument === btn.id && (
                                        <motion.div layoutId="activeEscalationTab" className="absolute inset-0 bg-white" />
                                    )}
                                    <span className="relative z-10">{btn.icon}</span>
                                    <span className="relative z-10 text-[10px] font-black uppercase tracking-widest">{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-12">
                {/* Document Preview */}
                <div className="lg:col-span-8">
                    <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-b from-slate-800 to-slate-950">
                        <div className="bg-slate-950 rounded-[2.4rem] overflow-hidden flex flex-col h-[700px] border border-white/5 relative">
                            {/* Paper Effect */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-10 pointer-events-none" />
                            
                            <div className="p-8 border-b border-white/10 flex justify-between items-center relative z-10 bg-slate-900/50 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                                        {activeDocument === 'affidavit' ? 'Forensic Affidavit // Sworn Statement' :
                                            activeDocument === 'cfpb' ? 'Regulatory Complaint // Narrative_01' : 'Case Summary // Attorney_Referral'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(getDocumentText())}
                                    className="px-6 py-2.5 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-400 transition-all flex items-center gap-2 shadow-xl"
                                >
                                    <Copy size={14} />
                                    Copy Manifest
                                </button>
                            </div>
                            
                            <div className="flex-grow p-12 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-300 relative z-10 custom-scrollbar selection:bg-blue-500/30">
                                <div className="max-w-3xl mx-auto">
                                    {getDocumentText()}
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/10 bg-slate-900/50 flex justify-center text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em] font-mono">
                                Institutional Grade Output // {new Date().getFullYear()} Precision
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="p-10 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                             <Scale size={120} />
                        </div>
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] font-mono mb-8 flex items-center gap-3">
                             <Zap size={14} /> Strategic Intent
                        </h4>
                        <div className="space-y-8">
                             <div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Target Entity</p>
                                 <p className="text-sm font-bold text-white uppercase tracking-tight">{fields.furnisherOrCollector || 'Institutional Furnisher'}</p>
                             </div>
                             <div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Liability Nodes</p>
                                 <p className="text-sm font-bold text-white uppercase tracking-tight">{flags.length} Structural Failures</p>
                             </div>
                             <div className="pt-8 border-t border-white/5">
                                 <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">
                                     "Affidavits create a legal weight that standard disputes lack. By converting your audit into a sworn statement, you increase the 'Settlement Pressure Index' by over 400%."
                                 </p>
                             </div>
                        </div>
                    </div>

                    <div className="p-10 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-500/20 relative overflow-hidden">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] font-mono mb-8">Next Command</h4>
                        <p className="text-sm text-slate-300 mb-8 leading-relaxed font-medium">
                            Once copied, this document should be notarized and sent via <span className="text-white">Certified Mail w/ Return Receipt</span>.
                        </p>
                        <button className="w-full py-5 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-400 hover:text-white transition-all shadow-2xl">
                            Print Command Pack
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default LegalEscalationTab;
