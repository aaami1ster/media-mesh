/**
 * Date and time utilities
 */

/**
 * Format date to ISO string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Format date to readable string
 */
export function formatDateReadable(
  date: Date | string,
  locale: string = 'en-US',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(
  date: Date | string,
  locale: string = 'en-US',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get current timestamp in milliseconds
 */
export function getCurrentTimestampMs(): number {
  return Date.now();
}

/**
 * Add days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add hours to a date
 */
export function addHours(date: Date | string, hours: number): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(d);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date | string, minutes: number): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(d);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Get difference in milliseconds between two dates
 */
export function getDifferenceMs(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return Math.abs(d1.getTime() - d2.getTime());
}

/**
 * Get difference in seconds between two dates
 */
export function getDifferenceSeconds(
  date1: Date | string,
  date2: Date | string,
): number {
  return Math.floor(getDifferenceMs(date1, date2) / 1000);
}

/**
 * Get difference in minutes between two dates
 */
export function getDifferenceMinutes(
  date1: Date | string,
  date2: Date | string,
): number {
  return Math.floor(getDifferenceSeconds(date1, date2) / 60);
}

/**
 * Get difference in hours between two dates
 */
export function getDifferenceHours(
  date1: Date | string,
  date2: Date | string,
): number {
  return Math.floor(getDifferenceMinutes(date1, date2) / 60);
}

/**
 * Get difference in days between two dates
 */
export function getDifferenceDays(
  date1: Date | string,
  date2: Date | string,
): number {
  return Math.floor(getDifferenceHours(date1, date2) / 24);
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > Date.now();
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Parse date string with validation
 */
export function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}
