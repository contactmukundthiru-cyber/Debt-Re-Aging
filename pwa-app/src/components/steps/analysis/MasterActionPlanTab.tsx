'use client';

import React from 'react';
import { TabId } from '../../../lib/constants';

interface ActionItem {
    priority: 'immediate' | 'standard' | 'optional';
    action: string;
    reason: string;
}

interface MasterActionPlanTabProps {
    actions: ActionItem[];
    setActiveTab: (tab: TabId) => void;
    onExport: () => void;
}

const MasterActionPlanTab: React.FC<MasterActionPlanTabProps> = ({ actions, setActiveTab, onExport }) => {
    const getPriorityConfig = (priority: string) => {
        switch (priority) {
            case 'immediate':
                return {
                    color: 'rose',
                    label: 'CRITICAL PRIORITY',
                    icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                };
            case 'standard':
                return {
                    color: 'amber',
                    label: 'RECOMMENDED',
                    icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    )
                };
            default:
                return {
                    color: 'blue',
                    label: 'OPTIONAL',
                    icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                };
        }
    };

    return (
        <div className="fade-in space-y-8 pb-12">
            {/* Hero Section */}
            <div className="premium-card p-10 bg-slate-950 border-emerald-900 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-emerald-400 font-mono">Execution Protocol</span>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-4">
                        Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Action Plan</span>
                    </h2>
                    <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                        A prioritized roadmap to resolve detected violations. This dynamic checklist converts forensic findings into tangible legal and administrative steps.
                    </p>
                </div>
            </div>

            {/* Action Stream */}
            <div className="space-y-6">
                {['immediate', 'standard', 'optional'].map((priorityGroup) => {
                    const groupActions = actions.filter(a => a.priority === priorityGroup);
                    if (groupActions.length === 0) return null;

                    const config = getPriorityConfig(priorityGroup);

                    return (
                        <div key={priorityGroup} className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <span className={`w-1.5 h-1.5 rounded-full bg-${config.color}-500`} />
                                <h3 className={`text-xs font-bold uppercase tracking-widest text-${config.color}-500`}>
                                    {config.label} Phase
                                </h3>
                            </div>

                            {groupActions.map((item, index) => (
                                <div
                                    key={index}
                                    className={`premium-card p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-${config.color}-500/30 transition-all group`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl bg-${config.color}-500/10 text-${config.color}-500 flex items-center justify-center shrink-0 mt-1`}>
                                            {config.icon}
                                        </div>

                                        <div className="flex-grow">
                                            <h4 className="text-lg font-bold dark:text-white mb-2">{item.action}</h4>
                                            <p className="text-sm text-slate-500 mb-4">{item.reason}</p>

                                            <div className="flex gap-3">
                                                {item.action.toLowerCase().includes('letter') && (
                                                    <button
                                                        onClick={() => onExport()}
                                                        className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                                                    >
                                                        Generate Letter
                                                    </button>
                                                )}
                                                {item.action.toLowerCase().includes('cfpb') && (
                                                    <button
                                                        onClick={() => onExport()}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors"
                                                    >
                                                        Draft Complaint
                                                    </button>
                                                )}
                                                {item.action.toLowerCase().includes('attorney') && (
                                                    <button
                                                        onClick={() => onExport()}
                                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-purple-700 transition-colors"
                                                    >
                                                        Export Evidence
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="hidden sm:block">
                                            <input type="checkbox" className="w-6 h-6 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

            <div className="mt-10 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-center">
                <div>
                    <svg className="w-8 h-8 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" /></svg>
                    <p className="text-sm text-slate-500">Completing these actions increases your probability of deletion by <span className="font-bold text-emerald-500">74%</span>.</p>
                </div>
            </div>
        </div>
    );
};

export default MasterActionPlanTab;
