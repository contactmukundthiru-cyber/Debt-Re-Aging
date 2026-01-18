'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

interface OnboardingProps {
    onComplete: () => void;
    onSkip?: () => void;
}

const STORAGE_KEY = 'onboarding_completed';
const VERSION = '4.4.0';

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to Credit Report Analyzer',
        description: 'This forensic-grade tool helps detect illegal debt re-aging and FCRA/FDCPA violations in credit reports. Used by legal aid organizations nationwide.',
        icon: (
            <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
    },
    {
        id: 'privacy',
        title: '100% Private & Local',
        description: 'All processing happens in your browser. No data is ever sent to external servers. Perfect for handling sensitive client information in attorney-client contexts.',
        icon: (
            <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
    },
    {
        id: 'workflow',
        title: 'Simple 6-Step Workflow',
        description: '1) Upload credit report → 2) Review extracted text → 3) Verify key dates → 4) View analysis → 5) Generate documents → 6) Track disputes. Each step guides you through the process.',
        icon: (
            <svg className="w-12 h-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
    },
    {
        id: 'output',
        title: 'Professional Documents',
        description: 'Generate bureau dispute letters, debt validation requests, CFPB complaint narratives, evidence packages, and attorney consultation bundles—all with proper legal citations.',
        icon: (
            <svg className="w-12 h-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        id: 'support',
        title: 'Built for Institutions',
        description: 'Comprehensive training materials, deployment checklists, and security documentation available. Perfect for legal aid organizations, consumer advocacy groups, and pro bono clinics.',
        icon: (
            <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
];

/**
 * Onboarding - First-time user onboarding flow
 * Shows key features and sets expectations for institutional users
 */
export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSkip }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const completed = localStorage.getItem(STORAGE_KEY);
            if (!completed || completed !== VERSION) {
                setIsVisible(true);
            }
        } catch {
            // First visit without localStorage
            setIsVisible(true);
        }
    }, []);

    const handleComplete = useCallback(() => {
        setIsVisible(false);
        try {
            localStorage.setItem(STORAGE_KEY, VERSION);
        } catch {
            // Ignore storage errors
        }
        onComplete();
    }, [onComplete]);

    const handleSkip = useCallback(() => {
        setIsVisible(false);
        try {
            localStorage.setItem(STORAGE_KEY, VERSION);
        } catch {
            // Ignore storage errors
        }
        onSkip?.();
    }, [onSkip]);

    const handleNext = useCallback(() => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    }, [currentStep, handleComplete]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isVisible) return;
            if (e.key === 'Escape') handleSkip();
            if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
            if (e.key === 'ArrowLeft') handlePrevious();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, handleNext, handlePrevious, handleSkip]);

    if (!mounted || !isVisible) return null;

    const step = ONBOARDING_STEPS[currentStep];
    const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
        >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
                {/* Progress indicator */}
                <div className="flex gap-1 p-4 pb-0">
                    {ONBOARDING_STEPS.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1 flex-1 rounded-full transition-colors ${index <= currentStep ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    <div className="flex justify-center mb-6">
                        {step.icon}
                    </div>
                    <h2
                        id="onboarding-title"
                        className="text-2xl font-semibold text-gray-900 dark:text-white mb-3"
                    >
                        {step.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {step.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={handleSkip}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                    >
                        Skip intro
                    </button>
                    <div className="flex items-center gap-3">
                        {currentStep > 0 && (
                            <button
                                type="button"
                                onClick={handlePrevious}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Previous
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {isLastStep ? 'Get Started' : 'Next'}
                        </button>
                    </div>
                </div>

                {/* Keyboard hint */}
                <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-3 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs mx-1">→</kbd>
                        to continue or <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs mx-1">Esc</kbd>
                        to skip
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
