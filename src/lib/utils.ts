import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  ScheduleBlock, 
  TimeSlot, 
  GridPosition, 
  WeekInfo, 
  Category,
  WeekDay,
  HourSlot,
  MinuteSlot
} from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date manipulation utilities

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

/**
 * Get the end of the week (Saturday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Get all days of the week for a given date
 */
export function getWeekDays(date: Date): Date[] {
  const weekStart = getWeekStart(date);
  const days: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    days.push(day);
  }
  
  return days;
}

/**
 * Get week information for a given date
 */
export function getWeekInfo(date: Date): WeekInfo {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  const days = getWeekDays(date);
  
  // Calculate ISO week number
  const tempDate = new Date(date);
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  
  return {
    start,
    end,
    days,
    weekNumber,
    year: tempDate.getFullYear(),
  };
}

/**
 * Navigate to previous or next week
 */
export function navigateWeek(currentDate: Date, direction: 'prev' | 'next'): Date {
  const newDate = new Date(currentDate);
  const daysToAdd = direction === 'next' ? 7 : -7;
  newDate.setDate(newDate.getDate() + daysToAdd);
  return newDate;
}

/**
 * Check if two dates are in the same week
 */
export function isSameWeek(date1: Date, date2: Date): boolean {
  const week1Start = getWeekStart(date1);
  const week2Start = getWeekStart(date2);
  return week1Start.getTime() === week2Start.getTime();
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'day' = 'short'): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Mexico_City',
  };

  switch (format) {
    case 'short':
      options.month = 'short';
      options.day = 'numeric';
      break;
    case 'long':
      options.weekday = 'long';
      options.month = 'long';
      options.day = 'numeric';
      options.year = 'numeric';
      break;
    case 'day':
      options.weekday = 'short';
      options.day = 'numeric';
      break;
  }

  return new Intl.DateTimeFormat('es-MX', options).format(date);
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City',
  }).format(date);
}

// Time slot utilities

/**
 * Generate all time slots for a day (48 slots of 30 minutes each)
 */
export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30] as MinuteSlot[]) {
        slots.push({
          day: day as WeekDay,
          hour: hour as HourSlot,
          minute,
        });
      }
    }
  }
  
  return slots;
}

/**
 * Get time slot for a specific date
 */
export function getTimeSlot(date: Date, weekStart: Date): TimeSlot {
  const day = Math.floor((date.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
  const hour = date.getHours();
  const minute = date.getMinutes() >= 30 ? 30 : 0;
  
  return {
    day: Math.max(0, Math.min(6, day)) as WeekDay,
    hour: hour as HourSlot,
    minute: minute as MinuteSlot,
  };
}

/**
 * Convert time slot to date
 */
export function timeSlotToDate(slot: TimeSlot, weekStart: Date): Date {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + slot.day);
  date.setHours(slot.hour, slot.minute, 0, 0);
  return date;
}

/**
 * Round time to nearest 30-minute slot
 */
export function roundToTimeSlot(date: Date): Date {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const roundedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0;
  const hourAdjustment = minutes >= 45 ? 1 : 0;
  
  rounded.setMinutes(roundedMinutes);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  rounded.setHours(rounded.getHours() + hourAdjustment);
  
  return rounded;
}

// Grid position calculation utilities

/**
 * Calculate grid position for a schedule block
 */
export function calculateGridPosition(block: ScheduleBlock, weekStart: Date): GridPosition {
  const startSlot = getTimeSlot(block.startTime, weekStart);
  const endSlot = getTimeSlot(block.endTime, weekStart);
  
  // Calculate column (1-7 for Sunday-Saturday)
  const column = startSlot.day + 1;
  
  // Calculate row (1-48 for 30-minute slots)
  const row = (startSlot.hour * 2) + (startSlot.minute === 30 ? 1 : 0) + 1;
  
  // Calculate span (duration in 30-minute slots)
  const startSlotIndex = (startSlot.hour * 2) + (startSlot.minute === 30 ? 1 : 0);
  const endSlotIndex = (endSlot.hour * 2) + (endSlot.minute === 30 ? 1 : 0);
  const span = Math.max(1, endSlotIndex - startSlotIndex);
  
  return { column, row, span };
}

/**
 * Check if two blocks overlap in the grid
 */
export function blocksOverlap(block1: ScheduleBlock, block2: ScheduleBlock): boolean {
  return (
    block1.startTime < block2.endTime && 
    block1.endTime > block2.startTime &&
    isSameDay(block1.startTime, block2.startTime)
  );
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get blocks that overlap with a given block
 */
export function getOverlappingBlocks(
  targetBlock: ScheduleBlock, 
  allBlocks: ScheduleBlock[]
): ScheduleBlock[] {
  return allBlocks.filter(block => 
    block.id !== targetBlock.id && blocksOverlap(targetBlock, block)
  );
}

// Color and category helper functions

/**
 * Generate a random hex color
 */
export function generateRandomColor(): string {
  const colors = [
    '#EF4444', // red-500
    '#F97316', // orange-500
    '#EAB308', // yellow-500
    '#22C55E', // green-500
    '#06B6D4', // cyan-500
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#F59E0B', // amber-500
    '#10B981', // emerald-500
    '#6366F1', // indigo-500
    '#84CC16', // lime-500
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get contrasting text color for a background color
 */
export function getContrastingTextColor(backgroundColor: string): string {
  // Remove # if present
  const hex = backgroundColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Lighten or darken a color by a percentage
 */
export function adjustColorBrightness(color: string, percent: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16)
    .slice(1);
}

/**
 * Get default categories for the application
 */
export function getDefaultCategories(): Omit<Category, 'id'>[] {
  return [
    { name: 'Trabajo', color: '#3B82F6' },
    { name: 'Personal', color: '#22C55E' },
    { name: 'Ejercicio', color: '#EF4444' },
    { name: 'Estudio', color: '#8B5CF6' },
    { name: 'Reuniones', color: '#F97316' },
    { name: 'Descanso', color: '#06B6D4' },
  ];
}

/**
 * Sort categories by name
 */
export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'es-MX'));
}

/**
 * Find category by name (case insensitive)
 */
export function findCategoryByName(categories: Category[], name: string): Category | undefined {
  return categories.find(cat => 
    cat.name.toLowerCase() === name.toLowerCase()
  );
}

// Validation helpers

/**
 * Validate if a time is aligned to 30-minute slots
 */
export function isValidTimeSlot(date: Date): boolean {
  const minutes = date.getMinutes();
  return minutes === 0 || minutes === 30;
}

/**
 * Validate if a block duration is valid (minimum 30 minutes)
 */
export function isValidBlockDuration(startTime: Date, endTime: Date): boolean {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = durationMs / (1000 * 60);
  return durationMinutes >= 30;
}

/**
 * Get duration in minutes between two dates
 */
export function getDurationInMinutes(startTime: Date, endTime: Date): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}min`;
  }
}
