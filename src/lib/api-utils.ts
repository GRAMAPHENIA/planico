import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Error response types
export interface ApiError {
  error: string;
  details?: any;
  code?: string;
}

export interface ApiSuccess<T = any> {
  data?: T;
  message: string;
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Recurso no encontrado') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ConflictError';
  }
}

// Error handling utilities
export class ApiErrorHandler {
  static handleZodError(error: ZodError): NextResponse {
    const formattedErrors = error.issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return NextResponse.json(
      {
        error: 'Datos de entrada inválidos',
        details: formattedErrors,
        code: 'VALIDATION_ERROR',
      } as ApiError,
      { status: 400 }
    );
  }

  static handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: 'Ya existe un registro con estos datos únicos',
            details: error.meta,
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
          } as ApiError,
          { status: 409 }
        );
      
      case 'P2025':
        return NextResponse.json(
          {
            error: 'Registro no encontrado',
            code: 'RECORD_NOT_FOUND',
          } as ApiError,
          { status: 404 }
        );
      
      case 'P2003':
        return NextResponse.json(
          {
            error: 'Violación de clave foránea - referencia inválida',
            details: error.meta,
            code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          } as ApiError,
          { status: 400 }
        );
      
      case 'P2014':
        return NextResponse.json(
          {
            error: 'Los datos proporcionados violan una restricción de relación',
            details: error.meta,
            code: 'RELATION_VIOLATION',
          } as ApiError,
          { status: 400 }
        );
      
      default:
        console.error('Unhandled Prisma error:', error);
        return NextResponse.json(
          {
            error: 'Error de base de datos',
            code: 'DATABASE_ERROR',
          } as ApiError,
          { status: 500 }
        );
    }
  }

  static handleCustomError(error: ValidationError | NotFoundError | ConflictError): NextResponse {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          code: 'VALIDATION_ERROR',
        } as ApiError,
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'NOT_FOUND',
        } as ApiError,
        { status: 404 }
      );
    }

    if (error instanceof ConflictError) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          code: 'CONFLICT',
        } as ApiError,
        { status: 409 }
      );
    }

    return this.handleGenericError(error);
  }

  static handleGenericError(error: unknown): NextResponse {
    console.error('Unhandled API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Error interno del servidor',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          code: 'INTERNAL_SERVER_ERROR',
        } as ApiError,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR',
      } as ApiError,
      { status: 500 }
    );
  }
}

// Success response utilities
export class ApiResponseHandler {
  static success<T>(data: T, message: string, status: number = 200): NextResponse {
    return NextResponse.json(
      {
        data,
        message,
      } as ApiSuccess<T>,
      { status }
    );
  }

  static created<T>(data: T, message: string = 'Recurso creado exitosamente'): NextResponse {
    return this.success(data, message, 201);
  }

  static updated<T>(data: T, message: string = 'Recurso actualizado exitosamente'): NextResponse {
    return this.success(data, message, 200);
  }

  static deleted(message: string = 'Recurso eliminado exitosamente'): NextResponse {
    return NextResponse.json(
      {
        message,
      } as ApiSuccess,
      { status: 200 }
    );
  }
}

// Request validation utilities
export class RequestValidator {
  static validateId(id: string | undefined): string | null {
    if (!id) {
      return 'ID es requerido';
    }
    
    if (typeof id !== 'string' || id.trim().length === 0) {
      return 'ID debe ser una cadena válida';
    }
    
    // Basic CUID validation (starts with 'c' and has appropriate length)
    if (!id.match(/^c[a-z0-9]{24}$/)) {
      return 'ID tiene formato inválido';
    }
    
    return null;
  }

  static async validateJson(request: Request): Promise<any> {
    try {
      const body = await request.json();
      return body;
    } catch (error) {
      throw new ValidationError('Cuerpo de la petición debe ser JSON válido');
    }
  }

  static validateDateParam(dateParam: string | null): Date {
    if (!dateParam) {
      return new Date(); // Default to current date
    }

    try {
      const date = new Date(dateParam);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Formato de fecha inválido');
      }
      return date;
    } catch (error) {
      throw new ValidationError('Formato de fecha inválido. Use formato ISO 8601');
    }
  }
}

// Async error wrapper for API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const result = await handler(...args);
      return result as NextResponse;
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiErrorHandler.handleZodError(error);
      }
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return ApiErrorHandler.handlePrismaError(error);
      }

      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
        return ApiErrorHandler.handleCustomError(error);
      }
      
      return ApiErrorHandler.handleGenericError(error);
    }
  };
}

// Rate limiting utilities (basic implementation)
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();
  
  static check(identifier: string, limit: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier);
    
    if (!userRequests || now > userRequests.resetTime) {
      this.requests.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (userRequests.count >= limit) {
      return false;
    }
    
    userRequests.count++;
    return true;
  }
  
  static getRateLimitResponse(): NextResponse {
    return NextResponse.json(
      {
        error: 'Demasiadas peticiones. Intente nuevamente más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
      } as ApiError,
      { status: 429 }
    );
  }
}