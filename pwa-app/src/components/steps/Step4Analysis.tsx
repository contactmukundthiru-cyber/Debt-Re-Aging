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
import LegalShieldTab from './analysis/LegalShieldTab';
import LetterEditorTab from './analysis/LetterEditorTab';
import DiscoveryTab from './analysis/DiscoveryTab';
import ForensicLabTab from './analysis/ForensicLabTab';

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
      <div className="mb-6 p-4 panel border-l-4 border-l-gray-900 dark:border-l-white bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between shadow-sm">
        <div>
          <h3 className="heading-sm text-[10px] mb-1 dark:text-gray-400 uppercase tracking-tighter">Litigation Evidence Readiness</h3>
          <div className="flex items-center gap-3">
            <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${readiness > 80 ? 'bg-green-500' : readiness > 40 ? 'bg-blue-500' : 'bg-gray-900 dark:bg-white'}`} 
                style={{ width: `${readiness}%` }} 
              />
            </div>
            <span className="mono text-xs font-bold dark:text-white">{readiness}%</span>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab('discovery')}
          className="btn btn-ghost text-[10px] uppercase tracking-widest py-1 px-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-white dark:hover:bg-gray-800 dark:text-white"
        >
          Audit Evidence
        </button>
      </div>

      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="heading-lg mb-1 dark:text-white">Analysis Results</h2>
          <p className="body-md text-gray-600 dark:text-gray-400">
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
          <button 
            type="button" 
            onClick={() => window.print()} 
            className="btn btn-secondary shadow-sm dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
          >
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
        <div className="panel-elevated p-6 lg:col-span-1 dark:bg-gray-800 dark:border-gray-700">
          <p className="label text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-widest text-[10px]">Case Strength</p>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-5xl font-light tracking-tight dark:text-white">{riskProfile.overallScore}</span>
            <span className="text-gray-400 dark:text-gray-500 mb-2">/100</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Risk Level</span>
              <span className={`font-medium uppercase text-xs tracking-wider ${
                riskProfile.riskLevel === 'critical' ? 'text-red-500' : 
                riskProfile.riskLevel === 'high' ? 'text-orange-500' : 'text-gray-900 dark:text-blue-400'
              }`}>{riskProfile.riskLevel}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Dispute Strength</span>
              <span className="font-medium uppercase text-xs tracking-wider dark:text-white">{riskProfile.disputeStrength}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500 dark:text-gray-400">Litigation Potential</span>
              <span className="font-medium dark:text-white">{riskProfile.litigationPotential ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Issue Breakdown */}
        <div className="panel p-6 lg:col-span-1 dark:bg-gray-800/50 dark:border-gray-700">
          <p className="label text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-widest text-[10px]">Issues by Severity</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="flex-1 text-sm dark:text-gray-300">High Severity</span>
              <span className="heading-md dark:text-white">{issuesByPriority.high.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="flex-1 text-sm dark:text-gray-300">Medium</span>
              <span className="heading-md dark:text-white">{issuesByPriority.medium.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="flex-1 text-sm dark:text-gray-300">Low</span>
              <span className="heading-md dark:text-white">{issuesByPriority.low.length}</span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {analytics && (
          <div className="panel p-6 lg:col-span-1 dark:bg-gray-800/50 dark:border-gray-700">
            <p className="label text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-widest text-[10px]">Forensic Metrics</p>
            <div className="space-y-2">
              {Object.entries(analytics.metrics).map(([key, item]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{key}</span>
                  <span className={`font-mono text-sm ${
                    item.status === 'critical' ? 'text-red-600' :
                    item.status === 'warning' ? 'text-amber-600' : 'text-gray-900 dark:text-white'
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
                className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isSelected
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
        {activeTab === 'deltas' && <DeltasTab deltas={deltas} />}
        {activeTab === 'patterns' && analytics && <PatternsTab patterns={analytics.patterns} />}
        {activeTab === 'timeline' && analytics && <TimelineTab timeline={analytics.timeline} />}
        {activeTab === 'caselaw' && <CaseLawTab relevantCaseLaw={relevantCaseLaw} />}
        {activeTab === 'breakdown' && <ScoreBreakdownTab riskProfile={riskProfile} />}
        {activeTab === 'legalshield' && <LegalShieldTab editableFields={editableFields} />}
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
