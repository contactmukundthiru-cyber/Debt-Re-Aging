'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { parseCreditReport, fieldsToSimple } from '../lib/parser';
import { runRules, calculateRiskProfile, CreditFields, RuleFlag, RiskProfile } from '../lib/rules';
import { generateBureauLetter, generateValidationLetter, generateCaseSummary, generateCFPBNarrative, ConsumerInfo, generatePDFLetter, generateForensicReport } from '../lib/generator';
import { performOCR, isImage } from '../lib/ocr';
import { isPDF, extractPDFText } from '../lib/pdf';
import { compareReports, DeltaResult } from '../lib/delta';
import { getRelevantCaseLaw, CaseLaw } from '../lib/caselaw';
import { generateStateGuidance, getStateLaws } from '../lib/state-laws';
import {
  buildTimeline,
  calculateScoreBreakdown,
  detectPatterns,
  generateActionItems,
  calculateForensicMetrics,
  generateExecutiveSummary,
  ForensicSummary,
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

// Revolutionary feature imports
import {
  generateDisputeLetter,
  generateValidationLetter as generateAdvancedValidationLetter,
  generateCeaseDesistLetter,
  generateIntentToSueLetter,
  getLetterRecommendations,
  DisputeLetterConfig
} from '../lib/disputes';
import {
  buildCFPBComplaint,
  generateCFPBNarrative as generateAdvancedCFPBNarrative,
  formatForCFPBSubmission,
  estimateComplaintStrength,
  CFPBComplaint
} from '../lib/cfpb-complaint';
import {
  buildEvidencePackage,
  calculateDamages,
  formatEvidencePackage,
  DamageEstimate
} from '../lib/evidence-builder';
import {
  estimateScoreImpact,
  getScoreCategory,
  calculateCategoryJump,
  estimateFinancialImpact,
  simulateActions,
  ScoreImpactEstimate
} from '../lib/score-impact';
import {
  BureauReport,
  compareAccounts,
  generateBureauSummary,
  formatComparisonReport,
  exportComparisonCSV,
  ComparisonResult
} from '../lib/bureau-compare';
import {
  calculateRemovalDate,
  calculateSOLExpiration,
  calculateCountdowns,
  buildDeadlineTracker,
  generateCalendarEvents,
  CountdownResult,
  DeadlineTracker
} from '../lib/countdown';
import {
  t,
  translate,
  setLanguage,
  getLanguage,
  formatDate as i18nFormatDate,
  formatCurrency,
  Language
} from '../lib/i18n';
import {
  findCollector,
  getCollectorRiskSummary,
  formatCollectorReport,
  searchCollectors,
  CollectorProfile,
  CollectorMatch
} from '../lib/collector-database';
import {
  buildAttorneyPackage,
  formatAttorneyPackage,
  AttorneyPackage
} from '../lib/attorney-export';
import {
  findRelevantPrecedents,
  searchPrecedents,
  generateCaseLawSection,
  calculateAverageDamages,
  LegalPrecedent
} from '../lib/legal-precedents';
import {
  validateMetro2,
  formatMetro2Report,
  getMetro2FieldReference,
  Metro2ValidationResult
} from '../lib/metro2-validator';
import {
  loadDisputes,
  createDispute,
  updateDisputeStatus,
  addCommunication,
  setDisputeOutcome,
  getDisputeStats,
  getUrgentDisputes,
  getDispute,
  deleteDispute,
  exportDisputesCSV,
  generateDisputeReport,
  Dispute,
  DisputeStatus
} from '../lib/dispute-tracker';

// Letter type for the export section
type LetterType = 'bureau' | 'furnisher' | 'validation' | 'cease_desist' | 'intent_to_sue';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

// Multi-account analysis interface
interface AnalyzedAccount {
  id: string;
  rawText: string;
  fields: CreditFields;
  flags: RuleFlag[];
  risk: RiskProfile;
}

// Parse multiple accounts from a credit report
function parseMultipleAccounts(text: string): { id: string; rawText: string; fields: CreditFields }[] {
  const accountSections = text.split(/(?=Account\s+(?:Information|#|Number):|TRADELINE|Account\s+Name:)/i);

  return accountSections
    .filter(section => section.trim().length > 50)
    .map((section, index) => {
      const parsed = parseCreditReport(section);
      return {
        id: `account-${index}`,
        rawText: section,
        fields: fieldsToSimple(parsed)
      };
    });
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

const STEPS = [
  { id: 1, name: 'Input', desc: 'Upload Report' },
  { id: 2, name: 'Extract', desc: 'Review Text' },
  { id: 3, name: 'Verify', desc: 'Confirm Data' },
  { id: 4, name: 'Analyze', desc: 'View Results' },
  { id: 5, name: 'Export', desc: 'Get Documents' },
  { id: 6, name: 'Track', desc: 'Dispute Tracker' },
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
  const [analyzedAccounts, setAnalyzedAccounts] = useState<AnalyzedAccount[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<ForensicSummary | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [deltas, setDeltas] = useState<DeltaResult[]>([]);
  const [relevantCaseLaw, setRelevantCaseLaw] = useState<CaseLaw[]>([]);
  const [discoveryAnswers, setDiscoveryAnswers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'violations' | 'patterns' | 'deltas' | 'timeline' | 'breakdown' | 'actions' | 'caselaw' | 'scoreimpact' | 'countdown' | 'collector' | 'metro2' | 'lettereditor' | 'legalshield' | 'discovery' | 'lab'>('violations');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revolutionary feature states
  const [language, setLang] = useState<Language>('en');
  const [scoreImpact, setScoreImpact] = useState<ScoreImpactEstimate | null>(null);
  const [deadlines, setDeadlines] = useState<DeadlineTracker | null>(null);
  const [collectorMatch, setCollectorMatch] = useState<CollectorMatch | null>(null);
  const [metro2Validation, setMetro2Validation] = useState<Metro2ValidationResult | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputeStats, setDisputeStats] = useState<ReturnType<typeof getDisputeStats> | null>(null);
  const [damageEstimate, setDamageEstimate] = useState<DamageEstimate | null>(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedLetterType, setSelectedLetterType] = useState<LetterType>('bureau');
  const [exportTab, setExportTab] = useState<'letters' | 'cfpb' | 'evidence' | 'attorney'>('letters');
  const [darkMode, setDarkMode] = useState(false);
  const [editableLetter, setEditableLetter] = useState<string>('');

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Show toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Utility function for downloading files
  const downloadFile = useCallback((content: string, filename: string, mimeType: string = 'text/plain') => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename}`, 'success');
    } catch (error) {
      console.error('Download failed:', error);
      showToast('Download failed. Please try again.', 'error');
    }
  }, [showToast]);

  // Load history, disputes, and language on mount
  useEffect(() => {
    setHistory(getHistory());
    setDisputes(loadDisputes());
    setDisputeStats(getDisputeStats());
    setLang(getLanguage());
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (step === 4 && flags.length > 0) {
      const generators: Record<LetterType, () => string> = {
        bureau: () => generateBureauLetter(editableFields, flags, consumer),
        validation: () => generateValidationLetter(editableFields, flags, consumer),
        furnisher: () => generateBureauLetter(editableFields, flags, consumer), // Placeholder
        cease_desist: () => generateBureauLetter(editableFields, flags, consumer), // Placeholder
        intent_to_sue: () => generateBureauLetter(editableFields, flags, consumer), // Placeholder
      };
      setEditableLetter(generators[selectedLetterType]());
    }
  }, [selectedLetterType, flags, editableFields, consumer, step]);

  // Handle language change
  const handleLanguageChange = useCallback((newLang: Language) => {
    setLanguage(newLang);
    setLang(newLang);
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
      
      const accounts = parseMultipleAccounts(text);
      if (accounts.length > 1) {
        const analyzed = accounts.map(acc => ({
          id: acc.id,
          rawText: acc.rawText,
          fields: acc.fields,
          flags: runRules(acc.fields),
          risk: calculateRiskProfile(runRules(acc.fields), acc.fields)
        }));
        setAnalyzedAccounts(analyzed);
        setExecutiveSummary(generateExecutiveSummary(analyzed));
        setStep(2); // Step 2 will now show account selection if multiple found
      } else {
        const parsed = parseCreditReport(text);
        setEditableFields(fieldsToSimple(parsed));
        setStep(2);
      }
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
    try {
      // Core analysis
      const detectedFlags = runRules(editableFields);
      setFlags(detectedFlags);
      const profile = calculateRiskProfile(detectedFlags, editableFields);
      setRiskProfile(profile);

      // Fetch relevant case law
      const law = getRelevantCaseLaw(detectedFlags.map(f => f.ruleId));
      setRelevantCaseLaw(law);

      // Revolutionary features computation with individual error handling
      // 1. Score Impact Estimation
      try {
        const currentScore = 620; // Default estimate
        const impact = estimateScoreImpact(editableFields, detectedFlags, currentScore);
        setScoreImpact(impact);
      } catch (e) {
        console.warn('Score impact estimation failed:', e);
      }

      // 2. Deadline Tracking
      try {
        const tracker = buildDeadlineTracker(editableFields);
        setDeadlines(tracker);
      } catch (e) {
        console.warn('Deadline tracking failed:', e);
      }

      // 3. Collector Intelligence
      try {
        const collector = findCollector(editableFields.furnisherOrCollector || '');
        setCollectorMatch(collector);
      } catch (e) {
        console.warn('Collector lookup failed:', e);
      }

      // 4. Metro 2 Validation
      try {
        const metro2Result = validateMetro2(editableFields);
        setMetro2Validation(metro2Result);
      } catch (e) {
        console.warn('Metro 2 validation failed:', e);
      }

      // 5. Damage Estimation
      try {
        const damages = calculateDamages(detectedFlags, editableFields);
        setDamageEstimate(damages);
      } catch (e) {
        console.warn('Damage estimation failed:', e);
      }

      setActiveTab('violations');
      setStep(4);

      // Save to history
      try {
        saveAnalysis(editableFields, detectedFlags, profile, fileName || undefined);
        setHistory(getHistory());
      } catch (e) {
        console.warn('Failed to save to history:', e);
      }

      showToast(`Analysis complete: ${detectedFlags.length} violations found`, detectedFlags.length > 0 ? 'info' : 'success');
    } catch (error) {
      console.error('Analysis failed:', error);
      showToast('Analysis failed. Please check your input data.', 'error');
    }
  }, [editableFields, fileName, consumer.state, showToast]);

  const loadFromHistory = useCallback((record: AnalysisRecord) => {
    if (step === 4 && editableFields.dofd) {
      // If already analyzing, perform delta comparison
      const forensicDeltas = compareReports(record.fields, editableFields);
      setDeltas(forensicDeltas);
      setActiveTab('deltas');
      setShowHistory(false);
      return;
    }
    
    setEditableFields(record.fields);
    setFlags(record.flags);
    setRiskProfile(record.riskProfile);
    setFileName(record.fileName || null);
    setShowHistory(false);
    setActiveTab('violations');
    setStep(4);
  }, [step, editableFields]);

  const removeFromHistory = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAnalysis(id);
    setHistory(getHistory());
  }, []);

  const downloadDocument = useCallback((type: 'bureau' | 'validation' | 'cfpb' | 'summary', format: 'pdf' | 'txt' = 'pdf') => {
    const generators: Record<string, () => { content: string; filename: string; mimeType: string }> = {
      bureau: () => ({
        content: generateBureauLetter(editableFields, flags, consumer),
        filename: `dispute_letter_bureau.${format === 'pdf' ? 'pdf' : 'txt'}`,
        mimeType: format === 'pdf' ? 'application/pdf' : 'text/plain'
      }),
      validation: () => ({
        content: generateValidationLetter(editableFields, flags, consumer),
        filename: `debt_validation_request.${format === 'pdf' ? 'pdf' : 'txt'}`,
        mimeType: format === 'pdf' ? 'application/pdf' : 'text/plain'
      }),
      cfpb: () => ({
        content: generateCFPBNarrative(editableFields, flags, discoveryAnswers),
        filename: `cfpb_complaint_narrative.${format === 'pdf' ? 'pdf' : 'txt'}`,
        mimeType: format === 'pdf' ? 'application/pdf' : 'text/plain'
      }),
      summary: () => ({
        content: generateCaseSummary(editableFields, flags, riskProfile!),
        filename: `case_analysis_summary.${format === 'pdf' ? 'pdf' : 'txt'}`,
        mimeType: format === 'pdf' ? 'application/pdf' : 'text/markdown'
      }),
    };

    const { content, filename } = generators[type]();
    
    if (format === 'pdf') {
      generatePDFLetter(content, filename);
    } else {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [editableFields, flags, consumer, riskProfile]);

  const reset = useCallback(() => {
    setStep(1);
    setRawText('');
    setEditableFields({});
    setFlags([]);
    setRiskProfile(null);
    setConsumer({});
    setFileName(null);
    setAnalyzedAccounts([]);
    setSelectedAccountId(null);
    setActiveTab('violations');
    setExpandedCard(null);
  }, []);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'dark bg-white' : 'bg-white'}`}>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg transition-all duration-300 animate-slide-in flex items-center gap-3 ${
            toast.type === 'error' ? 'bg-red-600 text-white' :
            toast.type === 'success' ? 'bg-green-600 text-white' :
            'bg-gray-900 text-white'
          }`}
          role="alert"
          aria-live="polite"
        >
          {toast.type === 'error' && (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.type === 'success' && (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.type === 'info' && (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-80"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50 transition-colors">
        <div className="container py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="label text-gray-500">Forensic Credit Analysis</p>
              <h1 className="heading-lg tracking-tight">Credit Report Analyzer</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-print"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              {/* Language Switcher */}
              <div className="flex items-center gap-1 no-print">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    language === 'en' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('es')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    language === 'es' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ES
                </button>
              </div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={reset}
                  className="btn btn-ghost text-sm no-print"
                >
                  {translate('actions.newAnalysis')}
                </button>
              )}
              <div className="text-right hidden sm:block">
                <p className="mono text-xs text-gray-400">v5.0</p>
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
      <main id="main-content" className="flex-1 py-8 sm:py-12" role="main" aria-label="Credit Report Analysis">
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
                      aria-label="Upload credit report file"
                      title="Upload credit report file"
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
            <div className="fade-in max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="heading-lg mb-2">
                  {analyzedAccounts.length > 1 ? 'Select Accounts to Analyze' : 'Review Extracted Text'}
                </h2>
                <p className="body-md text-gray-600">
                  {analyzedAccounts.length > 1 
                    ? `We found ${analyzedAccounts.length} accounts in your report. Select one to proceed with forensic analysis.`
                    : 'Verify the text was extracted correctly. Edit if needed.'}
                </p>
              </div>

              {analyzedAccounts.length > 1 && executiveSummary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="panel p-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                    <p className="label text-gray-400 dark:text-gray-500 mb-1">Total Found</p>
                    <p className="text-3xl font-bold">{executiveSummary.totalAccounts}</p>
                    <p className="text-[10px] mt-1 text-gray-500">Accounts segmented</p>
                  </div>
                  <div className="panel p-4 border-red-100 bg-red-50/30 dark:bg-red-900/10">
                    <p className="label text-red-500 mb-1">Violations</p>
                    <p className="text-3xl font-bold text-red-600">{executiveSummary.totalViolations}</p>
                    <p className="text-[10px] mt-1 text-red-400">Potential FCRA counts</p>
                  </div>
                  <div className="panel p-4 border-amber-100 bg-amber-50/30 dark:bg-amber-900/10">
                    <p className="label text-amber-500 mb-1">Critical</p>
                    <p className="text-3xl font-bold text-amber-600">{executiveSummary.criticalAccounts}</p>
                    <p className="text-[10px] mt-1 text-amber-400">High-risk tradelines</p>
                  </div>
                  <div className="panel p-4 border-green-100 bg-green-50/30 dark:bg-green-900/10">
                    <p className="label text-green-500 mb-1">Est. Damages</p>
                    <p className="text-2xl font-bold text-green-600">${executiveSummary.totalEstimatedDamages.toLocaleString()}</p>
                    <p className="text-[10px] mt-1 text-green-400">Liability projection</p>
                  </div>
                  
                  {/* Forensic Readiness Card */}
                  {(() => {
                    const totalPossible = Array.from(new Set(flags.flatMap(f => f.suggestedEvidence))).length;
                    const checkedCount = Object.keys(discoveryAnswers).filter(k => k.startsWith('ev-') && discoveryAnswers[k] === 'checked').length;
                    const readiness = totalPossible > 0 ? Math.round((checkedCount / totalPossible) * 100) : 0;
                    
                    return (
                      <div className="panel p-4 border-blue-100 bg-blue-50/30 dark:bg-blue-900/10">
                        <p className="label text-blue-500 mb-1">Discovery Progress</p>
                        <p className="text-2xl font-bold text-blue-600">{readiness}%</p>
                        <p className="text-[10px] mt-1 text-blue-400">Evidence verified</p>
                      </div>
                    );
                  })()}

                  {executiveSummary.discrepancies.length > 0 && (
                    <div className="md:col-span-4 panel p-4 border-amber-200 bg-amber-50/50 dark:bg-amber-900/20">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h4 className="heading-sm text-amber-900 dark:text-amber-200">Material Discrepancies Detected</h4>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {executiveSummary.discrepancies.map((d, i) => (
                          <div key={i} className="bg-white/50 dark:bg-black/20 p-3 rounded border border-amber-100 dark:border-amber-800/30">
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-tighter mb-1">{d.field}</p>
                            <p className="body-sm text-amber-700 dark:text-amber-400 mb-2">{d.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {d.values.map((v, j) => (
                                <span key={j} className="mono text-[10px] bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-200">{v}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {analyzedAccounts.length > 1 ? (
                <div className="grid gap-4 mb-8">
                  {analyzedAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setEditableFields(acc.fields);
                        setRawText(acc.rawText);
                        setStep(3);
                      }}
                      className="panel p-4 text-left hover:border-gray-900 transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="heading-md mb-1">
                            {acc.fields.furnisherOrCollector || acc.fields.originalCreditor || 'Unknown Account'}
                          </p>
                          <div className="flex gap-3 text-xs text-gray-500">
                            <span>Balance: ${acc.fields.currentBalance || '0.00'}</span>
                            <span>Type: {acc.fields.accountType || 'N/A'}</span>
                            <span className={`font-medium ${acc.flags.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {acc.flags.length} potential violations
                            </span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <>
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
                </>
              )}

              <div className="flex justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                {analyzedAccounts.length <= 1 && (
                  <button type="button" className="btn btn-primary" onClick={() => {
                    const parsed = parseCreditReport(rawText);
                    setEditableFields(fieldsToSimple(parsed));
                    setStep(3);
                  }}>
                    Continue to Verify
                  </button>
                )}
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
              {/* Evidence Readiness Header */}
              {(() => {
                const totalPossible = Array.from(new Set(flags.flatMap(f => f.suggestedEvidence))).length;
                const checkedCount = Object.keys(discoveryAnswers).filter(k => k.startsWith('ev-') && discoveryAnswers[k] === 'checked').length;
                const readiness = totalPossible > 0 ? Math.round((checkedCount / totalPossible) * 100) : 0;
                
                return (
                  <div className="mb-6 p-4 panel border-l-4 border-l-gray-900 dark:border-l-white bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
                    <div>
                      <h3 className="heading-sm text-[10px] mb-1">Litigation Evidence Readiness</h3>
                      <div className="flex items-center gap-3">
                        <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-900 dark:bg-white transition-all duration-1000" style={{ width: `${readiness}%` }} />
                        </div>
                        <span className="mono text-xs font-bold">{readiness}%</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('discovery')}
                      className="btn btn-ghost text-[10px] uppercase tracking-widest py-1 px-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-white dark:hover:bg-gray-800"
                    >
                      Audit Evidence
                    </button>
                  </div>
                );
              })()}

              {/* Summary Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <h2 className="heading-lg mb-1">Analysis Results</h2>
                  <p className="body-md text-gray-600">
                    {flags.length} {flags.length === 1 ? 'violation' : 'violations'} detected
                  </p>
                </div>
                <div className="flex gap-2 no-print">
                  <button
                    type="button"
                    onClick={() => generateForensicReport(editableFields, flags, riskProfile, relevantCaseLaw, consumer, discoveryAnswers)}
                    className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform transition-transform hover:scale-105"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Forensic Investigation Report (PDF)
                  </button>
                  <button type="button" onClick={() => window.print()} className="btn btn-secondary shadow-sm">
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
                <div className="flex gap-4 overflow-x-auto pb-px">
                  {(['violations', 'patterns', 'scoreimpact', 'countdown', 'collector', 'metro2', 'deltas', 'timeline', 'caselaw', 'breakdown', 'lettereditor', 'legalshield', 'discovery', 'lab', 'actions'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab
                          ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'violations' && `${translate('analysis.violations')} (${flags.length})`}
                      {tab === 'patterns' && `${translate('analysis.patterns')} (${analytics?.patterns.length || 0})`}
                      {tab === 'scoreimpact' && `Score Impact`}
                      {tab === 'countdown' && `Deadlines`}
                      {tab === 'collector' && `Collector Intel`}
                      {tab === 'metro2' && `Metro 2`}
                      {tab === 'deltas' && `Forensic Diff (${deltas.length})`}
                      {tab === 'timeline' && translate('analysis.timeline')}
                      {tab === 'caselaw' && `${translate('analysis.caseLaw')} (${relevantCaseLaw.length})`}
                      {tab === 'breakdown' && translate('analysis.scoreBreakdown')}
                      {tab === 'lettereditor' && 'Letter Editor'}
                      {tab === 'legalshield' && 'Legal Shield'}
                      {tab === 'discovery' && 'Forensic Discovery'}
                      {tab === 'lab' && 'Forensic Lab'}
                      {tab === 'actions' && translate('analysis.actionItems')}
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
                            
                            {/* Success Probability Meter */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-1000 ${
                                    flag.successProbability > 80 ? 'bg-green-500' :
                                    flag.successProbability > 50 ? 'bg-amber-500' : 'bg-gray-400'
                                  }`}
                                  style={{ width: `${flag.successProbability}%` }}
                                />
                              </div>
                              <span className="mono text-[9px] text-gray-400 font-medium">{flag.successProbability}% Winning Prob.</span>
                            </div>
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
                                  <span key={j} className="mono text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{cite}</span>
                                ))}
                              </div>
                            )}

                            {/* Bureau Specific Tactics */}
                            {flag.bureauTactics && Object.keys(flag.bureauTactics).length > 0 && (
                              <div className="mt-4 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded border border-amber-100 dark:border-amber-800/30">
                                <p className="label text-[9px] text-amber-600 mb-2 uppercase font-bold tracking-widest">Bureau-Specific Strategy</p>
                                <div className="space-y-2">
                                  {Object.entries(flag.bureauTactics).map(([bureau, tactic], j) => (
                                    <div key={j} className="flex gap-2">
                                      <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase w-16 flex-shrink-0">{bureau}:</span>
                                      <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">{tactic}</p>
                                    </div>
                                  ))}
                                </div>
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

                {/* Deltas Tab */}
                {activeTab === 'deltas' && (
                  <div className="space-y-3 fade-in">
                    {deltas.length > 0 ? (
                      <div className="panel p-0 overflow-hidden border-gray-200">
                        <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                          <h4 className="heading-sm">Forensic Delta Analysis</h4>
                          <span className="badge badge-dark">Comparative Evidence</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {deltas.map((delta, i) => (
                            <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                                delta.impact === 'negative' ? 'bg-red-50 text-red-600' :
                                delta.impact === 'positive' ? 'bg-green-50 text-green-600' :
                                'bg-gray-50 text-gray-600'
                              }`}>
                                {delta.impact === 'negative' ? '↓' : delta.impact === 'positive' ? '↑' : '•'}
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                                  <span className="text-sm font-semibold text-gray-900">{delta.field}</span>
                                  <span className="mono text-xs line-through text-gray-400">{delta.oldValue}</span>
                                  <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                  <span className={`text-sm font-bold ${
                                    delta.impact === 'negative' ? 'text-red-600' :
                                    delta.impact === 'positive' ? 'text-green-600' :
                                    'text-gray-900'
                                  }`}>{delta.newValue}</span>
                                </div>
                                <p className="body-sm text-gray-600">{delta.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="panel-inset p-12 text-center">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="heading-md mb-1">No Comparison Active</h3>
                        <p className="body-sm text-gray-500">To use Delta Analysis, open a previous analysis from history while currently viewing a report.</p>
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

                {/* Case Law Tab */}
                {activeTab === 'caselaw' && (
                  <div className="space-y-4 fade-in">
                    {relevantCaseLaw.length > 0 ? relevantCaseLaw.map((law, i) => (
                      <div key={i} className="panel p-5 border-l-4 border-l-gray-900">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="heading-sm font-bold">{law.case}</h4>
                          <span className="mono text-[10px] bg-gray-100 px-2 py-0.5 rounded uppercase">Legal Precedent</span>
                        </div>
                        <p className="mono text-xs text-gray-500 mb-3">{law.citation}</p>
                        <div className="space-y-3">
                          <div>
                            <p className="label text-[10px] text-gray-400 uppercase">Relevance to your case</p>
                            <p className="body-sm text-gray-700">{law.relevance}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded border border-gray-100">
                            <p className="label text-[10px] text-gray-400 uppercase mb-1">Key Ruling</p>
                            <p className="body-sm italic">"{law.ruling}"</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="panel-inset p-12 text-center">
                        <p className="body-sm text-gray-500">No specific case law matches detected for these violations.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Score Breakdown Tab */}
                {activeTab === 'breakdown' && riskProfile && (
                  <div className="fade-in space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {riskProfile.scoreBreakdown.map((cat, i) => (
                        <div key={i} className="panel p-5 border-gray-100 dark:border-gray-800">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="heading-sm text-gray-900 dark:text-white">{cat.category}</h4>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              cat.impact > 50 ? 'bg-red-50 text-red-600' :
                              cat.impact > 20 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'
                            }`}>
                              Impact: {cat.impact}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                            <div
                              className={`h-full transition-all duration-1000 ${
                                cat.impact > 50 ? 'bg-red-500' :
                                cat.impact > 20 ? 'bg-amber-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${cat.impact}%` }}
                            />
                          </div>
                          <p className="body-sm text-gray-500">{cat.description}</p>
                        </div>
                      ))}
                    </div>

                    {/* Overall Risk Gauge */}
                    <div className="panel p-6 bg-gray-50/30 dark:bg-gray-800/10 border-dashed">
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative w-32 h-32 flex-shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              className="text-gray-200 dark:text-gray-800 stroke-current"
                              strokeWidth="8"
                              fill="transparent"
                              r="40"
                              cx="50"
                              cy="50"
                            />
                            <circle
                              className={`stroke-current transition-all duration-1000 ${
                                riskProfile.riskLevel === 'critical' ? 'text-red-600' :
                                riskProfile.riskLevel === 'high' ? 'text-orange-500' :
                                riskProfile.riskLevel === 'medium' ? 'text-amber-500' : 'text-green-500'
                              }`}
                              strokeWidth="8"
                              strokeDasharray={251.2}
                              strokeDashoffset={251.2 - (251.2 * riskProfile.overallScore) / 100}
                              strokeLinecap="round"
                              fill="transparent"
                              r="40"
                              cx="50"
                              cy="50"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-2xl font-bold">{riskProfile.overallScore}</span>
                            <span className="text-[8px] uppercase tracking-widest text-gray-400">Risk Index</span>
                          </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="heading-md mb-2">Dispute Strength: <span className="text-gray-900 dark:text-white underline decoration-2">{riskProfile.disputeStrength.toUpperCase()}</span></h3>
                          <p className="body-sm text-gray-600 dark:text-gray-400 max-w-lg">
                            {riskProfile.recommendedApproach}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legal Shield Tab */}
                {activeTab === 'legalshield' && editableFields.stateCode && (
                  <div className="fade-in space-y-6">
                    {(() => {
                      const guidance = generateStateGuidance(
                        editableFields.stateCode,
                        editableFields.dateLastPayment,
                        editableFields.accountType,
                        editableFields.currentBalance
                      );
                      const stateInfo = getStateLaws(editableFields.stateCode);
                      
                      return (
                        <>
                          <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded flex items-center justify-center heading-lg">
                              {editableFields.stateCode}
                            </div>
                            <div>
                              <h3 className="heading-md">{stateInfo.name} Jurisdictional Protection</h3>
                              <p className="body-sm text-gray-500">State-specific consumer defense mapping</p>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="panel p-5 border-l-4 border-l-blue-500">
                              <h4 className="heading-sm mb-3">Statute of Limitations</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-800">
                                  <span className="body-sm">Status</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    guidance.solStatus === 'expired' ? 'bg-green-100 text-green-700' :
                                    guidance.solStatus === 'expiring' ? 'bg-amber-100 text-amber-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {guidance.solStatus}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-800">
                                  <span className="body-sm">Expiry Date</span>
                                  <span className="mono text-sm">{guidance.solExpiry || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                  <span className="body-sm">Written Contract SOL</span>
                                  <span className="mono text-sm">{stateInfo.sol.writtenContracts} Years</span>
                                </div>
                              </div>
                            </div>

                            <div className="panel p-5 border-l-4 border-l-purple-500">
                              <h4 className="heading-sm mb-3">Interest Rate Caps</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-800">
                                  <span className="body-sm">Judgment Cap</span>
                                  <span className="mono text-sm">{stateInfo.interestCaps.judgments}%</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-800">
                                  <span className="body-sm">Medical Cap</span>
                                  <span className="mono text-sm">{stateInfo.interestCaps.medical}%</span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                  <span className="body-sm">Consumer Cap</span>
                                  <span className="mono text-sm">{stateInfo.interestCaps.consumer}%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="panel p-5">
                            <h4 className="heading-sm mb-4">State-Specific Protections</h4>
                            <div className="grid sm:grid-cols-2 gap-4">
                              {guidance.protections.map((p, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <svg className="w-4 h-4 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="body-sm text-gray-700 dark:text-gray-300">{p}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="panel p-5 bg-amber-50/30 dark:bg-amber-900/10">
                              <h4 className="heading-sm mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Strategic Recommendations
                              </h4>
                              <ul className="space-y-2">
                                {guidance.recommendations.map((r, i) => (
                                  <li key={i} className="body-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="panel p-5">
                              <h4 className="heading-sm mb-4">Legal Resources</h4>
                              <ul className="space-y-2">
                                {guidance.legalResources.map((r, i) => (
                                  <li key={i} className="body-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="panel p-4 border-dashed">
                            <h4 className="heading-sm mb-2">Key Statutes</h4>
                            <div className="flex flex-wrap gap-2">
                              {stateInfo.keyStatutes.map((s, i) => (
                                <span key={i} className="mono text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{s}</span>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Letter Editor Tab */}
                {activeTab === 'lettereditor' && (
                  <div className="fade-in space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(['bureau', 'validation', 'furnisher', 'cease_desist', 'intent_to_sue'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setSelectedLetterType(type)}
                          className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                            selectedLetterType === type 
                              ? 'bg-gray-900 text-white shadow-md transform scale-105' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                        </button>
                      ))}
                    </div>
                    
                    <div className="panel p-0 overflow-hidden border-gray-200 shadow-sm">
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <span className="heading-sm text-[10px]">Interactive Dispute Editor</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => generatePDFLetter(editableLetter, `dispute_${selectedLetterType}.pdf`)}
                            className="text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                          >
                            Download PDF
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="w-full h-[600px] p-8 font-serif text-lg leading-relaxed bg-white dark:bg-gray-900 border-none focus:ring-0 resize-none outline-none"
                        value={editableLetter}
                        onChange={(e) => setEditableLetter(e.target.value)}
                        spellCheck={false}
                      />
                    </div>
                    <p className="body-sm text-gray-500 italic text-center">
                      Tip: You can edit the text above directly before downloading your dispute letter.
                    </p>
                  </div>
                )}

                {/* Discovery Tab */}
                {activeTab === 'discovery' && (
                  <div className="fade-in space-y-6">
                    <div className="panel p-6 bg-blue-50/30 dark:bg-blue-900/10 border-dashed">
                      <h3 className="heading-md mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Forensic Discovery Questionnaire
                      </h3>
                      <p className="body-sm text-gray-600 dark:text-gray-400 mb-6">
                        Answer these targeted questions to uncover hidden violations and strengthen your evidence package.
                      </p>

                      <div className="space-y-8">
                        {flags.filter(f => f.discoveryQuestions && f.discoveryQuestions.length > 0).map((flag, i) => (
                          <div key={i} className="space-y-4">
                            <div className="flex items-center gap-2">
                              <span className="badge badge-dark text-[9px]">{flag.ruleId}</span>
                              <h4 className="heading-sm text-gray-900 dark:text-white">{flag.ruleName}</h4>
                            </div>
                            <div className="grid gap-4">
                              {flag.discoveryQuestions?.map((q, j) => (
                                <div key={j} className="space-y-2">
                                  <label className="body-sm font-medium text-gray-700 dark:text-gray-300">{q}</label>
                                  <textarea
                                    className="textarea h-20 text-sm"
                                    placeholder="Your answer here..."
                                    value={discoveryAnswers[`${flag.ruleId}-${j}`] || ''}
                                    onChange={(e) => setDiscoveryAnswers(prev => ({ ...prev, [`${flag.ruleId}-${j}`]: e.target.value }))}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="panel p-6">
                      <h3 className="heading-md mb-4">Evidence Checklist</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {Array.from(new Set(flags.flatMap(f => f.suggestedEvidence))).map((evidence, i) => (
                          <label key={i} className="flex items-start gap-3 p-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
                            <input
                              type="checkbox"
                              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={discoveryAnswers[`ev-${i}`] === 'checked'}
                              onChange={(e) => setDiscoveryAnswers(prev => ({ ...prev, [`ev-${i}`]: e.target.checked ? 'checked' : '' }))}
                            />
                            <span className="body-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                              {evidence}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Forensic Lab Tab */}
                {activeTab === 'lab' && (
                  <div className="fade-in space-y-6">
                    <div className="panel p-6 bg-gray-900 text-white border-none shadow-2xl">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h3 className="text-2xl font-serif mb-1 italic text-blue-400">The Forensic Lab</h3>
                          <p className="text-xs text-gray-400 uppercase tracking-widest">Advanced Legal Analysis & Statutory Mapping</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 mb-1">Citations Tracked</p>
                          <p className="text-2xl font-bold">{Array.from(new Set(flags.flatMap(f => f.legalCitations))).length}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <h4 className="heading-sm text-blue-300 border-b border-gray-800 pb-2">Statutory Basis</h4>
                          <div className="space-y-4">
                            {Array.from(new Set(flags.flatMap(f => f.legalCitations))).map((cite, i) => (
                              <div key={i} className="flex gap-4">
                                <span className="mono text-xs text-blue-500 bg-blue-900/30 px-2 py-1 h-fit rounded">{cite}</span>
                                <div className="flex-1">
                                  <p className="body-sm text-gray-300">
                                    {cite === 'FCRA_605_a' && '15 U.S.C. § 1681c(a) - Prohibits reporting of obsolete information (7-year rule).'}
                                    {cite === 'FCRA_623_a1' && '15 U.S.C. § 1681s-2(a)(1) - Prohibits furnishers from reporting inaccurate information.'}
                                    {cite === 'FCRA_611' && '15 U.S.C. § 1681i - Procedure in case of disputed accuracy.'}
                                    {cite === 'FDCPA_807' && '15 U.S.C. § 1692e - Prohibits false or misleading representations by collectors.'}
                                    {cite === 'METRO2_GUIDE' && 'Industry standard for data integrity and accurate status reporting.'}
                                    {!['FCRA_605_a', 'FCRA_623_a1', 'FCRA_611', 'FDCPA_807', 'METRO2_GUIDE'].includes(cite) && 'Federal or state consumer protection statute governing reporting accuracy.'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h4 className="heading-sm text-blue-300 border-b border-gray-800 pb-2">Evidence Synthesis</h4>
                          <div className="space-y-4">
                            {flags.filter(f => f.severity === 'high').map((flag, i) => (
                              <div key={i} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500" />
                                  <p className="text-xs font-bold text-gray-200 uppercase tracking-tight">{flag.ruleName}</p>
                                </div>
                                <p className="text-[11px] text-gray-400 leading-relaxed italic">
                                  "The reporter's use of {Object.keys(flag.fieldValues).join(', ')} directly contradicts the {flag.legalCitations[0]} mandate for maximum possible accuracy. This discrepancy constitutes a material breach of reporting standards."
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-800">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-gray-500 italic">Work Product: Authorized for Legal Professional Review Only</p>
                          <button 
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded transition-all shadow-lg shadow-blue-900/20"
                            onClick={() => {
                              const blob = new Blob([JSON.stringify({ fields: editableFields, flags, consumer, discoveryAnswers }, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `case_brief_${Date.now()}.json`;
                              a.click();
                            }}
                          >
                            Export Attorney JSON Brief
                          </button>
                        </div>
                      </div>
                    </div>
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

                {/* Score Impact Tab */}
                {activeTab === 'scoreimpact' && scoreImpact && (
                  <div className="fade-in space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Current vs Potential Score */}
                      <div className="panel-elevated p-6">
                        <p className="label text-gray-500 mb-2">Score Impact</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-light text-green-600">+{scoreImpact.improvement.max}</span>
                          <span className="text-gray-400">points</span>
                        </div>
                        <p className="body-sm text-gray-500 mt-2">
                          If violations are removed
                        </p>
                      </div>

                      {/* Category Jump */}
                      <div className="panel p-6">
                        <p className="label text-gray-500 mb-2">Category Change</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            getScoreCategory(scoreImpact.currentEstimatedRange.high).category === 'poor' ? 'bg-red-100 text-red-700' :
                            getScoreCategory(scoreImpact.currentEstimatedRange.high).category === 'fair' ? 'bg-orange-100 text-orange-700' :
                            getScoreCategory(scoreImpact.currentEstimatedRange.high).category === 'good' ? 'bg-yellow-100 text-yellow-700' :
                            getScoreCategory(scoreImpact.currentEstimatedRange.high).category === 'very_good' ? 'bg-green-100 text-green-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {getScoreCategory(scoreImpact.currentEstimatedRange.high).description.split(' - ')[0]}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span className={`px-2 py-1 text-xs rounded ${
                            getScoreCategory(scoreImpact.potentialRange.high).category === 'poor' ? 'bg-red-100 text-red-700' :
                            getScoreCategory(scoreImpact.potentialRange.high).category === 'fair' ? 'bg-orange-100 text-orange-700' :
                            getScoreCategory(scoreImpact.potentialRange.high).category === 'good' ? 'bg-yellow-100 text-yellow-700' :
                            getScoreCategory(scoreImpact.potentialRange.high).category === 'very_good' ? 'bg-green-100 text-green-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {getScoreCategory(scoreImpact.potentialRange.high).description.split(' - ')[0]}
                          </span>
                        </div>
                      </div>

                      {/* Confidence */}
                      <div className="panel p-6">
                        <p className="label text-gray-500 mb-2">Confidence</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-light">{scoreImpact.confidence === 'high' ? 90 : scoreImpact.confidence === 'medium' ? 70 : 50}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-gray-900 transition-all"
                            style={{ width: `${scoreImpact.confidence === 'high' ? 90 : scoreImpact.confidence === 'medium' ? 70 : 50}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Forensic Score Simulator */}
                    <div className="panel p-6 bg-blue-50/30 dark:bg-blue-900/10 border-dashed">
                      <h4 className="heading-sm mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Forensic Score Simulator
                      </h4>
                      <div className="space-y-3">
                        {[
                          'Delete Entire Collection Tradeline',
                          'Correct Date of First Delinquency (DOFD)',
                          'Remove Recent Late Payment Marker',
                          'Update Status to "Paid in Full"'
                        ].map((action, i) => {
                          const simulation = simulateActions(scoreImpact, [action])[0];
                          return (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 rounded border border-blue-100 dark:border-blue-900/30 shadow-sm">
                              <div>
                                <p className="text-xs font-semibold text-gray-900 dark:text-white">{action}</p>
                                <p className="text-[10px] text-gray-500">Predicted Range: {simulation.newRange.low} - {simulation.newRange.high}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-green-600 font-bold text-xs">+{simulation.pointsGain} pts</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-4 text-center italic">
                        Predictions are based on algorithmic modeling of FICO weight distribution.
                      </p>
                    </div>

                    {/* Factor Breakdown */}
                    <div className="panel p-6">
                      <h4 className="heading-sm mb-4">Factor Analysis</h4>
                      <div className="space-y-4">
                        {scoreImpact.factors.map((factor, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="flex-1">
                              <p className="body-sm font-medium">{factor.factor}</p>
                              <p className="text-xs text-gray-500">{factor.explanation}</p>
                            </div>
                            <div className={`text-right ${
                              factor.potentialImprovement > 0 ? 'text-green-600' : factor.potentialImprovement < 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              <span className="heading-sm">{factor.potentialImprovement > 0 ? '+' : ''}{factor.potentialImprovement}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Impact */}
                    {damageEstimate && (
                      <div className="panel p-6 border-l-4 border-l-green-500">
                        <h4 className="heading-sm mb-4">Estimated Financial Impact</h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="label text-xs text-gray-500">Potential Statutory Damages</p>
                            <p className="heading-lg">{formatCurrency(damageEstimate.statutory.min)} - {formatCurrency(damageEstimate.statutory.max)}</p>
                          </div>
                          <div>
                            <p className="label text-xs text-gray-500">Total Estimated Damages</p>
                            <p className="heading-lg">{formatCurrency(damageEstimate.total.min)} - {formatCurrency(damageEstimate.total.max)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Countdown/Deadlines Tab */}
                {activeTab === 'countdown' && deadlines && (
                  <div className="fade-in space-y-6">
                    {/* Summary Cards */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="panel p-6">
                        <p className="label text-gray-500 mb-2">Upcoming Deadlines</p>
                        <span className="text-4xl font-light text-amber-600">{deadlines.countdowns.filter(c => !c.isExpired).length}</span>
                      </div>
                      <div className="panel p-6">
                        <p className="label text-gray-500 mb-2">Expired Items</p>
                        <span className="text-4xl font-light text-green-600">{deadlines.countdowns.filter(c => c.isExpired).length}</span>
                      </div>
                      <div className="panel p-6">
                        <p className="label text-gray-500 mb-2">Next Action</p>
                        <span className="body-sm">{deadlines.nextAction?.description || 'No immediate actions'}</span>
                      </div>
                    </div>

                    {/* Countdowns List */}
                    <div className="panel p-0 overflow-hidden">
                      <div className="bg-gray-50 p-4 border-b border-gray-100">
                        <h4 className="heading-sm">All Deadlines & Countdowns</h4>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {deadlines.countdowns.map((countdown, i) => (
                          <div key={i} className="p-4 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                              countdown.urgency === 'expired' ? 'bg-green-100 text-green-700' :
                              countdown.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                              countdown.urgency === 'warning' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {countdown.isExpired ? '✓' : countdown.daysRemaining}
                            </div>
                            <div className="flex-1">
                              <p className="heading-sm">{countdown.label}</p>
                              <p className="body-sm text-gray-600">{countdown.type.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-gray-400">{countdown.targetDate.toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs uppercase tracking-wider font-medium ${
                                countdown.urgency === 'expired' ? 'text-green-600' :
                                countdown.urgency === 'critical' ? 'text-red-600' :
                                countdown.urgency === 'warning' ? 'text-amber-600' :
                                'text-gray-500'
                              }`}>
                                {countdown.isExpired ? 'EXPIRED' : `${countdown.daysRemaining} days`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Export Calendar */}
                    <div className="panel-inset p-4 flex items-center justify-between">
                      <p className="body-sm">Export deadlines to your calendar</p>
                      <button
                        type="button"
                        onClick={() => {
                          const events = generateCalendarEvents(deadlines);
                          const blob = new Blob([events], { type: 'text/calendar' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = 'credit_deadlines.ics';
                          link.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="btn btn-secondary text-sm"
                      >
                        Download .ics
                      </button>
                    </div>
                  </div>
                )}

                {/* Collector Intel Tab */}
                {activeTab === 'collector' && (
                  <div className="fade-in space-y-6">
                    {collectorMatch ? (
                      <>
                        {/* Collector Header */}
                        <div className="panel-elevated p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="heading-lg mb-2">{collectorMatch.collector.names[0]}</h3>
                              <p className="body-sm text-gray-600">{collectorMatch.collector.names.slice(1).join(' · ')}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              collectorMatch.collector.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                              collectorMatch.collector.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {collectorMatch.collector.riskLevel.toUpperCase()} RISK
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div className="panel p-4">
                            <p className="label text-gray-500 text-xs">CFPB Complaints</p>
                            <p className="heading-lg">{collectorMatch.collector.violations.cfpbComplaints.toLocaleString()}</p>
                          </div>
                          <div className="panel p-4">
                            <p className="label text-gray-500 text-xs">Lawsuits Filed</p>
                            <p className="heading-lg">{collectorMatch.collector.violations.lawsuits.toLocaleString()}</p>
                          </div>
                          <div className="panel p-4">
                            <p className="label text-gray-500 text-xs">Litigation Success</p>
                            <p className="heading-lg capitalize">{collectorMatch.collector.litigationSuccess}</p>
                          </div>
                        </div>

                        {/* Known Issues */}
                        <div className="panel p-6">
                          <h4 className="heading-sm mb-4">Known Issue Patterns</h4>
                          <div className="flex flex-wrap gap-2">
                            {collectorMatch.collector.knownIssues.map((v, i) => (
                              <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Regulatory Actions */}
                        {collectorMatch.collector.regulatoryActions.length > 0 && (
                          <div className="panel p-6 border-l-4 border-l-amber-500">
                            <h4 className="heading-sm mb-4">Regulatory Actions</h4>
                            <ul className="space-y-2">
                              {collectorMatch.collector.regulatoryActions.map((ra, i) => (
                                <li key={i} className="body-sm text-gray-600 flex items-start gap-2">
                                  <span className="text-amber-500">⚠</span>
                                  {ra.date}: {ra.action} by {ra.agency}{ra.amount ? ` ($${ra.amount.toLocaleString()})` : ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommended Strategy */}
                        <div className="notice">
                          <p className="heading-sm mb-2">Recommended Strategy</p>
                          <p className="body-sm">{collectorMatch.recommendations.join(' ')}</p>
                        </div>
                      </>
                    ) : (
                      <div className="panel-inset p-12 text-center">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="heading-md mb-1">Collector Not Found</h3>
                        <p className="body-sm text-gray-500">
                          No intelligence data available for "{editableFields.furnisherOrCollector || 'Unknown'}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Metro 2 Validation Tab */}
                {activeTab === 'metro2' && metro2Validation && (
                  <div className="fade-in space-y-6">
                    {/* Validation Summary */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="panel-elevated p-6">
                        <p className="label text-gray-500 mb-2">Compliance Score</p>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-4xl font-light ${
                            metro2Validation.compliance.score >= 80 ? 'text-green-600' :
                            metro2Validation.compliance.score >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {metro2Validation.compliance.score}
                          </span>
                          <span className="text-gray-400">/100</span>
                        </div>
                      </div>
                      <div className="panel p-6">
                        <p className="label text-gray-500 mb-2">Errors Found</p>
                        <span className="text-4xl font-light text-red-600">{metro2Validation.errors.length}</span>
                      </div>
                      <div className="panel p-6">
                        <p className="label text-gray-500 mb-2">Warnings</p>
                        <span className="text-4xl font-light text-amber-600">{metro2Validation.warnings.length}</span>
                      </div>
                    </div>

                    {/* Errors */}
                    {metro2Validation.errors.length > 0 && (
                      <div className="panel p-0 overflow-hidden border-red-200">
                        <div className="bg-red-50 p-4 border-b border-red-100">
                          <h4 className="heading-sm text-red-800">Metro 2 Errors (Violations)</h4>
                        </div>
                        <div className="divide-y divide-red-50">
                          {metro2Validation.errors.map((error, i) => (
                            <div key={i} className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-red-500 text-lg">✕</span>
                                <div>
                                  <p className="heading-sm">{error.field}</p>
                                  <p className="body-sm text-gray-600">{error.message}</p>
                                  <p className="text-xs text-red-600 mt-1 font-mono">{error.code}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {metro2Validation.warnings.length > 0 && (
                      <div className="panel p-0 overflow-hidden border-amber-200">
                        <div className="bg-amber-50 p-4 border-b border-amber-100">
                          <h4 className="heading-sm text-amber-800">Metro 2 Warnings</h4>
                        </div>
                        <div className="divide-y divide-amber-50">
                          {metro2Validation.warnings.map((warning, i) => (
                            <div key={i} className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-amber-500 text-lg">⚠</span>
                                <div>
                                  <p className="heading-sm">{warning.field}</p>
                                  <p className="body-sm text-gray-600">{warning.message}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* What is Metro 2 */}
                    <div className="notice">
                      <p className="heading-sm mb-2">What is Metro 2?</p>
                      <p className="body-sm">
                        Metro 2 is the standardized data format used by furnishers to report account information to credit bureaus.
                        Errors in Metro 2 formatting are technical violations that can strengthen your dispute.
                      </p>
                    </div>
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
            <div className="fade-in max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="heading-xl mb-3">{translate('export.title')}</h2>
                <p className="body-lg text-gray-600">
                  Generate dispute letters, CFPB complaints, evidence packages, and attorney referral documents.
                </p>
              </div>

              {/* Export Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <div className="flex gap-6">
                  {(['letters', 'cfpb', 'evidence', 'attorney'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setExportTab(tab)}
                      className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                        exportTab === tab
                          ? 'border-gray-900 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
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

              {/* Letters Tab */}
              {exportTab === 'letters' && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button type="button" className="doc-card group" onClick={() => downloadDocument('bureau', 'pdf')}>
                      <div className="doc-icon group-hover:bg-gray-900 group-hover:text-white transition-colors">B</div>
                      <div className="flex-1 text-left">
                        <h3 className="heading-md mb-0.5">Bureau Dispute Letter</h3>
                        <p className="body-sm text-gray-500">For Experian, Equifax, TransUnion</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-1 rounded">PDF</span>
                    </button>

                    <button type="button" className="doc-card group" onClick={() => downloadDocument('validation', 'pdf')}>
                      <div className="doc-icon group-hover:bg-gray-900 group-hover:text-white transition-colors">V</div>
                      <div className="flex-1 text-left">
                        <h3 className="heading-md mb-0.5">Debt Validation Request</h3>
                        <p className="body-sm text-gray-500">FDCPA §809(b) compliant</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-1 rounded">PDF</span>
                    </button>

                    <button
                      type="button"
                      className="doc-card group"
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
                        <h3 className="heading-md mb-0.5">Cease & Desist Letter</h3>
                        <p className="body-sm text-gray-500">Stop collection contact</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-1 rounded">TXT</span>
                    </button>

                    <button
                      type="button"
                      className="doc-card group"
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
                        <h3 className="heading-md mb-0.5">Intent to Sue Letter</h3>
                        <p className="body-sm text-gray-500">Final demand before litigation</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-1 rounded">TXT</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CFPB Tab */}
              {exportTab === 'cfpb' && (
                <div className="space-y-6">
                  <div className="panel p-6">
                    <h3 className="heading-md mb-4">CFPB Complaint Generator</h3>
                    <p className="body-sm text-gray-600 mb-4">
                      Generate a comprehensive CFPB complaint narrative based on detected violations.
                      Complaint strength: <span className="font-bold">{estimateComplaintStrength(flags).score}%</span>
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
                        className="btn btn-secondary"
                        onClick={() => downloadDocument('cfpb', 'txt')}
                      >
                        Download as TXT
                      </button>
                    </div>
                  </div>

                  <div className="notice">
                    <p className="heading-sm mb-2">How to File</p>
                    <ol className="body-sm space-y-1 list-decimal list-inside">
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
                  <div className="panel p-6">
                    <h3 className="heading-md mb-4">Court-Ready Evidence Package</h3>
                    <p className="body-sm text-gray-600 mb-4">
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
                    <div className="panel p-6 border-l-4 border-l-green-500">
                      <h4 className="heading-sm mb-3">Damage Calculation Summary</h4>
                      <div className="grid sm:grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="label text-xs text-gray-500">Statutory</p>
                          <p className="heading-md">{formatCurrency(damageEstimate.statutory.min)} - {formatCurrency(damageEstimate.statutory.max)}</p>
                        </div>
                        <div>
                          <p className="label text-xs text-gray-500">Actual</p>
                          <p className="heading-md">{formatCurrency(damageEstimate.actual.estimated)}</p>
                        </div>
                        <div>
                          <p className="label text-xs text-gray-500">Total Potential</p>
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
                  <div className="panel p-6">
                    <h3 className="heading-md mb-4">Attorney Consultation Package</h3>
                    <p className="body-sm text-gray-600 mb-4">
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

                  <div className="panel p-6">
                    <h4 className="heading-sm mb-3">Case Summary</h4>
                    <button
                      type="button"
                      className="btn btn-secondary w-full"
                      onClick={() => downloadDocument('summary', 'pdf')}
                    >
                      Download Case Summary (PDF)
                    </button>
                  </div>
                </div>
              )}

              <div className="notice max-w-xl mx-auto my-10">
                <p className="body-sm">
                  <span className="font-medium">Disclaimer:</span> These documents are templates for educational purposes.
                  Consult with a qualified attorney before taking legal action.
                </p>
              </div>

              <div className="flex justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(4)}>Back</button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(6)}>
                  Track Disputes
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Dispute Tracker */}
          {step === 6 && (
            <div className="fade-in max-w-4xl mx-auto">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="heading-xl mb-2">Dispute Tracker</h2>
                  <p className="body-md text-gray-600">
                    Track your disputes, deadlines, and outcomes in one place.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const newDispute = createDispute(
                      {
                        creditor: editableFields.originalCreditor || 'Unknown',
                        collector: editableFields.furnisherOrCollector || undefined,
                        balance: editableFields.currentBalance || '$0',
                        accountType: editableFields.accountType || 'Unknown'
                      },
                      'bureau',
                      flags.length > 0 ? flags[0].explanation : 'Inaccurate information',
                      flags.map(f => f.ruleId)
                    );
                    setDisputes(loadDisputes());
                    setDisputeStats(getDisputeStats());
                  }}
                >
                  + New Dispute
                </button>
              </div>

              {/* Stats Overview */}
              {disputeStats && (
                <div className="grid sm:grid-cols-4 gap-4 mb-8">
                  <div className="panel p-4 text-center">
                    <p className="text-3xl font-light">{disputeStats.total}</p>
                    <p className="label text-xs text-gray-500">Total</p>
                  </div>
                  <div className="panel p-4 text-center">
                    <p className="text-3xl font-light text-blue-600">{disputeStats.active}</p>
                    <p className="label text-xs text-gray-500">Active</p>
                  </div>
                  <div className="panel p-4 text-center">
                    <p className="text-3xl font-light text-green-600">{disputeStats.resolved}</p>
                    <p className="label text-xs text-gray-500">Resolved</p>
                  </div>
                  <div className="panel p-4 text-center">
                    <p className="text-3xl font-light">{disputeStats.successRate}%</p>
                    <p className="label text-xs text-gray-500">Success Rate</p>
                  </div>
                </div>
              )}

              {/* Urgent Disputes Alert */}
              {getUrgentDisputes().length > 0 && (
                <div className="panel p-4 border-l-4 border-l-red-500 mb-6">
                  <h4 className="heading-sm text-red-800 mb-2">Urgent: Deadlines Approaching</h4>
                  <ul className="space-y-1">
                    {getUrgentDisputes().map(d => (
                      <li key={d.id} className="body-sm text-gray-600">
                        {d.account.creditor}: Response deadline in {Math.ceil((new Date(d.deadlines.responseDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disputes List */}
              <div className="panel p-0 overflow-hidden mb-8">
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                  <h4 className="heading-sm">All Disputes</h4>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      const csv = exportDisputesCSV();
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'disputes_export.csv';
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Export CSV
                  </button>
                </div>

                {disputes.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {disputes.map(dispute => (
                      <div key={dispute.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                dispute.status === 'resolved_favorable' ? 'bg-green-100 text-green-700' :
                                dispute.status === 'resolved_unfavorable' ? 'bg-red-100 text-red-700' :
                                dispute.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                dispute.status === 'investigating' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {dispute.status.replace(/_/g, ' ')}
                              </span>
                              <span className="mono text-xs text-gray-400">{dispute.id}</span>
                            </div>
                            <h4 className="heading-sm">{dispute.account.creditor}</h4>
                            <p className="body-sm text-gray-500">
                              {dispute.type} dispute · {dispute.account.balance} · Created {new Date(dispute.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              className="input text-xs py-1"
                              value={dispute.status}
                              aria-label="Update dispute status"
                              title="Update dispute status"
                              onChange={(e) => {
                                updateDisputeStatus(dispute.id, e.target.value as DisputeStatus);
                                setDisputes(loadDisputes());
                                setDisputeStats(getDisputeStats());
                              }}
                            >
                              <option value="draft">Draft</option>
                              <option value="submitted">Submitted</option>
                              <option value="investigating">Investigating</option>
                              <option value="response_received">Response Received</option>
                              <option value="escalated">Escalated</option>
                              <option value="resolved_favorable">Resolved (Favorable)</option>
                              <option value="resolved_unfavorable">Resolved (Unfavorable)</option>
                              <option value="closed">Closed</option>
                            </select>
                            <button
                              type="button"
                              className="p-1 text-gray-400 hover:text-red-500"
                              aria-label="Delete dispute"
                              title="Delete dispute"
                              onClick={() => {
                                deleteDispute(dispute.id);
                                setDisputes(loadDisputes());
                                setDisputeStats(getDisputeStats());
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="heading-md mb-1">No Disputes Yet</h3>
                    <p className="body-sm text-gray-500">Create your first dispute to start tracking.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(5)}>Back</button>
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
            <p className="mono text-xs">Credit Report Analyzer v5.0 | Revolutionary Edition</p>
            <p>100% client-side · Your data stays on your device · {language === 'en' ? 'English' : 'Español'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
