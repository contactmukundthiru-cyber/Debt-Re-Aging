'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { parseCreditReport, fieldsToSimple } from '../lib/parser';
import { runRules, calculateRiskProfile, CreditFields, RuleFlag, RiskProfile } from '../lib/rules';
import { generateBureauLetter, generateValidationLetter, generateCaseSummary, generateCFPBNarrative, ConsumerInfo } from '../lib/generator';
import { performOCR, isImage } from '../lib/ocr';
import { isPDF, extractPDFText } from '../lib/pdf';
import {
  buildTimeline,
  calculateScoreBreakdown,
  detectPatterns,
  generateActionItems,
  calculateForensicMetrics,
  TimelineEvent,
  ScoreBreakdown,
  PatternInsight
} from '../lib/analytics';
import {
  saveAnalysis,
  getHistory,
  getAnalysis,
  deleteAnalysis,
  formatTimestamp,
  AnalysisRecord
} from '../lib/storage';

type Step = 1 | 2 | 3 | 4 | 5;

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

const STEPS = [
  { id: 1, name: 'Input', desc: 'Upload Report' },
  { id: 2, name: 'Extract', desc: 'Review Text' },
  { id: 3, name: 'Verify', desc: 'Confirm Data' },
  { id: 4, name: 'Analyze', desc: 'View Results' },
  { id: 5, name: 'Export', desc: 'Get Documents' },
] as const;

const FIELD_CONFIG: { key: string; label: string; section: string; isDate?: boolean; required?: boolean; help?: string }[] = [
  { key: 'originalCreditor', label: 'Original Creditor', section: 'account', help: 'The company that originally extended credit' },
  { key: 'furnisherOrCollector', label: 'Current Furnisher', section: 'account', help: 'Who is currently reporting this account' },
  { key: 'accountType', label: 'Account Type', section: 'account', help: 'e.g., Collection, Charge-off, Credit Card' },
  { key: 'accountStatus', label: 'Status', section: 'account', help: 'Current account status (Open, Closed, Paid)' },
  { key: 'paymentHistory', label: 'Payment History', section: 'account', help: 'Payment status codes (OK, 30, 60, 90, CO)' },
  { key: 'currentBalance', label: 'Current Balance', section: 'amounts', help: 'Amount currently reported as owed' },
  { key: 'originalAmount', label: 'Original Amount', section: 'amounts', help: 'Original debt amount before fees/interest' },
  { key: 'creditLimit', label: 'Credit Limit', section: 'amounts', help: 'Original credit limit if applicable' },
  { key: 'dateOpened', label: 'Date Opened', section: 'dates', isDate: true, help: 'When the account was first opened' },
  { key: 'dofd', label: 'Date of First Delinquency', section: 'dates', isDate: true, required: true, help: 'CRITICAL: When the account first became 30+ days late. Determines 7-year reporting window.' },
  { key: 'chargeOffDate', label: 'Charge-Off Date', section: 'dates', isDate: true, help: 'When the creditor wrote off the debt' },
  { key: 'dateLastPayment', label: 'Last Payment', section: 'dates', isDate: true, help: 'Most recent payment date. Affects statute of limitations.' },
  { key: 'dateReportedOrUpdated', label: 'Last Reported', section: 'dates', isDate: true, help: 'When this information was last updated' },
  { key: 'estimatedRemovalDate', label: 'Est. Removal Date', section: 'dates', isDate: true, help: 'When it should fall off your report' },
];

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

const ACCOUNT_TYPES = ['Collection', 'Charge-off', 'Credit Card', 'Installment Loan', 'Medical', 'Mortgage', 'Auto Loan', 'Student Loan', 'Personal Loan', 'Utility'];

const STATUSES = ['Open', 'Closed', 'Paid', 'Settled', 'Transferred', 'Sold', 'Charged Off', 'In Collections'];

export default function CreditReportAnalyzer() {
  const [step, setStep] = useState<Step>(1);
  const [rawText, setRawText] = useState('');
  const [editableFields, setEditableFields] = useState<CreditFields>({});
  const [flags, setFlags] = useState<RuleFlag[]>([]);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [consumer, setConsumer] = useState<ConsumerInfo>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'violations' | 'timeline' | 'breakdown' | 'patterns' | 'actions'>('violations');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // Computed analytics
  const analytics = useMemo(() => {
    if (!riskProfile || flags.length === 0) return null;
    return {
      timeline: buildTimeline(editableFields, flags),
      breakdown: calculateScoreBreakdown(flags, editableFields),
      patterns: detectPatterns(flags, editableFields),
      actions: generateActionItems(flags, riskProfile, editableFields),
      metrics: calculateForensicMetrics(editableFields, flags),
    };
  }, [flags, riskProfile, editableFields]);

  const issuesByPriority = useMemo(() => ({
    high: flags.filter(f => f.severity === 'high'),
    medium: flags.filter(f => f.severity === 'medium'),
    low: flags.filter(f => f.severity === 'low'),
  }), [flags]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHelp(null);
        setExpandedCard(null);
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter' && step === 1 && rawText.trim()) {
          e.preventDefault();
          processText();
        }
        if (e.key === 'p' && step === 4) {
          e.preventDefault();
          window.print();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, rawText]);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setFileName(file.name);

    try {
      let text = '';

      if (isPDF(file)) {
        setProgressText('Extracting PDF text...');
        text = await extractPDFText(file, (p) => setProgress(Math.round(p * 100)));
      } else if (isImage(file)) {
        setProgressText('Running OCR...');
        text = await performOCR(file, (p) => setProgress(Math.round(p * 100)));
      } else {
        setProgressText('Reading file...');
        text = await file.text();
        setProgress(100);
      }

      setRawText(text);
      const parsed = parseCreditReport(text);
      setEditableFields(fieldsToSimple(parsed));
      setStep(2);
    } catch (error) {
      console.error('Processing error:', error);
      setProgressText('Error processing file');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressText('');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  }, []);

  const processText = useCallback(() => {
    if (!rawText.trim()) return;
    const parsed = parseCreditReport(rawText);
    setEditableFields(fieldsToSimple(parsed));
    setStep(2);
  }, [rawText]);

  const loadSample = useCallback(() => {
    setRawText(SAMPLE_TEXT);
    setFileName('sample_data.txt');
    const parsed = parseCreditReport(SAMPLE_TEXT);
    setEditableFields(fieldsToSimple(parsed));
    setStep(2);
  }, []);

  const runAnalysis = useCallback(() => {
    const detectedFlags = runRules(editableFields);
    setFlags(detectedFlags);
    const profile = calculateRiskProfile(detectedFlags, editableFields);
    setRiskProfile(profile);
    setActiveTab('violations');
    setStep(4);

    // Save to history
    saveAnalysis(editableFields, detectedFlags, profile, fileName || undefined);
    setHistory(getHistory());
  }, [editableFields, fileName]);

  const loadFromHistory = useCallback((record: AnalysisRecord) => {
    setEditableFields(record.fields);
    setFlags(record.flags);
    setRiskProfile(record.riskProfile);
    setFileName(record.fileName || null);
    setShowHistory(false);
    setActiveTab('violations');
    setStep(4);
  }, []);

  const removeFromHistory = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAnalysis(id);
    setHistory(getHistory());
  }, []);

  const downloadDocument = useCallback((type: 'bureau' | 'validation' | 'cfpb' | 'summary') => {
    const generators: Record<string, () => { content: string; filename: string; mimeType: string }> = {
      bureau: () => ({
        content: generateBureauLetter(editableFields, flags, consumer),
        filename: 'dispute_letter_bureau.txt',
        mimeType: 'text/plain'
      }),
      validation: () => ({
        content: generateValidationLetter(editableFields, flags, consumer),
        filename: 'debt_validation_request.txt',
        mimeType: 'text/plain'
      }),
      cfpb: () => ({
        content: generateCFPBNarrative(editableFields, flags),
        filename: 'cfpb_complaint_narrative.txt',
        mimeType: 'text/plain'
      }),
      summary: () => ({
        content: generateCaseSummary(editableFields, flags, riskProfile!),
        filename: 'case_analysis_summary.md',
        mimeType: 'text/markdown'
      }),
    };

    const { content, filename, mimeType } = generators[type]();
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, [editableFields, flags, consumer, riskProfile]);

  const reset = useCallback(() => {
    setStep(1);
    setRawText('');
    setEditableFields({});
    setFlags([]);
    setRiskProfile(null);
    setConsumer({});
    setFileName(null);
    setActiveTab('violations');
    setExpandedCard(null);
  }, []);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="container py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="label text-gray-500">Forensic Credit Analysis</p>
              <h1 className="heading-lg tracking-tight">Credit Report Analyzer</h1>
            </div>
            <div className="flex items-center gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={reset}
                  className="btn btn-ghost text-sm no-print"
                >
                  New Analysis
                </button>
              )}
              <div className="text-right hidden sm:block">
                <p className="mono text-xs text-gray-400">v4.0</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <nav className="border-b border-gray-100 bg-gray-50/50 no-print">
        <div className="container py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => s.id < step && setStep(s.id as Step)}
                  disabled={s.id > step}
                  className="flex flex-col items-center group relative"
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${step > s.id ? 'bg-gray-900 text-white' : ''}
                      ${step === s.id ? 'bg-gray-900 text-white ring-4 ring-gray-200' : ''}
                      ${step < s.id ? 'bg-gray-100 text-gray-400' : ''}
                      ${s.id < step ? 'cursor-pointer hover:bg-gray-700' : ''}
                    `}
                  >
                    {step > s.id ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.id}
                  </div>
                  <span className={`label mt-2 text-xs ${step >= s.id ? 'text-gray-700' : 'text-gray-400'}`}>
                    {s.name}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? 'bg-gray-900' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 py-8 sm:py-12">
        <div className="container">

          {/* Step 1: Input */}
          {step === 1 && (
            <div className="fade-in max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="heading-xl mb-3">Analyze Your Credit Report</h2>
                <p className="body-lg text-gray-600 max-w-xl mx-auto">
                  Upload any format — PDF, image, or text. Our forensic engine detects
                  FCRA/FDCPA violations and illegal debt re-aging.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* File Upload */}
                <div>
                  <p className="label mb-2 flex items-center gap-2">
                    <span>Upload File</span>
                    <span className="text-xs text-gray-400 font-normal">PDF, Image, or Text</span>
                  </p>
                  <div
                    className="upload-area cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff"
                      className="sr-only"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      disabled={isProcessing}
                    />
                    {isProcessing ? (
                      <div className="text-center py-4">
                        <div className="spinner mx-auto mb-3" />
                        <p className="body-sm text-gray-600 mb-2">{progressText}</p>
                        <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden mx-auto">
                          <div
                            className="h-full bg-gray-900 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="heading-sm mb-1">Drop file or click to browse</p>
                        <p className="body-sm text-gray-500">PDF, PNG, JPG, TXT supported</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Text Input */}
                <div>
                  <p className="label mb-2">Paste Text</p>
                  <textarea
                    className="textarea h-[180px] font-mono text-sm"
                    placeholder="Paste the account section from your credit report here..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={processText}
                  disabled={!rawText.trim()}
                >
                  Analyze Report
                  <kbd className="ml-2 text-xs opacity-60 hidden sm:inline">⌘↵</kbd>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={loadSample}
                >
                  Load Sample Data
                </button>
              </div>

              <div className="notice max-w-xl mx-auto mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="body-sm">
                    <span className="font-medium">100% Private:</span> All processing happens in your browser.
                    Your data never leaves your device.
                  </p>
                </div>
              </div>

              {/* Analysis History */}
              {history.length > 0 && (
                <div className="max-w-xl mx-auto">
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-between p-4 panel-inset hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="heading-sm">Recent Analyses</span>
                      <span className="text-xs text-gray-400 font-normal">({history.length})</span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showHistory && (
                    <div className="border border-t-0 border-gray-100 divide-y divide-gray-100">
                      {history.slice(0, 5).map((record) => (
                        <button
                          key={record.id}
                          type="button"
                          onClick={() => loadFromHistory(record)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left group"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-lg font-light">{record.riskProfile.overallScore}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="body-sm font-medium truncate">
                              {record.fields.furnisherOrCollector || record.fields.originalCreditor || 'Unknown Account'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatTimestamp(record.timestamp)} · {record.flags.length} violations
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => removeFromHistory(record.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review Extracted */}
          {step === 2 && (
            <div className="fade-in max-w-3xl mx-auto">
              <div className="mb-6">
                <h2 className="heading-lg mb-2">Review Extracted Text</h2>
                <p className="body-md text-gray-600">
                  Verify the text was extracted correctly. Edit if needed.
                </p>
              </div>

              {fileName && (
                <div className="panel-inset p-3 mb-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="body-sm font-medium">{fileName}</span>
                  <span className="mono text-xs text-gray-400 ml-auto">{rawText.length.toLocaleString()} chars</span>
                </div>
              )}

              <div className="mb-6">
                <textarea
                  className="textarea h-80 font-mono text-sm"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Extracted text will appear here..."
                />
              </div>

              <div className="flex justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" className="btn btn-primary" onClick={() => {
                  const parsed = parseCreditReport(rawText);
                  setEditableFields(fieldsToSimple(parsed));
                  setStep(3);
                }}>
                  Continue to Verify
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Verify Fields */}
          {step === 3 && (
            <div className="fade-in max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="heading-lg mb-2">Verify Account Details</h2>
                <p className="body-md text-gray-600">
                  Accurate dates are critical for violation detection. Hover over labels for guidance.
                </p>
              </div>

              {/* Account Info Section */}
              <div className="panel mb-4">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <p className="heading-sm">Account Information</p>
                </div>
                <div className="p-4 grid sm:grid-cols-2 gap-4">
                  {FIELD_CONFIG.filter(f => f.section === 'account').map(field => (
                    <div key={field.key} className="relative">
                      <label
                        htmlFor={field.key}
                        className="field-label flex items-center gap-1 cursor-help"
                        onMouseEnter={() => setShowHelp(field.key)}
                        onMouseLeave={() => setShowHelp(null)}
                      >
                        {field.label}
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </label>
                      {showHelp === field.key && field.help && (
                        <div className="absolute z-10 left-0 top-full mt-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg max-w-xs">
                          {field.help}
                        </div>
                      )}
                      {field.key === 'accountType' ? (
                        <select
                          id={field.key}
                          className="input"
                          value={(editableFields as Record<string, string>)[field.key] || ''}
                          onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                        >
                          <option value="">Select type...</option>
                          {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : field.key === 'accountStatus' ? (
                        <select
                          id={field.key}
                          className="input"
                          value={(editableFields as Record<string, string>)[field.key] || ''}
                          onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                        >
                          <option value="">Select status...</option>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <input
                          id={field.key}
                          type="text"
                          className="input"
                          value={(editableFields as Record<string, string>)[field.key] || ''}
                          onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Amounts Section */}
              <div className="panel mb-4">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <p className="heading-sm">Financial Amounts</p>
                </div>
                <div className="p-4 grid sm:grid-cols-3 gap-4">
                  {FIELD_CONFIG.filter(f => f.section === 'amounts').map(field => (
                    <div key={field.key} className="relative">
                      <label
                        htmlFor={field.key}
                        className="field-label flex items-center gap-1 cursor-help"
                        onMouseEnter={() => setShowHelp(field.key)}
                        onMouseLeave={() => setShowHelp(null)}
                      >
                        {field.label}
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </label>
                      {showHelp === field.key && field.help && (
                        <div className="absolute z-10 left-0 top-full mt-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg max-w-xs">
                          {field.help}
                        </div>
                      )}
                      <input
                        id={field.key}
                        type="text"
                        className="input font-mono"
                        value={(editableFields as Record<string, string>)[field.key] || ''}
                        onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder="$0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates Section */}
              <div className="panel mb-4">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <p className="heading-sm">Critical Dates</p>
                  <p className="body-sm text-gray-500 mt-0.5">These dates determine violations. Enter as YYYY-MM-DD.</p>
                </div>
                <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FIELD_CONFIG.filter(f => f.section === 'dates').map(field => (
                    <div key={field.key} className="relative">
                      <label
                        htmlFor={field.key}
                        className="field-label flex items-center gap-1 cursor-help"
                        onMouseEnter={() => setShowHelp(field.key)}
                        onMouseLeave={() => setShowHelp(null)}
                      >
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </label>
                      {showHelp === field.key && field.help && (
                        <div className="absolute z-10 left-0 top-full mt-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg max-w-xs">
                          {field.help}
                        </div>
                      )}
                      <input
                        id={field.key}
                        type="text"
                        className={`input font-mono ${field.required && !editableFields[field.key as keyof CreditFields] ? 'border-amber-300 bg-amber-50/50' : ''}`}
                        value={(editableFields as Record<string, string>)[field.key] || ''}
                        onChange={(e) => setEditableFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Consumer Info */}
              <div className="panel mb-6">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <p className="heading-sm">Your Information</p>
                  <p className="body-sm text-gray-500 mt-0.5">Optional. Used for personalized dispute letters.</p>
                </div>
                <div className="p-4 grid sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="consumer-name" className="field-label">Full Name</label>
                    <input
                      id="consumer-name"
                      type="text"
                      className="input"
                      value={consumer.name || ''}
                      onChange={(e) => setConsumer(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="consumer-address" className="field-label">Address</label>
                    <input
                      id="consumer-address"
                      type="text"
                      className="input"
                      value={consumer.address || ''}
                      onChange={(e) => setConsumer(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="consumer-state" className="field-label">State</label>
                    <select
                      id="consumer-state"
                      className="input"
                      value={consumer.state || ''}
                      onChange={(e) => {
                        setConsumer(prev => ({ ...prev, state: e.target.value }));
                        setEditableFields(prev => ({ ...prev, stateCode: e.target.value }));
                      }}
                    >
                      <option value="">Select...</option>
                      {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button type="button" className="btn btn-primary" onClick={runAnalysis}>
                  Run Analysis
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Analysis Results */}
          {step === 4 && riskProfile && (
            <div className="fade-in">
              {/* Summary Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <h2 className="heading-lg mb-1">Analysis Results</h2>
                  <p className="body-md text-gray-600">
                    {flags.length} {flags.length === 1 ? 'violation' : 'violations'} detected
                  </p>
                </div>
                <div className="flex gap-2 no-print">
                  <button type="button" onClick={() => window.print()} className="btn btn-ghost text-sm">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                </div>
              </div>

              {/* Score Dashboard */}
              <div className="grid lg:grid-cols-3 gap-4 mb-6">
                {/* Main Score */}
                <div className="panel-elevated p-6 lg:col-span-1">
                  <p className="label text-gray-500 mb-3">Case Strength</p>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-5xl font-light tracking-tight">{riskProfile.overallScore}</span>
                    <span className="text-gray-400 mb-2">/100</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">Risk Level</span>
                      <span className="font-medium uppercase text-xs tracking-wider">{riskProfile.riskLevel}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">Dispute Strength</span>
                      <span className="font-medium uppercase text-xs tracking-wider">{riskProfile.disputeStrength}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500">Litigation Potential</span>
                      <span className="font-medium">{riskProfile.litigationPotential ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* Issue Breakdown */}
                <div className="panel p-6 lg:col-span-1">
                  <p className="label text-gray-500 mb-4">Issues by Severity</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="flex-1 text-sm">High Severity</span>
                      <span className="heading-md">{issuesByPriority.high.length}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="flex-1 text-sm">Medium</span>
                      <span className="heading-md">{issuesByPriority.medium.length}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gray-300" />
                      <span className="flex-1 text-sm">Low</span>
                      <span className="heading-md">{issuesByPriority.low.length}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                {analytics && (
                  <div className="panel p-6 lg:col-span-1">
                    <p className="label text-gray-500 mb-4">Forensic Metrics</p>
                    <div className="space-y-2">
                      {Object.entries(analytics.metrics).map(([key, { value, status }]) => (
                        <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                          <span className="text-sm text-gray-600">{key}</span>
                          <span className={`font-mono text-sm ${
                            status === 'critical' ? 'text-red-600' :
                            status === 'warning' ? 'text-amber-600' : 'text-gray-900'
                          }`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6 no-print">
                <div className="flex gap-6 overflow-x-auto">
                  {(['violations', 'patterns', 'timeline', 'breakdown', 'actions'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab
                          ? 'border-gray-900 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'violations' && `Violations (${flags.length})`}
                      {tab === 'patterns' && `Patterns (${analytics?.patterns.length || 0})`}
                      {tab === 'timeline' && 'Timeline'}
                      {tab === 'breakdown' && 'Score Breakdown'}
                      {tab === 'actions' && 'Action Items'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="mb-8">
                {/* Violations Tab */}
                {activeTab === 'violations' && (
                  <div className="space-y-3">
                    {flags.length > 0 ? flags.map((flag, i) => (
                      <div
                        key={i}
                        className={`issue-card issue-card-${flag.severity} cursor-pointer`}
                        onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`issue-badge issue-badge-${flag.severity}`}>{flag.severity}</span>
                              <span className="mono text-xs text-gray-400">{flag.ruleId}</span>
                            </div>
                            <h4 className="heading-md mb-1">{flag.ruleName}</h4>
                            <p className="body-sm text-gray-600 line-clamp-2">{flag.explanation}</p>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedCard === i ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        {expandedCard === i && (
                          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                            <div>
                              <p className="label text-xs mb-1">Why This Matters</p>
                              <p className="body-sm">{flag.whyItMatters}</p>
                            </div>
                            {flag.suggestedEvidence.length > 0 && (
                              <div>
                                <p className="label text-xs mb-1">Suggested Evidence</p>
                                <ul className="body-sm list-disc list-inside text-gray-600">
                                  {flag.suggestedEvidence.map((e, j) => <li key={j}>{e}</li>)}
                                </ul>
                              </div>
                            )}
                            {flag.legalCitations.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {flag.legalCitations.map((cite, j) => (
                                  <span key={j} className="mono text-xs px-2 py-1 bg-gray-100 rounded">{cite}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="panel-inset p-12 text-center">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="heading-md mb-1">No Obvious Violations</h3>
                        <p className="body-sm text-gray-500">Manual review by a professional is still recommended.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Patterns Tab */}
                {activeTab === 'patterns' && analytics && (
                  <div className="space-y-3">
                    {analytics.patterns.length > 0 ? analytics.patterns.map((pattern, i) => (
                      <div key={i} className={`panel p-4 border-l-4 ${
                        pattern.significance === 'high' ? 'border-l-red-500' :
                        pattern.significance === 'medium' ? 'border-l-amber-500' : 'border-l-gray-300'
                      }`}>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h4 className="heading-sm">{pattern.pattern}</h4>
                          <span className={`text-xs uppercase tracking-wider font-medium ${
                            pattern.significance === 'high' ? 'text-red-600' :
                            pattern.significance === 'medium' ? 'text-amber-600' : 'text-gray-500'
                          }`}>
                            {pattern.significance}
                          </span>
                        </div>
                        <p className="body-sm text-gray-600 mb-3">{pattern.description}</p>
                        <p className="body-sm">
                          <span className="font-medium">Recommendation:</span> {pattern.recommendation}
                        </p>
                      </div>
                    )) : (
                      <div className="panel-inset p-8 text-center">
                        <p className="body-sm text-gray-500">No significant patterns detected.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && analytics && (
                  <div className="panel p-6">
                    {analytics.timeline.length > 0 ? (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                        <div className="space-y-6">
                          {analytics.timeline.map((event, i) => (
                            <div key={i} className="relative pl-10">
                              <div className={`absolute left-2 w-5 h-5 rounded-full border-2 bg-white ${
                                event.flagged ? 'border-red-500' :
                                event.type === 'violation' ? 'border-red-500' :
                                event.type === 'delinquency' ? 'border-amber-500' :
                                event.type === 'chargeoff' ? 'border-orange-500' : 'border-gray-300'
                              }`} />
                              <div>
                                <p className="mono text-xs text-gray-400 mb-1">{formatDate(event.date)}</p>
                                <p className="heading-sm">{event.label}</p>
                                <p className="body-sm text-gray-600">{event.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="body-sm text-gray-500">No timeline events to display.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Score Breakdown Tab */}
                {activeTab === 'breakdown' && analytics && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {analytics.breakdown.map((cat, i) => (
                      <div key={i} className="panel p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="heading-sm">{cat.category}</h4>
                          <span className="heading-md">{cat.score}/{cat.maxScore}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full transition-all ${
                              cat.score / cat.maxScore >= 0.8 ? 'bg-green-500' :
                              cat.score / cat.maxScore >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                          />
                        </div>
                        <ul className="space-y-1">
                          {cat.factors.map((f, j) => (
                            <li key={j} className="body-sm text-gray-600 flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-gray-400" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions Tab */}
                {activeTab === 'actions' && analytics && (
                  <div className="space-y-4">
                    {['immediate', 'standard', 'optional'].map(priority => {
                      const items = analytics.actions.filter(a => a.priority === priority);
                      if (items.length === 0) return null;
                      return (
                        <div key={priority}>
                          <h4 className="label uppercase text-xs tracking-wider mb-2">
                            {priority === 'immediate' ? '🔴 Immediate Action' :
                             priority === 'standard' ? '🟡 Standard' : '⚪ Optional'}
                          </h4>
                          <div className="space-y-2">
                            {items.map((item, i) => (
                              <div key={i} className="panel p-4">
                                <p className="heading-sm mb-1">{item.action}</p>
                                <p className="body-sm text-gray-600">{item.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recommendation */}
              <div className="notice mb-6">
                <p className="heading-sm mb-1">Recommended Approach</p>
                <p className="body-sm">{riskProfile.recommendedApproach}</p>
              </div>

              <div className="flex justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(3)}>Back</button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(5)}>
                  Generate Documents
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Documents */}
          {step === 5 && (
            <div className="fade-in max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="heading-xl mb-3">Download Documents</h2>
                <p className="body-lg text-gray-600">
                  Generate legally-compliant dispute letters based on your analysis.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                <button type="button" className="doc-card group" onClick={() => downloadDocument('bureau')}>
                  <div className="doc-icon group-hover:bg-gray-900 group-hover:text-white transition-colors">B</div>
                  <div className="flex-1 text-left">
                    <h3 className="heading-md mb-0.5">Bureau Dispute Letter</h3>
                    <p className="body-sm text-gray-500">For Experian, Equifax, TransUnion</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>

                <button type="button" className="doc-card group" onClick={() => downloadDocument('validation')}>
                  <div className="doc-icon group-hover:bg-gray-900 group-hover:text-white transition-colors">V</div>
                  <div className="flex-1 text-left">
                    <h3 className="heading-md mb-0.5">Debt Validation Request</h3>
                    <p className="body-sm text-gray-500">FDCPA §809(b) compliant</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>

                <button type="button" className="doc-card group" onClick={() => downloadDocument('cfpb')}>
                  <div className="doc-icon group-hover:bg-gray-900 group-hover:text-white transition-colors">C</div>
                  <div className="flex-1 text-left">
                    <h3 className="heading-md mb-0.5">CFPB Complaint</h3>
                    <p className="body-sm text-gray-500">Ready for submission</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>

                <button type="button" className="doc-card group" onClick={() => downloadDocument('summary')}>
                  <div className="doc-icon group-hover:bg-gray-900 group-hover:text-white transition-colors">S</div>
                  <div className="flex-1 text-left">
                    <h3 className="heading-md mb-0.5">Case Summary</h3>
                    <p className="body-sm text-gray-500">Complete forensic report</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>

              <div className="notice max-w-xl mx-auto mb-10">
                <p className="body-sm">
                  <span className="font-medium">Disclaimer:</span> These documents are templates for educational purposes.
                  Consult with a qualified attorney before taking legal action.
                </p>
              </div>

              <div className="flex justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(4)}>Back</button>
                <button type="button" className="btn btn-primary" onClick={reset}>
                  Start New Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50/50 no-print">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
            <p className="mono text-xs">Credit Report Analyzer v4.0</p>
            <p>100% client-side · Your data stays on your device</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
