'use client';

import { useState, useCallback, useMemo } from 'react';
import { 
  parseCreditReport, 
  fieldsToSimple, 
  parseMultipleAccounts, 
  ParsedFields 
} from '../lib/parser';
import { 
  runComprehensiveAnalysis, 
  runBatchAnalysis 
} from '../lib/forensic-engine';
import { 
  CreditFields, 
  RuleFlag, 
  RiskProfile, 
  AnalyzedAccount 
} from '../lib/types';
import { 
  getRelevantCaseLaw, 
  CaseLaw 
} from '../lib/caselaw';
import {
  buildTimeline,
  calculateScoreBreakdown,
  detectPatterns,
  generateActionItems,
  calculateForensicMetrics,
  generateExecutiveSummary,
  ForensicSummary,
} from '../lib/analytics';
import {
  saveAnalysis,
  getAllHistory,
} from '../lib/storage';
import {
  estimateScoreImpact,
  estimateBaseScore,
  ScoreImpactEstimate
} from '../lib/score-impact';
import {
  buildDeadlineTracker,
  DeadlineTracker
} from '../lib/countdown';
import {
  findCollector,
  CollectorMatch
} from '../lib/collector-database';
import {
  assessImpact,
  ImpactAssessment
} from '../lib/evidence-builder';
import {
  validateMetro2,
  Metro2ValidationResult
} from '../lib/metro2-validator';
import { 
  FIELD_CONFIG 
} from '../lib/constants';
import { 
  getDateValidation, 
  getDateOrderIssues, 
  normalizeCreditFields 
} from '../lib/validation';

import { 
  compareReports, 
  compareReportSeries, 
  buildReportSeries, 
  buildReportSeriesOptions, 
  DeltaResult, 
  SeriesInsight, 
  SeriesSnapshot, 
  SeriesSnapshotOption 
} from '../lib/delta';

export function useForensicAnalysis(
  editableFields: CreditFields,  flags: RuleFlag[],  fileName: string | null,
  setStep: (step: any) => void,
  setRawText: (text: string) => void,
  setFileName: (name: string | null) => void,
  setFlags: (flags: RuleFlag[]) => void,
  setRiskProfile: (profile: RiskProfile | null) => void,
  setEditableFields: (fields: CreditFields) => void,
  setAnalyzing: (loading: boolean) => void,
  setHistory: (history: any[]) => void,
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void,
  setActiveTab: (tab: any) => void,
  history: AnalysisRecord[],
  setShowHistory: (show: boolean) => void,
  step: number
) {
  // forensic states
  const [analyzedAccounts, setAnalyzedAccounts] = useState<AnalyzedAccount[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<ForensicSummary | null>(null);
  const [relevantCaseLaw, setRelevantCaseLaw] = useState<CaseLaw[]>([]);
  const [scoreImpact, setScoreImpact] = useState<ScoreImpactEstimate | null>(null);
  const [deadlines, setDeadlines] = useState<DeadlineTracker | null>(null);
  const [collectorMatch, setCollectorMatch] = useState<CollectorMatch | null>(null);
  const [metro2Validation, setMetro2Validation] = useState<Metro2ValidationResult | null>(null);
  const [impactAssessment, setImpactAssessment] = useState<ImpactAssessment | null>(null);
  const [activeParsedFields, setActiveParsedFields] = useState<ParsedFields | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Delta states
  const [deltas, setDeltas] = useState<DeltaResult[]>([]);

  const analytics = useMemo(() => {
    if (step < 4) return null;
    return {
      metrics: calculateForensicMetrics(editableFields),
      patterns: detectPatterns(editableFields, flags),
      timeline: buildTimeline(editableFields, flags),
      breakdown: calculateScoreBreakdown(editableFields, flags),
      actions: generateActionItems(editableFields, flags)
    };
  }, [editableFields, flags, step]);
  const [seriesInsights, setSeriesInsights] = useState<SeriesInsight[]>([]);
  const [seriesSnapshots, setSeriesSnapshotList] = useState<SeriesSnapshot[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesSnapshotOption[]>([]);

  // Update series analytics when history changes
  useEffect(() => {
    setSeriesInsights(compareReportSeries(history, editableFields));
    setSeriesSnapshotList(buildReportSeries(history, editableFields));
    setSeriesOptions(buildReportSeriesOptions(history, editableFields));
  }, [history, editableFields]);

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
  }, [
    step,
    editableFields,
    setDeltas,
    setActiveTab,
    setShowHistory,
    setEditableFields,
    setFlags,
    setRiskProfile,
    setFileName,
    setStep
  ]);

  const handleCompareSnapshots = useCallback((olderId: string, newerId: string) => {
    const lookup = new Map(seriesOptions.map(option => [option.id, option.fields]));
    const older = lookup.get(olderId);
    const newer = lookup.get(newerId);
    if (!older || !newer) return;
    setDeltas(compareReports(older, newer));
    setActiveTab('deltas');
  }, [seriesOptions]);

  const analyzeText = useCallback((text: string, sourceFileName?: string) => {
    setRawText(text);
    if (sourceFileName) {
      setFileName(sourceFileName);
    }
    setFlags([]);
    setRiskProfile(null);
    setRelevantCaseLaw([]);
    setScoreImpact(null);
    setDeadlines(null);
    setCollectorMatch(null);
    setMetro2Validation(null);
    setImpactAssessment(null);
    setActiveTab('violations');

    if (text.trim().length < 40) {
      showToast('Input looks short. Paste the full account section for best results.', 'info');
    }

    const accounts = parseMultipleAccounts(text);
    if (accounts.length > 1) {
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
      
      const allFlags = [...analyzed.flatMap(acc => acc.flags), ...batchResult.globalFlags];
      setFlags(allFlags);

      if (allFlags.length > 0) {
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
    setRawText,
    setFileName,
    setFlags,
    setRiskProfile,
    setActiveTab,
    showToast,
    setStep,
    setEditableFields
  ]);

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
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

      const normalizedFields = normalizeCreditFields(editableFields) as CreditFields;
      const { flags: detectedFlags, riskProfile: profile } = runComprehensiveAnalysis(normalizedFields, {
        stateCode: normalizedFields.stateCode
      });

      setEditableFields(normalizedFields);
      setFlags(detectedFlags);
      setRiskProfile(profile);

      const law = getRelevantCaseLaw(detectedFlags.map(f => f.ruleId));
      setRelevantCaseLaw(law);

      try {
        const baseScore = estimateBaseScore(editableFields, detectedFlags);
        const impact = estimateScoreImpact(editableFields, detectedFlags, baseScore);
        setScoreImpact(impact);
      } catch (e) { console.warn('Score impact estimation failed:', e); }

      try {
        const tracker = buildDeadlineTracker(editableFields);
        setDeadlines(tracker);
      } catch (e) { console.warn('Deadline tracking failed:', e); }

      try {
        const collector = findCollector(editableFields.furnisherOrCollector || '');
        setCollectorMatch(collector);
      } catch (e) { console.warn('Collector lookup failed:', e); }

      try {
        const metro2Result = validateMetro2(editableFields);
        setMetro2Validation(metro2Result);
      } catch (e) { console.warn('Metro 2 validation failed:', e); }

      try {
        const impact = assessImpact(detectedFlags, editableFields);
        setImpactAssessment(impact);
      } catch (e) { console.warn('Damage estimation failed:', e); }

      setActiveTab('violations');
      setStep(4);

      try {
        await saveAnalysis(editableFields, detectedFlags, profile, fileName || undefined);
        const latestHistory = await getAllHistory();
        setHistory(latestHistory);
      } catch (e) { console.warn('Failed to save to history:', e); }

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
    setAnalyzing,
    setEditableFields,
    setFlags,
    setRiskProfile,
    setActiveTab,
    setStep,
    setHistory,
    showToast
  ]);

  return {
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
  };
}
