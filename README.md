# Planico - Planificador de Horarios Inteligente

Planico es una aplicación web moderna para la gestión y planificación de horarios semanales, construida con Next.js 15, TypeScript y Tailwind CSS. Ofrece una experiencia intuitiva para crear, organizar y sincronizar bloques de tiempo con funcionalidades avanzadas de productividad.

## ✨ Características Principales

### 🗓️ Gestión de Horarios

- **Vista semanal interactiva** con navegación fluida
- **Creación de bloques** mediante clicks en la grilla o formulario
- **Edición y eliminación** de bloques existentes
- **Categorización** con colores personalizables

### 🔍 Detección Inteligente de Conflictos

- **Validación en tiempo real** durante la creación/edición
- **Advertencias visuales** con sugerencias de horarios alternativos
- **Opción de ignorar conflictos** para casos especiales
- **Prevención automática** de superposiciones

### 🔔 Sistema de Recordatorios

- **Notificaciones automáticas** 15 minutos antes de cada evento
- **Permisos del navegador** para notificaciones de escritorio
- **Gestión inteligente** de recordatorios (cancelación automática)

### 📊 Métricas de Productividad

- **Estadísticas semanales** en tiempo real
- **Desglose por categorías** con porcentajes
- **Métricas de eficiencia** y tiempo total
- **Visualización clara** de patrones de trabajo

### 🔄 Sincronización Externa

- **Exportación a Google Calendar**
- **Exportación a Outlook Calendar**
- **Descarga de archivos .ICS**
- **Integración con calendarios externos**

### 🎨 Experiencia de Usuario

- **Interfaz moderna** con modo oscuro/claro
- **Notificaciones toast** para feedback inmediato
- **Animaciones fluidas** y transiciones suaves
- **Diseño responsive** para todos los dispositivos

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- pnpm (recomendado) o npm

### Instalación

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

# Iniciar servidor de desarrollo
pnpm dev
```

### Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Servidor normal
pnpm dev:quiet    # Servidor con logs mínimos
pnpm dev:verbose  # Servidor con logs detallados

# Base de datos
pnpm db:push      # Sincronizar esquema
pnpm db:migrate   # Ejecutar migraciones
pnpm db:studio    # Abrir Prisma Studio
pnpm db:generate  # Generar cliente Prisma

# Producción
pnpm build        # Construir aplicación
pnpm start        # Iniciar en producción
pnpm lint         # Verificar código
```

## 🏗️ Arquitectura

### Stack Tecnológico

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Base de datos**: SQLite con Prisma ORM
- **Validación**: Zod
- **Fechas**: date-fns
- **Iconos**: Lucide React

### Estructura del Proyecto

```
src/
├── app/                 # App Router de Next.js
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── layout/         # Componentes de layout
│   └── schedule/       # Componentes específicos de horarios
├── hooks/              # Custom hooks
├── lib/                # Utilidades y configuraciones
└── types/              # Definiciones de tipos TypeScript
```

## 📖 Documentación Detallada

Para información detallada sobre funcionalidades específicas, consulta:

- [**Flujo de Creación de Bloques**](./docs/block-creation-flow.md) - Proceso completo paso a paso
- [**Sistema de Conflictos**](./docs/conflict-detection.md) - Detección y resolución de conflictos
- [**Métricas y Productividad**](./docs/metrics-system.md) - Sistema de análisis y métricas
- [**Sincronización de Calendarios**](./docs/calendar-sync.md) - Exportación e integración
- [**API Reference**](./docs/api-reference.md) - Documentación de endpoints
- [**Guía de Desarrollo**](./docs/development-guide.md) - Para desarrolladores

## 🔧 Configuración

### Variables de Entorno

```env
DATABASE_URL="file:./dev.db"
PRISMA_LOG_LEVEL="error"  # error | verbose
```

### Personalización

- **Categorías**: Modifica `src/lib/utils.ts` para categorías por defecto
- **Colores**: Personaliza el tema en `src/app/globals.css`
- **Horarios**: Ajusta horarios de trabajo en `src/lib/conflict-checker.ts`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes preguntas:

1. Revisa la [documentación detallada](./docs/)
2. Busca en los [issues existentes](../../issues)
3. Crea un [nuevo issue](../../issues/new) si es necesario

---

**Desarrollado con ❤️ usando Next.js y TypeScript**
