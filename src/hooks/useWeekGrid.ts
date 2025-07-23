'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  getWeekInfo, 
  navigateWeek as navigateWeekUtil, 
  generateTimeSlots, 
  calculateGridPosition,
  isSameWeek,
  getWeekStart
} from '@/lib/utils';
import type { 
  UseWeekGridReturn, 
  WeekInfo, 
  TimeSlot, 
  GridPosition, 
  ScheduleBlock 
} from '@/lib/types';

interface UseWeekGridOptions {
  enableUrlState?: boolean;
  initialWeek?: Date;
}

export function useWeekGrid(options: UseWeekGridOptions = {}): UseWeekGridReturn {
  const { enableUrlState = true, initialWeek } = options;
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize current week from URL or props or current date
  const initializeWeek = useCallback((): Date => {
    if (enableUrlState) {
      const weekParam = searchParams.get('week');
      if (weekParam) {
        const parsedDate = new Date(weekParam);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
    
    return initialWeek || new Date();
  }, [enableUrlState, searchParams, initialWeek]);

  const [currentWeek, setCurrentWeek] = useState<Date>(initializeWeek);

  // Update URL when week changes (if enabled)
  const updateUrl = useCallback((date: Date) => {
    if (!enableUrlState) return;
    
    const weekStart = getWeekStart(date);
    const params = new URLSearchParams(searchParams.toString());
    params.set('week', weekStart.toISOString().split('T')[0]);
    
    // Use replace to avoid cluttering browser history
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [enableUrlState, router, searchParams]);

  // Sync with URL changes
  useEffect(() => {
    if (!enableUrlState) return;
    
    const weekParam = searchParams.get('week');
    if (weekParam) {
      const parsedDate = new Date(weekParam);
      if (!isNaN(parsedDate.getTime()) && !isSameWeek(parsedDate, currentWeek)) {
        setCurrentWeek(parsedDate);
      }
    }
  }, [searchParams, currentWeek, enableUrlState]);

  // Memoized week information
  const weekInfo = useMemo((): WeekInfo => {
    return getWeekInfo(currentWeek);
  }, [currentWeek]);

  // Memoized time slots (static, doesn't change)
  const timeSlots = useMemo((): TimeSlot[] => {
    return generateTimeSlots();
  }, []);

  // Navigate to previous or next week
  const navigateWeek = useCallback((direction: 'prev' | 'next'): void => {
    const newWeek = navigateWeekUtil(currentWeek, direction);
    setCurrentWeek(newWeek);
    updateUrl(newWeek);
  }, [currentWeek, updateUrl]);

  // Go to a specific week
  const goToWeek = useCallback((date: Date): void => {
    if (!isSameWeek(date, currentWeek)) {
      setCurrentWeek(date);
      updateUrl(date);
    }
  }, [currentWeek, updateUrl]);

  // Go to current week (today)
  const goToCurrentWeek = useCallback((): void => {
    const today = new Date();
    if (!isSameWeek(today, currentWeek)) {
      setCurrentWeek(today);
      updateUrl(today);
    }
  }, [currentWeek, updateUrl]);

  // Calculate grid position for a schedule block
  const getBlockPosition = useCallback((block: ScheduleBlock): GridPosition => {
    return calculateGridPosition(block, weekInfo.start);
  }, [weekInfo.start]);

  // Additional helper functions for the grid

  // Check if a date is in the current week
  const isInCurrentWeek = useCallback((date: Date): boolean => {
    return isSameWeek(date, currentWeek);
  }, [currentWeek]);

  // Get the date for a specific time slot
  const getDateForTimeSlot = useCallback((slot: TimeSlot): Date => {
    const date = new Date(weekInfo.start);
    date.setDate(date.getDate() + slot.day);
    date.setHours(slot.hour, slot.minute, 0, 0);
    return date;
  }, [weekInfo.start]);

  // Check if current week is the current calendar week
  const isCurrentWeek = useMemo((): boolean => {
    return isSameWeek(currentWeek, new Date());
  }, [currentWeek]);

  // Get formatted week range string
  const weekRangeString = useMemo((): string => {
    const startDate = weekInfo.start;
    const endDate = weekInfo.end;
    
    const startMonth = startDate.toLocaleDateString('es-MX', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('es-MX', { month: 'short' });
    
    if (startDate.getMonth() === endDate.getMonth()) {
      // Same month
      return `${startDate.getDate()} - ${endDate.getDate()} ${startMonth} ${startDate.getFullYear()}`;
    } else {
      // Different months
      return `${startDate.getDate()} ${startMonth} - ${endDate.getDate()} ${endMonth} ${startDate.getFullYear()}`;
    }
  }, [weekInfo]);

  // Get time slot label for display
  const getTimeSlotLabel = useCallback((slot: TimeSlot): string => {
    const hour = slot.hour.toString().padStart(2, '0');
    const minute = slot.minute.toString().padStart(2, '0');
    return `${hour}:${minute}`;
  }, []);

  // Get day label for display
  const getDayLabel = useCallback((dayIndex: number, format: 'short' | 'long' = 'short'): string => {
    const date = weekInfo.days[dayIndex];
    if (!date) return '';
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: format === 'short' ? 'short' : 'long',
      timeZone: 'America/Mexico_City',
    };
    
    return new Intl.DateTimeFormat('es-MX', options).format(date);
  }, [weekInfo.days]);

  // Check if a time slot is in business hours (configurable)
  const isBusinessHour = useCallback((slot: TimeSlot, startHour = 8, endHour = 18): boolean => {
    return slot.hour >= startHour && slot.hour < endHour;
  }, []);

  return {
    currentWeek,
    weekInfo,
    timeSlots,
    navigateWeek,
    goToWeek,
    goToCurrentWeek,
    getBlockPosition,
    
    // Additional helper methods
    isInCurrentWeek,
    getDateForTimeSlot,
    isCurrentWeek,
    weekRangeString,
    getTimeSlotLabel,
    getDayLabel,
    isBusinessHour,
  };
}