'use client';

import { useState } from 'react';
import { ScheduleBlock as ScheduleBlockType, GridPosition } from '@/lib/types';
import { formatTime, formatDuration, getDurationInMinutes, getContrastingTextColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit, Trash2, Clock } from 'lucide-react';

interface ScheduleBlockProps {
  block: ScheduleBlockType;
  gridPosition: GridPosition;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  className?: string;
}

export function ScheduleBlock({
  block,
  gridPosition,
  onEdit,
  onDelete,
  isDragging = false,
  className,
}: ScheduleBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const duration = getDurationInMinutes(block.startTime, block.endTime);
  const textColor = getContrastingTextColor(block.category.color);
  const isShortBlock = duration <= 60; // Less than or equal to 1 hour
  
  const blockStyle = {
    backgroundColor: block.category.color,
    color: textColor,
    gridColumn: gridPosition.column,
    gridRow: `${gridPosition.row} / span ${gridPosition.span}`,
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-0 shadow-sm transition-all duration-200 cursor-pointer group',
        'hover:shadow-md hover:scale-[1.02] hover:z-10',
        isDragging && 'opacity-50 scale-95',
        isShortBlock ? 'min-h-[2rem]' : 'min-h-[3rem]',
        className
      )}
      style={blockStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onEdit}
    >
      {/* Content */}
      <div className="p-2 h-full flex flex-col justify-between">
        {/* Header with title and time */}
        <div className="flex-1 min-h-0">
          <h3 
            className={cn(
              'font-medium leading-tight truncate',
              isShortBlock ? 'text-xs' : 'text-sm'
            )}
            title={block.title}
          >
            {block.title}
          </h3>
          
          {/* Time display */}
          <div className={cn(
            'flex items-center gap-1 mt-1',
            isShortBlock ? 'text-xs' : 'text-xs'
          )}>
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {formatTime(block.startTime)} - {formatTime(block.endTime)}
            </span>
          </div>
          
          {/* Duration for longer blocks */}
          {!isShortBlock && (
            <div className="text-xs opacity-80 mt-1">
              {formatDuration(duration)}
            </div>
          )}
          
          {/* Description for longer blocks */}
          {!isShortBlock && block.description && (
            <p 
              className="text-xs opacity-80 mt-1 line-clamp-2"
              title={block.description}
            >
              {block.description}
            </p>
          )}
        </div>

        {/* Category indicator */}
        <div className="flex items-center justify-between mt-2">
          <span 
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              'bg-black bg-opacity-10'
            )}
          >
            {block.category.name}
          </span>
          
          {/* Action buttons - only show on hover for larger blocks */}
          {isHovered && !isShortBlock && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  'h-6 w-6 p-0 opacity-80 hover:opacity-100',
                  'hover:bg-black hover:bg-opacity-10'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  'h-6 w-6 p-0 opacity-80 hover:opacity-100',
                  'hover:bg-red-500 hover:bg-opacity-20'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hover overlay for short blocks */}
      {isHovered && isShortBlock && (
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 hover:bg-black hover:bg-opacity-20"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 hover:bg-red-500 hover:bg-opacity-30"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Left border accent */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 bg-black bg-opacity-20"
      />
    </Card>
  );
}