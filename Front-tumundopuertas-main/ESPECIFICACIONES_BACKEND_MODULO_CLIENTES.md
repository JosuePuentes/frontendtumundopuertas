# Especificaciones Backend - Módulo de Clientes

## Resumen
Se ha creado un módulo completo para que los clientes puedan:
- Registrarse y autenticarse
- Ver catálogo de productos
- Agregar productos al carrito
- Realizar pedidos con comprobante de pago
- Ver sus pedidos, facturas y perfil

---

## 1. Autenticación de Clientes

### POST `/auth/clientes/register/`
**Descripción:** Registro de nuevo cliente

**Body:**
```json
{
  "usuario": "string",
  "password": "string (mínimo 6 caracteres)",
  "nombre": "string",
  "cedula": "string",
  "direccion": "string",
  "telefono": "string"
}
```

**Respuesta (201):**
```json
{
  "message": "Cliente registrado exitosamente",
  "cliente_id": "string"
}
```

**Validaciones:**
- Usuario único
- Password mínimo 6 caracteres
- Todos los campos requeridos

**Colección MongoDB:** `clientes`
**Estructura:**
```javascript
{
  _id: ObjectId,
  usuario: String,  // único
  password: String, // hasheado con bcrypt
  nombre: String,
  cedula: String,
  direccion: String,
  telefono: String,
  rol: "cliente",  // fijo
  fecha_creacion: Date,
  activo: Boolean // default: true
}
```

---

### POST `/auth/clientes/login/`
**Descripción:** Login de cliente

**Body:**
```json
{
  "usuario": "string",
  "password": "string"
}
```

**Respuesta (200):**
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "cliente_id": "string",
  "nombre": "string"
}
```

**Validaciones:**
- Verificar que el cliente existe
- Verificar password
- Verificar que está activo

---

## 2. Catálogo de Productos

### GET `/inventario/all`
**Descripción:** Obtener todos los items del inventario (debe filtrar solo activos y con precio > 0)

**Headers:**
```
Authorization: Bearer {cliente_access_token}
```

**Respuesta (200):**
```json
[
  {
    "_id": "string",
    "codigo": "string",
    "nombre": "string",
    "descripcion": "string",
    "precio": "number",
    "imagenes": ["string"],
    "activo": true
  }
]
```

**Filtros aplicados:**
- `activo: true` (o no false)
- `precio > 0`

---

## 3. Creación de Pedidos desde Cliente

### POST `/pedidos/cliente`
**Descripción:** Crear pedido desde el panel del cliente

**Headers:**
```
Authorization: Bearer {cliente_access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "cliente_id": "string",
  "items": [
    {
      "itemId": "string",
      "cantidad": "number",
      "precio": "number"
    }
  ],
  "metodo_pago": "string (transferencia|pago_movil|efectivo|otro)",
  "numero_referencia": "string",
  "comprobante_url": "string",
  "total": "number",
  "estado": "pendiente"
}
```

**Respuesta (201):**
```json
{
  "_id": "string",
  "cliente_id": "string",
  "items": [...],
  "total": "number",
  "estado": "pendiente",
  "fecha_creacion": "string (ISO 8601)"
}
```

**Validaciones:**
- `cliente_id` debe existir
- Todos los items deben existir en inventario
- `total` debe coincidir con la suma de items
- Todos los campos requeridos

**Colección MongoDB:** `pedidos`
**Estructura adicional para pedidos de cliente:**
```javascript
{
  // ... campos existentes del pedido
  tipo: "cliente",  // para diferenciar de pedidos normales
  metodo_pago: String,
  numero_referencia: String,
  comprobante_url: String,
  cliente_id: String, // ID del cliente (no confundir con cliente_id de pedidos normales)
}
```

---

## 4. Subida de Archivos (Comprobantes)

### POST `/files/upload`
**Descripción:** Subir archivo de comprobante de pago

**Headers:**
```
Authorization: Bearer {cliente_access_token}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
file: File (PNG/Imagen)
folder: "comprobantes_pago"
```

**Respuesta (200):**
```json
{
  "url": "string",
  "file_url": "string"
}
```

**Validaciones:**
- Solo imágenes (PNG, JPG, JPEG)
- Tamaño máximo 10MB
- Validar formato antes de subir

---

## 5. Consultas del Cliente

### GET `/pedidos/cliente/{cliente_id}`
**Descripción:** Obtener todos los pedidos de un cliente

**Headers:**
```
Authorization: Bearer {cliente_access_token}
```

**Respuesta (200):**
```json
[
  {
    "_id": "string",
    "cliente_id": "string",
    "items": [...],
    "total": "number",
    "estado_general": "string",
    "fecha_creacion": "string",
    "montoTotal": "number"
  }
]
```

---

### GET `/clientes/{cliente_id}`
**Descripción:** Obtener perfil del cliente

**Headers:**
```
Authorization: Bearer {cliente_access_token}
```

**Respuesta (200):**
```json
{
  "_id": "string",
  "nombre": "string",
  "cedula": "string",
  "direccion": "string",
  "telefono": "string",
  "usuario": "string"
}
```

---

### PUT `/clientes/{cliente_id}`
**Descripción:** Actualizar perfil del cliente

**Headers:**
```
Authorization: Bearer {cliente_access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "nombre": "string",
  "cedula": "string",
  "direccion": "string",
  "telefono": "string"
}
```

**Respuesta (200):**
```json
{
  "_id": "string",
  // ... campos actualizados
}
```

---

### GET `/facturas/cliente/{cliente_id}`
**Descripción:** Obtener facturas del cliente

**Headers:**
```
Authorization: Bearer {cliente_access_token}
```

**Respuesta (200):**
```json
[
  {
    "_id": "string",
    "numeroFactura": "string",
    "numero_factura": "string",
    "fechaFacturacion": "string",
    "fecha_facturacion": "string",
    "montoTotal": "number",
    "monto_total": "number"
  }
]
```

**Nota:** Las facturas deben estar vinculadas al cliente por `clienteId` o `cliente_id` en la colección `facturas_confirmadas`.

---

## 6. Protección de Rutas

**Importante:** Todas las rutas de cliente deben:
1. Verificar el token `cliente_access_token`
2. Verificar que el `cliente_id` en el token coincida con el solicitado (si aplica)
3. Devolver 401 si no está autenticado
4. Devolver 403 si intenta acceder a datos de otro cliente

---

## 7. Índices Recomendados

```javascript
// Colección clientes
db.clientes.createIndex({ "usuario": 1 }, { unique: true });
db.clientes.createIndex({ "cedula": 1 });

// Colección pedidos (para clientes)
db.pedidos.createIndex({ "cliente_id": 1, "tipo": "cliente" });
db.pedidos.createIndex({ "fecha_creacion": -1 });
```

---

## 8. Notas Importantes

1. **Separación de usuarios:** Los clientes usan la colección `clientes`, diferente de `usuarios`
2. **Tokens diferentes:** Los clientes usan `cliente_access_token` en localStorage, no `access_token`
3. **Seguridad:** No permitir que un cliente vea datos de otro cliente
4. **Validaciones:** Todos los campos requeridos deben validarse
5. **Formato de respuesta:** Mantener consistencia en camelCase o snake_case (el frontend maneja ambos)

---

## 9. Endpoints Opcionales (Para funcionalidades futuras)

### POST `/reclamos`
**Descripción:** Crear reclamo del cliente

### POST `/soporte`
**Descripción:** Enviar mensaje de soporte

**Nota:** Estos endpoints pueden implementarse después si se necesitan.

