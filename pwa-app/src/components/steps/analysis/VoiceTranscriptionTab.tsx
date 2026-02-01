'use client';

import React, { useState, useRef } from 'react';
import {
    Mic,
    ShieldAlert,
    Activity,
    Lock,
    Zap,
    Scale,
    Gavel,
    Volume2,
    Cpu,
    Radiation,
    Terminal,
    Fingerprint,
    Search,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { startLiveTranscription, analyzeTranscriptionForViolations, TranscriptionSegment } from '../../../lib/transcription';

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
        <div className="space-y-12 pb-32">
            {/* Header / Command Center */}
            <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
                
                <div className="relative overflow-hidden rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 shadow-2xl transition-all duration-700 hover:border-indigo-500/30">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px] -mr-96 -mt-96" />
                    
                    <div className="relative z-10 p-12 md:p-20">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
                            <div className="flex-1 space-y-10 text-center lg:text-left">
                                <div className="flex items-center justify-center lg:justify-start gap-4">
                                    <div className="px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-3">
                                        <Volume2 size={14} className="text-indigo-400" />
                                        <span className="text-[10px] uppercase font-black tracking-[0.4em] text-indigo-400 font-mono">Audio Surveillance</span>
                                    </div>
                                    <div className="w-px h-4 bg-white/10" />
                                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-500 font-mono italic">Live Forensic Capture</span>
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-7xl md:text-8xl font-black text-white tracking-tighter leading-none italic uppercase">
                                        Forensic Audio <br/>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Decryption Lab</span>
                                    </h2>
                                    <p className="max-w-2xl text-slate-400 text-xl md:text-2xl leading-relaxed font-mono font-light italic uppercase tracking-tight">
                                        {'// REAL-TIME TRANSCRIPTION & LINGUISTIC ANALYSIS FOR STATUTORY VIOLATION DETECTION (FDCPA/FCRA).'}
                                    </p>
                                </div>

                                <button
                                    onClick={toggleRecording}
                                    className={cn(
                                        "group/btn px-12 py-6 rounded-full font-black text-xs uppercase tracking-[0.4em] font-mono transition-all duration-500 shadow-[0_0_50px_rgba(79,70,229,0.1)] hover:shadow-[0_0_80px_rgba(79,70,229,0.3)] flex items-center gap-6",
                                        isRecording
                                            ? "bg-rose-500 text-white animate-pulse"
                                            : "bg-white text-slate-950 hover:bg-indigo-500 hover:text-white"
                                    )}
                                >
                                    <div className={cn("w-3 h-3 rounded-full bg-current", isRecording && "animate-ping")} />
                                    {isRecording ? 'Terminate Surveillance' : 'Initialize Audio Capture'}
                                    <ArrowRight size={18} className="group-hover/btn:translate-x-3 transition-transform duration-300" />
                                </button>
                            </div>

                            <div className="relative shrink-0">
                                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-slate-950 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group/ring">
                                    <div className="absolute inset-0 border-[12px] border-indigo-500/5 rounded-full" />
                                    <div className={cn("absolute inset-0 border-t-[12px] border-indigo-500/40 rounded-full", isRecording ? "animate-[spin_4s_linear_infinite]" : "animate-[spin_12s_linear_infinite]")} />
                                    <div className="absolute inset-8 border border-white/5 rounded-full" />
                                    
                                    <div className="relative z-10 text-center space-y-1">
                                        <Mic size={48} className={cn("mx-auto mb-4 transition-colors duration-500", isRecording ? "text-rose-500" : "text-indigo-500")} />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono">Confidence</span>
                                        <div className="text-6xl font-black text-white font-mono tracking-tighter italic">94<span className="text-xl text-indigo-500/60 ml-1">%</span></div>
                                    </div>

                                    {/* Scanning Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover/ring:opacity-100 transition-opacity duration-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
                {/* Live Transcript Terminal */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="flex items-center justify-between px-8">
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-6">
                            <span className="w-2 h-10 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
                            Live Surveillance Feed
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 font-mono uppercase tracking-[0.3em]">Encrypted Connection</span>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[4rem] bg-slate-950/40 backdrop-blur-3xl border border-white/5 min-h-[600px] flex flex-col group">
                        <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:30px_30px]" />
                        
                        <div className="relative z-10 flex-grow p-12 md:p-16 space-y-8 overflow-y-auto max-h-[700px] scrollbar-hide">
                            <AnimatePresence mode="popLayout">
                                {segments.length === 0 ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full flex flex-col items-center justify-center text-center py-32 space-y-10"
                                    >
                                        <div className="relative">
                                            <div className="absolute -inset-8 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
                                            <Mic size={80} className="text-slate-800 relative z-10" />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-slate-500 font-mono text-xl uppercase tracking-widest italic">{'// Ready for audio capture.'}</p>
                                            <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.5em]">High-fidelity forensic node active</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    segments.map((s, i) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex gap-10 group/segment"
                                        >
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0 group-hover/segment:border-indigo-500/30 transition-colors">
                                                    <span className="text-xs font-black text-indigo-500 font-mono">{String(i + 1).padStart(2, '0')}</span>
                                                </div>
                                                <div className="w-px flex-grow bg-gradient-to-b from-indigo-500/20 to-transparent group-last/segment:hidden" />
                                            </div>
                                            <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl p-10 rounded-[2.5rem] rounded-tl-none border border-white/5 group-hover/segment:border-indigo-500/20 transition-all duration-500 flex-grow">
                                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover/segment:opacity-5 transition-opacity">
                                                    <Fingerprint size={60} />
                                                </div>
                                                <p className="text-xl text-slate-300 leading-relaxed font-mono uppercase tracking-tight">"{s.text}"</p>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Cognitive Analysis HUD */}
                <div className="space-y-12">
                    <div className="space-y-8">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest italic flex items-center gap-4 px-4">
                            <Radiation size={20} className="text-rose-500" />
                            Linguistic Anomalies
                        </h3>

                        <div className="relative overflow-hidden rounded-[3.5rem] bg-slate-950/60 backdrop-blur-3xl border border-white/5 p-10 min-h-[300px]">
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.02] to-transparent" />
                            
                            <div className="relative z-10 space-y-6">
                                <AnimatePresence mode="popLayout">
                                    {violations.length === 0 ? (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-20 px-8"
                                        >
                                            <p className="text-[11px] text-slate-600 uppercase font-black tracking-[0.4em] italic font-mono animate-pulse">{'// Monitoring linguistics for statutory violations...'}</p>
                                        </motion.div>
                                    ) : (
                                        violations.map((v, i) => (
                                            <motion.div 
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-6 rounded-[1.5rem] bg-rose-500/5 border border-rose-500/10 flex items-start gap-4"
                                            >
                                                <ShieldAlert size={20} className="text-rose-500 shrink-0 mt-1" />
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest font-mono">VIOLATION_DETECTED</p>
                                                    <p className="text-sm font-black text-rose-400 uppercase leading-snug tracking-tighter">{v}</p>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest italic flex items-center gap-4 px-4">
                            <Gavel size={20} className="text-indigo-400" />
                            Tactical Maneuvers
                        </h3>

                        <div className="space-y-4 px-4">
                            {[
                                { tip: 'Keep the collector talking without admitting debt.', icon: Lock },
                                { tip: 'Ask for their license number in your specific state.', icon: Search },
                                { tip: 'Note the exact time and date of the call.', icon: Activity },
                                { tip: 'Request a full validation in writing immediately.', icon: Scale }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6 items-center group/tip p-4 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0 group-hover/tip:border-indigo-500/30 transition-colors">
                                        <item.icon size={20} className="text-slate-600 group-hover/tip:text-indigo-500 transition-colors" />
                                    </div>
                                    <p className="text-[11px] text-slate-500 group-hover:text-slate-300 transition-colors leading-relaxed font-black uppercase tracking-widest font-mono italic">
                                        {'// '}{item.tip}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceTranscriptionTab;
