'use strict';

import React from 'react';
import { RuleFlag, RiskProfile, CreditFields } from '../../lib/rules';
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
}

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
  formatCurrency
}) => {
  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="heading-xl mb-3 dark:text-white">{translate('export.title')}</h2>
        <p className="body-lg text-gray-600 dark:text-gray-400">
          Generate dispute letters, CFPB complaints, evidence packages, and attorney referral documents.
        </p>
      </div>

      {/* Export Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex gap-6">
          {(['letters', 'cfpb', 'evidence', 'attorney'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setExportTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                exportTab === tab
                  ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'letters' && 'Dispute Letters'}
              {tab === 'cfpb' && 'CFPB Complaint'}
              {tab === 'evidence' && 'Evidence Package'}
              {tab === 'attorney' && 'Attorney Export'}
            </button>
          ))}
        </div>
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
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const pkg = buildEvidencePackage(editableFields, flags, riskProfile!, consumer.name || '', consumer.state || '');
                  const content = formatEvidencePackage(pkg);
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'evidence_package.txt';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Generate Evidence Package
              </button>
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
            <div className="panel p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="heading-md mb-4 dark:text-white">Attorney Consultation Package</h3>
              <p className="body-sm text-gray-600 dark:text-gray-400 mb-4">
                Generate a comprehensive package for attorney consultation including case analysis,
                violation summary, collector intelligence, and fee structure analysis.
              </p>
              <button
                type="button"
                className="btn btn-primary"
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
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'attorney_consultation_package.txt';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Generate Attorney Package
              </button>
            </div>

            <div className="panel p-6 dark:bg-gray-800 dark:border-gray-700">
              <h4 className="heading-sm mb-3 dark:text-white">Case Summary</h4>
              <button
                type="button"
                className="btn btn-secondary w-full dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                onClick={() => downloadDocument('summary', 'pdf')}
              >
                Download Case Summary (PDF)
              </button>
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
