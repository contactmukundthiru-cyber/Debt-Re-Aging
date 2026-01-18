'use client';

import React, { useState, useEffect } from 'react';

interface InstitutionalBannerProps {
  onDismiss?: () => void;
}

const STORAGE_KEY = 'institutional_banner_dismissed';
const VERSION = '4.4.0';

/**
 * InstitutionalBanner - A professional banner for institutional users
 * Displays important information about the tool's capabilities and compliance
 */
export const InstitutionalBanner: React.FC<InstitutionalBannerProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    <div
      className="bg-slate-900 border-b border-emerald-500/30 text-white py-3 px-4 relative z-50 shadow-2xl"
      role="banner"
      aria-label="Institutional information banner"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium">
              <strong>Enterprise-Ready:</strong> This tool is designed for legal aid organizations
              and consumer advocacy groups.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              All processing is 100% local. No data leaves your device.
              <a
                href="docs/SECURITY_WHITEPAPER.md"
                className="underline hover:text-emerald-400 ml-1 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Security Whitepaper →
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="docs/TRAINING_MATERIALS.md"
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            target="_blank"
            rel="noopener noreferrer"
          >
            Training Guide
          </a>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-white/80 hover:text-white p-1 rounded transition-colors"
            aria-label="Dismiss banner"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalBanner;
