'use client';

import React, { useEffect, useState } from 'react';
import { ANALYSIS_TABS, TabId, LetterType } from '../../lib/constants';
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
import { getSmartRecommendations } from '../../lib/intelligence';


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
            rawText=""
          />
        )}

        {activeTab === 'narrative' && <NarrativeTab flags={flags} editableFields={editableFields} />}

        {activeTab === 'actions' && (
          <MasterActionPlanTab
            actions={analytics?.actions.map((item, i) => ({
              id: `action-${i}`,
              title: item.action,
              description: item.reason,
              priority: item.priority === 'immediate' ? 'high' : item.priority === 'optional' ? 'low' : 'medium'
            })) || []}
            setActiveTab={setActiveTab}
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

        {activeTab === 'timeline' && analytics && <TimelineTab timeline={analytics.timeline} />}

        {activeTab === 'evidence' && <EvidenceManagerTab caseId="current-case" />}

        {activeTab === 'workflow' && <WorkflowTrackerTab caseId="current-case" />}

        {activeTab === 'voice' && <VoiceTranscriptionTab />}

        {activeTab === 'caselaw' && <CaseLawTab relevantCaseLaw={relevantCaseLaw} />}

        {activeTab === 'deltas' && <DeltasTab deltas={deltas} />}

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
