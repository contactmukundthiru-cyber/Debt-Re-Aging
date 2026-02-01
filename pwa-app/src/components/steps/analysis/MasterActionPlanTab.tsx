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
        <div className="space-y-12 pb-32">
            {/* Tactical Command Briefing */}
            <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-slate-500/20 via-slate-500/20 to-slate-500/20 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-duration-700 pointer-events-none" />
                
                <div className="relative overflow-hidden rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 shadow-2xl transition-all duration-700 hover:border-slate-500/30">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-500/5 rounded-full blur-[150px] -mr-96 -mt-96" />
                    
                    <div className="relative z-10 p-12 md:p-20">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
                            <div className="flex-1 space-y-8 text-center lg:text-left">
                                <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-slate-500/10 border border-slate-500/20">
                                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-400 font-mono">Mission ID: EXEC-ALPHA-01</span>
                                    <div className="w-px h-3 bg-slate-500/30" />
                                    <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono">Status: CALIBRATED</span>
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-7xl md:text-8xl font-black text-white tracking-tighter leading-none italic uppercase">
                                        Tactical <br/>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-white to-slate-400">Command Dossier</span>
                                    </h2>
                                    <p className="max-w-2xl text-slate-400 text-xl md:text-2xl leading-relaxed font-mono font-light italic">
                                        {'// SYNTHESIS OF ACTIVE TACTICAL MANEUVERS DERIVED FROM FORENSIC FINDINGS. CALIBRATED FOR MAXIMUM LIABILITY RECOVERY & INSTITUTIONAL COMPLIANCE FORCE.'}
                                    </p>
                                </div>
                            </div>

                            <div className="relative shrink-0">
                                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-slate-950 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group/ring">
                                    <div className="absolute inset-0 border-[12px] border-slate-500/5 rounded-full" />
                                    <div className="absolute inset-0 border-t-[12px] border-slate-500/40 rounded-full animate-[spin_10s_linear_infinite]" />
                                    <div className="absolute inset-8 border border-white/5 rounded-full" />
                                    
                                    <div className="relative z-10 text-center space-y-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono">Actions Indexed</span>
                                        <div className="text-8xl font-black text-white font-mono tracking-tighter leading-none">
                                            {(actions.length + 3)}
                                        </div>
                                        <div className="text-[8px] font-black text-slate-400/60 uppercase tracking-[0.5em] font-mono pt-2">Ready for Dispatch</div>
                                    </div>

                                    {/* Scanning Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-500/10 via-transparent to-transparent opacity-0 group-hover/ring:opacity-100 transition-opacity duration-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Grid */}
            <div className="grid lg:grid-cols-2 gap-12">
                {/* Deployment Phase */}
                <div className="space-y-10">
                    <div className="flex items-center justify-between px-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[2rem] bg-slate-500/10 text-slate-400 flex items-center justify-center border border-slate-500/20 shadow-2xl">
                                <Zap size={28} />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">Phase 01: Deployment</h4>
                                <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold">T-MINUS 0-7 DAYS / INITIAL STRIKE</p>
                            </div>
                        </div>
                        <div className="h-0.5 w-24 bg-gradient-to-l from-slate-500/50 to-transparent rounded-full" />
                    </div>

                    <div className="space-y-8 px-4">
                        {/* Static High Priority Item */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="group relative p-10 rounded-[3.5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 hover:border-slate-500/30 transition-all duration-500 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity size={120} className="text-slate-400" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-10">
                                    <div className="px-5 py-2 rounded-full bg-slate-500/10 border border-slate-500/20">
                                        <span className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-[0.3em]">PRIORITY_OMEGA</span>
                                    </div>
                                    <Target size={20} className="text-slate-800 group-hover:text-slate-400 transition-colors" />
                                </div>

                                <div className="space-y-4 mb-10">
                                    <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter">Initialize Regulatory Escalation</h4>
                                    <p className="text-slate-400 text-sm font-mono leading-relaxed uppercase tracking-tight max-w-lg">
                                        Detected Metro 2 format variances require mandatory regulatory oversight. File CFPB/AG complaints to force manual institution-level audit.
                                    </p>
                                </div>

                                <button 
                                    onClick={() => setActiveTab('escalation')} 
                                    className="group/btn flex items-center gap-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono"
                                >
                                    <span className="relative">
                                        Access Escalation Node
                                        <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-500 group-hover/btn:w-full transition-all duration-300" />
                                    </span>
                                    <ArrowRight size={16} className="group-hover/btn:translate-x-3 transition-transform duration-300" />
                                </button>
                            </div>
                        </motion.div>

                        {actions.map((action, idx) => (
                            <motion.div 
                                key={action.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative p-10 rounded-[3.5rem] bg-slate-950/20 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-500"
                            >
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-8">
                                        <div className={cn(
                                            "px-5 py-2 rounded-full border tracking-[0.3em] font-black text-[9px] font-mono uppercase",
                                            action.priority === 'high' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 
                                            action.priority === 'medium' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 
                                            'bg-slate-500/10 text-slate-500 border-white/5'
                                        )}>
                                            {action.priority}_LEVEL_TASK
                                        </div>
                                        <Lock size={18} className="text-slate-800 group-hover:text-slate-400/50 transition-colors" />
                                    </div>

                                    <div className="space-y-4 mb-10">
                                        <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">{action.title}</h4>
                                        <p className="text-slate-500 text-sm font-mono leading-relaxed uppercase tracking-tight">
                                           {'// '}{action.description}
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => handleActionClick(action)} 
                                        className="group/btn flex items-center gap-6 text-[10px] font-black text-slate-400 group-hover:text-slate-400 uppercase tracking-[0.4em] font-mono transition-colors"
                                    >
                                        Execute Command Node 
                                        <ArrowRight size={14} className="group-hover/btn:translate-x-3 transition-transform duration-300" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Adjudication Phase */}
                <div className="space-y-10">
                    <div className="flex items-center justify-between px-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[2rem] bg-slate-500/10 text-slate-400 flex items-center justify-center border border-slate-500/20 shadow-2xl">
                                <Scale size={28} />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">Phase 02: Adjudication</h4>
                                <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono font-bold">T-MINUS 15-45 DAYS / FORCE MULTIPLIER</p>
                            </div>
                        </div>
                        <div className="h-0.5 w-24 bg-gradient-to-l from-slate-500/50 to-transparent rounded-full" />
                    </div>

                    <div className="space-y-8 px-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="group relative p-10 rounded-[3.5rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 hover:border-slate-500/30 transition-all duration-500 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ShieldAlert size={120} className="text-slate-400" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-10">
                                    <div className="px-5 py-2 rounded-full bg-slate-500/10 border border-slate-500/20">
                                        <span className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-[0.3em]">STRATEGIC_PREP</span>
                                    </div>
                                    <FileCheck size={20} className="text-slate-800 group-hover:text-slate-400 transition-colors" />
                                </div>

                                <div className="space-y-4 mb-10">
                                    <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter">Prepare Forensic Affidavit</h4>
                                    <p className="text-slate-400 text-sm font-mono leading-relaxed uppercase tracking-tight max-w-lg">
                                        Finalize all forensic findings into a notarized Affidavit of Fact. This establishes prime facie evidence for potential litigation recovery.
                                    </p>
                                </div>

                                <button 
                                    onClick={() => setActiveTab('escalation')} 
                                    className="group/btn flex items-center gap-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono"
                                >
                                    <span className="relative">
                                        Generate Legal Instrument
                                        <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-500 group-hover/btn:w-full transition-all duration-300" />
                                    </span>
                                    <ArrowRight size={16} className="group-hover/btn:translate-x-3 transition-transform duration-300" />
                                </button>
                            </div>
                        </motion.div>


                        <div className="p-12 rounded-[2.5rem] bg-slate-950 border-2 border-dashed border-slate-900 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 mb-8">
                                <Target size={32} className="text-slate-400/50" />
                            </div>
                            <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.4em] mb-8">Dispatch Package Ready</p>
                            <button
                                onClick={onExport}
                                className="w-full py-5 bg-white text-slate-950 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-500 hover:text-white transition-all transform hover:scale-[1.02] shadow-2xl"
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
