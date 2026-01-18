'use client';

import React, { useState, useEffect } from 'react';

interface GuideStep {
    target: string; // CSS selector or ID
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const GUIDE_STEPS: GuideStep[] = [
    {
        target: 'body', // General modal
        title: 'Welcome to Forensic Mode',
        content: 'Your report has been analyzed against 1,200+ federal rules. We have identified specific actionable violations.',
        position: 'bottom'
    },
    {
        target: '[data-tab="actions"]',
        title: 'Master Action Plan',
        content: 'Start here. This is your prioritized checklist of what to dispute first based on logical sequencing.',
        position: 'bottom'
    },
    {
        target: '[data-tab="escalation"]',
        title: 'Legal Escalation Engine',
        content: 'Generate sworn affidavits and CFPB complaints here. These are your "Heavy Weapons".',
        position: 'bottom'
    },
    {
        target: '[data-tab="simulation"]',
        title: 'Tactical Simulator',
        content: 'Predict exactly how the bureau\'s e-OSCAR computer will respond to your dispute before you send it.',
        position: 'bottom'
    }
];

interface GuideOverlayProps {
    onClose: () => void;
}

export const GuideOverlay: React.FC<GuideOverlayProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    // Auto-advance or allow manual navigation
    const nextStep = () => {
        if (currentStep < GUIDE_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in">
            <div className="max-w-md w-full bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                {/* Decorative Grid */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
                            Walkthrough {currentStep + 1}/{GUIDE_STEPS.length}
                        </span>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                        {GUIDE_STEPS[currentStep].title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        {GUIDE_STEPS[currentStep].content}
                    </p>

                    <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                            {GUIDE_STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-700'}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={nextStep}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors"
                        >
                            {currentStep === GUIDE_STEPS.length - 1 ? 'Start Analysis' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
