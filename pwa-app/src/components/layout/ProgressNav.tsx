'use client';

import React from 'react';
import { Step } from '../../lib/constants';

interface ProgressNavProps {
  steps: readonly { id: number; name: string; desc: string }[];
  currentStep: number;
  setStep: (step: Step) => void;
}

export const ProgressNav: React.FC<ProgressNavProps> = ({ steps, currentStep, setStep }) => {
  return (
    <nav className="border-b border-gray-100 bg-gray-50/50 dark:bg-gray-900/50 dark:border-gray-800 no-print">
      <div className="container py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => s.id < currentStep && setStep(s.id as Step)}
                disabled={s.id > currentStep}
                className="flex flex-col items-center group relative"
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${currentStep > s.id ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : ''}
                    ${currentStep === s.id ? 'bg-gray-900 text-white ring-4 ring-gray-200 dark:bg-white dark:text-gray-900 dark:ring-gray-800' : ''}
                    ${currentStep < s.id ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600' : ''}
                    ${s.id < currentStep ? 'cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-200' : ''}
                  `}
                >
                  {currentStep > s.id ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.id}
                </div>
                <span className={`label mt-2 text-xs ${currentStep >= s.id ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                  {s.name}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > s.id ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default ProgressNav;
