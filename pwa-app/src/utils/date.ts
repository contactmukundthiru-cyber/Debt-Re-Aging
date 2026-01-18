/**
 * Date utility functions
 */

/**
 * Date units for calculations
 */
export type DateUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';

/**
 * Milliseconds per unit
 */
const MS_PER_UNIT: Record<DateUnit, number> = {
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000, // Approximate
  year: 365 * 24 * 60 * 60 * 1000, // Approximate
};

/**
 * Parse a date string or Date object to Date
 */
export function parseDate(date: Date | string | number): Date {
  if (date instanceof Date) return date;
  if (typeof date === 'number') return new Date(date);

  // Handle YYYY-MM-DD format as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(date);
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: Date | string | number): boolean {
  const d = parseDate(date);
  return !isNaN(d.getTime());
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 */
export function toISODateString(date: Date | string | number): string {
  const d = parseDate(date);
  if (!isValidDate(d)) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date as ISO datetime string
 */
export function toISOString(date: Date | string | number): string {
  const d = parseDate(date);
  if (!isValidDate(d)) return '';
  return d.toISOString();
}

/**
 * Get the start of a time unit
 */
export function startOf(date: Date | string | number, unit: DateUnit): Date {
  const d = new Date(parseDate(date));

  switch (unit) {
    case 'year':
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      break;
    case 'month':
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      break;
    case 'week':
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      break;
    case 'day':
      d.setHours(0, 0, 0, 0);
      break;
    case 'hour':
      d.setMinutes(0, 0, 0);
      break;
    case 'minute':
      d.setSeconds(0, 0);
      break;
    case 'second':
      d.setMilliseconds(0);
      break;
  }

  return d;
}

/**
 * Get the end of a time unit
 */
export function endOf(date: Date | string | number, unit: DateUnit): Date {
  const d = new Date(parseDate(date));

  switch (unit) {
    case 'year':
      d.setMonth(11, 31);
      d.setHours(23, 59, 59, 999);
      break;
    case 'month':
      d.setMonth(d.getMonth() + 1, 0);
      d.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const day = d.getDay();
      d.setDate(d.getDate() + (6 - day));
      d.setHours(23, 59, 59, 999);
      break;
    case 'day':
      d.setHours(23, 59, 59, 999);
      break;
    case 'hour':
      d.setMinutes(59, 59, 999);
      break;
    case 'minute':
      d.setSeconds(59, 999);
      break;
    case 'second':
      d.setMilliseconds(999);
      break;
  }

  return d;
}

/**
 * Add units to a date
 */
export function addDate(date: Date | string | number, amount: number, unit: DateUnit): Date {
  const d = new Date(parseDate(date));

  switch (unit) {
    case 'year':
      d.setFullYear(d.getFullYear() + amount);
      break;
    case 'month':
      d.setMonth(d.getMonth() + amount);
      break;
    case 'week':
      d.setDate(d.getDate() + amount * 7);
      break;
    case 'day':
      d.setDate(d.getDate() + amount);
      break;
    case 'hour':
      d.setHours(d.getHours() + amount);
      break;
    case 'minute':
      d.setMinutes(d.getMinutes() + amount);
      break;
    case 'second':
      d.setSeconds(d.getSeconds() + amount);
      break;
  }

  return d;
}

/**
 * Subtract units from a date
 */
export function subtractDate(date: Date | string | number, amount: number, unit: DateUnit): Date {
  return addDate(date, -amount, unit);
}

/**
 * Get difference between two dates in a specific unit
 */
export function diffDates(
  date1: Date | string | number,
  date2: Date | string | number,
  unit: DateUnit = 'day'
): number {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  const diffMs = d1.getTime() - d2.getTime();
  return Math.floor(diffMs / MS_PER_UNIT[unit]);
}

/**
 * Check if date is before another date
 */
export function isBefore(date1: Date | string | number, date2: Date | string | number): boolean {
  return parseDate(date1).getTime() < parseDate(date2).getTime();
}

/**
 * Check if date is after another date
 */
export function isAfter(date1: Date | string | number, date2: Date | string | number): boolean {
  return parseDate(date1).getTime() > parseDate(date2).getTime();
}

/**
 * Check if date is same as another date (day precision)
 */
export function isSameDay(date1: Date | string | number, date2: Date | string | number): boolean {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string | number): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date | string | number): boolean {
  return isSameDay(date, subtractDate(new Date(), 1, 'day'));
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: Date | string | number): boolean {
  return isSameDay(date, addDate(new Date(), 1, 'day'));
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  return isBefore(date, new Date());
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string | number): boolean {
  return isAfter(date, new Date());
}

/**
 * Check if date is within a range
 */
export function isWithinRange(
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number
): boolean {
  const d = parseDate(date);
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  return d >= start && d <= end;
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get the age from a birth date
 */
export function getAge(birthDate: Date | string | number): number {
  const birth = parseDate(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculate the 7-year credit reporting window
 */
export function getCreditReportingWindow(dofd: Date | string | number): {
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  isExpired: boolean;
} {
  const start = parseDate(dofd);
  const end = addDate(start, 7, 'year');
  const today = new Date();
  const daysRemaining = diffDates(end, today, 'day');

  return {
    startDate: start,
    endDate: end,
    daysRemaining: Math.max(0, daysRemaining),
    isExpired: daysRemaining <= 0,
  };
}

/**
 * Calculate statute of limitations expiration
 */
export function getSOLExpiration(
  lastPaymentDate: Date | string | number,
  solYears: number
): {
  expirationDate: Date;
  daysRemaining: number;
  isExpired: boolean;
} {
  const lastPayment = parseDate(lastPaymentDate);
  const expiration = addDate(lastPayment, solYears, 'year');
  const today = new Date();
  const daysRemaining = diffDates(expiration, today, 'day');

  return {
    expirationDate: expiration,
    daysRemaining: Math.max(0, daysRemaining),
    isExpired: daysRemaining <= 0,
  };
}

/**
 * Format a date range
 */
export function formatDateRange(
  startDate: Date | string | number,
  endDate: Date | string | number,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const formatter = new Intl.DateTimeFormat('en-US', options);
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

/**
 * Get month name
 */
export function getMonthName(month: number, format: 'long' | 'short' = 'long'): string {
  const date = new Date(2000, month, 1);
  return date.toLocaleString('en-US', { month: format });
}

/**
 * Get day name
 */
export function getDayName(dayOfWeek: number, format: 'long' | 'short' = 'long'): string {
  const date = new Date(2000, 0, 2 + dayOfWeek); // Jan 2, 2000 is a Sunday
  return date.toLocaleString('en-US', { weekday: format });
}

/**
 * Get calendar dates for a month
 */
export function getCalendarDates(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const daysInMonth = getDaysInMonth(year, month);

  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month, day));
  }

  return dates;
}
