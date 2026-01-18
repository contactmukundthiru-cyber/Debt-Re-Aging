'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  /** Key to listen for (e.g., 'k', 'Enter', 'Escape') */
  key: string;
  /** Modifier keys required */
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean; // Command on Mac, Windows key on Windows
  };
  /** Handler function */
  handler: (event: KeyboardEvent) => void;
  /** Description for help menu */
  description?: string;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
  /** Only trigger when no input is focused */
  ignoreInputs?: boolean;
}

/**
 * Check if an element is an input element
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    (element as HTMLElement).isContentEditable
  );
}

/**
 * Check if modifiers match
 */
function modifiersMatch(
  event: KeyboardEvent,
  modifiers?: KeyboardShortcut['modifiers']
): boolean {
  const ctrl = modifiers?.ctrl ?? false;
  const alt = modifiers?.alt ?? false;
  const shift = modifiers?.shift ?? false;
  const meta = modifiers?.meta ?? false;

  return (
    event.ctrlKey === ctrl &&
    event.altKey === alt &&
    event.shiftKey === shift &&
    event.metaKey === meta
  );
}

/**
 * Hook for registering keyboard shortcuts
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: 'k', modifiers: { ctrl: true }, handler: () => openSearch() },
 *   { key: 'Escape', handler: () => closeModal() },
 * ]);
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
): void {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent): void {
      for (const shortcut of shortcutsRef.current) {
        // Check if key matches (case-insensitive for letters)
        const keyMatches =
          event.key.toLowerCase() === shortcut.key.toLowerCase() ||
          event.code === shortcut.key;

        if (!keyMatches) continue;

        // Check modifiers
        if (!modifiersMatch(event, shortcut.modifiers)) continue;

        // Check if we should ignore when input is focused
        if (shortcut.ignoreInputs && isInputElement(document.activeElement)) {
          continue;
        }

        // Execute handler
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        shortcut.handler(event);
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}

/**
 * Hook for a single keyboard shortcut
 */
export function useKeyboardShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: Omit<KeyboardShortcut, 'key' | 'handler'> = {}
): void {
  const shortcuts: KeyboardShortcut[] = [{ key, handler, ...options }];
  useKeyboardShortcuts(shortcuts);
}

/**
 * Hook for escape key handling
 */
export function useEscapeKey(handler: () => void, enabled: boolean = true): void {
  useKeyboardShortcuts(
    [{ key: 'Escape', handler, ignoreInputs: false }],
    enabled
  );
}

/**
 * Hook for enter key handling
 */
export function useEnterKey(
  handler: () => void,
  options: { ignoreInputs?: boolean } = { ignoreInputs: true }
): void {
  useKeyboardShortcuts([
    { key: 'Enter', handler, ignoreInputs: options.ignoreInputs },
  ]);
}

/**
 * Hook for arrow key navigation
 */
export function useArrowNavigation(
  handlers: {
    onUp?: () => void;
    onDown?: () => void;
    onLeft?: () => void;
    onRight?: () => void;
  },
  enabled: boolean = true
): void {
  const shortcuts: KeyboardShortcut[] = [];

  if (handlers.onUp) {
    shortcuts.push({ key: 'ArrowUp', handler: handlers.onUp, preventDefault: true });
  }
  if (handlers.onDown) {
    shortcuts.push({ key: 'ArrowDown', handler: handlers.onDown, preventDefault: true });
  }
  if (handlers.onLeft) {
    shortcuts.push({ key: 'ArrowLeft', handler: handlers.onLeft, preventDefault: true });
  }
  if (handlers.onRight) {
    shortcuts.push({ key: 'ArrowRight', handler: handlers.onRight, preventDefault: true });
  }

  useKeyboardShortcuts(shortcuts, enabled);
}

/**
 * Format a keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent);

  if (shortcut.modifiers?.ctrl) {
    parts.push(isMac ? '⌃' : 'Ctrl');
  }
  if (shortcut.modifiers?.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.modifiers?.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.modifiers?.meta) {
    parts.push(isMac ? '⌘' : 'Win');
  }

  // Format special keys
  const keyDisplay: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Enter: '↵',
    Escape: 'Esc',
    Backspace: '⌫',
    Delete: 'Del',
    Tab: '⇥',
    Space: '␣',
  };

  parts.push(keyDisplay[shortcut.key] || shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

/**
 * Hook to get formatted shortcut string
 */
export function useFormattedShortcut(shortcut: KeyboardShortcut): string {
  return formatShortcut(shortcut);
}
