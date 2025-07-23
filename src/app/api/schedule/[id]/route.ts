import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateBlockSchema } from '@/lib/validations';
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

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/schedule/[id] - Get specific block
export const GET = withApiMiddleware(withErrorHandling(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  RequestLogger.log(request);
  
  // Basic rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  if (!RateLimiter.check(clientIp, 100, 60000)) {
    return RateLimiter.getRateLimitResponse();
  }

  const { id } = params;

  // Validate ID format
  const idError = RequestValidator.validateId(id);
  if (idError) {
    throw new NotFoundError(idError);
  }

  const block = await prisma.scheduleBlock.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  if (!block) {
    throw new NotFoundError('Bloque no encontrado');
  }

  const response = ApiResponseHandler.success(block, 'Bloque obtenido exitosamente');
  RequestLogger.log(request, response);
  return response;
}));

// PUT /api/schedule/[id] - Update block
export const PUT = withApiMiddleware(withErrorHandling(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  RequestLogger.log(request);
  
  // Basic rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  if (!RateLimiter.check(clientIp, 50, 60000)) {
    return RateLimiter.getRateLimitResponse();
  }

  const { id } = params;

  // Validate ID format
  const idError = RequestValidator.validateId(id);
  if (idError) {
    throw new NotFoundError(idError);
  }

  const body = await RequestValidator.validateJson(request);

  // Check if block exists
  const existingBlock = await prisma.scheduleBlock.findUnique({
    where: { id },
  });

  if (!existingBlock) {
    throw new NotFoundError('Bloque no encontrado');
  }

  // Sanitize input data
  const sanitizedData = InputSanitizer.validateAndSanitizeBlockData(body);

  // Prepare data for validation
  const updateData = {
    ...sanitizedData,
    startTime: sanitizedData.startTime ? new Date(sanitizedData.startTime) : undefined,
    endTime: sanitizedData.endTime ? new Date(sanitizedData.endTime) : undefined,
  };

  // Validate request body with Zod
  const validatedData = updateBlockSchema.parse(updateData);

  // If categoryId is provided, check if category exists
  if (validatedData.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!category) {
      throw new NotFoundError('La categoría especificada no existe');
    }
  }

  // Check for overlapping blocks (excluding current block)
  if (validatedData.startTime || validatedData.endTime) {
    const startTime = validatedData.startTime || existingBlock.startTime;
    const endTime = validatedData.endTime || existingBlock.endTime;

    const overlappingBlocks = await prisma.scheduleBlock.findMany({
      where: {
        AND: [
          {
            id: {
              not: id, // Exclude current block
            },
          },
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
      throw new ConflictError(
        'El bloque actualizado se superpondría con otro bloque existente',
        { conflictingBlocks: overlappingBlocks }
      );
    }
  }

  // Update the block
  const updatedBlock = await prisma.scheduleBlock.update({
    where: { id },
    data: {
      ...(validatedData.title && { title: validatedData.title }),
      ...(validatedData.description !== undefined && { description: validatedData.description }),
      ...(validatedData.startTime && { startTime: validatedData.startTime }),
      ...(validatedData.endTime && { endTime: validatedData.endTime }),
      ...(validatedData.categoryId && { categoryId: validatedData.categoryId }),
    },
    include: {
      category: true,
    },
  });

  const response = ApiResponseHandler.updated(updatedBlock, 'Bloque actualizado exitosamente');
  RequestLogger.log(request, response);
  return response;
}));

// DELETE /api/schedule/[id] - Delete block
export const DELETE = withApiMiddleware(withErrorHandling(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  RequestLogger.log(request);
  
  // Basic rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  if (!RateLimiter.check(clientIp, 50, 60000)) {
    return RateLimiter.getRateLimitResponse();
  }

  const { id } = params;

  // Validate ID format
  const idError = RequestValidator.validateId(id);
  if (idError) {
    throw new NotFoundError(idError);
  }

  // Check if block exists
  const existingBlock = await prisma.scheduleBlock.findUnique({
    where: { id },
  });

  if (!existingBlock) {
    throw new NotFoundError('Bloque no encontrado');
  }

  // Delete the block
  await prisma.scheduleBlock.delete({
    where: { id },
  });

  const response = ApiResponseHandler.deleted('Bloque eliminado exitosamente');
  RequestLogger.log(request, response);
  return response;
}));