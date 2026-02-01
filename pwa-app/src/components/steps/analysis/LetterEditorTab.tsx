'use client';

import React, { useState, useMemo } from 'react';
import { LetterType } from '../../../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, 
    Shield, 
    Mail, 
    Ban, 
    Gavel, 
    Download, 
    Type, 
    AlignLeft, 
    Maximize2, 
    Minimize2, 
    CheckCircle2, 
    AlertCircle,
    Copy,
    Share2,
    Eye,
    MessageSquareQuote,
    Zap,
    Activity
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface LetterEditorTabProps {
  selectedLetterType: LetterType;
  setSelectedLetterType: React.Dispatch<React.SetStateAction<LetterType>>;
  editableLetter: string;
  setEditableLetter: (text: string) => void;
  generatePDF: (content: string, filename: string) => void;
}

const LetterEditorTab: React.FC<LetterEditorTabProps> = ({
  selectedLetterType,
  setSelectedLetterType,
  editableLetter,
  setEditableLetter,
  generatePDF
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const letterTypes: { id: LetterType; label: string; icon: React.ReactNode; color: string; description: string; tag: string }[] = [
    { 
        id: 'bureau', 
        label: 'Institutional Challenge', 
        icon: <Shield size={18} />, 
        color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        description: 'Formal demand for institutional data integrity from central repositories.',
        tag: 'FCRA_Institutional'
    },
    { 
        id: 'validation', 
        label: 'Liability Verification', 
        icon: <CheckCircle2 size={18} />, 
        color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        description: 'Verification request for liability chains and original instrument data.',
        tag: 'FDCPA_Lending'
    },
    { 
        id: 'furnisher', 
        label: 'Direct Audit Demand', 
        icon: <Mail size={18} />, 
        color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
        description: 'Institutional audit request targeting original reporting source data.',
        tag: 'Metro2_Audit'
    },
    { 
        id: 'cease_desist', 
        label: 'Protocol Termination', 
        icon: <Ban size={18} />, 
        color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        description: 'Mandatory termination of data processing and communication protocols.',
        tag: 'Comm_Control'
    },
    { 
        id: 'intent_to_sue', 
        label: 'Litigation Manifest', 
        icon: <Gavel size={18} />, 
        color: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
        description: 'Formal manifest of non-compliance and intent for legal adjudication.',
        tag: 'Legal_Escalation'
    }
  ];

  const selectedType = letterTypes.find(t => t.id === selectedLetterType);

  const stats = useMemo(() => ({
    words: editableLetter.split(/\s+/).filter(x => x.length).length,
    citations: (editableLetter.match(/Section|FCRA|FDCPA|15 U.S.C.|U.C.C./g) || []).length,
    severity: editableLetter.length > 2000 ? 'ULTRA' : editableLetter.length > 1000 ? 'HIGH' : 'LOW'
  }), [editableLetter]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableLetter);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fade-in space-y-20 pb-40">
        {/* ELITE_AUDIT_HERO::CORRESPONDENCE_LAB */}
        <section className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-600/20 via-blue-600/10 to-transparent rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
            <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl p-16">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[140px] -mr-96 -mt-96" />
                
                <div className="relative z-10 grid lg:grid-cols-12 gap-20 items-center">
                    <div className="lg:col-span-8">
                         <div className="flex items-center gap-6 mb-8">
                            <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-3">
                                <Zap size={14} className="text-indigo-400 animate-pulse" />
                                <span className="text-[10px] uppercase font-black tracking-[0.4em] text-indigo-400 font-mono">Output Protocol v5.0</span>
                            </div>
                            <div className="h-px w-10 bg-slate-800" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-500 font-mono italic">Status::STANDBY</span>
                        </div>

                        <h2 className="text-7xl lg:text-[7.5rem] font-black text-white tracking-tighter mb-10 leading-[0.85] italic uppercase font-mono">
                            Correspondence <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-500 tracking-[-0.05em]">LAB</span>
                        </h2>

                        <p className="text-2xl text-slate-400 leading-[1.4] font-bold italic tracking-tight max-w-2xl border-l-2 border-indigo-500/30 pl-12 mb-12">
                            Weaponizing <span className="text-white font-black">Institutional Demands</span>. Our correspondence matrix generates legally binding manifests designed to trigger strict compliance windows.
                        </p>

                        <div className="flex flex-wrap items-center gap-12 sm:gap-20 pt-10 border-t border-white/5">
                             <div className="space-y-2">
                                 <p className="text-[10px] uppercase text-slate-600 font-black tracking-[0.5em] font-mono italic">Tokens_Processed</p>
                                 <p className="text-5xl font-black text-white font-mono tracking-tighter italic">{stats.words}</p>
                             </div>
                             <div className="space-y-2">
                                 <p className="text-[10px] uppercase text-slate-600 font-black tracking-[0.5em] font-mono italic">Legal_Citations</p>
                                 <p className="text-5xl font-black text-indigo-500 font-mono tracking-tighter italic">{stats.citations}</p>
                             </div>
                             <button
                                onClick={() => generatePDF(editableLetter, `manifest_${selectedLetterType}.pdf`)}
                                className="px-10 py-5 bg-white text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono italic hover:bg-indigo-600 hover:text-white transition-all shadow-3xl flex items-center gap-4"
                            >
                                <Download size={18} />
                                Finalize_Manifest_PDF
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-4 self-stretch">
                         <div className="h-full bg-slate-900 border border-white/10 p-12 rounded-[4rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden group/actions flex flex-col justify-center gap-8">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-[2.5] text-white rotate-12 pointer-events-none group-hover/actions:rotate-0 transition-transform duration-1000">
                                <FileText size={100} />
                            </div>
                            
                            <button 
                                onClick={handleCopy}
                                className="w-full py-8 rounded-[2.5rem] bg-slate-950 border border-white/5 text-slate-500 flex flex-col items-center justify-center gap-4 hover:border-indigo-500/50 hover:text-white transition-all group/btn relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                                {copySuccess ? <CheckCircle2 size={32} className="text-emerald-500 relative z-10" /> : <Copy size={32} className="relative z-10" />}
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono italic relative z-10">{copySuccess ? 'SYNC_SUCCESS' : 'Buffer_Copy'}</span>
                            </button>

                            <button 
                                className="w-full py-8 rounded-[2.5rem] bg-slate-950 border border-white/5 text-slate-500 flex flex-col items-center justify-center gap-4 hover:border-violet-500/50 hover:text-white transition-all group/btn relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-violet-500/5 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                                <Share2 size={32} className="relative z-10" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono italic relative z-10">Transmit_Protocol</span>
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Tactical Document Matrix Selector */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <AnimatePresence>
                {letterTypes.map((type, idx) => (
                    <motion.button
                        key={type.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedLetterType(type.id)}
                        className={cn(
                            "relative p-8 rounded-[3rem] border transition-all duration-700 text-left group overflow-hidden h-full flex flex-col justify-between",
                            selectedLetterType === type.id
                                ? "bg-slate-900 border-indigo-500/50 shadow-indigo-950/20"
                                : "bg-slate-950/40 border-white/5 hover:border-white/20"
                        )}
                    >
                        {selectedLetterType === type.id && (
                            <motion.div 
                                layoutId="active-bg" 
                                className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" 
                            />
                        )}
                        
                        <div className="relative z-10">
                            <div className={cn(
                                "w-16 min-h-[4rem] rounded-2xl flex items-center justify-center mb-10 transition-all duration-700 shadow-2xl border",
                                selectedLetterType === type.id ? "bg-indigo-500 text-white border-indigo-400" : "bg-slate-900 text-slate-600 border-white/5"
                            )}>
                                {React.cloneElement(type.icon as React.ReactElement, { size: 28 })}
                            </div>
                            <span className="text-[9px] font-mono text-slate-600 font-black uppercase tracking-[0.3em] block mb-2">{type.tag}</span>
                            <h4 className={cn(
                                "text-2xl font-black italic tracking-tighter uppercase font-mono leading-none mb-6",
                                selectedLetterType === type.id ? "text-white" : "text-slate-500 group-hover:text-slate-400"
                            )}>
                                {type.label.split(' ').map((word, i) => (
                                    <span key={i} className="block">{word}</span>
                                ))}
                            </h4>
                        </div>

                        <div className="relative z-10 mt-auto pt-8 border-t border-white/5">
                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight italic opacity-60">
                                {type.description}
                            </p>
                        </div>
                    </motion.button>
                ))}
            </AnimatePresence>
        </div>

        {/* ELITE_DOSSIER_EDITOR_INTERFACE */}
        <div className={cn(
            "relative transition-all duration-1000",
            isFullscreen ? "fixed inset-8 z-[100] bg-slate-950 rounded-[5rem] overflow-hidden border border-white/10 shadow-[0_0_200px_rgba(0,0,0,0.95)]" : ""
        )}>
            <div className="relative bg-slate-950 border border-white/10 rounded-[4rem] overflow-hidden flex flex-col min-h-[900px] shadow-4xl group/editor">
                <div className="absolute top-0 left-0 w-full h-[600px] bg-indigo-500/5 rounded-full blur-[200px] -ml-64 -mt-64 pointer-events-none" />
                
                <div className="bg-slate-900/40 p-10 border-b border-white/5 flex flex-wrap justify-between items-center gap-10 relative z-10 backdrop-blur-3xl">
                    <div className="flex items-center gap-10">
                         <div className="flex items-center gap-6">
                            <div className={cn(
                                "w-20 h-20 rounded-3xl flex items-center justify-center shadow-4xl border border-white/10 transform rotate-3 group-hover/editor:rotate-0 transition-transform duration-700",
                                selectedType?.color.split(' ')[0], "bg-slate-950"
                            )}>
                                {React.cloneElement(selectedType?.icon as React.ReactElement, { size: 36, className: selectedType?.color.split(' ')[0] })}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-mono font-black italic">Target_Manifest_Node</p>
                                </div>
                                <p className="text-3xl font-black text-white font-mono uppercase italic tracking-tighter leading-none">{selectedType?.label}</p>
                            </div>
                         </div>
                         
                         <div className="hidden lg:block h-16 w-px bg-white/5" />
                         
                         <div className="hidden lg:flex items-center gap-12 font-mono">
                             <div className="space-y-1">
                                <p className="text-[10px] uppercase font-black text-slate-700 tracking-widest italic">Character_Array</p>
                                <p className="text-2xl font-black text-slate-300 tabular-nums">{editableLetter.length.toLocaleString()}</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] uppercase font-black text-slate-700 tracking-widest italic">Lexical_Tokens</p>
                                <p className="text-2xl font-black text-slate-300 tabular-nums">{stats.words}</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] uppercase font-black text-slate-700 tracking-widest italic">Risk_Vectors</p>
                                <p className="text-2xl font-black text-rose-500 tabular-nums">{stats.severity}</p>
                             </div>
                         </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="w-16 h-16 bg-slate-950 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:border-indigo-500 transition-all shadow-4xl flex items-center justify-center group/fs"
                        >
                            {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} className="group-hover/fs:scale-110 transition-transform" />}
                        </button>
                        <div className="px-8 py-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] font-mono italic">Manifest_Integrity::LOCKED</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative flex overflow-hidden">
                     {/* ELITE_DYNAMIC_SIDEBAR */}
                     <div className="w-24 border-r border-white/5 bg-black/20 flex flex-col items-center py-12 gap-12 relative z-10">
                        {[Type, AlignLeft, MessageSquareQuote, Shield].map((Icon, i) => (
                            <div key={i} className="w-14 h-14 rounded-2xl bg-slate-950 border border-white/5 text-slate-700 hover:text-indigo-400 hover:border-indigo-500/30 transition-all cursor-pointer flex items-center justify-center group/tool">
                                <Icon size={24} className="group-hover/tool:scale-110 transition-transform" />
                            </div>
                        ))}
                        <div className="mt-auto mb-8 flex flex-col items-center gap-8 font-mono">
                            <span className="text-[12px] text-slate-800 rotate-90 whitespace-nowrap tracking-[0.8em] font-black uppercase">V5.0_CORE</span>
                            <div className="w-1 h-32 bg-gradient-to-b from-indigo-500/50 to-transparent rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                        </div>
                     </div>

                     <div className="flex-1 relative group/textarea overflow-hidden">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[180px] -mr-64 -mt-64 pointer-events-none group-hover/textarea:opacity-100 transition-opacity duration-1000" />
                        <textarea
                            className="w-full h-full p-24 font-serif text-3xl leading-[1.8] bg-transparent border-none focus:ring-0 resize-none outline-none text-slate-200 custom-scrollbar selection:bg-slate-500/30 font-medium italic"
                            value={editableLetter}
                            onChange={(e) => setEditableLetter(e.target.value)}
                            spellCheck={false}
                            placeholder="Type or paste your letter text here..."
                        />
                     </div>
                </div>

                <div className="bg-slate-950 p-6 border-t border-white/5 flex justify-between items-center text-[10px] font-mono font-black text-slate-700 uppercase tracking-[0.6em] px-16 relative z-10 italic">
                    <span className="flex items-center gap-4">
                        <Activity size={12} className="text-slate-500 animate-pulse" />
                        Institutional_Command_Suite_v5.0.1
                    </span>
                    <span className="flex items-center gap-4 py-2 px-6 rounded-full bg-amber-500/5 border border-amber-500/20 text-amber-500/60 font-bold">
                        <AlertCircle size={14} />
                        Audit_Verification::PENDING_PDF_RASTER
                    </span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LetterEditorTab;
