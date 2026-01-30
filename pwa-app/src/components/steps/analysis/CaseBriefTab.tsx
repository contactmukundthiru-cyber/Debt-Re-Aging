'use client';

import React from 'react';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { STATES } from '../../../lib/constants';

interface BriefTask {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  done: boolean;
}

interface BriefMilestone {
  id: string;
  label: string;
  date: string;
}

interface CaseBrief {
  title: string;
  objective: string;
  focusArea: 'bureau' | 'furnisher' | 'collector' | 'multi';
  urgency: 'critical' | 'standard' | 'monitor';
  jurisdiction: string;
  notes: string;
  tasks: BriefTask[];
  milestones: BriefMilestone[];
}

const EMPTY_BRIEF: CaseBrief = {
  title: '',
  objective: '',
  focusArea: 'multi',
  urgency: 'standard',
  jurisdiction: 'CA',
  notes: '',
  tasks: [],
  milestones: []
};

const CaseBriefTab: React.FC = () => {
  const [brief, setBrief, clearBrief] = useLocalStorage<CaseBrief>('cra_case_brief_v1', EMPTY_BRIEF, {
    encrypt: false,
    syncTabs: true
  });
  const [taskText, setTaskText] = React.useState('');
  const [taskPriority, setTaskPriority] = React.useState<BriefTask['priority']>('medium');
  const [taskDueDate, setTaskDueDate] = React.useState('');
  const [milestoneLabel, setMilestoneLabel] = React.useState('');
  const [milestoneDate, setMilestoneDate] = React.useState('');
  const [copyStatus, setCopyStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const completedTasks = brief.tasks.filter(task => task.done).length;
  const totalTasks = brief.tasks.length;

  const addTask = () => {
    const trimmed = taskText.trim();
    if (!trimmed) return;

    const nextTask: BriefTask = {
      id: `task-${Date.now()}`,
      text: trimmed,
      priority: taskPriority,
      dueDate: taskDueDate,
      done: false
    };

    setBrief(prev => ({
      ...prev,
      tasks: [nextTask, ...prev.tasks]
    }));

    setTaskText('');
    setTaskDueDate('');
    setTaskPriority('medium');
  };

  const toggleTask = (id: string) => {
    setBrief(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => task.id === id ? { ...task, done: !task.done } : task)
    }));
  };

  const removeTask = (id: string) => {
    setBrief(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== id)
    }));
  };

  const addMilestone = () => {
    const trimmed = milestoneLabel.trim();
    if (!trimmed || !milestoneDate) return;

    const nextMilestone: BriefMilestone = {
      id: `milestone-${Date.now()}`,
      label: trimmed,
      date: milestoneDate
    };

    setBrief(prev => ({
      ...prev,
      milestones: [nextMilestone, ...prev.milestones]
    }));

    setMilestoneLabel('');
    setMilestoneDate('');
  };

  const removeMilestone = (id: string) => {
    setBrief(prev => ({
      ...prev,
      milestones: prev.milestones.filter(item => item.id !== id)
    }));
  };

  const buildSummary = () => {
    const milestones = brief.milestones
      .map(item => `- ${item.label} (${item.date})`)
      .join('\n');

    const tasks = brief.tasks
      .map(task => `- [${task.done ? 'x' : ' '}] ${task.text}${task.dueDate ? ` (due ${task.dueDate})` : ''}`)
      .join('\n');

    return [
      `CASE BRIEF: ${brief.title || 'Untitled Case'}`,
      `Objective: ${brief.objective || 'Not set'}`,
      `Focus: ${brief.focusArea}`,
      `Urgency: ${brief.urgency}`,
      `Jurisdiction: ${brief.jurisdiction || 'Not set'}`,
      '',
      'Milestones:',
      milestones || '- None added',
      '',
      'Action Checklist:',
      tasks || '- No tasks yet',
      '',
      'Notes:',
      brief.notes || 'No notes yet.'
    ].join('\n');
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummary());
      setCopyStatus('success');
    } catch (error) {
      console.warn('Unable to copy case brief', error);
      setCopyStatus('error');
    } finally {
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="premium-card p-6 bg-slate-950 text-white border-slate-800 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-500/10 rounded-full blur-[100px] -ml-28 -mb-28" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-bold font-mono">Operational Briefing</p>
            <h3 className="text-3xl font-black tracking-tight mt-2">Case Briefing Console</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Capture the case mission, establish key milestones, and track every action item in a single briefing view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copySummary}
              className="btn btn-secondary !px-5 !py-3 !rounded-xl !text-[11px] !font-bold !uppercase !tracking-widest bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              {copyStatus === 'success' ? 'Copied' : copyStatus === 'error' ? 'Copy Failed' : 'Copy Brief'}
            </button>
            <button
              type="button"
              onClick={clearBrief}
              className="btn btn-secondary !px-5 !py-3 !rounded-xl !text-[11px] !font-bold !uppercase !tracking-widest border-white/20 text-white/80 hover:text-white"
            >
              Reset Brief
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Case Identity</p>
                <h4 className="text-lg font-bold dark:text-white">Mission Metadata</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">LIVE</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Case Title</label>
                <input
                  type="text"
                  value={brief.title}
                  onChange={(e) => setBrief(prev => ({ ...prev, title: e.target.value }))}
                  className="input rounded-xl"
                  placeholder="Ex: Asset Acceptance re-aging dispute"
                />
              </div>
              <div>
                <label className="field-label">Jurisdiction</label>
                <select
                  value={brief.jurisdiction}
                  onChange={(e) => setBrief(prev => ({ ...prev, jurisdiction: e.target.value }))}
                  className="input rounded-xl"
                >
                  {STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Primary Objective</label>
                <input
                  type="text"
                  value={brief.objective}
                  onChange={(e) => setBrief(prev => ({ ...prev, objective: e.target.value }))}
                  className="input rounded-xl"
                  placeholder="Ex: Force deletion of re-aged account"
                />
              </div>
              <div>
                <label className="field-label">Focus Area</label>
                <select
                  value={brief.focusArea}
                  onChange={(e) => setBrief(prev => ({ ...prev, focusArea: e.target.value as CaseBrief['focusArea'] }))}
                  className="input rounded-xl"
                >
                  <option value="bureau">Bureau Dispute</option>
                  <option value="furnisher">Furnisher Direct</option>
                  <option value="collector">Collector Validation</option>
                  <option value="multi">Multi-Track</option>
                </select>
              </div>
              <div>
                <label className="field-label">Urgency</label>
                <select
                  value={brief.urgency}
                  onChange={(e) => setBrief(prev => ({ ...prev, urgency: e.target.value as CaseBrief['urgency'] }))}
                  className="input rounded-xl"
                >
                  <option value="critical">Critical - Escalate Now</option>
                  <option value="standard">Standard - Execute Plan</option>
                  <option value="monitor">Monitor - Gather Evidence</option>
                </select>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Strategic Notes</p>
            <textarea
              value={brief.notes}
              onChange={(e) => setBrief(prev => ({ ...prev, notes: e.target.value }))}
              className="textarea rounded-2xl min-h-[180px]"
              placeholder="Capture negotiation notes, evidence gaps, key contacts, or legal strategy cues."
            />
          </div>

          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Action Checklist</p>
                <h4 className="text-lg font-bold dark:text-white">Operational Tasks</h4>
              </div>
              <span className="text-xs font-bold text-slate-500">{completedTasks}/{totalTasks} done</span>
            </div>

            <div className="grid sm:grid-cols-[1fr_160px_160px_auto] gap-3 items-end">
              <div>
                <label className="field-label">Task</label>
                <input
                  type="text"
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  className="input rounded-xl"
                  placeholder="Ex: Request updated bureau report"
                />
              </div>
              <div>
                <label className="field-label">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as BriefTask['priority'])}
                  className="input rounded-xl"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="field-label">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="input rounded-xl"
                />
              </div>
              <button
                type="button"
                onClick={addTask}
                className="btn btn-primary !rounded-xl !px-4 !py-3"
              >
                Add
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {brief.tasks.length === 0 && (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
                  No tasks yet. Capture the immediate next steps to keep the case moving.
                </div>
              )}

              {brief.tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center ${task.done
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      {task.done && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div>
                      <p className={`text-sm font-semibold ${task.done ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                        {task.text}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">
                        {task.priority.toUpperCase()} PRIORITY{task.dueDate ? ` • DUE ${task.dueDate}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="premium-card p-6 bg-slate-950 text-white border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Progress Pulse</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400">Checklist Completion</p>
                <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: totalTasks === 0 ? '0%' : `${Math.round((completedTasks / totalTasks) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">{totalTasks === 0 ? '0%' : `${Math.round((completedTasks / totalTasks) * 100)}%`} complete</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Urgency</p>
                <p className="text-xl font-black uppercase tracking-wide">
                  {brief.urgency === 'critical' ? 'Critical' : brief.urgency === 'monitor' ? 'Monitor' : 'Standard'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Focus</p>
                <p className="text-sm font-semibold uppercase text-emerald-400">
                  {brief.focusArea}
                </p>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Milestones</p>
                <h4 className="text-lg font-bold dark:text-white">Key Dates</h4>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={milestoneLabel}
                onChange={(e) => setMilestoneLabel(e.target.value)}
                className="input rounded-xl"
                placeholder="Ex: CFPB complaint submission"
              />
              <div className="flex gap-3">
                <input
                  type="date"
                  value={milestoneDate}
                  onChange={(e) => setMilestoneDate(e.target.value)}
                  className="input rounded-xl"
                />
                <button
                  type="button"
                  onClick={addMilestone}
                  className="btn btn-primary !rounded-xl !px-4"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {brief.milestones.length === 0 && (
                <p className="text-sm text-slate-500">No milestones yet. Add key dates to keep the case on track.</p>
              )}
              {brief.milestones.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-semibold dark:text-white">{item.label}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">{item.date}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMilestone(item.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseBriefTab;
