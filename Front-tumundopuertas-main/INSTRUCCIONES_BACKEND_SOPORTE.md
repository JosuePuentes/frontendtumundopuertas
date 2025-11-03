# Instrucciones Backend - Sistema de Soporte

## Descripción General

El frontend requiere un sistema de mensajería de soporte donde los clientes pueden enviar mensajes que aparecen en `/pedidos-web` como una lista de conversaciones estilo DM.

## Estructura de Mensajes de Soporte

Los mensajes de soporte usan un `pedido_id` especial: `soporte_{cliente_id}`

Por ejemplo, si el cliente tiene ID `6905c870d78e8d237d2b2c94`, el `pedido_id` será `soporte_6905c870d78e8d237d2b2c94`.

## Endpoints Requeridos

### 1. GET `/mensajes/soporte`

**Descripción:** Obtiene todas las conversaciones de soporte agrupadas por cliente.

**Headers:**
```
Authorization: Bearer {token_admin}
```

**Lógica:**
1. Buscar todos los mensajes donde `pedido_id` empiece con `"soporte_"`
2. Agrupar por cliente (extraer `cliente_id` de `pedido_id`)
3. Para cada cliente, obtener:
   - `cliente_id`: ID del cliente
   - `cliente_nombre`: Nombre del cliente (buscar en colección de clientes)
   - `ultimoMensaje`: Último mensaje enviado
   - `ultimaFecha`: Fecha del último mensaje
   - `noLeidos`: Contar mensajes donde `remitente_tipo === "cliente"` y `leido === false`

**Respuesta (200):**
```json
[
  {
    "cliente_id": "6905c870d78e8d237d2b2c94",
    "cliente_nombre": "Juan Pérez",
    "ultimoMensaje": "Necesito ayuda con mi pedido",
    "ultimaFecha": "2025-01-15T10:30:00Z",
    "noLeidos": 2
  },
  {
    "cliente_id": "6905c870d78e8d237d2b2c95",
    "cliente_nombre": "María González",
    "ultimoMensaje": "¿Cuándo llegará mi pedido?",
    "ultimaFecha": "2025-01-15T09:15:00Z",
    "noLeidos": 0
  }
]
```

**Orden:** Por `ultimaFecha` descendente (más reciente primero)

---

### 2. POST `/mensajes`

**Ya existe, pero debe aceptar `pedido_id` con formato `soporte_{cliente_id}`**

**Validación adicional:**
- Si `pedido_id` empieza con `"soporte_"`, extraer el `cliente_id` y verificar que existe
- No requiere que el pedido exista si es un mensaje de soporte

---

### 3. GET `/mensajes/pedido/soporte_{cliente_id}`

**Descripción:** Obtiene todos los mensajes de una conversación de soporte específica.

**Headers:**
```
Authorization: Bearer {token_admin} o {token_cliente}
```

**Lógica:**
- Buscar todos los mensajes donde `pedido_id === "soporte_{cliente_id}"`
- Ordenar por `fecha` ascendente

**Respuesta:** Igual que `GET /mensajes/pedido/{pedido_id}` normal

---

### 4. GET `/mensajes/pedido/soporte_{cliente_id}/no-leidos`

**Descripción:** Contar mensajes no leídos de una conversación de soporte.

**Headers:**
```
Authorization: Bearer {token_admin} o {token_cliente}
```

**Lógica:**
- Si el usuario es admin: contar mensajes donde `remitente_tipo === "cliente"` y `leido === false`
- Si el usuario es cliente: contar mensajes donde `remitente_tipo === "admin"` y `leido === false`

**Respuesta:**
```json
{
  "count": 3
}
```
O simplemente:
```json
3
```

---

## Ejemplo de Flujo

1. **Cliente envía mensaje de soporte:**
   - `POST /mensajes`
   - Body: `{ "pedido_id": "soporte_6905c870d78e8d237d2b2c94", "remitente_id": "6905c870d78e8d237d2b2c94", "remitente_tipo": "cliente", "mensaje": "Necesito ayuda" }`

2. **Admin ve conversaciones en `/pedidos-web`:**
   - `GET /mensajes/soporte`
   - Retorna lista de clientes que han enviado mensajes

3. **Admin abre chat con cliente:**
   - `GET /mensajes/pedido/soporte_6905c870d78e8d237d2b2c94`
   - Muestra todos los mensajes de esa conversación

4. **Admin responde:**
   - `POST /mensajes`
   - Body: `{ "pedido_id": "soporte_6905c870d78e8d237d2b2c94", "remitente_id": "admin_id", "remitente_tipo": "admin", "mensaje": "¿En qué puedo ayudarte?" }`

---

## Notas Importantes

1. **Persistencia:** Los chats deben persistir en localStorage, pero el backend debe mantener todos los mensajes en la base de datos.

2. **Identificación de cliente:** Cuando un cliente envía un mensaje de soporte, el backend debe:
   - Extraer `cliente_id` del `pedido_id` (removiendo el prefijo `"soporte_"`)
   - Obtener el nombre del cliente desde la colección de clientes
   - Retornar el nombre en `GET /mensajes/soporte`

3. **Validación:** El endpoint `POST /mensajes` debe aceptar `pedido_id` que empiece con `"soporte_"` sin requerir que el pedido exista en la base de datos.

4. **Agrupación:** El endpoint `GET /mensajes/soporte` debe agrupar por `cliente_id` y retornar solo una entrada por cliente con el último mensaje y cantidad de no leídos.

