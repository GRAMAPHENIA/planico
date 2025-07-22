# Design Document - Planico Weekly Planner Core

## Overview

Planico es una aplicación de planificación semanal construida con Next.js 15 (App Router), que permite a los usuarios gestionar visualmente sus horarios mediante una grilla interactiva. El diseño prioriza la performance, escalabilidad y experiencia de usuario moderna.

### Stack Tecnológico
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: TailwindCSS v4, ShadCN/UI
- **Base de Datos**: Prisma + SQLite
- **Package Manager**: pnpm
- **Estado**: React Server Components + Client Components híbrido

## Architecture

### Arquitectura General
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Side   │    │   Server Side   │    │   Database      │
│                 │    │                 │    │                 │
│ • React Components │◄──► • API Routes    │◄──► • SQLite        │
│ • Custom Hooks  │    │ • Server Actions│    │ • Prisma ORM    │
│ • State Management │  │ • RSC           │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Estructura de Carpetas
```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx                 # Página principal con grilla
│   │   └── layout.tsx               # Layout del dashboard
│   ├── api/
│   │   └── schedule/
│   │       ├── route.ts             # CRUD de bloques
│   │       └── [id]/route.ts        # Operaciones específicas
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                          # ShadCN/UI components
│   ├── schedule/
│   │   ├── WeekGrid.tsx             # Grilla principal
│   │   ├── ScheduleBlock.tsx        # Bloque individual
│   │   ├── BlockForm.tsx            # Formulario crear/editar
│   │   └── WeekNavigation.tsx       # Navegación entre semanas
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── hooks/
│   ├── useScheduleBlocks.ts         # Gestión de bloques
│   ├── useWeekGrid.ts               # Lógica de grilla
│   └── useLocalStorage.ts           # Persistencia local
├── lib/
│   ├── prisma.ts                    # Cliente Prisma
│   ├── utils.ts                     # Utilidades generales
│   ├── validations.ts               # Esquemas Zod
│   └── types.ts                     # Tipos TypeScript
├── actions/
│   ├── schedule-actions.ts          # Server Actions
│   └── week-actions.ts
└── prisma/
    ├── schema.prisma
    └── migrations/
```

## Components and Interfaces

### Core Components

#### 1. WeekGrid Component
```typescript
interface WeekGridProps {
  weekStart: Date;
  blocks: ScheduleBlock[];
  onBlockCreate: (timeSlot: TimeSlot) => void;
  onBlockEdit: (block: ScheduleBlock) => void;
  onBlockDelete: (blockId: string) => void;
}
```

**Responsabilidades:**
- Renderizar grilla de 7x48 (días x slots de 30min)
- Manejar eventos de click para crear bloques
- Mostrar bloques existentes en posiciones correctas
- Responsive design para móvil/desktop

#### 2. ScheduleBlock Component
```typescript
interface ScheduleBlockProps {
  block: ScheduleBlock;
  gridPosition: GridPosition;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}
```

**Responsabilidades:**
- Mostrar información del bloque (título, tiempo, categoría)
- Manejar interacciones (click, hover)
- Aplicar estilos según categoría/color
- Animaciones de transición

#### 3. BlockForm Component
```typescript
interface BlockFormProps {
  block?: ScheduleBlock;
  initialTimeSlot?: TimeSlot;
  onSave: (data: BlockFormData) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}
```

**Responsabilidades:**
- Formulario para crear/editar bloques
- Validación en tiempo real
- Selector de categorías y colores
- Manejo de estados de loading/error

### Custom Hooks

#### 1. useScheduleBlocks
```typescript
interface UseScheduleBlocksReturn {
  blocks: ScheduleBlock[];
  isLoading: boolean;
  error: string | null;
  createBlock: (data: CreateBlockData) => Promise<void>;
  updateBlock: (id: string, data: UpdateBlockData) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}
```

#### 2. useWeekGrid
```typescript
interface UseWeekGridReturn {
  currentWeek: Date;
  weekDays: Date[];
  timeSlots: TimeSlot[];
  navigateWeek: (direction: 'prev' | 'next') => void;
  goToWeek: (date: Date) => void;
  getBlockPosition: (block: ScheduleBlock) => GridPosition;
}
```

## Data Models

### Prisma Schema
```prisma
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

model Category {
  id     String @id @default(cuid())
  name   String @unique
  color  String // Hex color code
  blocks ScheduleBlock[]
  
  @@map("categories")
}
```

### TypeScript Types
```typescript
interface ScheduleBlock {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  category: Category;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface TimeSlot {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  minute: number; // 0 or 30
}

interface GridPosition {
  column: number; // 1-7
  row: number; // 1-48
  span: number; // Duración en slots de 30min
}
```

## Error Handling

### Client-Side Error Handling
- **React Error Boundaries** para capturar errores de componentes
- **Try-catch blocks** en hooks para operaciones async
- **Toast notifications** para errores de usuario
- **Fallback UI** para estados de error

### Server-Side Error Handling
```typescript
// API Routes error handling
export async function POST(request: Request) {
  try {
    // Logic here
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Database Error Handling
- **Prisma error mapping** para errores específicos
- **Connection retry logic** para fallos de conexión
- **Transaction rollback** para operaciones complejas

## Testing Strategy

### Unit Testing
- **Components**: Testing Library + Jest
- **Hooks**: React Hooks Testing Library
- **Utilities**: Jest para funciones puras
- **API Routes**: Supertest para endpoints

### Integration Testing
- **Database operations**: Test database con Prisma
- **API workflows**: End-to-end API testing
- **Component integration**: Testing de flujos completos

### E2E Testing (Futuro)
- **Playwright** para testing de usuario final
- **Critical paths**: Crear, editar, eliminar bloques
- **Responsive testing**: Diferentes tamaños de pantalla

## Performance Considerations

### Optimizaciones de Rendering
- **React.memo** para componentes que no cambian frecuentemente
- **useMemo/useCallback** para cálculos costosos
- **Virtualization** para grillas grandes (futuro)
- **Lazy loading** para componentes pesados

### Database Optimizations
- **Indexing** en campos de fecha para queries rápidas
- **Pagination** para cargar semanas específicas
- **Caching** con React Query o SWR (futuro)

### Bundle Optimization
- **Tree shaking** automático con Next.js
- **Code splitting** por rutas
- **Dynamic imports** para componentes opcionales

## Security Considerations

### Data Validation
- **Zod schemas** para validación de entrada
- **Sanitización** de datos de usuario
- **Rate limiting** en API routes (futuro)

### Client-Side Security
- **XSS prevention** con sanitización
- **CSRF protection** con Next.js tokens
- **Input validation** en formularios

## Deployment Strategy

### Development
```bash
pnpm dev          # Desarrollo con Turbopack
pnpm db:push      # Sync schema con DB
pnpm db:studio    # Prisma Studio
```

### Production
```bash
pnpm build        # Build optimizado
pnpm start        # Servidor de producción
pnpm db:migrate   # Migraciones en prod
```

### Environment Variables
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```