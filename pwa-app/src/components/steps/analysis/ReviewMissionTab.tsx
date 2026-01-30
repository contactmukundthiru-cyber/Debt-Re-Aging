'use client';

import React from 'react';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { CreditFields, RuleFlag } from '../../../lib/rules';
import { buildDeadlineTracker } from '../../../lib/countdown';
import { TabId } from '../../../lib/constants';

interface ReviewMissionTabProps {
  flags: RuleFlag[];
  fields: Partial<CreditFields>;
  discoveryAnswers: Record<string, string>;
  setActiveTab: (tab: TabId) => void;
}

interface ReviewTask {
  id: string;
  label: string;
  done: boolean;
}

const ReviewMissionTab: React.FC<ReviewMissionTabProps> = ({ flags, fields, discoveryAnswers, setActiveTab }) => {
  const [tasks, setTasks] = useLocalStorage<ReviewTask[]>('cra_review_checklist_v1', []);

  const criticalFlags = React.useMemo(() => flags.filter(flag => flag.severity === 'high').slice(0, 5), [flags]);
  const tracker = React.useMemo(() => {
    try {
      return buildDeadlineTracker(fields as CreditFields);
    } catch {
      return null;
    }
  }, [fields]);

  const deadlines = tracker?.countdowns.filter(item => item.daysRemaining <= 30 && !item.isExpired) || [];

  const totalEvidence = Array.from(new Set(flags.flatMap(flag => flag.suggestedEvidence))).length;
  const checkedEvidence = Object.keys(discoveryAnswers).filter(key => key.startsWith('ev-') && discoveryAnswers[key] === 'checked').length;
  const readiness = totalEvidence > 0 ? Math.round((checkedEvidence / totalEvidence) * 100) : 0;

  React.useEffect(() => {
    if (tasks.length > 0) return;
    const baseline: ReviewTask[] = [
      { id: 'review-violations', label: 'Review all high-severity violations and evidence requirements', done: false },
      { id: 'update-deadlines', label: 'Confirm dispute submission dates and export calendar', done: false },
      { id: 'verify-fields', label: 'Validate DOFD, last payment, and account status in the workbench', done: false },
      { id: 'prep-docs', label: 'Generate dispute letters + attorney bundle for handoff', done: false }
    ];
    setTasks(baseline);
  }, [setTasks, tasks.length]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, done: !task.done } : task));
  };

  return (
    <div className="space-y-8">
      <div className="premium-card p-6 bg-slate-950 text-white border-slate-800 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[110px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-500/10 rounded-full blur-[100px] -ml-28 -mb-28" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-bold font-mono">Guided Review</p>
            <h3 className="text-3xl font-black tracking-tight mt-2">Case Review Checklist</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              A prioritized briefing view that fuses violations, deadlines, and evidence readiness into a single action plan.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('violations')}
              className="btn btn-secondary !px-4 !py-3 !rounded-xl !text-[10px] !uppercase !tracking-widest bg-white/10 text-white border-white/20"
            >
              View Violations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deadlines')}
              className="btn btn-secondary !px-4 !py-3 !rounded-xl !text-[10px] !uppercase !tracking-widest bg-white/10 text-white border-white/20"
            >
              View Deadlines
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('discovery')}
              className="btn btn-secondary !px-4 !py-3 !rounded-xl !text-[10px] !uppercase !tracking-widest bg-white/10 text-white border-white/20"
            >
              Evidence Checklist
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Critical Findings</p>
                <h4 className="text-lg font-bold dark:text-white">Top Risk Nodes</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('violations')}
                className="text-xs font-bold uppercase tracking-widest text-emerald-500"
              >
                Open Full Log
              </button>
            </div>
            <div className="space-y-3">
              {criticalFlags.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-sm text-slate-500">
                  No high severity violations detected. Focus on data verification and timeline compliance.
                </div>
              ) : (
                criticalFlags.map(flag => (
                  <div key={flag.ruleId} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <p className="text-xs font-bold dark:text-white">{flag.ruleName}</p>
                    <p className="text-[10px] uppercase tracking-widest text-rose-500">{flag.severity} priority</p>
                    <p className="text-xs text-slate-500 mt-2">{flag.explanation}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Upcoming Deadlines</p>
                <h4 className="text-lg font-bold dark:text-white">30-Day Watchlist</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('deadlines')}
                className="text-xs font-bold uppercase tracking-widest text-emerald-500"
              >
                Open Matrix
              </button>
            </div>
            <div className="space-y-3">
              {deadlines.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-sm text-slate-500">
                  No deadlines within 30 days. Update dispute submission dates to refine timeline alerts.
                </div>
              ) : (
                deadlines.map((deadline, index) => (
                  <div key={`${deadline.type}-${index}`} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <p className="text-xs font-bold dark:text-white">{deadline.label}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Due {deadline.targetDate.toLocaleDateString()} • {deadline.daysRemaining} days</p>
                    <p className="text-xs text-slate-500 mt-2">{deadline.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="premium-card p-6 bg-slate-950 text-white border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Evidence Readiness</p>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${readiness}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-3">{readiness}% evidence logged • {checkedEvidence}/{totalEvidence} items confirmed</p>
            <button
              type="button"
              onClick={() => setActiveTab('discovery')}
              className="btn btn-secondary w-full !mt-4 !rounded-xl !py-3 !text-[10px] !uppercase !tracking-widest bg-white/10 text-white border-white/20"
            >
              Update Evidence
            </button>
          </div>

          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Action Checklist</p>
                <h4 className="text-lg font-bold dark:text-white">Execution Tasks</h4>
              </div>
            </div>
            <div className="space-y-3">
              {tasks.map(task => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all ${task.done
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-200 hover:border-emerald-500/40'
                  }`}
                >
                  <span className="text-sm font-semibold">{task.label}</span>
                  <span className="text-xs font-bold uppercase tracking-widest">{task.done ? 'Done' : 'Pending'}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('lettereditor')}
              className="btn btn-primary w-full !mt-4 !rounded-xl !py-3"
            >
              Generate Documents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewMissionTab;
