'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Shortcut {
    keys: string[];
    description: string;
    category?: string;
}

const SHORTCUTS: Shortcut[] = [
    // Navigation
    { keys: ['1-6'], description: 'Jump to step', category: 'Navigation' },
    { keys: ['→', '←'], description: 'Navigate between tabs', category: 'Navigation' },
    { keys: ['Escape'], description: 'Close dialogs and panels', category: 'Navigation' },

    // Actions
    { keys: ['Ctrl/⌘', 'Enter'], description: 'Analyze current input', category: 'Actions' },
    { keys: ['Ctrl/⌘', 'P'], description: 'Print analysis results', category: 'Actions' },
    { keys: ['Ctrl/⌘', 'S'], description: 'Save/Export current view', category: 'Actions' },
    { keys: ['Ctrl/⌘', 'D'], description: 'Download active document', category: 'Actions' },

    // General
    { keys: ['?'], description: 'Show this help dialog', category: 'General' },
    { keys: ['Tab'], description: 'Navigate between fields', category: 'General' },
    { keys: ['Enter'], description: 'Submit current form', category: 'General' },
    { keys: ['Ctrl/⌘', '/'], description: 'Toggle dark mode', category: 'General' },
];

interface KeyboardShortcutsProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * KeyboardShortcuts - Modal showing all available keyboard shortcuts
 * Helps power users navigate the application efficiently
 */
export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
    // Close on escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const categories = Array.from(new Set(SHORTCUTS.map(s => s.category).filter(Boolean)));

    return (
        <div
            className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-slate-950 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </div>
                        <div>
                            <h2 id="shortcuts-title" className="text-lg font-bold text-white">
                                Keyboard Shortcuts
                            </h2>
                            <p className="text-xs text-slate-500">Navigate like a power user</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
                        aria-label="Close shortcuts dialog"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Shortcuts list */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {categories.map(category => (
                        <div key={category}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">{category}</p>
                            <div className="space-y-2">
                                {SHORTCUTS.filter(s => s.category === category).map((shortcut, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-900 transition-colors"
                                    >
                                        <span className="text-sm text-slate-300">
                                            {shortcut.description}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, keyIndex) => (
                                                <React.Fragment key={keyIndex}>
                                                    {keyIndex > 0 && (
                                                        <span className="text-slate-600 text-xs mx-0.5">+</span>
                                                    )}
                                                    <kbd className="px-2.5 py-1 text-xs font-mono bg-slate-800 text-slate-300 rounded-lg border border-slate-700 shadow-sm">
                                                        {key}
                                                    </kbd>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <p className="text-xs text-slate-500 text-center">
                        Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 mx-1 border border-slate-700">?</kbd> anytime to toggle this panel
                    </p>
                </div>
            </div>
        </div>
    );
};

/**
 * Hook to manage keyboard shortcuts modal state and execution
 */
export function useKeyboardShortcuts(onNavigate?: (step: number) => void, onAction?: (action: string) => void) {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    // Listen for keys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            
            // '?' to toggle shortcuts panel
            if (e.key === '?' && !isTyping && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                toggle();
                return;
            }

            // 'Escape' to close
            if (e.key === 'Escape' && isOpen) {
                close();
                return;
            }

            // Step navigation (1-6)
            if (!isTyping && onNavigate && /^[1-6]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                onNavigate(parseInt(e.key));
                return;
            }

            // Ctrl/Cmd + Enter to trigger analysis
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onAction) {
                e.preventDefault();
                onAction('analyze');
                return;
            }

            // Ctrl/Cmd + S to trigger export
            if ((e.ctrlKey || e.metaKey) && e.key === 's' && onAction) {
                e.preventDefault();
                onAction('export');
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggle, close, isOpen, onNavigate, onAction]);

    return { isOpen, open, close, toggle };
}

export default KeyboardShortcuts;
