'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ScheduleBlock as ScheduleBlockType, TimeSlot, GridPosition } from '@/lib/types';
import { cn, formatTime, calculateGridPosition, getOverlappingBlocks } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ScheduleBlock } from './ScheduleBlock';

interface WeekGridProps {
  weekStart: Date;
  blocks: ScheduleBlockType[];
  onBlockCreate: (timeSlot: TimeSlot) => void;
  onBlockEdit: (block: ScheduleBlockType) => void;
  onBlockDelete: (blockId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function WeekGrid({
  weekStart,
  blocks,
  onBlockCreate,
  onBlockEdit,
  onBlockDelete,
  isLoading = false,
  className,
}: WeekGridProps) {
  const [hoveredSlot, setHoveredSlot] = useState<TimeSlot | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<ScheduleBlockType | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Fix hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Generate time slots for the grid (24 hours * 2 slots per hour = 48 slots)
  const timeSlots = useMemo(() => {
    const slots: { hour: number; minute: number; label: string }[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        slots.push({
          hour,
          minute,
          label: formatTime(date),
        });
      }
    }
    return slots;
  }, []);

  // Generate week days
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }, [weekStart]);

  // Format day headers
  const formatDayHeader = useCallback((date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    const dayName = new Intl.DateTimeFormat('es-MX', { 
      weekday: 'short' 
    }).format(date);
    
    const dayNumber = date.getDate();
    
    return {
      dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      dayNumber,
      isToday,
    };
  }, []);

  // Handle empty slot click
  const handleSlotClick = useCallback((day: number, hour: number, minute: number) => {
    const timeSlot: TimeSlot = { day, hour, minute };
    onBlockCreate(timeSlot);
  }, [onBlockCreate]);

  // Handle slot hover
  const handleSlotHover = useCallback((day: number, hour: number, minute: number) => {
    setHoveredSlot({ day, hour, minute });
  }, []);

  // Clear hover
  const handleSlotLeave = useCallback(() => {
    setHoveredSlot(null);
  }, []);

  // Check if a slot is hovered
  const isSlotHovered = useCallback((day: number, hour: number, minute: number) => {
    return hoveredSlot?.day === day && 
           hoveredSlot?.hour === hour && 
           hoveredSlot?.minute === minute;
  }, [hoveredSlot]);

  // Check if it's a business hour (8 AM to 6 PM)
  const isBusinessHour = useCallback((hour: number) => {
    return hour >= 8 && hour < 18;
  }, []);

  // Check if it's a major hour (on the hour, not 30 minutes)
  const isMajorHour = useCallback((minute: number) => {
    return minute === 0;
  }, []);

  // Calculate block positions and handle overlapping
  const blockPositions = useMemo(() => {
    return blocks.map(block => {
      const position = calculateGridPosition(block, weekStart);
      const overlapping = getOverlappingBlocks(block, blocks);
      
      return {
        block,
        position,
        overlapping: overlapping.length > 0,
        overlapCount: overlapping.length,
      };
    });
  }, [blocks, weekStart]);

  // Handle block edit
  const handleBlockEdit = useCallback((block: ScheduleBlockType) => {
    onBlockEdit(block);
  }, [onBlockEdit]);

  // Handle block delete
  const handleBlockDelete = useCallback((blockId: string) => {
    onBlockDelete(blockId);
  }, [onBlockDelete]);

  // Basic drag and drop handlers
  const handleDragStart = useCallback((block: ScheduleBlockType) => {
    setDraggedBlock(block);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedBlock(null);
  }, []);

  // Check if a slot has a block occupying it
  const getBlockAtSlot = useCallback((day: number, hour: number, minute: number) => {
    return blockPositions.find(({ position }) => {
      const slotRow = (hour * 2) + (minute === 30 ? 1 : 0) + 1;
      const slotColumn = day + 1;
      
      return position.column === slotColumn && 
             slotRow >= position.row && 
             slotRow < position.row + position.span;
    });
  }, [blockPositions]);

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return (
      <Card className={cn('w-full overflow-hidden', className)}>
        <div className="relative">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full overflow-hidden', className)}>
      <div className="relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Grid container */}
        <div className="overflow-auto max-h-[80vh]">
          <div 
            className="grid min-w-[800px] relative"
            style={{
              gridTemplateColumns: '80px repeat(7, 1fr)',
              gridTemplateRows: 'auto repeat(48, 1fr)',
            }}
          >
            {/* Empty corner cell */}
            <div className="sticky top-0 z-20 bg-background border-b border-r p-2">
              <div className="text-xs text-muted-foreground font-medium">
                Hora
              </div>
            </div>

            {/* Day headers */}
            {weekDays.map((day, dayIndex) => {
              const { dayName, dayNumber, isToday } = formatDayHeader(day);
              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'sticky top-0 z-20 bg-background border-b border-r p-3 text-center',
                    isToday && 'bg-blue-50 dark:bg-blue-950'
                  )}
                >
                  <div className={cn(
                    'font-medium text-sm',
                    isToday && 'text-blue-600 dark:text-blue-400'
                  )}>
                    {dayName}
                  </div>
                  <div className={cn(
                    'text-lg font-bold mt-1',
                    isToday && 'text-blue-600 dark:text-blue-400'
                  )}>
                    {dayNumber}
                  </div>
                </div>
              );
            })}

            {/* Time slots and grid cells */}
            {timeSlots.map((slot, slotIndex) => (
              <div key={slotIndex} className="contents">
                {/* Time label */}
                <div 
                  className={cn(
                    'sticky left-0 z-10 bg-background border-b border-r px-2 py-1 text-right',
                    'flex items-center justify-end',
                    isMajorHour(slot.minute) ? 'border-b-2' : 'border-b',
                    !isBusinessHour(slot.hour) && 'bg-muted/30'
                  )}
                  style={{ minHeight: '3rem' }}
                >
                  {isMajorHour(slot.minute) && (
                    <span className={cn(
                      'text-xs font-medium',
                      isBusinessHour(slot.hour) 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    )}>
                      {slot.label}
                    </span>
                  )}
                </div>

                {/* Day cells for this time slot */}
                {weekDays.map((day, dayIndex) => {
                  const isHovered = isSlotHovered(dayIndex, slot.hour, slot.minute);
                  const isTodayColumn = formatDayHeader(day).isToday;
                  
                  return (
                    <div
                      key={`${slotIndex}-${dayIndex}`}
                      className={cn(
                        'border-b border-r cursor-pointer transition-colors relative',
                        'hover:bg-blue-50 dark:hover:bg-blue-950/30',
                        isMajorHour(slot.minute) ? 'border-b-2' : 'border-b',
                        !isBusinessHour(slot.hour) && 'bg-muted/10',
                        isTodayColumn && 'bg-blue-50/30 dark:bg-blue-950/20',
                        isHovered && 'bg-blue-100 dark:bg-blue-900/50',
                      )}
                      style={{ minHeight: '3rem' }}
                      onClick={() => handleSlotClick(dayIndex, slot.hour, slot.minute)}
                      onMouseEnter={() => handleSlotHover(dayIndex, slot.hour, slot.minute)}
                      onMouseLeave={handleSlotLeave}
                    >
                      {/* Hover indicator */}
                      {isHovered && (
                        <div className="absolute inset-0 border-2 border-blue-400 bg-blue-100/50 dark:bg-blue-900/50 rounded-sm">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm">
                              Crear evento
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Render schedule blocks */}
            {blockPositions.map(({ block, position, overlapping }) => (
              <div
                key={block.id}
                className="relative z-30"
                style={{
                  gridColumn: position.column,
                  gridRow: `${position.row} / span ${position.span}`,
                  margin: overlapping ? '2px' : '1px',
                }}
                draggable
                onDragStart={() => handleDragStart(block)}
                onDragEnd={handleDragEnd}
              >
                <ScheduleBlock
                  block={block}
                  gridPosition={position}
                  onEdit={() => handleBlockEdit(block)}
                  onDelete={() => handleBlockDelete(block.id)}
                  isDragging={draggedBlock?.id === block.id}
                  className={cn(
                    'h-full',
                    overlapping && 'ring-2 ring-yellow-400 ring-opacity-50'
                  )}
                />
                
                {/* Overlap indicator */}
                {overlapping && (
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-40">
                    !
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile responsive message */}
        <div className="md:hidden p-4 text-center text-sm text-muted-foreground bg-muted/30">
          <p>Para una mejor experiencia, usa la aplicación en una pantalla más grande.</p>
          <p className="mt-1">Puedes desplazarte horizontalmente para ver todos los días.</p>
        </div>
      </div>
    </Card>
  );
}