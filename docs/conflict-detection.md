# Sistema de Detección de Conflictos

El sistema de detección de conflictos de Planico previene superposiciones de horarios y ofrece sugerencias inteligentes para resolverlos.

## 🎯 Objetivos del Sistema

1. **Prevención proactiva** de conflictos durante la creación/edición
2. **Sugerencias inteligentes** de horarios alternativos
3. **Flexibilidad** para casos especiales donde se permiten conflictos
4. **Experiencia fluida** sin interrumpir el flujo de trabajo

## 🔍 Algoritmo de Detección

### Lógica Principal
```typescript
export class ConflictChecker {
  static checkForConflicts(
    newBlock: { startTime: Date; endTime: Date },
    existingBlocks: ScheduleBlock[],
    excludeBlockId?: string
  ): ConflictResult {
    const conflictingBlocks = existingBlocks.filter(block => {
      // Excluir el bloque que se está editando
      if (excludeBlockId && block.id === excludeBlockId) {
        return false;
      }

      // Verificar superposición usando date-fns
      return areIntervalsOverlapping(
        { start: newBlock.startTime, end: newBlock.endTime },
        { start: new Date(block.startTime), end: new Date(block.endTime) },
        { inclusive: false } // No considerar toques como superposición
      );
    });

    return {
      hasConflict: conflictingBlocks.length > 0,
      conflictingBlocks,
      suggestions: this.generateSuggestions(newBlock, conflictingBlocks)
    };
  }
}
```

### Casos de Superposición
```
Caso 1: Superposición parcial al inicio
Existente:    |-------|
Nuevo:     |-------|
Resultado: CONFLICTO

Caso 2: Superposición parcial al final  
Existente: |-------|
Nuevo:        |-------|
Resultado: CONFLICTO

Caso 3: Superposición total
Existente: |-------|
Nuevo:       |---|
Resultado: CONFLICTO

Caso 4: Bloques adyacentes (NO conflicto)
Existente: |-------|
Nuevo:             |-------|
Resultado: OK
```

## 🧠 Sistema de Sugerencias

### Algoritmo de Sugerencias
```typescript
private static generateSuggestions(
  newBlock: { startTime: Date; endTime: Date },
  conflictingBlocks: ScheduleBlock[]
): string[] {
  const suggestions: string[] = [];

  conflictingBlocks.forEach(conflict => {
    const conflictStart = new Date(conflict.startTime);
    const conflictEnd = new Date(conflict.endTime);

    // Sugerencia: Mover antes del conflicto
    if (conflictStart > newBlock.startTime) {
      const suggestedEndTime = format(conflictStart, 'HH:mm');
      suggestions.push(
        `Mover antes de "${conflict.title}" (terminar a las ${suggestedEndTime})`
      );
    }

    // Sugerencia: Mover después del conflicto
    if (conflictEnd < newBlock.endTime) {
      const suggestedStartTime = format(conflictEnd, 'HH:mm');
      suggestions.push(
        `Mover después de "${conflict.title}" (comenzar a las ${suggestedStartTime})`
      );
    }
  });

  // Eliminar duplicados
  return [...new Set(suggestions)];
}
```

### Búsqueda de Slots Disponibles
```typescript
static findNextAvailableSlot(
  duration: number, // en minutos
  preferredStart: Date,
  existingBlocks: ScheduleBlock[],
  workingHours: { start: number; end: number } = { start: 8, end: 18 }
): Date | null {
  const sortedBlocks = [...existingBlocks].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  let currentTime = new Date(preferredStart);
  
  // Asegurar que empezamos dentro del horario laboral
  if (currentTime.getHours() < workingHours.start) {
    currentTime.setHours(workingHours.start, 0, 0, 0);
  }

  for (const block of sortedBlocks) {
    const blockStart = new Date(block.startTime);
    const proposedEnd = new Date(currentTime.getTime() + duration * 60000);

    // Verificar si cabe antes de este bloque
    if (proposedEnd <= blockStart) {
      return currentTime;
    }

    // Mover después de este bloque
    currentTime = new Date(block.endTime);
  }

  // Verificar si cabe después de todos los bloques
  const proposedEnd = new Date(currentTime.getTime() + duration * 60000);
  if (proposedEnd.getHours() <= workingHours.end) {
    return currentTime;
  }

  return null; // No hay slot disponible
}
```

## 🎨 Componente Visual

### ConflictWarning Component
```typescript
interface ConflictWarningProps {
  conflictResult: ConflictResult;
  onIgnore?: () => void;
  onSuggestTime?: (suggestion: string) => void;
}

export function ConflictWarning({ 
  conflictResult, 
  onIgnore, 
  onSuggestTime 
}: ConflictWarningProps) {
  if (!conflictResult.hasConflict) return null;

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <div className="p-4">
        {/* Icono de advertencia */}
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
        
        {/* Lista de conflictos */}
        {conflictResult.conflictingBlocks.map(block => (
          <ConflictItem key={block.id} block={block} />
        ))}
        
        {/* Sugerencias */}
        {conflictResult.suggestions.map(suggestion => (
          <SuggestionButton 
            key={suggestion}
            suggestion={suggestion}
            onClick={() => onSuggestTime?.(suggestion)}
          />
        ))}
        
        {/* Acción de ignorar */}
        <Button onClick={onIgnore}>
          Crear de todas formas
        </Button>
      </div>
    </Card>
  );
}
```

### Estados Visuales
1. **Sin conflicto**: No se muestra nada
2. **Conflicto detectado**: Card amarillo con advertencia
3. **Múltiples conflictos**: Lista expandible
4. **Con sugerencias**: Botones clickeables para aplicar

## ⚡ Validación en Tiempo Real

### Frontend - Validación Inmediata
```typescript
// En BlockForm.tsx
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

### Backend - Validación Final
```typescript
// En /api/schedule/route.ts
const overlappingBlocks = await prisma.scheduleBlock.findMany({
  where: {
    AND: [
      { startTime: { lt: endTime } },
      { endTime: { gt: startTime } }
    ]
  },
  select: {
    id: true,
    title: true,
    startTime: true,
    endTime: true
  }
});

if (overlappingBlocks.length > 0) {
  return NextResponse.json({
    error: 'El bloque se superpone con otro bloque existente',
    details: { conflictingBlocks: overlappingBlocks },
    code: 'SCHEDULE_CONFLICT'
  }, { status: 409 });
}
```

## 🔄 Flujo de Resolución

### Proceso Paso a Paso
```
1. Usuario modifica horarios en el formulario
   ↓
2. useMemo detecta cambio y ejecuta ConflictChecker
   ↓
3. Si hay conflicto:
   ├─ Se muestra ConflictWarning
   ├─ Se generan sugerencias automáticas
   └─ Submit se bloquea hasta resolución
   ↓
4. Usuario puede:
   ├─ Ajustar horarios manualmente
   ├─ Aplicar una sugerencia automática
   └─ Ignorar conflicto y continuar
   ↓
5. Al resolver conflicto:
   ├─ Warning desaparece automáticamente
   └─ Submit se habilita nuevamente
```

### Manejo de Estados
```typescript
const [ignoreConflicts, setIgnoreConflicts] = useState(false);

// En handleSubmit
if (conflictResult.hasConflict && !ignoreConflicts) {
  // No enviar, mostrar warning
  return;
}

// Continuar con envío normal
await onSave(formData);
```

## 🎛️ Configuración

### Horarios de Trabajo
```typescript
// En conflict-checker.ts
const DEFAULT_WORKING_HOURS = {
  start: 8,  // 8:00 AM
  end: 18    // 6:00 PM
};

// Personalizable por usuario (futuro)
interface UserPreferences {
  workingHours: {
    start: number;
    end: number;
  };
  allowOverlaps: boolean;
  bufferMinutes: number; // Tiempo mínimo entre bloques
}
```

### Tipos de Conflicto
```typescript
enum ConflictSeverity {
  WARNING = 'warning',    // Superposición menor
  ERROR = 'error',        // Superposición total
  INFO = 'info'          // Bloques muy cercanos
}

interface ConflictResult {
  hasConflict: boolean;
  severity: ConflictSeverity;
  conflictingBlocks: ScheduleBlock[];
  suggestions: string[];
  canIgnore: boolean;
}
```

## 📊 Métricas de Conflictos

### Datos Recopilados
- Frecuencia de conflictos por usuario
- Tipos de conflicto más comunes
- Efectividad de sugerencias automáticas
- Tiempo promedio de resolución

### Análisis de Patrones
```typescript
interface ConflictMetrics {
  totalConflicts: number;
  resolvedAutomatically: number;
  ignoredByUser: number;
  averageResolutionTime: number;
  commonConflictTimes: string[]; // Horarios más problemáticos
}
```

## 🚀 Optimizaciones

### Performance
- **Debouncing**: Validación con retraso para evitar spam
- **Memoización**: Cache de resultados de conflictos
- **Lazy loading**: Carga diferida de bloques lejanos

### UX Improvements
- **Sugerencias inteligentes**: Basadas en patrones del usuario
- **Auto-resolución**: Ajuste automático de horarios menores
- **Feedback visual**: Indicadores claros de estado

---

**Próximos pasos**: Ver [Métricas y Productividad](./metrics-system.md) para el sistema de análisis.