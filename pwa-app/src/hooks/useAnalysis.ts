'use client';

import { useState, useCallback, useMemo } from 'react';
import { CreditFields, RuleFlag, RiskProfile, runRules, calculateRiskProfile } from '../lib/rules';
import { getRelevantCaseLaw, CaseLaw } from '../lib/caselaw';
import { estimateScoreImpact, ScoreImpactEstimate } from '../lib/score-impact';
import { buildDeadlineTracker, DeadlineTracker } from '../lib/countdown';
import { findCollector, CollectorMatch } from '../lib/collector-database';
import { validateMetro2, Metro2ValidationResult } from '../lib/metro2-validator';
import { assessImpact } from '../lib/evidence-builder';
import { ForensicImpactAssessment } from '../lib/impact-assessment-engine';
import { saveAnalysis, getHistory, AnalysisRecord } from '../lib/storage';
import {
  buildTimeline,
  calculateScoreBreakdown,
  detectPatterns,
  generateActionItems,
  calculateForensicMetrics,
  TimelineEvent,
  ScoreBreakdown,
  PatternInsight,
} from '../lib/analytics';

export interface AnalysisState {
  flags: RuleFlag[];
  riskProfile: RiskProfile | null;
  caseLaw: CaseLaw[];
  scoreImpact: ScoreImpactEstimate | null;
  deadlines: DeadlineTracker | null;
  collectorMatch: CollectorMatch | null;
  metro2Validation: Metro2ValidationResult | null;
  impactAssessment: ForensicImpactAssessment | null;
  isAnalyzing: boolean;
  errors: AnalysisError[];
}

export interface AnalysisError {
  feature: string;
  message: string;
  recoverable: boolean;
}

export interface AnalyticsData {
  timeline: TimelineEvent[];
  breakdown: ScoreBreakdown;
  patterns: PatternInsight[];
  actions: ReturnType<typeof generateActionItems>;
  metrics: ReturnType<typeof calculateForensicMetrics>;
}

export interface UseAnalysisReturn {
  state: AnalysisState;
  analytics: AnalyticsData | null;
  issuesByPriority: {
    high: RuleFlag[];
    medium: RuleFlag[];
    low: RuleFlag[];
  };
  runAnalysis: (fields: CreditFields, fileName?: string) => Promise<void>;
  clearAnalysis: () => void;
  history: AnalysisRecord[];
  loadFromHistory: (record: AnalysisRecord) => void;
}

const initialState: AnalysisState = {
  flags: [],
  riskProfile: null,
  caseLaw: [],
  scoreImpact: null,
  deadlines: null,
  collectorMatch: null,
  metro2Validation: null,
  impactAssessment: null,
  isAnalyzing: false,
  errors: [],
};

/**
 * Custom hook for managing credit report analysis state and operations
 * Extracts complex analysis logic from the main component
 */
export function useAnalysis(): UseAnalysisReturn {
  const [state, setState] = useState<AnalysisState>(initialState);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);

  // Load history on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      setHistory(getHistory());
    }
  });

  // Computed analytics
  const analytics = useMemo((): AnalyticsData | null => {
    if (!state.riskProfile || state.flags.length === 0) return null;

    // We need editableFields for this - this hook would need to receive it
    // For now, return null and let the component compute this
    return null;
  }, [state.riskProfile, state.flags]);

  // Issues by priority (memoized)
  const issuesByPriority = useMemo(() => ({
    high: state.flags.filter(f => f.severity === 'high'),
    medium: state.flags.filter(f => f.severity === 'medium'),
    low: state.flags.filter(f => f.severity === 'low'),
  }), [state.flags]);

  // Main analysis function
  const runAnalysis = useCallback(async (fields: CreditFields, fileName?: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true, errors: [] }));

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));

    const errors: AnalysisError[] = [];

    try {
      // Core analysis (required)
      const detectedFlags = runRules(fields);
      const profile = calculateRiskProfile(detectedFlags, fields);
      const law = getRelevantCaseLaw(detectedFlags.map(f => f.ruleId));

      // Optional features with individual error handling
      let scoreImpact: ScoreImpactEstimate | null = null;
      let deadlines: DeadlineTracker | null = null;
      let collectorMatch: CollectorMatch | null = null;
      let metro2Validation: Metro2ValidationResult | null = null;
      let impactAssessment: ImpactAssessment | null = null;

      // Score Impact
      try {
        const currentScore = 620; // Default estimate
        scoreImpact = estimateScoreImpact(fields, detectedFlags, currentScore);
      } catch (e) {
        errors.push({
          feature: 'Score Impact',
          message: e instanceof Error ? e.message : 'Failed to estimate score impact',
          recoverable: true,
        });
      }

      // Deadline Tracking
      try {
        deadlines = buildDeadlineTracker(fields);
      } catch (e) {
        errors.push({
          feature: 'Deadline Tracking',
          message: e instanceof Error ? e.message : 'Failed to build deadline tracker',
          recoverable: true,
        });
      }

      // Collector Intelligence
      try {
        collectorMatch = findCollector(fields.furnisherOrCollector || '');
      } catch (e) {
        errors.push({
          feature: 'Collector Intel',
          message: e instanceof Error ? e.message : 'Failed to lookup collector',
          recoverable: true,
        });
      }

      // Metro 2 Validation
      try {
        metro2Validation = validateMetro2(fields);
      } catch (e) {
        errors.push({
          feature: 'Metro 2 Validation',
          message: e instanceof Error ? e.message : 'Failed to validate Metro 2',
          recoverable: true,
        });
      }

      // Impact Assessment
      try {
        impactAssessment = assessImpact(detectedFlags, fields);
      } catch (e) {
        errors.push({
          feature: 'Impact Assessment',
          message: e instanceof Error ? e.message : 'Failed to assess impact',
          recoverable: true,
        });
      }

      // Save to history
      try {
        saveAnalysis(fields, detectedFlags, profile, fileName);
        setHistory(getHistory());
      } catch (e) {
        console.warn('Failed to save to history:', e);
      }

      setState({
        flags: detectedFlags,
        riskProfile: profile,
        caseLaw: law,
        scoreImpact,
        deadlines,
        collectorMatch,
        metro2Validation,
        impactAssessment,
        isAnalyzing: false,
        errors,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        errors: [{
          feature: 'Core Analysis',
          message: error instanceof Error ? error.message : 'Analysis failed',
          recoverable: false,
        }],
      }));
      throw error;
    }
  }, []);

  // Clear analysis state
  const clearAnalysis = useCallback(() => {
    setState(initialState);
  }, []);

  // Load from history
  const loadFromHistory = useCallback((record: AnalysisRecord) => {
    setState(prev => ({
      ...prev,
      flags: record.flags,
      riskProfile: record.riskProfile,
      caseLaw: [],
      scoreImpact: null,
      deadlines: null,
      collectorMatch: null,
      metro2Validation: null,
      impactAssessment: null,
      errors: [],
    }));
  }, []);

  return {
    state,
    analytics,
    issuesByPriority,
    runAnalysis,
    clearAnalysis,
    history,
    loadFromHistory,
  };
}

export default useAnalysis;
