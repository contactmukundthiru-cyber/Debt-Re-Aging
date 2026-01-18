/**
 * Hook exports
 */

// Toast notifications
export { useToast, useSuccessToast, useErrorToast } from './useToast';
export type { Toast, ToastType, UseToastReturn } from './useToast';

// Local storage
export { useLocalStorage, useSecureStorage } from './useLocalStorage';
export type { UseLocalStorageOptions } from './useLocalStorage';

// Analysis state
export { useAnalysis } from './useAnalysis';
export type { AnalysisState, AnalysisError, AnalyticsData, UseAnalysisReturn } from './useAnalysis';

// Keyboard shortcuts
export {
  useKeyboardShortcuts,
  useKeyboardShortcut,
  useEscapeKey,
  useEnterKey,
  useArrowNavigation,
  formatShortcut,
  useFormattedShortcut,
} from './useKeyboardShortcuts';
export type { KeyboardShortcut } from './useKeyboardShortcuts';

// Form handling
export { useForm, validators } from './useForm';
export type {
  ValidationRule,
  FieldConfig,
  FieldState,
  FormConfig,
  FormState,
  FormActions,
} from './useForm';

// Media queries and responsive
export {
  useMediaQuery,
  useBreakpoint,
  useBreakpointDown,
  useBreakpointBetween,
  useCurrentBreakpoint,
  useResponsive,
  usePrefersReducedMotion,
  usePrefersDarkMode,
  usePrefersHighContrast,
  useWindowSize,
  useIsTouchDevice,
  useOrientation,
  breakpoints,
} from './useMediaQuery';
export type { Breakpoint } from './useMediaQuery';

// Focus management
export { useFocusTrap, useRovingTabIndex } from './useFocusTrap';
