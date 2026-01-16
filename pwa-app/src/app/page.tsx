'use client';

import { useState, useCallback } from 'react';
import { parseCreditReport, fieldsToSimple } from '../lib/parser';
import { runRules, calculateRiskProfile, CreditFields, RuleFlag, RiskProfile } from '../lib/rules';
import { generateBureauLetter, generateValidationLetter, generateCaseSummary, generateCFPBNarrative, ConsumerInfo } from '../lib/generator';

type Step = 1 | 2 | 3 | 4 | 5;

interface ParsedField {
  value: string;
  confidence: 'High' | 'Medium' | 'Low';
  sourceText: string;
}

const SAMPLE_TEXT = `Account Information:
Creditor: PORTFOLIO RECOVERY ASSOC
Original Creditor: CAPITAL ONE BANK
Account Type: Collection
Account Status: Open
Balance: $2,847.00
Original Amount: $1,523.00
Date Opened: 2019-03-15
Date of First Delinquency: 2020-08-22
Charge-Off Date: 2020-06-15
Last Payment: 2020-05-10
Estimated Removal: 2029-08-22
Payment History: 30 60 90 120 CO`;

const STEPS = ['Upload', 'Review', 'Verify', 'Analysis', 'Export'] as const;

const FIELD_DEFINITIONS = [
  { key: 'originalCreditor', label: 'Original Creditor', required: false },
  { key: 'furnisherOrCollector', label: 'Furnisher / Collector', required: false },
  { key: 'accountType', label: 'Account Type', required: false },
  { key: 'accountStatus', label: 'Account Status', required: false },
  { key: 'currentBalance', label: 'Current Balance', required: false },
  { key: 'originalAmount', label: 'Original Amount', required: false },
  { key: 'dateOpened', label: 'Date Opened', required: false, isDate: true },
  { key: 'dofd', label: 'Date of First Delinquency', required: true, isDate: true },
  { key: 'chargeOffDate', label: 'Charge-Off Date', required: false, isDate: true },
  { key: 'dateLastPayment', label: 'Last Payment Date', required: false, isDate: true },
  { key: 'estimatedRemovalDate', label: 'Estimated Removal Date', required: false, isDate: true },
] as const;

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

const DOCUMENTS = [
  { type: 'bureau' as const, title: 'Bureau Dispute Letter', desc: 'For Experian, Equifax, TransUnion' },
  { type: 'validation' as const, title: 'Debt Validation Letter', desc: 'FDCPA §809 request to collector' },
  { type: 'cfpb' as const, title: 'CFPB Complaint Narrative', desc: 'Ready for consumerfinance.gov' },
  { type: 'summary' as const, title: 'Case Summary', desc: 'Complete analysis documentation' },
];

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [extractedText, setExtractedText] = useState('');
  const [parsedFields, setParsedFields] = useState<Record<string, ParsedField>>({});
  const [editableFields, setEditableFields] = useState<CreditFields>({});
  const [flags, setFlags] = useState<RuleFlag[]>([]);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [consumer, setConsumer] = useState<ConsumerInfo>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      setExtractedText(text);
      const parsed = parseCreditReport(text);
      setParsedFields(parsed);
      setEditableFields(fieldsToSimple(parsed));
      setStep(2);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const loadSample = useCallback(() => {
    setExtractedText(SAMPLE_TEXT);
    const parsed = parseCreditReport(SAMPLE_TEXT);
    setParsedFields(parsed);
    setEditableFields(fieldsToSimple(parsed));
    setStep(2);
  }, []);

  const handleTextSubmit = useCallback(() => {
    if (!extractedText.trim()) return;
    const parsed = parseCreditReport(extractedText);
    setParsedFields(parsed);
    setEditableFields(fieldsToSimple(parsed));
    setStep(2);
  }, [extractedText]);

  const processAndContinue = useCallback(() => {
    const parsed = parseCreditReport(extractedText);
    setParsedFields(parsed);
    setEditableFields(fieldsToSimple(parsed));
    setStep(3);
  }, [extractedText]);

  const runAnalysis = useCallback(() => {
    const detectedFlags = runRules(editableFields);
    setFlags(detectedFlags);
    const profile = calculateRiskProfile(detectedFlags, editableFields);
    setRiskProfile(profile);
    setStep(4);
  }, [editableFields]);

  const downloadLetter = useCallback((type: 'bureau' | 'validation' | 'summary' | 'cfpb') => {
    let content = '';
    let filename = '';

    switch (type) {
      case 'bureau':
        content = generateBureauLetter(editableFields, flags, consumer);
        filename = 'bureau_dispute_letter.txt';
        break;
      case 'validation':
        content = generateValidationLetter(editableFields, flags, consumer);
        filename = 'debt_validation_letter.txt';
        break;
      case 'cfpb':
        content = generateCFPBNarrative(editableFields, flags);
        filename = 'cfpb_complaint.txt';
        break;
      case 'summary':
        content = generateCaseSummary(editableFields, flags, riskProfile!);
        filename = 'case_summary.md';
        break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [editableFields, flags, consumer, riskProfile]);

  const resetAnalysis = useCallback(() => {
    setStep(1);
    setExtractedText('');
    setParsedFields({});
    setEditableFields({});
    setFlags([]);
    setRiskProfile(null);
    setConsumer({});
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-label">Forensic Analysis</span>
              <h1 className="text-lg font-semibold tracking-tight">Credit Report Analyzer</h1>
            </div>
            <span className="mono text-xs text-neutral-400">v2.0</span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <nav className="border-b border-neutral-100 bg-white no-print" aria-label="Progress">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <ol className="flex items-center justify-center gap-1">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`step-indicator ${
                      step > i + 1 ? 'step-complete' : step === i + 1 ? 'step-active' : ''
                    }`}
                    aria-current={step === i + 1 ? 'step' : undefined}
                  >
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm hidden sm:inline ${
                    step >= i + 1 ? 'text-neutral-900' : 'text-neutral-400'
                  }`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`step-line mx-3 ${step > i + 1 ? 'step-line-active' : ''}`} />
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-10">

          {/* Step 1: Upload */}
          {step === 1 && (
            <section className="fade-in" aria-labelledby="upload-heading">
              <header className="mb-8">
                <h2 id="upload-heading">Upload Credit Report</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Paste account text or upload a file for forensic analysis.
                </p>
              </header>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label htmlFor="file-upload" className="block text-sm font-medium text-neutral-700 mb-2">
                    Upload File
                  </label>
                  <label className="upload-zone" tabIndex={0}>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".txt"
                      className="sr-only"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      disabled={isProcessing}
                    />
                    <span className="text-neutral-600 text-sm font-medium">
                      {isProcessing ? 'Processing...' : 'Select file'}
                    </span>
                    <span className="text-neutral-400 text-xs mt-1">.txt format</span>
                  </label>
                </div>

                <div>
                  <label htmlFor="paste-text" className="block text-sm font-medium text-neutral-700 mb-2">
                    Paste Text
                  </label>
                  <textarea
                    id="paste-text"
                    className="textarea h-[120px] text-sm"
                    placeholder="Paste account section here..."
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary w-full mt-3"
                    onClick={handleTextSubmit}
                    disabled={!extractedText.trim()}
                  >
                    Continue
                  </button>
                </div>
              </div>

              <div className="text-center mb-8">
                <button
                  type="button"
                  onClick={loadSample}
                  className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Load sample data
                </button>
              </div>

              <aside className="notice">
                <strong>Privacy:</strong> All processing occurs locally. No data leaves your device.
              </aside>
            </section>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <section className="fade-in" aria-labelledby="review-heading">
              <header className="mb-6">
                <h2 id="review-heading">Review Extracted Text</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Verify the text is complete before analysis.
                </p>
              </header>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="review-text" className="text-sm font-medium text-neutral-700">
                    Source Text
                  </label>
                  <span className="mono text-xs text-neutral-400">
                    {extractedText.length.toLocaleString()} characters
                  </span>
                </div>
                <textarea
                  id="review-text"
                  className="textarea h-64 mono text-sm"
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                />
              </div>

              <div className="flex justify-between gap-4">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" className="btn-primary" onClick={processAndContinue}>
                  Continue
                </button>
              </div>
            </section>
          )}

          {/* Step 3: Verify */}
          {step === 3 && (
            <section className="fade-in" aria-labelledby="verify-heading">
              <header className="mb-6">
                <h2 id="verify-heading">Verify Parsed Fields</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Correct any errors. Dates must be accurate for statute analysis.
                </p>
              </header>

              <div className="space-y-1 mb-6">
                {FIELD_DEFINITIONS.map(({ key, label, required, isDate }) => (
                  <div key={key} className="field-row">
                    <label htmlFor={`field-${key}`} className="text-sm text-neutral-600">
                      {label}
                      {required && <span className="text-neutral-900 ml-0.5">*</span>}
                    </label>
                    <input
                      id={`field-${key}`}
                      type="text"
                      className="input"
                      value={(editableFields as any)[key] || ''}
                      onChange={(e) => setEditableFields(prev => ({
                        ...prev,
                        [key]: e.target.value
                      }))}
                      placeholder={isDate ? 'YYYY-MM-DD' : ''}
                    />
                  </div>
                ))}
              </div>

              <div className="divider my-6" />

              <div className="mb-6">
                <h3 className="mb-4">Your Information</h3>
                <p className="text-sm text-neutral-500 mb-4">Optional. Used to personalize dispute letters.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="consumer-name" className="block text-sm text-neutral-600 mb-1">
                      Full Name
                    </label>
                    <input
                      id="consumer-name"
                      type="text"
                      className="input"
                      value={consumer.name || ''}
                      onChange={(e) => setConsumer(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="consumer-state" className="block text-sm text-neutral-600 mb-1">
                      State
                    </label>
                    <select
                      id="consumer-state"
                      className="input"
                      value={consumer.state || ''}
                      onChange={(e) => {
                        setConsumer(prev => ({ ...prev, state: e.target.value }));
                        setEditableFields(prev => ({ ...prev, stateCode: e.target.value }));
                      }}
                    >
                      <option value="">Select state</option>
                      {STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-4">
                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="button" className="btn-primary" onClick={runAnalysis}>
                  Run Analysis
                </button>
              </div>
            </section>
          )}

          {/* Step 4: Analysis */}
          {step === 4 && riskProfile && (
            <section className="fade-in" aria-labelledby="analysis-heading">
              <header className="flex justify-between items-start mb-6">
                <div>
                  <h2 id="analysis-heading">Analysis Results</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    {flags.length} {flags.length === 1 ? 'issue' : 'issues'} identified
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-secondary text-sm no-print"
                >
                  Print
                </button>
              </header>

              {/* Score Card */}
              <div className="border border-neutral-200 p-6 mb-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <span className="score-label">Case Strength</span>
                    <div className="score-display mt-1">{riskProfile.overallScore}</div>
                    <span className="text-sm text-neutral-400">of 100</span>
                  </div>
                  <div className="space-y-3 sm:border-l sm:border-neutral-100 sm:pl-6">
                    <div className="result-row">
                      <span className="text-sm text-neutral-500">Risk Level</span>
                      <span className="text-sm font-medium uppercase">{riskProfile.riskLevel}</span>
                    </div>
                    <div className="result-row">
                      <span className="text-sm text-neutral-500">Dispute Strength</span>
                      <span className="text-sm font-medium uppercase">{riskProfile.disputeStrength}</span>
                    </div>
                    <div className="result-row">
                      <span className="text-sm text-neutral-500">Litigation Potential</span>
                      <span className="text-sm font-medium">{riskProfile.litigationPotential ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues */}
              {flags.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-4">Detected Issues</h3>
                  <div className="space-y-4">
                    {flags.map((flag, i) => (
                      <article key={i} className={`severity-${flag.severity} py-3`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-neutral-900">{flag.ruleName}</h4>
                          <span className={`badge ${
                            flag.severity === 'high' ? 'badge-dark' :
                            flag.severity === 'medium' ? 'badge-medium' : 'badge-light'
                          }`}>
                            {flag.severity}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 mb-2">{flag.explanation}</p>
                        <footer className="mono text-xs text-neutral-400">
                          {flag.ruleId} · {flag.legalCitations.join(', ')}
                        </footer>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {flags.length === 0 && (
                <div className="border border-neutral-200 p-6 mb-6 text-center">
                  <p className="text-neutral-600">No obvious violations detected.</p>
                  <p className="text-sm text-neutral-400 mt-1">Manual review recommended.</p>
                </div>
              )}

              {/* Recommendation */}
              <aside className="notice mb-6">
                <strong>Recommended Approach:</strong>
                <p className="mt-1">{riskProfile.recommendedApproach}</p>
              </aside>

              <div className="flex justify-between gap-4">
                <button type="button" className="btn-secondary" onClick={() => setStep(3)}>
                  Back
                </button>
                <button type="button" className="btn-primary" onClick={() => setStep(5)}>
                  Generate Documents
                </button>
              </div>
            </section>
          )}

          {/* Step 5: Export */}
          {step === 5 && (
            <section className="fade-in" aria-labelledby="export-heading">
              <header className="mb-6">
                <h2 id="export-heading">Export Documents</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Download dispute letters and documentation.
                </p>
              </header>

              <div className="space-y-3 mb-6">
                {DOCUMENTS.map((doc) => (
                  <button
                    type="button"
                    key={doc.type}
                    onClick={() => downloadLetter(doc.type)}
                    className="doc-button"
                  >
                    <span className="block font-medium text-neutral-900">{doc.title}</span>
                    <span className="block text-sm text-neutral-500 mt-0.5">{doc.desc}</span>
                  </button>
                ))}
              </div>

              <aside className="notice mb-6">
                <strong>Disclaimer:</strong> This tool provides information only, not legal advice.
                Consult a qualified attorney for serious violations.
              </aside>

              <div className="flex justify-between gap-4">
                <button type="button" className="btn-secondary" onClick={() => setStep(4)}>
                  Back
                </button>
                <button type="button" className="btn-primary" onClick={resetAnalysis}>
                  New Analysis
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-100 bg-white no-print">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center text-xs text-neutral-400">
            <span>Credit Report Analyzer</span>
            <span>Client-side processing only</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
