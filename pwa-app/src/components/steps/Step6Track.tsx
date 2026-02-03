import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useAppContext } from '../../context/AppContext';
import { useDebounce } from '../../hooks/useDebounce';
import { runRules } from '../../utils/rules';
import { CaseEntry, AnalysisResult } from '../../types';
import { Button, Input, Select, Checkbox, Radio, Textarea } from '../../components/ui';
import { ChevronLeft, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface Step6TrackProps {
  caseData: CaseEntry;
  onStepChange: (step: number) => void;
}

interface Analysis {
  confidence: number;
  signals: string[];
  outcome: string;
  recommendations: string[];
  timestamp: string;
}

const Step6Track: React.FC<Step6TrackProps> = ({ caseData, onStepChange }) => {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [analysis, setAnalysis] = useState<Analysis > null;
  const [loading, setLoading] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showHealthPanel, setShowHealthPanel] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const disputes = state.disputes.filter(d => d.caseId === caseData.id);
  const documents = state.documents.filter(d => d.caseId === caseData.id);

  const runAnalysis = async () => {
    if (!selectedDisputeId) return;

    setLoading(true);
    try {
      const dispute = disputes.find(d => d.id === selectedDisputeId);
      if (!dispute) throw new Error('Dispute not found');

      const analysisResult = await runRules(dispute.fields, dispute.flags);
      setAnalysis({
        confidence: analysisResult.confidence,
        signals: analysisResult.signals,
        outcome: analysisResult.outcome,
        recommendations: analysisResult.recommendations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setSelectedDisputeId(null);
    setSelectedDocuments([]);
    setSelectedIds([]);
    dispatch({ type: 'CLEAR_ANALYSIS', payload: caseData.id });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Case Analysis Dashboard</h2>
          <p className="text-slate-400">Track dispute progress and evidence integration</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStepChange(5)}
            className="!rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          >
            <ChevronLeft size={16} /> Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={reset}
            className="!rounded-xl !px-4 !py-2 !text-[10px] !uppercase !tracking-widest"
          >
            Start New Analysis
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis ? (
        <div className="premium-card p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800/30 border border-white/5 rounded-3xl p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Confidence Level</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-mono font-bold text-white">{analysis.confidence}%</p>
                <span className="text-emerald-500 text-xs font-bold">Optimal</span>
              </div>
            </div>
            <div className="bg-slate-800/30 border border-white/5 rounded-3xl p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Signal Strength</p>
              <p className="text-4xl font-mono font-bold text-blue-400">{analysis.signals.length}</p>
            </div>
          </div>

          <div className="bg-slate-800/30 border border-white/5 rounded-[2rem] p-8 mt-6">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Audit Outcome</p>
              <span className={analysis.outcome.includes('Success') ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"}>
                {analysis.outcome}
              </span>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">Detected Signals</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.signals.map(signal => (
                    <span key={signal} className="px-3 py-1.5 rounded-lg bg-slate-900/50 border border-white/5 text-[10px] font-mono text-slate-300">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">Procedural Next Steps</p>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                      <p className="text-sm text-slate-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="premium-card p-6">
          <div className="text-center p-8 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
            {disputes.length === 0 ? (
              <div>
                <AlertCircle size={48} className="mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-bold text-white mb-2">No Disputes Found</h3>
                <p>Create a dispute to enable response analysis.</p>
              </div>
            ) : (
              <div>
                <Clock size={48} className="mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-bold text-white mb-2">Ready for Analysis</h3>
                <p>Select a dispute above to begin analysis.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid md:grid-cols-[1fr_220px] gap-4">
        <div>
          <label htmlFor="select-dispute" className="field-label">Select Dispute</label>
          <select
            id="select-dispute"
            title="Select Dispute to Analyze"
            className="input rounded-xl"
            value={selectedDisputeId || ''}
            onChange={(e) => setSelectedDisputeId(e.target.value)}
          >
            <option value="">Select a dispute...</option>
            {disputes.map(dispute => (
              <option key={dispute.id} value={dispute.id}>
                {dispute.subject} - {dispute.status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Button
            variant="primary"
            size="md"
            onClick={runAnalysis}
            disabled={!selectedDisputeId || loading}
            className="w-full rounded-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 animate-spin" />
                Analyzing...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <CheckCircle size={18} className="mr-2 text-white" />
                Run Analysis
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step6Track;