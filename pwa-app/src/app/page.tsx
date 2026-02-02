'use client';

import { useApp } from '../context/AppContext';


import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { parseCreditReport, fieldsToSimple, parseMultipleAccounts, ParsedFields } from '../lib/parser';
import { runComprehensiveAnalysis, runBatchAnalysis } from '../lib/forensic-engine';
import { CreditFields, RuleFlag, RiskProfile, ConsumerInfo, AnalysisRecord } from '../lib/types';
import { BRANDING } from '../config/branding';
import { generateBureauLetter, generateValidationLetter, generateCaseSummary, generateCFPBNarrative, generatePDFLetter, generatePDFBlob, generateForensicReport, generateForensicReportBlob } from '../lib/generator';
import { performOCR, isImage } from '../lib/ocr';
import { isPDF, extractPDFText, extractPDFTextViaOCR } from '../lib/pdf';
import { validateFiles, validateTextInput } from '../lib/validation-input';
import { getScanProfile, mergeTextVariants, normalizeExtractedText, scoreTextQuality, ScanMode } from '../lib/ingestion';
import { compareReports, compareReportSeries, buildReportSeries, buildReportSeriesOptions, DeltaResult, SeriesInsight, SeriesSnapshot, SeriesSnapshotOption } from '../lib/delta';
import { getRelevantCaseLaw, CaseLaw } from '../lib/caselaw';
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
  getAllHistory,
  getAnalysis,
  deleteAnalysis,
  exportHistory,
  importHistory,
  clearHistory,
  formatTimestamp,
} from '../lib/storage';

// Revolutionary feature imports
import {
  generateCeaseDesistLetter,
  generateIntentToSueLetter
} from '../lib/disputes';
import {
  estimateComplaintStrength
} from '../lib/cfpb-complaint';
import {
  buildEvidencePackage,
  assessImpact,
  formatEvidencePackage,
  ImpactAssessment
} from '../lib/evidence-builder';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  estimateScoreImpact,
  estimateBaseScore,
  getScoreCategory,
  calculateCategoryJump,
  estimateFinancialImpact,
  simulateActions,
  ScoreImpactEstimate
} from '../lib/score-impact';


import {
  buildDeadlineTracker,
  DeadlineTracker
} from '../lib/countdown';
import {
  translate,
  setLanguage,
  getLanguage,
  formatDate as i18nFormatDate,
  formatCurrency,
  Language
} from '../lib/i18n';
import {
  findCollector,
  CollectorMatch
} from '../lib/collector-database';
import {
  buildAttorneyPackage,
  formatAttorneyPackage,
  formatRedactedAttorneyPackage,
  buildOutcomeNarrative
} from '../lib/attorney-export';
import {
  validateMetro2,
  Metro2ValidationResult
} from '../lib/metro2-validator';

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
import { FIELD_CONFIG, STATES, ACCOUNT_TYPES, STATUSES, STEPS, ANALYSIS_TABS } from '../lib/constants';
import type { Step, LetterType, TabId } from '../lib/constants';
import { getDateValidation, getDateOrderIssues, normalizeCreditFields } from '../lib/validation';

// Institutional & Quality Components
import {
  InstitutionalBanner,
  Onboarding,
  KeyboardShortcuts,
  useKeyboardShortcuts
} from '../components';
import { saveSession, loadSession, clearSession, createAutoSaver } from '../lib/session-recovery';


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

import { AnalyzedAccount } from '../lib/types';

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
  const { state, setDarkMode, setStep, setRawText, setEditableFields, setConsumer, setFlags, setRiskProfile, setProcessing, setAnalyzing, reset: resetApp } = useApp();
  const { darkMode, step, rawText, editableFields, consumer, flags, riskProfile, isProcessing, progress, isAnalyzing } = state;

  const [progressText, setProgressText] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('standard');
  const [fileName, setFileName] = useState<string | null>(null);
  const [sources, setSources] = useState<{ id: string; name: string; size: number; type: string; text: string }[]>([]);
  const [analyzedAccounts, setAnalyzedAccounts] = useState<AnalyzedAccount[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<ForensicSummary | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [deltas, setDeltas] = useState<DeltaResult[]>([]);
  const [seriesInsights, setSeriesInsights] = useState<SeriesInsight[]>([]);
  const [seriesSnapshots, setSeriesSnapshots] = useState<SeriesSnapshot[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesSnapshotOption[]>([]);
  const [relevantCaseLaw, setRelevantCaseLaw] = useState<CaseLaw[]>([]);
  const [discoveryAnswers, setDiscoveryAnswers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [activeParsedFields, setActiveParsedFields] = useState<ParsedFields | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyFileInputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Revolutionary feature states
  const [language, setLang] = useState<Language>('en');
  const [scoreImpact, setScoreImpact] = useState<ScoreImpactEstimate | null>(null);
  const [deadlines, setDeadlines] = useState<DeadlineTracker | null>(null);
  const [collectorMatch, setCollectorMatch] = useState<CollectorMatch | null>(null);
  const [metro2Validation, setMetro2Validation] = useState<Metro2ValidationResult | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputeStats, setDisputeStats] = useState<ReturnType<typeof getDisputeStats> | null>(null);
  const [impactAssessment, setImpactAssessment] = useState<ImpactAssessment | null>(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedLetterType, setSelectedLetterType] = useState<LetterType>('bureau');
  const [exportTab, setExportTab] = useState<'letters' | 'cfpb' | 'evidence' | 'attorney'>('letters');
  const [editableLetter, setEditableLetter] = useState<string>('');
  const [isBundling, setIsBundling] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const {
    isOpen: isShortcutsOpen,
    toggle: toggleShortcuts,
    close: closeShortcuts
  } = useKeyboardShortcuts(
    (targetStep) => {
      if (targetStep >= 1 && targetStep <= 6) {
        setStep(targetStep as Step);
        showToast(`Navigated to Step ${targetStep}`, 'info');
      }
    },
    (action) => {
      if (action === 'save') {
        saveSession({
          step,
          rawText,
          editableFields,
          consumerInfo: consumer,
          discoveryAnswers,
        });
        showToast('Session saved locally', 'success');
      } else if (action === 'submit') {
        if (step < 6) {
          setStep((step + 1) as Step);
        } else {
          showToast('Analysis complete', 'info');
        }
      }
    }
  );


  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Show toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Load history, disputes, and language on mount
  useEffect(() => {
    const initData = async () => {
      const hist = await getAllHistory();
      setHistory(hist);
      setDisputes(loadDisputes());
      setDisputeStats(getDisputeStats());
      setLang(getLanguage());
      const storedGuide = typeof window !== 'undefined' ? localStorage.getItem('cra_show_guide') : null;
      if (storedGuide !== null) {
        setShowGuide(storedGuide === 'true');
      }
    };
    
    initData();

    // Try to recover session
    const saved = loadSession();
    if (saved && step === 1) {
      const confirmed = window.confirm(`Restore your previous working session? (Started ${new Date(saved.timestamp).toLocaleTimeString()})`);
      if (confirmed) {
        setStep(saved.step as Step);
        setRawText(saved.rawText);
        setEditableFields(saved.editableFields);
        setConsumer(saved.consumerInfo);
        setDiscoveryAnswers(saved.discoveryAnswers);
      } else {
        clearSession();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Computed analytics
  const analytics = useMemo(() => {
    if (!riskProfile || flags.length === 0) return null;
    return {
      timeline: buildTimeline(editableFields, flags, rawText),
      breakdown: calculateScoreBreakdown(flags, editableFields),
      patterns: detectPatterns(flags, editableFields),
      actions: generateActionItems(flags, riskProfile, editableFields),
      metrics: calculateForensicMetrics(editableFields, flags),
    };
  }, [flags, riskProfile, editableFields, rawText]);

  const analyzeText = useCallback((text: string, sourceFileName?: string) => {
    setRawText(text);
    if (sourceFileName) {
      setFileName(sourceFileName);
    }
    setFlags([]);
    setRiskProfile(null);
    setDeltas([]);
    setRelevantCaseLaw([]);
    setScoreImpact(null);
    setDeadlines(null);
    setCollectorMatch(null);
    setMetro2Validation(null);
    setImpactAssessment(null);
    setSelectedLetterType('bureau');
    setEditableLetter('');
    setExportTab('letters');
    setActiveTab('violations');
    setSelectedAccountId(null);

    if (text.trim().length < 40) {
      showToast('Input looks short. Paste the full account section for best results.', 'info');
    }

    const accounts = parseMultipleAccounts(text);
    if (accounts.length > 1) {
      // Execute hardened Zenith V5 Batch Analysis
      const batchResult = runBatchAnalysis(accounts);
      
      const analyzed = accounts.map(acc => {
        const analysis = batchResult.analyses[acc.id];
        return {
          id: acc.id,
          rawText: acc.rawText,
          fields: acc.fields,
          parsedFields: acc.parsedFields,
          flags: analysis.flags,
          risk: analysis.riskProfile
        };
      });

      setAnalyzedAccounts(analyzed);
      setExecutiveSummary(generateExecutiveSummary(analyzed));
      
      // Merge individual flags and global forensic flags
      const allFlags = [...analyzed.flatMap(acc => acc.flags), ...batchResult.globalFlags];
      setFlags(allFlags);

      const totalViolations = allFlags.length;
      if (totalViolations > 0) {
        setShowCelebration(true);
      }

      setStep(2);
      return;
    }

    setAnalyzedAccounts([]);
    setExecutiveSummary(null);
    const parsed = parseCreditReport(text);
    setActiveParsedFields(parsed);
    setEditableFields(fieldsToSimple(parsed));
    setStep(2);
  }, [
    showToast,
    setRawText,
    setFileName,
    setFlags,
    setRiskProfile,
    setDeltas,
    setRelevantCaseLaw,
    setScoreImpact,
    setDeadlines,
    setCollectorMatch,
    setMetro2Validation,
    setImpactAssessment,
    setSelectedLetterType,
    setEditableLetter,
    setExportTab,
    setActiveTab,
    setSelectedAccountId,
    setAnalyzedAccounts,
    setExecutiveSummary,
    setShowCelebration,
    setStep,
    setActiveParsedFields,
    setEditableFields
  ]);

  // Keyboard shortcuts - processText is defined later via useCallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHelp(null);
        setExpandedCard(null);
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter' && step === 1 && rawText.trim()) {
          e.preventDefault();
          // Inline processText logic to avoid circular dependency
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

  const mergeSourcesText = useCallback((items: { name: string; size: number; type: string; text: string }[]) => {
    return items
      .map((item) => {
        const meta = `[SOURCE:${item.name} | ${item.type || 'unknown'} | ${Math.round(item.size / 1024)}KB]`;
        return `${meta}\n${normalizeExtractedText(item.text)}`.trim();
      })
      .join('\n\n-----\n\n');
  }, []);

  const extractTextFromFile = useCallback(async (file: File) => {
    if (file.size > maxUploadSizeMB * 1024 * 1024) {
      throw new Error(`File exceeds ${maxUploadSizeMB}MB limit`);
    }

    let text = '';
    const profile = getScanProfile(scanMode);
    const scanLabel = scanMode === 'max' ? 'Max Scan' : 'Standard Scan';

    if (isPDF(file)) {
      setProcessing(true, undefined, `${scanLabel}: Extracting PDF text (${file.name})...`);
      try {
        const direct = await extractPDFText(file, (p) => setProcessing(true, Math.round(p * 100)));
        const normalized = normalizeExtractedText(direct);
        const quality = scoreTextQuality(normalized);
        text = normalized;

        if (scanMode === 'max' || quality < 55) {
          setProcessing(true, undefined, `${scanLabel}: OCR pass for PDF (${file.name})...`);
          const ocrText = await extractPDFTextViaOCR(file, (p) => setProcessing(true, Math.round(p * 100)), {
            maxPages: profile.pdfMaxPages,
            scale: profile.pdfScale
          });
          text = mergeTextVariants(text, normalizeExtractedText(ocrText));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.toLowerCase().includes('no selectable text')) {
          setProcessing(true, undefined, `${scanLabel}: OCR on scanned PDF (${file.name})...`);
          text = await extractPDFTextViaOCR(file, (p) => setProcessing(true, Math.round(p * 100)), {
            maxPages: profile.pdfMaxPages,
            scale: profile.pdfScale
          });
        } else {
          throw error;
        }
      }
    } else if (isImage(file)) {
      setProcessing(true, undefined, `${scanLabel}: OCR (${file.name})...`);
      text = await performOCR(file, (p) => setProcessing(true, Math.round(p * 100)), {
        scale: profile.ocrScale,
        contrast: profile.ocrContrast,
        thresholdLow: profile.ocrThresholdLow,
        thresholdHigh: profile.ocrThresholdHigh
      });
    } else {
      setProcessing(true, 100, `Reading file (${file.name})...`);
      text = await file.text();
    }

    const normalized = normalizeExtractedText(text);
    if (!normalized) {
      throw new Error(`No readable text detected in ${file.name}. Try Max Scan or a higher-quality source.`);
    }
    return normalized;
  }, [maxUploadSizeMB, scanMode, setProcessing]);

  const handleFilesUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Validate files before processing
    const validation = validateFiles(fileArray);
    if (!validation.valid) {
      validation.errors.forEach(error => showToast(error, 'error'));
      if (validation.validFiles.length === 0) {
        setProcessing(false, 0, '');
        return;
      }
    }

    setProcessing(true, 0, `Processing ${validation.validFiles.length} source${validation.validFiles.length > 1 ? 's' : ''}...`);

    try {
      const extracted: { id: string; name: string; size: number; type: string; text: string }[] = [];
      for (const file of validation.validFiles) {
        const text = await extractTextFromFile(file);
        extracted.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          text
        });
      }

      // Ensure scanner animation plays for at least 1.2s for that "sophisticated" feel
      await new Promise(resolve => setTimeout(resolve, 1200));

      setSources((prev) => {
        const next = [...prev, ...extracted];
        setRawText(mergeSourcesText(next));
        setFileName(next.length > 1 ? 'batch-upload.txt' : next[0]?.name ?? null);
        return next;
      });
      setProcessing(false, 100, 'Sources merged. Ready for analysis.');
    } catch (error) {
      console.error('Processing error:', error);
      const message = error instanceof Error ? error.message : 'File processing failed.';
      showToast(message, 'error');
      setProcessing(false, 0, '');
    }
  }, [extractTextFromFile, mergeSourcesText, setProcessing, setRawText, showToast]);

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
  }, [analyzeText]);

  const removeSource = useCallback((id: string) => {
    setSources((prev) => {
      const next = prev.filter(source => source.id !== id);
      setRawText(next.length > 0 ? mergeSourcesText(next) : '');
      setFileName(next.length > 1 ? 'batch-upload.txt' : next[0]?.name ?? null);
      return next;
    });
  }, [mergeSourcesText, setRawText]);

  const clearSources = useCallback(() => {
    setSources([]);
    setRawText('');
    setFileName(null);
  }, [setRawText]);

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);

    // Small delay to show loading state for UX
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const requiredDateFields = FIELD_CONFIG.filter(f => f.section === 'dates' && f.required);
      const requiredIssues = requiredDateFields
        .map(field => {
          const value = (editableFields as Record<string, string>)[field.key] || '';
          const validation = getDateValidation(value, true);
          return { field: field.key, valid: validation.valid, message: validation.message };
        })
        .filter(issue => !issue.valid);

      const orderIssues = getDateOrderIssues(editableFields as Record<string, string | undefined>)
        .filter(issue => issue.severity === 'blocking');

      if (requiredIssues.length > 0 || orderIssues.length > 0) {
        showToast('Fix required date fields before analysis.', 'error');
        setAnalyzing(false);
        return;
      }

      // Core analysis - Zenith V5 Forensic Engine
      const normalizedFields = normalizeCreditFields(editableFields) as CreditFields;
      const { flags: detectedFlags, riskProfile: profile } = runComprehensiveAnalysis(normalizedFields, {
        stateCode: normalizedFields.stateCode
      });

      // Update state with normalized fields to show corrections in UI
      setEditableFields(normalizedFields);
      setFlags(detectedFlags);
      setRiskProfile(profile);

      // Fetch relevant case law
      const law = getRelevantCaseLaw(detectedFlags.map(f => f.ruleId));
      setRelevantCaseLaw(law);

      // Revolutionary features computation with individual error handling
      // 1. Score Impact Estimation
      try {
        const baseScore = estimateBaseScore(editableFields, detectedFlags);
        const impact = estimateScoreImpact(editableFields, detectedFlags, baseScore);
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
        const impact = assessImpact(detectedFlags, editableFields);
        setImpactAssessment(impact);
      } catch (e) {
        console.warn('Damage estimation failed:', e);
      }

      setActiveTab('violations');
      setStep(4);

      // Save to history
      try {
        await saveAnalysis(editableFields, detectedFlags, profile, fileName || undefined);
        const latestHistory = await getAllHistory();
        setHistory(latestHistory);
      } catch (e) {
        console.warn('Failed to save to history:', e);
      }

      showToast(`Analysis complete: ${detectedFlags.length} violations found`, detectedFlags.length > 0 ? 'info' : 'success');

      if (detectedFlags.length > 0) {
        setShowCelebration(true);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      showToast('Analysis failed. Please check your input data.', 'error');
    } finally {
      setAnalyzing(false);
    }
  }, [
    editableFields,
    fileName,
    showToast,
    setAnalyzing,
    setFlags,
    setRiskProfile,
    setRelevantCaseLaw,
    setScoreImpact,
    setDeadlines,
    setCollectorMatch,
    setMetro2Validation,
    setImpactAssessment,
    setActiveTab,
    setStep,
    setHistory,
    setShowCelebration
  ]);

  const loadFromHistory = useCallback((record: AnalysisRecord) => {
    if (step === 4 && editableFields.dofd) {
      // If already analyzing, perform delta comparison
      const forensicDeltas = compareReports(record.fields, editableFields);
      setDeltas(forensicDeltas);
      setSeriesInsights(compareReportSeries(history, editableFields));
      setSeriesSnapshots(buildReportSeries(history, editableFields));
      setSeriesOptions(buildReportSeriesOptions(history, editableFields));
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
  }, [
    step,
    editableFields,
    history,
    setDeltas,
    setSeriesInsights,
    setSeriesSnapshots,
    setSeriesOptions,
    setActiveTab,
    setShowHistory,
    setEditableFields,
    setFlags,
    setRiskProfile,
    setFileName,
    setStep
  ]);

  useEffect(() => {
    setSeriesInsights(compareReportSeries(history, editableFields));
    setSeriesSnapshots(buildReportSeries(history, editableFields));
    setSeriesOptions(buildReportSeriesOptions(history, editableFields));
  }, [history, editableFields]);

  const handleCompareSnapshots = useCallback((olderId: string, newerId: string) => {
    const lookup = new Map(seriesOptions.map(option => [option.id, option.fields]));
    const older = lookup.get(olderId);
    const newer = lookup.get(newerId);
    if (!older || !newer) return;
    setDeltas(compareReports(older, newer));
    setActiveTab('deltas');
  }, [seriesOptions]);

  const removeFromHistory = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAnalysis(id);
    setHistory(getHistory());
  }, []);

  const handleExportHistory = useCallback(() => {
    const data = exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `credit-analyzer-history-${stamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImportHistory = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const added = importHistory(text);
      setHistory(getHistory());
      showToast(`Imported ${added} record${added === 1 ? '' : 's'}.`, added > 0 ? 'success' : 'info');
    } catch (error) {
      console.error('History import failed:', error);
      showToast('Unable to import history file.', 'error');
    }
  }, [showToast]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
    setShowHistory(false);
    showToast('History cleared.', 'info');
  }, [showToast]);

  const downloadDocument = useCallback(async (type: 'bureau' | 'validation' | 'cfpb' | 'summary', format: 'pdf' | 'txt' = 'pdf') => {
    let content = '';
    let filename = '';
    
    switch (type) {
      case 'bureau':
        content = generateBureauLetter(editableFields, flags, consumer);
        filename = `dispute_letter_bureau.${format === 'pdf' ? 'pdf' : 'txt'}`;
        break;
      case 'validation':
        content = generateValidationLetter(editableFields, flags, consumer);
        filename = `debt_validation_request.${format === 'pdf' ? 'pdf' : 'txt'}`;
        break;
      case 'cfpb':
        content = generateCFPBNarrative(editableFields, flags, consumer);
        filename = `cfpb_complaint_narrative.${format === 'pdf' ? 'pdf' : 'txt'}`;
        break;
      case 'summary':
        content = await generateCaseSummary(editableFields, flags, riskProfile!, consumer);
        filename = `case_analysis_summary.${format === 'pdf' ? 'pdf' : 'txt'}`;
        break;
    }

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

  const downloadTextFile = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadPdfFile = useCallback((content: string, filename: string) => {
    const blob = generatePDFBlob(content);
    saveAs(blob, filename);
  }, []);

  const downloadForensicReport = useCallback(() => {
    if (!riskProfile) return;
    const blob = generateForensicReportBlob(
      editableFields,
      flags,
      riskProfile,
      relevantCaseLaw,
      consumer,
      discoveryAnswers
    );
    saveAs(blob, 'forensic_investigation_report.pdf');
    showToast('Institutional report generated successfully.', 'success');
  }, [editableFields, flags, riskProfile, relevantCaseLaw, consumer, discoveryAnswers, showToast]);

  const downloadAnalysisJson = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      fileName,
      consumer,
      fields: editableFields,
      flags,
      riskProfile,
      discoveryAnswers,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'credit-analysis.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [consumer, discoveryAnswers, editableFields, fileName, flags, riskProfile]);

  const buildCaseBundleSections = useCallback(() => {
    const consumerDetails = {
      name: consumer.name || '',
      address: consumer.address || '',
      city: '',
      state: consumer.state || '',
      zip: ''
    };

    return [
      { title: 'Bureau Dispute Letter', content: generateBureauLetter(editableFields, flags, consumer) },
      { title: 'Debt Validation Request', content: generateValidationLetter(editableFields, flags, consumer) },
      { title: 'CFPB Complaint Narrative', content: generateCFPBNarrative(editableFields, flags, consumer) },
      { title: 'Case Summary', content: generateCaseSummary(editableFields, flags, riskProfile!, consumer) },
      { title: 'Cease and Desist Letter', content: generateCeaseDesistLetter(editableFields, consumerDetails, flags.map(f => f.explanation)) },
      { title: 'Intent to Sue Letter', content: generateIntentToSueLetter(editableFields, flags, consumerDetails) },
      { title: 'Evidence Package', content: formatEvidencePackage(buildEvidencePackage(editableFields, flags, riskProfile!, consumerDetails.name, consumerDetails.state)) },
      { title: 'Attorney Package', content: formatAttorneyPackage(buildAttorneyPackage(editableFields, flags, riskProfile!, consumerDetails)) },
      { title: 'Redacted Attorney Package', content: formatRedactedAttorneyPackage(buildAttorneyPackage(editableFields, flags, riskProfile!, consumerDetails)) }
    ];
  }, [
    consumer,
    editableFields,
    flags,
    riskProfile
  ]);

  const downloadCaseBundle = useCallback(() => {
    const sections = buildCaseBundleSections();
    const bundle = sections
      .map(section => `===== ${section.title} =====\n\n${section.content}`)
      .join('\n\n\n');

    downloadTextFile(bundle, 'credit-case-bundle.txt');
  }, [buildCaseBundleSections, downloadTextFile]);

  const downloadCaseBundleZip = useCallback(async () => {
    if (isBundling) return;
    setIsBundling(true);
    showToast('Preparing case bundle ZIP...', 'info');

    try {
      const sections = buildCaseBundleSections();
      const zip = new JSZip();
      sections.forEach((section) => {
        const safeName = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        zip.file(`${safeName}.txt`, section.content);
      });
      const pdfFolder = zip.folder('pdf');
      if (pdfFolder) {
        sections.forEach((section) => {
          const safeName = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          pdfFolder.file(`${safeName}.pdf`, generatePDFBlob(section.content) as unknown as string);
        });
        if (riskProfile) {
          pdfFolder.file(
            'forensic_investigation_report.pdf',
            generateForensicReportBlob(editableFields, flags, riskProfile, relevantCaseLaw, consumer, discoveryAnswers)
          );
        }
      }
      zip.file('README.txt', [
        'Credit Report Analyzer - Case Bundle',
        `Exported: ${new Date().toLocaleString()}`,
        '',
        'Contents:',
        '- TXT files: human-readable letters and packages',
        '- pdf/: PDF versions of each document',
        '- case-metadata.json: structured data snapshot',
        '',
        'All processing is local to your device.'
      ].join('\n'));
      zip.file('case-metadata.json', JSON.stringify({
        exportedAt: new Date().toISOString(),
        fileName,
        consumer,
        fields: editableFields,
        flags,
        riskProfile,
        discoveryAnswers
      }, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'credit-case-bundle.zip');
      showToast('ZIP ready for download.', 'success');
    } catch (error) {
      console.error('ZIP generation failed:', error);
      showToast('Failed to generate ZIP. Please try again.', 'error');
    } finally {
      setIsBundling(false);
    }
  }, [buildCaseBundleSections, consumer, discoveryAnswers, editableFields, fileName, flags, isBundling, relevantCaseLaw, riskProfile, showToast]);

  const handleReset = useCallback(() => {
    resetApp();
    setFileName(null);
    setSources([]);
    setAnalyzedAccounts([]);
    setSelectedAccountId(null);
    setExpandedCard(null);
  }, [resetApp]);

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
                generateForensicReport={generateForensicReport}
                selectedLetterType={selectedLetterType}
                setSelectedLetterType={setSelectedLetterType}
                editableLetter={editableLetter}
                setEditableLetter={setEditableLetter}
                generatePDFLetter={generatePDFLetter}
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
