import { format, addDays, addWeeks, addMonths, isAfter, isBefore, differenceInDays, isToday, isTomorrow, differenceInSeconds, differenceInHours, differenceInMinutes } from 'date-fns';

/**
 * Formats a countdown timer for imminent due dates
 * @param dueDate - The due date to create countdown for
 * @returns A countdown string in format "HH:MM:SS" or null if not within countdown threshold
 */
export const formatCountdown = (dueDate: Date | null): string | null => {
  if (!dueDate) return null;
  
  const now = new Date();
  
  // If due date is in the past, return null
  if (isBefore(dueDate, now)) return null;
  
  // Calculate time difference in seconds
  const diffInSeconds = differenceInSeconds(dueDate, now);
  
  // Only show countdown if less than 24 hours away
  if (diffInSeconds > 86400) return null;
  
  // Calculate hours, minutes, seconds
  const hours = Math.floor(diffInSeconds / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = Math.floor(diffInSeconds % 60);
  
  // Format as HH:MM:SS
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Checks if a due date is today
 * @param dueDate - The due date to check
 * @returns Boolean indicating if the due date is today
 */
export const isDueToday = (dueDate: Date | null): boolean => {
  if (!dueDate) return false;
  return isToday(dueDate);
};

/**
 * Checks if a due date is within a specified number of days
 * @param dueDate - The due date to check
 * @param days - Number of days to check within
 * @returns Boolean indicating if the due date is within the specified days
 */
export const isWithinDays = (dueDate: Date | null, days: number): boolean => {
  if (!dueDate) return false;
  
  const today = new Date();
  const daysUntilDue = differenceInDays(dueDate, today);
  
  // Return true if the due date is between today and the specified number of days
  return daysUntilDue >= 0 && daysUntilDue <= days;
};

/**
 * Formats a date in a natural, approximate way
 * @param date - The date to format
 * @returns A natural language representation like "in about 2 weeks" or "in about 4 days"
 */
export const formatDateNaturally = (date: Date | null): string => {
  if (!date) return '';
  
  const today = new Date();
  const daysUntilDue = differenceInDays(date, today);
  
  if (daysUntilDue < 0) {
    return daysUntilDue === -1 ? 'Yesterday' : `${Math.abs(daysUntilDue)} days ago`;
  } else if (isToday(date)) {
    return 'Today';
  } else if (isTomorrow(date)) {
    return 'Tomorrow';
  } else if (daysUntilDue < 7) {
    return `in about ${daysUntilDue} days`;
  } else if (daysUntilDue < 14) {
    return `in about a week`;
  } else if (daysUntilDue < 30) {
    const weeks = Math.round(daysUntilDue / 7);
    return `in about ${weeks} weeks`;
  } else if (daysUntilDue < 60) {
    return `in about a month`;
  } else {
    const months = Math.round(daysUntilDue / 30);
    return `in about ${months} months`;
  }
};

/**
 * Parses a natural language date string into a Date object
 * @param input - Natural language date string (e.g., "tomorrow", "in 3 days")
 * @returns Date object or null if parsing failed
 */
export const parseSmartDate = (input: string): Date | null => {
  if (!input) return null;
  
  const today = new Date();
  const lowercaseInput = input.toLowerCase().trim();
  
  // Handle specific keywords
  if (lowercaseInput === 'today') {
    return today;
  }
  
  if (lowercaseInput === 'tomorrow') {
    return addDays(today, 1);
  }
  
  if (lowercaseInput === 'next week') {
    return addWeeks(today, 1);
  }
  
  if (lowercaseInput === 'next month') {
    return addMonths(today, 1);
  }
  
  // Handle "in X days/weeks/months" format
  const inDaysMatch = lowercaseInput.match(/^in\s+(\d+)\s+days?$/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    return addDays(today, days);
  }
  
  const inWeeksMatch = lowercaseInput.match(/^in\s+(\d+)\s+weeks?$/);
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1], 10);
    return addWeeks(today, weeks);
  }
  
  const inMonthsMatch = lowercaseInput.match(/^in\s+(\d+)\s+months?$/);
  if (inMonthsMatch) {
    const months = parseInt(inMonthsMatch[1], 10);
    return addMonths(today, months);
  }
  
  // Handle "in about X days/weeks/months" format
  const inAboutDaysMatch = lowercaseInput.match(/^in\s+about\s+(\d+)\s+days?$/);
  if (inAboutDaysMatch) {
    const days = parseInt(inAboutDaysMatch[1], 10);
    return addDays(today, days);
  }
  
  const inAboutWeeksMatch = lowercaseInput.match(/^in\s+about\s+(\d+)\s+weeks?$/);
  if (inAboutWeeksMatch) {
    const weeks = parseInt(inAboutWeeksMatch[1], 10);
    return addWeeks(today, weeks);
  }
  
  const inAboutMonthsMatch = lowercaseInput.match(/^in\s+about\s+(\d+)\s+months?$/);
  if (inAboutMonthsMatch) {
    const months = parseInt(inAboutMonthsMatch[1], 10);
    return addMonths(today, months);
  }
  
  // Try to parse as a date string
  try {
    const date = new Date(lowercaseInput);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    // Parsing failed, continue to other methods
  }
  
  return null;
};

/**
 * Formats a date for display
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDueDate = (date: Date | null): string => {
  if (!date) return '';
  return format(date, 'MMM d, yyyy');
};

/**
 * Determines the urgency level of a due date
 * @param dueDate - The due date to check
 * @returns 'none' | 'low' | 'medium' | 'high' based on proximity to due date
 */
export const getDueDateUrgency = (dueDate: Date | null): 'none' | 'low' | 'medium' | 'high' => {
  if (!dueDate) return 'none';
  
  const today = new Date();
  
  // If due date is in the past
  if (isBefore(dueDate, today)) {
    return 'high';
  }
  
  const daysUntilDue = differenceInDays(dueDate, today);
  
  if (daysUntilDue <= 1) {
    return 'high';
  } else if (daysUntilDue <= 3) {
    return 'medium';
  } else if (daysUntilDue <= 7) {
    return 'low';
  }
  
  return 'none';
};

/**
 * Gets a CSS class based on due date urgency
 * @param urgency - The urgency level
 * @returns CSS class name for styling
 */
export const getDueDateColorClass = (urgency: 'none' | 'low' | 'medium' | 'high'): string => {
  switch (urgency) {
    case 'high':
      return 'text-red-500 dark:text-red-400';
    case 'medium':
      return 'text-orange-500 dark:text-orange-400';
    case 'low':
      return 'text-yellow-500 dark:text-yellow-400';
    default:
      return 'text-muted-foreground';
  }
};

/**
 * Gets a human-readable relative time description
 * @param dueDate - The due date
 * @returns Human-readable string like "Today", "Tomorrow", "In 3 days", etc.
 */
export const getRelativeDueDate = (dueDate: Date | null): string => {
  if (!dueDate) return '';
  
  const today = new Date();
  const daysUntilDue = differenceInDays(dueDate, today);
  
  if (daysUntilDue < 0) {
    return daysUntilDue === -1 ? 'Yesterday' : `${Math.abs(daysUntilDue)} days ago`;
  } else if (daysUntilDue === 0) {
    return 'Today';
  } else if (daysUntilDue === 1) {
    return 'Tomorrow';
  } else if (daysUntilDue < 7) {
    return `In ${daysUntilDue} days`;
  } else if (daysUntilDue < 30) {
    const weeks = Math.floor(daysUntilDue / 7);
    return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  } else {
    const months = Math.floor(daysUntilDue / 30);
    return `In ${months} ${months === 1 ? 'month' : 'months'}`;
  }
};