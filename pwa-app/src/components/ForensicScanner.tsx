'use client';

import React, { useEffect, useState } from 'react';

interface ForensicScannerProps {
    progress: number;
    stage: string;
}

const LOG_MESSAGES = [
    'Initializing WASM Core...',
    'Mounting Virtual File System...',
    'Detecting File Signature...',
    'Extracting Metro 2® Base Segments...',
    'Parsing J-Segment (Cosigner) Data...',
    'Validating K-Segment (Consumer) Integrity...',
    'Cross-Referencing FDCPA Headers...',
    'Analyzing Date of First Delinquency...',
    'Reconstructing Historical Ledger...',
    'Evaluating Forensic Impact...',
    'Preparing Liability Matrix...',
    'Finalizing Forensic Report...'
];

export const ForensicScanner: React.FC<ForensicScannerProps> = ({ progress, stage }) => {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        // Simulate scrolling terminal logs based on progress or time
        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                setLogs(prev => {
                    const newLog = `> ${LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)]}`;
                    const newLogs = [...prev, newLog];
                    return newLogs.slice(-6); // Keep last 6 lines
                });
            }
        }, 400);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-2xl bg-black border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] font-mono">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-emerald-900/10 border-b border-emerald-500/20">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                </div>
                <div className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">
                    FORENSIC_ENGINE_V4.4
                </div>
            </div>

            {/* Scanner Content */}
            <div className="p-8 relative min-h-[300px] flex flex-col justify-center">

                {/* Central Scanner Eye */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-emerald-500/20 rounded-full animate-[spin_4s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_15px_#10b981]" />
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-emerald-500/40 rounded-full animate-[spin_3s_linear_infinite_reverse]" />

                {/* Percentage */}
                <div className="relative z-10 text-center mb-8">
                    <div className="text-6xl font-black text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-emerald-400">
                        {progress}%
                    </div>
                    <div className="text-xs text-emerald-500 mt-2 uppercase tracking-[0.2em] animate-pulse">
                        {stage || 'PROCESSING'}
                    </div>
                </div>

                {/* Terminal Output */}
                <div className="relative z-10 mt-auto bg-black/50 backdrop-blur border border-emerald-500/20 rounded-lg p-3 font-mono text-xs h-32 overflow-hidden flex flex-col justify-end">
                    {logs.map((log, i) => (
                        <div key={i} className="text-emerald-400/80 truncate animate-slide-in">
                            {log} <span className="float-right text-emerald-900">{Date.now().toString().slice(-4)}ms</span>
                        </div>
                    ))}
                    <div className="w-2 h-4 bg-emerald-500 animate-pulse mt-1" />
                </div>

            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-emerald-900/30">
                <div className="h-full bg-emerald-500 shadow-[0_0_20px_#10b981] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
};
