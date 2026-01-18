'use client';

import React, { useEffect, useState } from 'react';

interface CelebrationProps {
    isVisible: boolean;
    violationCount: number;
}

export const Celebration: React.FC<CelebrationProps> = ({ isVisible, violationCount }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible && violationCount > 0) {
            setShow(true);
            const timer = setTimeout(() => setShow(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, violationCount]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[300] flex items-center justify-center overflow-hidden">
            {/* Confetti particles (CSS based) */}
            {[...Array(50)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 rounded-sm animate-fall"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-20px`,
                        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 4)],
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${3 + Math.random() * 2}s`,
                        transform: `rotate(${Math.random() * 360}deg)`
                    }}
                />
            ))}

            <div className="bg-white dark:bg-slate-900 px-8 py-6 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-bounce flex flex-col items-center gap-4 relative">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />

                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-500 animate-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500 mb-1">Forensic Match Found</p>
                    <h3 className="text-2xl font-bold dark:text-white">
                        {violationCount} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Actionable Items</span>
                    </h3>
                </div>
                <p className="text-xs text-slate-500 max-w-[200px] text-center">Ready for document generation and legal triage.</p>
            </div>

            <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
        </div>
    );
};
