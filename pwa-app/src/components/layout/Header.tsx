'use client';

import React from 'react';

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
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const websiteRoot = basePath.replace(/\/pwa-app\/?$/, '');
  const websiteHref = websiteRoot ? `${websiteRoot}/` : '/';

  return (
    <header className="border-b border-gray-200 bg-white dark:bg-gray-950 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="container py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="label text-gray-500 dark:text-gray-400">Forensic Credit Analysis</p>
            <h1 className="heading-lg tracking-tight dark:text-white">Credit Report Analyzer</h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={websiteHref}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors no-print"
              aria-label="Open project website"
            >
              Project Website
            </a>
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-print"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            {/* Language Switcher */}
            <div className="flex items-center gap-1 no-print">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  language === 'en' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('es')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  language === 'es' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                ES
              </button>
            </div>
            {step > 1 && (
              <button
                type="button"
                onClick={reset}
                className="btn btn-ghost text-sm no-print dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {translate('actions.newAnalysis') || 'New Analysis'}
              </button>
            )}
            <div className="text-right hidden sm:block">
              <p className="mono text-xs text-gray-400">v5.0</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
