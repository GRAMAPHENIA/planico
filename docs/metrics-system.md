# Sistema de Métricas y Productividad

El sistema de métricas de Planico proporciona análisis en tiempo real del uso del tiempo y patrones de productividad del usuario.

## 📊 Tipos de Métricas

### Métricas Básicas
```typescript
interface ProductivityMetrics {
  totalBlocks: number;           // Número total de bloques
  totalMinutes: number;          // Tiempo total planificado
  averageBlockDuration: number;  // Duración promedio por bloque
  weeklyProgress: {
    planned: number;             // Bloques planificados
    completed: number;           // Bloques completados
    efficiency: number;          // Porcentaje de eficiencia
  };
}
```

### Desglose por Categorías
```typescript
categoryBreakdown: Record<string, {
  name: string;        // Nombre de la categoría
  color: string;       // Color asignado
  blocks: number;      // Cantidad de bloques
  minutes: number;     // Tiempo total en minutos
  percentage: number;  // Porcentaje del tiempo total
}>;
```

## 🧮 Algoritmos de Cálculo

### Cálculo de Métricas Semanales
```typescript
export class MetricsCalculator {
  static calculateWeeklyMetrics(
    blocks: ScheduleBlock[], 
    weekDate: Date = new Date()
  ): ProductivityMetrics {
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(weekDate, { weekStartsOn: 0 });

    // Filtrar bloques de la semana actual
    const weekBlocks = blocks.filter(block => 
      isWithinInterval(new Date(block.startTime), { 
        start: weekStart, 
        end: weekEnd 
      })
    );

    // Cálculos básicos
    const totalBlocks = weekBlocks.length;
    const totalMinutes = weekBlocks.reduce((sum, block) => 
      sum + differenceInMinutes(
        new Date(block.endTime), 
        new Date(block.startTime)
      ), 0
    );

    const averageBlockDuration = totalBlocks > 0 
      ? totalMinutes / totalBlocks 
      : 0;

    // Desglose por categorías
    const categoryBreakdown = this.calculateCategoryBreakdown(
      weekBlocks, 
      totalMinutes
    );

    // Progreso semanal
    const weeklyProgress = this.calculateWeeklyProgress(weekBlocks);

    return {
      totalBlocks,
      totalMinutes,
      averageBlockDuration,
      categoryBreakdown,
      weeklyProgress
    };
  }
}
```

### Desglose por Categorías
```typescript
private static calculateCategoryBreakdown(
  blocks: ScheduleBlock[],
  totalMinutes: number
): Record<string, CategoryMetrics> {
  const categoryMap = new Map<string, {
    name: string;
    color: string;
    blocks: number;
    minutes: number;
  }>();

  // Agrupar por categoría
  blocks.forEach(block => {
    const categoryId = block.categoryId;
    const duration = differenceInMinutes(
      new Date(block.endTime), 
      new Date(block.startTime)
    );
    
    if (categoryMap.has(categoryId)) {
      const existing = categoryMap.get(categoryId)!;
      existing.blocks += 1;
      existing.minutes += duration;
    } else {
      categoryMap.set(categoryId, {
        name: block.category.name,
        color: block.category.color,
        blocks: 1,
        minutes: duration,
      });
    }
  });

  // Calcular porcentajes
  const categoryBreakdown: Record<string, CategoryMetrics> = {};
  categoryMap.forEach((data, categoryId) => {
    categoryBreakdown[categoryId] = {
      ...data,
      percentage: totalMinutes > 0 
        ? (data.minutes / totalMinutes) * 100 
        : 0,
    };
  });

  return categoryBreakdown;
}
```

### Actualización Incremental
```typescript
static updateMetricsAfterBlockCreation(
  currentMetrics: ProductivityMetrics,
  newBlock: ScheduleBlock
): ProductivityMetrics {
  const blockDuration = differenceInMinutes(
    new Date(newBlock.endTime), 
    new Date(newBlock.startTime)
  );

  const updatedMetrics = { ...currentMetrics };
  
  // Actualizar totales
  updatedMetrics.totalBlocks += 1;
  updatedMetrics.totalMinutes += blockDuration;
  updatedMetrics.averageBlockDuration = 
    updatedMetrics.totalMinutes / updatedMetrics.totalBlocks;

  // Actualizar categoría
  const categoryId = newBlock.categoryId;
  if (updatedMetrics.categoryBreakdown[categoryId]) {
    updatedMetrics.categoryBreakdown[categoryId].blocks += 1;
    updatedMetrics.categoryBreakdown[categoryId].minutes += blockDuration;
  } else {
    updatedMetrics.categoryBreakdown[categoryId] = {
      name: newBlock.category.name,
      color: newBlock.category.color,
      blocks: 1,
      minutes: blockDuration,
      percentage: 0,
    };
  }

  // Recalcular porcentajes
  Object.keys(updatedMetrics.categoryBreakdown).forEach(catId => {
    updatedMetrics.categoryBreakdown[catId].percentage = 
      (updatedMetrics.categoryBreakdown[catId].minutes / 
       updatedMetrics.totalMinutes) * 100;
  });

  return updatedMetrics;
}
```

## 📈 Visualización de Métricas

### Componente Principal
```typescript
// En page.tsx
{currentWeekBlocks.length > 0 && (
  <Card className="p-6">
    <h3 className="text-lg font-semibold mb-4">
      Métricas de Productividad
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        value={metrics.totalBlocks}
        label="Bloques Totales"
        icon={<Calendar />}
      />
      <MetricCard
        value={`${Math.round(metrics.totalMinutes / 60)}h`}
        label="Tiempo Total"
        icon={<Clock />}
      />
      <MetricCard
        value={`${Math.round(metrics.averageBlockDuration)}m`}
        label="Duración Promedio"
        icon={<BarChart />}
      />
      <MetricCard
        value={`${metrics.weeklyProgress.efficiency}%`}
        label="Eficiencia"
        icon={<TrendingUp />}
      />
    </div>
  </Card>
)}
```

### Gráfico de Categorías
```typescript
function CategoryBreakdownChart({ categoryBreakdown }: Props) {
  return (
    <div className="space-y-3">
      {Object.entries(categoryBreakdown).map(([id, category]) => (
        <div key={id} className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <div className="flex-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{category.name}</span>
              <span className="text-muted-foreground">
                {Math.round(category.percentage)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: category.color,
                  width: `${category.percentage}%`
                }}
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {Math.round(category.minutes / 60)}h
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 🎯 Métricas Avanzadas

### Análisis de Patrones Temporales
```typescript
interface TimePatternAnalysis {
  peakHours: number[];           // Horas más productivas
  preferredDuration: number;     // Duración preferida de bloques
  categoryTrends: {
    [categoryId: string]: {
      preferredTimes: number[];  // Horarios preferidos por categoría
      averageDuration: number;   // Duración promedio por categoría
    };
  };
}

static analyzeTimePatterns(blocks: ScheduleBlock[]): TimePatternAnalysis {
  const hourCounts = new Array(24).fill(0);
  const durations: number[] = [];
  const categoryTimes: Record<string, number[]> = {};

  blocks.forEach(block => {
    const startHour = new Date(block.startTime).getHours();
    const duration = differenceInMinutes(
      new Date(block.endTime),
      new Date(block.startTime)
    );

    hourCounts[startHour]++;
    durations.push(duration);

    if (!categoryTimes[block.categoryId]) {
      categoryTimes[block.categoryId] = [];
    }
    categoryTimes[block.categoryId].push(startHour);
  });

  // Encontrar horas pico (top 3)
  const peakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(item => item.hour);

  // Duración preferida (mediana)
  const sortedDurations = durations.sort((a, b) => a - b);
  const preferredDuration = sortedDurations[
    Math.floor(sortedDurations.length / 2)
  ];

  return {
    peakHours,
    preferredDuration,
    categoryTrends: this.analyzeCategoryTrends(blocks)
  };
}
```

### Métricas de Eficiencia
```typescript
interface EfficiencyMetrics {
  planningAccuracy: number;      // % de bloques completados a tiempo
  timeUtilization: number;       // % del tiempo disponible utilizado
  focusScore: number;           // Puntuación de concentración
  consistencyScore: number;     // Consistencia en horarios
}

static calculateEfficiencyMetrics(
  blocks: ScheduleBlock[],
  completedBlocks: string[] = []
): EfficiencyMetrics {
  const totalBlocks = blocks.length;
  const completedCount = completedBlocks.length;
  
  const planningAccuracy = totalBlocks > 0 
    ? (completedCount / totalBlocks) * 100 
    : 0;

  // Calcular utilización de tiempo (8 horas laborales = 480 minutos)
  const totalPlannedMinutes = blocks.reduce((sum, block) => 
    sum + differenceInMinutes(
      new Date(block.endTime),
      new Date(block.startTime)
    ), 0
  );
  
  const timeUtilization = (totalPlannedMinutes / 480) * 100;

  // Focus Score basado en duración promedio de bloques
  const averageDuration = totalPlannedMinutes / totalBlocks;
  const focusScore = Math.min((averageDuration / 60) * 100, 100);

  // Consistency Score basado en regularidad de horarios
  const consistencyScore = this.calculateConsistencyScore(blocks);

  return {
    planningAccuracy,
    timeUtilization: Math.min(timeUtilization, 100),
    focusScore,
    consistencyScore
  };
}
```

## 🔄 Actualización en Tiempo Real

### Hook de Métricas
```typescript
// En page.tsx
const [metrics, setMetrics] = useState(() => 
  MetricsCalculator.calculateWeeklyMetrics(
    scheduleBlocks.blocks, 
    weekGrid.currentWeek
  )
);

// Actualizar cuando cambien los bloques
useEffect(() => {
  const updatedMetrics = MetricsCalculator.calculateWeeklyMetrics(
    scheduleBlocks.blocks, 
    weekGrid.currentWeek
  );
  setMetrics(updatedMetrics);
}, [scheduleBlocks.blocks, weekGrid.currentWeek]);
```

### Optimización de Performance
```typescript
// Actualización incremental para operaciones frecuentes
const handleBlockCreation = useCallback(async (data: BlockFormData) => {
  try {
    const newBlock = await scheduleBlocks.createBlock(data, {
      onSuccess: (block) => {
        // Actualización incremental más eficiente
        const updatedMetrics = MetricsCalculator.updateMetricsAfterBlockCreation(
          metrics, 
          block
        );
        setMetrics(updatedMetrics);
      }
    });
  } catch (error) {
    // Manejo de errores
  }
}, [metrics, scheduleBlocks]);
```

## 📊 Exportación de Métricas

### Formato de Exportación
```typescript
interface MetricsExport {
  period: {
    start: string;
    end: string;
    type: 'week' | 'month' | 'quarter';
  };
  summary: ProductivityMetrics;
  detailed: {
    dailyBreakdown: DailyMetrics[];
    categoryAnalysis: CategoryAnalysis[];
    timePatterns: TimePatternAnalysis;
    efficiency: EfficiencyMetrics;
  };
  insights: string[];
}

// Generar insights automáticos
static generateInsights(metrics: ProductivityMetrics): string[] {
  const insights: string[] = [];

  // Análisis de tiempo total
  if (metrics.totalMinutes > 2400) { // > 40 horas
    insights.push("⚠️ Estás planificando más de 40 horas semanales. Considera reducir la carga.");
  }

  // Análisis de duración promedio
  if (metrics.averageBlockDuration < 30) {
    insights.push("💡 Tus bloques son muy cortos. Considera agrupar tareas similares.");
  }

  // Análisis de categorías
  const topCategory = Object.values(metrics.categoryBreakdown)
    .sort((a, b) => b.percentage - a.percentage)[0];
  
  if (topCategory && topCategory.percentage > 60) {
    insights.push(`📊 ${topCategory.name} ocupa ${Math.round(topCategory.percentage)}% de tu tiempo. ¿Es intencional?`);
  }

  return insights;
}
```

## 🎨 Componentes de Visualización

### MetricCard Component
```typescript
interface MetricCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

function MetricCard({ value, label, icon, trend, trendValue }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-primary">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
        {icon && (
          <div className="text-muted-foreground">{icon}</div>
        )}
      </div>
      {trend && trendValue && (
        <div className={`text-xs mt-2 flex items-center gap-1 ${
          trend === 'up' ? 'text-green-600' : 
          trend === 'down' ? 'text-red-600' : 
          'text-gray-600'
        }`}>
          <TrendIcon trend={trend} />
          {trendValue}% vs semana anterior
        </div>
      )}
    </Card>
  );
}
```

## 🚀 Futuras Mejoras

### Métricas Predictivas
- Predicción de carga de trabajo
- Sugerencias de optimización automática
- Detección de patrones de burnout

### Integración con Datos Externos
- Sincronización con calendarios externos
- Importación de datos de productividad
- Análisis comparativo con benchmarks

### Gamificación
- Sistema de puntos y logros
- Desafíos semanales de productividad
- Comparación con otros usuarios (anónima)

---

**Próximos pasos**: Ver [Sincronización de Calendarios](./calendar-sync.md) para integración externa.