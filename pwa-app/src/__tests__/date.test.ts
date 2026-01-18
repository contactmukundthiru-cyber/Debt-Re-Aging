import { parseDate, isValidDate, toISODateString, addDate, diffDates, getCreditReportingWindow } from '../utils/date';

describe('date utils', () => {
  test('parseDate handles various inputs', () => {
    const d = new Date(2023, 0, 1);
    expect(parseDate(d)).toBe(d);
    expect(parseDate('2023-01-01').getFullYear()).toBe(2023);
    expect(parseDate('2023-01-01').getMonth()).toBe(0);
    expect(parseDate('2023-01-01').getDate()).toBe(1);
  });

  test('isValidDate checks validity', () => {
    expect(isValidDate('2023-01-01')).toBe(true);
    expect(isValidDate('invalid')).toBe(false);
  });

  test('toISODateString formats correctly', () => {
    expect(toISODateString(new Date(2023, 0, 15))).toBe('2023-01-15');
  });

  test('addDate adds correctly', () => {
    const start = new Date(2023, 0, 1);
    const later = addDate(start, 1, 'year');
    expect(later.getFullYear()).toBe(2024);
    
    const dayLater = addDate(start, 1, 'day');
    expect(dayLater.getDate()).toBe(2);
  });

  test('diffDates calculates difference', () => {
    const d1 = new Date(2023, 0, 10);
    const d2 = new Date(2023, 0, 1);
    expect(diffDates(d1, d2, 'day')).toBe(9);
  });

  test('getCreditReportingWindow calculates 7 years', () => {
    const window = getCreditReportingWindow('2020-01-01');
    expect(window.startDate.getFullYear()).toBe(2020);
    expect(window.endDate.getFullYear()).toBe(2027);
    expect(window.isExpired).toBe(false);
  });
});
