# Arquitectura Modular y Mejores Prácticas

## Principios de Arquitectura

### Separación de Responsabilidades
- Cada archivo debe tener una única responsabilidad clara
- Separar lógica de negocio, presentación y acceso a datos
- Un componente por archivo, una función por propósito

### Estructura Modular
- Organizar código por características/dominios, no por tipos de archivo
- Cada módulo debe ser independiente y reutilizable
- Evitar dependencias circulares entre módulos

### Clean Code
- Nombres descriptivos y claros para variables, funciones y componentes
- Funciones pequeñas y enfocadas (máximo 20-30 líneas)
- Evitar anidamiento profundo (máximo 3 niveles)
- Comentarios solo cuando sea necesario explicar el "por qué", no el "qué"

## Reglas Específicas

### NO Usar Archivos Barrel (index.ts)
- Evitar archivos index.ts que re-exporten múltiples módulos
- Importar directamente desde el archivo fuente
- Mantener imports explícitos y trazables

### Compound Components
- Usar patrón compound component para componentes complejos
- Separar lógica de estado de la presentación
- Crear sub-componentes cohesivos pero independientes

### Estructura de Archivos
```
src/
├── features/           # Características por dominio
│   ├── schedule/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
├── shared/            # Código compartido
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
└── lib/               # Configuraciones y clientes
```

### Convenciones de Naming
- Componentes: PascalCase (ScheduleBlock.tsx)
- Hooks: camelCase con prefijo "use" (useScheduleBlock.ts)
- Utilities: camelCase (formatDate.ts)
- Types: PascalCase con sufijo "Type" si es necesario
- Constants: UPPER_SNAKE_CASE

### Patrones a Seguir
- Custom hooks para lógica reutilizable
- Composition over inheritance
- Props drilling mínimo (usar context cuando sea necesario)
- Tipado estricto con TypeScript
- Validación con Zod para datos externos

### Estilo de Código
- Código minimalista y directo
- Evitar over-engineering
- Preferir funciones puras cuando sea posible
- Manejar errores de forma explícita
- Testing unitario para lógica de negocio

## Objetivo
Crear un proyecto que cualquier desarrollador pueda entender rápidamente, con código limpio, modular y mantenible.