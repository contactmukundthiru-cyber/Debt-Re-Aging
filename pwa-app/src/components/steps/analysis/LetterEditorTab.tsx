'use client';

import React from 'react';
import { LetterType } from '../../../lib/constants';

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
  const letterTypes: { id: LetterType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'bureau', label: 'Credit Bureau', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'validation', label: 'Debt Validation', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { id: 'furnisher', label: 'Direct Dispute', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    { id: 'cease_desist', label: 'Cease & Desist', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    { id: 'intent_to_sue', label: 'Intent to Sue', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' }
  ];

  const selectedType = letterTypes.find(t => t.id === selectedLetterType);

  return (
    <div className="fade-in space-y-10">
      {/* Hero Header */}
      <div className="premium-card p-10 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-cyan-400 font-mono">Document Forge</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Interactive <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Letter Editor</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-lg">Customize dispute letters before sending. All templates are FCRA/FDCPA compliant and optimized for maximum impact.</p>
          </div>

          <button
            onClick={() => generatePDF(editableLetter, `dispute_${selectedLetterType}.pdf`)}
            className="px-6 py-4 rounded-2xl bg-white text-slate-900 font-bold text-sm transition-all flex items-center gap-3 hover:bg-slate-100 shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* Letter Type Selector */}
      <div className="flex flex-wrap gap-3">
        {letterTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedLetterType(type.id)}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${selectedLetterType === type.id
                ? `${type.color} shadow-lg scale-105`
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{type.icon}</svg>
            {type.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="premium-card overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${selectedType?.color || ''} flex items-center justify-center`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{selectedType?.icon}</svg>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Editing</p>
              <p className="text-sm font-bold dark:text-white">{selectedType?.label} Letter</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-400 font-mono">{editableLetter.length.toLocaleString()} characters</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
        <textarea
          className="w-full h-[600px] p-8 font-serif text-lg leading-relaxed bg-white dark:bg-slate-900 border-none focus:ring-0 resize-none outline-none dark:text-white custom-scrollbar"
          value={editableLetter}
          onChange={(e) => setEditableLetter(e.target.value)}
          spellCheck={false}
          placeholder="Your dispute letter content will appear here. You can edit it directly before downloading."
        />
      </div>

      <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Tip: Edit the text above directly before downloading. Changes are preserved until you switch letter types.</span>
      </div>
    </div>
  );
};

export default LetterEditorTab;
