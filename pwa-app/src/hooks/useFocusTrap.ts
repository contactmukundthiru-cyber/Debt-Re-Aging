'use strict';

import { useEffect, useRef, useCallback } from 'react';
import { getFocusableElements, getFirstFocusable } from '../utils/accessibility';

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  enabled?: boolean;
  /** Auto-focus the first focusable element when enabled */
  autoFocus?: boolean;
  /** Restore focus to the previously focused element when disabled */
  restoreFocus?: boolean;
  /** Callback when escape key is pressed */
  onEscape?: () => void;
}

/**
 * Hook for trapping focus within a container element
 * Useful for modals, dialogs, and dropdown menus
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  options: UseFocusTrapOptions = {}
): React.RefObject<T> {
  const {
    enabled = true,
    autoFocus = true,
    restoreFocus = true,
    onEscape,
  } = options;

  const containerRef = useRef<T>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab key for focus trapping
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab: move backwards
        if (active === first || !containerRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        // Tab: move forwards
        if (active === last || !containerRef.current.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [onEscape]
  );

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // Store the currently focused element
    if (restoreFocus) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
    }

    // Auto-focus the first focusable element
    if (autoFocus) {
      const firstFocusable = getFirstFocusable(container);
      if (firstFocusable) {
        // Use setTimeout to ensure the element is ready
        setTimeout(() => firstFocusable.focus(), 0);
      } else {
        // Make container focusable if no focusable elements
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    }

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus when unmounting
      if (restoreFocus && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [enabled, autoFocus, restoreFocus, handleKeyDown]);

  return containerRef;
}

/**
 * Hook for managing roving tabindex in a group of elements
 * Useful for tab lists, menus, and toolbar buttons
 */
export function useRovingTabIndex<T extends HTMLElement = HTMLElement>(
  itemCount: number,
  options: {
    initialIndex?: number;
    vertical?: boolean;
    horizontal?: boolean;
    wrap?: boolean;
    onIndexChange?: (index: number) => void;
  } = {}
): {
  containerRef: React.RefObject<T>;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  getItemProps: (index: number) => {
    tabIndex: number;
    onKeyDown: (event: React.KeyboardEvent) => void;
    onFocus: () => void;
  };
} {
  const {
    initialIndex = 0,
    vertical = true,
    horizontal = false,
    wrap = true,
    onIndexChange,
  } = options;

  const containerRef = useRef<T>(null);
  const activeIndexRef = useRef(initialIndex);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const setActiveIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < itemCount) {
        activeIndexRef.current = index;
        onIndexChange?.(index);
        itemRefs.current[index]?.focus();
      }
    },
    [itemCount, onIndexChange]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, currentIndex: number) => {
      const lastIndex = itemCount - 1;
      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowUp':
          if (vertical) {
            event.preventDefault();
            newIndex = currentIndex > 0 ? currentIndex - 1 : (wrap ? lastIndex : 0);
          }
          break;
        case 'ArrowDown':
          if (vertical) {
            event.preventDefault();
            newIndex = currentIndex < lastIndex ? currentIndex + 1 : (wrap ? 0 : lastIndex);
          }
          break;
        case 'ArrowLeft':
          if (horizontal) {
            event.preventDefault();
            newIndex = currentIndex > 0 ? currentIndex - 1 : (wrap ? lastIndex : 0);
          }
          break;
        case 'ArrowRight':
          if (horizontal) {
            event.preventDefault();
            newIndex = currentIndex < lastIndex ? currentIndex + 1 : (wrap ? 0 : lastIndex);
          }
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = lastIndex;
          break;
      }

      if (newIndex !== currentIndex) {
        setActiveIndex(newIndex);
      }
    },
    [itemCount, vertical, horizontal, wrap, setActiveIndex]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: index === activeIndexRef.current ? 0 : -1,
      onKeyDown: (event: React.KeyboardEvent) => handleKeyDown(event, index),
      onFocus: () => {
        activeIndexRef.current = index;
      },
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
      },
    }),
    [handleKeyDown]
  );

  return {
    containerRef,
    activeIndex: activeIndexRef.current,
    setActiveIndex,
    getItemProps,
  };
}

export default useFocusTrap;
