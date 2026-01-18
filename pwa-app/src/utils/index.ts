/**
 * Utility exports
 */

// Validation
export {
  isValidDateString,
  sanitizeCurrency,
  formatCurrency,
  isValidEmail,
  isValidPhoneNumber,
  sanitizeHTML,
  truncate as truncateText,
  isValidStateCode,
  isValidAccountNumber,
  validateDateField,
  validateCurrencyField,
  validateFields,
} from './validation';
export type { ValidationResult } from './validation';

// Download
export {
  downloadFile,
  downloadJSON,
  downloadCSV,
  downloadText,
  downloadMarkdown,
  downloadICS,
  objectsToCSV,
  createDataURL,
  printPage,
} from './download';
export type { DownloadOptions } from './download';

// Formatting
export {
  formatDate,
  formatRelativeTime,
  formatDaysRemaining,
  formatNumber,
  formatPercent,
  formatBytes,
  capitalize,
  toTitleCase,
  humanize,
  pluralize,
  truncate,
  maskString,
  formatPhoneNumber,
  getInitials,
  toOrdinal,
} from './formatting';

// Security
export {
  encrypt,
  decrypt,
  secureStore,
  secureRetrieve,
  secureRemove,
  clearAllStorage,
  sanitizeInput,
  sanitizeURL,
  generateSecureId,
  hashString,
  isCleanInput,
  checkRateLimit,
  debounce,
  throttle,
  isAllowedOrigin,
} from './security';

// Performance
export {
  memoize,
  memoizeAsync,
  batchUpdate,
  measureTime,
  measureTimeAsync,
  processInChunks,
  lazy,
  once,
  whenIdle,
  createLazyLoader,
  getVisibleRange,
  createCancellable,
  ObjectPool,
  Profiler,
  profiler,
} from './performance';

// Animation
export {
  transitions,
  easings,
  keyframes,
  animations,
  staggeredDelay,
  createAnimationStyle,
  fadeTransitionClasses,
  slideTransitionClasses,
  scaleTransitionClasses,
  animationFrame,
  smoothScrollTo,
  scrollToTop,
  animateValue,
  waitForTransition,
  waitForAnimation,
} from './animation';

// Date utilities
export {
  parseDate,
  isValidDate,
  toISODateString,
  toISOString,
  startOf,
  endOf,
  addDate,
  subtractDate,
  diffDates,
  isBefore,
  isAfter,
  isSameDay,
  isToday,
  isYesterday,
  isTomorrow,
  isPast,
  isFuture,
  isWithinRange,
  getDaysInMonth,
  isLeapYear,
  getAge,
  getCreditReportingWindow,
  getSOLExpiration,
  formatDateRange,
  getMonthName,
  getDayName,
  getCalendarDates,
} from './date';
export type { DateUnit } from './date';

// Logging
export {
  logger,
  createTimer,
  trackMetric,
  getMetricStats,
  trackError,
  trackAction,
  trackPageView,
  trackFeatureUsage,
  LogLevel,
} from './logger';
export type { LogEntry, LoggerConfig } from './logger';

// Accessibility
export {
  generateId,
  resetIdCounter,
  getAriaLabel,
  getExpandableProps,
  getTabProps,
  getTabPanelProps,
  FOCUSABLE_SELECTORS,
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  createFocusTrap,
  announce,
  announceError,
  cleanupAnnounce,
  handleArrowNavigation,
  getErrorProps,
  getLoadingProps,
  getContrastRatio,
  meetsContrastRequirement,
  prefersReducedMotion,
  getAnimationDuration,
} from './accessibility';
