'use client';

import React, { useState } from 'react';
import { SecurityModal } from '../SecurityModal';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Settings, 
  Bell, 
  RotateCcw,
  LayoutGrid,
  FileText,
  Activity,
  ChevronDown,
  Moon,
  Sun,
  Lock,
  Search
} from 'lucide-react';
import { cn, maskPII } from '../../lib/utils';
import { EyeOff } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  language: string;
  handleLanguageChange: (lang: 'en' | 'es') => void;
  step: number;
  reset: () => void;
  translate: (key: string) => string;
  qualityScore?: number;
  missingFields?: number;
  overdueDeadlines?: number;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  language,
  handleLanguageChange,
  step,
  reset,
  translate,
  qualityScore,
  missingFields,
  overdueDeadlines
}) => {
  const { state, dispatch } = useApp();
  const { showSecurityModal } = state;
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const setIsSecurityModalOpen = (val: boolean) => dispatch({ type: 'SET_SECURITY_MODAL', payload: val });

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 transition-colors duration-500 no-print">
        <div className="mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => reset()}
              className="group flex items-center gap-3 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-950 dark:bg-white flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-500">
                <Shield className="w-6 h-6 text-white dark:text-slate-950" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                    Case Factory
                  </h1>
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Pro</span>
                </div>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mt-1">Forensic Integrity</p>
              </div>
            </button>

            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: 'Dashboard', active: step === 0 },
                { label: 'Intelligence', active: step === 4 },
                { label: 'Export', active: step === 5 },
              ].map((item) => (
                <button
                  key={item.label}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300",
                    item.active 
                      ? "bg-slate-950 dark:bg-white text-white dark:text-slate-900 shadow-lg" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {state.isPrivacyMode && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500"
              >
                <EyeOff size={14} className="animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Privacy Active</span>
              </motion.div>
            )}
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-900 rounded-2xl px-3 py-1.5 border border-slate-200 dark:border-slate-800">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search case data..." 
                className="bg-transparent text-xs font-medium focus:outline-none w-32 xl:w-48 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all active:scale-90"
              >
                {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
              </button>

              <button 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {overdueDeadlines && overdueDeadlines > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950" />
                )}
              </button>

              <button 
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-all shadow-xl shadow-slate-900/20 active:scale-95 ml-2"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-xs font-bold hidden sm:block">Tools</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showQuickMenu && "rotate-180")} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tools Tray (Apple-style) */}
        <AnimatePresence>
          {showQuickMenu && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-20 right-4 w-72 bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 backdrop-blur-2xl ring-1 ring-black/5 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: FileText, label: 'Reports', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { icon: Shield, label: 'Audit', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { icon: Activity, label: 'Stats', color: 'text-amber-500', bg: 'bg-amber-500/10', onClick: () => dispatch({ type: 'SET_STATS_BAR', payload: !state.showStatsBar }), active: state.showStatsBar },
                  { icon: Settings, label: 'Settings', color: 'text-slate-500', bg: 'bg-slate-500/10' },
                ].map((tool) => (
                  <button 
                    key={tool.label}
                    onClick={tool.onClick}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 hover:shadow-lg",
                      tool.active && "bg-white dark:bg-slate-800 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-1", tool.bg)}>
                      <tool.icon className={cn("w-6 h-6", tool.color)} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{tool.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setIsSecurityModalOpen(true)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-bold">Zero-Trust Protocol</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SecurityModal isOpen={showSecurityModal} onClose={() => setIsSecurityModalOpen(false)} />
    </>
  );
};

export default Header;

