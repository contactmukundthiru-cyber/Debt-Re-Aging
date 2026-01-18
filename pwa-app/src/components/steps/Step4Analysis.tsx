'use strict';

import React, { useEffect } from 'react';
import { ANALYSIS_TABS, TabId, LetterType } from '../../lib/constants';
import { RuleFlag, RiskProfile, CreditFields } from '../../lib/rules';
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

// Tab Components
import ViolationsTab from './analysis/ViolationsTab';
import DeltasTab from './analysis/DeltasTab';
import PatternsTab from './analysis/PatternsTab';
import TimelineTab from './analysis/TimelineTab';
import CaseLawTab from './analysis/CaseLawTab';
import ScoreBreakdownTab from './analysis/ScoreBreakdownTab';
import LetterEditorTab from './analysis/LetterEditorTab';
import DiscoveryTab from './analysis/DiscoveryTab';
import ForensicLabTab from './analysis/ForensicLabTab';
import NarrativeTab from './analysis/NarrativeTab';


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
  consumer: ConsumerInfo;
  discoveryAnswers: Record<string, string>;
  setDiscoveryAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeTab: TabId;
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;

  expandedCard: number | null;
  setExpandedCard: (id: number | null) => void;
  deltas: DeltaResult[];
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
  consumer,
  discoveryAnswers,
  setDiscoveryAnswers,
  activeTab,
  setActiveTab,
  expandedCard,
  setExpandedCard,
  deltas,
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

  return (
    <div className="fade-in">
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

      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-bold tracking-tight mb-2 dark:text-white">Forensic Analysis Report</h2>
          <p className="text-slate-500 flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Scan complete: {flags.length} potential violations identified
          </p>
        </div>
        <div className="flex gap-3 no-print">
          <button
            type="button"
            onClick={() => generateForensicReport(editableFields, flags, riskProfile, relevantCaseLaw, consumer, discoveryAnswers)}
            className="btn btn-primary !h-12 !px-8 !rounded-xl bg-slate-900 border-none shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-transform flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Export Dossier
          </button>
        </div>
      </div>

      {/* Score Dashboard */}
      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        {/* Main Score */}
        <div className="premium-card p-8 lg:col-span-1 flex flex-col items-center text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Aggregate Strength</p>
          <div className="relative w-32 h-32 flex items-center justify-center mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="2"></circle>
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-emerald-500 transition-all duration-1000" strokeWidth="2" strokeDasharray={`${riskProfile.overallScore}, 100`} strokeLinecap="round"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold dark:text-white tabular-nums">{riskProfile.overallScore}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Points</span>
            </div>
          </div>
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Index</span>
              <span className={`text-xs font-bold uppercase tracking-widest ${riskProfile.riskLevel === 'critical' ? 'text-red-500' :
                riskProfile.riskLevel === 'high' ? 'text-orange-500' : 'text-emerald-500'
                }`}>{riskProfile.riskLevel}</span>
            </div>
          </div>
        </div>

        {/* Issue Breakdown */}
        <div className="premium-card p-8 lg:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Violation Matrix</p>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-red-500">Critical (FCRA)</span>
                <span className="dark:text-white">{issuesByPriority.high.length}</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${(issuesByPriority.high.length / flags.length) * 100}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-amber-500">Substantial</span>
                <span className="dark:text-white">{issuesByPriority.medium.length}</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${(issuesByPriority.medium.length / flags.length) * 100}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-400">Contextual</span>
                <span className="dark:text-white">{issuesByPriority.low.length}</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400" style={{ width: `${(issuesByPriority.low.length / flags.length) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {analytics && (
          <div className="premium-card p-8 lg:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Forensic Telemetry</p>
            <div className="space-y-4">
              {Object.entries(analytics.metrics).slice(0, 4).map(([key, item]) => (
                <div key={key} className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                  <span className="text-xs font-medium text-slate-500">{key}</span>
                  <span className={`text-xs font-bold font-mono tracking-tight ${item.status === 'critical' ? 'text-red-500' :
                    item.status === 'warning' ? 'text-amber-500' : 'text-slate-900 dark:text-emerald-400'
                    }`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6 no-print">
        <div
          ref={tabsRef}
          className="flex gap-4 overflow-x-auto pb-px scrollbar-hide"
          role="tablist"
          aria-label="Analysis results tabs"
        >
          {ANALYSIS_TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            const getTabLabel = () => {
              switch (tab.id) {
                case 'violations': return `${translate('analysis.violations')} (${flags.length})`;
                case 'narrative': return `Case Narrative`;
                case 'patterns': return `${translate('analysis.patterns')} (${analytics?.patterns.length || 0})`;

                case 'deltas': return `Forensic Diff (${deltas.length})`;
                case 'caselaw': return `${translate('analysis.caseLaw')} (${relevantCaseLaw.length})`;
                case 'timeline': return translate('analysis.timeline');
                case 'breakdown': return translate('analysis.scoreBreakdown');
                case 'actions': return translate('analysis.actionItems');
                default: return tab.label;
              }
            };

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isSelected}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isSelected
                  ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                {getTabLabel()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mb-8 min-h-[400px]">
        {activeTab === 'violations' && (
          <ViolationsTab
            flags={flags}
            expandedCard={expandedCard}
            setExpandedCard={setExpandedCard}
            translate={translate}
          />
        )}
        {activeTab === 'narrative' && <NarrativeTab flags={flags} editableFields={editableFields} />}
        {activeTab === 'deltas' && <DeltasTab deltas={deltas} />}

        {activeTab === 'patterns' && analytics && <PatternsTab patterns={analytics.patterns} />}
        {activeTab === 'timeline' && analytics && <TimelineTab timeline={analytics.timeline} />}
        {activeTab === 'caselaw' && <CaseLawTab relevantCaseLaw={relevantCaseLaw} />}
        {activeTab === 'breakdown' && <ScoreBreakdownTab riskProfile={riskProfile} />}
        {activeTab === 'lettereditor' && (

          <LetterEditorTab
            selectedLetterType={selectedLetterType}
            setSelectedLetterType={setSelectedLetterType}
            editableLetter={editableLetter}
            setEditableLetter={setEditableLetter}
            generatePDF={generatePDFLetter}
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
        {/* Placeholder for other tabs if needed */}
      </div>
    </div>
  );
};

export default Step4Analysis;
