'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Zap, 
  ShieldCheck, 
  Search, 
  Activity, 
  ChevronRight,
  Clock,
  Briefcase,
  FileText,
  RefreshCcw,
  Radiation
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ANALYSIS_TABS, TabId, LetterType } from '../../lib/constants';
import { SeriesInsight, SeriesSnapshot, SeriesSnapshotOption, computeExpectedRemovalDate } from '../../lib/delta';
import { parseDate } from '../../lib/rules';
import { estimateOutcomeProbability, BureauWeights } from '../../lib/outcome-probability';
import { exportComparisonDossier, exportComparisonCsv } from '../../lib/delta';
import { exportComparisonDossierPdf, buildComparisonDossierPdfBlob } from '../../lib/dossier-pdf';
import { GuideOverlay } from '../GuideOverlay';
import { RuleFlag, RiskProfile, CreditFields } from '../../lib/types';
import { CaseLaw } from '../../lib/caselaw';
import { CollectorMatch } from '../../lib/collector-database';
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
import InstitutionalTab from './analysis/InstitutionalTab';
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500 font-mono">Baseline Archive</span>
          <select
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
            value={olderId}
            onChange={(e) => setOlderId(e.target.value)}
          >
            {options.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}{option.isCurrent ? ' (live)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500 font-mono">Target Archive</span>
          <select
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
            value={newerId}
            onChange={(e) => setNewerId(e.target.value)}
          >
            {options.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}{option.isCurrent ? ' (live)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      
      <button
        type="button"
        className="w-full py-4 bg-white text-slate-950 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-blue-400 hover:text-white transition-all shadow-xl font-mono"
        onClick={() => {
          if (olderId && newerId && onCompare) {
            onCompare(olderId, newerId);
          }
        }}
      >
        Execute Forensic Comparison
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="py-3 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border border-white/5 hover:bg-slate-800 transition-all font-mono"
          onClick={onAutoCompare}
        >
          Auto (Start vs End)
        </button>
        <button
          type="button"
          className="py-3 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border border-white/5 hover:bg-slate-800 transition-all font-mono"
          onClick={onExportBundle}
        >
          Export ZIP Bundle
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
  collectorMatch?: CollectorMatch | null;
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
  const actionQueue = React.useMemo(() => {
    const queue: Array<{ id: string; priority: 'critical' | 'high' | 'medium'; title: string; detail: string; field?: string; tab?: TabId }> = [];
    timelineIssues.forEach(issue => {
      queue.push({
        id: `timeline-${issue.id}`,
        priority: issue.severity === 'blocking' ? 'critical' : 'high',
        title: issue.title,
        detail: issue.description,
        field: issue.field as string | undefined,
        tab: 'timeline'
      });
    });
    smartRecommendations.forEach(rec => {
      queue.push({
        id: `smart-${rec.id}`,
        priority: rec.type === 'error' ? 'high' : rec.type === 'warning' ? 'medium' : 'medium',
        title: rec.title,
        detail: rec.description,
        field: rec.field as string
      });
    });
    (seriesInsights || []).slice(0, 3).forEach(insight => {
      queue.push({
        id: `series-${insight.id}`,
        priority: insight.severity === 'high' ? 'high' : 'medium',
        title: insight.title,
        detail: insight.summary,
        tab: 'deltas'
      });
    });
    return queue
      .sort((a, b) => {
        const score = (item: typeof queue[number]) => item.priority === 'critical' ? 3 : item.priority === 'high' ? 2 : 1;
        return score(b) - score(a);
      })
      .slice(0, 8);
  }, [seriesInsights, smartRecommendations, timelineIssues]);

  const analysisReadiness = React.useMemo(() => {
    const blockers = timelineIssues.filter(issue => issue.severity === 'blocking').length;
    const warnings = timelineIssues.filter(issue => issue.severity === 'warning').length;
    const readinessScore = Math.max(0, Math.round(100 - blockers * 20 - warnings * 8 + readiness * 0.2));
    return {
      blockers,
      warnings,
      readinessScore
    };
  }, [readiness, timelineIssues]);
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
    <>
      <div className="relative isolate px-6 lg:px-20 pt-10">
        {/* Global HUD Header */}
      <section className="relative mb-24 group">
        <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/10 via-slate-500/10 to-indigo-500/10 rounded-[6rem] blur-[100px] opacity-0 group-hover:opacity-100 transition-duration-1000 pointer-events-none" />
        
        <div className="relative overflow-hidden rounded-[5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] transition-all duration-1000">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-500/5 rounded-full blur-[200px] -mr-[400px] -mt-[400px]" />
          
          <div className="relative z-10 p-16 lg:p-24">
            <div className="grid lg:grid-cols-12 gap-20 items-center">
              <div className="lg:col-span-8 flex flex-col sm:flex-row items-center gap-16">
                {/* Readiness Oscillator */}
                <div className="relative shrink-0">
                  <div className="w-56 h-56 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center relative overflow-hidden group/osc">
                    <div className="absolute inset-0 border-[10px] border-blue-500/5 rounded-full" />
                    <div className="absolute inset-0 border-t-[10px] border-blue-500/40 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-10 border border-white/5 rounded-full" />
                    
                    <div className="relative z-10 text-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono leading-none">Operational Readiness</span>
                      <div className="text-7xl font-black text-white font-mono tracking-tighter leading-none mt-2 italic">
                        {readiness}<span className="text-xl text-blue-500/40 ml-1">%</span>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                      <span className="text-[9px] font-black text-slate-700 font-mono tracking-widest mt-1 uppercase">Sig_Strength::High</span>
                    </div>
                  </div>
                </div>

                <div className="h-40 w-px bg-white/5 hidden sm:block" />

                <div className="grid grid-cols-2 gap-x-24 gap-y-12">
                  <div className="space-y-4 group/stat">
                    <p className="text-[10px] uppercase text-slate-600 font-black tracking-[0.5em] font-mono whitespace-nowrap group-hover/stat:text-rose-500 transition-colors">Primary_Violations</p>
                    <div className="flex items-center gap-6">
                      <p className="text-6xl font-black text-white tabular-nums tracking-tighter font-mono italic">{flags.length}</p>
                      <div className="px-5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <span className="text-[10px] font-black text-rose-500 font-mono tracking-widest italic uppercase">Active_Nodes</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 group/stat">
                    <p className="text-[10px] uppercase text-slate-600 font-black tracking-[0.5em] font-mono whitespace-nowrap group-hover/stat:text-orange-500 transition-colors">Sequence_Drift</p>
                    <div className="flex items-center gap-6">
                      <p className="text-6xl font-black text-orange-400 tabular-nums tracking-tighter font-mono italic">{seriesInsights?.length ?? 0}</p>
                      <div className="px-5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <span className="text-[10px] font-black text-orange-500 font-mono tracking-widest italic uppercase">Data_Drives</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 relative h-full">
                <div className="h-full bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] border border-white/10 p-16 flex flex-col justify-between shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)] group/action">
                  <div className="absolute top-0 right-0 p-16 opacity-[0.05] grayscale group-hover:scale-125 transition-transform duration-1000 pointer-events-none">
                    <Search size={140} />
                  </div>
                  <div className="relative z-10 mb-12">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="h-px w-10 bg-blue-500/50" />
                      <h5 className="text-[11px] font-mono uppercase font-black text-blue-400 tracking-[0.5em]">Command_Vector</h5>
                    </div>
                    <p className="text-2xl text-slate-400 leading-relaxed font-light italic">
                      SYSTEMATIC VERIFICATION OF <span className="text-white font-bold">DATA INTEGRITY</span> ACROSS ARCHIVE SERIES HAS FLAGGED <span className="text-blue-500 font-black uppercase">{flags.length} ACTIONABLE ANOMALIES</span> IN THE RECORD.
                    </p>
                  </div>
                  <div className="space-y-6 relative z-10">
                    <button
                      onClick={() => generateForensicReport(editableFields, flags, riskProfile, relevantCaseLaw, consumer, discoveryAnswers)}
                      className="w-full group/btn py-6 px-10 bg-white text-slate-950 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] font-mono italic transition-all hover:bg-blue-500 hover:text-white shadow-[0_20px_40px_-5px_rgba(255,255,255,0.1)] flex items-center justify-between"
                    >
                      <span className="flex items-center gap-6">
                        <FileText size={20} className="group-hover:rotate-12 transition-transform duration-500" />
                        Assemble_Forensic_Dossier
                      </span>
                      <ChevronRight size={20} className="group-hover:translate-x-3 transition-transform duration-500" />
                    </button>
                    <button
                      onClick={() => setActiveTab('discovery')}
                      className="w-full group py-6 px-10 bg-slate-950 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] font-mono italic border border-white/10 transition-all hover:border-blue-500/50 flex items-center justify-between shadow-2xl"
                    >
                      <span className="flex items-center gap-6">
                        <Search size={20} className="group-hover:scale-125 transition-transform duration-500 text-blue-500" />
                        Verify_Evidence_Locker
                      </span>
                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Component - Zenith Matrix HUD */}
      <nav className="sticky top-10 z-[100] px-4 no-print mb-24">
        <div 
          role="tablist"
          aria-label="Forensic Analysis Tabs"
          className="mx-auto max-w-[1700px] bg-slate-950/40 backdrop-blur-4xl p-4 rounded-[5rem] border border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex items-center justify-center gap-4 overflow-x-auto scrollbar-hide no-scrollbar relative group/nav min-h-[120px]"
        >
          <div className="absolute inset-x-24 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          
          {ANALYSIS_TABS.map((tab, idx) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center px-12 py-6 rounded-[3.5rem] transition-all duration-700 group min-w-[200px] h-full",
                  isSelected 
                    ? "text-slate-950 scale-105" 
                    : "text-slate-500 hover:text-white"
                )}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                role="tab"
                {...{ 'aria-selected': isSelected }}
                title={tab.label}
              >
                {isSelected && (
                  <motion.div 
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-white shadow-[0_20px_50px_-10px_rgba(255,255,255,0.3)] rounded-[3.5rem]"
                    transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-black font-mono tracking-[0.4em] leading-none transition-colors",
                    isSelected ? "text-slate-400" : "text-slate-800 group-hover:text-slate-300"
                  )}>
                    NODE::{String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className={cn(
                    "text-[11px] font-black uppercase tracking-[0.4em] text-center transition-all font-mono whitespace-nowrap italic",
                    isSelected ? "text-slate-950" : ""
                  )}>
                    {tab.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      <div>
      {/* Dashboard Matrix - Integrated Forensic Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-32 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <CaseSummaryDashboard flags={flags} riskProfile={riskProfile} readiness={readiness} />

          <div className="grid lg:grid-cols-12 gap-24">
            {/* Mission Critical Sequence */}
            <div className="lg:col-span-8 space-y-24">
              {/* Compliance Violations Manifest */}
              <div className="relative group/manifest">
                <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-[5rem] blur-3xl opacity-0 group-hover/manifest:opacity-100 transition duration-1000" />
                <div className="relative rounded-[5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 overflow-hidden shadow-2xl">
                  <div className="px-20 py-16 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-10">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-2xl relative group-hover/manifest:rotate-3 transition-transform duration-700">
                         <AlertTriangle size={32} />
                         <div className="absolute inset-0 blur-2xl opacity-20 bg-indigo-500" />
                      </div>
                      <div>
                        <h3 className="text-5xl font-black text-white tracking-tighter uppercase font-mono italic">Audit_<span className="text-indigo-400">MANIFEST</span></h3>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] font-mono mt-2 italic">Institutional_Non-Compliance_Matrix</p>
                      </div>
                    </div>
                    <div className="px-8 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                      <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest font-mono italic">{flags.length}_NODES_ACTIVE</span>
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {flags.slice(0, 5).map((flag, idx) => (
                      <motion.div 
                        key={idx} 
                        whileHover={{ x: 15 }}
                        className="p-20 hover:bg-white/[0.03] transition-all cursor-default group/line"
                      >
                        <div className="flex items-center justify-between gap-10 mb-10">
                          <div className="flex items-center gap-8">
                            <span className={cn(
                              "w-4 h-4 rounded-full flex-shrink-0",
                              flag.severity === 'critical' ? "bg-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.8)] animate-pulse" : 
                              flag.severity === 'high' ? "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]" : "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                            )} />
                            <h4 className="text-4xl font-black text-white uppercase font-mono tracking-tighter italic group-hover/line:text-indigo-400 transition-all duration-500">{flag.ruleName}</h4>
                          </div>
                          <span className="text-[10px] font-black text-slate-500 bg-black/60 border border-white/5 px-6 py-3 rounded-full uppercase tracking-widest font-mono group-hover/line:bg-rose-600 group-hover/line:text-white transition-all shadow-inner italic">{flag.severity}</span>
                        </div>
                        <p className="text-2xl text-slate-400 leading-relaxed mb-12 font-medium italic max-w-5xl border-l-4 border-indigo-500/20 pl-12 ml-2 group-hover/line:text-slate-200 transition-colors">
                          "{flag.explanation}"
                        </p>
                        <div className="flex flex-wrap gap-5 ml-16">
                          {flag.legalCitations.slice(0, 4).map((cite, i) => (
                            <span key={i} className="text-[10px] font-black text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-6 py-3 rounded-2xl uppercase tracking-widest font-mono italic shadow-inner group-hover/line:border-indigo-500/40 transition-all">{cite}</span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                    {flags.length > 5 && (
                      <button 
                        onClick={() => setActiveTab('violations')}
                        className="w-full py-16 text-center text-[12px] font-black uppercase tracking-[0.6em] text-slate-500 hover:text-indigo-400 hover:bg-white/[0.05] transition-all font-mono italic border-t border-white/5 group/more"
                      >
                         <span className="group-hover:tracking-[0.8em] transition-all">+ {flags.length - 5}_ADDITIONAL_VECTORS_RETAINED</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Intel Sidebar */}
            <div className="lg:col-span-4 space-y-24">
              {/* Mission Briefing Dashboard */}
              <div className="relative group/brief">
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/20 to-transparent rounded-[5rem] blur-3xl opacity-0 group-hover/brief:opacity-100 transition duration-1000" />
                <div className="relative rounded-[5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 p-20 text-white overflow-hidden shadow-2xl min-h-[600px] flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-16 opacity-[0.05] group-hover:scale-125 transition-transform duration-1000 grayscale pointer-events-none">
                    <ShieldCheck size={350} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-10 mb-20">
                      <div className="w-16 h-16 rounded-[2rem] bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-2xl relative">
                          <Activity size={28} className="animate-pulse" />
                          <div className="absolute inset-0 blur-2xl opacity-20 bg-blue-500" />
                      </div>
                      <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-400 font-mono italic">Tactical_Intelligence</p>
                          <h4 className="text-4xl font-black text-white uppercase font-mono italic tracking-tighter mt-2">DIRECTIVE_ALPHA</h4>
                      </div>
                    </div>
                    
                    <p className="text-2xl text-slate-400 leading-[1.4] font-bold italic tracking-tight pr-10 mb-16 border-l-2 border-blue-500/30 pl-10 relative group-hover/brief:text-slate-200 transition-colors">
                       {riskProfile?.summary?.substring(0, 240)}...
                    </p>

                    <div className="grid grid-cols-2 gap-8">
                       <div className="bg-black/40 p-10 rounded-[2.5rem] border border-white/5 shadow-inner space-y-4 hover:border-blue-500/20 transition-all">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono italic underline decoration-blue-500/30 decoration-2">Risk_Matrix</p>
                          <p className={cn(
                            "text-2xl font-black uppercase tracking-tighter font-mono italic",
                            riskProfile?.riskLevel === 'critical' ? 'text-rose-500' : 'text-emerald-400'
                          )}>{riskProfile?.riskLevel}_PRIORITY</p>
                       </div>
                       <div className="bg-black/40 p-10 rounded-[2.5rem] border border-white/5 shadow-inner space-y-4 hover:border-orange-500/20 transition-all">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono italic underline decoration-orange-500/30 decoration-2">Legal_Vector</p>
                          <p className="text-2xl font-black uppercase text-orange-400 tracking-tighter font-mono italic">{riskProfile?.litigationPotential ? 'AGGRESSIVE' : 'DEFENSIVE'}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

      {/* Action Log Manifest */}
      <div className="relative group/actions">
        <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-[5rem] blur-3xl opacity-0 group-hover/actions:opacity-100 transition duration-1000" />
        <div className="relative rounded-[5rem] bg-white border border-slate-200 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden min-h-[600px] flex flex-col justify-between">
          <div>
            <div className="px-20 py-14 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-400 flex items-center gap-8 font-mono italic">
                <Zap size={24} className="text-emerald-500 animate-pulse" />
                Command_Queue
              </h3>
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 group-hover/actions:rotate-180 transition-transform duration-1000">
                <RefreshCcw size={16} />
              </div>
            </div>
            <div className="p-20 space-y-16">
              {analytics?.actions.slice(0, 3).map((action, i) => (
                <div key={i} className="flex gap-12 group/item cursor-pointer" onClick={() => setActiveTab('lettereditor')}>
                  <div className="mt-4 shrink-0">
                    <div className={cn(
                      "w-2 h-20 rounded-full transition-all duration-700 relative",
                      action.priority === 'immediate' ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]" : "bg-slate-200 group-hover/item:bg-blue-600 group-hover/item:h-24"
                    )} />
                  </div>
                  <div className="space-y-4">
                    <p className="text-3xl font-black text-slate-950 group-hover/item:text-blue-600 transition-colors uppercase font-mono italic tracking-tighter leading-none">{action.action}</p>
                    <p className="text-lg text-slate-500 leading-relaxed font-bold italic tracking-tight">{action.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-12 bg-slate-50 border-t border-slate-100">
            <button 
              onClick={() => setActiveTab('lettereditor')}
              className="w-full group/btn py-12 bg-slate-950 text-white rounded-[4rem] text-[12px] font-black uppercase tracking-[0.6em] font-mono italic transition-all hover:scale-[1.02] active:scale-[0.98] shadow-3xl flex items-center justify-center gap-10 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-all duration-700" />
              <span className="relative z-10 flex items-center gap-10">
                  EXECUTE_COMMAND_CORE
                  <ChevronRight size={28} className="group-hover/btn:translate-x-4 transition-transform duration-700" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
)}

{activeTab === 'violations' && (
  <div className="space-y-32 animate-in fade-in slide-in-from-bottom-10 duration-1000">
    <ViolationsTab
      flags={flags}
      expandedCard={expandedCard}
      setExpandedCard={setExpandedCard}
      translate={translate}
    />
  </div>
)}

{activeTab === 'briefing' && (
  <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
    <CaseBriefTab />
  </div>
)}

{activeTab === 'review' && (
  <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
    <ReviewMissionTab
      flags={flags}
      fields={editableFields}
      discoveryAnswers={discoveryAnswers}
      setActiveTab={setActiveTab}
    />
  </div>
)}

        {activeTab === 'deadlines' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <DeadlinesTab
              fields={editableFields}
              consumer={consumer}
              flags={flags}
            />
          </div>
        )}

        {activeTab === 'statutes' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <StatuteTrackerTab fields={editableFields} />
          </div>
        )}

        {activeTab === 'legalshield' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <LegalShieldTab editableFields={editableFields} />
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <TacticalSimulatorTab flags={flags} riskProfile={riskProfile} />
          </div>
        )}

        {activeTab === 'adversarial' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <AdversarialMazeTab flags={flags} riskProfile={riskProfile} />
          </div>
        )}

        {activeTab === 'liability' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <LiabilityRadarTab flags={flags} />
          </div>
        )}

        {activeTab === 'escalation' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <LegalEscalationTab flags={flags} fields={editableFields} riskProfile={riskProfile} />
          </div>
        )}

        {activeTab === 'metro2' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <Metro2AuditTab fields={editableFields} />
          </div>
        )}

        {activeTab === 'aianalysis' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <AIAnalysisTab
              flags={flags}
              fields={editableFields}
              patterns={analytics?.patterns || []}
              timeline={analytics?.timeline || []}
              riskProfile={riskProfile}
            />
          </div>
        )}

        {activeTab === 'multibureau' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <MultiBureauTab
              fields={editableFields}
              rawText={rawText}
            />
          </div>
        )}

        {activeTab === 'narrative' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <NarrativeTab flags={flags} editableFields={editableFields} />
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
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
          </div>
        )}

        {activeTab === 'scoresim' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <ScoreSimulatorTab
              flags={flags}
              fields={editableFields}
              riskProfile={riskProfile}
            />
          </div>
        )}

        {activeTab === 'timeline' && analytics && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <TimelineTab timeline={analytics.timeline} bureau={editableFields.bureau} setActiveTab={setActiveTab} />
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <EvidenceManagerTab caseId="current-case" />
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <WorkflowTrackerTab caseId="current-case" />
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <VoiceTranscriptionTab />
          </div>
        )}

        {activeTab === 'caselaw' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <CaseLawTab relevantCaseLaw={relevantCaseLaw} />
          </div>
        )}

        {activeTab === 'deltas' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <DeltasTab
              deltas={deltas}
              seriesInsights={seriesInsights}
              seriesSnapshots={seriesSnapshots}
              evidenceReadiness={readiness}
            />
          </div>
        )}

        {activeTab === 'discovery' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <DiscoveryTab
              flags={flags}
              discoveryAnswers={discoveryAnswers}
              setDiscoveryAnswers={setDiscoveryAnswers}
              setActiveTab={setActiveTab}
            />
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <ForensicLabTab flags={flags} />
          </div>
        )}

        {activeTab === 'lettereditor' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <LetterEditorTab
              selectedLetterType={selectedLetterType}
              setSelectedLetterType={setSelectedLetterType}
              editableLetter={editableLetter}
              setEditableLetter={setEditableLetter}
              generatePDF={generatePDFLetter}
            />
          </div>
        )}

        {activeTab === 'institutional' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <InstitutionalTab caseId="current-case" collectorMatch={collectorMatch} />
          </div>
        )}
      </div>

      {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} />}
    </div>
    </>
  );
};

export default Step4Analysis;
