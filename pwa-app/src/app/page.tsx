'use client';

import { useState, useCallback, useMemo } from 'react';
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

const FIELD_DEFINITIONS: readonly { key: string; label: string; required: boolean; isDate?: boolean }[] = [
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
];

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

const DOCUMENTS = [
  { type: 'bureau' as const, title: 'Bureau Dispute Letter', desc: 'For Experian, Equifax, TransUnion', icon: 'B' },
  { type: 'validation' as const, title: 'Debt Validation Letter', desc: 'FDCPA §809 request to collector', icon: 'V' },
  { type: 'cfpb' as const, title: 'CFPB Complaint Narrative', desc: 'Ready for consumerfinance.gov', icon: 'C' },
  { type: 'summary' as const, title: 'Case Summary', desc: 'Complete analysis documentation', icon: 'S' },
];

// Score Ring Component
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e8e8e8"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#111111"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="score-display text-3xl">{score}</span>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {subtext && <div className="text-xs text-neutral-500 mt-1">{subtext}</div>}
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [extractedText, setExtractedText] = useState('');
  const [parsedFields, setParsedFields] = useState<Record<string, ParsedField>>({});
  const [editableFields, setEditableFields] = useState<CreditFields>({});
  const [flags, setFlags] = useState<RuleFlag[]>([]);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [consumer, setConsumer] = useState<ConsumerInfo>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Computed stats
  const issueStats = useMemo(() => {
    const high = flags.filter(f => f.severity === 'high').length;
    const medium = flags.filter(f => f.severity === 'medium').length;
    const low = flags.filter(f => f.severity === 'low').length;
    return { high, medium, low, total: flags.length };
  }, [flags]);

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
    <main className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-900 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">CR</span>
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight leading-none">Credit Report Analyzer</h1>
                <span className="text-xs text-neutral-500">Forensic Analysis Tool</span>
              </div>
            </div>
            <span className="mono text-[10px] text-neutral-400 px-2 py-1 bg-neutral-100">v2.1</span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <nav className="border-b border-neutral-100 bg-white no-print" aria-label="Progress">
        <div className="max-w-2xl mx-auto px-6 py-3">
          <ol className="flex items-center justify-between">
            {STEPS.map((label, i) => {
              const isComplete = step > i + 1;
              const isCurrent = step === i + 1;
              return (
                <li key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2">
                    <div
                      className={`step-indicator ${isComplete ? 'step-complete' : isCurrent ? 'step-active' : ''}`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {isComplete ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`text-xs hidden sm:inline ${isCurrent ? 'text-neutral-900 font-medium' : isComplete ? 'text-neutral-600' : 'text-neutral-400'}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-3 ${isComplete ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1">
        <div className="max-w-2xl mx-auto px-6 py-8">

          {/* Step 1: Upload */}
          {step === 1 && (
            <section className="fade-in" aria-labelledby="upload-heading">
              <header className="mb-8 text-center">
                <h2 id="upload-heading" className="text-xl mb-2">Upload Credit Report</h2>
                <p className="text-sm text-neutral-500 max-w-md mx-auto">
                  Paste the account section from your credit report or upload a text file for forensic analysis.
                </p>
              </header>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label htmlFor="file-upload" className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                    Upload File
                  </label>
                  <label className="upload-zone h-36 cursor-pointer" tabIndex={0}>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".txt"
                      className="sr-only"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      disabled={isProcessing}
                    />
                    {isProcessing ? (
                      <div className="spinner" />
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-neutral-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <span className="text-neutral-600 text-sm font-medium">Select file</span>
                        <span className="text-neutral-400 text-xs mt-1">.txt format</span>
                      </>
                    )}
                  </label>
                </div>

                <div>
                  <label htmlFor="paste-text" className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                    Paste Text
                  </label>
                  <textarea
                    id="paste-text"
                    className="textarea h-36 text-sm"
                    placeholder="Paste account section here..."
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                <button
                  type="button"
                  className="btn-primary px-8"
                  onClick={handleTextSubmit}
                  disabled={!extractedText.trim()}
                >
                  Analyze Text
                </button>
                <button
                  type="button"
                  onClick={loadSample}
                  className="btn-secondary"
                >
                  Load Sample Data
                </button>
              </div>

              <aside className="notice text-center">
                <svg className="w-4 h-4 inline-block mr-2 -mt-0.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <strong>100% Private:</strong> All processing occurs locally in your browser. No data is ever transmitted.
              </aside>
            </section>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <section className="fade-in" aria-labelledby="review-heading">
              <header className="mb-6">
                <h2 id="review-heading">Review Extracted Text</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Verify the text is complete and accurate before proceeding to analysis.
                </p>
              </header>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="review-text" className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Source Text
                  </label>
                  <span className="mono text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5">
                    {extractedText.length.toLocaleString()} chars
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
                  Parse Fields
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
                  Review and correct any parsing errors. Accurate dates are essential for statute of limitations analysis.
                </p>
              </header>

              <div className="border border-neutral-200 divide-y divide-neutral-200 mb-6">
                {FIELD_DEFINITIONS.map(({ key, label, required, isDate }) => (
                  <div key={key} className="grid grid-cols-3 gap-4 items-center p-3">
                    <label htmlFor={`field-${key}`} className="text-sm text-neutral-600">
                      {label}
                      {required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input
                      id={`field-${key}`}
                      type="text"
                      className="input col-span-2 text-sm"
                      value={(editableFields as Record<string, string>)[key] || ''}
                      onChange={(e) => setEditableFields(prev => ({
                        ...prev,
                        [key]: e.target.value
                      }))}
                      placeholder={isDate ? 'YYYY-MM-DD' : '—'}
                    />
                  </div>
                ))}
              </div>

              <div className="border border-neutral-200 p-4 mb-6">
                <h3 className="text-sm font-medium mb-3">Your Information <span className="text-neutral-400 font-normal">(Optional)</span></h3>
                <p className="text-xs text-neutral-500 mb-4">Used to personalize dispute letters with your name and applicable state laws.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="consumer-name" className="block text-xs text-neutral-500 uppercase tracking-wide mb-1">
                      Full Name
                    </label>
                    <input
                      id="consumer-name"
                      type="text"
                      className="input text-sm"
                      value={consumer.name || ''}
                      onChange={(e) => setConsumer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="consumer-state" className="block text-xs text-neutral-500 uppercase tracking-wide mb-1">
                      State
                    </label>
                    <select
                      id="consumer-state"
                      className="input text-sm"
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
                    Forensic analysis complete
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-secondary text-xs no-print"
                >
                  Print Report
                </button>
              </header>

              {/* Score Overview */}
              <div className="border border-neutral-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="text-center">
                    <ScoreRing score={riskProfile.overallScore} size={100} />
                    <div className="text-xs text-neutral-500 mt-2">Case Strength</div>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-neutral-50">
                      <div className="text-2xl font-semibold text-neutral-900">{issueStats.high}</div>
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">High</div>
                    </div>
                    <div className="text-center p-3 bg-neutral-50">
                      <div className="text-2xl font-semibold text-neutral-600">{issueStats.medium}</div>
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">Medium</div>
                    </div>
                    <div className="text-center p-3 bg-neutral-50">
                      <div className="text-2xl font-semibold text-neutral-400">{issueStats.low}</div>
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">Low</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-neutral-200">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Risk Level</div>
                    <div className="font-medium uppercase">{riskProfile.riskLevel}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Dispute Strength</div>
                    <div className="font-medium uppercase">{riskProfile.disputeStrength}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Litigation</div>
                    <div className="font-medium">{riskProfile.litigationPotential ? 'Potential' : 'Unlikely'}</div>
                  </div>
                </div>
              </div>

              {/* Issues */}
              {flags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Detected Violations ({flags.length})</h3>
                  <div className="space-y-3">
                    {flags.map((flag, i) => (
                      <article key={i} className={`border border-neutral-200 ${
                        flag.severity === 'high' ? 'border-l-4 border-l-neutral-900' :
                        flag.severity === 'medium' ? 'border-l-4 border-l-neutral-500' : 'border-l-4 border-l-neutral-300'
                      }`}>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-neutral-900 text-sm">{flag.ruleName}</h4>
                            <span className={`badge ${
                              flag.severity === 'high' ? 'badge-dark' :
                              flag.severity === 'medium' ? 'badge-medium' : 'badge-light'
                            }`}>
                              {flag.severity}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-600 mb-3">{flag.explanation}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="mono text-[10px] px-2 py-1 bg-neutral-100 text-neutral-600">{flag.ruleId}</span>
                            {flag.legalCitations.map((cite, j) => (
                              <span key={j} className="mono text-[10px] px-2 py-1 bg-neutral-100 text-neutral-600">{cite}</span>
                            ))}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {flags.length === 0 && (
                <div className="empty-state mb-6">
                  <svg className="w-10 h-10 mx-auto mb-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-neutral-600 font-medium">No obvious violations detected</p>
                  <p className="text-sm text-neutral-400 mt-1">Manual review by a professional is still recommended.</p>
                </div>
              )}

              {/* Recommendation */}
              <div className="notice mb-6">
                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">Recommended Approach</div>
                <p className="text-neutral-700">{riskProfile.recommendedApproach}</p>
              </div>

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
              <header className="mb-6 text-center">
                <h2 id="export-heading">Export Documents</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Download dispute letters and case documentation.
                </p>
              </header>

              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {DOCUMENTS.map((doc) => (
                  <button
                    type="button"
                    key={doc.type}
                    onClick={() => downloadLetter(doc.type)}
                    className="doc-button text-left p-4 flex gap-4 items-start"
                  >
                    <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-neutral-600">{doc.icon}</span>
                    </div>
                    <div>
                      <span className="block font-medium text-neutral-900 text-sm">{doc.title}</span>
                      <span className="block text-xs text-neutral-500 mt-0.5">{doc.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <aside className="notice text-center mb-6">
                <strong>Legal Disclaimer:</strong> This tool provides information only and does not constitute legal advice.
                Consult with a qualified attorney for serious violations or before taking legal action.
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
      <footer className="border-t border-neutral-100 bg-white no-print mt-auto">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center text-[10px] text-neutral-400 uppercase tracking-wide">
            <span>Credit Report Analyzer v2.1</span>
            <span>Client-Side Processing Only</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
