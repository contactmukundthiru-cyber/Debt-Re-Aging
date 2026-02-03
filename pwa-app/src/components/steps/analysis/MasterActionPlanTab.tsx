'use client';

import React from 'react';
import { TabId, LetterType } from '../../../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Flag, 
    Zap, 
    ArrowRight, 
    ShieldAlert, 
    FileCheck, 
    Calendar,
    Target,
    Activity,
    Lock,
    Scale,
    ShieldCheck,
    ChevronRight,
    Send
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ActionItem {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    tabLink?: TabId;
    letterType?: LetterType;
}

interface MasterActionPlanTabProps {
    actions?: ActionItem[];
    setActiveTab: (tab: TabId) => void;
    setSelectedLetterType?: (type: LetterType) => void;
    onExport: () => void;
}

const MasterActionPlanTab: React.FC<MasterActionPlanTabProps> = ({ actions = [], setActiveTab, setSelectedLetterType, onExport }) => {
    const handleActionClick = (action: ActionItem) => {
        if (action.letterType && setSelectedLetterType) {
            setSelectedLetterType(action.letterType);
            setActiveTab('lettereditor');
        } else if (action.tabLink) {
            setActiveTab(action.tabLink);
        }
    };

    return (
        <div className="fade-in space-y-12 pb-32 px-2">
            {/* Action Protocol Header */}
            <section className="relative">
                <div className="relative bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 p-12">
                    <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full flex items-center gap-2">
                                    <Zap size={14} className="text-blue-600" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600">Action Protocol Engine</span>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Institutional Strategy</span>
                            </div>

                            <h2 className="text-6xl font-extrabold text-slate-900 tracking-tight leading-none">
                                Action <span className="text-blue-600">Protocol</span>
                            </h2>
                            <p className="text-slate-500 text-lg leading-relaxed max-w-xl font-medium">
                                Synthesis of institutional maneuvers derived from technical findings. Optimized for regulatory pressure and maximum compliance enforcement.
                            </p>
                            
                            <div className="flex items-center gap-12">
                                 <div>
                                     <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Items Indexed</p>
                                     <p className="text-6xl font-bold text-slate-900 tracking-tighter tabular-nums">{actions.length + 2}</p>
                                 </div>
                                 <div className="h-12 w-px bg-slate-100 hidden sm:block" />
                                 <div>
                                     <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Status</p>
                                     <p className="text-2xl font-bold text-blue-600 tracking-tight uppercase">Calibrated</p>
                                 </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                             <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                                <div className="relative z-10">
                                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Final Objective</h4>
                                    <p className="text-2xl font-bold leading-tight mb-8">
                                        Execute communication package to force institutional audit.
                                    </p>
                                </div>
                                <button
                                    onClick={onExport}
                                    className="w-full py-5 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-lg"
                                >
                                    Dispatch Package <Send size={14} />
                                </button>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Strategy Grid */}
            <div className="grid lg:grid-cols-2 gap-12">
                {/* Phase 01 */}
                <div className="space-y-10">
                    <div className="flex items-center gap-6 px-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Phase 01: Deployment</h4>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Initial Regulatory Strike</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Static Priority Item */}
                        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 relative group">
                            <div className="flex justify-between items-center mb-6">
                                <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">Immediate</span>
                                <ShieldAlert size={18} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-3">Regulatory Escalation</h4>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                                File formal complaints with oversight agencies to force manual institution-level audit of the technical discrepancies found.
                            </p>
                            <button 
                                onClick={() => setActiveTab('overview')} 
                                className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform"
                            >
                                Open Deployment Node <ChevronRight size={14} />
                            </button>
                        </div>

                        {actions.map((action, idx) => (action.priority === 'high' || action.priority === 'medium') && (
                            <div 
                                key={action.id}
                                className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest">Protocol {idx + 1}</span>
                                    <Target size={18} className="text-slate-200" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">{action.title}</h4>
                                <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
                                    {action.description}
                                </p>
                                <button 
                                    onClick={() => handleActionClick(action)} 
                                    className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors shadow-none"
                                >
                                    Execute <ChevronRight size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Phase 02 */}
                <div className="space-y-10">
                    <div className="flex items-center gap-6 px-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                            <Scale size={24} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Phase 02: Adjudication</h4>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Verification Cleanup</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-emerald-50/30 border border-emerald-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 relative group">
                            <div className="flex justify-between items-center mb-6">
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-widest">Verification</span>
                                <FileCheck size={18} className="text-emerald-300 group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-3">Institutional Affidavit</h4>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed mb-8">
                                Document all technical findings into a notarized statement of fact to establish prime facie evidence for potential recovery.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                                Status: Ready for Prep
                            </div>
                        </div>

                        {actions.map((action, idx) => (action.priority === 'low') && (
                            <div 
                                key={action.id}
                                className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secondary</span>
                                    <Lock size={14} className="text-slate-200" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">{action.title}</h4>
                                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                    {action.description}
                                </p>
                            </div>
                        ))}

                        <div className="p-12 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                            <ShieldCheck size={32} className="text-slate-300 mb-6" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Institutional Assurance</p>
                            <p className="text-slate-900 font-bold mb-6 italic">Verification Protocol v5.0 Active</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};

export default MasterActionPlanTab;

export default MasterActionPlanTab;
