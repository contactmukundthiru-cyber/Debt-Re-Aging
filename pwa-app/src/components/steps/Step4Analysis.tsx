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
  FileText
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
    <div className="fade-in pb-20 space-y-12">
      {/* Forensic Intelligence Center - Institutional Hero */}
      <section className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-[3rem] blur-3xl -z-10 transition-all group-hover:from-blue-600/10 group-hover:to-indigo-600/10" />
        <div className="premium-card p-12 bg-slate-950 text-white border-slate-800 rounded-[3rem] overflow-hidden relative shadow-3xl shadow-blue-900/10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse opacity-50" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] -ml-40 -mb-40" />
          
          <div className="relative z-10 grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                  <span className="text-[10px] uppercase font-black tracking-[0.4em] text-blue-400 font-mono animate-pulse">Forensic Intelligence Active</span>
                </div>
                <div className="h-px w-12 bg-slate-800" />
                <span className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-500 font-mono">Institutional v5.0</span>
              </div>
              
              <h2 className="text-6xl lg:text-8xl font-black tracking-tighter mb-10 leading-[0.85] uppercase font-mono italic">
                Audit <span className="text-blue-500">Manifest</span>
              </h2>
              
              <div className="flex flex-wrap items-center gap-16">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-blue-500 animate-pulse" />
                    <p className="text-[10px] uppercase text-slate-500 font-black tracking-[0.4em] font-mono">Forensic Readiness</p>
                  </div>
                  <div className="flex items-end gap-3">
                    <span className="text-7xl font-black text-white leading-none tabular-nums tracking-tighter font-mono">{readiness}%</span>
                    <div className="flex flex-col mb-1 border-l border-white/10 pl-3">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${readiness > 80 ? 'text-emerald-500' : 'text-orange-500'}`}>
                         {readiness > 80 ? 'COURT_READY' : 'INCOMPLETE'}
                       </span>
                       <span className="text-[8px] font-black text-slate-600 font-mono tracking-widest mt-0.5">V5.0_STABLE</span>
                    </div>
                  </div>
                </div>

                <div className="h-20 w-px bg-white/5 hidden sm:block" />

                <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase text-slate-600 font-black tracking-[0.4em] font-mono whitespace-nowrap">Primary Violations</p>
                    <div className="flex items-center gap-3">
                      <p className="text-4xl font-black text-white tabular-nums tracking-tighter font-mono">{flags.length}</p>
                      <div className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                        <span className="text-[8px] font-black text-rose-500 font-mono tracking-widest">NODES</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase text-slate-600 font-black tracking-[0.4em] font-mono whitespace-nowrap">Sequence Drift</p>
                    <div className="flex items-center gap-3">
                      <p className="text-4xl font-black text-orange-500 tabular-nums tracking-tighter font-mono">{seriesInsights?.length ?? 0}</p>
                      <div className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                        <span className="text-[8px] font-black text-orange-500 font-mono tracking-widest">DRIVES</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 self-stretch">
               <div className="h-full bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-8 flex flex-col justify-between shadow-inner">
                  <div>
                    <h5 className="text-[10px] font-mono uppercase font-black text-slate-400 tracking-[0.3em] mb-4">Command Actions</h5>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium mb-8">
                      Systematic verification of <span className="text-white italic">data integrity</span> across all reported fields has detected <span className="text-blue-400">{flags.length} nodes</span> for challenge.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <button
                      onClick={() => generateForensicReport(editableFields, flags, riskProfile, relevantCaseLaw, consumer, discoveryAnswers)}
                      className="w-full group py-4 px-6 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-blue-400 hover:text-white shadow-xl flex items-center justify-center gap-3"
                    >
                      <Briefcase size={14} className="group-hover:rotate-12 transition-transform" />
                      Generate Institutional Dossier
                    </button>
                    <button
                      onClick={() => setActiveTab('discovery')}
                      className="w-full group py-4 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 transition-all hover:border-blue-500/50 flex items-center justify-center gap-3"
                    >
                      <Search size={14} className="group-hover:scale-125 transition-transform" />
                      Initialize Forensic Audit
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Component - Elite Institutional Style */}
      <nav className="sticky top-6 z-[100] px-6 no-print">
        <div className="mx-auto bg-slate-950/80 backdrop-blur-3xl p-2 rounded-[2.5rem] border border-white/10 shadow-4xl flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide no-scrollbar ring-1 ring-white/5">
          {ANALYSIS_TABS.map((tab, idx) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center px-8 py-4 rounded-[1.8rem] transition-all duration-500 group min-w-[160px]",
                  isSelected 
                    ? "text-slate-950" 
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
                role="tab"
                aria-selected={isSelected}
              >
                {isSelected && (
                  <motion.div 
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-white rounded-[1.6rem] shadow-2xl"
                    transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <span className={cn(
                    "text-[8px] font-black font-mono tracking-widest leading-none",
                    isSelected ? "text-slate-400" : "text-slate-700 group-hover:text-slate-500"
                  )}>
                    NODE::{String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] text-center transition-colors font-mono whitespace-nowrap",
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
      {/* Dashboard Sub-Stats for Overview (Auto-integrated) */}
      {activeTab === 'overview' && (
        <div className="space-y-16 animate-in fade-in duration-700">
          <CaseSummaryDashboard flags={flags} riskProfile={riskProfile} readiness={readiness} />

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Mission Critical Items */}
            <div className="lg:col-span-8 space-y-10">
              {/* Compliance Violations Manifest */}
              <div className="premium-card bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-slate-100 dark:ring-white/5">
                <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                       <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black dark:text-white tracking-tight uppercase font-mono">Violations <span className="text-indigo-500">MANIFEST</span></h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">FCRA / FDCPA Sequence Audit</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full uppercase tracking-widest font-mono">{flags.length} Nodes detected</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {flags.slice(0, 5).map((flag, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ x: 10 }}
                      className="p-10 hover:bg-slate-50 dark:hover:bg-indigo-500/5 transition-all cursor-default group"
                    >
                      <div className="flex items-center justify-between gap-6 mb-4">
                        <div className="flex items-center gap-4">
                          <span className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            flag.severity === 'critical' ? "bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.6)]" : 
                            flag.severity === 'high' ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" : "bg-orange-500"
                          )} />
                          <h4 className="text-lg font-black dark:text-white uppercase font-mono tracking-tight group-hover:text-indigo-500 transition-colors">{flag.ruleName}</h4>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg uppercase tracking-[0.2em] font-mono group-hover:bg-indigo-500 group-hover:text-white transition-colors">{flag.severity}</span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-medium max-w-3xl pr-4 italic">
                        "{flag.explanation}"
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {flag.legalCitations.slice(0, 4).map((cite, i) => (
                          <span key={i} className="text-[9px] font-black text-indigo-500 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-3 py-1.5 rounded-lg uppercase tracking-widest font-mono">{cite}</span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                  {flags.length > 5 && (
                    <button 
                      onClick={() => setActiveTab('violations')}
                      className="w-full py-6 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all font-mono"
                    >
                       + {flags.length - 5} Additional Nodes in Archive
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side Strategy */}
            <div className="lg:col-span-4 space-y-10">
              {/* Mission Briefing */}
              <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-3xl border border-slate-800 group ring-1 ring-white/10">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                  <ShieldCheck size={180} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 font-mono">Strategic Briefing</p>
                  </div>
                  
                  <div className="space-y-8 mb-12">
                    <p className="text-lg text-slate-200 leading-relaxed font-bold italic tracking-tight pr-6 relative">
                      <span className="text-6xl text-blue-500/20 absolute -top-8 -left-4 font-serif">"</span>
                      {riskProfile?.summary?.substring(0, 220)}...
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 font-mono">Tactical Strength</p>
                      <p className={cn(
                        "text-sm font-black uppercase tracking-[0.2em] font-mono",
                        riskProfile?.riskLevel === 'critical' ? 'text-blue-400 animate-pulse' : 'text-emerald-500'
                      )}>{riskProfile?.riskLevel}</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 font-mono">Litigation Vector</p>
                      <p className="text-sm font-black uppercase text-orange-400 tracking-[0.2em] font-mono">{riskProfile?.litigationPotential ? 'Elevated' : 'Defensive'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Manifest */}
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden ring-1 ring-slate-100 dark:ring-white/5">
                <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3 font-mono">
                    <Zap size={14} className="text-emerald-500" />
                    Execution Manifest
                  </h3>
                </div>
                <div className="p-10 space-y-8">
                  {analytics?.actions.slice(0, 4).map((action, i) => (
                    <div key={i} className="flex gap-6 group cursor-pointer" onClick={() => setActiveTab('lettereditor')}>
                      <div className="mt-1 shrink-0">
                        <div className={cn(
                          "w-1 h-12 rounded-full transition-all duration-500",
                          action.priority === 'immediate' ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-500 group-hover:h-14"
                        )} />
                      </div>
                      <div>
                        <p className="text-sm font-black dark:text-white mb-2 group-hover:text-blue-500 transition-colors uppercase font-mono">{action.action}</p>
                        <p className="text-xs text-slate-500 leading-relaxed font-normal">{action.reason}</p>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setActiveTab('lettereditor')}
                    className="w-full group mt-8 py-5 bg-slate-950 dark:bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-4"
                  >
                    Generate Legal Command Package
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
};

export default Step4Analysis;
