'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CreditFields, RuleFlag, RiskProfile, ConsumerInfo, AnalysisRecord, AnalyzedAccount } from '../lib/types';
import { BRANDING } from '../config/branding';

import {
  translate,
  Language
} from '../lib/i18n';

// UI Components
import Header from '../components/layout/Header';
import ProgressNav from '../components/layout/ProgressNav';
import Step1Input from '../components/steps/Step1Input';
import Step2Review from '../components/steps/Step2Review';
import Step3Verify from '../components/steps/Step3Verify';
import Step4Analysis from '../components/steps/Step4Analysis';
import Step5Export from '../components/steps/Step5Export';
import Step6Track from '../components/steps/Step6Track';
import { Celebration } from '../components/Celebration';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { STEPS } from '../lib/constants';
import type { Step, TabId } from '../lib/constants';
import { ScanMode } from '../lib/ingestion';

// Institutional & Quality Components
import {
  InstitutionalBanner,
  Onboarding,
  KeyboardShortcuts,
  useKeyboardShortcuts
} from '../components';
import { createAutoSaver } from '../lib/session-recovery';

// Custom Hooks
import { useAnalysisHistory } from '../hooks/useAnalysisHistory';
import { useFileProcessor } from '../hooks/useFileProcessor';
import { useForensicAnalysis } from '../hooks/useForensicAnalysis';
import { useReporting } from '../hooks/useReporting';
import { useDisputeTracking } from '../hooks/useDisputeTracking';

// Multi-account analysis interface moved to lib/types


const SAMPLE_TEXT = `[CASE_FILE_0892] - FORENSIC AUDIT SAMPLE

ACCOUNT 1: PRIMARY VIOLATION CASE
Creditor: ASSET ACCEPTANCE LLC
Original Creditor: CHASE BANK
Account Type: Collection / Factoring Company Account
Account Status: Open / Past Due
Value: 4,219.00
Original Amount: 1,850.00
Date Opened: 2018-11-12
Date of First Delinquency: 2023-04-10
Charge-Off Date: 2019-06-15
Last Payment: 2019-04-02
Estimated Removal: 2031-12-01
Payment History: 30 60 90 120 150 180 CO

[FORENSIC NOTES]
- DOFD (2023) is reported AFTER Charge-Off (2019), indicating illegal re-aging.
- Value (4,219) is 228% of original amount without itemized fee disclosure.
- Estimated removal exceeds FCRA 7-year limit based on actual 2019 delinquency.

ACCOUNT 2: DUPLICATE FRAUD INDICATOR
Creditor: CAPITAL ONE
Account Type: Credit Card
Value: 4,219.00
Status: Charged Off
Date Opened: 2018-11-12
Note: Data matches Account 1 exactly, indicating potential double-reporting violation.`;

// Analysis tabs configuration (TabId type imported from constants)

export default function CreditReportAnalyzer() {
  const maxUploadSizeMB = 20;
  const { state, setDarkMode, setStep, setRawText, setEditableFields, setConsumer, setFlags, setRiskProfile, setProcessing, setAnalyzing, setStatsBar, reset: resetApp } = useApp();
  const { darkMode, step, rawText, editableFields, consumer, flags, riskProfile, isProcessing, progress, isAnalyzing } = state;

  const [progressText, setProgressText] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('standard');
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [discoveryAnswers, setDiscoveryAnswers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  // Initialize keyboard shortcuts
  const { 
    isOpen: isShortcutsOpen, 
    close: closeShortcuts 
  } = useKeyboardShortcuts(
    (s) => setStep(s as any),
    (action) => {
      if (action === 'analyze') analyzeText(rawText);
      if (action === 'print') window.print();
    }
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyFileInputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Show toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Initialize Custom Hooks
  const {
    history,
    setHistory,
    showHistory,
    setShowHistory,
    removeFromHistory,
    handleExportHistory,
    handleImportHistory,
    handleClearHistory
  } = useAnalysisHistory(showToast);

  const {
    sources,
    setSources,
    handleFilesUpload,
    removeSource,
    clearSources
  } = useFileProcessor(setRawText, setFileName, setProcessing, showToast, scanMode);

  const {
    analyzedAccounts,
    setAnalyzedAccounts,
    executiveSummary,
    setExecutiveSummary,
    relevantCaseLaw,
    setRelevantCaseLaw,
    scoreImpact,
    setScoreImpact,
    deadlines,
    setDeadlines,
    collectorMatch,
    setCollectorMatch,
    metro2Validation,
    setMetro2Validation,
    impactAssessment,
    setImpactAssessment,
    activeParsedFields,
    setActiveParsedFields,
    showCelebration,
    setShowCelebration,
    deltas,
    setDeltas,
    analytics,
    seriesInsights,
    seriesSnapshots,
    seriesOptions,
    loadFromHistory,
    handleCompareSnapshots,
    analyzeText,
    runAnalysis
  } = useForensicAnalysis(
    editableFields as CreditFields,
    flags,
    fileName,
    setStep,
    setRawText,
    setFileName,
    setFlags,
    setRiskProfile,
    setEditableFields,
    setAnalyzing,
    setHistory,
    showToast,
    setActiveTab,
    history,
    setShowHistory,
    step
  );

  const {
    selectedLetterType,
    setSelectedLetterType,
    editableLetter,
    setEditableLetter,
    exportTab,
    setExportTab,
    isBundling,
    downloadDocument,
    downloadTextFile,
    downloadPdfFile,
    downloadForensicReport,
    downloadAnalysisJson,
    downloadCaseBundle,
    downloadCaseBundleZip,
    // Add generators for compatibility
    generateCeaseDesistLetter,
    generateIntentToSueLetter,
    estimateComplaintStrength,
    buildEvidencePackage,
    formatEvidencePackage,
    buildAttorneyPackage,
    formatAttorneyPackage,
    formatRedactedAttorneyPackage,
    buildOutcomeNarrative,
    formatCurrency
  } = useReporting(
    editableFields,
    flags,
    riskProfile,
    consumer,
    relevantCaseLaw,
    discoveryAnswers,
    fileName,
    showToast
  );

  const {
    disputes,
    setDisputes,
    disputeStats,
    setDisputeStats,
    createDispute,
    updateDisputeStatus,
    loadDisputes,
    getDisputeStats
  } = useDisputeTracking();

  // Revolutionary feature states
  const [language, setLang] = useState<Language>('en');

  // Auto-save session
  useEffect(() => {
    const saver = createAutoSaver(() => ({
      step,
      rawText,
      editableFields,
      consumerInfo: consumer,
      discoveryAnswers,
    }));

    if (step > 1) {
      saver.start();
    }

    return () => saver.stop();
  }, [step, rawText, editableFields, consumer, discoveryAnswers]);


  // Handle language change
  const handleLanguageChange = useCallback((newLang: Language) => {
    setLanguage(newLang);
    setLang(newLang);
  }, []);

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
          analyzeText(rawText);
        }
        if (e.key === 'p' && step === 4) {
          e.preventDefault();
          window.print();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, rawText, analyzeText]);

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const detail = (event as CustomEvent).detail as { step?: Step; tab?: TabId } | undefined;
      if (!detail) return;
      if (detail.step) setStep(detail.step);
      if (detail.tab) setActiveTab(detail.tab);
    };
    window.addEventListener('cra:navigate', handleNavigate);
    return () => window.removeEventListener('cra:navigate', handleNavigate);
  }, [setActiveTab, setStep]);

  const handleFileUpload = useCallback(async (file: File) => {
    await handleFilesUpload([file]);
  }, [handleFilesUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  }, [handleFilesUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  }, []);

  const processText = useCallback(() => {
    if (!rawText.trim()) return;
    analyzeText(rawText, fileName ?? 'pasted-text.txt');
  }, [rawText, analyzeText, fileName]);

  const loadSample = useCallback(() => {
    setSources([]);
    analyzeText(SAMPLE_TEXT, 'sample_data.txt');
  }, [analyzeText, setSources]);

  const handleReset = useCallback(() => {
    resetApp();
    setFileName(null);
    setSources([]);
    setAnalyzedAccounts([]);
    setSelectedAccountId(null);
    setExpandedCard(null);
  }, [resetApp, setSources, setAnalyzedAccounts]);

  const caseQualityScore = useMemo(() => {
    if (flags.length === 0) return 100;
    const overdue = deadlines?.countdowns.filter(item => item.isExpired).length || 0;
    const missingFields = ['dofd', 'dateLastPayment', 'stateCode'].filter(key => !(editableFields as any)[key]).length;
    const score = 100 - (overdue * 8 + missingFields * 6 + flags.length * 2);
    return Math.max(40, Math.min(100, score));
  }, [deadlines?.countdowns, editableFields, flags.length]);

  const missingFieldCount = useMemo(() => {
    return ['dofd', 'dateLastPayment', 'stateCode'].filter(key => !(editableFields as any)[key]).length;
  }, [editableFields]);

  const overdueDeadlinesCount = useMemo(() => {
    return deadlines?.countdowns.filter(item => item.isExpired).length || 0;
  }, [deadlines?.countdowns]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const stepTip = useMemo(() => {
    const tips: Record<Step, { title: string; body: string }> = {
      1: { title: 'Step 1: Input', body: 'Upload or paste the account section. Scanned PDFs will run OCR automatically.' },
      2: { title: 'Step 2: Review', body: 'Verify the extracted text or select the highest-risk tradeline.' },
      3: { title: 'Step 3: Verify', body: 'Confirm key fields to improve accuracy before analysis.' },
      4: { title: 'Step 4: Analyze', body: 'Review violations, timelines, and evidence readiness.' },
      5: { title: 'Step 5: Export', body: 'Generate letters, evidence packages, and full case bundles.' },
      6: { title: 'Step 6: Track', body: 'Track disputes, timelines, and outcomes.' }
    };
    return tips[step];
  }, [step]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Stats Notification Bar (Vercel-style) */}
      <AnimatePresence>
        {state.showStatsBar && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-slate-950 border-b border-white/10 overflow-hidden relative z-50 no-print"
          >
            <div className="container py-3 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Forensic Latency</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono text-white font-bold">0.14ms</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/5" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Violations Detected</span>
                  <span className="text-xs font-mono text-white font-bold">{flags.length}</span>
                </div>
                <div className="h-8 w-px bg-white/5" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Data Integrity</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">99.8%</span>
                </div>
                <div className="h-8 w-px bg-white/5" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Risk Profile</span>
                  <span className={cn(
                    "text-xs font-mono font-bold uppercase",
                    riskProfile?.riskLevel === 'critical' ? 'text-rose-500' :
                    riskProfile?.riskLevel === 'high' ? 'text-orange-500' :
                    riskProfile?.riskLevel === 'medium' ? 'text-amber-500' :
                    'text-emerald-500'
                  )}>
                    {riskProfile?.riskLevel || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Zenith V5 Node Active</span>
                </div>
                <button 
                  onClick={() => setStatsBar(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                  title="Close statistics bar"
                  aria-label="Close statistics bar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Institutional Ticker */}
      <div className="w-full bg-slate-950 border-b border-white/5 py-1.5 overflow-hidden whitespace-nowrap relative z-[60]">
        <div className="flex animate-ticker-slow">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-12 px-6">
              <span className="text-[9px] font-black text-blue-500/50 font-mono tracking-[0.3em] uppercase italic flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Secure_Node_Active
              </span>
              <span className="text-[9px] font-bold text-slate-500 font-mono tracking-[0.2em] uppercase">FCRA_LATENCY: 0.14MS</span>
              <span className="text-[9px] font-bold text-slate-500 font-mono tracking-[0.2em] uppercase">ZENITH_V5_ORCHESTRATOR: ONLINE</span>
              <span className="text-[9px] font-bold text-slate-500 font-mono tracking-[0.2em] uppercase">METRO2_DATA_INTEGRITY: 99.8%</span>
              <span className="text-[9px] font-bold text-slate-500 font-mono tracking-[0.2em] uppercase">SYSTEM_STATE: NOMINAL</span>
            </div>
          ))}
        </div>
      </div>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Institutional Onboarding & Banner */}
      <Onboarding onComplete={() => showToast('Welcome! Check the shortcuts by pressing ?', 'info')} />
      <InstitutionalBanner />
      <KeyboardShortcuts isOpen={isShortcutsOpen} onClose={closeShortcuts} />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-premium backdrop-blur-md transition-all duration-300 animate-slide-in flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-600/90 text-white' :
            toast.type === 'success' ? 'bg-emerald-600/90 text-white' :
              'bg-slate-900/90 text-white'
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
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        handleLanguageChange={handleLanguageChange}
        step={step}
        reset={handleReset}
        translate={translate}
        qualityScore={caseQualityScore}
        missingFields={missingFieldCount}
        overdueDeadlines={overdueDeadlinesCount}
      />

      {/* Progress Steps */}
      <ProgressNav
        steps={STEPS}
        currentStep={step}
        setStep={setStep}
      />

      {/* Main Content */}
      <main id="main-content" className="flex-1 py-8 sm:py-12" role="main" aria-label="Credit Report Analysis">
        <div className="container">
          {showGuide ? (
            <div className="panel-inset p-4 mb-6 dark:bg-gray-900 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="label text-gray-500 dark:text-gray-400">{stepTip.title}</p>
                  <p className="body-sm text-gray-600 dark:text-gray-400">{stepTip.body}</p>
                </div>
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => {
                    setShowGuide(false);
                    localStorage.setItem('cra_show_guide', 'false');
                  }}
                >
                  Hide guide
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => {
                  setShowGuide(true);
                  localStorage.setItem('cra_show_guide', 'true');
                }}
              >
                Show step guide
              </button>
            </div>
          )}

          {/* Step 1: Input */}
          {step === 1 && (
            <ErrorBoundary
              fallback={
                <div className="p-8 text-center">
                  <h3 className="text-lg font-bold text-red-600 mb-2">Something went wrong</h3>
                  <p className="text-slate-600 mb-4">An error occurred in this step. Please try again.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg"
                  >
                    Reload Page
                  </button>
                </div>
              }
            >
              <Step1Input
                isProcessing={isProcessing}
                progressText={progressText}
                progress={progress}
                scanMode={scanMode}
                setScanMode={setScanMode}
                rawText={rawText}
                setRawText={setRawText}
                fileName={fileName}
                fileInputRef={fileInputRef}
                handleFileUpload={handleFileUpload}
                handleFilesUpload={handleFilesUpload}
                handleDrop={handleDrop}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                processText={processText}
                loadSample={loadSample}
                sources={sources.map(({ id, name, size, type }) => ({ id, name, size, type }))}
                removeSource={removeSource}
                clearSources={clearSources}
                history={history}
                showHistory={showHistory}
                setShowHistory={setShowHistory}
                loadFromHistory={loadFromHistory}
                removeFromHistory={removeFromHistory}
                historyFileInputRef={historyFileInputRef}
                exportHistory={handleExportHistory}
                importHistory={handleImportHistory}
                clearHistory={handleClearHistory}
              />
            </ErrorBoundary>
          )}

          {/* Step 2: Review Extracted */}
          {step === 2 && (
            <ErrorBoundary
              fallback={
                <div className="p-8 text-center">
                  <h3 className="text-lg font-bold text-red-600 mb-2">Something went wrong</h3>
                  <p className="text-slate-600 mb-4">An error occurred in this step. Please try again.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg"
                  >
                    Reload Page
                  </button>
                </div>
              }
            >
              <Step2Review
                analyzedAccounts={analyzedAccounts}
                executiveSummary={executiveSummary}
                flags={flags}
                discoveryAnswers={discoveryAnswers}
                fileName={fileName}
                rawText={rawText}
                setRawText={setRawText}
                setEditableFields={setEditableFields}
                setActiveParsedFields={setActiveParsedFields}
                setStep={setStep}
                fieldsToSimple={fieldsToSimple}
                parseCreditReport={parseCreditReport}
              />
            </ErrorBoundary>
          )}

          {/* Step 3: Verify Fields */}
          {step === 3 && (
            <ErrorBoundary
              fallback={
                <div className="p-8 text-center">
                  <h3 className="text-lg font-bold text-red-600 mb-2">Something went wrong</h3>
                  <p className="text-slate-600 mb-4">An error occurred in this step. Please try again.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg"
                  >
                    Reload Page
                  </button>
                </div>
              }
            >
              <Step3Verify
                editableFields={editableFields}
                setEditableFields={setEditableFields}
                activeParsedFields={activeParsedFields}
                rawText={rawText}
                consumer={consumer}
                setConsumer={setConsumer}
                runAnalysis={runAnalysis}
                isAnalyzing={isAnalyzing}
                setStep={setStep}
                showHelp={showHelp}
                setShowHelp={setShowHelp}
              />
            </ErrorBoundary>
          )}

          {/* Step 4: Analysis Results */}
          {step === 4 && riskProfile && (
            <ErrorBoundary
              fallback={
                <div className="p-8 text-center">
                  <h3 className="text-lg font-bold text-red-600 mb-2">Something went wrong</h3>
                  <p className="text-slate-600 mb-4">An error occurred in this step. Please try again.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg"
                  >
                    Reload Page
                  </button>
                </div>
              }
            >
              <Step4Analysis
                flags={flags}
                riskProfile={riskProfile}
                editableFields={editableFields}
                rawText={rawText}
                consumer={consumer}
                discoveryAnswers={discoveryAnswers}
                setDiscoveryAnswers={setDiscoveryAnswers}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                expandedCard={expandedCard}
                setExpandedCard={setExpandedCard}
                deltas={deltas}
                seriesInsights={seriesInsights}
                seriesSnapshots={seriesSnapshots}
                seriesOptions={seriesOptions}
                onCompareSnapshots={handleCompareSnapshots}
                relevantCaseLaw={relevantCaseLaw}
                collectorMatch={collectorMatch}
                analytics={analytics}
                tabsRef={tabsRef}
                translate={translate}
                generateForensicReport={() => downloadForensicReport()}
                selectedLetterType={selectedLetterType}
                setSelectedLetterType={setSelectedLetterType}
                editableLetter={editableLetter}
                setEditableLetter={setEditableLetter}
                generatePDFLetter={downloadPdfFile}
              />
            </ErrorBoundary>
          )}

          <div className="mt-8 flex justify-between items-center no-print">
            {step > 1 && step < 5 && (
              <button
                type="button"
                className="btn btn-secondary flex items-center gap-2 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                onClick={() => setStep((step - 1) as Step)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            )}
            {step === 4 && (
              <button
                type="button"
                className="btn btn-primary ml-auto shadow-lg shadow-blue-500/20"
                onClick={() => setStep(5)}
              >
                Continue to Documents
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
          {/* OLD CODE REMOVED */}
          {/* Step 5: Documents */}
          {step === 5 && (
            <ErrorBoundary
              fallback={
                <div className="p-8 text-center">
                  <h3 className="text-lg font-bold text-red-600 mb-2">Something went wrong</h3>
                  <p className="text-slate-600 mb-4">An error occurred in this step. Please try again.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg"
                  >
                    Reload Page
                  </button>
                </div>
              }
            >
              <Step5Export
                step={step}
                setStep={setStep}
                exportTab={exportTab}
                setExportTab={setExportTab}
                consumer={consumer}
                editableFields={editableFields as CreditFields}
                flags={flags}
                riskProfile={riskProfile!}
                relevantCaseLaw={relevantCaseLaw}
                discoveryAnswers={discoveryAnswers}
                impactAssessment={impactAssessment}
                translate={translate}
                downloadDocument={downloadDocument}
                generateCeaseDesistLetter={generateCeaseDesistLetter}
                generateIntentToSueLetter={generateIntentToSueLetter}
                estimateComplaintStrength={estimateComplaintStrength}
                buildEvidencePackage={buildEvidencePackage}
                formatEvidencePackage={formatEvidencePackage}
                buildAttorneyPackage={buildAttorneyPackage}
                formatAttorneyPackage={formatAttorneyPackage}
                formatRedactedAttorneyPackage={formatRedactedAttorneyPackage}
                buildOutcomeNarrative={buildOutcomeNarrative}
                formatCurrency={formatCurrency}
                downloadAnalysisJson={downloadAnalysisJson}
                downloadCaseBundle={downloadCaseBundle}
                downloadCaseBundleZip={downloadCaseBundleZip}
                downloadForensicReport={downloadForensicReport}
                isBundling={isBundling}
                downloadTextFile={downloadTextFile}
                downloadPdfFile={downloadPdfFile}
              />
            </ErrorBoundary>
          )}

          {/* Step 6: Dispute Tracker */}
          {step === 6 && (
            <ErrorBoundary
              fallback={
                <div className="p-8 text-center">
                  <h3 className="text-lg font-bold text-red-600 mb-2">Something went wrong</h3>
                  <p className="text-slate-600 mb-4">An error occurred in this step. Please try again.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg"
                  >
                    Reload Page
                  </button>
                </div>
              }
            >
              <Step6Track
                disputes={disputes}
                setDisputes={setDisputes}
                disputeStats={disputeStats}
                setDisputeStats={setDisputeStats}
                editableFields={editableFields as CreditFields}
                consumer={consumer}
                flags={flags}
                createDispute={createDispute}
                loadDisputes={loadDisputes}
                getDisputeStats={getDisputeStats}
                updateDisputeStatus={updateDisputeStatus}
                setStep={setStep}
                reset={handleReset}
                missingFields={missingFieldCount}
                overdueDeadlines={overdueDeadlinesCount}
              />
            </ErrorBoundary>
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
          <div className="mt-2 text-[11px] text-gray-500 text-center">
            For organizational or non-individual use, contact {BRANDING.organizationName} at {BRANDING.organizationUrl}.
          </div>
        </div>
      </footer>
    </div>
  );
}
