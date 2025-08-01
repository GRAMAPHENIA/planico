import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createBlockSchema } from '@/lib/validations';
import { startOfWeek, endOfWeek } from 'date-fns';
import { 
  withErrorHandling, 
  ApiResponseHandler, 
  RequestValidator,
  RateLimiter,
  NotFoundError,
  ConflictError 
} from '@/lib/api-utils';
import { 
  withApiMiddleware, 
  InputSanitizer,
  RequestLogger 
} from '@/lib/api-middleware';

// GET /api/schedule - Fetch blocks by week
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  
  // Validate and parse date parameter
  const targetDate = RequestValidator.validateDateParam(dateParam);
  
  // Calculate week boundaries (Sunday to Saturday)
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 0 });
  
  const blocks = await prisma.scheduleBlock.findMany({
    where: {
      startTime: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  return ApiResponseHandler.success(blocks, 'Bloques obtenidos exitosamente');
});

// POST /api/schedule - Create new block
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await RequestValidator.validateJson(request);
  
  // Validate request body with Zod
  const validatedData = createBlockSchema.parse({
    ...body,
    startTime: new Date(body.startTime),
    endTime: new Date(body.endTime),
  });

  const { title, description, startTime, endTime, categoryId } = validatedData;

  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return NextResponse.json(
      { 
        error: 'La categoría especificada no existe',
        code: 'CATEGORY_NOT_FOUND',
      },
      { status: 400 }
    );
  }

  // Check for overlapping blocks
  const overlappingBlocks = await prisma.scheduleBlock.findMany({
    where: {
      AND: [
        {
          startTime: {
            lt: endTime,
          },
        },
        {
          endTime: {
            gt: startTime,
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
    },
  });

  if (overlappingBlocks.length > 0) {
    return NextResponse.json(
      { 
        error: 'El bloque se superpone con otro bloque existente',
        details: { conflictingBlocks: overlappingBlocks },
        code: 'SCHEDULE_CONFLICT',
      },
      { status: 409 }
    );
  }

  // Create the block
  const newBlock = await prisma.scheduleBlock.create({
    data: {
      title,
      description,
      startTime,
      endTime,
      categoryId,
    },
    include: {
      category: true,
    },
  });

  return ApiResponseHandler.created(newBlock, 'Bloque creado exitosamente');
});