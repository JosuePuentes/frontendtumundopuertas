# Instrucciones Backend: Persistencia de Mensajes en Chat

## Problema Identificado

Cuando un cliente cierra la pestaña del chat desde `/clientes` y la vuelve a abrir, la conversación se borra. Esto indica que los mensajes no se están persistiendo o cargando correctamente desde el backend.

## Endpoints Requeridos

### 1. GET `/mensajes/pedido/{pedido_id}`

**Propósito**: Obtener todos los mensajes de un pedido específico.

**Autenticación**: 
- Debe aceptar tokens de **cliente** (`cliente_access_token`) Y tokens de **admin** (`access_token`)
- Verificar que el cliente solo pueda ver mensajes de sus propios pedidos

**Comportamiento Esperado**:
- Retornar TODOS los mensajes asociados al `pedido_id`, sin importar cuántas veces se haya abierto/cerrado el chat
- Los mensajes deben estar ordenados por fecha (`fecha` o `createdAt`) de más antiguo a más reciente
- Retornar un array vacío `[]` si no hay mensajes, NO retornar 404

**Estructura de Respuesta**:
```json
[
  {
    "_id": "mensaje_id_123",
    "pedido_id": "pedido_id_456",
    "remitente_id": "cliente_id_789",
    "remitente_tipo": "cliente",
    "remitente_nombre": "Nombre del Cliente",
    "mensaje": "Texto del mensaje",
    "fecha": "2025-11-03T12:00:00.000Z",
    "leido": false
  },
  {
    "_id": "mensaje_id_124",
    "pedido_id": "pedido_id_456",
    "remitente_id": "admin_id_101",
    "remitente_tipo": "admin",
    "remitente_nombre": "Administrador",
    "mensaje": "Respuesta del admin",
    "fecha": "2025-11-03T12:05:00.000Z",
    "leido": true
  }
]
```

**Validaciones**:
- Si el usuario es `cliente`, verificar que `pedido_id` pertenezca a ese cliente (consultar la colección de pedidos)
- Si el usuario es `admin`, permitir ver mensajes de cualquier pedido
- Convertir `_id` de ObjectId a string en la respuesta

### 2. POST `/mensajes`

**Propósito**: Crear un nuevo mensaje en el chat de un pedido.

**Autenticación**: 
- Debe aceptar tokens de cliente Y admin

**Body de la Request**:
```json
{
  "pedido_id": "pedido_id_456",
  "remitente_id": "cliente_id_789",
  "remitente_tipo": "cliente",
  "remitente_nombre": "Nombre del Cliente",
  "mensaje": "Texto del mensaje"
}
```

**Comportamiento Esperado**:
- Guardar el mensaje en la base de datos con:
  - `pedido_id`: ID del pedido
  - `remitente_id`: ID del usuario que envía (cliente o admin)
  - `remitente_tipo`: "cliente" o "admin"
  - `remitente_nombre`: Nombre del remitente
  - `mensaje`: Texto del mensaje
  - `fecha`: Timestamp automático (fecha actual)
  - `leido`: `false` por defecto (se marcará como leído cuando el destinatario abra el chat)

**Respuesta**:
```json
{
  "message": "Mensaje creado exitosamente",
  "mensaje": {
    "_id": "mensaje_id_125",
    "pedido_id": "pedido_id_456",
    "remitente_id": "cliente_id_789",
    "remitente_tipo": "cliente",
    "remitente_nombre": "Nombre del Cliente",
    "mensaje": "Texto del mensaje",
    "fecha": "2025-11-03T12:10:00.000Z",
    "leido": false
  }
}
```

### 3. GET `/mensajes/pedido/{pedido_id}/no-leidos`

**Propósito**: Contar mensajes no leídos de un pedido específico.

**Autenticación**: 
- Debe aceptar tokens de cliente Y admin

**Comportamiento Esperado**:
- Contar mensajes donde `leido: false` y `remitente_tipo` != tipo del usuario actual
- Si el usuario es cliente, contar mensajes de tipo "admin" no leídos
- Si el usuario es admin, contar mensajes de tipo "cliente" no leídos

**Respuesta**:
```json
{
  "count": 3
}
```

O simplemente un número:
```json
3
```

## Persistencia en Base de Datos

**Colección**: `mensajes` (o el nombre que uses)

**Estructura del Documento**:
```javascript
{
  "_id": ObjectId("..."),
  "pedido_id": "pedido_id_456", // String, ID del pedido
  "remitente_id": "cliente_id_789", // String, ID del remitente
  "remitente_tipo": "cliente", // "cliente" | "admin"
  "remitente_nombre": "Nombre del Cliente", // String
  "mensaje": "Texto del mensaje", // String
  "fecha": ISODate("2025-11-03T12:00:00.000Z"), // Date
  "leido": false, // Boolean
  "createdAt": ISODate("2025-11-03T12:00:00.000Z"), // Date (opcional, puede usar "fecha")
  "updatedAt": ISODate("2025-11-03T12:00:00.000Z") // Date (opcional)
}
```

**Índices Recomendados**:
```javascript
// Índice para búsquedas rápidas por pedido_id
db.mensajes.createIndex({ "pedido_id": 1, "fecha": 1 })

// Índice para contar no leídos
db.mensajes.createIndex({ "pedido_id": 1, "leido": 1, "remitente_tipo": 1 })
```

## Verificaciones Importantes

1. ✅ Los mensajes se guardan permanentemente en la base de datos
2. ✅ El endpoint `GET /mensajes/pedido/{pedido_id}` retorna TODOS los mensajes históricos
3. ✅ Los mensajes se ordenan por fecha (más antiguos primero)
4. ✅ Se aceptan tokens de cliente Y admin
5. ✅ Los clientes solo pueden ver mensajes de sus propios pedidos
6. ✅ Si no hay mensajes, retorna `[]` (array vacío), NO 404
7. ✅ Los ObjectId se convierten a string en las respuestas
8. ✅ El campo `fecha` se incluye en todos los mensajes (puede ser `createdAt` también)

## Ejemplo de Consulta MongoDB

```javascript
// Obtener todos los mensajes de un pedido, ordenados por fecha
db.mensajes.find({ "pedido_id": "pedido_id_456" })
  .sort({ "fecha": 1 }) // 1 = ascendente (más antiguos primero)
  .toArray()

// Contar mensajes no leídos de tipo "admin" para un cliente
db.mensajes.countDocuments({
  "pedido_id": "pedido_id_456",
  "remitente_tipo": "admin",
  "leido": false
})
```

## Notas Adicionales

- Los mensajes NO deben eliminarse cuando se cierra el chat
- Los mensajes deben persistir indefinidamente (o según política de retención de datos)
- El campo `pedido_id` debe coincidir exactamente con el ID del pedido (verificar formato string vs ObjectId)










