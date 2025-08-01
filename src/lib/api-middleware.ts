import { NextRequest, NextResponse } from 'next/server';

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // En producción, especificar dominios específicos
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
};

// Content type validation
export function validateContentType(request: NextRequest): string | null {
  const contentType = request.headers.get('content-type');
  
  if (request.method === 'POST' || request.method === 'PUT') {
    if (!contentType || !contentType.includes('application/json')) {
      return 'Content-Type debe ser application/json para peticiones POST/PUT';
    }
  }
  
  return null;
}

// Request size validation (basic)
export function validateRequestSize(request: NextRequest): string | null {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const maxSize = 1024 * 1024; // 1MB limit
    
    if (size > maxSize) {
      return 'El tamaño de la petición excede el límite permitido (1MB)';
    }
  }
  
  return null;
}

// Add security and CORS headers to response
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Add CORS headers
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// Handle preflight OPTIONS requests
export function handlePreflight(): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}

// Middleware wrapper for API routes
export function withApiMiddleware<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handlePreflight();
    }
    
    // Validate content type
    const contentTypeError = validateContentType(request);
    if (contentTypeError) {
      const errorResponse = NextResponse.json(
        { 
          error: contentTypeError,
          code: 'INVALID_CONTENT_TYPE',
        },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }
    
    // Validate request size
    const sizeError = validateRequestSize(request);
    if (sizeError) {
      const errorResponse = NextResponse.json(
        { 
          error: sizeError,
          code: 'REQUEST_TOO_LARGE',
        },
        { status: 413 }
      );
      return addSecurityHeaders(errorResponse);
    }
    
    try {
      // Execute the handler
      const response = await handler(...args);
      
      // Add security headers to successful responses
      return addSecurityHeaders(response);
    } catch (error) {
      // Handle any uncaught errors
      console.error('Unhandled API error:', error);
      const errorResponse = NextResponse.json(
        { 
          error: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR',
        },
        { status: 500 }
      );
      return addSecurityHeaders(errorResponse);
    }
  };
}

// Input sanitization utilities
export class InputSanitizer {
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }
  
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>'"&]/g, (match) => {
        const htmlEntities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return htmlEntities[match] || match;
      });
  }
  
  static validateAndSanitizeBlockData(data: any): any {
    if (!data || typeof data !== 'object') {
      throw new Error('Datos inválidos');
    }
    
    return {
      ...data,
      title: data.title ? this.sanitizeString(data.title) : data.title,
      description: data.description ? this.sanitizeString(data.description) : data.description,
    };
  }
}

// Request logging utility
export class RequestLogger {
  static log(request: NextRequest, response?: NextResponse): void {
    // Solo log si está explícitamente habilitado
    if (process.env.NODE_ENV === 'development' && process.env.PRISMA_LOG_LEVEL === 'verbose') {
      const timestamp = new Date().toISOString();
      const method = request.method;
      const url = request.url;
      const status = response?.status || 'pending';
      
      console.log(`[${timestamp}] ${method} ${url} - ${status}`);
    }
  }
}