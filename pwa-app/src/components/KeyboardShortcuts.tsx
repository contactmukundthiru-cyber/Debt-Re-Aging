'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Shortcut {
    keys: string[];
    description: string;
    context?: string;
}

const SHORTCUTS: Shortcut[] = [
    { keys: ['Ctrl/⌘', 'Enter'], description: 'Analyze current input', context: 'Step 1' },
    { keys: ['Ctrl/⌘', 'P'], description: 'Print analysis results', context: 'Step 4' },
    { keys: ['Escape'], description: 'Close dialogs and panels' },
    { keys: ['→', '←'], description: 'Navigate between tabs', context: 'Analysis view' },
    { keys: ['?'], description: 'Show this help dialog' },
    { keys: ['Tab'], description: 'Navigate between form fields' },
    { keys: ['Enter'], description: 'Submit current form' },
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

    return (
        <div
            className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2
                        id="shortcuts-title"
                        className="text-lg font-semibold text-gray-900 dark:text-white"
                    >
                        Keyboard Shortcuts
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Close shortcuts dialog"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Shortcuts list */}
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {SHORTCUTS.map((shortcut, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between py-2"
                        >
                            <div className="flex-1">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {shortcut.description}
                                </span>
                                {shortcut.context && (
                                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                                        ({shortcut.context})
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {shortcut.keys.map((key, keyIndex) => (
                                    <React.Fragment key={keyIndex}>
                                        {keyIndex > 0 && (
                                            <span className="text-gray-400 text-xs">+</span>
                                        )}
                                        <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700">
                                            {key}
                                        </kbd>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">?</kbd> anytime to show this dialog
                    </p>
                </div>
            </div>
        </div>
    );
};

/**
 * Hook to manage keyboard shortcuts modal state
 */
export function useKeyboardShortcuts() {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    // Listen for '?' key to open shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                toggle();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggle]);

    return { isOpen, open, close, toggle };
}

export default KeyboardShortcuts;
