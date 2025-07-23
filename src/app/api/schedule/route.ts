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
export const GET = withApiMiddleware(withErrorHandling(async (request: NextRequest) => {
  RequestLogger.log(request);
  
  // Basic rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  if (!RateLimiter.check(clientIp, 100, 60000)) {
    return RateLimiter.getRateLimitResponse();
  }

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

  const response = ApiResponseHandler.success(blocks, 'Bloques obtenidos exitosamente');
  RequestLogger.log(request, response);
  return response;
}));

// POST /api/schedule - Create new block
export const POST = withApiMiddleware(withErrorHandling(async (request: NextRequest) => {
  RequestLogger.log(request);
  
  // Basic rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  if (!RateLimiter.check(clientIp, 50, 60000)) {
    return RateLimiter.getRateLimitResponse();
  }

  const body = await RequestValidator.validateJson(request);
  
  // Sanitize input data
  const sanitizedData = InputSanitizer.validateAndSanitizeBlockData(body);
  
  // Validate request body with Zod
  const validatedData = createBlockSchema.parse({
    ...sanitizedData,
    startTime: new Date(sanitizedData.startTime),
    endTime: new Date(sanitizedData.endTime),
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

  const response = ApiResponseHandler.created(newBlock, 'Bloque creado exitosamente');
  RequestLogger.log(request, response);
  return response;
}));