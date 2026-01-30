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
    Scale
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
        <div className="fade-in space-y-12 pb-32">
            {/* Action Brief Summary */}
            <div className="relative p-1 rounded-[3rem] bg-gradient-to-b from-slate-800 to-slate-950 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay"></div>
                <div className="relative z-10 p-12 bg-slate-950/90 rounded-[2.8rem] backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] -mr-80 -mt-80" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="max-w-2xl text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
                                <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-blue-400 font-mono">Mission ID: EXEC-01</span>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500 font-mono">Status: CALIBRATED</span>
                            </div>
                            <h2 className="text-6xl font-black text-white tracking-tight mb-8 leading-[1.1]">
                                Master <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Execution Plan</span>
                            </h2>
                            <p className="text-slate-400 text-xl leading-relaxed font-light">
                                Prioritized synthesis of tactical maneuvers derived from active forensic findings. Each action is calibrated for maximum institutional impact and liability maximization.
                            </p>
                        </div>

                        <div className="flex flex-col items-center justify-center p-12 rounded-full bg-slate-900 border border-slate-800 shadow-inner min-w-[220px] h-[220px] relative">
                            <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full border-t-blue-500 animate-[spin_8s_linear_infinite]" />
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 relative z-10 font-bold">Actions Indexed</p>
                            <p className="text-6xl font-black tabular-nums text-white relative z-10 font-mono tracking-tighter">{(actions.length + 3)}</p>
                            <div className="mt-2 text-[8px] font-mono text-blue-500/60 uppercase tracking-[0.3em]">Ready for Dispatch</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
                {/* Tactical Execution: Phase 1 */}
                <div className="space-y-10">
                    <div className="flex items-center gap-6 mb-4">
                        <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-2xl">
                            <Zap size={28} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight">Phase 1: Deployment</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-mono">T-MINUS 0-7 DAYS</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Static High Priority Item */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="group p-1 rounded-[2.5rem] bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/80 transition-all duration-500"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-mono font-bold uppercase rounded-full border border-emerald-500/20 tracking-widest">
                                        PRIORITY_CRITICAL
                                    </div>
                                    <Activity size={18} className="text-slate-700 group-hover:text-emerald-500 transition-colors" />
                                </div>
                                <h4 className="text-xl font-black text-white uppercase font-mono tracking-tight mb-3">Initialize Regulatory Escalation</h4>
                                <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium uppercase text-[11px] tracking-tight pr-12">
                                    Detected Metro 2 format variances require mandatory regulatory oversight. File CFPB/AG complaints to force manual institution-level audit.
                                </p>
                                <button 
                                    onClick={() => setActiveTab('escalation')} 
                                    className="flex items-center gap-4 text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] group/btn"
                                >
                                    Access Escalation Node 
                                    <ArrowRight size={14} className="group-hover/btn:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        </motion.div>

                        {actions.map((action, idx) => (
                            <motion.div 
                                key={action.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group p-1 rounded-[2.5rem] bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 transition-all duration-500"
                            >
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={cn(
                                            "px-4 py-1.5 text-[9px] font-mono font-bold uppercase rounded-full border tracking-widest",
                                            action.priority === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                                            action.priority === 'medium' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                            'bg-slate-500/10 text-slate-500 border-slate-800'
                                        )}>
                                            {action.priority}_PRIORITY
                                        </div>
                                        <Lock size={18} className="text-slate-800 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <h4 className="text-xl font-black text-white uppercase font-mono tracking-tight mb-3">{action.title}</h4>
                                    <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium uppercase text-[11px] tracking-tight pr-12">
                                        {action.description}
                                    </p>
                                    <button 
                                        onClick={() => handleActionClick(action)} 
                                        className="flex items-center gap-4 text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] group/btn"
                                    >
                                        Execute Command Node 
                                        <ArrowRight size={14} className="group-hover/btn:translate-x-2 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Tactical Strategy: Phase 2 */}
                <div className="space-y-10">
                    <div className="flex items-center gap-6 mb-4">
                        <div className="w-16 h-16 rounded-[2rem] bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-2xl">
                            <Scale size={28} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight">Phase 2: Adjudication</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-mono">T-MINUS 15-45 DAYS</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="group p-1 rounded-[2.5rem] bg-slate-900 border border-slate-800 relative overflow-hidden"
                        >
                             <div className="p-8 relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="px-4 py-1.5 bg-amber-500/10 text-amber-500 text-[9px] font-mono font-bold uppercase rounded-full border border-amber-500/20 tracking-widest">
                                        STRATEGIC_PREP
                                    </div>
                                    <FileCheck size={18} className="text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                                </div>
                                <h4 className="text-xl font-black text-white uppercase font-mono tracking-tight mb-3">Prepare Forensic Affidavit</h4>
                                <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium uppercase text-[11px] tracking-tight">
                                    Finalize all forensic findings into a notarized Affidavit of Fact. This establishes prime facie evidence for potential litigation recovery.
                                </p>
                                <button 
                                    onClick={() => setActiveTab('escalation')} 
                                    className="flex items-center gap-4 text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] group/btn"
                                >
                                    Generate Legal Instrument 
                                    <ArrowRight size={14} className="group-hover/btn:translate-x-2 transition-transform" />
                                </button>
                             </div>
                             <div className="absolute bottom-0 right-0 p-8 opacity-5">
                                <Scale size={140} />
                             </div>
                        </motion.div>

                        <div className="p-12 rounded-[2.5rem] bg-slate-950 border-2 border-dashed border-slate-900 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 mb-8">
                                <Target size={32} className="text-blue-500/50" />
                            </div>
                            <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.4em] mb-8">Dispatch Package Ready</p>
                            <button
                                onClick={onExport}
                                className="w-full py-5 bg-white text-slate-950 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-500 hover:text-white transition-all transform hover:scale-[1.02] shadow-2xl"
                            >
                                Dispatch Communication Package
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterActionPlanTab;
