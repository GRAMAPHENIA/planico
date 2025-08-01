import { ScheduleBlock } from '@/lib/types';
import { differenceInMinutes, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export interface ProductivityMetrics {
  totalBlocks: number;
  totalMinutes: number;
  averageBlockDuration: number;
  categoryBreakdown: Record<string, {
    name: string;
    color: string;
    blocks: number;
    minutes: number;
    percentage: number;
  }>;
  weeklyProgress: {
    planned: number;
    completed: number;
    efficiency: number;
  };
}

export class MetricsCalculator {
  static calculateWeeklyMetrics(
    blocks: ScheduleBlock[], 
    weekDate: Date = new Date()
  ): ProductivityMetrics {
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(weekDate, { weekStartsOn: 0 });

    // Filter blocks for current week
    const weekBlocks = blocks.filter(block => 
      isWithinInterval(new Date(block.startTime), { start: weekStart, end: weekEnd })
    );

    const totalBlocks = weekBlocks.length;
    const totalMinutes = weekBlocks.reduce((sum, block) => 
      sum + differenceInMinutes(new Date(block.endTime), new Date(block.startTime)), 0
    );

    const averageBlockDuration = totalBlocks > 0 ? totalMinutes / totalBlocks : 0;

    // Category breakdown
    const categoryMap = new Map<string, {
      name: string;
      color: string;
      blocks: number;
      minutes: number;
    }>();

    weekBlocks.forEach(block => {
      const categoryId = block.categoryId;
      const duration = differenceInMinutes(new Date(block.endTime), new Date(block.startTime));
      
      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId)!;
        existing.blocks += 1;
        existing.minutes += duration;
      } else {
        categoryMap.set(categoryId, {
          name: block.category.name,
          color: block.category.color,
          blocks: 1,
          minutes: duration,
        });
      }
    });

    const categoryBreakdown: ProductivityMetrics['categoryBreakdown'] = {};
    categoryMap.forEach((data, categoryId) => {
      categoryBreakdown[categoryId] = {
        ...data,
        percentage: totalMinutes > 0 ? (data.minutes / totalMinutes) * 100 : 0,
      };
    });

    // Weekly progress (simplified - could be enhanced with completion tracking)
    const weeklyProgress = {
      planned: totalBlocks,
      completed: totalBlocks, // For now, assume all blocks are completed
      efficiency: totalBlocks > 0 ? 100 : 0,
    };

    return {
      totalBlocks,
      totalMinutes,
      averageBlockDuration,
      categoryBreakdown,
      weeklyProgress,
    };
  }

  static updateMetricsAfterBlockCreation(
    currentMetrics: ProductivityMetrics,
    newBlock: ScheduleBlock
  ): ProductivityMetrics {
    const blockDuration = differenceInMinutes(
      new Date(newBlock.endTime), 
      new Date(newBlock.startTime)
    );

    const updatedMetrics = { ...currentMetrics };
    
    // Update totals
    updatedMetrics.totalBlocks += 1;
    updatedMetrics.totalMinutes += blockDuration;
    updatedMetrics.averageBlockDuration = updatedMetrics.totalMinutes / updatedMetrics.totalBlocks;

    // Update category breakdown
    const categoryId = newBlock.categoryId;
    if (updatedMetrics.categoryBreakdown[categoryId]) {
      updatedMetrics.categoryBreakdown[categoryId].blocks += 1;
      updatedMetrics.categoryBreakdown[categoryId].minutes += blockDuration;
    } else {
      updatedMetrics.categoryBreakdown[categoryId] = {
        name: newBlock.category.name,
        color: newBlock.category.color,
        blocks: 1,
        minutes: blockDuration,
        percentage: 0,
      };
    }

    // Recalculate percentages
    Object.keys(updatedMetrics.categoryBreakdown).forEach(catId => {
      updatedMetrics.categoryBreakdown[catId].percentage = 
        (updatedMetrics.categoryBreakdown[catId].minutes / updatedMetrics.totalMinutes) * 100;
    });

    // Update weekly progress
    updatedMetrics.weeklyProgress.planned += 1;
    updatedMetrics.weeklyProgress.completed += 1;

    return updatedMetrics;
  }
}