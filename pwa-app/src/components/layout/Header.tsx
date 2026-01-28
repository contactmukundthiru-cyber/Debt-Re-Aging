'use client';

import React, { useState } from 'react';
import { SecurityModal } from '../SecurityModal';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  language: string;
  handleLanguageChange: (lang: 'en' | 'es') => void;
  step: number;
  reset: () => void;
  translate: (key: string) => string;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  language,
  handleLanguageChange,
  step,
  reset,
  translate
}) => {
  const { state, dispatch } = useApp();
  const { showSecurityModal } = state;
  const setIsSecurityModalOpen = (val: boolean) => dispatch({ type: 'SET_SECURITY_MODAL', payload: val });

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const websiteRoot = basePath.replace(/\/pwa-app\/?$/, '');
  const websiteHref = websiteRoot ? `${websiteRoot}/` : '/';

  return (
    <>
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md dark:bg-slate-950/80 dark:border-slate-800 sticky top-0 z-50 transition-all">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">Forensic Investigation</p>
                <h1 className="text-xl font-bold tracking-tight dark:text-white leading-tight">Case Factory <span className="text-slate-400 font-light">| Enterprise</span></h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Privacy Shield */}
              <button
                onClick={() => setIsSecurityModalOpen(true)}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all group"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500">Zero-Trust Local Audit</span>
                <svg className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>


              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all no-print"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                )}
              </button>

              {step > 1 && (
                <button
                  type="button"
                  onClick={reset}
                  className="btn btn-primary !py-2 !px-4 !text-xs !rounded-xl no-print"
                >
                  {translate('actions.newAnalysis') || 'New Case'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <SecurityModal isOpen={showSecurityModal} onClose={() => setIsSecurityModalOpen(false)} />
    </>
  );
};

export default Header;

