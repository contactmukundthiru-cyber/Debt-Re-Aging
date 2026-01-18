'use strict';

/**
 * Accessibility utilities for improving a11y support
 */

// ============================================================================
// ARIA Utilities
// ============================================================================

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export function generateId(prefix: string = 'aria'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Reset ID counter (useful for testing)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Create ARIA label props for an element
 */
export function getAriaLabel(label: string, describedBy?: string): Record<string, string> {
  const props: Record<string, string> = {
    'aria-label': label,
  };
  if (describedBy) {
    props['aria-describedby'] = describedBy;
  }
  return props;
}

/**
 * Create ARIA props for expandable content
 */
export function getExpandableProps(
  isExpanded: boolean,
  controlsId: string
): Record<string, string | boolean> {
  return {
    'aria-expanded': isExpanded,
    'aria-controls': controlsId,
  };
}

/**
 * Create ARIA props for a tab
 */
export function getTabProps(
  isSelected: boolean,
  tabId: string,
  panelId: string
): Record<string, string | boolean | number> {
  return {
    role: 'tab',
    id: tabId,
    'aria-selected': isSelected,
    'aria-controls': panelId,
    tabIndex: isSelected ? 0 : -1,
  };
}

/**
 * Create ARIA props for a tab panel
 */
export function getTabPanelProps(
  tabId: string,
  panelId: string
): Record<string, string> {
  return {
    role: 'tabpanel',
    id: panelId,
    'aria-labelledby': tabId,
  };
}

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Focusable element selectors
 * Note: These selectors exclude elements with tabindex="-1" which are
 * programmatically focusable but not in the tab order
 */
export const FOCUSABLE_SELECTORS = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]:not([tabindex="-1"])',
  'video[controls]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"]):not([tabindex="-1"])',
  'details>summary:first-of-type:not([tabindex="-1"])',
].join(',');

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
  return Array.from(elements).filter(el => {
    // Filter out elements that are not visible
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/**
 * Get the first focusable element in a container
 */
export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  const focusable = getFocusableElements(container);
  return focusable[0] || null;
}

/**
 * Get the last focusable element in a container
 */
export function getLastFocusable(container: HTMLElement): HTMLElement | null {
  const focusable = getFocusableElements(container);
  return focusable[focusable.length - 1] || null;
}

/**
 * Focus trap handler for modals and dialogs
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  let previousActiveElement: HTMLElement | null = null;

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab
      if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return {
    activate() {
      previousActiveElement = document.activeElement as HTMLElement;
      container.addEventListener('keydown', handleKeyDown);

      // Focus first focusable element
      const first = getFirstFocusable(container);
      if (first) {
        first.focus();
      } else {
        // If no focusable elements, make container focusable
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    },
    deactivate() {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus to previously focused element
      if (previousActiveElement && previousActiveElement.focus) {
        previousActiveElement.focus();
      }
    },
  };
}

// ============================================================================
// Screen Reader Announcements
// ============================================================================

let announceElement: HTMLElement | null = null;

/**
 * Initialize the screen reader announcement region
 */
function ensureAnnounceElement(): HTMLElement {
  if (announceElement && document.body.contains(announceElement)) {
    return announceElement;
  }

  announceElement = document.createElement('div');
  announceElement.setAttribute('role', 'status');
  announceElement.setAttribute('aria-live', 'polite');
  announceElement.setAttribute('aria-atomic', 'true');
  announceElement.className = 'sr-only';
  // Visually hidden but accessible to screen readers
  announceElement.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(announceElement);
  return announceElement;
}

/**
 * Announce a message to screen readers
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const element = ensureAnnounceElement();
  element.setAttribute('aria-live', priority);

  // Clear and set message to trigger announcement
  element.textContent = '';
  // Use requestAnimationFrame to ensure DOM update
  requestAnimationFrame(() => {
    element.textContent = message;
  });
}

/**
 * Announce an error message (assertive)
 */
export function announceError(message: string): void {
  announce(message, 'assertive');
}

/**
 * Clean up announcement element
 */
export function cleanupAnnounce(): void {
  if (announceElement && document.body.contains(announceElement)) {
    document.body.removeChild(announceElement);
    announceElement = null;
  }
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

/**
 * Handle arrow key navigation in a list
 */
export function handleArrowNavigation(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  options: {
    vertical?: boolean;
    horizontal?: boolean;
    wrap?: boolean;
  } = {}
): number {
  const { vertical = true, horizontal = false, wrap = true } = options;

  let newIndex = currentIndex;
  const lastIndex = items.length - 1;

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

  if (newIndex !== currentIndex && items[newIndex]) {
    items[newIndex].focus();
  }

  return newIndex;
}

// ============================================================================
// Form Accessibility
// ============================================================================

/**
 * Create accessible error props for form fields
 */
export function getErrorProps(
  errorId: string,
  hasError: boolean,
  errorMessage?: string
): { input: Record<string, string | boolean>; error: Record<string, string> } {
  return {
    input: {
      'aria-invalid': hasError,
      'aria-describedby': hasError ? errorId : '',
    },
    error: {
      id: errorId,
      role: 'alert',
      'aria-live': 'polite',
    },
  };
}

/**
 * Create accessible loading state props
 */
export function getLoadingProps(
  isLoading: boolean,
  loadingMessage: string = 'Loading...'
): Record<string, string | boolean> {
  return {
    'aria-busy': isLoading,
    'aria-describedby': isLoading ? 'loading-status' : '',
  };
}

// ============================================================================
// Color Contrast
// ============================================================================

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 * WCAG 2.1 requires at least 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG requirements
 */
export function meetsContrastRequirement(
  color1: string,
  color2: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);

  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  // AA level
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

// ============================================================================
// Reduced Motion
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on reduced motion preference
 */
export function getAnimationDuration(normalDuration: number): number {
  return prefersReducedMotion() ? 0 : normalDuration;
}
