'use client';

import React from 'react';
import { RuleFlag, RiskProfile, CreditFields } from '../../lib/types';
import { Step } from '../../lib/constants';
import { DamageEstimate } from '../../lib/evidence-builder';
import { ConsumerInfo } from '../../lib/generator';

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
  damageEstimate: DamageEstimate | null;
  translate: (key: string) => string;
  downloadDocument: (type: 'bureau' | 'validation' | 'cfpb' | 'summary', format?: 'pdf' | 'txt') => void;
  generateCeaseDesistLetter: Function;
  generateIntentToSueLetter: Function;
  estimateComplaintStrength: (flags: RuleFlag[]) => ComplaintStrength;
  buildEvidencePackage: Function;
  formatEvidencePackage: Function;
  buildAttorneyPackage: Function;
  formatAttorneyPackage: Function;
  formatCurrency: (amount: number) => string;
  downloadAnalysisJson: () => void;
  downloadCaseBundle: () => void;
  downloadCaseBundleZip: () => void;
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
  damageEstimate,
  translate,
  downloadDocument,
  generateCeaseDesistLetter,
  generateIntentToSueLetter,
  estimateComplaintStrength,
  buildEvidencePackage,
  formatEvidencePackage,
  buildAttorneyPackage,
  formatAttorneyPackage,
  formatCurrency,
  downloadAnalysisJson,
  downloadCaseBundle,
  downloadCaseBundleZip,
  isBundling,
  downloadTextFile,
  downloadPdfFile
}) => {
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

            {damageEstimate && (
              <div className="panel p-6 border-l-4 border-l-green-500 dark:bg-gray-800 dark:border-gray-700">
                <h4 className="heading-sm mb-3 dark:text-white">Damage Calculation Summary</h4>
                <div className="grid sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="label text-xs text-gray-500 dark:text-gray-400">Statutory</p>
                    <p className="heading-md dark:text-white">{formatCurrency(damageEstimate.statutory.min)} - {formatCurrency(damageEstimate.statutory.max)}</p>
                  </div>
                  <div>
                    <p className="label text-xs text-gray-500 dark:text-gray-400">Actual</p>
                    <p className="heading-md dark:text-white">{formatCurrency(damageEstimate.actual.estimated)}</p>
                  </div>
                  <div>
                    <p className="label text-xs text-gray-500 dark:text-gray-400">Total Potential</p>
                    <p className="heading-md text-green-600">{formatCurrency(damageEstimate.total.min)} - {formatCurrency(damageEstimate.total.max)}</p>
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
                    const content = `AFFIDAVIT OF FORENSIC ACCURACY\n\nI, ${consumer.name || '[NAME]'}, declare under penalty of perjury that the data extracted from the credit report and verified on ${new Date().toLocaleDateString()} is accurate to the best of my knowledge.\n\nCase ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}\nDate: ${new Date().toISOString()}\n\nVerified Flags: ${flags.length}\nTotal Exposure: ${damageEstimate ? damageEstimate.total.max : 'N/A'}\n\nSignature: __________________________`;
                    downloadPdfFile(content, 'forensic_affidavit.pdf');
                  }}
                >
                  Download Affidavit
                </button>
              </div>

              <div className="panel p-6 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl">
                <h4 className="text-base font-bold dark:text-white mb-2">Statutory Citation List</h4>
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
