# Sincronización de Calendarios

El sistema de sincronización de Planico permite exportar e integrar bloques de horario con calendarios externos como Google Calendar, Outlook y aplicaciones compatibles con .ICS.

## 🎯 Funcionalidades de Sincronización

### Formatos Soportados
1. **Google Calendar** - URL directa para agregar eventos
2. **Outlook Calendar** - URL directa para Outlook Web/Desktop
3. **Archivo .ICS** - Estándar universal para calendarios
4. **Futuro**: Sincronización bidireccional con APIs

## 📅 Generación de Archivos ICS

### Estructura del Archivo ICS
```typescript
export class CalendarSyncService {
  static generateICSFile(blocks: ScheduleBlock[]): string {
    const icsHeader = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Planico//Planico Calendar//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ].join('\r\n');

    const icsFooter = 'END:VCALENDAR';

    const events = blocks
      .map(block => this.blockToICSEvent(block))
      .join('\r\n');

    return [icsHeader, events, icsFooter].join('\r\n');
  }
}
```

### Conversión de Bloque a Evento ICS
```typescript
private static blockToICSEvent(block: ScheduleBlock): string {
  const startTime = this.formatDateForICS(new Date(block.startTime));
  const endTime = this.formatDateForICS(new Date(block.endTime));
  const uid = `${block.id}@planico.app`;
  const timestamp = this.formatDateForICS(new Date());

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${this.escapeICSText(block.title)}`,
    block.description ? `DESCRIPTION:${this.escapeICSText(block.description)}` : '',
    `CATEGORIES:${this.escapeICSText(block.category.name)}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
  ].filter(Boolean).join('\r\n');
}
```

### Formateo de Fechas
```typescript
private static formatDateForICS(date: Date): string {
  // Formato: YYYYMMDDTHHMMSSZ
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}

private static escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')    // Escapar backslashes
    .replace(/;/g, '\\;')      // Escapar punto y coma
    .replace(/,/g, '\\,')      // Escapar comas
    .replace(/\n/g, '\\n');    // Escapar saltos de línea
}
```

## 🔗 Integración con Google Calendar

### Generación de URL
```typescript
static generateGoogleCalendarURL(block: ScheduleBlock): string {
  const baseURL = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: block.title,
    dates: `${this.formatDateForGoogle(new Date(block.startTime))}/${this.formatDateForGoogle(new Date(block.endTime))}`,
    details: block.description || '',
    location: '', // Futuro: agregar ubicación
  });

  return `${baseURL}?${params.toString()}`;
}

private static formatDateForGoogle(date: Date): string {
  // Google Calendar usa formato: YYYYMMDDTHHMMSSZ
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}
```

### Ejemplo de URL Generada
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=Reuni%C3%B3n%20de%20equipo&dates=20241201T140000Z/20241201T150000Z&details=Revisi%C3%B3n%20semanal%20del%20proyecto
```

## 📧 Integración con Outlook

### Generación de URL para Outlook
```typescript
static generateOutlookCalendarURL(block: ScheduleBlock): string {
  const baseURL = 'https://outlook.live.com/calendar/0/deeplink/compose';
  const params = new URLSearchParams({
    subject: block.title,
    startdt: new Date(block.startTime).toISOString(),
    enddt: new Date(block.endTime).toISOString(),
    body: block.description || '',
    location: '', // Futuro: agregar ubicación
  });

  return `${baseURL}?${params.toString()}`;
}
```

### Soporte para Outlook Desktop
```typescript
// Para Outlook Desktop (protocolo outlook://)
static generateOutlookDesktopURL(block: ScheduleBlock): string {
  const startTime = new Date(block.startTime).toISOString();
  const endTime = new Date(block.endTime).toISOString();
  
  return `outlook://calendar/new?subject=${encodeURIComponent(block.title)}&starttime=${startTime}&endtime=${endTime}&body=${encodeURIComponent(block.description || '')}`;
}
```

## 💾 Descarga de Archivos

### Función de Descarga
```typescript
static downloadICSFile(
  blocks: ScheduleBlock[], 
  filename: string = 'planico-calendar.ics'
): void {
  const icsContent = this.generateICSFile(blocks);
  const blob = new Blob([icsContent], { 
    type: 'text/calendar;charset=utf-8' 
  });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### Nombres de Archivo Inteligentes
```typescript
static generateFileName(blocks: ScheduleBlock[]): string {
  if (blocks.length === 0) return 'planico-calendar.ics';
  
  if (blocks.length === 1) {
    const block = blocks[0];
    const safeName = block.title
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    return `${safeName}.ics`;
  }
  
  // Para múltiples bloques, usar rango de fechas
  const dates = blocks.map(b => new Date(b.startTime)).sort();
  const startDate = format(dates[0], 'yyyy-MM-dd');
  const endDate = format(dates[dates.length - 1], 'yyyy-MM-dd');
  
  return `planico_${startDate}_to_${endDate}.ics`;
}
```

## 🎨 Interfaz de Usuario

### Componente de Exportación
```typescript
// En page.tsx
{currentWeekBlocks.length > 0 && (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium text-foreground">Exportar Calendario</h3>
        <p className="text-sm text-muted-foreground">
          Sincroniza tus bloques con calendarios externos
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportCalendar('google')}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Google
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportCalendar('outlook')}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Outlook
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportCalendar('ics')}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          .ICS
        </Button>
      </div>
    </div>
  </Card>
)}
```

### Función de Manejo de Exportación
```typescript
const handleExportCalendar = useCallback((format: 'google' | 'outlook' | 'ics') => {
  if (scheduleBlocks.blocks.length === 0) {
    toast.warning('Sin bloques para exportar', 'No hay bloques en la semana actual');
    return;
  }

  try {
    if (format === 'ics') {
      CalendarSyncService.downloadICSFile(scheduleBlocks.blocks);
      toast.success('Calendario exportado', 'El archivo .ics se ha descargado correctamente');
    } else {
      // Para Google/Outlook, abrir cada evento individualmente
      scheduleBlocks.blocks.forEach(block => {
        CalendarSyncService.syncBlockToExternalCalendar(block, format);
      });
      toast.info('Abriendo calendario externo', `Se abrirán ${scheduleBlocks.blocks.length} eventos en ${format}`);
    }
  } catch (error) {
    toast.error('Error al exportar', 'No se pudo exportar el calendario');
    console.error('Export error:', error);
  }
}, [scheduleBlocks.blocks, toast]);
```

## 🔄 Sincronización Automática

### Configuración de Auto-Sync
```typescript
interface SyncSettings {
  enabled: boolean;
  provider: 'google' | 'outlook' | 'ics';
  frequency: 'immediate' | 'hourly' | 'daily';
  syncDirection: 'export' | 'import' | 'bidirectional';
}

// Futuro: Configuración por usuario
const [syncSettings, setSyncSettings] = useState<SyncSettings>({
  enabled: false,
  provider: 'google',
  frequency: 'immediate',
  syncDirection: 'export'
});
```

### Hook de Auto-Sync
```typescript
// Futuro: Hook para sincronización automática
function useAutoSync(settings: SyncSettings) {
  const { blocks } = useScheduleBlocks();
  
  useEffect(() => {
    if (!settings.enabled) return;
    
    const syncBlocks = async () => {
      try {
        await CalendarSyncService.syncToProvider(blocks, settings.provider);
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    };
    
    if (settings.frequency === 'immediate') {
      syncBlocks();
    } else {
      const interval = settings.frequency === 'hourly' ? 3600000 : 86400000;
      const timer = setInterval(syncBlocks, interval);
      return () => clearInterval(timer);
    }
  }, [blocks, settings]);
}
```

## 📱 Soporte Multi-Plataforma

### Detección de Plataforma
```typescript
static detectPlatform(): 'ios' | 'android' | 'desktop' {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  return 'desktop';
}

static getOptimalSyncMethod(platform: string): string[] {
  switch (platform) {
    case 'ios':
      return ['ics', 'google', 'outlook'];
    case 'android':
      return ['google', 'ics', 'outlook'];
    default:
      return ['google', 'outlook', 'ics'];
  }
}
```

### URLs Específicas por Plataforma
```typescript
static generatePlatformSpecificURL(
  block: ScheduleBlock, 
  provider: string, 
  platform: string
): string {
  if (platform === 'ios' && provider === 'google') {
    // iOS Google Calendar app
    return this.generateGoogleCalendarURL(block)
      .replace('calendar.google.com', 'calendar.google.com');
  }
  
  if (platform === 'android' && provider === 'google') {
    // Android Google Calendar app
    return `intent://calendar.google.com/calendar/render${this.generateGoogleCalendarURL(block).split('?')[1]}#Intent;scheme=https;package=com.google.android.calendar;end`;
  }
  
  return this.generateGoogleCalendarURL(block);
}
```

## 🔐 Seguridad y Privacidad

### Validación de Datos
```typescript
static validateBlockForExport(block: ScheduleBlock): boolean {
  // Validar que el bloque tenga datos mínimos requeridos
  if (!block.title || !block.startTime || !block.endTime) {
    return false;
  }
  
  // Validar que las fechas sean válidas
  const start = new Date(block.startTime);
  const end = new Date(block.endTime);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  
  // Validar que la fecha de fin sea posterior a la de inicio
  if (end <= start) {
    return false;
  }
  
  return true;
}
```

### Sanitización de Datos
```typescript
static sanitizeForExport(block: ScheduleBlock): ScheduleBlock {
  return {
    ...block,
    title: this.sanitizeText(block.title),
    description: block.description ? this.sanitizeText(block.description) : '',
  };
}

private static sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')        // Remover HTML
    .replace(/[^\w\s\-.,!?]/g, '')  // Remover caracteres especiales
    .trim()
    .substring(0, 255);             // Limitar longitud
}
```

## 📊 Métricas de Sincronización

### Tracking de Uso
```typescript
interface SyncMetrics {
  totalExports: number;
  exportsByProvider: Record<string, number>;
  successRate: number;
  averageBlocksPerExport: number;
  lastSyncDate: Date;
}

static trackSyncUsage(provider: string, blockCount: number, success: boolean) {
  const metrics = this.getSyncMetrics();
  
  metrics.totalExports++;
  metrics.exportsByProvider[provider] = (metrics.exportsByProvider[provider] || 0) + 1;
  metrics.averageBlocksPerExport = (metrics.averageBlocksPerExport + blockCount) / 2;
  
  if (success) {
    metrics.successRate = (metrics.successRate + 1) / metrics.totalExports;
    metrics.lastSyncDate = new Date();
  }
  
  this.saveSyncMetrics(metrics);
}
```

## 🚀 Futuras Mejoras

### Sincronización Bidireccional
- Importación de eventos desde calendarios externos
- Detección y resolución de conflictos bidireccionales
- Sincronización incremental (solo cambios)

### APIs Nativas
- Integración con Google Calendar API
- Integración con Microsoft Graph API
- Soporte para CalDAV

### Funcionalidades Avanzadas
- Sincronización selectiva por categoría
- Plantillas de exportación personalizables
- Sincronización de recordatorios y alarmas

---

**Próximos pasos**: Ver [API Reference](./api-reference.md) para documentación de endpoints.