# Instrucciones Backend - Sistema de Abonos Pendientes

## Descripción General

El frontend requiere que el backend implemente un sistema de aprobación de abonos pendientes para pedidos. Cuando un cliente envía un pedido con un pago inicial o realiza un abono adicional, estos aparecen como "pendientes" hasta que un administrador los apruebe.

## Endpoints Requeridos

### 1. POST `/pedidos/{pedido_id}/abono/{index}/aprobar`

**Descripción:** Aprueba un abono pendiente específico de un pedido, actualizando el `total_abonado` y el `saldo_pendiente` de la factura asociada.

**Headers:**
```
Authorization: Bearer {token_admin}
Content-Type: application/json
```

**Parámetros:**
- `pedido_id`: ID del pedido (ObjectId)
- `index`: Índice del abono en el array `historial_pagos` o `historial_abonos` (integer)

**Proceso:**

1. **Validar pedido:**
   - Verificar que el pedido existe
   - Verificar que el usuario tiene permisos de administrador

2. **Obtener el abono:**
   - Buscar el abono en `pedido.historial_pagos[index]` o en `factura.historial_abonos[index]`
   - Verificar que el abono existe
   - Verificar que `abono.estado === "pendiente"` o que `abono.estado` no esté definido

3. **Actualizar el estado del abono:**
   ```javascript
   abono.estado = "confirmado"  // o "aprobado"
   abono.fecha_aprobacion = new Date().toISOString()
   ```

4. **Obtener o crear la factura asociada:**
   - Si el pedido tiene una factura asociada, obtenerla
   - Si no, crear una nueva factura con:
     - `numero_factura`: Generar número único
     - `pedidoId`: ID del pedido
     - `monto_total`: `pedido.total`
     - `monto_abonado`: Sumar el monto del abono aprobado
     - `saldo_pendiente`: `monto_total - monto_abonado`
     - `historial_abonos`: Incluir el abono aprobado

5. **Actualizar la factura:**
   ```javascript
   nuevo_monto_abonado = factura.monto_abonado + abono.cantidad
   nuevo_saldo_pendiente = factura.monto_total - nuevo_monto_abonado
   
   // Si el saldo pendiente llega a 0 o menos, cambiar estado a "pagada"
   nuevo_estado = (nuevo_saldo_pendiente <= 0) ? "pagada" : "parcial"
   
   factura.update({
     "$inc": {
       "monto_abonado": abono.cantidad
     },
     "$set": {
       "saldo_pendiente": nuevo_saldo_pendiente,
       "estado": nuevo_estado,
       "historial_abonos.$[elem].estado": "confirmado",
       "historial_abonos.$[elem].fecha_aprobacion": new Date().toISOString()
     }
   }, {
     arrayFilters: [{"elem.estado": "pendiente"}]
   })
   ```

6. **Actualizar el pedido:**
   ```javascript
   pedido.update({
     "$set": {
       "historial_pagos.$[elem].estado": "confirmado",
       "historial_pagos.$[elem].fecha_aprobacion": new Date().toISOString(),
       "total_abonado": nuevo_monto_abonado
     }
   }, {
     arrayFilters: [{"elem.estado": "pendiente"}]
   })
   ```

7. **Actualizar método de pago (si aplica):**
   - Si el abono tiene un `metodo_pago_id`, actualizar el saldo del método de pago:
   ```javascript
   metodo_pago.update({
     "$inc": {
       "saldo": abono.cantidad
     }
   })
   
   // Crear transacción en el historial del método de pago
   transacciones_collection.insert_one({
     metodo_pago_id: abono.metodo_pago_id,
     tipo: "deposito",
     monto: abono.cantidad,
     concepto: `Abono aprobado - Pedido ${pedido_id}`,
     fecha: new Date(),
     saldo_despues: metodo_pago.saldo + abono.cantidad
   })
   ```

**Respuesta exitosa (200):**
```json
{
  "mensaje": "Abono aprobado exitosamente",
  "factura": {
    "_id": "...",
    "numero_factura": "F-20250115-000001",
    "monto_total": 500.00,
    "monto_abonado": 150.00,
    "saldo_pendiente": 350.00,
    "estado": "parcial",
    "historial_abonos": [...]
  },
  "pedido": {
    "_id": "...",
    "total_abonado": 150.00,
    "historial_pagos": [...]
  }
}
```

**Errores posibles:**
- 400: El abono ya está aprobado o el índice es inválido
- 401: No autorizado
- 404: Pedido o abono no encontrado
- 500: Error interno del servidor

---

### 2. POST `/pedidos/{pedido_id}/abono`

**Descripción:** Permite a un administrador agregar un nuevo abono a un pedido que ya tiene una factura asociada.

**Headers:**
```
Authorization: Bearer {token_admin}
Content-Type: application/json
```

**Body:**
```json
{
  "cantidad": 150.00,
  "metodo_pago_id": "507f1f77bcf86cd799439022",
  "numero_referencia": "REF123456",
  "comprobante_url": "https://storage.example.com/comprobantes/abc123.png"
}
```

**Proceso:**

1. **Validar pedido y factura:**
   - Verificar que el pedido existe
   - Verificar que tiene una factura asociada
   - Verificar que `factura.saldo_pendiente >= cantidad`

2. **Crear el abono pendiente:**
   ```javascript
   nuevo_abono = {
     fecha: new Date().toISOString(),
     cantidad: cantidad,
     metodo_pago_id: metodo_pago_id,
     metodo_pago: nombre_del_metodo,
     numero_referencia: numero_referencia,
     comprobante_url: comprobante_url,
     estado: "pendiente"
   }
   ```

3. **Agregar a historial de abonos (sin sumar al monto_abonado aún):**
   ```javascript
   factura.update({
     "$push": {
       "historial_abonos": nuevo_abono
     }
   })
   ```

4. **Agregar a historial de pagos del pedido:**
   ```javascript
   pedido.update({
     "$push": {
       "historial_pagos": nuevo_abono
     }
   })
   ```

**Respuesta exitosa (200):**
```json
{
  "mensaje": "Abono pendiente agregado exitosamente",
  "abono": nuevo_abono,
  "factura": {
    "saldo_pendiente": 350.00,
    "historial_abonos": [...]
  }
}
```

---

## Estructura de Datos

### Pedido (`pedidos_cliente` o `pedidos` collection)

```javascript
{
  _id: ObjectId("..."),
  cliente_id: "...",
  total: 500.00,
  total_abonado: 0.00,  // Se actualiza cuando se aprueba un abono
  historial_pagos: [
    {
      fecha: "2025-01-15T10:30:00Z",
      cantidad: 150.00,
      metodo_pago: "transferencia",
      metodo_pago_id: "...",
      numero_referencia: "REF123",
      comprobante_url: "...",
      estado: "pendiente"  // "pendiente", "confirmado", "rechazado"
    }
  ],
  monto_pago_inicial: 150.00,  // Nuevo campo para el monto del pago inicial
  ...
}
```

### Factura (`facturas_confirmadas` collection)

```javascript
{
  _id: ObjectId("..."),
  pedidoId: "...",
  numero_factura: "F-20250115-000001",
  monto_total: 500.00,
  monto_abonado: 0.00,  // Solo suma cuando se aprueban abonos
  saldo_pendiente: 500.00,
  estado: "pendiente",  // "pendiente", "parcial", "pagada"
  historial_abonos: [
    {
      fecha: "2025-01-15T10:30:00Z",
      cantidad: 150.00,
      metodo_pago: "transferencia",
      metodo_pago_id: "...",
      numero_referencia: "REF123",
      comprobante_url: "...",
      estado: "pendiente",  // "pendiente", "confirmado", "rechazado"
      fecha_aprobacion: null  // Se llena cuando se aprueba
    }
  ],
  ...
}
```

---

## Flujo Completo

1. **Cliente envía pedido con pago inicial:**
   - El pedido se crea con `historial_pagos[0]` con `estado: "pendiente"`
   - El campo `monto_pago_inicial` contiene el monto
   - `total_abonado` = 0 (aún no se ha aprobado)

2. **Admin ve el pedido en `/pedidos-web`:**
   - Si el pedido cambia a "en proceso", se crea la factura (si no existe)
   - La factura se crea con el abono inicial en `historial_abonos[0]` con `estado: "pendiente"`
   - `monto_abonado` = 0 (aún no se ha aprobado)

3. **Admin aprueba el abono:**
   - Se llama `POST /pedidos/{pedido_id}/abono/{index}/aprobar`
   - El abono cambia de `estado: "pendiente"` a `estado: "confirmado"`
   - Se suma `cantidad` a `monto_abonado` y `total_abonado`
   - Se resta `cantidad` de `saldo_pendiente`
   - Si hay `metodo_pago_id`, se actualiza el saldo del método de pago

4. **Si hay saldo pendiente, admin puede agregar más abonos:**
   - Se llama `POST /pedidos/{pedido_id}/abono`
   - El nuevo abono se agrega con `estado: "pendiente"`
   - Luego se puede aprobar usando el endpoint de aprobación

---

## Notas Importantes

1. **Estado del abono:**
   - `"pendiente"`: El abono está esperando aprobación
   - `"confirmado"` o `"aprobado"`: El abono ha sido aprobado y ya cuenta para el `monto_abonado`
   - `"rechazado"`: El abono fue rechazado (opcional)

2. **Actualización atómica:**
   - Las actualizaciones de factura, pedido y método de pago deben ser atómicas (usar transacciones si es posible)

3. **Validaciones:**
   - No se puede aprobar un abono que ya está aprobado
   - El índice del abono debe ser válido
   - El monto del abono debe ser válido (> 0)

4. **Método de pago:**
   - Si el abono tiene un `metodo_pago_id`, actualizar el saldo del método de pago
   - Crear una transacción en `transacciones_collection` para el historial

---

## Endpoint Adicional Recomendado

### GET `/pedidos/{pedido_id}/abonos/pendientes`

**Descripción:** Obtiene todos los abonos pendientes de un pedido.

**Respuesta:**
```json
{
  "abonos_pendientes": [
    {
      "index": 0,
      "fecha": "2025-01-15T10:30:00Z",
      "cantidad": 150.00,
      "metodo_pago": "transferencia",
      "numero_referencia": "REF123",
      "comprobante_url": "...",
      "estado": "pendiente"
    }
  ],
  "total_pendiente": 150.00
}
```

Este endpoint puede ser útil para mostrar un resumen rápido de abonos pendientes sin cargar toda la factura.

