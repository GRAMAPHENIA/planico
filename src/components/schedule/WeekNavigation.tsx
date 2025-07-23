'use client';

import { useState } from 'react';
import { WeekInfo } from '@/lib/types';
import { formatDate, isSameWeek } from '@/lib/utils';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Icons
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Home,
  CalendarDays
} from 'lucide-react';

interface WeekNavigationProps {
  currentWeek: Date;
  weekInfo: WeekInfo;
  onNavigateWeek: (direction: 'prev' | 'next') => void;
  onGoToCurrentWeek: () => void;
  className?: string;
}

export function WeekNavigation({
  currentWeek,
  weekInfo,
  onNavigateWeek,
  onGoToCurrentWeek,
  className,
}: WeekNavigationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const isCurrentWeek = isSameWeek(currentWeek, new Date());
  
  // Handle navigation with animation
  const handleNavigation = async (direction: 'prev' | 'next') => {
    setIsAnimating(true);
    onNavigateWeek(direction);
    
    // Reset animation after a short delay
    setTimeout(() => {
      setIsAnimating(false);
    }, 200);
  };

  // Format week range for display
  const formatWeekRange = (): string => {
    const startDate = formatDate(weekInfo.start, 'short');
    const endDate = formatDate(weekInfo.end, 'short');
    
    // If same month, show "Jan 1 - 7, 2024"
    if (weekInfo.start.getMonth() === weekInfo.end.getMonth()) {
      const month = formatDate(weekInfo.start, 'short').split(' ')[0];
      const startDay = weekInfo.start.getDate();
      const endDay = weekInfo.end.getDate();
      const year = weekInfo.start.getFullYear();
      
      return `${month} ${startDay} - ${endDay}, ${year}`;
    }
    
    // Different months: "Dec 30, 2023 - Jan 5, 2024"
    return `${startDate} - ${endDate}`;
  };

  // Get week status text
  const getWeekStatusText = (): string => {
    const today = new Date();
    const weekStart = weekInfo.start;
    const weekEnd = weekInfo.end;
    
    if (today >= weekStart && today <= weekEnd) {
      return 'Semana actual';
    } else if (today > weekEnd) {
      const weeksAgo = Math.ceil((today.getTime() - weekEnd.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weeksAgo === 1 ? 'Hace 1 semana' : `Hace ${weeksAgo} semanas`;
    } else {
      const weeksAhead = Math.ceil((weekStart.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weeksAhead === 1 ? 'En 1 semana' : `En ${weeksAhead} semanas`;
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Previous Week Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation('prev')}
            disabled={isAnimating}
            className="flex items-center gap-2 hover:bg-muted"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>

          {/* Week Information */}
          <div className={cn(
            'flex flex-col items-center space-y-1 transition-all duration-200',
            isAnimating && 'scale-95 opacity-70'
          )}>
            {/* Week Range */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-center">
                {formatWeekRange()}
              </h2>
            </div>
            
            {/* Week Status and Number */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                isCurrentWeek 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-muted text-muted-foreground'
              )}>
                {getWeekStatusText()}
              </span>
              
              <div className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                <span>Semana {weekInfo.weekNumber}</span>
              </div>
            </div>
          </div>

          {/* Next Week Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation('next')}
            disabled={isAnimating}
            className="flex items-center gap-2 hover:bg-muted"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Week Button */}
        {!isCurrentWeek && (
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onGoToCurrentWeek}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950"
            >
              <Home className="w-4 h-4" />
              Ir a semana actual
            </Button>
          </div>
        )}

        {/* Week Days Preview */}
        <div className="grid grid-cols-7 gap-1 mt-4">
          {weekInfo.days.map((day, index) => {
            const isToday = isSameWeek(day, new Date()) && 
                           day.toDateString() === new Date().toDateString();
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            
            return (
              <div
                key={index}
                className={cn(
                  'text-center p-2 rounded-md text-xs transition-colors',
                  isToday 
                    ? 'bg-blue-100 text-blue-700 font-medium dark:bg-blue-900 dark:text-blue-300'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <div className="font-medium">{dayNames[index]}</div>
                <div className="text-xs mt-1">{day.getDate()}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}