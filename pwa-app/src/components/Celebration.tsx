'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationProps {
    isVisible: boolean;
    violationCount: number;
}

export const Celebration: React.FC<CelebrationProps> = ({ isVisible, violationCount }) => {
    const [show, setShow] = useState(false);
    const [particles, setParticles] = useState<{ id: number; left: string; color: string; delay: number; duration: number; rotate: number }[]>([]);

    useEffect(() => {
        if (isVisible && violationCount > 0) {
            setShow(true);
            
            // Generate stable randomized values on mount
            const newParticles = [...Array(50)].map((_, i) => ({
                id: i,
                left: `${Math.random() * 100}%`,
                color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 4)],
                delay: Math.random() * 3,
                duration: 3 + Math.random() * 2,
                rotate: Math.random() * 360
            }));
            setParticles(newParticles);

            const timer = setTimeout(() => setShow(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, violationCount]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[300] flex items-center justify-center overflow-hidden">
            {/* Confetti particles */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ top: -20, left: p.left, rotate: 0, opacity: 1 }}
                    animate={{ 
                        top: '120vh', 
                        rotate: p.rotate + 720,
                        opacity: 0,
                        backgroundColor: p.color
                    }}
                    transition={{ 
                        duration: p.duration, 
                        delay: p.delay,
                        ease: "linear"
                    }}
                    className="absolute w-2 h-2 rounded-sm"
                />
            ))}

            <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="bg-white dark:bg-slate-900 px-8 py-6 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-4 relative"
            >
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
