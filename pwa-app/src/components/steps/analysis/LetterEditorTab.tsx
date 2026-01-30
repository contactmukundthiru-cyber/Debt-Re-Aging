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
    MessageSquareQuote
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

  const letterTypes: { id: LetterType; label: string; icon: React.ReactNode; color: string; description: string }[] = [
    { 
        id: 'bureau', 
        label: 'Institutional Challenge', 
        icon: <Shield size={18} />, 
        color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        description: 'Formal demand for institutional data integrity from central repositories.'
    },
    { 
        id: 'validation', 
        label: 'Liability Verification', 
        icon: <CheckCircle2 size={18} />, 
        color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        description: 'Verification request for liability chains and original instrument data.'
    },
    { 
        id: 'furnisher', 
        label: 'Direct Audit Demand', 
        icon: <Mail size={18} />, 
        color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
        description: 'Institutional audit request targeting original reporting source data.'
    },
    { 
        id: 'cease_desist', 
        label: 'Protocol Termination', 
        icon: <Ban size={18} />, 
        color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        description: 'Mandatory termination of data processing and communication protocols.'
    },
    { 
        id: 'intent_to_sue', 
        label: 'Litigation Manifest', 
        icon: <Gavel size={18} />, 
        color: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
        description: 'Formal manifest of non-compliance and intent for legal adjudication.'
    }
  ];

  const selectedType = letterTypes.find(t => t.id === selectedLetterType);

  const stats = useMemo(() => ({
    words: editableLetter.split(/\s+/).filter(x => x.length).length,
    citations: (editableLetter.match(/Section|FCRA|FDCPA|15 U.S.C.|U.C.C./g) || []).length,
    severity: editableLetter.length > 2000 ? 'Level III' : editableLetter.length > 1000 ? 'Level II' : 'Level I'
  }), [editableLetter]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableLetter);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fade-in space-y-12 pb-32">
      {/* Institutional Output Header */}
      <div className="relative p-1 rounded-[3rem] bg-gradient-to-b from-slate-800 to-slate-950 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay"></div>
        <div className="relative z-10 p-12 bg-slate-950/90 rounded-[2.8rem] backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] -mr-80 -mt-80" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                  <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-blue-400 font-mono">Output Module : Alpha-7</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500 font-mono">Status: CALIBRATED</span>
              </div>
              <h2 className="text-6xl font-black text-white tracking-tight mb-8 leading-[1.1]">
                Institutional <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Command Package</span>
              </h2>
              <p className="text-slate-400 text-xl leading-relaxed font-light max-w-xl">
                Precision-engineered legal communications generated from forensic findings. All outputs are cryptographically verified for institutional standards.
              </p>
            </div>

            <div className="flex flex-col gap-6 w-full lg:w-auto min-w-[320px]">
              <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Target Entity</span>
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest px-2 py-0.5 rounded bg-blue-400/10 border border-blue-400/20">Active Selection</span>
                </div>
                <div className="text-xl font-mono text-white mb-6 uppercase tracking-tight">
                  {selectedType?.label}
                </div>
                <button
                    onClick={() => generatePDF(editableLetter, `manifest_${selectedLetterType}.pdf`)}
                    className="w-full px-8 py-5 rounded-2xl bg-blue-600 text-white font-black text-[12px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-95 group"
                >
                    <Download size={18} className="group-hover:translate-y-1 transition-transform" />
                    Finalize Manifest PDF
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <button 
                      onClick={handleCopy}
                      className="py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-widest hover:text-white hover:border-blue-500/50 transition-all flex items-center justify-center gap-3 transition-colors"
                  >
                      {copySuccess ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      {copySuccess ? 'Copied' : 'Copy Text'}
                  </button>
                  <button className="py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-widest hover:text-white hover:border-blue-500/50 transition-all flex items-center justify-center gap-3 transition-colors">
                      <Share2 size={16} />
                      Transmit
                  </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Module Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {letterTypes.map((type, idx) => (
          <motion.button
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => setSelectedLetterType(type.id)}
            className={cn(
                "p-8 rounded-[2rem] border transition-all duration-500 text-left group relative overflow-hidden",
                selectedLetterType === type.id
                    ? "bg-slate-900 border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20"
                    : "bg-slate-950/40 border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/40"
            )}
          >
            <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 shadow-inner",
                selectedLetterType === type.id ? type.color : "bg-slate-900/50 text-slate-600 border border-slate-800/50"
            )}>
                {React.cloneElement(type.icon as React.ReactElement, { size: 24 })}
            </div>
            <h4 className={cn(
                "font-mono text-xs uppercase tracking-[0.1em] mb-3",
                selectedLetterType === type.id ? "text-white" : "text-slate-500"
            )}>
                {type.label}
            </h4>
            <div className="w-8 h-0.5 bg-slate-800 mb-4 group-hover:w-16 transition-all duration-500" />
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2 uppercase tracking-tight">
                {type.description}
            </p>
            
            {selectedLetterType === type.id && (
                <motion.div layoutId="active-indicator" className="absolute top-6 right-6 text-blue-500">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 animate-pulse" />
                        <Eye size={16} className="relative z-10" />
                    </div>
                </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      <div className={cn(
          "relative transition-all duration-700",
          isFullscreen ? "fixed inset-4 z-[100] bg-slate-950 p-4 shadow-[0_0_100px_rgba(0,0,0,0.8)]" : ""
      )}>
        {/* Institutional Editor Terminal */}
        <div className="relative bg-slate-950 border border-slate-800 rounded-[3rem] overflow-hidden flex flex-col min-h-[800px] shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            
            <div className="bg-slate-900/50 p-8 border-b border-slate-800 flex flex-wrap justify-between items-center gap-8 relative z-10 backdrop-blur-md">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border border-white/5", selectedType?.color)}>
                            {selectedType?.icon}
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-mono font-bold">Document Manifest ID</p>
                            <p className="text-lg font-black text-white font-mono uppercase truncate max-w-[200px]">{selectedType?.label}</p>
                        </div>
                    </div>
                    
                    <div className="h-12 w-px bg-slate-800" />
                    
                    <div className="flex items-center gap-8 font-mono">
                         <div className="text-center">
                            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-tighter">Units</p>
                            <p className="text-sm font-black text-slate-300 tabular-nums">{editableLetter.length}</p>
                         </div>
                         <div className="text-center">
                            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-tighter">Tokens</p>
                            <p className="text-sm font-black text-slate-300 tabular-nums">{stats.words}</p>
                         </div>
                         <div className="text-center">
                            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-tighter">Citations</p>
                            <p className="text-sm font-black text-blue-400 tabular-nums">{stats.citations}</p>
                         </div>
                         <div className="text-center hidden sm:block">
                            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-tighter">Severity</p>
                            <p className="text-sm font-black text-rose-400">{stats.severity}</p>
                         </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-blue-500 transition-all shadow-lg group"
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} className="group-hover:scale-110 transition-transform" />}
                    </button>
                    <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_2s_infinite]" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] font-mono">Dossier Locked</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex overflow-hidden">
                 {/* Precision Diagnostics Sidebar */}
                 <div className="w-20 border-r border-slate-800 bg-slate-900/30 flex flex-col items-center py-12 gap-12 relative z-10">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer group">
                        <Type size={22} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer group">
                        <AlignLeft size={22} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer group">
                        <MessageSquareQuote size={22} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="mt-auto mb-4 flex flex-col items-center gap-1 font-mono">
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <div className="w-1 h-3 rounded-full bg-blue-500/20" />
                        <span className="text-[8px] text-slate-600 rotate-90 mt-8 whitespace-nowrap tracking-[0.5em] uppercase">V4.4.2</span>
                    </div>
                 </div>

                 <textarea
                    className="flex-1 p-20 font-serif text-[22px] leading-[1.8] bg-transparent border-none focus:ring-0 resize-none outline-none text-slate-200 custom-scrollbar selection:bg-blue-500/30"
                    value={editableLetter}
                    onChange={(e) => setEditableLetter(e.target.value)}
                    spellCheck={false}
                    placeholder="ENTER FORENSIC NARRATIVE DATA..."
                 />

                 {/* Focus Background Element */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-500/2 rounded-full blur-[120px] pointer-events-none" />
            </div>

            <div className="bg-slate-900/80 p-6 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.3em] px-12 relative z-10">
                <span className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-sm bg-blue-500/40" />
                    Institutional Command Suite // Terminal 01
                </span>
                <span className="flex items-center gap-4 py-2 px-4 rounded-full bg-amber-500/5 border border-amber-500/20 text-amber-500/80">
                    <AlertCircle size={14} />
                    ADVISORY: AUDIT DATA INTEGRITY VERIFIED
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LetterEditorTab;
