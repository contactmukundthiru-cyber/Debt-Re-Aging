'use client';

import React from 'react';
import { AnalysisRecord, formatTimestamp } from '../../lib/storage';

interface Step1InputProps {
  isProcessing: boolean;
  progressText: string;
  progress: number;
  rawText: string;
  setRawText: (text: string) => void;
  fileName: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (file: File) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  processText: () => void;
  loadSample: () => void;
  history: AnalysisRecord[];
  showHistory: boolean;
  setShowHistory: (val: boolean) => void;
  loadFromHistory: (record: AnalysisRecord) => void;
  removeFromHistory: (id: string, e: React.MouseEvent) => void;
  historyFileInputRef: React.RefObject<HTMLInputElement>;
  exportHistory: () => void;
  importHistory: (file: File) => void;
  clearHistory: () => void;
}

export const Step1Input: React.FC<Step1InputProps> = ({
  isProcessing,
  progressText,
  progress,
  rawText,
  setRawText,
  fileName,
  fileInputRef,
  handleFileUpload,
  handleDrop,
  handleDragOver,
  handleDragLeave,
  processText,
  loadSample,
  history,
  showHistory,
  setShowHistory,
  loadFromHistory,
  removeFromHistory,
  historyFileInputRef,
  exportHistory,
  importHistory,
  clearHistory,
}) => {
  const textLength = rawText.trim().length;
  const hasEnoughText = textLength > 200;

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="heading-xl mb-3 dark:text-white">Analyze Your Credit Report</h2>
        <p className="body-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Upload any format — PDF, image, or text. Our forensic engine detects
          FCRA/FDCPA violations and illegal debt re-aging.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* File Upload */}
        <div className="premium-card p-6 flex flex-col">
          <p className="label mb-4 flex items-center gap-2 dark:text-emerald-400 text-emerald-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            <span>Forensic Evidence Upload</span>
          </p>
          <div
            className="upload-area flex-grow min-h-[220px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/10 transition-all cursor-pointer flex flex-col items-center justify-center p-8 group"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-busy={isProcessing}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              disabled={isProcessing}
            />
            {isProcessing ? (
              <div className="text-center">
                <div className="spinner mx-auto mb-4 border-emerald-500" />
                <p className="body-sm text-slate-600 dark:text-slate-400 animate-pulse">{progressText}</p>
                <div className="w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden mx-auto">
                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="heading-sm mb-1 dark:text-white">Secure Upload</p>
                <p className="body-sm text-slate-500 text-center">PDF, Images, or Text<br />Processed locally and privately</p>
              </>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-4 leading-tight italic text-center">Automated OCR detects scanned fields via WebAssembly sandbox.</p>
        </div>

        {/* Text Input */}
        <div className="premium-card p-6 flex flex-col">
          <p className="label mb-4 flex items-center gap-2 text-slate-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            <span>Direct Text Analysis</span>
          </p>
          <textarea
            className="textarea flex-grow min-h-[220px] rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 p-6 font-mono text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none shadow-inner"
            placeholder="Paste raw credit report data here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <button
          type="button"
          className="btn btn-primary px-10 py-4 h-auto shadow-emerald-900/10 hover:shadow-emerald-500/20"
          onClick={processText}
          disabled={!rawText.trim()}
        >
          Analyze Report
          <kbd className="ml-3 text-[10px] bg-white/10 px-1.5 py-0.5 rounded border border-white/20 hidden sm:inline">⌘↵</kbd>
        </button>
        <button
          type="button"
          className="btn btn-secondary px-10 py-4 h-auto dark:bg-slate-900 dark:text-white dark:border-slate-800 hover:border-slate-300"
          onClick={loadSample}
        >
          Try Sample Data
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="glass-panel p-6 bg-slate-50/50 border-slate-200 dark:bg-slate-900/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <p className="heading-sm mb-1 dark:text-white">Privacy Architecture</p>
              <p className="body-sm text-slate-500">Every byte of data stays on your machine. We use on-device compute for zero-latency, zero-risk analysis.</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 bg-slate-50/50 border-slate-200 dark:bg-slate-900/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <p className="heading-sm mb-1 dark:text-white">Institutional Grade</p>
              <p className="body-sm text-slate-500">Uses 24+ core forensic heuristics to map report inconsistencies against federal data standards.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis History */}
      <div className="max-w-xl mx-auto">
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-4 premium-card !rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="heading-sm dark:text-white">Recent Analyses</span>
              <span className="text-xs text-slate-400 font-normal">({history.length})</span>
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {showHistory && history.length > 0 && (
          <div className="mt-2 premium-card !rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {history.slice(0, 5).map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => loadFromHistory(record)}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <span className="text-lg font-light dark:text-white">{record.riskProfile.overallScore}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="body-sm font-medium truncate dark:text-gray-200">
                    {record.fields.furnisherOrCollector || record.fields.originalCreditor || 'Unknown Account'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatTimestamp(record.timestamp)} · {record.flags.length} violations
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => removeFromHistory(record.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-4 py-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Persistence Engine</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-emerald-500 transition-colors"
              onClick={exportHistory}
            >
              Export
            </button>
            <span className="text-slate-200">|</span>
            <button
              type="button"
              className="text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-emerald-500 transition-colors"
              onClick={() => historyFileInputRef.current?.click()}
            >
              Import
            </button>
            <span className="text-slate-200">|</span>
            <button
              type="button"
              className="text-[10px] uppercase tracking-widest font-bold text-red-400 hover:text-red-600 transition-colors"
              onClick={clearHistory}
            >
              Purge
            </button>
          </div>
          <input
            ref={historyFileInputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            aria-label="Import history JSON"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                importHistory(file);
              }
              e.currentTarget.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Step1Input;
