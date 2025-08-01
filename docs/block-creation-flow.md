# Flujo de Creación de Bloques

Este documento describe el proceso completo de creación de bloques de horario en Planico, desde la apertura del formulario hasta la visualización final.

## 🔄 Flujo Completo

### 1. **Usuario Abre Formulario**
```
Trigger: Click en "Nuevo Bloque" o click en celda de la grilla
↓
Acción: Se abre el modal BlockForm
↓
Carga: Categorías disponibles y bloques existentes
```

**Componentes involucrados:**
- `BlockForm.tsx` - Modal principal
- `useCategories.ts` - Hook para cargar categorías
- `useScheduleBlocks.ts` - Hook para bloques existentes

**Estado inicial:**
```typescript
{
  isOpen: true,
  categories: Category[],
  existingBlocks: ScheduleBlock[],
  formData: {
    title: '',
    description: '',
    startTime: Date,
    endTime: Date,
    categoryId: ''
  }
}
```

### 2. **Usuario Llena Datos**
```
Input: Usuario ingresa título, descripción, horarios, categoría
↓
Validación: Validación en tiempo real con Zod
↓
Detección: Verificación automática de conflictos
```

**Validaciones aplicadas:**
- **Título**: Requerido, máximo 100 caracteres
- **Descripción**: Opcional, máximo 500 caracteres
- **Horarios**: Validación de formato y lógica temporal
- **Categoría**: Debe existir en la base de datos

**Código de validación:**
```typescript
const conflictResult = useMemo(() => {
  if (!formData.startTime || !formData.endTime || ignoreConflicts) {
    return { hasConflict: false, conflictingBlocks: [], suggestions: [] };
  }

  return ConflictChecker.checkForConflicts(
    { startTime: formData.startTime, endTime: formData.endTime },
    existingBlocks,
    block?.id
  );
}, [formData.startTime, formData.endTime, existingBlocks, block?.id, ignoreConflicts]);
```

### 3. **Si Hay Conflicto**
```
Detección: ConflictChecker identifica superposición
↓
Visualización: Se muestra ConflictWarning component
↓
Opciones: Sugerencias de horarios alternativos
```

**Componente ConflictWarning:**
- Lista bloques conflictivos con horarios
- Muestra sugerencias inteligentes
- Botón "Crear de todas formas" para ignorar

**Algoritmo de sugerencias:**
```typescript
private static generateSuggestions(
  newBlock: { startTime: Date; endTime: Date },
  conflictingBlocks: ScheduleBlock[]
): string[] {
  const suggestions: string[] = [];

  conflictingBlocks.forEach(conflict => {
    const conflictStart = new Date(conflict.startTime);
    const conflictEnd = new Date(conflict.endTime);

    // Sugerir antes del conflicto
    if (conflictStart > newBlock.startTime) {
      suggestions.push(
        `Mover antes de "${conflict.title}" (terminar a las ${format(conflictStart, 'HH:mm')})`
      );
    }

    // Sugerir después del conflicto
    if (conflictEnd < newBlock.endTime) {
      suggestions.push(
        `Mover después de "${conflict.title}" (comenzar a las ${format(conflictEnd, 'HH:mm')})`
      );
    }
  });

  return [...new Set(suggestions)];
}
```

### 4. **Usuario Puede Ignorar o Ajustar**
```
Opción A: Click en "Crear de todas formas"
├─ setIgnoreConflicts(true)
└─ Continúa con el envío

Opción B: Ajustar horarios según sugerencias
├─ Actualiza formData
├─ Re-ejecuta validación
└─ Conflicto se resuelve automáticamente
```

### 5. **Al Enviar - Verificación Final en Backend**
```
Frontend: handleSubmit() ejecutado
↓
Validación: Verificación final de conflictos
↓
API Call: POST /api/schedule
↓
Backend: Validación en servidor + creación en DB
```

**Flujo en el backend:**
```typescript
// src/app/api/schedule/route.ts
export const POST = withErrorHandling(async (request: NextRequest) => {
  // 1. Validar datos con Zod
  const validatedData = createBlockSchema.parse(data);

  // 2. Verificar que la categoría existe
  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  });

  // 3. Verificar conflictos en base de datos
  const overlappingBlocks = await prisma.scheduleBlock.findMany({
    where: {
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } }
      ]
    }
  });

  // 4. Crear el bloque si no hay conflictos
  const newBlock = await prisma.scheduleBlock.create({
    data: { title, description, startTime, endTime, categoryId },
    include: { category: true }
  });

  return ApiResponseHandler.created(newBlock);
});
```

### 6. **Si Éxito - Acciones Automáticas**
```
Creación exitosa en DB
↓
┌─ Notificación toast de éxito
├─ Programación de recordatorio (15 min antes)
├─ Actualización de métricas de productividad
├─ Actualización optimista de la UI
└─ Cierre automático del formulario
```

**Código de éxito:**
```typescript
const newBlock = await scheduleBlocks.createBlock(data, {
  onSuccess: (block) => {
    // 1. Programar recordatorio
    ReminderService.scheduleReminder(block, {
      minutesBefore: 15,
      enabled: true,
      type: 'notification'
    });

    // 2. Actualizar métricas
    const updatedMetrics = MetricsCalculator.updateMetricsAfterBlockCreation(metrics, block);
    setMetrics(updatedMetrics);

    // 3. Mostrar notificación
    toast.success(
      'Bloque creado exitosamente',
      `"${block.title}" ha sido agregado a tu calendario`
    );
  }
});
```

### 7. **Formulario se Cierra - Visualización Inmediata**
```
Estado del formulario se resetea
↓
Modal se cierra automáticamente
↓
Bloque aparece inmediatamente en la grilla (optimistic update)
↓
Métricas se actualizan en tiempo real
```

## 🔧 Componentes Técnicos

### Hooks Principales
- **`useScheduleBlocks`**: Gestión de estado de bloques
- **`useCategories`**: Carga de categorías
- **`useToast`**: Sistema de notificaciones
- **`useWeekGrid`**: Navegación semanal

### Servicios
- **`ConflictChecker`**: Detección de conflictos
- **`ReminderService`**: Gestión de recordatorios
- **`MetricsCalculator`**: Cálculo de métricas
- **`CalendarSyncService`**: Sincronización externa

### Validaciones
- **Frontend**: Zod schemas + validación en tiempo real
- **Backend**: Validación de datos + verificación de integridad
- **Base de datos**: Constraints y relaciones

## 🎯 Estados de Error

### Errores Manejados
1. **Conflicto de horario**: Warning visual, no bloquea creación
2. **Categoría inexistente**: Error de validación
3. **Datos inválidos**: Mensajes específicos por campo
4. **Error de red**: Retry automático + mensaje de error
5. **Error de base de datos**: Rollback automático

### Recuperación de Errores
- **Optimistic updates**: Revert automático en caso de error
- **Estado de carga**: Indicadores visuales durante operaciones
- **Mensajes claros**: Feedback específico para cada tipo de error

## 📊 Métricas y Monitoreo

### Eventos Trackeados
- Tiempo de creación de bloque
- Frecuencia de conflictos
- Uso de sugerencias automáticas
- Tasa de éxito/error

### Performance
- Validación debounced para evitar spam
- Lazy loading de componentes pesados
- Optimistic updates para UX fluida
- Cache inteligente de datos

---

**Próximos pasos**: Ver [Sistema de Conflictos](./conflict-detection.md) para detalles sobre la detección de conflictos.