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
    <div className="fade-in max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="premium-card p-12 bg-slate-950 text-white border-slate-800 overflow-hidden relative shadow-2xl mb-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-emerald-400 font-mono">Forensic Analysis Engine // Institutional V5.0</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight relative">
            Analyze Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Credit Report</span>
            <div className="absolute -top-6 -right-10 px-3 py-1 bg-slate-800 rounded-lg border border-white/5 shadow-2xl rotate-6 text-[8px] font-mono text-slate-400 uppercase tracking-widest hidden md:block">
              Institutional_Access
            </div>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto">
            Upload any format — PDF, image, or text. Our forensic engine detects FCRA/FDCPA violations and illegal debt re-aging with institutional-grade precision.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* File Upload */}
        <div className="premium-card p-8 flex flex-col bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <div>
              <p className="text-sm font-bold dark:text-white">Forensic Evidence Upload</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Secure • Local • Private</p>
            </div>
          </div>

          <div
            className="flex-grow flex flex-col items-center justify-center p-0 group relative"
          >
            {isProcessing ? (
              <ForensicScanner progress={progress} stage={progressText} />
            ) : (
              <div
                className="w-full min-h-[300px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/5 dark:hover:bg-emerald-500/5 transition-all cursor-pointer relative overflow-hidden"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] dot-pattern-current" />

                <div className="relative z-10 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-all shadow-xl">
                    <svg className="w-12 h-12 text-slate-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  <button
                    type="button"
                    title="Initiate Scan"
                    className="mb-4 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center gap-2 mx-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12h.01M9 16h6M12 12V8m0 4h.01M12 12v4" /></svg>
                    INITIATE SCAN
                  </button>

                  <p className="text-sm text-slate-500 mb-2">or drag & drop credit report files</p>
                  <p className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full inline-block">Supports PDF, PNG, JPG, TXT</p>
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
        <div className="premium-card p-8 flex flex-col bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <div>
              <p className="text-sm font-bold dark:text-white">Direct Text Analysis</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Copy & Paste Credit Data</p>
            </div>
          </div>
          <textarea
            className="flex-grow min-h-[240px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-6 font-mono text-sm focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500/50 transition-all resize-none dark:text-white placeholder:text-slate-400"
            placeholder="Paste raw credit report data here...&#10;&#10;Tip: Copy text directly from your credit bureau PDF or online account."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>
      </div>

      <div className="premium-card p-6 mb-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 font-mono">Scan Intensity</p>
            <h3 className="text-lg font-bold dark:text-white">Choose Extraction Force</h3>
            <p className="text-xs text-slate-500 mt-1">
              Max Scan runs multi-pass OCR and signal merging for noisy or scanned reports.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScanMode('standard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                scanMode === 'standard'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setScanMode('max')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                scanMode === 'max'
                  ? 'bg-slate-950 text-emerald-400 border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
            >
              Max Scan
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <button
          type="button"
          title="Analyze Report Text"
          className="btn btn-primary px-12 py-5 h-auto text-base font-bold shadow-xl shadow-emerald-900/20 hover:shadow-emerald-500/30 transition-all hover:scale-[1.02]"
          onClick={processText}
          disabled={!rawText.trim()}
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Analyze Report
          <kbd className="ml-3 text-[10px] bg-white/10 px-2 py-1 rounded border border-white/20 hidden sm:inline font-mono">⌘↵</kbd>
        </button>
        <button
          type="button"
          title="Load Sample Data"
          className="btn btn-secondary px-12 py-5 h-auto text-base font-bold dark:bg-slate-900 dark:text-white dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all"
          onClick={loadSample}
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Try Sample Data
        </button>
      </div>

      {sources.length > 0 && (
        <div className="premium-card p-6 mb-12 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Evidence Queue</p>
              <h3 className="text-lg font-bold dark:text-white">Merged Intake Sources</h3>
            </div>
            <button
              type="button"
              onClick={clearSources}
              className="btn btn-secondary !py-2 !px-4 !text-[10px] !uppercase !tracking-widest !rounded-xl"
            >
              Clear Batch
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold dark:text-white">{source.name}</p>
                  <p className="text-[10px] text-slate-400">{Math.round(source.size / 1024)} KB • {source.type || 'unknown'}</p>
                </div>
                <button
                  type="button"
                  title={`Remove ${source.name}`}
                  aria-label={`Remove ${source.name}`}
                  onClick={() => removeSource(source.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <p className="text-base font-bold mb-2 dark:text-white">Zero-Trust Privacy</p>
              <p className="text-sm text-slate-500 leading-relaxed">Every byte stays on your machine. We use on-device compute for zero-latency, zero-risk analysis. No data transmission.</p>
            </div>
          </div>
        </div>

        <div className="premium-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <p className="text-base font-bold mb-2 dark:text-white">Institutional Grade</p>
              <p className="text-sm text-slate-500 leading-relaxed">24+ core forensic heuristics map report inconsistencies against federal data standards (FCRA § 611, FDCPA § 809).</p>
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
