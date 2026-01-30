'use client';

import React, { useState } from 'react';
import { RuleFlag, CreditFields, RiskProfile } from '../../../lib/rules';
import { generateForensicAffidavit } from '../../../lib/affidavit';
import { ConsumerInfo } from '../../../lib/generator';

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
        <div className="fade-in space-y-8 pb-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold dark:text-white mb-2">Legal Escalation Engine</h2>
                    <p className="text-slate-500">Generate high-impact legal instruments for advanced dispute escalation.</p>
                </div>
                <div className="flex gap-2">
                    {[
                        { id: 'affidavit', label: 'Sworn Affidavit', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                        { id: 'cfpb', label: 'CFPB Narrative', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                        { id: 'attorney', label: 'Case File', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
                    ].map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setActiveDocument(btn.id as 'affidavit' | 'cfpb' | 'attorney')}
                            className={`px-4 py-3 rounded-xl border flex items-center gap-2 transition-all ${activeDocument === btn.id
                                ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-lg'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={btn.icon} />
                            </svg>
                            <span className="text-xs font-bold uppercase tracking-wider hidden md:block">{btn.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Document Preview */}
                <div className="lg:col-span-2">
                    <div className="premium-card bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
                                {activeDocument === 'affidavit' ? 'Forensic Affidavit (Notarize Required)' :
                                    activeDocument === 'cfpb' ? 'Official Complaint Narrative' : 'Attorney Referral Summary'}
                            </span>
                            <button
                                onClick={() => copyToClipboard(getDocumentText())}
                                className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                Copy Text
                            </button>
                        </div>
                        <div className="flex-grow p-8 overflow-y-auto bg-white dark:bg-slate-950 font-mono text-sm leading-relaxed whitespace-pre-wrap dark:text-slate-300">
                            {getDocumentText()}
                        </div>
                    </div>
                </div>

                {/* Sidebar Context */}
                <div className="space-y-6">
                    <div className="premium-card p-6 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold dark:text-white mb-4">Why This Works</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                            {activeDocument === 'affidavit'
                                ? "A sworn affidavit converts your dispute from a 'letter' to 'evidence'. Under federal rules of civil procedure, an unrebutted affidavit can sometimes stand as truth. Bureaus hate dealing with these because they cannot be processed by OCR automation."
                                : activeDocument === 'cfpb'
                                    ? "The Consumer Financial Protection Bureau (CFPB) complaint portal is a direct regulatory channel. Bureaus must respond within 15 days. Using specific Metro 2® terminology in your complaint forces a higher-tier response."
                                    : "An Attorney Referral Packet summarizes the forensic impact, willful non-compliance evidence, and procedural violations in a format that makes it easy for a consumer protection lawyer to accept your case on contingency."
                            }
                        </p>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Pro Tip</p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                {activeDocument === 'affidavit'
                                    ? "Get this document notarized at your local bank or UPS store. The notary seal adds significant psychological weight to your dispute."
                                    : activeDocument === 'cfpb'
                                        ? "Attach the 'Metro 2 Audit' screenshot to your CFPB complaint as proof of the structural data errors."
                                        : "Save all certified mail receipts. They are the 'chain of custody' evidence a lawyer needs first."
                                }
                            </p>
                        </div>
                    </div>

                    <div className="premium-card p-6 border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-bold dark:text-white mb-4">Escalation Checklist</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-xs text-slate-500">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activeDocument === 'affidavit' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                                    {activeDocument === 'affidavit' && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span>Generate & Notarize Affidavit</span>
                            </li>
                            <li className="flex items-center gap-3 text-xs text-slate-500">
                                <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center"></div>
                                <span>Attach to 'Method of Verification' Demand</span>
                            </li>
                            <li className="flex items-center gap-3 text-xs text-slate-500">
                                <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center"></div>
                                <span>Upload to CFPB Portal (if stalled)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalEscalationTab;
