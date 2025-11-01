# Especificaciones Backend - Persistencia de Datos del Dashboard de Clientes

## Resumen
Se requiere que todos los datos del dashboard de clientes se guarden en la base de datos para que persistan entre sesiones. Esto incluye:
- Carrito de compras
- Borradores de formularios (Reclamo, Soporte)
- Preferencias del usuario

---

## 1. Carrito de Compras

### GET `/clientes/{cliente_id}/carrito`
**Descripción:** Obtener el carrito guardado del cliente

**Headers:**
```
Authorization: Bearer {cliente_access_token}
```

**Respuesta (200):**
```json
{
  "cliente_id": "string",
  "items": [
    {
      "itemId": "string",
      "item": {
        "_id": "string",
        "codigo": "string",
        "nombre": "string",
        "descripcion": "string",
        "precio": "number",
        "imagenes": ["string"]
      },
      "cantidad": "number"
    }
  ],
  "fecha_actualizacion": "string (ISO 8601)"
}
```

**Respuesta (404):** Si el cliente no tiene carrito guardado
```json
{
  "message": "Carrito no encontrado"
}
```

---

### PUT `/clientes/{cliente_id}/carrito`
**Descripción:** Guardar o actualizar el carrito del cliente

**Headers:**
```
Authorization: Bearer {cliente_access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "items": [
    {
      "itemId": "string",
      "item": {
        "_id": "string",
        "codigo": "string",
        "nombre": "string",
        "descripcion": "string",
        "precio": "number",
        "imagenes": ["string"]
      },
      "cantidad": "number"
    }
  ]
}
```

**Respuesta (200):**
```json
{
  "message": "Carrito guardado exitosamente",
  "cliente_id": "string",
  "items": [...],
  "fecha_actualizacion": "string (ISO 8601)"
}
```

**Validaciones:**
- Verificar que el `cliente_id` existe
- Verificar que todos los `itemId` existen en inventario
- Actualizar o crear el documento del carrito

**Colección MongoDB:** `carritos_clientes`
**Estructura:**
```javascript
{
  _id: ObjectId,
  cliente_id: String, // referencia a clientes._id
  items: [
    {
      itemId: String, // referencia a inventario._id
      item: Object,   // snapshot completo del item al momento de agregarlo
      cantidad: Number
    }
  ],
  fecha_creacion: Date,
  fecha_actualizacion: Date
}
```

**Índice recomendado:**
```javascript
db.carritos_clientes.createIndex({ "cliente_id": 1 }, { unique: true });
```

---

## 2. Borradores de Formularios

### GET `/clientes/{cliente_id}/borradores`
**Descripción:** Obtener todos los borradores guardados del cliente (Reclamo, Soporte)

**Headers:**
```
Authorization: Bearer {cliente_access_token}
```

**Respuesta (200):**
```json
{
  "reclamo": {
    "titulo": "string",
    "descripcion": "string",
    "fecha_actualizacion": "string"
  } | null,
  "soporte": {
    "asunto": "string",
    "mensaje": "string",
    "fecha_actualizacion": "string"
  } | null
}
```

---

### PUT `/clientes/{cliente_id}/borradores/{tipo}`
**Descripción:** Guardar un borrador (Reclamo o Soporte)

**Headers:**
```
Authorization: Bearer {cliente_access_token}
Content-Type: application/json
```

**Parámetros de ruta:**
- `tipo`: `"reclamo"` o `"soporte"`

**Body (para reclamo):**
```json
{
  "titulo": "string",
  "descripcion": "string"
}
```

**Body (para soporte):**
```json
{
  "asunto": "string",
  "mensaje": "string"
}
```

**Respuesta (200):**
```json
{
  "message": "Borrador guardado exitosamente",
  "tipo": "string",
  "fecha_actualizacion": "string (ISO 8601)"
}
```

**Validaciones:**
- Verificar que el `cliente_id` existe
- Verificar que `tipo` es válido (`reclamo` o `soporte`)

**Colección MongoDB:** `borradores_clientes`
**Estructura:**
```javascript
{
  _id: ObjectId,
  cliente_id: String, // referencia a clientes._id
  reclamo: {
    titulo: String,
    descripcion: String,
    fecha_actualizacion: Date
  } | null,
  soporte: {
    asunto: String,
    mensaje: String,
    fecha_actualizacion: Date
  } | null,
  fecha_creacion: Date,
  fecha_actualizacion: Date
}
```

**Índice recomendado:**
```javascript
db.borradores_clientes.createIndex({ "cliente_id": 1 }, { unique: true });
```

---

### DELETE `/clientes/{cliente_id}/borradores/{tipo}`
**Descripción:** Eliminar un borrador después de enviarlo

**Headers:**
```
Authorization: Bearer {cliente_access_token}
```

**Parámetros de ruta:**
- `tipo`: `"reclamo"` o `"soporte"`

**Respuesta (200):**
```json
{
  "message": "Borrador eliminado exitosamente"
}
```

**Nota:** Esto se llamará cuando el cliente envíe exitosamente un reclamo o mensaje de soporte.

---

## 3. Preferencias del Usuario

### GET `/clientes/{cliente_id}/preferencias`
**Descripción:** Obtener las preferencias del cliente (vista activa, configuraciones)

**Headers:**
```
Authorization: Bearer {cliente_access_token}
```

**Respuesta (200):**
```json
{
  "vista_activa": "string (inicio|catalogo|mis-pedidos|reclamo|perfil|facturas|soporte|carrito)",
  "configuraciones": {
    "notificaciones": "boolean",
    "tema": "string"
  },
  "fecha_actualizacion": "string (ISO 8601)"
}
```

---

### PUT `/clientes/{cliente_id}/preferencias`
**Descripción:** Guardar o actualizar las preferencias del cliente

**Headers:**
```
Authorization: Bearer {cliente_access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "vista_activa": "string (opcional)",
  "configuraciones": {
    "notificaciones": "boolean (opcional)",
    "tema": "string (opcional)"
  }
}
```

**Respuesta (200):**
```json
{
  "message": "Preferencias guardadas exitosamente",
  "vista_activa": "string",
  "configuraciones": {...},
  "fecha_actualizacion": "string (ISO 8601)"
}
```

**Colección MongoDB:** `preferencias_clientes`
**Estructura:**
```javascript
{
  _id: ObjectId,
  cliente_id: String, // referencia a clientes._id
  vista_activa: String, // default: "inicio"
  configuraciones: {
    notificaciones: Boolean, // default: true
    tema: String // default: "dark"
  },
  fecha_creacion: Date,
  fecha_actualizacion: Date
}
```

**Índice recomendado:**
```javascript
db.preferencias_clientes.createIndex({ "cliente_id": 1 }, { unique: true });
```

---

## 4. Integración con Reclamos y Soporte Enviados

Cuando un cliente envía un **Reclamo** o un mensaje de **Soporte** (a través de los endpoints que se creen en el futuro), el backend debe:
1. Guardar el reclamo/mensaje en su colección correspondiente
2. **Eliminar automáticamente** el borrador asociado llamando a `DELETE /clientes/{cliente_id}/borradores/{tipo}`

---

## 5. Protección de Rutas

**Importante:** Todas las rutas deben:
1. Verificar el token `cliente_access_token`
2. Verificar que el `cliente_id` en el token coincida con el `cliente_id` en la ruta
3. Devolver `401` si no está autenticado
4. Devolver `403` si intenta acceder a datos de otro cliente

---

## 6. Auto-guardado

**Recomendación:** El backend puede implementar un endpoint específico para auto-guardado que se llame periódicamente desde el frontend:

### POST `/clientes/{cliente_id}/auto-guardar`
**Descripción:** Guardar múltiples datos en una sola llamada (carrito, borradores, preferencias)

**Headers:**
```
Authorization: Bearer {cliente_access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "carrito": {
    "items": [...]
  } | null,
  "borradores": {
    "reclamo": {
      "titulo": "string",
      "descripcion": "string"
    } | null,
    "soporte": {
      "asunto": "string",
      "mensaje": "string"
    } | null
  } | null,
  "preferencias": {
    "vista_activa": "string",
    "configuraciones": {...}
  } | null
}
```

**Respuesta (200):**
```json
{
  "message": "Datos auto-guardados exitosamente",
  "carrito_actualizado": "boolean",
  "borradores_actualizados": "boolean",
  "preferencias_actualizadas": "boolean"
}
```

**Nota:** Este endpoint es opcional, pero útil para optimizar las llamadas desde el frontend.

---

## 7. Flujo de Carga al Iniciar Sesión

Cuando un cliente inicia sesión, el frontend debe:
1. Llamar a `GET /clientes/{cliente_id}/carrito` para cargar el carrito
2. Llamar a `GET /clientes/{cliente_id}/borradores` para cargar los borradores
3. Llamar a `GET /clientes/{cliente_id}/preferencias` para cargar las preferencias

---

## 8. Notas Importantes

1. **Datos por cliente:** Cada cliente solo puede ver y modificar sus propios datos
2. **Sincronización:** El frontend puede usar tanto localStorage (para rapidez) como el backend (para persistencia)
3. **Validación:** Verificar que los items del carrito aún existen en inventario al cargar
4. **Limpieza:** Considerar limpiar carritos inactivos después de X días (opcional)

---

## 9. Ejemplo de Uso

### Flujo completo:

1. **Cliente inicia sesión:**
   ```
   GET /auth/clientes/login/
   → Recibe: cliente_id, access_token
   ```

2. **Frontend carga datos guardados:**
   ```
   GET /clientes/{cliente_id}/carrito
   GET /clientes/{cliente_id}/borradores
   GET /clientes/{cliente_id}/preferencias
   ```

3. **Cliente agrega producto al carrito:**
   ```
   PUT /clientes/{cliente_id}/carrito
   Body: { items: [...] }
   ```

4. **Cliente escribe reclamo (auto-guardado cada 30 segundos):**
   ```
   PUT /clientes/{cliente_id}/borradores/reclamo
   Body: { titulo: "...", descripcion: "..." }
   ```

5. **Cliente envía reclamo:**
   ```
   POST /reclamos (endpoint futuro)
   → Backend automáticamente elimina borrador
   ```

6. **Cliente cierra sesión:**
   - Todos los datos ya están guardados en BD
   - Al volver a iniciar sesión, se cargan automáticamente

