'use client';

import React from 'react';
import { TabId } from '../../../lib/constants';

interface ActionItem {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    tabLink?: TabId;
}

interface MasterActionPlanTabProps {
    actions?: ActionItem[];
    setActiveTab: (tab: TabId) => void;
    onExport: () => void;
}

const MasterActionPlanTab: React.FC<MasterActionPlanTabProps> = ({ actions = [], setActiveTab, onExport }) => {
    return (
        <div className="fade-in space-y-8 pb-12">
            <div className="premium-card p-8 bg-slate-900 border-blue-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-4">Master Action Plan</h2>
                    <p className="text-slate-400 max-w-2xl leading-relaxed">
                        Based on the forensic analysis of your credit file, we have generated a prioritized checklist of actions to remediate errors and leverage statutory violations.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Immediate Actions (0-7 Days)</h3>
                    {/* Hardcoded defaults if no AI actions provided */}
                    <div className="premium-card p-6 border-l-4 border-l-emerald-500">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold dark:text-white">File CFPB Complaint</h4>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded">High Priority</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Your audit detected Metro 2 format errors. File a direct complaint to force a manual review.
                        </p>
                        <button onClick={() => setActiveTab('escalation')} className="text-xs font-bold text-blue-500 hover:underline">
                            Go to Escalation Engine &rarr;
                        </button>
                    </div>

                    <div className="premium-card p-6 border-l-4 border-l-blue-500">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold dark:text-white">Freeze Secondary Exchanges</h4>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded">Medium Priority</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Prevent the bureaus from validating data with 3rd party exchanges like LexisNexis.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Litigation Strategy (15-30 Days)</h3>
                    <div className="premium-card p-6 border-l-4 border-l-amber-500">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold dark:text-white">Prepare Affidavit of Fact</h4>
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded">Critical</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            notarize your findings to create admissible evidence for a potential small claims lawsuit.
                        </p>
                        <button onClick={() => setActiveTab('escalation')} className="text-xs font-bold text-blue-500 hover:underline">
                            Generate Affidavit &rarr;
                        </button>
                    </div>

                    <div className="premium-card p-8 bg-slate-50 dark:bg-slate-900 border-dashed border-2 flex flex-col items-center justify-center text-center">
                        <p className="font-serif text-xl italic text-slate-400 mb-4">"Ready to execute?"</p>
                        <button
                            onClick={onExport}
                            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:scale-105 transition-transform"
                        >
                            Go to Letter Editor
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterActionPlanTab;
