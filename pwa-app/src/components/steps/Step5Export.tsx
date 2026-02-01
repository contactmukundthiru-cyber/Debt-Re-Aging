'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RuleFlag, RiskProfile, CreditFields } from '../../lib/types';
import { Step } from '../../lib/constants';
import { ImpactAssessment } from '../../lib/evidence-builder';
import { ConsumerInfo } from '../../lib/generator';
import { CaseLaw } from '../../lib/caselaw';
import { computeCaseHealth, formatExecutiveBrief } from '../../lib/case-health';
import { AttorneyPackage } from '../../lib/attorney-export';

type ExportTab = 'letters' | 'attorney' | 'evidence' | 'cfpb';

interface ComplaintStrength {
  score: number;
  strength: 'weak' | 'moderate' | 'strong';
  factors: string[];
}

interface Step5ExportProps {
  step: Step;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  exportTab: ExportTab;
  setExportTab: (tab: ExportTab) => void;
  consumer: ConsumerInfo;
  editableFields: CreditFields;
  flags: RuleFlag[];
  riskProfile: RiskProfile;
  relevantCaseLaw: CaseLaw[];
  discoveryAnswers: Record<string, string>;
  impactAssessment: ImpactAssessment | null;
  translate: (key: string) => string;
  downloadDocument: (type: 'bureau' | 'validation' | 'cfpb' | 'summary', format?: 'pdf' | 'txt') => void;
  generateCeaseDesistLetter: Function;
  generateIntentToSueLetter: Function;
  estimateComplaintStrength: (flags: RuleFlag[]) => ComplaintStrength;
  buildEvidencePackage: Function;
  formatEvidencePackage: Function;
  buildAttorneyPackage: Function;
  formatAttorneyPackage: Function;
  formatRedactedAttorneyPackage: Function;
  buildOutcomeNarrative: (pkg: AttorneyPackage) => string;
  formatCurrency: (amount: number) => string;
  downloadAnalysisJson: () => void;
  downloadCaseBundle: () => void;
  downloadCaseBundleZip: () => void;
  downloadForensicReport: () => void;
  isBundling: boolean;
  downloadTextFile: (content: string, filename: string) => void;
  downloadPdfFile: (content: string, filename: string) => void;
}

const TAB_CONFIG = [
  { id: 'letters' as const, label: 'Dispute Letters', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />, color: 'emerald' },
  { id: 'cfpb' as const, label: 'CFPB Complaint', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />, color: 'blue' },
  { id: 'evidence' as const, label: 'Evidence Package', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />, color: 'amber' },
  { id: 'attorney' as const, label: 'Attorney Export', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />, color: 'purple' },
];

const Step5Export: React.FC<Step5ExportProps> = ({
  setStep,
  exportTab,
  setExportTab,
  consumer,
  editableFields,
  flags,
  riskProfile,
  relevantCaseLaw,
  discoveryAnswers,
  impactAssessment,
  translate,
  downloadDocument,
  generateCeaseDesistLetter,
  generateIntentToSueLetter,
  estimateComplaintStrength,
  buildEvidencePackage,
  formatEvidencePackage,
  buildAttorneyPackage,
  formatAttorneyPackage,
  formatRedactedAttorneyPackage,
  buildOutcomeNarrative,
  formatCurrency,
  downloadAnalysisJson,
  downloadCaseBundle,
  downloadCaseBundleZip,
  downloadForensicReport,
  isBundling,
  downloadTextFile,
  downloadPdfFile
}) => {
  const caseHealth = computeCaseHealth(editableFields, flags, discoveryAnswers, riskProfile);
  const executiveBrief = formatExecutiveBrief(caseHealth, editableFields, flags);
  const attorneyPackage = React.useMemo(() => buildAttorneyPackage(editableFields, flags, riskProfile, {
    name: consumer.name || '',
    address: consumer.address || '',
    city: consumer.city || '',
    state: consumer.state || '',
    zip: consumer.zip || '',
    phone: consumer.phone,
    email: consumer.email
  }), [buildAttorneyPackage, consumer, editableFields, flags, riskProfile]);
  const evidencePreview = React.useMemo(() => {
    const pkg = buildEvidencePackage(editableFields, flags, riskProfile, consumer.name || 'Client', consumer.state || '');
    return formatEvidencePackage(pkg).split('\n').slice(0, 10).join('\n');
  }, [buildEvidencePackage, consumer.name, consumer.state, editableFields, flags, formatEvidencePackage, riskProfile]);
  const outcomeNarrative = React.useMemo(() => buildOutcomeNarrative(attorneyPackage), [attorneyPackage, buildOutcomeNarrative]);

  return (
    <div className="fade-in max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="premium-card p-12 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl mb-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-purple-400 font-mono">Document Generation Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Export <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Legal Documents</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Generate dispute letters, CFPB complaints, evidence packages, and attorney referral bundles with proper legal citations.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mb-10">
        <div className="premium-card p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Executive Readiness</p>
              <h3 className="text-lg font-bold dark:text-white">Case health snapshot</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Grade {caseHealth.grade}</span>
          </div>
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center">
              <span className="text-xs uppercase tracking-widest">Score</span>
              <strong className="text-xl">{caseHealth.score}</strong>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{caseHealth.summary}</p>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${caseHealth.readiness}%` }}
                  transition={{ duration: 1, ease: "circOut" }}
                  className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-2">Evidence readiness {caseHealth.readiness}%</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Key Risks</p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                {caseHealth.keyRisks.length > 0 ? caseHealth.keyRisks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                )) : <li>No major risk flags detected.</li>}
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 p-4 bg-emerald-500/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Recommendations</p>
              <ul className="text-xs text-emerald-900/70 space-y-1">
                {caseHealth.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="premium-card p-6 border-indigo-500/20 bg-indigo-500/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Briefing Pack</p>
          <h3 className="text-lg font-bold text-indigo-900 mb-4">Export the executive brief</h3>
          <p className="text-sm text-indigo-900/70 mb-6">Generate a concise, shareable summary before sending legal packets.</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="btn bg-indigo-600 text-white hover:bg-indigo-700 !rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              onClick={() => downloadForensicReport()}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Institutional Forensic Audit (PDF)
            </button>
            <button
              type="button"
              className="btn btn-primary !rounded-xl"
              onClick={() => downloadTextFile(executiveBrief, 'executive_case_brief.txt')}
            >
              Download Brief (TXT)
            </button>
            <button
              type="button"
              className="btn btn-secondary !rounded-xl"
              onClick={() => downloadAnalysisJson()}
            >
              Export Case Data (JSON)
            </button>
          </div>
        </div>
      </div>

      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Export Preview</p>
            <h3 className="text-lg font-bold dark:text-white">Live dossier snapshots</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Auto-refresh</span>
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Executive Brief</p>
            <pre className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap line-clamp-6">{executiveBrief}</pre>
            <button
              type="button"
              className="mt-3 btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
              onClick={() => downloadTextFile(executiveBrief, 'executive_case_brief.txt')}
            >
              Download Brief
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Evidence Package</p>
            <pre className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap line-clamp-6">{evidencePreview}</pre>
            <button
              type="button"
              className="mt-3 btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
              onClick={() => downloadPdfFile(formatEvidencePackage(buildEvidencePackage(editableFields, flags, riskProfile, consumer.name || 'Client', consumer.state || '')), 'evidence_package.pdf')}
            >
              Export Evidence PDF
            </button>
          </div>
          <div className="rounded-2xl border border-indigo-500/20 p-4 bg-indigo-500/5">
            <p className="text-[10px] uppercase tracking-widest text-indigo-500 mb-2">Outcome Narrative</p>
            <pre className="text-[11px] text-indigo-900/70 whitespace-pre-wrap line-clamp-6">{outcomeNarrative}</pre>
            <button
              type="button"
              className="mt-3 btn btn-primary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
              onClick={() => downloadPdfFile(outcomeNarrative, 'outcome_narrative.pdf')}
            >
              Export Narrative PDF
            </button>
          </div>
        </div>
      </div>

      <div className="premium-card p-6 mb-10 bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Export Gallery</p>
            <h3 className="text-lg font-bold dark:text-white">One-click deliverables</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">PDF + ZIP + TXT</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/80 dark:bg-slate-900/50">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Bureau Dispute</p>
            <h4 className="text-sm font-semibold dark:text-white mb-2">Bureau Letter Pack</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Print-ready PDF letters with violations and evidence list.</p>
            <button
              type="button"
              className="mt-3 btn btn-primary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
              onClick={() => downloadDocument('bureau', 'pdf')}
            >
              Download PDF
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/80 dark:bg-slate-900/50">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Debt Validation</p>
            <h4 className="text-sm font-semibold dark:text-white mb-2">Collector Validation</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">FDCPA-compliant validation letter and evidence checklist.</p>
            <button
              type="button"
              className="mt-3 btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
              onClick={() => downloadDocument('validation', 'pdf')}
            >
              Download PDF
            </button>
          </div>
          <div className="rounded-2xl border border-indigo-500/20 p-4 bg-indigo-500/5">
            <p className="text-[10px] uppercase tracking-widest text-indigo-500 mb-2">Regulatory</p>
            <h4 className="text-sm font-semibold text-indigo-900 mb-2">CFPB Narrative</h4>
            <p className="text-xs text-indigo-900/70">Generate the structured complaint narrative for submission.</p>
            <button
              type="button"
              className="mt-3 btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
              onClick={() => downloadDocument('cfpb', 'txt')}
            >
              Download TXT
            </button>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 p-4 bg-emerald-500/5">
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 mb-2">Full Bundle</p>
            <h4 className="text-sm font-semibold text-emerald-900 mb-2">Case ZIP Bundle</h4>
            <p className="text-xs text-emerald-900/70">Package all exports into a single ZIP for attorney handoff.</p>
            <button
              type="button"
              className="mt-3 btn btn-primary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
              onClick={downloadCaseBundleZip}
              disabled={isBundling}
            >
              {isBundling ? 'Bundling...' : 'Download ZIP'}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="flex flex-wrap gap-3 mb-8">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setExportTab(tab.id)}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${exportTab === tab.id
              ? `bg-${tab.color}-500/10 text-${tab.color}-500 border-${tab.color}-500/20 shadow-lg scale-105`
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{tab.icon}</svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Letters Tab */}
        {exportTab === 'letters' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                type="button"
                className="doc-card group dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow"
                onClick={() => downloadDocument('bureau', 'pdf')}
              >
                <div className="doc-icon group-hover:bg-gray-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-gray-900 transition-colors">B</div>
                <div className="flex-1 text-left">
                  <h3 className="heading-md mb-0.5 dark:text-white">Bureau Dispute Letter</h3>
                  <p className="body-sm text-gray-500 dark:text-gray-400">For Experian, Equifax, TransUnion</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400 border border-gray-200 dark:border-gray-600 px-1 rounded">PDF</span>
              </button>

              <button
                type="button"
                className="doc-card group dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow"
                onClick={() => downloadDocument('validation', 'pdf')}
              >
                <div className="doc-icon group-hover:bg-gray-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-gray-900 transition-colors">V</div>
                <div className="flex-1 text-left">
                  <h3 className="heading-md mb-0.5 dark:text-white">Debt Validation Request</h3>
                  <p className="body-sm text-gray-500 dark:text-gray-400">FDCPA §809(b) compliant</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400 border border-gray-200 dark:border-gray-600 px-1 rounded">PDF</span>
              </button>

              <button
                type="button"
                className="doc-card group dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow"
                onClick={() => {
                  const consumerDetails = {
                    name: consumer.name || '',
                    address: consumer.address || '',
                    city: '',
                    state: consumer.state || '',
                    zip: ''
                  };
                  const letter = generateCeaseDesistLetter(editableFields, consumerDetails, flags.map(f => f.explanation));
                  const blob = new Blob([letter], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'cease_desist_letter.txt';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <div className="doc-icon group-hover:bg-red-600 group-hover:text-white transition-colors">CD</div>
                <div className="flex-1 text-left">
                  <h3 className="heading-md mb-0.5 dark:text-white">Cease & Desist Letter</h3>
                  <p className="body-sm text-gray-500 dark:text-gray-400">Stop collection contact</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400 border border-gray-200 dark:border-gray-600 px-1 rounded">TXT</span>
              </button>

              <button
                type="button"
                className="doc-card group dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow"
                onClick={() => {
                  const consumerDetails = {
                    name: consumer.name || '',
                    address: consumer.address || '',
                    city: '',
                    state: consumer.state || '',
                    zip: ''
                  };
                  const letter = generateIntentToSueLetter(editableFields, flags, consumerDetails);
                  const blob = new Blob([letter], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'intent_to_sue_letter.txt';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <div className="doc-icon group-hover:bg-red-800 group-hover:text-white transition-colors">ITS</div>
                <div className="flex-1 text-left">
                  <h3 className="heading-md mb-0.5 dark:text-white">Intent to Sue Letter</h3>
                  <p className="body-sm text-gray-500 dark:text-gray-400">Final demand before litigation</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400 border border-gray-200 dark:border-gray-600 px-1 rounded">TXT</span>
              </button>
            </div>
            <div className="premium-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-white">Analysis Snapshot</h3>
                  <p className="text-sm text-slate-500">Download the full raw audit data in JSON format.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary !rounded-xl !py-3 !px-6 dark:border-slate-700 dark:text-white"
                onClick={downloadAnalysisJson}
              >
                Download Snapshot
              </button>
            </div>

            <div className="premium-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-indigo-500/5 border-indigo-500/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-500">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-5a2 2 0 012-2h2a2 2 0 012 2v5m-8 0h8m4 0h2M3 17h2m4-10h6m-6 4h6" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-white">Executive Case Brief</h3>
                  <p className="text-sm text-slate-500">One-page health score for partners, leadership, or attorney intake.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn btn-primary !rounded-xl !py-3 !px-6 shadow-xl shadow-indigo-900/10"
                  onClick={() => downloadPdfFile(executiveBrief, 'executive_case_brief.pdf')}
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  className="btn btn-secondary !rounded-xl !py-3 !px-6 dark:border-slate-700 dark:text-white"
                  onClick={() => downloadTextFile(executiveBrief, 'executive_case_brief.txt')}
                >
                  Export TXT
                </button>
              </div>
            </div>

            <div className="premium-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-emerald-500/5 border-emerald-500/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-500">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-white">Institutional Handoff Bundle</h3>
                  <p className="text-sm text-slate-500">Compressed archive containing all legal artifacts and evidence.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary !rounded-xl !py-3 !px-6 shadow-xl shadow-emerald-900/10"
                onClick={downloadCaseBundleZip}
                disabled={isBundling}
              >
                {isBundling ? 'Compiling Artifacts...' : 'Download ZIP Bundle'}
              </button>
            </div>

          </div>
        )}

        {/* CFPB Tab */}
        {exportTab === 'cfpb' && (
          <div className="space-y-6">
            <div className="panel p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="heading-md mb-4 dark:text-white">CFPB Complaint Generator</h3>
              <p className="body-sm text-gray-600 dark:text-gray-400 mb-4">
                Generate a comprehensive CFPB complaint narrative based on detected violations.
                Complaint strength: <span className="font-bold text-gray-900 dark:text-blue-400">{estimateComplaintStrength(flags).score}%</span>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => downloadDocument('cfpb', 'pdf')}
                >
                  Download CFPB Narrative (PDF)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                  onClick={() => downloadDocument('cfpb', 'txt')}
                >
                  Download as TXT
                </button>
              </div>
            </div>

            <div className="notice bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
              <p className="heading-sm mb-2 dark:text-blue-300">How to File</p>
              <ol className="body-sm space-y-2 list-decimal list-inside text-gray-700 dark:text-gray-300">
                <li>Visit consumerfinance.gov/complaint</li>
                <li>Select "Credit reporting" as the product</li>
                <li>Copy and paste the generated narrative</li>
                <li>Attach supporting documents</li>
              </ol>
            </div>
          </div>
        )}

        {/* Evidence Tab */}
        {exportTab === 'evidence' && (
          <div className="space-y-6">
            <div className="panel p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="heading-md mb-4 dark:text-white">Court-Ready Evidence Package</h3>
              <p className="body-sm text-gray-600 dark:text-gray-400 mb-4">
                Compile all analysis results, violations, and supporting information into a
                professional evidence package suitable for legal proceedings.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const pkg = buildEvidencePackage(editableFields, flags, riskProfile!, consumer.name || '', consumer.state || '');
                    const content = formatEvidencePackage(pkg);
                    downloadTextFile(content, 'evidence_package.txt');
                  }}
                >
                  Download TXT
                </button>
                <button
                  type="button"
                  className="btn btn-secondary dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                  onClick={() => {
                    const pkg = buildEvidencePackage(editableFields, flags, riskProfile!, consumer.name || '', consumer.state || '');
                    const content = formatEvidencePackage(pkg);
                    downloadPdfFile(content, 'evidence_package.pdf');
                  }}
                >
                  Download PDF
                </button>
              </div>
              <button
                type="button"
                className="btn btn-secondary dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                onClick={() => {
                  const pkg = buildEvidencePackage(editableFields, flags, riskProfile!, consumer.name || '', consumer.state || '');
                  const content = formatEvidencePackage(pkg);
                  downloadPdfFile(content, 'evidence_package.pdf');
                }}
              >
                Download PDF
              </button>
            </div>
            <div className="panel p-6 dark:bg-gray-800 dark:border-gray-700">
              <h4 className="heading-sm mb-2 dark:text-white">Evidence Checklist</h4>
              <p className="body-sm text-gray-600 dark:text-gray-400 mb-4">
                Cross-check suggested evidence against your verified items before filing.
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                {Array.from(new Set(flags.flatMap(f => f.suggestedEvidence))).slice(0, 6).map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>{item}</span>
                  </div>
                ))}
                {Array.from(new Set(flags.flatMap(f => f.suggestedEvidence))).length > 6 && (
                  <p className="text-xs text-gray-500">More evidence items available in the Discovery tab.</p>
                )}
              </div>
            </div>

            {impactAssessment && (
              <div className="panel p-6 border-l-4 border-l-blue-500 dark:bg-gray-800 dark:border-gray-700">
                <h4 className="heading-sm mb-3 dark:text-white">Forensic Impact Summary</h4>
                <div className="grid sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="label text-xs text-gray-500 dark:text-gray-400">Legal Basis</p>
                    <p className="heading-md dark:text-white">{impactAssessment.statutory.eligible ? 'Qualified' : 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="label text-xs text-gray-500 dark:text-gray-400">Culpability</p>
                    <p className="heading-md dark:text-white">{impactAssessment.culpability.level.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="label text-xs text-gray-500 dark:text-gray-400">Litigation</p>
                    <p className="heading-md dark:text-white">{impactAssessment.litigationViability.strength.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="label text-xs text-gray-500 dark:text-gray-400">Severity</p>
                    <p className={`heading-md ${impactAssessment.executiveSummary.overallSeverity === 'critical' ? 'text-red-600' : 'text-blue-600'}`}>
                      {impactAssessment.executiveSummary.overallSeverity.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attorney Tab */}
        {exportTab === 'attorney' && (
          <div className="space-y-6">
            <div className="panel-premium p-8 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white mb-2">Attorney Consultation Package</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6">
                    Generate a comprehensive package for attorney consultation including case analysis,
                    violation summary, collector intelligence, and fee structure analysis. This is designed
                    for direct handoff to legal counsel.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
                      onClick={() => {
                        const pkg = buildAttorneyPackage(
                          editableFields,
                          flags,
                          riskProfile!,
                          {
                            name: consumer.name || '',
                            address: consumer.address || '',
                            city: '',
                            state: consumer.state || '',
                            zip: ''
                          }
                        );
                        const content = formatAttorneyPackage(pkg);
                        downloadPdfFile(content, 'attorney_consultation_package.pdf');
                      }}
                    >
                      Export Case Package (PDF)
                    </button>
                    <button
                      type="button"
                      className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => {
                        const pkg = buildAttorneyPackage(
                          editableFields,
                          flags,
                          riskProfile!,
                          {
                            name: consumer.name || '',
                            address: consumer.address || '',
                            city: '',
                            state: consumer.state || '',
                            zip: ''
                          }
                        );
                        const content = formatAttorneyPackage(pkg);
                        downloadTextFile(content, 'attorney_consultation_package.txt');
                      }}
                    >
                      Export TXT
                    </button>
                  </div>
                  <div className="mt-6 p-4 rounded-2xl border border-dashed border-purple-500/30 bg-purple-500/5">
                    <p className="text-[10px] uppercase tracking-widest text-purple-500 mb-2">Client/Attorney Handoff Mode</p>
                    <p className="text-xs text-slate-500 mb-4">Generate a redacted version for safe sharing before engagement letters are signed.</p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95"
                        onClick={() => {
                          const pkg = buildAttorneyPackage(
                            editableFields,
                            flags,
                            riskProfile!,
                            {
                              name: consumer.name || '',
                              address: consumer.address || '',
                              city: '',
                              state: consumer.state || '',
                              zip: ''
                            }
                          );
                          const content = formatRedactedAttorneyPackage(pkg);
                          downloadPdfFile(content, 'attorney_redacted_packet.pdf');
                        }}
                      >
                        Redacted PDF
                      </button>
                      <button
                        type="button"
                        className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                        onClick={() => {
                          const pkg = buildAttorneyPackage(
                            editableFields,
                            flags,
                            riskProfile!,
                            {
                              name: consumer.name || '',
                              address: consumer.address || '',
                              city: '',
                              state: consumer.state || '',
                              zip: ''
                            }
                          );
                          const content = formatRedactedAttorneyPackage(pkg);
                          downloadTextFile(content, 'attorney_redacted_packet.txt');
                        }}
                      >
                        Redacted TXT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="panel p-6 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl border-l-4 border-l-emerald-500">
                <h4 className="text-base font-bold dark:text-white mb-2">Forensic Affidavit</h4>
                <p className="text-xs text-slate-500 mb-4">A signed declaration of accuracy for the extracted forensic data. Essential for attorney-client verification.</p>
                <button
                  type="button"
                  className="w-full px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                  onClick={() => {
                    const content = `AFFIDAVIT OF FORENSIC ACCURACY\n\nI, ${consumer.name || '[NAME]'}, declare under penalty of perjury that the data extracted from the credit report and verified on ${new Date().toLocaleDateString()} is accurate to the best of my knowledge.\n\nCase ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}\nDate: ${new Date().toISOString()}\n\nVerified Flags: ${flags.length}\nOverall Impact: ${impactAssessment ? impactAssessment.executiveSummary.overallSeverity.toUpperCase() : 'N/A'}\n\nSignature: __________________________`;
                    downloadPdfFile(content, 'forensic_affidavit.pdf');
                  }}
                >
                  Download Affidavit
                </button>
              </div>

              <div className="panel p-6 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl">
                <h4 className="text-base font-bold dark:text-white mb-2">Legal Citation List</h4>
                <p className="text-xs text-slate-500 mb-4">Export a list of all 15+ statutes mapped to the detected violations for legal research.</p>
                <button
                  type="button"
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  onClick={() => downloadDocument('summary', 'pdf')}
                >
                  Export Citations
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="notice max-w-xl mx-auto my-10 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
        <p className="body-sm text-center text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">Disclaimer:</span> These documents are templates for educational purposes.
          Consult with a qualified attorney before taking legal action.
        </p>
      </div>

      <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          className="btn btn-secondary dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
          onClick={() => setStep(4)}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary shadow-lg shadow-blue-500/20"
          onClick={() => setStep(6)}
        >
          Track Disputes
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Step5Export;
