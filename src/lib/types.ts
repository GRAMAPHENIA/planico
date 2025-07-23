// Core types for the Planico weekly planner

// Database entity types
export interface ScheduleBlock {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  categoryId: string;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string; // Hex color code
}

// Grid and time types
export interface TimeSlot {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  minute: number; // 0 or 30
}

export interface GridPosition {
  column: number; // 1-7 (days of week)
  row: number; // 1-48 (30min slots per day)
  span: number; // Duration in 30min slots
}

// Form data types
export interface BlockFormData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  categoryId: string;
}

export interface CategoryFormData {
  name: string;
  color: string;
}

// API operation types
export interface CreateBlockData extends Omit<BlockFormData, 'id'> {}
export interface UpdateBlockData extends Partial<BlockFormData> {}
export interface CreateCategoryData extends CategoryFormData {}
export interface UpdateCategoryData extends Partial<CategoryFormData> {}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ScheduleBlockResponse extends ApiResponse<ScheduleBlock> {}
export interface ScheduleBlocksResponse extends ApiResponse<ScheduleBlock[]> {}
export interface CategoryResponse extends ApiResponse<Category> {}
export interface CategoriesResponse extends ApiResponse<Category[]> {}

// Week navigation types
export interface WeekInfo {
  start: Date;
  end: Date;
  days: Date[];
  weekNumber: number;
  year: number;
}

// Component prop types
export interface BlockPosition {
  block: ScheduleBlock;
  position: GridPosition;
}

// Hook return types
export interface UseScheduleBlocksReturn {
  blocks: ScheduleBlock[];
  isLoading: boolean;
  error: string | null;
  createBlock: (data: CreateBlockData) => Promise<void>;
  updateBlock: (id: string, data: UpdateBlockData) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface UseWeekGridReturn {
  currentWeek: Date;
  weekInfo: WeekInfo;
  timeSlots: TimeSlot[];
  navigateWeek: (direction: 'prev' | 'next') => void;
  goToWeek: (date: Date) => void;
  goToCurrentWeek: () => void;
  getBlockPosition: (block: ScheduleBlock) => GridPosition;
  
  // Additional helper methods
  isInCurrentWeek: (date: Date) => boolean;
  getDateForTimeSlot: (slot: TimeSlot) => Date;
  isCurrentWeek: boolean;
  weekRangeString: string;
  getTimeSlotLabel: (slot: TimeSlot) => string;
  getDayLabel: (dayIndex: number, format?: 'short' | 'long') => string;
  isBusinessHour: (slot: TimeSlot, startHour?: number, endHour?: number) => boolean;
}

// Utility types
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday to Saturday
export type HourSlot = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;
export type MinuteSlot = 0 | 30;

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}