# Especificaciones Backend - Módulo Cuentas por Pagar

## Resumen de lo implementado en Frontend

El frontend tiene completamente implementado el módulo de Cuentas por Pagar con las siguientes características:

### Funcionalidades Frontend Implementadas:
1. ✅ **Listado de cuentas por pagar** - Dos columnas: Pendientes y Pagadas
2. ✅ **Crear cuenta por pagar** - Con formulario completo
3. ✅ **Gestión de proveedores** - Búsqueda y creación de proveedores (guardados en localStorage)
4. ✅ **Agregar items del inventario** - Selección de items con costo y cantidad
5. ✅ **Opción de descripción** - Alternativa a items (descripción + monto)
6. ✅ **Abonar a cuenta** - Modal para registrar abonos con selección de método de pago
7. ✅ **Preliminar de cuenta pagada** - Visualización completa con historial de abonos
8. ✅ **Búsqueda y filtrado** - Búsqueda por proveedor, RIF o ID

### Nota sobre Proveedores:
- Los proveedores se guardan temporalmente en `localStorage` en el frontend
- El backend puede implementar su propia gestión de proveedores si lo desea
- El frontend enviará los datos del proveedor dentro de cada cuenta por pagar

---

## Endpoints Requeridos en el Backend

### 1. GET `/cuentas-por-pagar`
**Descripción:** Obtiene todas las cuentas por pagar

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Respuesta esperada (200):**
```json
[
  {
    "_id": "string (ObjectId)",
    "proveedor": {
      "nombre": "string",
      "rif": "string",
      "telefono": "string"
    },
    "items": [
      {
        "itemId": "string",
        "codigo": "string",
        "nombre": "string",
        "costo": "number",
        "cantidad": "number",
        "subtotal": "number"
      }
    ],
    "descripcion": "string (opcional, solo si no hay items)",
    "monto": "number (opcional, solo si no hay items)",
    "total": "number",
    "montoAbonado": "number",
    "saldoPendiente": "number",
    "estado": "pendiente" | "pagada",
    "fechaCreacion": "string (ISO 8601)",
    "historialAbonos": [
      {
        "fecha": "string (ISO 8601)",
        "monto": "number",
        "metodoPago": "string (ID del método de pago)",
        "metodoPagoNombre": "string (nombre del método de pago)"
      }
    ]
  }
]
```

**Validaciones:**
- Debe retornar array vacío `[]` si no hay cuentas
- `_id` debe ser convertido a string

---

### 2. POST `/cuentas-por-pagar`
**Descripción:** Crea una nueva cuenta por pagar

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "proveedor": {
    "nombre": "string",
    "rif": "string",
    "telefono": "string (opcional)"
  },
  "items": [
    {
      "itemId": "string",
      "codigo": "string",
      "nombre": "string",
      "costo": "number",
      "cantidad": "number"
    }
  ],
  "descripcion": "string (opcional si hay items)",
  "monto": "number (opcional si hay items)",
  "total": "number",
  "montoAbonado": 0,
  "saldoPendiente": "number (debe ser igual a total)",
  "estado": "pendiente"
}
```

**Validaciones:**
- Debe tener `items` (array con al menos 1 item) **O** (`descripcion` **Y** `monto`)
- `total` debe ser igual a la suma de `items` subtotales O igual al `monto`
- `proveedor.nombre` es requerido
- `proveedor.rif` es requerido
- `saldoPendiente` debe ser igual a `total` al crear

**Respuesta esperada (201):**
```json
{
  "_id": "string (ObjectId)",
  "proveedor": { ... },
  "items": [ ... ],
  "total": "number",
  "montoAbonado": 0,
  "saldoPendiente": "number",
  "estado": "pendiente",
  "fechaCreacion": "string (ISO 8601)",
  "historialAbonos": []
}
```

**Errores posibles:**
- 400: Datos inválidos (falta nombre/RIF, total incorrecto, etc.)
- 401: No autorizado

---

### 3. POST `/cuentas-por-pagar/{id}/abonar`
**Descripción:** Registra un abono a una cuenta por pagar

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parámetros:**
- `id`: ID de la cuenta por pagar (ObjectId)

**Body:**
```json
{
  "monto": "number",
  "metodo_pago_id": "string (ID del método de pago)"
}
```

**Proceso que debe realizar el backend:**

1. **Validar cuenta:**
   - Verificar que la cuenta existe
   - Verificar que `estado === "pendiente"`
   - Verificar que `monto > 0`
   - Verificar que `monto <= saldoPendiente`

2. **Validar método de pago:**
   - Verificar que el método de pago existe
   - Verificar que `saldo del método >= monto`

3. **Actualizar cuenta por pagar:**
   ```javascript
   nuevoMontoAbonado = montoAbonado + monto
   nuevoSaldoPendiente = saldoPendiente - monto
   
   // Agregar al historial de abonos
   nuevoRegistroAbono = {
     fecha: new Date().toISOString(),
     monto: monto,
     metodoPago: metodo_pago_id,
     metodoPagoNombre: nombre_del_metodo_pago
   }
   
   // Si saldoPendiente llega a 0, cambiar estado a "pagada"
   nuevoEstado = (nuevoSaldoPendiente === 0) ? "pagada" : "pendiente"
   ```

4. **Actualizar método de pago:**
   - Restar `monto` del saldo del método de pago
   - Registrar transacción en el historial del método de pago:
     ```javascript
     {
       tipo: "transferir", // o "pago" según tu sistema
       monto: monto, // puede ser positivo o negativo según tu lógica
       concepto: `Abono a cuenta por pagar - ${proveedor.nombre} - #${id.slice(-6)}`,
       fecha: new Date()
     }
     ```
   - **IMPORTANTE:** Esta transacción debe aparecer en `/metodos-pago/{id}/historial`

**Respuesta esperada (200):**
```json
{
  "_id": "string",
  "proveedor": { ... },
  "total": "number",
  "montoAbonado": "number (actualizado)",
  "saldoPendiente": "number (actualizado)",
  "estado": "pendiente" | "pagada",
  "historialAbonos": [ ... ] // Array actualizado con el nuevo abono
}
```

**Errores posibles:**
- 404: Cuenta no encontrada
- 400: Monto inválido o mayor al saldo pendiente
- 400: Saldo del método de pago insuficiente
- 400: Cuenta ya está pagada
- 401: No autorizado

**Nota importante:** El backend DEBE asegurar que las actualizaciones de la cuenta y del método de pago sean atómicas (usar transacciones si es posible).

---

### 4. GET `/cuentas-por-pagar/{id}`
**Descripción:** Obtiene una cuenta por pagar por ID

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros:**
- `id`: ID de la cuenta por pagar (ObjectId)

**Respuesta esperada (200):**
```json
{
  "_id": "string",
  "proveedor": { ... },
  "items": [ ... ],
  "total": "number",
  "montoAbonado": "number",
  "saldoPendiente": "number",
  "estado": "pendiente" | "pagada",
  "fechaCreacion": "string",
  "historialAbonos": [ ... ]
}
```

**Errores posibles:**
- 404: Cuenta no encontrada
- 401: No autorizado

---

## Estructura de Base de Datos (MongoDB)

### Colección: `cuentas_por_pagar`

```javascript
{
  _id: ObjectId,
  proveedor: {
    nombre: String (required),
    rif: String (required),
    telefono: String (optional)
  },
  items: [  // Array opcional
    {
      itemId: String,  // ID del item en inventario
      codigo: String,
      nombre: String,
      costo: Number,
      cantidad: Number,
      subtotal: Number
    }
  ],
  descripcion: String,  // Opcional si hay items
  monto: Number,  // Opcional si hay items
  total: Number (required),
  montoAbonado: Number (default: 0),
  saldoPendiente: Number (required, inicialmente igual a total),
  estado: String (required, enum: ["pendiente", "pagada"], default: "pendiente"),
  fechaCreacion: Date (required, default: Date.now),
  historialAbonos: [  // Array que crece con cada abono
    {
      fecha: Date,
      monto: Number,
      metodoPago: String,  // ID del método de pago
      metodoPagoNombre: String  // Nombre del método (para mostrar fácilmente)
    }
  ]
}
```

**Índices recomendados:**
- `{ estado: 1 }` - Para filtrar pendientes/pagadas
- `{ "proveedor.rif": 1 }` - Para búsquedas por RIF
- `{ fechaCreacion: -1 }` - Para ordenar por fecha

---

## Integración con Métodos de Pago

### Cuando se registra un abono:

1. **Debe restar del saldo del método de pago:**
   ```python
   # Pseudocódigo
   metodo_pago.saldo -= monto
   metodo_pago.save()
   ```

2. **Debe registrar en el historial del método de pago:**
   ```python
   # Pseudocódigo
   transaccion = {
     "tipo": "transferir",  # o "pago" según tu sistema
     "monto": monto,  # Verifica si es positivo o negativo según tu lógica
     "concepto": f"Abono a cuenta por pagar - {proveedor.nombre} - #{cuenta_id[-6:]}",
     "fecha": datetime.now()
   }
   metodo_pago.historial.append(transaccion)
   ```

3. **Esta transacción debe aparecer en:**
   - `GET /metodos-pago/{id}/historial`
   - Debe tener el mismo formato que otras transacciones (deposito/transferir)

---

## Actualización de Inventario

**IMPORTANTE:** El frontend actualiza el inventario directamente cuando se crea una cuenta con items. El backend NO necesita hacer esto.

Sin embargo, si quieres centralizar esta lógica en el backend, puedes hacerlo en el `POST /cuentas-por-pagar` después de crear la cuenta:

```python
# Pseudocódigo opcional
if items:
    for item in items:
        inventario_item = items_collection.find_one({"_id": ObjectId(item.itemId)})
        nueva_cantidad = (inventario_item.cantidad || 0) + item.cantidad
        items_collection.update_one(
            {"_id": ObjectId(item.itemId)},
            {"$set": {"cantidad": nueva_cantidad}}
        )
```

**Nota:** Actualmente el frontend hace esto, así que esto es opcional.

---

## Validaciones Importantes

### Al crear cuenta:
- ✅ `items.length > 0` **O** (`descripcion` **Y** `monto > 0`)
- ✅ `total` debe ser igual a suma de items **O** igual a `monto`
- ✅ `proveedor.nombre` y `proveedor.rif` requeridos
- ✅ `saldoPendiente === total` al crear

### Al abonar:
- ✅ Cuenta debe existir
- ✅ `estado === "pendiente"`
- ✅ `monto > 0`
- ✅ `monto <= saldoPendiente`
- ✅ Método de pago existe
- ✅ `saldo del método >= monto`
- ✅ Si `saldoPendiente - monto === 0`, cambiar `estado` a `"pagada"`

---

## Ejemplo de Flujo Completo

### 1. Crear cuenta con items:
```json
POST /cuentas-por-pagar
{
  "proveedor": {
    "nombre": "Proveedor XYZ",
    "rif": "J-123456789",
    "telefono": "0414-1234567"
  },
  "items": [
    {
      "itemId": "507f1f77bcf86cd799439011",
      "codigo": "0010",
      "nombre": "Producto A",
      "costo": 100.00,
      "cantidad": 5
    }
  ],
  "total": 500.00,
  "montoAbonado": 0,
  "saldoPendiente": 500.00,
  "estado": "pendiente"
}
```

### 2. Abonar 200:
```json
POST /cuentas-por-pagar/{id}/abonar
{
  "monto": 200.00,
  "metodo_pago_id": "507f1f77bcf86cd799439022"
}
```

**Resultado:**
- `montoAbonado`: 200.00
- `saldoPendiente`: 300.00
- `estado`: "pendiente"
- Saldo del método de pago: reducido en 200.00
- Historial del método: nuevo registro con concepto del abono

### 3. Abonar 300 (completar pago):
```json
POST /cuentas-por-pagar/{id}/abonar
{
  "monto": 300.00,
  "metodo_pago_id": "507f1f77bcf86cd799439022"
}
```

**Resultado:**
- `montoAbonado`: 500.00
- `saldoPendiente`: 0.00
- `estado`: "pagada" ✅
- Saldo del método de pago: reducido en 300.00
- Historial del método: nuevo registro con concepto del abono

---

## Notas Finales

1. **Autenticación:** Todos los endpoints requieren token JWT en el header `Authorization: Bearer {token}`

2. **Formato de fechas:** Usar ISO 8601 (ejemplo: `"2025-10-31T10:30:00.000Z"`)

3. **Formato de IDs:** ObjectId de MongoDB convertido a string

4. **Manejo de errores:** Retornar códigos HTTP apropiados (400, 401, 404, 500) con mensaje de error en el body:
   ```json
   {
     "detail": "Mensaje de error descriptivo"
   }
   ```

5. **Transacciones:** Asegurar que las operaciones de abono sean atómicas (cuenta + método de pago)

6. **Historial:** El historial de abonos debe mantener el nombre del método de pago para facilitar la visualización en el frontend

---

## Resumen para la IA del Backend

**Necesitas crear 4 endpoints:**
1. `GET /cuentas-por-pagar` - Listar todas
2. `POST /cuentas-por-pagar` - Crear nueva
3. `POST /cuentas-por-pagar/{id}/abonar` - Registrar abono (más complejo)
4. `GET /cuentas-por-pagar/{id}` - Obtener una

**El endpoint más importante es el de abonar**, porque debe:
- Actualizar la cuenta
- Restar del método de pago
- Registrar en historial del método
- Cambiar estado a "pagada" si corresponde

**Colección MongoDB:** `cuentas_por_pagar`

**Integración con métodos de pago:** Al abonar, debes registrar la transacción en el historial del método de pago para que aparezca en `/metodos-pago/{id}/historial`

