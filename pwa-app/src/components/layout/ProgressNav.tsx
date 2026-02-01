'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Step } from '../../lib/constants';

interface ProgressNavProps {
  steps: readonly { id: number; name: string; desc: string }[];
  currentStep: number;
  setStep: (step: Step) => void;
}

export const ProgressNav: React.FC<ProgressNavProps> = ({ steps, currentStep, setStep }) => {
  return (
    <nav className="sticky top-[72px] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 no-print transition-all">
      <div className="max-w-7xl mx-auto px-4 h-24 flex items-center">
        <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
          {steps.map((s, i) => {
            const isCompleted = currentStep > s.id;
            const isActive = currentStep === s.id;
            const isPending = currentStep < s.id;

            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center group relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => s.id < currentStep && setStep(s.id as Step)}
                    disabled={isPending}
                    className={`
                      w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300
                      ${isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : ''}
                      ${isActive ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xl shadow-slate-900/20 scale-110 ring-4 ring-slate-100 dark:ring-slate-800' : ''}
                      ${isPending ? 'bg-slate-50 text-slate-300 dark:bg-slate-800/50 dark:text-slate-600 border border-slate-100 dark:border-slate-800' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold">{s.id}</span>
                    )}
                  </button>

                  <div className="absolute top-12 flex flex-col items-center whitespace-nowrap">
                    <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {s.name}
                    </span>
                    {isActive && (
                      <span className="text-[8px] text-emerald-500 font-bold tracking-tighter fade-in">
                        {s.desc}
                      </span>
                    )}
                  </div>
                </div>

                {i < steps.length - 1 && (
                  <div className="flex-1 relative mx-4">
                    <div className="absolute inset-0 h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full top-1/2 -translate-y-1/2" />
                    <motion.div
                      initial={false}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      className="absolute inset-0 h-[2px] bg-gradient-to-r from-emerald-500 to-slate-900 dark:to-white rounded-full top-1/2 -translate-y-1/2"
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default ProgressNav;
