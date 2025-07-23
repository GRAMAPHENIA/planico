// Core types for the Planico weekly planner

export interface ScheduleBlock {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  category: Category;
}

export interface Category {
  id: string;
  name: string;
  color: string; // Hex color code
}

export interface TimeSlot {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  minute: number; // 0 or 30
}

export interface GridPosition {
  column: number; // 1-7
  row: number; // 1-48
  span: number; // Duration in 30min slots
}

export interface BlockFormData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  categoryId: string;
}

export interface CreateBlockData extends Omit<BlockFormData, 'id'> {}
export interface UpdateBlockData extends Partial<BlockFormData> {}