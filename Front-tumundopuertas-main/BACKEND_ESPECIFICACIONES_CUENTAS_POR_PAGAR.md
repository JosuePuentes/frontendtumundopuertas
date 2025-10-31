# Especificaciones Backend - Módulo Cuentas por Pagar

## Endpoints Requeridos

### 1. GET `/cuentas-por-pagar`
Obtiene todas las cuentas por pagar.

**Respuesta esperada:**
```json
[
  {
    "_id": "string",
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
    "descripcion": "string (opcional si hay items)",
    "monto": "number (opcional si hay items)",
    "total": "number",
    "montoAbonado": "number",
    "saldoPendiente": "number",
    "estado": "pendiente" | "pagada",
    "fechaCreacion": "string (ISO 8601)",
    "historialAbonos": [
      {
        "fecha": "string (ISO 8601)",
        "monto": "number",
        "metodoPago": "string (ID del método)",
        "metodoPagoNombre": "string (nombre del método)"
      }
    ]
  }
]
```

### 2. POST `/cuentas-por-pagar`
Crea una nueva cuenta por pagar.

**Body:**
```json
{
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
      "cantidad": "number"
    }
  ],
  "descripcion": "string (opcional si hay items)",
  "monto": "number (opcional si hay items)",
  "total": "number",
  "montoAbonado": 0,
  "saldoPendiente": "number (igual a total)",
  "estado": "pendiente"
}
```

**Validaciones:**
- Debe tener items O (descripcion Y monto)
- total debe ser igual a la suma de items o al monto
- proveedor.nombre y proveedor.rif son requeridos

**Respuesta:** Cuenta creada con _id generado

### 3. POST `/cuentas-por-pagar/{id}/abonar`
Registra un abono a una cuenta por pagar.

**Body:**
```json
{
  "monto": "number",
  "metodo_pago_id": "string"
}
```

**Proceso:**
1. Validar que la cuenta existe y está en estado "pendiente"
2. Validar que el monto > 0 y <= saldoPendiente
3. Validar que el método de pago existe
4. Validar que el saldo del método de pago >= monto
5. Actualizar cuenta:
   - Incrementar montoAbonado
   - Reducir saldoPendiente
   - Agregar registro al historialAbonos con fecha, monto, metodoPago (ID y nombre)
   - Si saldoPendiente == 0, cambiar estado a "pagada"
6. Actualizar método de pago:
   - Reducir saldo del método de pago (restar monto)
   - Registrar transacción en historial del método de pago con:
     - tipo: "transferir" (o "pago" si tienes ese tipo)
     - monto: monto (negativo o positivo según tu lógica)
     - concepto: "Abono a cuenta por pagar - {nombre_proveedor} - #{id_cuenta}"
     - fecha: fecha actual

**Respuesta:** Cuenta actualizada

### 4. GET `/cuentas-por-pagar/{id}`
Obtiene una cuenta por pagar por ID.

**Respuesta:** Objeto de cuenta por pagar

## Estructura de Base de Datos (MongoDB)

**Colección: `cuentas_por_pagar`**

```javascript
{
  _id: ObjectId,
  proveedor: {
    nombre: String,
    rif: String,
    telefono: String
  },
  items: [  // Opcional
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
  total: Number,
  montoAbonado: Number,
  saldoPendiente: Number,
  estado: String,  // "pendiente" o "pagada"
  fechaCreacion: Date,
  historialAbonos: [  // Array que crece con cada abono
    {
      fecha: Date,
      monto: Number,
      metodoPago: String,  // ID del método
      metodoPagoNombre: String
    }
  ]
}
```

## Integración con Métodos de Pago

Cuando se registra un abono:
1. El saldo del método de pago seleccionado debe reducirse
2. Debe crearse un registro en el historial de transacciones del método de pago
3. El tipo de transacción debe ser "transferir" o "pago" (según tu sistema)
4. El concepto debe incluir información de la cuenta por pagar

**Ejemplo de registro en historial:**
```javascript
{
  tipo: "transferir",
  monto: 100.00,
  concepto: "Abono a cuenta por pagar - PROVEEDOR XYZ - #abc123",
  fecha: new Date()
}
```

## Notas Importantes

1. **Actualización de Inventario:** El frontend actualiza el inventario directamente al crear la cuenta con items. El backend NO debe hacer esto, solo guardar la cuenta.

2. **Cambio de Estado:** Cuando `saldoPendiente` llega a 0 después de un abono, automáticamente cambiar `estado` a "pagada".

3. **Historial de Abonos:** Cada abono debe agregarse al array `historialAbonos` con toda la información necesaria.

4. **Sincronización:** Asegurar que las actualizaciones de saldo del método de pago y el registro en historial sean atómicas (transacción si es posible).

