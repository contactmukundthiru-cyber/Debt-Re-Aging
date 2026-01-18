'use client';

import React, { useState, useEffect } from 'react';
import {
    getWorkflowStatus,
    initializeDisputeWorkflow,
    updateWorkflowStep,
    DisputeWorkflow,
    WorkflowStep
} from '../../../lib/dispute-workflow';

interface WorkflowTrackerTabProps {
    caseId: string;
}

const WorkflowTrackerTab: React.FC<WorkflowTrackerTabProps> = ({ caseId }) => {
    const [workflow, setWorkflow] = useState<DisputeWorkflow | null>(null);

    useEffect(() => {
        // In a real app, we'd load this from local storage
        const existing = getWorkflowStatus(caseId);
        if (existing) {
            setWorkflow(existing);
        } else {
            // Mock initialization
            const ws = initializeDisputeWorkflow(caseId, 'experian', ['Wrong Balance', 'Old Debt']);
            setWorkflow(ws);
        }
    }, [caseId]);

    const handleStepComplete = (stepId: string) => {
        if (!workflow) return;
        const updated = updateWorkflowStep(caseId, stepId, 'completed');
        if (updated) setWorkflow(updated);
    };

    const getStatusColor = (status: WorkflowStep['status']) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500 border-emerald-500 text-white';
            case 'in_progress': return 'bg-blue-500 border-blue-500 text-white';
            case 'overdue': return 'bg-rose-500 border-rose-500 text-white';
            default: return 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-300';
        }
    };

    if (!workflow) return null;

    return (
        <div className="fade-in space-y-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold dark:text-white mb-2">Dispute Lifecycle</h2>
                    <p className="text-slate-500">Track milestones, deadlines, and statutory requirements.</p>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Current Phase</p>
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{workflow.currentPhase.replace('_', ' ')}</p>
                    </div>
                    <div className="w-px h-8 bg-indigo-500/20" />
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Overall Progress</p>
                        <p className="text-sm font-bold dark:text-white tabular-nums">{Math.round((workflow.steps.filter(s => s.status === 'completed').length / workflow.steps.length) * 100)}%</p>
                    </div>
                </div>
            </div>

            {/* Steps Timeline */}
            <div className="relative space-y-8 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                {workflow.steps.map((step, idx) => (
                    <div key={step.id} className="relative pl-12">
                        {/* Timeline Marker */}
                        <div className={`absolute left-0 top-1 w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 transition-all shadow-lg ${getStatusColor(step.status)}`}>
                            {step.status === 'completed' ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <span className="text-xs font-bold">{idx + 1}</span>
                            )}
                        </div>

                        <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h4 className="text-lg font-bold dark:text-white">{step.title}</h4>
                                    <p className="text-sm text-slate-500">{step.description}</p>
                                </div>
                                {step.deadline && (
                                    <div className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 shrink-0">
                                        <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span className="text-[10px] font-bold text-rose-600 uppercase">Deadline: {new Date(step.deadline).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {step.status !== 'completed' ? (
                                    <button
                                        onClick={() => handleStepComplete(step.id)}
                                        className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all"
                                    >
                                        Mark as Completed
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <span className="text-[10px] font-bold uppercase">Completed on {new Date(step.completedAt!).toLocaleDateString()}</span>
                                    </div>
                                )}

                                {step.statutoryReference && (
                                    <span className="text-[9px] font-mono text-slate-400 uppercase bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                                        Ref: {step.statutoryReference}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Communications Tracker */}
            <div className="premium-card p-8 bg-slate-950 text-white border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]" />
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        Communication Log
                    </h3>
                    <div className="space-y-4">
                        {workflow.communications.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No communication items logged yet.</p>
                        ) : (
                            workflow.communications.map((comm, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{comm.direction} &middot; {comm.method}</p>
                                        <p className="text-sm font-medium">{comm.subject}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-mono text-slate-500">{new Date(comm.timestamp).toLocaleString()}</p>
                                        <span className="text-[10px] font-bold text-blue-400 uppercase">{comm.trackingNumber || 'No Tracking'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowTrackerTab;
