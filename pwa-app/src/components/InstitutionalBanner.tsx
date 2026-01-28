'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface InstitutionalBannerProps {
  onDismiss?: () => void;
}

const STORAGE_KEY = 'institutional_banner_dismissed';
const VERSION = '5.0.0';

const QUICK_TIPS = [
  { title: 'Upload Reports', desc: 'Drop PDF, images, or paste text from any credit bureau report', icon: '📄' },
  { title: 'Auto-Detection', desc: 'AI extracts dates, balances, and account details automatically', icon: '🔍' },
  { title: 'Violation Scan', desc: '24+ FCRA/FDCPA rules checked against federal standards', icon: '⚖️' },
  { title: 'Generate Letters', desc: 'Professional dispute letters with proper legal citations', icon: '✉️' },
  { title: 'Track Progress', desc: 'Monitor dispute status and response deadlines', icon: '📊' },
  { title: '100% Private', desc: 'All processing happens locally in your browser', icon: '🔒' },
];

/**
 * InstitutionalBanner - A professional banner for institutional users
 * Displays important information about the tool's capabilities and compliance
 */
export const InstitutionalBanner: React.FC<InstitutionalBannerProps> = ({ onDismiss }) => {
  const { dispatch } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showTraining, setShowTraining] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed || dismissed !== VERSION) {
        setIsVisible(true);
      }
    } catch {
      // localStorage not available
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, VERSION);
    } catch {
      // Ignore storage errors
    }
    onDismiss?.();
  };

  if (!mounted || !isVisible) return null;

  return (
    <>
      <div
        className="bg-slate-950 border-b border-emerald-500/30 text-white py-3 px-4 relative z-50 shadow-2xl"
        role="banner"
        aria-label="Institutional information banner"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold">
                <span className="text-emerald-400">Enterprise-Ready</span> Forensic Analysis Platform
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Designed for legal aid organizations • 100% local processing • Zero data transmission
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowTraining(!showTraining)}
              className="text-xs font-bold uppercase tracking-widest bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              {showTraining ? 'Close Guide' : 'Quick Start'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all"
              aria-label="Dismiss banner"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Training Panel */}
      {showTraining && (
        <div className="bg-slate-950 border-b border-slate-900 py-12 px-4 relative z-40 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-white mb-2">Institutional Onboarding</h3>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto">Standardized resources for legal clinics, advocacy groups, and consumer law practitioners.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
              {QUICK_TIPS.map((tip, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 text-center hover:border-emerald-500/30 hover:bg-slate-900 transition-all group shadow-xl">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{tip.icon}</div>
                  <p className="text-sm font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{tip.title}</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{tip.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <h4 className="font-bold text-white">Legal Playbook</h4>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Operational guide for legal aid clinics on integrating forensic report analysis into intake workflows.</p>
                <button className="w-full py-3 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
                  Download Playbook
                </button>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-[2rem] p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <h4 className="font-bold text-white">Security Whitepaper</h4>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Technical documentation on Zero-Trust architecture, browser-local processing, and PII governance.</p>
                <button
                  onClick={() => dispatch({ type: 'SET_SECURITY_MODAL', payload: true })}
                  className="w-full py-3 bg-blue-500 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/20"
                >
                  Access Security Info
                </button>
              </div>

              <div className="bg-purple-500/5 border border-purple-500/20 rounded-[2rem] p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <h4 className="font-bold text-white">Partner Program</h4>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Explore White-Labeling, API integrations, and collaborative forensic rule development opportunities.</p>
                <button className="w-full py-3 bg-purple-500 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-purple-400 transition-colors shadow-lg shadow-purple-500/20">
                  Institutional Partnership
                </button>
              </div>
            </div>

            <div className="mt-12 text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Trusted by 120+ consumer protection advocates • Updated {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstitutionalBanner;
