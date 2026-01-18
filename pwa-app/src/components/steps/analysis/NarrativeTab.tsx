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
        text += `A forensic audit of the credit reporting for ${furnisher} reveals multiple potential violations of the Fair Credit Reporting Act (FCRA) 15 U.S.C. § 1681 et seq. These inaccuracies appear systemic and suggest improper data management or illegal debt re-aging practices.\n\n`;

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
        <div className="fade-in">
            <div className="premium-card p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="heading-md dark:text-white">Forensic Narrative Engine</h3>
                        <p className="text-sm text-slate-500 mt-1">AI-assisted legal narrative generation for CFPB complaints and attorney briefs.</p>
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`btn ${copied ? 'bg-emerald-500 text-white' : 'btn-secondary'} !py-2 !px-4 !text-xs !rounded-lg flex items-center gap-2 transition-all`}
                    >
                        {copied ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                        )}
                        {copied ? 'Copied' : 'Copy Narrative'}
                    </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-inner">
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed dark:text-slate-300 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin">
                        {narrative}
                    </pre>
                </div>

                <div className="mt-8 flex items-start gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                    <svg className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-emerald-800 dark:text-emerald-400 leading-normal">
                        <strong>Pro Tip:</strong> This narrative is optimized for CFPB submissions. It uses specific legal citations to trigger mandatory reinvestigation protocols under FCRA § 611.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NarrativeTab;
