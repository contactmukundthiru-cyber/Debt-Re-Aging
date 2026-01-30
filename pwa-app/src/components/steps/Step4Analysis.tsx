'use client';

import React, { useEffect, useState } from 'react';
import { ANALYSIS_TABS, TabId, LetterType } from '../../lib/constants';
import { SeriesInsight, SeriesSnapshot, SeriesSnapshotOption, computeExpectedRemovalDate } from '../../lib/delta';
import { parseDate } from '../../lib/rules';
import { estimateOutcomeProbability, BureauWeights } from '../../lib/outcome-probability';
import { exportComparisonDossier, exportComparisonCsv } from '../../lib/delta';
import { exportComparisonDossierPdf, buildComparisonDossierPdfBlob } from '../../lib/dossier-pdf';
import { GuideOverlay } from '../GuideOverlay';
import { RuleFlag, RiskProfile, CreditFields } from '../../lib/types';
import { CaseLaw } from '../../lib/caselaw';
import { TimelineEvent, PatternInsight } from '../../lib/analytics';
import { DeltaResult } from '../../lib/delta';
import {
  generateBureauLetter,
  generateValidationLetter,
  generateFurnisherLetter,
  generateCeaseDesistLetter,
  generateIntentToSueLetter,
  ConsumerInfo
} from '../../lib/generator';

// Standard Tab Components
import ViolationsTab from './analysis/ViolationsTab';
import DeltasTab from './analysis/DeltasTab';
import TimelineTab from './analysis/TimelineTab';
import CaseLawTab from './analysis/CaseLawTab';
import LetterEditorTab from './analysis/LetterEditorTab';
import DiscoveryTab from './analysis/DiscoveryTab';
import ForensicLabTab from './analysis/ForensicLabTab';
import NarrativeTab from './analysis/NarrativeTab';

// Premium / New Tab Components
import AIAnalysisTab from './analysis/AIAnalysisTab';
import MultiBureauTab from './analysis/MultiBureauTab';
import ScoreSimulatorTab from './analysis/ScoreSimulatorTab';
import EvidenceManagerTab from './analysis/EvidenceManagerTab';
import WorkflowTrackerTab from './analysis/WorkflowTrackerTab';
import VoiceTranscriptionTab from './analysis/VoiceTranscriptionTab';
import StatuteTrackerTab from './analysis/StatuteTrackerTab';
import TacticalSimulatorTab from './analysis/TacticalSimulatorTab';
import LiabilityRadarTab from './analysis/LiabilityRadarTab';
import LegalEscalationTab from './analysis/LegalEscalationTab';
import Metro2AuditTab from './analysis/Metro2AuditTab';
import MasterActionPlanTab from './analysis/MasterActionPlanTab';
import AdversarialMazeTab from './analysis/AdversarialMazeTab';
import LegalShieldTab from './analysis/LegalShieldTab';
import CaseSummaryDashboard from './analysis/CaseSummaryDashboard';
import CaseBriefTab from './analysis/CaseBriefTab';
import DeadlinesTab from './analysis/DeadlinesTab';
import ReviewMissionTab from './analysis/ReviewMissionTab';
import { getSmartRecommendations } from '../../lib/intelligence';

interface ComparisonWizardProps {
  options: SeriesSnapshotOption[];
  onCompare?: (olderId: string, newerId: string) => void;
  onAutoCompare?: () => void;
  onExportBundle?: () => void;
}

const ComparisonWizard: React.FC<ComparisonWizardProps> = ({ options, onCompare, onAutoCompare, onExportBundle }) => {
  const [olderId, setOlderId] = useState(options[0]?.id || '');
  const [newerId, setNewerId] = useState(options[options.length - 1]?.id || '');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-[10px] uppercase tracking-widest text-indigo-500/80">
          Older Snapshot
          <select
            className="mt-2 input rounded-xl bg-white/80"
            value={olderId}
            onChange={(e) => setOlderId(e.target.value)}
          >
            {options.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}{option.isCurrent ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] uppercase tracking-widest text-indigo-500/80">
          Newer Snapshot
          <select
            className="mt-2 input rounded-xl bg-white/80"
            value={newerId}
            onChange={(e) => setNewerId(e.target.value)}
          >
            {options.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}{option.isCurrent ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        className="btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
        onClick={() => {
          if (olderId && newerId && onCompare) {
            onCompare(olderId, newerId);
          }
        }}
      >
        Compare Snapshots
      </button>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          onClick={onAutoCompare}
        >
          Auto Compare Oldest vs Latest
        </button>
        <button
          type="button"
          className="btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          onClick={onExportBundle}
        >
          Export Dossier Bundle
        </button>
      </div>
    </div>
  );
};


interface AnalyticsMetric {
  value: string | number;
  status: 'critical' | 'warning' | 'normal';
}

interface ActionItem {
  priority: 'immediate' | 'standard' | 'optional';
  action: string;
  reason: string;
}

interface Analytics {
  metrics: Record<string, AnalyticsMetric>;
  patterns: PatternInsight[];
  timeline: TimelineEvent[];
  breakdown: { category: string; score: number; maxScore: number; factors: string[] }[];
  actions: ActionItem[];
}

interface Step4AnalysisProps {
  flags: RuleFlag[];
  riskProfile: RiskProfile;
  editableFields: Partial<CreditFields>;
  rawText: string;
  consumer: ConsumerInfo;
  discoveryAnswers: Record<string, string>;
  setDiscoveryAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeTab: TabId;
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;

  expandedCard: number | null;
  setExpandedCard: (id: number | null) => void;
  deltas: DeltaResult[];
  seriesInsights?: SeriesInsight[];
  seriesSnapshots?: SeriesSnapshot[];
  seriesOptions?: SeriesSnapshotOption[];
  onCompareSnapshots?: (olderId: string, newerId: string) => void;
  relevantCaseLaw: CaseLaw[];
  analytics: Analytics | null;
  tabsRef: React.RefObject<HTMLDivElement>;
  translate: (key: string) => string;
  generateForensicReport: (
    fields: Partial<CreditFields>,
    flags: RuleFlag[],
    risk: RiskProfile,
    caseLaw: CaseLaw[],
    consumer: ConsumerInfo,
    discoveryAnswers: Record<string, string>
  ) => void;
  selectedLetterType: LetterType;
  setSelectedLetterType: React.Dispatch<React.SetStateAction<LetterType>>;
  editableLetter: string;
  setEditableLetter: (text: string) => void;
  generatePDFLetter: (content: string, filename: string) => void;
}

const Step4Analysis: React.FC<Step4AnalysisProps> = ({
  flags,
  riskProfile,
  editableFields,
  rawText,
  consumer,
  discoveryAnswers,
  setDiscoveryAnswers,
  activeTab,
  setActiveTab,
  expandedCard,
  setExpandedCard,
  deltas,
  seriesInsights,
  seriesSnapshots,
  seriesOptions,
  onCompareSnapshots,
  relevantCaseLaw,
  analytics,
  tabsRef,
  translate,
  generateForensicReport,
  selectedLetterType,
  setSelectedLetterType,
  editableLetter,
  setEditableLetter,
  generatePDFLetter
}) => {
  const [showGuide, setShowGuide] = useState(true);

  const issuesByPriority = {
    high: flags.filter(f => f.severity === 'high'),
    medium: flags.filter(f => f.severity === 'medium'),
    low: flags.filter(f => f.severity === 'low'),
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: string) => {
    const currentIndex = ANALYSIS_TABS.findIndex(t => t.id === currentTab);
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = currentIndex < ANALYSIS_TABS.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : ANALYSIS_TABS.length - 1;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = ANALYSIS_TABS.length - 1;
    }

    if (newIndex !== currentIndex) {
      const newTab = ANALYSIS_TABS[newIndex].id;
      setActiveTab(newTab);
      // Focus the new tab button
      setTimeout(() => {
        const buttons = tabsRef.current?.querySelectorAll('button[role="tab"]');
        if (buttons && buttons[newIndex]) {
          (buttons[newIndex] as HTMLButtonElement).focus();
        }
      }, 0);
    }
  };

  useEffect(() => {
    if (flags.length > 0) {
      const generators: Record<string, () => string> = {
        bureau: () => generateBureauLetter(editableFields, flags, consumer),
        validation: () => generateValidationLetter(editableFields, flags, consumer),
        furnisher: () => generateFurnisherLetter(editableFields, flags, consumer),
        cease_desist: () => generateCeaseDesistLetter(editableFields, flags, consumer),
        intent_to_sue: () => generateIntentToSueLetter(editableFields, flags, consumer, riskProfile),
      };

      const generator = generators[selectedLetterType];
      if (generator) {
        setEditableLetter(generator());
      }
    }
  }, [selectedLetterType, flags, editableFields, consumer, riskProfile, setEditableLetter]);

  const totalPossibleEvidence = Array.from(new Set(flags.flatMap(f => f.suggestedEvidence))).length;
  const checkedEvidenceCount = Object.keys(discoveryAnswers).filter(k => k.startsWith('ev-') && discoveryAnswers[k] === 'checked').length;
  const readiness = totalPossibleEvidence > 0 ? Math.round((checkedEvidenceCount / totalPossibleEvidence) * 100) : 0;
  const smartRecommendations = React.useMemo(() => getSmartRecommendations(editableFields), [editableFields]);
  const [bureauWeights, setBureauWeights] = useState<BureauWeights>({
    experian: 1.0,
    equifax: 1.0,
    transunion: 1.0
  });
  const outcomeProbability = React.useMemo(
    () => estimateOutcomeProbability(flags, riskProfile, readiness, editableFields.bureau, bureauWeights),
    [flags, readiness, riskProfile, editableFields.bureau, bureauWeights]
  );
  const highSeverityCount = flags.filter(flag => flag.severity === 'high' || flag.severity === 'critical').length;
  const negativeDeltaCount = deltas.filter(delta => delta.impact === 'negative').length;
  const seriesCount = seriesInsights?.length || 0;
  const signalScore = Math.min(100, Math.max(20, Math.round(40 + highSeverityCount * 6 + seriesCount * 4 + negativeDeltaCount * 3 + readiness * 0.2)));
  const expectedRemoval = computeExpectedRemovalDate(editableFields.dofd, editableFields.bureau);
  const removalDeltaDays = (() => {
    if (!expectedRemoval || !editableFields.estimatedRemovalDate) return null;
    const removalDate = new Date(editableFields.estimatedRemovalDate);
    if (Number.isNaN(removalDate.getTime())) return null;
    return Math.round((removalDate.getTime() - expectedRemoval.expected.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const timelineIssues = React.useMemo(() => {
    const issues: Array<{ id: string; severity: 'blocking' | 'warning'; title: string; description: string; field?: string }> = [];
    const opened = parseDate(editableFields.dateOpened);
    const dofd = parseDate(editableFields.dofd);
    const chargeOff = parseDate(editableFields.chargeOffDate);
    const lastPayment = parseDate(editableFields.dateLastPayment);
    const reported = parseDate(editableFields.dateReportedOrUpdated);
    const removal = parseDate(editableFields.estimatedRemovalDate);

    if (opened && dofd && dofd < opened) {
      issues.push({
        id: 'opened-after-dofd',
        severity: 'blocking',
        title: 'DOFD before account opened',
        description: 'DOFD cannot be earlier than the account open date.',
        field: 'dofd'
      });
    }

    if (dofd && chargeOff && dofd > chargeOff) {
      issues.push({
        id: 'dofd-after-chargeoff',
        severity: 'blocking',
        title: 'DOFD after charge-off',
        description: 'First delinquency cannot occur after charge-off.',
        field: 'chargeOffDate'
      });
    }

    if (lastPayment && dofd && lastPayment > dofd) {
      issues.push({
        id: 'payment-after-dofd',
        severity: 'warning',
        title: 'Last payment after DOFD',
        description: 'Last payment occurs after the reported DOFD.',
        field: 'dateLastPayment'
      });
    }

    if (reported && removal && reported > removal) {
      issues.push({
        id: 'reported-after-removal',
        severity: 'warning',
        title: 'Reported after removal date',
        description: 'Reported date occurs after the estimated removal date.',
        field: 'dateReportedOrUpdated'
      });
    }

    if (opened && reported && reported < opened) {
      issues.push({
        id: 'reported-before-opened',
        severity: 'warning',
        title: 'Reported before account opened',
        description: 'Reported date precedes the open date.',
        field: 'dateReportedOrUpdated'
      });
    }

    if (expectedRemoval && removalDeltaDays !== null && removalDeltaDays > 30) {
      issues.push({
        id: 'removal-delta',
        severity: 'warning',
        title: 'Removal date exceeds expected window',
        description: `Removal date is ${removalDeltaDays} days beyond the expected FCRA window.`,
        field: 'estimatedRemovalDate'
      });
    }

    return issues;
  }, [editableFields, expectedRemoval, removalDeltaDays]);
  const timelineIntegrityScore = Math.max(
    20,
    100 - (timelineIssues.filter(issue => issue.severity === 'blocking').length * 20)
      - (timelineIssues.filter(issue => issue.severity === 'warning').length * 10)
  );
  const evidenceBySeverity = React.useMemo(() => {
    const levels: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
    return levels.map(level => {
      const evidence = Array.from(new Set(flags.filter(flag => flag.severity === level).flatMap(flag => flag.suggestedEvidence)));
      const checked = evidence.filter(item => discoveryAnswers[`ev-${item}`] === 'checked').length;
      return { level, total: evidence.length, checked };
    });
  }, [flags, discoveryAnswers]);

  const citationHighlights = React.useMemo(() => {
    return Array.from(new Set(flags.flatMap(flag => flag.legalCitations))).slice(0, 6);
  }, [flags]);

  const bureauPlaybook = React.useMemo(() => {
    const playbook: Record<string, string[]> = { experian: [], equifax: [], transunion: [], all: [] };
    flags.forEach(flag => {
      if (!flag.bureauTactics) return;
      if (flag.bureauTactics.all) playbook.all.push(flag.bureauTactics.all);
      if (flag.bureauTactics.experian) playbook.experian.push(flag.bureauTactics.experian);
      if (flag.bureauTactics.equifax) playbook.equifax.push(flag.bureauTactics.equifax);
      if (flag.bureauTactics.transunion) playbook.transunion.push(flag.bureauTactics.transunion);
    });
    return Object.fromEntries(Object.entries(playbook).map(([key, value]) => [key, Array.from(new Set(value)).slice(0, 3)]));
  }, [flags]);

  return (
    <div className="fade-in pb-20">
      {/* Evidence Readiness Header */}
      <div className="mb-10 p-6 glass-panel flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-900/5">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <div className="flex-grow">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-2">Litigation Readiness Score</h3>
            <div className="flex items-center gap-4">
              <div className="flex-grow h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-out ${readiness > 80 ? 'bg-emerald-500' : readiness > 40 ? 'bg-blue-500' : 'bg-slate-900 dark:bg-white'}`}
                  style={{ width: `${readiness}%` }}
                />
              </div>
              <span className="text-lg font-bold tabular-nums dark:text-white">{readiness}%</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('discovery')}
          className="btn btn-secondary !py-2.5 !px-6 !text-[10px] !uppercase !tracking-widest !font-bold !rounded-xl !border-slate-200 dark:!border-slate-800"
        >
          Conduct Audit
        </button>
      </div>

      {smartRecommendations.length > 0 && (
        <div className="mb-10 grid lg:grid-cols-[1.3fr_1fr] gap-6">
          <div className="premium-card p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Smart Recommendations</p>
                <h3 className="text-xl font-semibold dark:text-white">Auto-detected data conflicts</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">{smartRecommendations.length} signals</span>
            </div>
            <div className="space-y-4">
              {smartRecommendations.slice(0, 3).map(rec => (
                <div key={rec.id} className="flex items-start gap-4 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-4 bg-white/70 dark:bg-slate-900/40">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${rec.type === 'error' ? 'bg-rose-500/10 text-rose-500' : rec.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold dark:text-white">{rec.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{rec.description}</p>
                    {rec.suggestedValue && (
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2">Suggested: {rec.suggestedValue}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card p-6 border-rose-500/20 bg-rose-500/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-2">Resolution Path</p>
            <h3 className="text-xl font-semibold text-rose-900 mb-4">Fix the blockers fast</h3>
            <p className="text-sm text-rose-900/70 mb-4">Correct these fields before exporting letters to keep the
              dispute narrative airtight.</p>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-rose-600">
              <span className="px-3 py-1.5 rounded-full bg-rose-500/10">Step 3 Verification</span>
              <span className="px-3 py-1.5 rounded-full bg-rose-500/10">Evidence Audit</span>
            </div>
          </div>
        </div>
      )}

      {(flags.length > 0 || citationHighlights.length > 0) && (
        <div className="mb-10 grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <div className="premium-card p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Evidence Coverage</p>
                <h3 className="text-lg font-semibold dark:text-white">Gap analysis by severity</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">{checkedEvidenceCount}/{totalPossibleEvidence} items</span>
            </div>
            <div className="space-y-4">
              {evidenceBySeverity.map(item => (
                <div key={item.level} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{item.level}</p>
                    <p className="text-[11px] text-slate-500">{item.checked} of {item.total || 0} evidence items</p>
                  </div>
                  <div className="w-48 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${item.level === 'critical' ? 'bg-rose-500' : item.level === 'high' ? 'bg-amber-500' : item.level === 'medium' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                      style={{ width: `${item.total > 0 ? Math.round((item.checked / item.total) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card p-6 border-indigo-500/20 bg-indigo-500/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Strategic Playbook</p>
            <h3 className="text-lg font-semibold text-indigo-900 mb-4">Citations + bureau tactics</h3>
            <div className="space-y-3 text-sm text-indigo-900/70">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-indigo-500/80 mb-2">Top Citations</p>
                <div className="flex flex-wrap gap-2">
                  {citationHighlights.length > 0 ? citationHighlights.map(citation => (
                    <span key={citation} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white/70 text-indigo-700 border border-indigo-200/60">
                      {citation}
                    </span>
                  )) : (
                    <span className="text-xs text-indigo-900/60">No citations detected yet.</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-indigo-500/80 mb-2">Bureau Tactics</p>
                <ul className="text-xs text-indigo-900/70 space-y-1">
                  {Object.entries(bureauPlaybook).filter(([_, items]) => items.length > 0).map(([bureau, items]) => (
                    <li key={bureau}>
                      <strong className="uppercase">{bureau}</strong>: {items.join(' • ')}
                    </li>
                  ))}
                  {Object.values(bureauPlaybook).every(items => items.length === 0) && (
                    <li>No bureau-specific tactics surfaced yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10 grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="premium-card p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Outcome Probability</p>
              <h3 className="text-lg font-semibold dark:text-white">Projected success outlook</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{outcomeProbability.label.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-5 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest">Score</span>
              <strong className="text-xl">{outcomeProbability.score}%</strong>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${outcomeProbability.score >= 80 ? 'bg-emerald-500' : outcomeProbability.score >= 65 ? 'bg-blue-500' : outcomeProbability.score >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${outcomeProbability.score}%` }}
                />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-2">Model based on severity, readiness, and historical rule strength</p>
            </div>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            {outcomeProbability.factors.map((factor, idx) => (
              <li key={idx}>• {factor}</li>
            ))}
          </ul>
        </div>

        <div className="premium-card p-6 border-emerald-500/20 bg-emerald-500/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Acceleration Moves</p>
          <h3 className="text-lg font-semibold text-emerald-900 mb-4">Boost this score quickly</h3>
          <div className="space-y-3 text-sm text-emerald-900/70">
            <div className="flex items-center justify-between">
              <span>Finish evidence checklist</span>
              <strong>{readiness}%</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Resolve smart recommendations</span>
              <strong>{smartRecommendations.length}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>High-severity violations</span>
              <strong>{flags.filter(f => f.severity === 'high' || f.severity === 'critical').length}</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('discovery')}
            className="mt-5 btn btn-secondary !rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          >
            Improve Evidence
          </button>
        </div>
      </div>

      <div className="mb-10 grid lg:grid-cols-[1.3fr_1fr] gap-6">
        <div className="premium-card p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Forensic Signal Index</p>
              <h3 className="text-lg font-semibold dark:text-white">Strength of forensic signals</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{signalScore}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${signalScore}%` }} />
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-3 bg-white/70 dark:bg-slate-900/40">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">High Severity</p>
              <p className="text-lg font-semibold">{highSeverityCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-3 bg-white/70 dark:bg-slate-900/40">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Series Anomalies</p>
              <p className="text-lg font-semibold">{seriesCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-3 bg-white/70 dark:bg-slate-900/40">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Negative Deltas</p>
              <p className="text-lg font-semibold">{negativeDeltaCount}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Timeline Integrity</span>
            <span className="font-mono">{timelineIntegrityScore}%</span>
          </div>
        </div>

        <div className="premium-card p-6 border-amber-500/20 bg-amber-500/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">Legal Clock Analysis</p>
          <h3 className="text-lg font-semibold text-amber-900 mb-4">Removal date timing</h3>
          <div className="space-y-2 text-sm text-amber-900/70">
            <div className="flex items-center justify-between">
              <span>DOFD</span>
              <strong>{editableFields.dofd || '—'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Expected Removal</span>
              <strong>{expectedRemoval ? expectedRemoval.expected.toLocaleDateString('en-US') : '—'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Reported Removal</span>
              <strong>{editableFields.estimatedRemovalDate || '—'}</strong>
            </div>
            {removalDeltaDays !== null && (
              <div className="flex items-center justify-between">
                <span>Delta (days)</span>
                <strong className={removalDeltaDays > 30 ? 'text-rose-600' : 'text-emerald-600'}>
                  {removalDeltaDays > 0 ? `+${removalDeltaDays}` : removalDeltaDays}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {timelineIssues.length > 0 && (
        <div className="mb-10 premium-card p-6 bg-white/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Timeline Consistency Engine</p>
              <h3 className="text-lg font-semibold dark:text-white">Chronology validation</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{timelineIssues.length} issue(s)</span>
          </div>
          <div className="grid gap-3">
            {timelineIssues.map(issue => (
              <div key={issue.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-4 bg-white/70 dark:bg-slate-900/40">
                <div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full border ${
                    issue.severity === 'blocking' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {issue.severity}
                  </span>
                  <p className="text-sm font-semibold dark:text-white mt-2">{issue.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{issue.description}</p>
                </div>
                {issue.field && (
                  <button
                    type="button"
                    className="btn btn-secondary !rounded-xl !px-3 !py-2 !text-[10px] !uppercase !tracking-widest"
                    onClick={() => window.dispatchEvent(new CustomEvent('cra:focus-field', { detail: { field: issue.field } }))}
                  >
                    Fix Field
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-10 grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="premium-card p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bureau Calibration</p>
              <h3 className="text-lg font-semibold dark:text-white">Adjust probability weights</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">0.8x - 1.2x</span>
          </div>
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400">
            {(['experian', 'equifax', 'transunion'] as const).map(bureau => (
              <div key={bureau}>
                <div className="flex items-center justify-between mb-2">
                  <span className="uppercase tracking-widest">{bureau}</span>
                  <span className="font-mono">{bureauWeights[bureau].toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={1.2}
                  step={0.05}
                  value={bureauWeights[bureau]}
                  onChange={(e) => setBureauWeights(prev => ({ ...prev, [bureau]: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="premium-card p-6 border-indigo-500/20 bg-indigo-500/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Comparison Wizard</p>
          <h3 className="text-lg font-semibold text-indigo-900 mb-4">Select snapshots to compare</h3>
          {seriesOptions && seriesOptions.length > 1 ? (
            <ComparisonWizard
              options={seriesOptions}
              onCompare={onCompareSnapshots}
              onAutoCompare={() => {
                if (!seriesOptions || seriesOptions.length < 2 || !onCompareSnapshots) return;
                onCompareSnapshots(seriesOptions[0].id, seriesOptions[seriesOptions.length - 1].id);
              }}
              onExportBundle={async () => {
                const content = exportComparisonDossier(deltas, seriesInsights || [], seriesSnapshots || []);
                const csv = exportComparisonCsv(deltas);
                const pdfBlob = buildComparisonDossierPdfBlob(deltas, seriesInsights || [], seriesSnapshots || [], readiness);
                const JSZip = (await import('jszip')).default;
                const zip = new JSZip();
                zip.file('comparison_dossier.txt', content);
                zip.file('comparison_dossier.csv', csv);
                zip.file('comparison_dossier.pdf', pdfBlob);
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(zipBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'comparison_dossier_bundle.zip';
                link.click();
                URL.revokeObjectURL(url);
              }}
            />
          ) : (
            <p className="text-sm text-indigo-900/70">Add another report to history to unlock multi-snapshot comparison.</p>
          )}
        </div>
      </div>

      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter mb-1 text-white uppercase italic">Zenith Command Center</h2>
          <p className="text-slate-500 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Forensic analysis active • {flags.length} nodes identified
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button
            type="button"
            onClick={() => generateForensicReport(editableFields, flags, riskProfile, relevantCaseLaw, consumer, discoveryAnswers)}
            className="btn btn-primary !h-10 !px-6 !rounded-lg bg-white !text-slate-950 border-none shadow-xl shadow-white/5 hover:scale-[1.02] transition-transform flex items-center gap-2 !text-[10px] !font-black !uppercase !tracking-widest"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Export Dossier
          </button>
        </div>
      </div>

      <CaseSummaryDashboard
        flags={flags}
        riskProfile={riskProfile}
        readiness={readiness}
      />

      {/* Main Command View */}
      <div className="grid lg:grid-cols-12 gap-6 mb-10">
        {/* Left Column: Violations & Risk (High Density) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="premium-card bg-slate-900/40 border-slate-800/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/20">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-mono flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Violation Log
              </h3>
              <span className="text-[10px] font-mono text-slate-600 uppercase italic">FCRA/FDCPA CORE</span>
            </div>
            <div className="p-0 max-h-[500px] overflow-y-auto scrollbar-thin">
              {flags.map((flag, idx) => (
                <div key={idx} className="border-b border-slate-800/40 last:border-0 p-5 hover:bg-slate-800/20 transition-colors group">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${flag.severity === 'critical' ? 'bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]' : flag.severity === 'high' ? 'bg-rose-500' : flag.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {flag.ruleName}
                    </h4>
                    <span className={`text-[9px] font-mono font-bold bg-slate-800 px-2 py-0.5 rounded uppercase ${flag.severity === 'critical' ? 'text-indigo-400 border border-indigo-500/30' : 'text-slate-500'}`}>{flag.severity}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3 font-medium">{flag.explanation}</p>
                  <div className="flex flex-wrap gap-2">
                    {flag.legalCitations.slice(0, 2).map((cite, i) => (
                      <span key={i} className="text-[9px] font-mono text-emerald-500/80 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded">{cite}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Action Plan & Intelligence */}
        <div className="lg:col-span-4 space-y-6">
          {/* Executive Action Plan */}
          <div className="premium-card bg-slate-900/40 border-slate-800/60">
            <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/20">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-mono flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Action Plan
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {analytics?.actions.slice(0, 4).map((action, i) => (
                <div key={i} className="flex gap-3 group">
                  <div className="mt-1 shrink-0">
                    <div className={`w-1.5 h-6 rounded-full ${action.priority === 'immediate' ? 'bg-rose-500' : 'bg-slate-700'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 mb-1 group-hover:text-emerald-400 transition-colors">{action.action}</p>
                    <p className="text-[10px] text-slate-500 leading-tight font-medium">{action.reason}</p>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setActiveTab('lettereditor')}
                className="w-full mt-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-950 transition-all"
              >
                Execute Documents
              </button>
            </div>
          </div>

          {/* AI Intelligence Brief */}
          <div className="premium-card bg-slate-950 border-indigo-500/20 p-6 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 font-mono">Agent Briefing</p>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium italic mb-6">
              "{riskProfile.summary.substring(0, 200)}..."
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Risk Tier</p>
                 <p className={`text-xs font-black uppercase ${riskProfile.riskLevel === 'critical' ? 'text-indigo-400 animate-pulse' : riskProfile.riskLevel === 'high' ? 'text-rose-500' : 'text-emerald-500'}`}>{riskProfile.riskLevel}</p>

              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Litigation</p>
                <p className="text-xs font-black uppercase text-indigo-400">{riskProfile.litigationPotential ? 'High' : 'Low'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legacy Score Dashboard (Removing or replacing) */}


      {/* Tabs Menu */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-10 no-print sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-40">
        <div
          ref={tabsRef}
          className="flex gap-8 overflow-x-auto py-4 scrollbar-hide"
          role="tablist"
        >
          {ANALYSIS_TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                data-tab={tab.id}
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                className={`pb-2 text-[10px] uppercase tracking-[0.2em] font-black border-b-2 transition-all whitespace-nowrap ${isSelected
                  ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Rendering */}
      <div className="mb-8 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'violations' && (
          <ViolationsTab
            flags={flags}
            expandedCard={expandedCard}
            setExpandedCard={setExpandedCard}
            translate={translate}
          />
        )}

        {activeTab === 'briefing' && <CaseBriefTab />}

        {activeTab === 'review' && (
          <ReviewMissionTab
            flags={flags}
            fields={editableFields}
            discoveryAnswers={discoveryAnswers}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'deadlines' && (
          <DeadlinesTab
            fields={editableFields}
            consumer={consumer}
            flags={flags}
          />
        )}

        {activeTab === 'statutes' && (
          <StatuteTrackerTab fields={editableFields} />
        )}

        {activeTab === 'legalshield' && (
          <LegalShieldTab editableFields={editableFields} />
        )}

        {activeTab === 'simulation' && (
          <TacticalSimulatorTab flags={flags} riskProfile={riskProfile} />
        )}

        {activeTab === 'adversarial' && (
          <AdversarialMazeTab flags={flags} riskProfile={riskProfile} />
        )}

        {activeTab === 'liability' && (
          <LiabilityRadarTab flags={flags} />
        )}

        {activeTab === 'escalation' && (
          <LegalEscalationTab flags={flags} fields={editableFields} riskProfile={riskProfile} />
        )}

        {activeTab === 'metro2' && (
          <Metro2AuditTab fields={editableFields} />
        )}

        {activeTab === 'aianalysis' && (
          <AIAnalysisTab
            flags={flags}
            fields={editableFields}
            patterns={analytics?.patterns || []}
            timeline={analytics?.timeline || []}
            riskProfile={riskProfile}
          />
        )}

        {activeTab === 'multibureau' && (
          <MultiBureauTab
            fields={editableFields}
            rawText={rawText}
          />
        )}

        {activeTab === 'narrative' && <NarrativeTab flags={flags} editableFields={editableFields} />}

        {activeTab === 'actions' && (
          <MasterActionPlanTab
            actions={analytics?.actions.map((item, i) => ({
              id: `action-${i}`,
              title: item.action,
              description: item.reason,
              priority: item.priority === 'immediate' ? 'high' : item.priority === 'optional' ? 'low' : 'medium',
              tabLink: 'lettereditor' as TabId,
              letterType: (item.action.toLowerCase().includes('validation') ? 'validation' : 
                          item.action.toLowerCase().includes('bureau') ? 'bureau' :
                          item.action.toLowerCase().includes('furnisher') ? 'furnisher' :
                          item.action.toLowerCase().includes('cease') ? 'cease_desist' :
                          item.action.toLowerCase().includes('sue') ? 'intent_to_sue' : undefined) as LetterType | undefined
            })) || []}
            setActiveTab={setActiveTab}
            setSelectedLetterType={setSelectedLetterType}
            onExport={() => setActiveTab('lettereditor')}
          />
        )}

        {activeTab === 'scoresim' && (
          <ScoreSimulatorTab
            flags={flags}
            fields={editableFields}
            riskProfile={riskProfile}
          />
        )}

        {activeTab === 'timeline' && analytics && <TimelineTab timeline={analytics.timeline} bureau={editableFields.bureau} />}

        {activeTab === 'evidence' && <EvidenceManagerTab caseId="current-case" />}

        {activeTab === 'workflow' && <WorkflowTrackerTab caseId="current-case" />}

        {activeTab === 'voice' && <VoiceTranscriptionTab />}

        {activeTab === 'caselaw' && <CaseLawTab relevantCaseLaw={relevantCaseLaw} />}

        {activeTab === 'deltas' && (
          <DeltasTab
            deltas={deltas}
            seriesInsights={seriesInsights}
            seriesSnapshots={seriesSnapshots}
            evidenceReadiness={readiness}
          />
        )}

        {activeTab === 'discovery' && (
          <DiscoveryTab
            flags={flags}
            discoveryAnswers={discoveryAnswers}
            setDiscoveryAnswers={setDiscoveryAnswers}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'lab' && <ForensicLabTab flags={flags} />}

        {activeTab === 'lettereditor' && (
          <LetterEditorTab
            selectedLetterType={selectedLetterType}
            setSelectedLetterType={setSelectedLetterType}
            editableLetter={editableLetter}
            setEditableLetter={setEditableLetter}
            generatePDF={generatePDFLetter}
          />
        )}
      </div>

      {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} />}
    </div>
  );
};

export default Step4Analysis;
