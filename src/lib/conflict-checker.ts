import { ScheduleBlock } from '@/lib/types';
import { areIntervalsOverlapping, format } from 'date-fns';

export interface ConflictResult {
  hasConflict: boolean;
  conflictingBlocks: ScheduleBlock[];
  suggestions: string[];
}

export class ConflictChecker {
  static checkForConflicts(
    newBlock: { startTime: Date; endTime: Date },
    existingBlocks: ScheduleBlock[],
    excludeBlockId?: string
  ): ConflictResult {
    const conflictingBlocks = existingBlocks.filter(block => {
      // Skip the block being edited
      if (excludeBlockId && block.id === excludeBlockId) {
        return false;
      }

      return areIntervalsOverlapping(
        { start: newBlock.startTime, end: newBlock.endTime },
        { start: new Date(block.startTime), end: new Date(block.endTime) },
        { inclusive: false } // Don't consider touching intervals as overlapping
      );
    });

    const hasConflict = conflictingBlocks.length > 0;
    const suggestions = hasConflict ? this.generateSuggestions(newBlock, conflictingBlocks) : [];

    return {
      hasConflict,
      conflictingBlocks,
      suggestions,
    };
  }

  private static generateSuggestions(
    newBlock: { startTime: Date; endTime: Date },
    conflictingBlocks: ScheduleBlock[]
  ): string[] {
    const suggestions: string[] = [];

    conflictingBlocks.forEach(conflict => {
      const conflictStart = new Date(conflict.startTime);
      const conflictEnd = new Date(conflict.endTime);

      // Suggest time before the conflicting block
      if (conflictStart > newBlock.startTime) {
        suggestions.push(
          `Mover antes de "${conflict.title}" (terminar a las ${format(conflictStart, 'HH:mm')})`
        );
      }

      // Suggest time after the conflicting block
      if (conflictEnd < newBlock.endTime) {
        suggestions.push(
          `Mover después de "${conflict.title}" (comenzar a las ${format(conflictEnd, 'HH:mm')})`
        );
      }
    });

    // Remove duplicates
    return [...new Set(suggestions)];
  }

  static findNextAvailableSlot(
    duration: number, // in minutes
    preferredStart: Date,
    existingBlocks: ScheduleBlock[],
    workingHours: { start: number; end: number } = { start: 8, end: 18 }
  ): Date | null {
    const sortedBlocks = [...existingBlocks].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    let currentTime = new Date(preferredStart);
    
    // Ensure we start within working hours
    if (currentTime.getHours() < workingHours.start) {
      currentTime.setHours(workingHours.start, 0, 0, 0);
    }

    for (const block of sortedBlocks) {
      const blockStart = new Date(block.startTime);
      const proposedEnd = new Date(currentTime.getTime() + duration * 60000);

      // Check if we can fit before this block
      if (proposedEnd <= blockStart) {
        return currentTime;
      }

      // Move to after this block
      currentTime = new Date(block.endTime);
    }

    // Check if we can fit after all blocks
    const proposedEnd = new Date(currentTime.getTime() + duration * 60000);
    if (proposedEnd.getHours() <= workingHours.end) {
      return currentTime;
    }

    return null; // No available slot found
  }
}