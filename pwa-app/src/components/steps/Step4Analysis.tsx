'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText,
  Search,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ANALYSIS_TABS, TabId, LetterType } from '../../lib/constants';
import { RuleFlag, RiskProfile, CreditFields, ConsumerInfo } from '../../lib/types';
import { CaseLaw } from '../../lib/caselaw';
import { CollectorMatch } from '../../lib/collector-database';
import { DeltaResult, SeriesInsight, SeriesSnapshot, SeriesSnapshotOption } from '../../lib/delta';
import { STATE_LAWS } from '../../lib/state-laws';

// Refactored Sub-components
import CaseSummaryDashboard from './analysis/CaseSummaryDashboard';
import Metro2AuditTab from './analysis/Metro2AuditTab';
import StatuteTrackerTab from './analysis/StatuteTrackerTab';
import LiabilityRadarTab from './analysis/LiabilityRadarTab';
import MasterActionPlanTab from './analysis/MasterActionPlanTab';
import { GuideOverlay } from '../GuideOverlay';

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
  analytics: {
    actions: Array<{ action: string; reason: string; priority: 'immediate' | 'standard' | 'optional' }>;
  } | null;
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
  const [showGuide, setShowGuide] = useState(false);

  const readiness = useMemo(() => {
    const totalPossibleEvidence = Array.from(new Set(flags.flatMap(f => f.suggestedEvidence))).length;
    const checkedEvidenceCount = Object.keys(discoveryAnswers).filter(k => k.startsWith('ev-') && discoveryAnswers[k] === 'checked').length;
    return totalPossibleEvidence > 0 ? Math.round((checkedEvidenceCount / totalPossibleEvidence) * 100) : 0;
  }, [flags, discoveryAnswers]);

  // Strategy Synthesis Engine
  const actionPlan = useMemo(() => {
    const baseActions = analytics?.actions.map((item, i) => ({
      id: `action-${i}`,
      title: item.action,
      description: item.reason,
      priority: item.priority === 'immediate' ? 'high' : item.priority === 'optional' ? 'low' : 'medium' as any,
    })) || [];

    // Inject intelligence if we have specific findings
    const syntheticActions: any[] = [];
    
    // Check for SOL
    const dlp = editableFields.dateLastPayment;
    if (dlp) {
      const state = consumer.state || 'CA';
      const law = STATE_LAWS[state];
      if (law) {
        const years = law.sol.openAccounts; // Defaulting to open accounts for analysis
        const date = new Date(dlp);
        date.setFullYear(date.getFullYear() + years);
        if (date < new Date()) {
          syntheticActions.push({
            id: 'syn-sol',
            title: 'Statute of Limitations Enforcement',
            description: `The debt at hand is past the ${years}-year limitation for ${state}. Priority should shift to Cease and Desist protocol.`,
            priority: 'high',
            letterType: 'cease_desist'
          });
        }
      }
    }

    // Check for Metro 2 errors
    if (flags.some(f => f.ruleName.includes('Metro'))) {
      syntheticActions.push({
        id: 'syn-m2',
        title: 'Metro 2® Structural Audit Demand',
        description: 'Systemic compliance failures detected. Require the furnisher to provide the raw Metro 2 data log.',
        priority: 'high',
        letterType: 'audit'
      });
    }

    const finalActions = [...syntheticActions, ...baseActions].map(a => ({
       ...a,
       tabLink: 'lettereditor' as any,
       letterType: a.letterType || (a.title.toLowerCase().includes('validation') ? 'validation' : 
                          a.title.toLowerCase().includes('bureau') ? 'bureau' :
                          a.title.toLowerCase().includes('furnisher') ? 'furnisher' :
                          a.title.toLowerCase().includes('cease') ? 'cease_desist' :
                          a.title.toLowerCase().includes('sue') ? 'intent_to_sue' : undefined)
    }));

    return finalActions;
  }, [flags, analytics, editableFields, consumer]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <CaseSummaryDashboard flags={flags} riskProfile={riskProfile} readiness={readiness} />;
      case 'metro2':
        return <Metro2AuditTab fields={editableFields} />;
      case 'statutes':
        return <StatuteTrackerTab fields={editableFields} />;
      case 'liability':
        return <LiabilityRadarTab flags={flags} />;
      case 'actions':
        return (
          <MasterActionPlanTab
            actions={actionPlan}
            setActiveTab={setActiveTab as any}
            setSelectedLetterType={setSelectedLetterType}
            onExport={() => setActiveTab('actions' as any)}
          />
        );
      default:
        return <CaseSummaryDashboard flags={flags} riskProfile={riskProfile} readiness={readiness} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Institutional Top Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={20} />
              <span className="font-bold text-slate-900 tracking-tight">Institutional Auditor</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-6">
              {ANALYSIS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "text-xs font-semibold transition-colors relative h-16 px-1 border-b-2",
                    activeTab === tab.id ? "text-blue-600 border-blue-600" : "text-slate-500 hover:text-slate-900 border-transparent"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => generateForensicReport(editableFields, flags, riskProfile, relevantCaseLaw, consumer, discoveryAnswers)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
            >
              <FileText size={14} />
              Export Audit
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-[1400px] mx-auto px-6 pt-12">
        {/* Metric Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Identified Violations', value: flags.length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Compliance Index', value: `${Math.max(0, 100 - (flags.length * 5))}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Audit Readiness', value: `${readiness}%`, icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Statute Status', value: 'Active', icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
          ].map((metric, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{metric.label}</p>
                <p className={cn("text-2xl font-black tabular-nums", metric.color)}>{metric.value}</p>
              </div>
              <div className={cn("p-3 rounded-xl", metric.bg)}>
                <metric.icon size={20} className={metric.color} />
              </div>
            </div>
          ))}
        </div>

        {/* Tab Content Display */}
        <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {renderActiveTab()}
        </div>
      </main>

      {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} />}
    </div>
  );
});

Step4Analysis.displayName = 'Step4Analysis';

export default Step4Analysis;



