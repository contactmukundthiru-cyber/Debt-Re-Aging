'use client';

import React, { useState, useMemo } from 'react';
import { RuleFlag, CreditFields } from '../../../lib/rules';

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
        <div className="fade-in space-y-10">
            {/* Hero Header */}
            <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-teal-400 font-mono">AI-Assisted Drafting</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">
                            Forensic <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Narrative</span>
                        </h2>
                        <p className="text-slate-400 text-sm max-w-lg">Professional legal narrative optimized for CFPB submissions and attorney briefs. Uses specific citations to trigger reinvestigation protocols.</p>
                    </div>

                    <button
                        onClick={handleCopy}
                        className={`px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${copied
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                            }`}
                    >
                        {copied ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                        )}
                        {copied ? 'Copied to Clipboard' : 'Copy Full Narrative'}
                    </button>
                </div>
            </div>

            {/* Narrative Display */}
            <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated Document</p>
                        <p className="text-sm font-medium dark:text-white">CFPB Complaint Narrative</p>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-800">
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                        {narrative}
                    </pre>
                </div>

                <div className="mt-8 flex items-start gap-4 p-6 bg-teal-50/50 dark:bg-teal-500/5 rounded-2xl border border-teal-100 dark:border-teal-500/20">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-teal-800 dark:text-teal-400 mb-1">Professional Tip</p>
                        <p className="text-xs text-teal-700 dark:text-teal-500 leading-relaxed">
                            This narrative is optimized for CFPB submissions. It uses specific legal citations to trigger mandatory reinvestigation protocols under FCRA § 611. For attorney use, consider adding state-specific UDAP claims.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NarrativeTab;
