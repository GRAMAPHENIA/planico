# API Reference

Documentación completa de los endpoints de la API de Planico.

## 🏗️ Arquitectura de la API

### Base URL
```
http://localhost:3000/api
```

### Estructura de Respuestas
```typescript
// Respuesta exitosa
interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

// Respuesta de error
interface ApiError {
  success: false;
  error: string;
  details?: any;
  code?: string;
}
```

### Códigos de Estado HTTP
- `200` - OK (operación exitosa)
- `201` - Created (recurso creado)
- `400` - Bad Request (datos inválidos)
- `404` - Not Found (recurso no encontrado)
- `409` - Conflict (conflicto de datos)
- `500` - Internal Server Error (error del servidor)

## 📅 Schedule Endpoints

### GET /api/schedule
Obtiene bloques de horario para una semana específica.

**Query Parameters:**
- `date` (opcional): Fecha ISO 8601 para determinar la semana. Default: fecha actual.

**Ejemplo de Request:**
```http
GET /api/schedule?date=2024-12-01T00:00:00.000Z
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx1234567890",
      "title": "Reunión de equipo",
      "description": "Revisión semanal del proyecto",
      "startTime": "2024-12-01T14:00:00.000Z",
      "endTime": "2024-12-01T15:00:00.000Z",
      "categoryId": "clx0987654321",
      "category": {
        "id": "clx0987654321",
        "name": "Trabajo",
        "color": "#3B82F6"
      },
      "createdAt": "2024-12-01T10:00:00.000Z",
      "updatedAt": "2024-12-01T10:00:00.000Z"
    }
  ],
  "message": "Bloques obtenidos exitosamente"
}
```

### POST /api/schedule
Crea un nuevo bloque de horario.

**Request Body:**
```typescript
interface CreateBlockRequest {
  title: string;           // Requerido, máx 100 caracteres
  description?: string;    // Opcional, máx 500 caracteres
  startTime: string;       // ISO 8601 date string
  endTime: string;         // ISO 8601 date string
  categoryId: string;      // ID de categoría existente
}
```

**Ejemplo de Request:**
```http
POST /api/schedule
Content-Type: application/json

{
  "title": "Sesión de desarrollo",
  "description": "Implementar nueva funcionalidad",
  "startTime": "2024-12-01T09:00:00.000Z",
  "endTime": "2024-12-01T11:00:00.000Z",
  "categoryId": "clx0987654321"
}
```

**Ejemplo de Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx1234567891",
    "title": "Sesión de desarrollo",
    "description": "Implementar nueva funcionalidad",
    "startTime": "2024-12-01T09:00:00.000Z",
    "endTime": "2024-12-01T11:00:00.000Z",
    "categoryId": "clx0987654321",
    "category": {
      "id": "clx0987654321",
      "name": "Trabajo",
      "color": "#3B82F6"
    },
    "createdAt": "2024-12-01T12:00:00.000Z",
    "updatedAt": "2024-12-01T12:00:00.000Z"
  },
  "message": "Bloque creado exitosamente"
}
```

**Errores Posibles:**
```json
// Conflicto de horario (409)
{
  "success": false,
  "error": "El bloque se superpone con otro bloque existente",
  "details": {
    "conflictingBlocks": [
      {
        "id": "clx1234567890",
        "title": "Reunión de equipo",
        "startTime": "2024-12-01T09:30:00.000Z",
        "endTime": "2024-12-01T10:30:00.000Z"
      }
    ]
  },
  "code": "SCHEDULE_CONFLICT"
}

// Categoría no encontrada (400)
{
  "success": false,
  "error": "La categoría especificada no existe",
  "code": "CATEGORY_NOT_FOUND"
}
```

### GET /api/schedule/[id]
Obtiene un bloque específico por ID.

**Path Parameters:**
- `id`: ID del bloque (CUID)

**Ejemplo de Request:**
```http
GET /api/schedule/clx1234567890
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "title": "Reunión de equipo",
    "description": "Revisión semanal del proyecto",
    "startTime": "2024-12-01T14:00:00.000Z",
    "endTime": "2024-12-01T15:00:00.000Z",
    "categoryId": "clx0987654321",
    "category": {
      "id": "clx0987654321",
      "name": "Trabajo",
      "color": "#3B82F6"
    },
    "createdAt": "2024-12-01T10:00:00.000Z",
    "updatedAt": "2024-12-01T10:00:00.000Z"
  },
  "message": "Bloque obtenido exitosamente"
}
```

### PUT /api/schedule/[id]
Actualiza un bloque existente.

**Path Parameters:**
- `id`: ID del bloque (CUID)

**Request Body:**
```typescript
interface UpdateBlockRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  categoryId?: string;
}
```

**Ejemplo de Request:**
```http
PUT /api/schedule/clx1234567890
Content-Type: application/json

{
  "title": "Reunión de equipo - Actualizada",
  "endTime": "2024-12-01T15:30:00.000Z"
}
```

### DELETE /api/schedule/[id]
Elimina un bloque específico.

**Path Parameters:**
- `id`: ID del bloque (CUID)

**Ejemplo de Request:**
```http
DELETE /api/schedule/clx1234567890
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "message": "Bloque eliminado correctamente"
}
```

## 🏷️ Categories Endpoints

### GET /api/categories
Obtiene todas las categorías disponibles.

**Ejemplo de Request:**
```http
GET /api/categories
```

**Ejemplo de Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx0987654321",
      "name": "Trabajo",
      "color": "#3B82F6"
    },
    {
      "id": "clx0987654322",
      "name": "Personal",
      "color": "#22C55E"
    },
    {
      "id": "clx0987654323",
      "name": "Ejercicio",
      "color": "#EF4444"
    }
  ],
  "message": "Categorías obtenidas exitosamente"
}
```

### POST /api/categories
Crea una nueva categoría.

**Request Body:**
```typescript
interface CreateCategoryRequest {
  name: string;    // Requerido, único, máx 50 caracteres
  color: string;   // Requerido, código hex (ej: "#3B82F6")
}
```

**Ejemplo de Request:**
```http
POST /api/categories
Content-Type: application/json

{
  "name": "Estudio",
  "color": "#8B5CF6"
}
```

**Ejemplo de Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx0987654324",
    "name": "Estudio",
    "color": "#8B5CF6"
  },
  "message": "Categoría creada exitosamente"
}
```

**Errores Posibles:**
```json
// Nombre duplicado (409)
{
  "success": false,
  "error": "Ya existe una categoría con ese nombre",
  "code": "UNIQUE_CONSTRAINT_VIOLATION"
}
```

### GET /api/categories/[id]
Obtiene una categoría específica por ID.

### PUT /api/categories/[id]
Actualiza una categoría existente.

**Request Body:**
```typescript
interface UpdateCategoryRequest {
  name?: string;
  color?: string;
}
```

### DELETE /api/categories/[id]
Elimina una categoría específica.

**Restricciones:**
- No se puede eliminar si tiene bloques asociados

**Error de Restricción:**
```json
{
  "success": false,
  "error": "No se puede eliminar la categoría porque tiene bloques asociados",
  "code": "CONSTRAINT_VIOLATION"
}
```

## 🔧 Middleware y Validaciones

### Validación de Entrada
Todos los endpoints utilizan validación con Zod:

```typescript
// Schema para crear bloque
const createBlockSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startTime: z.date(),
  endTime: z.date(),
  categoryId: z.string().cuid(),
}).refine(data => data.endTime > data.startTime, {
  message: "La fecha de fin debe ser posterior a la de inicio"
});
```

### Headers de Seguridad
Todos los responses incluyen headers de seguridad:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Access-Control-Allow-Origin: *
```

### Rate Limiting
- **Límite por IP**: 100 requests por minuto para GET
- **Límite por IP**: 50 requests por minuto para POST/PUT/DELETE

**Response de Rate Limit (429):**
```json
{
  "success": false,
  "error": "Demasiadas peticiones. Intente nuevamente más tarde.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

## 🐛 Manejo de Errores

### Tipos de Error

#### Errores de Validación (400)
```json
{
  "success": false,
  "error": "Datos de entrada inválidos",
  "details": [
    {
      "field": "title",
      "message": "El título es requerido"
    },
    {
      "field": "endTime",
      "message": "La fecha de fin debe ser posterior a la de inicio"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

#### Errores de Base de Datos
```json
// Registro no encontrado (404)
{
  "success": false,
  "error": "Registro no encontrado",
  "code": "RECORD_NOT_FOUND"
}

// Violación de clave foránea (400)
{
  "success": false,
  "error": "Violación de clave foránea - referencia inválida",
  "details": {
    "field_name": "categoryId"
  },
  "code": "FOREIGN_KEY_CONSTRAINT_VIOLATION"
}
```

#### Errores del Servidor (500)
```json
{
  "success": false,
  "error": "Error interno del servidor",
  "code": "INTERNAL_SERVER_ERROR"
}
```

## 📊 Códigos de Error Personalizados

| Código | Descripción |
|--------|-------------|
| `VALIDATION_ERROR` | Datos de entrada inválidos |
| `SCHEDULE_CONFLICT` | Conflicto de horarios |
| `CATEGORY_NOT_FOUND` | Categoría no existe |
| `RECORD_NOT_FOUND` | Registro no encontrado |
| `UNIQUE_CONSTRAINT_VIOLATION` | Violación de unicidad |
| `FOREIGN_KEY_CONSTRAINT_VIOLATION` | Referencia inválida |
| `CONSTRAINT_VIOLATION` | Violación de restricción |
| `RATE_LIMIT_EXCEEDED` | Límite de requests excedido |
| `INTERNAL_SERVER_ERROR` | Error interno del servidor |

## 🧪 Testing de la API

### Ejemplos con cURL

#### Crear un bloque
```bash
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Block",
    "description": "Testing API",
    "startTime": "2024-12-01T10:00:00.000Z",
    "endTime": "2024-12-01T11:00:00.000Z",
    "categoryId": "clx0987654321"
  }'
```

#### Obtener bloques de una semana
```bash
curl "http://localhost:3000/api/schedule?date=2024-12-01T00:00:00.000Z"
```

#### Crear una categoría
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Testing",
    "color": "#FF5733"
  }'
```

### Ejemplos con JavaScript/Fetch

#### Crear un bloque
```javascript
const response = await fetch('/api/schedule', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Nuevo Bloque',
    description: 'Descripción del bloque',
    startTime: new Date('2024-12-01T10:00:00.000Z').toISOString(),
    endTime: new Date('2024-12-01T11:00:00.000Z').toISOString(),
    categoryId: 'clx0987654321'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Bloque creado:', data.data);
} else {
  console.error('Error:', data.error);
}
```

## 🔮 Futuras Mejoras de la API

### Versioning
- Implementar versionado de API (`/api/v1/`, `/api/v2/`)
- Mantener compatibilidad hacia atrás

### Autenticación
- JWT tokens para autenticación
- Roles y permisos de usuario
- API keys para integraciones

### Funcionalidades Avanzadas
- Paginación para endpoints con muchos resultados
- Filtros avanzados (por categoría, rango de fechas, etc.)
- Búsqueda de texto completo
- Webhooks para notificaciones en tiempo real

### Optimizaciones
- Cache de respuestas frecuentes
- Compresión gzip
- GraphQL como alternativa a REST

---

**Próximos pasos**: Ver [Guía de Desarrollo](./development-guide.md) para información sobre desarrollo local.