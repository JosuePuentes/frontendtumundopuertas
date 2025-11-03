# Instrucciones para Backend - Sistema de Mensajería en Tiempo Real

## Requerimientos

El frontend necesita endpoints para un sistema de mensajería en tiempo real entre administradores y clientes relacionados con pedidos.

## Endpoints Necesarios

### 1. POST /mensajes
**Crear un nuevo mensaje**

**Body:**
```json
{
  "pedido_id": "string",
  "remitente_id": "string",
  "remitente_tipo": "admin" | "cliente",
  "remitente_nombre": "string",
  "mensaje": "string"
}
```

**Respuesta:**
```json
{
  "_id": "string",
  "pedido_id": "string",
  "remitente_id": "string",
  "remitente_tipo": "admin" | "cliente",
  "remitente_nombre": "string",
  "mensaje": "string",
  "fecha": "ISO8601",
  "leido": false
}
```

### 2. GET /mensajes/pedido/{pedido_id}
**Obtener todos los mensajes de un pedido**

**Headers:**
- `Authorization: Bearer {token}`

**Respuesta:**
```json
[
  {
    "_id": "string",
    "pedido_id": "string",
    "remitente_id": "string",
    "remitente_tipo": "admin" | "cliente",
    "remitente_nombre": "string",
    "mensaje": "string",
    "fecha": "ISO8601",
    "leido": boolean
  }
]
```

**Orden:** Los mensajes deben retornarse ordenados por fecha ascendente (más antiguos primero).

### 3. GET /mensajes/pedido/{pedido_id}/no-leidos
**Contar mensajes no leídos de un pedido para el usuario actual**

**Headers:**
- `Authorization: Bearer {token}` (admin o cliente)

**Lógica:**
- Si el usuario es admin: contar mensajes donde `remitente_tipo === "cliente"` y `leido === false`
- Si el usuario es cliente: contar mensajes donde `remitente_tipo === "admin"` y `leido === false`

**Respuesta:**
```json
{
  "count": 5
}
```
O simplemente:
```json
5
```

### 4. PATCH /mensajes/{mensaje_id}/marcar-leido (Opcional)
**Marcar un mensaje como leído**

**Headers:**
- `Authorization: Bearer {token}`

**Respuesta:**
```json
{
  "_id": "string",
  "leido": true
}
```

**Nota:** Alternativamente, puedes marcar todos los mensajes como leídos cuando se consultan con GET /mensajes/pedido/{pedido_id}.

## Estructura de la Colección (MongoDB)

```javascript
{
  "_id": ObjectId,
  "pedido_id": String,  // ID del pedido relacionado
  "remitente_id": String,  // ID del usuario que envía (admin o cliente)
  "remitente_tipo": String,  // "admin" o "cliente"
  "remitente_nombre": String,  // Nombre del remitente (para mostrar)
  "mensaje": String,  // Contenido del mensaje
  "fecha": Date,  // Fecha de creación
  "leido": Boolean  // false por defecto
}
```

## Autenticación

- **Admin:** Usa `access_token` del localStorage, verificado con `get_current_user`
- **Cliente:** Usa `cliente_access_token` del localStorage, verificado con `get_current_cliente`

## Validaciones

1. **POST /mensajes:**
   - `pedido_id` debe existir en la base de datos
   - `mensaje` no puede estar vacío (trim)
   - `remitente_tipo` debe ser "admin" o "cliente"
   - El usuario actual debe tener acceso al pedido (ser el admin o el cliente dueño del pedido)

2. **GET /mensajes/pedido/{pedido_id}:**
   - Verificar que el usuario tiene acceso al pedido
   - Retornar 404 si el pedido no existe
   - Retornar 403 si el usuario no tiene acceso

## Notas Importantes

1. **Marcado automático como leído:** Cuando se obtienen los mensajes con GET, puedes marcar automáticamente los mensajes del otro usuario como leídos, o hacerlo cuando se abre el chat.

2. **Polling:** El frontend hace polling cada 3 segundos cuando el chat está abierto, y cada 10 segundos para verificar mensajes no leídos en la lista.

3. **Ordenamiento:** Los mensajes se ordenan por fecha ascendente en el backend para mantener consistencia.

4. **Fechas:** Usar formato ISO8601 para todas las fechas.

