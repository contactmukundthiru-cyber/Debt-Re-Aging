/**
 * Logging and monitoring utilities
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: unknown;
  context?: string;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel;
  /** Whether to include timestamps */
  includeTimestamp: boolean;
  /** Custom log handler */
  handler?: (entry: LogEntry) => void;
  /** Max entries to keep in memory */
  maxEntries: number;
}

/**
 * Default configuration
 */
const defaultConfig: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  includeTimestamp: true,
  maxEntries: 100,
};

/**
 * In-memory log storage
 */
const logBuffer: LogEntry[] = [];

/**
 * Current configuration
 */
let config: LoggerConfig = { ...defaultConfig };

/**
 * Level names for display
 */
const levelNames: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.NONE]: 'NONE',
};

/**
 * Console methods by level
 */
const consoleMethods: Record<LogLevel, typeof console.log> = {
  [LogLevel.DEBUG]: console.debug,
  [LogLevel.INFO]: console.info,
  [LogLevel.WARN]: console.warn,
  [LogLevel.ERROR]: console.error,
  [LogLevel.NONE]: console.log,
};

/**
 * Format a log entry for console output
 */
function formatLogEntry(entry: LogEntry): string {
  const parts: string[] = [];

  if (config.includeTimestamp) {
    parts.push(`[${entry.timestamp.toISOString()}]`);
  }

  parts.push(`[${levelNames[entry.level]}]`);

  if (entry.context) {
    parts.push(`[${entry.context}]`);
  }

  parts.push(entry.message);

  return parts.join(' ');
}

/**
 * Write a log entry
 */
function writeLog(level: LogLevel, message: string, data?: unknown, context?: string): void {
  if (level < config.minLevel) return;

  const entry: LogEntry = {
    timestamp: new Date(),
    level,
    message,
    data,
    context,
  };

  // Add to buffer
  logBuffer.push(entry);
  if (logBuffer.length > config.maxEntries) {
    logBuffer.shift();
  }

  // Custom handler
  if (config.handler) {
    config.handler(entry);
    return;
  }

  // Default console output
  const formatted = formatLogEntry(entry);
  const consoleMethod = consoleMethods[level];

  if (data !== undefined) {
    consoleMethod(formatted, data);
  } else {
    consoleMethod(formatted);
  }
}

/**
 * Logger API
 */
export const logger = {
  /**
   * Debug level logging
   */
  debug(message: string, data?: unknown, context?: string): void {
    writeLog(LogLevel.DEBUG, message, data, context);
  },

  /**
   * Info level logging
   */
  info(message: string, data?: unknown, context?: string): void {
    writeLog(LogLevel.INFO, message, data, context);
  },

  /**
   * Warning level logging
   */
  warn(message: string, data?: unknown, context?: string): void {
    writeLog(LogLevel.WARN, message, data, context);
  },

  /**
   * Error level logging
   */
  error(message: string, data?: unknown, context?: string): void {
    writeLog(LogLevel.ERROR, message, data, context);
  },

  /**
   * Log an error object
   */
  logError(error: Error, context?: string): void {
    writeLog(
      LogLevel.ERROR,
      error.message,
      {
        name: error.name,
        stack: error.stack,
      },
      context
    );
  },

  /**
   * Create a child logger with a context
   */
  child(context: string) {
    return {
      debug: (message: string, data?: unknown) => logger.debug(message, data, context),
      info: (message: string, data?: unknown) => logger.info(message, data, context),
      warn: (message: string, data?: unknown) => logger.warn(message, data, context),
      error: (message: string, data?: unknown) => logger.error(message, data, context),
      logError: (error: Error) => logger.logError(error, context),
    };
  },

  /**
   * Get recent log entries
   */
  getEntries(count?: number): LogEntry[] {
    if (count === undefined) return [...logBuffer];
    return logBuffer.slice(-count);
  },

  /**
   * Clear log buffer
   */
  clearEntries(): void {
    logBuffer.length = 0;
  },

  /**
   * Update logger configuration
   */
  configure(newConfig: Partial<LoggerConfig>): void {
    config = { ...config, ...newConfig };
  },

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return config.minLevel;
  },

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    config.minLevel = level;
  },
};

/**
 * Performance timing utility
 */
export function createTimer(name: string): {
  stop: () => number;
  elapsed: () => number;
} {
  const start = performance.now();

  return {
    stop() {
      const elapsed = performance.now() - start;
      logger.debug(`Timer [${name}]: ${elapsed.toFixed(2)}ms`);
      return elapsed;
    },
    elapsed() {
      return performance.now() - start;
    },
  };
}

/**
 * Track a metric
 */
const metrics: Map<string, number[]> = new Map();

export function trackMetric(name: string, value: number): void {
  const values = metrics.get(name) || [];
  values.push(value);
  if (values.length > 100) values.shift();
  metrics.set(name, values);
}

export function getMetricStats(name: string): {
  count: number;
  min: number;
  max: number;
  avg: number;
} | null {
  const values = metrics.get(name);
  if (!values || values.length === 0) return null;

  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
  };
}

/**
 * Error tracking wrapper
 */
export function trackError(error: Error, context?: Record<string, unknown>): void {
  logger.logError(error);

  // In production, you would send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, LogRocket, etc.
    // sendToErrorService({ error, context });
  }
}

/**
 * User action tracking
 */
export function trackAction(action: string, properties?: Record<string, unknown>): void {
  logger.info(`Action: ${action}`, properties, 'Analytics');

  // In production, you would send this to an analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Mixpanel, Amplitude, etc.
    // sendToAnalytics({ action, properties });
  }
}

/**
 * Page view tracking
 */
export function trackPageView(path: string, title?: string): void {
  logger.info(`Page View: ${path}`, { title }, 'Analytics');
}

/**
 * Feature usage tracking
 */
export function trackFeatureUsage(feature: string, details?: Record<string, unknown>): void {
  logger.info(`Feature Used: ${feature}`, details, 'Analytics');
}

export default logger;
