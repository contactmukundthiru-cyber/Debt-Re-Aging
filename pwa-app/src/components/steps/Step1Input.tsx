'use client';

import React from 'react';
import { AnalysisRecord, formatTimestamp } from '../../lib/storage';

interface Step1InputProps {
  isProcessing: boolean;
  progressText: string;
  progress: number;
  rawText: string;
  setRawText: (text: string) => void;
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
  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="heading-xl mb-3 dark:text-white">Analyze Your Credit Report</h2>
        <p className="body-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Upload any format — PDF, image, or text. Our forensic engine detects
          FCRA/FDCPA violations and illegal debt re-aging.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* File Upload */}
        <div>
          <p className="label mb-2 flex items-center gap-2 dark:text-gray-300">
            <span>Upload File</span>
            <span className="text-xs text-gray-400 font-normal">PDF, Image, or Text · Max 20MB</span>
          </p>
          <div
            className="upload-area cursor-pointer dark:bg-gray-900 dark:border-gray-700"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-busy={isProcessing}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff"
              className="sr-only"
              aria-label="Upload credit report file"
              title="Upload credit report file"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              disabled={isProcessing}
            />
            {isProcessing ? (
              <div className="text-center py-4">
                <div className="spinner mx-auto mb-3" />
                <p className="body-sm text-gray-600 dark:text-gray-400 mb-2" aria-live="polite">
                  {progressText}
                </p>
                <div className="w-48 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mx-auto">
                  <div
                    className="h-full bg-gray-900 dark:bg-white transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="heading-sm mb-1 dark:text-white">Drop file or click to browse</p>
                <p className="body-sm text-gray-500 dark:text-gray-400">PDF, PNG, JPG, TXT supported</p>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">Scanned PDFs run OCR and may take longer. For best results, upload clear images.</p>
        </div>

        {/* Text Input */}
        <div>
          <p className="label mb-2 dark:text-gray-300">Paste Text</p>
          <textarea
            className="textarea h-[180px] font-mono text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
            placeholder="Paste the account section from your credit report here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
        <button
          type="button"
          className="btn btn-primary"
          onClick={processText}
          disabled={!rawText.trim()}
        >
          Analyze Report
          <kbd className="ml-2 text-xs opacity-60 hidden sm:inline">⌘↵</kbd>
        </button>
        <button
          type="button"
          className="btn btn-secondary dark:bg-gray-800 dark:text-white dark:border-gray-700"
          onClick={loadSample}
        >
          Load Sample Data
        </button>
      </div>

      <div className="notice max-w-xl mx-auto mb-8 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="body-sm dark:text-gray-400">
            <span className="font-medium dark:text-gray-300">100% Private:</span> All processing happens in your browser.
            Your data never leaves your device.
          </p>
        </div>
      </div>

      {/* Analysis History */}
      <div className="max-w-xl mx-auto">
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-4 panel-inset hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="heading-sm dark:text-white">Recent Analyses</span>
              <span className="text-xs text-gray-400 font-normal">({history.length})</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {showHistory && history.length > 0 && (
            <div className="border border-t-0 border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              {history.slice(0, 5).map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => loadFromHistory(record)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-lg font-light dark:text-white">{record.riskProfile.overallScore}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="body-sm font-medium truncate dark:text-gray-200">
                      {record.fields.furnisherOrCollector || record.fields.originalCreditor || 'Unknown Account'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatTimestamp(record.timestamp)} · {record.flags.length} violations
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => removeFromHistory(record.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
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

        <div className={`mt-3 ${history.length === 0 ? 'panel-inset p-4' : ''}`}>
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">History Tools</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-secondary text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700"
                onClick={exportHistory}
                disabled={history.length === 0}
              >
                Backup JSON
              </button>
              <button
                type="button"
                className="btn btn-secondary text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700"
                onClick={() => historyFileInputRef.current?.click()}
              >
                Import JSON
              </button>
              <button
                type="button"
                className="btn btn-secondary text-xs text-red-600 dark:text-red-400 dark:bg-gray-800 dark:border-gray-700"
                onClick={clearHistory}
                disabled={history.length === 0}
              >
                Clear
              </button>
            </div>
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
