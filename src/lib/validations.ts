import { z } from 'zod';

// Schedule Block validation schema
export const scheduleBlockSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  startTime: z.date(),
  endTime: z.date(),
  categoryId: z.string().min(1, 'Category is required'),
}).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// Category validation schema
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color'),
});

// API request schemas
export const createBlockSchema = scheduleBlockSchema;
export const updateBlockSchema = scheduleBlockSchema.partial();

export type ScheduleBlockInput = z.infer<typeof scheduleBlockSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;