import { z } from 'zod';

// Base validation schemas
export const scheduleBlockSchema = z.object({
  title: z.string()
    .min(1, 'El título es requerido')
    .max(100, 'El título debe tener menos de 100 caracteres')
    .trim(),
  description: z.string()
    .max(500, 'La descripción debe tener menos de 500 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  startTime: z.date({
    message: 'La hora de inicio es requerida y debe ser una fecha válida',
  }),
  endTime: z.date({
    message: 'La hora de fin es requerida y debe ser una fecha válida',
  }),
  categoryId: z.string()
    .min(1, 'La categoría es requerida')
    .cuid('ID de categoría inválido'),
}).refine((data) => {
  return data.endTime > data.startTime;
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['endTime'],
}).refine((data) => {
  // Validate that the time difference is at least 30 minutes
  const diffMs = data.endTime.getTime() - data.startTime.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes >= 30;
}, {
  message: 'La duración mínima debe ser de 30 minutos',
  path: ['endTime'],
}).refine((data) => {
  // Validate that times are aligned to 30-minute slots
  const startMinutes = data.startTime.getMinutes();
  const endMinutes = data.endTime.getMinutes();
  return (startMinutes === 0 || startMinutes === 30) && (endMinutes === 0 || endMinutes === 30);
}, {
  message: 'Las horas deben estar alineadas a intervalos de 30 minutos',
  path: ['startTime'],
});

export const categorySchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre debe tener menos de 50 caracteres')
    .trim(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'El color debe ser un código hexadecimal válido (ej: #FF5733)')
    .length(7, 'El color debe tener exactamente 7 caracteres'),
});

// Time slot validation
export const timeSlotSchema = z.object({
  day: z.number().min(0).max(6),
  hour: z.number().min(0).max(23),
  minute: z.union([z.literal(0), z.literal(30)]),
});

// Grid position validation
export const gridPositionSchema = z.object({
  column: z.number().min(1).max(7),
  row: z.number().min(1).max(48),
  span: z.number().min(1).max(48),
});

// Week navigation validation
export const weekNavigationSchema = z.object({
  date: z.date(),
  direction: z.enum(['prev', 'next']).optional(),
});

// API request schemas
export const createBlockSchema = scheduleBlockSchema;
export const updateBlockSchema = scheduleBlockSchema.partial().refine((data) => {
  // If both startTime and endTime are provided, validate them
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['endTime'],
});

export const createCategorySchema = categorySchema;
export const updateCategorySchema = categorySchema.partial();

// Query parameter schemas
export const weekQuerySchema = z.object({
  date: z.string().datetime().optional(),
  week: z.string().regex(/^\d{4}-W\d{2}$/).optional(), // ISO week format: 2024-W01
});

export const blockQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  categoryId: z.string().cuid().optional(),
});

// Form validation helpers
export const validateTimeSlot = (hour: number, minute: number): boolean => {
  return hour >= 0 && hour <= 23 && (minute === 0 || minute === 30);
};

export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return endDate > startDate;
};

export const validateBlockOverlap = (
  newBlock: { startTime: Date; endTime: Date },
  existingBlocks: { startTime: Date; endTime: Date }[]
): boolean => {
  return !existingBlocks.some(block => 
    (newBlock.startTime < block.endTime && newBlock.endTime > block.startTime)
  );
};

// Type inference from schemas
export type ScheduleBlockInput = z.infer<typeof scheduleBlockSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type TimeSlotInput = z.infer<typeof timeSlotSchema>;
export type GridPositionInput = z.infer<typeof gridPositionSchema>;
export type WeekQueryInput = z.infer<typeof weekQuerySchema>;
export type BlockQueryInput = z.infer<typeof blockQuerySchema>;