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
    <div className="fade-in space-y-12 pb-40">
        {/* INSTITUTIONAL_CORRESPONDENCE_HERO */}
        <section className="relative group">
            <div className="relative bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/40 p-12">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[100px] -mr-64 -mt-64" />
                
                <div className="relative z-10 grid lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-8">
                         <div className="flex items-center gap-4 mb-8">
                            <div className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-2">
                                <Zap size={13} className="text-indigo-600" />
                                <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-700">Correspondence Protocol v5.4</span>
                            </div>
                            <div className="h-px w-8 bg-slate-200" />
                            <span className="text-[11px] uppercase font-semibold tracking-wider text-slate-400">Analysis Verified</span>
                        </div>

                        <h2 className="text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-[0.9]">
                            Correspondence <br/>
                            <span className="text-indigo-600">Laboratory</span>
                        </h2>

                        <p className="text-xl text-slate-600 leading-relaxed font-medium tracking-tight max-w-2xl border-l-3 border-indigo-100 pl-8 mb-10">
                            Drafting <span className="text-slate-900 font-bold">Institutional Demands</span>. generate legally binding manifests designed to trigger strict compliance windows and enforce data integrity standards.
                        </p>

                        <div className="flex flex-wrap items-center gap-12 pt-10 border-t border-slate-100">
                             <div className="space-y-1">
                                 <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Metadata count</p>
                                 <p className="text-4xl font-bold text-slate-900 tracking-tight">{stats.words} <span className="text-sm text-slate-400">tokens</span></p>
                             </div>
                             <div className="space-y-1">
                                 <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Regulatory Citations</p>
                                 <p className="text-4xl font-bold text-indigo-600 tracking-tight">{stats.citations} <span className="text-sm text-indigo-400">references</span></p>
                             </div>
                             <button
                                onClick={() => generatePDF(editableLetter, `manifest_${selectedLetterType}.pdf`)}
                                className="group flex items-center gap-4 px-8 py-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                            >
                                <Download size={18} />
                                <span className="font-bold text-sm tracking-tight">Finalize Document</span>
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-4 self-stretch">
                         <div className="h-full bg-slate-50 border border-slate-200 p-10 rounded-[2.5rem] shadow-inner relative overflow-hidden flex flex-col justify-center gap-6">
                            <div className="absolute top-0 right-0 p-10 text-slate-200/50">
                                <FileText size={80} strokeWidth={1} />
                            </div>
                            
                            <button 
                                onClick={handleCopy}
                                className="w-full py-6 rounded-2xl bg-white border border-slate-200 text-slate-500 flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm group/btn relative overflow-hidden"
                            >
                                {copySuccess ? <CheckCircle2 size={24} className="text-emerald-500 relative z-10" /> : <Copy size={24} className="relative z-10" />}
                                <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">{copySuccess ? 'Copied to Clipboard' : 'Copy Text Data'}</span>
                            </button>

                            <button 
                                className="w-full py-6 rounded-2xl bg-white border border-slate-200 text-slate-500 flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm group/btn relative overflow-hidden"
                            >
                                <Share2 size={24} className="relative z-10" />
                                <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">Cloud Transmission</span>
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Institutional Selector Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <AnimatePresence>
                {letterTypes.map((type, idx) => (
                    <motion.button
                        key={type.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedLetterType(type.id)}
                        className={cn(
                            "relative p-8 rounded-[2rem] border transition-all duration-300 text-left group overflow-hidden h-full flex flex-col",
                            selectedLetterType === type.id
                                ? "bg-white border-indigo-200 shadow-xl shadow-indigo-100"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg shadow-slate-100"
                        )}
                    >
                        {selectedLetterType === type.id && (
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500" />
                        )}
                        
                        <div className="relative z-10 mb-8">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all shadow-sm border",
                                selectedLetterType === type.id ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-slate-50 text-slate-400 border-slate-100"
                            )}>
                                {React.cloneElement(type.icon as React.ReactElement, { size: 22 })}
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-2">{type.tag}</span>
                            <h4 className={cn(
                                "text-xl font-bold tracking-tight mb-4",
                                selectedLetterType === type.id ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"
                            )}>
                                {type.label}
                            </h4>
                        </div>

                        <div className="relative z-10 mt-auto pt-4 border-t border-slate-50">
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                                {type.description}
                            </p>
                        </div>
                    </motion.button>
                ))}
            </AnimatePresence>
        </div>

        {/* INSTITUTIONAL_EDITOR_INTERFACE */}
        <div className={cn(
            "relative transition-all duration-700",
            isFullscreen ? "fixed inset-8 z-[100] bg-white rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl" : ""
        )}>
            <div className="relative bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col min-h-[800px] shadow-2xl shadow-slate-200/40">
                <div className="bg-white p-8 border-b border-slate-200 flex flex-wrap justify-between items-center gap-8 relative z-10">
                    <div className="flex items-center gap-10">
                         <div className="flex items-center gap-5">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100",
                                selectedType?.color.split(' ')[0], "bg-slate-50"
                            )}>
                                {React.cloneElement(selectedType?.icon as React.ReactElement, { size: 28, className: selectedType?.color.split(' ')[0] })}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Active Protocol</p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 tracking-tight">{selectedType?.label}</p>
                            </div>
                         </div>
                         
                         <div className="hidden lg:block h-10 w-px bg-slate-200" />
                         
                         <div className="hidden lg:flex items-center gap-10">
                             <div className="space-y-0.5">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Length</p>
                                <p className="text-lg font-bold text-slate-700 tabular-nums">{editableLetter.length.toLocaleString()} <span className="text-[10px] text-slate-300">chars</span></p>
                             </div>
                             <div className="space-y-0.5">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Citations</p>
                                <p className="text-lg font-bold text-slate-700 tabular-nums">{stats.citations}</p>
                             </div>
                             <div className="space-y-0.5">
                                <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Risk Severity</p>
                                <p className={cn(
                                    "text-lg font-bold tracking-tight",
                                    stats.severity === 'ULTRA' ? "text-rose-500" : stats.severity === 'HIGH' ? "text-amber-500" : "text-blue-500"
                                )}>{stats.severity}</p>
                             </div>
                         </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all flex items-center justify-center group/fs"
                        >
                            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} className="group-hover/fs:scale-110 transition-transform" />}
                        </button>
                        <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Integrity Verified</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative flex overflow-hidden">
                     <div className="w-16 border-r border-slate-100 bg-slate-50 flex flex-col items-center py-8 gap-8 relative z-10">
                        {[Type, AlignLeft, MessageSquareQuote, Shield].map((Icon, i) => (
                            <div key={i} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-300 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-center group/tool">
                                <Icon size={20} className="group-hover/tool:scale-110 transition-transform" />
                            </div>
                        ))}
                        <div className="mt-auto mb-6 flex flex-col items-center gap-6">
                            <span className="text-[10px] text-slate-300 rotate-90 whitespace-nowrap tracking-wider font-bold uppercase">v5.4 Core</span>
                            <div className="w-0.5 h-20 bg-slate-200 rounded-full" />
                        </div>
                     </div>

                     <div className="flex-1 relative group/textarea overflow-hidden">
                        <textarea
                            className="w-full h-full p-16 lg:p-24 font-serif text-2xl lg:text-3xl leading-[1.8] bg-transparent border-none focus:ring-0 resize-none outline-none text-slate-800 custom-scrollbar selection:bg-indigo-100 font-medium"
                            value={editableLetter}
                            onChange={(e) => setEditableLetter(e.target.value)}
                            spellCheck={false}
                            placeholder="Type or paste your letter text here..."
                        />
                     </div>
                </div>

                <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest px-12 relative z-10">
                    <span className="flex items-center gap-3">
                        <Activity size={14} className="text-slate-300" />
                        Institutional Correspondence v5.4.1
                    </span>
                    <span className="flex items-center gap-3 py-1.5 px-6 rounded-full bg-blue-50 border border-blue-100 text-blue-600">
                        <CheckCircle2 size={14} />
                        Document Integrity Verified
                    </span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LetterEditorTab;
