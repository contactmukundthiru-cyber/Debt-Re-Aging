'use client';

import React from 'react';
import { AnalysisRecord, formatTimestamp } from '../../lib/storage';
import { ForensicScanner } from '../ForensicScanner';


interface Step1InputProps {
  isProcessing: boolean;
  progressText: string;
  progress: number;
  scanMode: 'standard' | 'max';
  setScanMode: (mode: 'standard' | 'max') => void;
  rawText: string;
  setRawText: (text: string) => void;
  fileName: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (file: File) => void;
  handleFilesUpload: (files: FileList | File[]) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  processText: () => void;
  loadSample: () => void;
  sources: { id: string; name: string; size: number; type: string }[];
  removeSource: (id: string) => void;
  clearSources: () => void;
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

export const Step1Input: React.FC<Step1InputProps> = React.memo((props) => {
  const {
    isProcessing,
    progressText,
    progress,
    scanMode,
    setScanMode,
    rawText,
    setRawText,
    fileInputRef,
    handleFileUpload,
    handleFilesUpload,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    processText,
    loadSample,
    sources,
    removeSource,
    clearSources,
    history,
    showHistory,
    setShowHistory,
    loadFromHistory,
    removeFromHistory,
    historyFileInputRef,
    exportHistory,
    importHistory,
    clearHistory,
  } = props;
    <div className="fade-in max-w-5xl mx-auto px-4 sm:px-0 pb-20">
      {/* Hero Section */}
      <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 overflow-hidden relative shadow-xl shadow-slate-200/50 mb-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Institutional Forensic Protocol v{APP_VERSION}</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Institutional <span className="text-blue-600">Credit Forensics</span>
          </h1>
          <p className="text-slate-500 text-lg font-semibold leading-relaxed max-w-xl mx-auto">
            Upload any credit report format — PDF, image, or text. Our engine detects regulatory violations and illegal data aging with forensic precision.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* File Upload */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col shadow-lg shadow-slate-100/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">Document Intake</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Secure Local Environment</p>
            </div>
          </div>

          <div className="flex-grow flex flex-col items-center justify-center group relative">
            {isProcessing ? (
              <ForensicScanner progress={progress} stage={progressText} />
            ) : (
              <div
                className="w-full min-h-[340px] flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50/30 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer relative overflow-hidden"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="relative z-10 text-center px-6">
                  <div className="w-24 h-24 rounded-[2rem] bg-white flex items-center justify-center mb-8 mx-auto shadow-xl group-hover:scale-105 transition-transform duration-500">
                    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  <button
                    type="button"
                    title="Upload Files"
                    className="mb-6 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center gap-3 mx-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <span>Import Evidence</span>
                  </button>

                  <p className="text-sm font-bold text-slate-400 mb-1">Drag & drop report files</p>
                  <p className="text-[10px] text-slate-300 uppercase tracking-widest">PDF • PNG • JPG • TXT</p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              id="report-upload"
              title="Upload Credit Report"
              aria-label="Upload credit report files"
              accept=".txt,.pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff"
              multiple
              className="sr-only"
              onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Text Input */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col shadow-lg shadow-slate-100/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">Direct Entry Analysis</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Paste Structured Data</p>
            </div>
          </div>
          <textarea
            className="flex-grow min-h-[340px] rounded-[2rem] border border-slate-100 bg-slate-50/30 p-8 font-mono text-xs focus:ring-4 focus:ring-blue-50/50 focus:border-blue-200 transition-all resize-none text-slate-700 placeholder:text-slate-300"
            placeholder="Paste raw credit report data here...&#10;&#10;Use this for text copied from bureau dashboards or PDFs."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 mb-12 shadow-lg shadow-slate-100/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <div>
                <h3 className="text-lg font-bold text-slate-900">Analysis Depth</h3>
                <p className="text-xs font-semibold text-slate-500">
                  Select intensity for data extraction and multi-pass OCR audits.
                </p>
             </div>
          </div>
          <div className="flex items-center p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
            <button
              type="button"
              onClick={() => setScanMode('standard')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                scanMode === 'standard'
                  ? 'bg-white text-blue-600 shadow-md border border-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setScanMode('max')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                scanMode === 'max'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Deep Scan
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
        <button
          type="button"
          title="Run Forensic Analysis"
          className="px-14 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] text-lg font-bold shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 min-w-[280px]"
          onClick={processText}
          disabled={!rawText.trim()}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Run Analysis
        </button>
        <button
          type="button"
          title="Load Sample Case"
          className="px-14 py-5 bg-white border border-slate-200 text-slate-600 rounded-[1.5rem] text-lg font-bold shadow-lg shadow-slate-100 hover:border-slate-400 active:scale-95 transition-all flex items-center justify-center gap-3 min-w-[280px]"
          onClick={loadSample}
        >
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Sample Data
        </button>
      </div>

      {sources.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 mb-12 shadow-lg shadow-slate-100/50">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Intake Batch</h3>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{sources.length} Combined Sources</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearSources}
              className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-50 transition-colors"
            >
              Clear Session
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-slate-50 border border-slate-100 group">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{source.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{Math.round(source.size / 1024)} KB • {source.type || 'Source Data'}</p>
                </div>
                <button
                  type="button"
                  title={`Remove ${source.name}`}
                  aria-label={`Remove ${source.name}`}
                  onClick={() => removeSource(source.id)}
                  className="ml-2 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-lg shadow-slate-100/30">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <p className="text-lg font-bold mb-2 text-slate-900">End-to-End Privacy</p>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">Every byte stays on your machine. We use on-device compute for zero-latency, zero-risk analysis. No data transmission occurs.</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-lg shadow-slate-100/30">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <p className="text-lg font-bold mb-2 text-slate-900">Forensic Integrity</p>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">24+ core forensic heuristics map report inconsistencies against federal data standards (FCRA § 611, FDCPA § 809) with surgical accuracy.</p>
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

        <div className="mt-8 flex items-center justify-between gap-4 p-4 glass-panel bg-slate-50/30 dark:bg-slate-900/20 !border-slate-100 dark:!border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Persistence Engine</p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              className="group flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-emerald-500 transition-colors"
              onClick={exportHistory}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 9l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </button>
            <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
            <button
              type="button"
              className="group flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-emerald-500 transition-colors"
              onClick={() => historyFileInputRef.current?.click()}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12h.01M9 16h6M12 12V8m0 4h.01M12 12v4" /></svg>
              Import
            </button>
            <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
            <button
              type="button"
              className="group flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-red-400 hover:text-red-500 transition-colors"
              onClick={clearHistory}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
});

Step1Input.displayName = 'Step1Input';

export default Step1Input;
