'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Zap, 
  ShieldCheck, 
  Search, 
  Activity, 
  ChevronRight,
  Clock,
  FileText,
  RefreshCcw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ANALYSIS_TABS, TabId, LetterType } from '../../lib/constants';
import { SeriesInsight, SeriesSnapshot, SeriesSnapshotOption, computeExpectedRemovalDate } from '../../lib/delta';
import { parseDate } from '../../lib/rules';
import { estimateOutcomeProbability, BureauWeights } from '../../lib/outcome-probability';
import { GuideOverlay } from '../GuideOverlay';
import { RuleFlag, RiskProfile, CreditFields, ConsumerInfo } from '../../lib/types';
import { CaseLaw } from '../../lib/caselaw';
import { CollectorMatch } from '../../lib/collector-database';
import { TimelineEvent, PatternInsight } from '../../lib/analytics';
import { DeltaResult } from '../../lib/delta';
import {
  generateBureauLetter,
  generateValidationLetter,
  generateFurnisherLetter,
  generateCeaseDesistLetter,
  generateIntentToSueLetter
} from '../../lib/generator';

// Core Analysis Tabs
import CaseSummaryDashboard from './analysis/CaseSummaryDashboard';
import Metro2AuditTab from './analysis/Metro2AuditTab';
import StatuteTrackerTab from './analysis/StatuteTrackerTab';
import LiabilityRadarTab from './analysis/LiabilityRadarTab';
import MasterActionPlanTab from './analysis/MasterActionPlanTab';
import LetterEditorTab from './analysis/LetterEditorTab';
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

const Step4Analysis = React.memo<Step4AnalysisProps>((props) => {
  const {
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
    collectorMatch,
    analytics,
    tabsRef,
    translate,
    generateForensicReport,
    selectedLetterType,
    setSelectedLetterType,
    editableLetter,
    setEditableLetter,
    generatePDFLetter
  } = props;
  const [showGuide, setShowGuide] = useState(true);

  const issuesByPriority = useMemo(() => ({
    high: flags.filter(f => f.severity === 'high'),
    medium: flags.filter(f => f.severity === 'medium'),
    low: flags.filter(f => f.severity === 'low'),
  }), [flags]);

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
        intent_to_sue: () => generateIntentToSueLetter(editableFields, flags, consumer),
      };

      const generator = generators[selectedLetterType];
      if (generator) {
        setEditableLetter(generator());
      }
    }
  }, [selectedLetterType, flags, editableFields, consumer, riskProfile, setEditableLetter]);

  const { totalPossibleEvidence, checkedEvidenceCount, readiness } = useMemo(() => {
    const totalPossibleEvidence = Array.from(new Set(flags.flatMap(f => f.suggestedEvidence))).length;
    const checkedEvidenceCount = Object.keys(discoveryAnswers).filter(k => k.startsWith('ev-') && discoveryAnswers[k] === 'checked').length;
    const readiness = totalPossibleEvidence > 0 ? Math.round((checkedEvidenceCount / totalPossibleEvidence) * 100) : 0;
    return { totalPossibleEvidence, checkedEvidenceCount, readiness };
  }, [flags, discoveryAnswers]);
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
  const { highSeverityCount, negativeDeltaCount, seriesCount, signalScore } = useMemo(() => {
    const highSeverityCount = flags.filter(flag => flag.severity === 'high' || flag.severity === 'critical').length;
    const negativeDeltaCount = deltas.filter(delta => delta.impact === 'negative').length;
    const seriesCount = seriesInsights?.length || 0;
    const signalScore = Math.min(100, Math.max(20, Math.round(40 + highSeverityCount * 6 + seriesCount * 4 + negativeDeltaCount * 3 + readiness * 0.2)));
    return { highSeverityCount, negativeDeltaCount, seriesCount, signalScore };
  }, [flags, deltas, seriesInsights, readiness]);
  const { expectedRemoval, removalDeltaDays } = useMemo(() => {
    const expectedRemoval = computeExpectedRemovalDate(editableFields.dofd, editableFields.bureau);
    const removalDeltaDays = (() => {
      if (!expectedRemoval || !editableFields.estimatedRemovalDate) return null;
      const removalDate = new Date(editableFields.estimatedRemovalDate);
      if (Number.isNaN(removalDate.getTime())) return null;
      return Math.round((removalDate.getTime() - expectedRemoval.expected.getTime()) / (1000 * 60 * 60 * 24));
    })();
    return { expectedRemoval, removalDeltaDays };
  }, [editableFields.dofd, editableFields.estimatedRemovalDate, editableFields.bureau]);

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
      <div className="min-h-screen bg-slate-50 p-8 lg:p-12">
        {/* Institutional Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight italic">Case Analysis</h1>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Forensic Audit & Compliance Manifest</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-6 py-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Found Discrepancies</p>
                <p className="text-xl font-black text-rose-600 font-mono tracking-tighter leading-none italic">{flags.length}</p>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Evidence Grade</p>
                <p className="text-xl font-black text-blue-600 font-mono tracking-tighter leading-none italic">{readiness}%</p>
              </div>
            </div>
          </div>
        </header>

        {/* Simplified Navigation */}
        <nav className="mb-12">
          <div className="flex flex-wrap gap-3 p-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm shadow-slate-100/50 max-w-fit">
            {ANALYSIS_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={cn(
                    "px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 italic",
                    isSelected 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content Area */}
        <main>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-12">
                  <CaseSummaryDashboard flags={flags} riskProfile={riskProfile} readiness={readiness} />
                  
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Simplified Findings List */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                      <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 italic">Audit Findings</h3>
                        <span className="px-4 py-2 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-widest">{flags.length} Detected</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {flags.map((flag, idx) => (
                          <div key={idx} className="p-8 hover:bg-slate-50/50 transition-colors group">
                            <div className="flex items-center gap-4 mb-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                flag.severity === 'high' || flag.severity === 'critical' ? "bg-rose-500" : "bg-blue-500"
                              )} />
                              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider italic">{flag.ruleName}</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed pl-6 italic">"{flag.explanation}"</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Actions Mini-Panel */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-150" />
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                          <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-8">Strategic Protocol</h3>
                          <p className="text-xl font-light italic leading-relaxed text-slate-300">
                            Based on detected discrepancies, the primary strategy should focus on <span className="text-white font-bold">{riskProfile?.litigationPotential ? 'AGGRESSIVE DISPUTE' : 'STANDARD CORRECTION'}</span> to rectify timeline integrity.
                          </p>
                        </div>
                        
                        <div className="mt-12 space-y-4">
                          <button 
                            onClick={() => setActiveTab('actions')}
                            className="w-full py-5 bg-white text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest italic flex items-center justify-center gap-3 hover:bg-blue-50 transition-colors"
                          >
                            Execution Protocol
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'metro2' && <Metro2AuditTab fields={editableFields} />}
              {activeTab === 'statutes' && <StatuteTrackerTab fields={editableFields} />}
              {activeTab === 'liability' && <LiabilityRadarTab flags={flags} />}
              
              {activeTab === 'actions' && (
                <MasterActionPlanTab
                  actions={analytics?.actions.map((item, i) => ({
                    id: `action-${i}`,
                    title: item.action,
                    description: item.reason,
                    priority: item.priority === 'immediate' ? 'high' : item.priority === 'optional' ? 'low' : 'medium',
                    tabLink: 'actions' as TabId,
                    letterType: (item.action.toLowerCase().includes('validation') ? 'validation' : 
                                item.action.toLowerCase().includes('bureau') ? 'bureau' :
                                item.action.toLowerCase().includes('furnisher') ? 'furnisher' :
                                item.action.toLowerCase().includes('cease') ? 'cease_desist' :
                                item.action.toLowerCase().includes('sue') ? 'intent_to_sue' : undefined) as LetterType | undefined
                  })) || []}
                  setActiveTab={setActiveTab}
                  setSelectedLetterType={setSelectedLetterType}
                  onExport={() => setActiveTab('actions')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} />}
    </>
  );
});

Step4Analysis.displayName = 'Step4Analysis';

export default Step4Analysis;
