# Guía de Desarrollo

Esta guía proporciona información detallada para desarrolladores que quieran contribuir o extender Planico.

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico

```
Frontend:
├── Next.js 15 (App Router)
├── React 19
├── TypeScript
├── Tailwind CSS
└── Radix UI

Backend:
├── Next.js API Routes
├── Prisma ORM
├── SQLite (desarrollo)
└── Zod (validación)

Herramientas:
├── ESLint
├── Prettier (implícito)
├── pnpm
└── Turbopack
```

### Estructura de Directorios

```
planico/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── api/               # API Routes
│   │   │   ├── schedule/      # Endpoints de horarios
│   │   │   └── categories/    # Endpoints de categorías
│   │   ├── globals.css        # Estilos globales
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Página principal
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base (shadcn/ui)
│   │   ├── layout/           # Componentes de layout
│   │   └── schedule/         # Componentes específicos
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilidades y configuraciones
│   └── types/                # Definiciones de tipos
├── prisma/                   # Configuración de base de datos
├── docs/                     # Documentación
├── .kiro/                    # Configuración de Kiro IDE
└── public/                   # Archivos estáticos
```

## 🚀 Configuración del Entorno

### Prerrequisitos

- Node.js 18+ (recomendado: 20+)
- pnpm 8+ (recomendado sobre npm/yarn)
- Git

### Instalación Inicial

```bash
# Clonar el repositorio
git clone <repository-url>
cd planico

# Instalar dependencias
pnpm install

# Configurar base de datos
pnpm db:push

# Ejecutar seeds (opcional)
pnpm tsx prisma/seed.ts

# Iniciar desarrollo
pnpm dev
```

### Variables de Entorno

Crear archivo `.env` en la raíz:

```env
# Base de datos
DATABASE_URL="file:./dev.db"

# Configuración de logs
PRISMA_LOG_LEVEL="error"  # error | verbose

# Desarrollo
NODE_ENV="development"
```

## 🧩 Patrones de Desarrollo

### Convenciones de Naming

```typescript
// Componentes: PascalCase
export function ScheduleBlock() {}

// Hooks: camelCase con prefijo "use"
export function useScheduleBlocks() {}

// Utilidades: camelCase
export function formatDate() {}

// Tipos: PascalCase
export interface ScheduleBlock {}

// Constantes: UPPER_SNAKE_CASE
export const DEFAULT_WORKING_HOURS = { start: 8, end: 18 };
```

### Estructura de Componentes

```typescript
// Orden recomendado en componentes
import { useState, useEffect, useCallback } from 'react';  // React hooks
import { format } from 'date-fns';                        // Librerías externas
import { Button } from '@/components/ui/button';          // Componentes UI
import { useScheduleBlocks } from '@/hooks/useScheduleBlocks'; // Custom hooks
import type { ScheduleBlock } from '@/lib/types';         // Tipos

interface ComponentProps {
  // Props interface
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // 1. State hooks
  const [state, setState] = useState();
  
  // 2. Custom hooks
  const { data, loading } = useScheduleBlocks();
  
  // 3. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 4. Callbacks
  const handleClick = useCallback(() => {
    // Handler logic
  }, []);
  
  // 5. Early returns
  if (loading) return <div>Loading...</div>;
  
  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Manejo de Estado

```typescript
// Usar useState para estado local simple
const [isOpen, setIsOpen] = useState(false);

// Usar useReducer para estado complejo
const [state, dispatch] = useReducer(reducer, initialState);

// Usar custom hooks para lógica reutilizable
const { blocks, createBlock, updateBlock } = useScheduleBlocks();

// Evitar prop drilling excesivo - usar Context cuando sea necesario
const ThemeContext = createContext<ThemeContextType>();
```

## 🎨 Desarrollo de UI

### Sistema de Diseño

```typescript
// Colores (definidos en globals.css)
const colors = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  // ... más colores
};

// Espaciado (Tailwind)
const spacing = {
  xs: 'p-1',    // 4px
  sm: 'p-2',    // 8px
  md: 'p-4',    // 16px
  lg: 'p-6',    // 24px
  xl: 'p-8',    // 32px
};
```

### Componentes Base (shadcn/ui)

```bash
# Agregar nuevos componentes UI
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add card

# Personalizar componentes existentes
# Editar archivos en src/components/ui/
```

### Responsive Design

```typescript
// Usar clases responsive de Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Contenido */}
</div>

// Breakpoints estándar:
// sm: 640px
// md: 768px  
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

## 🗄️ Desarrollo de Base de Datos

### Esquema de Prisma

```prisma
// prisma/schema.prisma
model ScheduleBlock {
  id          String   @id @default(cuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("schedule_blocks")
}
```

### Migraciones

```bash
# Crear migración después de cambios en schema
pnpm db:migrate

# Aplicar cambios sin migración (desarrollo)
pnpm db:push

# Generar cliente Prisma
pnpm db:generate

# Abrir Prisma Studio
pnpm db:studio
```

### Queries Comunes

```typescript
// Obtener bloques con categoría
const blocks = await prisma.scheduleBlock.findMany({
  include: {
    category: true
  },
  where: {
    startTime: {
      gte: weekStart,
      lte: weekEnd
    }
  },
  orderBy: {
    startTime: 'asc'
  }
});

// Crear bloque con validación
const newBlock = await prisma.scheduleBlock.create({
  data: {
    title,
    description,
    startTime,
    endTime,
    categoryId
  },
  include: {
    category: true
  }
});
```

## 🔧 Desarrollo de API

### Estructura de Route Handler

```typescript
// src/app/api/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/api-utils';

export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Extraer parámetros
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  
  // 2. Validar entrada
  const targetDate = validateDateParam(dateParam);
  
  // 3. Consultar base de datos
  const blocks = await prisma.scheduleBlock.findMany({
    // Query logic
  });
  
  // 4. Retornar respuesta
  return NextResponse.json({
    success: true,
    data: blocks,
    message: 'Bloques obtenidos exitosamente'
  });
});
```

### Validación con Zod

```typescript
import { z } from 'zod';

const createBlockSchema = z.object({
  title: z.string().min(1, 'Título requerido').max(100),
  description: z.string().max(500).optional(),
  startTime: z.date(),
  endTime: z.date(),
  categoryId: z.string().cuid()
}).refine(data => data.endTime > data.startTime, {
  message: "La fecha de fin debe ser posterior a la de inicio"
});

// Uso en API route
const validatedData = createBlockSchema.parse(requestData);
```

### Manejo de Errores

```typescript
// Wrapper para manejo consistente de errores
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const result = await handler(...args);
      return result as NextResponse;
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error);
      }
      if (error instanceof PrismaClientKnownRequestError) {
        return handlePrismaError(error);
      }
      return handleGenericError(error);
    }
  };
}
```

## 🧪 Testing

### Configuración de Testing

```bash
# Instalar dependencias de testing (ya incluidas)
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# Ejecutar tests
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests en modo watch
pnpm test:watch
```

### Ejemplo de Test de Componente

```typescript
// src/components/__tests__/ScheduleBlock.test.tsx
import { render, screen } from '@testing-library/react';
import { ScheduleBlock } from '../ScheduleBlock';

const mockBlock = {
  id: '1',
  title: 'Test Block',
  description: 'Test Description',
  startTime: new Date('2024-12-01T10:00:00Z'),
  endTime: new Date('2024-12-01T11:00:00Z'),
  categoryId: '1',
  category: { id: '1', name: 'Work', color: '#3B82F6' }
};

describe('ScheduleBlock', () => {
  it('renders block title', () => {
    render(<ScheduleBlock block={mockBlock} />);
    expect(screen.getByText('Test Block')).toBeInTheDocument();
  });

  it('displays correct time format', () => {
    render(<ScheduleBlock block={mockBlock} />);
    expect(screen.getByText('10:00 - 11:00')).toBeInTheDocument();
  });
});
```

### Ejemplo de Test de Hook

```typescript
// src/hooks/__tests__/useScheduleBlocks.test.ts
import { renderHook, act } from '@testing-library/react';
import { useScheduleBlocks } from '../useScheduleBlocks';

describe('useScheduleBlocks', () => {
  it('initializes with empty blocks', () => {
    const { result } = renderHook(() => useScheduleBlocks());
    expect(result.current.blocks).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('creates a new block', async () => {
    const { result } = renderHook(() => useScheduleBlocks());
    
    await act(async () => {
      await result.current.createBlock({
        title: 'New Block',
        startTime: new Date(),
        endTime: new Date(),
        categoryId: '1'
      });
    });

    expect(result.current.blocks).toHaveLength(1);
  });
});
```

## 🔍 Debugging

### Herramientas de Debug

```typescript
// Console logging con contexto
console.log('🔍 Debug:', { variable, context });

// React DevTools
// Instalar extensión del navegador

// Prisma Studio para base de datos
pnpm db:studio

// Next.js DevTools
// Incluido automáticamente en desarrollo
```

### Logging Estructurado

```typescript
// Crear logger personalizado
const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ℹ️ ${message}`, data);
    }
  },
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error);
  },
  debug: (message: string, data?: any) => {
    if (process.env.PRISMA_LOG_LEVEL === 'verbose') {
      console.log(`🔍 ${message}`, data);
    }
  }
};
```

## 📦 Build y Deployment

### Build Local

```bash
# Build de producción
pnpm build

# Verificar build
pnpm start

# Analizar bundle
pnpm build --analyze
```

### Optimizaciones de Performance

```typescript
// Lazy loading de componentes
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Memoización de componentes
const MemoizedComponent = memo(Component);

// Memoización de valores
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Callbacks memoizados
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency]);
```

### Variables de Entorno para Producción

```env
# .env.production
DATABASE_URL="postgresql://user:pass@host:port/db"
NODE_ENV="production"
PRISMA_LOG_LEVEL="error"
```

## 🤝 Contribución

### Flujo de Trabajo Git

```bash
# Crear rama para feature
git checkout -b feature/nueva-funcionalidad

# Commits descriptivos
git commit -m "feat: agregar validación de conflictos en tiempo real"

# Push y crear PR
git push origin feature/nueva-funcionalidad
```

### Convenciones de Commit

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: cambios de formato (no afectan lógica)
refactor: refactoring de código
test: agregar o modificar tests
chore: tareas de mantenimiento
```

### Code Review Checklist

- [ ] Código sigue convenciones del proyecto
- [ ] Tests incluidos para nueva funcionalidad
- [ ] Documentación actualizada
- [ ] No hay console.logs en producción
- [ ] Performance considerada
- [ ] Accesibilidad verificada
- [ ] Responsive design probado

## 🚀 Extensiones Futuras

### Funcionalidades Planificadas

- Autenticación de usuarios
- Colaboración en tiempo real
- Aplicación móvil (React Native)
- Integración con herramientas externas
- Analytics avanzados

### Arquitectura Escalable

```typescript
// Preparación para multi-tenancy
interface User {
  id: string;
  email: string;
  workspaces: Workspace[];
}

interface Workspace {
  id: string;
  name: string;
  users: User[];
  scheduleBlocks: ScheduleBlock[];
}
```

---

**¿Necesitas ayuda?** Consulta la documentación específica o crea un issue en el repositorio.
