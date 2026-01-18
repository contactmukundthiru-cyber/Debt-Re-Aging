'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    startLiveTranscription,
    TranscriptionSegment,
    analyzeTranscriptionForViolations,
    generateCallSummary
} from '../../../lib/transcription';

const VoiceTranscriptionTab: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
    const [violations, setViolations] = useState<string[]>([]);
    const stopRef = useRef<(() => void) | null>(null);

    const toggleRecording = async () => {
        if (isRecording) {
            if (stopRef.current) stopRef.current();
            setIsRecording(false);
            return;
        }

        try {
            const stop = await startLiveTranscription((segment) => {
                setSegments(prev => [...prev, segment]);
                const newViolations = analyzeTranscriptionForViolations(segment.text);
                if (newViolations.length > 0) {
                    setViolations(prev => Array.from(new Set([...prev, ...newViolations])));
                }
            });
            stopRef.current = stop;
            setIsRecording(true);
        } catch (err) {
            alert('Speech recognition is not supported in this browser or permission was denied.');
        }
    };

    return (
        <div className="fade-in space-y-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold dark:text-white mb-2">Call Evidence Logger</h2>
                    <p className="text-slate-500">Transcribe creditor calls in real-time to document FDCPA violations.</p>
                </div>
                <button
                    onClick={toggleRecording}
                    className={`px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all flex items-center gap-3 ${isRecording
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                >
                    <div className={`w-3 h-3 rounded-full bg-white ${isRecording ? 'animate-ping' : ''}`} />
                    {isRecording ? 'Stop Logging' : 'Start Live Transcription'}
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Live Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 min-h-[400px] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold flex items-center gap-2 dark:text-white">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                Live Transcript
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Confidence: 94%</span>
                        </div>

                        <div className="flex-grow space-y-4 overflow-y-auto max-h-[500px] pr-4 scrollbar-hide">
                            {segments.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                    <svg className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    <p className="text-slate-500 font-medium">Ready to record. High-fidelity forensic capture active.</p>
                                </div>
                            ) : (
                                segments.map((s, i) => (
                                    <div key={i} className="flex gap-4 group animate-in slide-in-from-bottom-2 duration-500">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                                            <span className="text-[10px] font-bold text-indigo-500">{i + 1}</span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 flex-grow">
                                            <p className="text-sm dark:text-slate-300 leading-relaxed font-medium">"{s.text}"</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Real-time Violation HUD */}
                <div className="space-y-6">
                    <div className="premium-card p-8 bg-slate-950 text-white border-slate-800 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[40px] -mr-16 -mt-16" />
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-8 font-mono">Real-time Violations</h3>

                            <div className="space-y-4">
                                {violations.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <p className="text-xs text-slate-600 uppercase font-bold tracking-widest italic">Monitoring...</p>
                                    </div>
                                ) : (
                                    violations.map((v, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-pulse">
                                            <div className="flex items-start gap-3">
                                                <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <p className="text-xs font-bold text-rose-400 uppercase leading-snug">{v}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold mb-4 dark:text-white">Litigation Tips</h4>
                        <ul className="space-y-4">
                            {[
                                'Keep the collector talking without admitting debt.',
                                'Ask for their license number in your specific state.',
                                'Note the exact time and date of the call.',
                                'Request a full validation in writing immediately.'
                            ].map((tip, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                    <p className="text-xs text-slate-500 leading-relaxed font-bold">{tip}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceTranscriptionTab;
