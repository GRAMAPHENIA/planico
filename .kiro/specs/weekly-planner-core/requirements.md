# Requirements Document

## Introduction

Planico es un planificador semanal visual diseñado para gestionar clases, entrenamientos y horarios personalizados. La aplicación permite a los usuarios crear, editar y visualizar bloques de tiempo en una grilla semanal interactiva, proporcionando una experiencia moderna y eficiente para la planificación personal.

## Requirements

### Requirement 1: Gestión de Bloques de Horario

**User Story:** Como usuario, quiero crear y editar bloques de tiempo en mi planificador semanal, para poder organizar mis clases, entrenamientos y actividades personalizadas.

#### Acceptance Criteria

1. WHEN el usuario hace clic en una celda vacía de la grilla THEN el sistema SHALL mostrar un formulario para crear un nuevo bloque
2. WHEN el usuario completa el formulario de creación THEN el sistema SHALL guardar el bloque en la base de datos y mostrarlo en la grilla
3. WHEN el usuario hace clic en un bloque existente THEN el sistema SHALL permitir editar sus propiedades (título, descripción, color, duración)
4. WHEN el usuario elimina un bloque THEN el sistema SHALL removerlo de la grilla y la base de datos
5. IF un bloque se superpone con otro THEN el sistema SHALL mostrar una advertencia visual

### Requirement 2: Visualización de Grilla Semanal

**User Story:** Como usuario, quiero ver mi horario semanal en una grilla clara y visual, para poder entender rápidamente mi planificación.

#### Acceptance Criteria

1. WHEN el usuario accede a la aplicación THEN el sistema SHALL mostrar una grilla de 7 días x 24 horas
2. WHEN la grilla se renderiza THEN el sistema SHALL mostrar las horas en intervalos de 30 minutos
3. WHEN hay bloques programados THEN el sistema SHALL mostrarlos con colores diferenciados y información básica
4. WHEN el usuario navega entre semanas THEN el sistema SHALL cargar y mostrar los datos correspondientes
5. IF la pantalla es móvil THEN el sistema SHALL adaptar la grilla para una visualización responsive

### Requirement 3: Persistencia de Datos

**User Story:** Como usuario, quiero que mis horarios se guarden automáticamente, para no perder mi información al cerrar la aplicación.

#### Acceptance Criteria

1. WHEN el usuario crea o modifica un bloque THEN el sistema SHALL guardarlo automáticamente en SQLite
2. WHEN el usuario recarga la página THEN el sistema SHALL recuperar todos los bloques desde la base de datos
3. WHEN ocurre un error de conexión THEN el sistema SHALL mostrar un mensaje de error apropiado
4. IF hay cambios pendientes THEN el sistema SHALL intentar sincronizar automáticamente

### Requirement 4: Interfaz de Usuario Moderna

**User Story:** Como usuario, quiero una interfaz limpia y moderna, para tener una experiencia agradable al usar la aplicación.

#### Acceptance Criteria

1. WHEN la aplicación se carga THEN el sistema SHALL usar componentes de ShadCN/UI con diseño consistente
2. WHEN el usuario interactúa con elementos THEN el sistema SHALL proporcionar feedback visual inmediato
3. WHEN se muestran estados de carga THEN el sistema SHALL usar indicadores apropiados
4. IF hay errores de validación THEN el sistema SHALL mostrar mensajes claros y útiles
5. WHEN el usuario usa la aplicación en diferentes dispositivos THEN el sistema SHALL mantener usabilidad en todas las pantallas

### Requirement 5: Gestión de Categorías y Colores

**User Story:** Como usuario, quiero categorizar mis bloques con colores diferentes, para distinguir visualmente entre tipos de actividades.

#### Acceptance Criteria

1. WHEN el usuario crea un bloque THEN el sistema SHALL permitir seleccionar una categoría predefinida
2. WHEN se asigna una categoría THEN el sistema SHALL aplicar el color correspondiente al bloque
3. WHEN el usuario ve la grilla THEN el sistema SHALL mostrar una leyenda de colores/categorías
4. IF el usuario quiere personalizar categorías THEN el sistema SHALL permitir crear nuevas categorías con colores personalizados

### Requirement 6: Navegación Temporal

**User Story:** Como usuario, quiero navegar entre diferentes semanas, para planificar a futuro y revisar horarios pasados.

#### Acceptance Criteria

1. WHEN el usuario hace clic en "semana anterior/siguiente" THEN el sistema SHALL cargar los datos de esa semana
2. WHEN se cambia de semana THEN el sistema SHALL actualizar la URL para permitir bookmarking
3. WHEN el usuario accede por primera vez THEN el sistema SHALL mostrar la semana actual
4. IF no hay datos para una semana específica THEN el sistema SHALL mostrar una grilla vacía lista para usar