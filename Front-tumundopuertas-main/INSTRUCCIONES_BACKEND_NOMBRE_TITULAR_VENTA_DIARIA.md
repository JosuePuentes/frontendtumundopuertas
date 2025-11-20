# Instrucciones Backend - Nombre del Titular en Resumen Venta Diaria

## Problema Reportado

El nombre del titular que se ingresa en:
1. **CrearPedido**: Cuando se selecciona un método de pago y se agrega un pago
2. **Módulo de Pagos**: Cuando se registra un abono con método de pago

**NO está apareciendo** en el módulo **Resumen Venta Diaria** en la columna "Nombre del Titular".

## Análisis del Frontend

El frontend está enviando correctamente el campo `nombre_quien_envia` en ambos casos:

### 1. CrearPedido.tsx
- Cuando se agrega un pago, se crea un objeto `RegistroPago` con:
  ```typescript
  {
    monto: abono,
    metodo: selectedMetodoPago,
    fecha: new Date().toISOString(),
    estado: 'abonado',
    nombre_quien_envia: nombreTitular.trim()  // ← Se envía aquí
  }
  ```
- Este objeto se agrega al array `historial_pagos` que se envía en el payload del pedido:
  ```json
  {
    "historial_pagos": [
      {
        "fecha": "...",
        "monto": 100.00,
        "metodo": "metodo_id",
        "estado": "abonado",
        "nombre_quien_envia": "Juan Pérez"  // ← Debe guardarse
      }
    ]
  }
  ```

### 2. Módulo de Pagos (Pedidos.tsx)
- Cuando se registra un abono, se envía al endpoint `PATCH /pedidos/{pedido_id}/pago`:
  ```json
  {
    "pago": "abonado",
    "monto": 100.00,
    "metodo": "metodo_id",
    "nombre_quien_envia": "Juan Pérez"  // ← Se envía aquí
  }
  ```

### 3. ResumenVentaDiaria.tsx
- El frontend espera recibir en el endpoint `GET /venta-diaria/`:
  ```json
  {
    "abonos": [
      {
        "pedido_id": "...",
        "cliente_nombre": "...",
        "fecha": "...",
        "monto": 100.00,
        "metodo": "...",
        "descripcion": "...",
        "nombre_quien_envia": "Juan Pérez"  // ← Debe devolverse aquí
      }
    ]
  }
  ```

## Instrucciones para el Backend

### 1. Endpoint POST /pedidos/ (Crear Pedido)

**Archivo:** `api/src/routes/pedidos.py`  
**Función:** `create_pedido`

**Cambio necesario:**

Al guardar el pedido, asegurarse de que el campo `nombre_quien_envia` se guarde en cada elemento del array `historial_pagos`:

```python
# Al procesar historial_pagos del payload
historial_pagos = pedido.get("historial_pagos", [])
for pago in historial_pagos:
    # Asegurarse de que nombre_quien_envia se guarde
    if "nombre_quien_envia" in pago:
        # El campo ya viene del frontend, solo asegurarse de guardarlo
        pass  # MongoDB guardará el campo automáticamente si está en el diccionario
```

**Verificación:**
- Al crear un pedido con pagos, verificar en MongoDB que cada elemento en `historial_pagos` tenga el campo `nombre_quien_envia` guardado.

### 2. Endpoint PATCH /pedidos/{pedido_id}/pago (Registrar Abono)

**Archivo:** `api/src/routes/pedidos.py`  
**Función:** Endpoint que maneja `PATCH /pedidos/{pedido_id}/pago`

**Cambio necesario:**

Al agregar un nuevo pago al historial, asegurarse de incluir el campo `nombre_quien_envia`:

```python
# Al crear el nuevo pago para agregar al historial
nuevo_pago = {
    "fecha": datetime.now().isoformat(),
    "monto": monto,
    "metodo": metodo,
    "estado": "abonado",
    "nombre_quien_envia": datos_pago.get("nombre_quien_envia", "")  # ← IMPORTANTE: Incluir este campo
}

# Agregar al historial_pagos
pedido["historial_pagos"].append(nuevo_pago)
```

**Verificación:**
- Al registrar un abono desde el módulo de Pagos, verificar que el campo `nombre_quien_envia` se guarde en el nuevo elemento del historial.

### 3. Endpoint GET /venta-diaria/ (Resumen Venta Diaria)

**Archivo:** `api/src/routes/pedidos.py`  
**Función:** `get_venta_diaria`

**Cambio necesario:**

En el pipeline de agregación, asegurarse de incluir el campo `nombre_quien_envia` en el `$project`:

```python
pipeline = [
    {"$unwind": "$historial_pagos"},
    {
        "$project": {
            "_id": 0,
            "pedido_id": "$_id",
            "cliente_nombre": "$cliente_nombre",
            "fecha": "$historial_pagos.fecha",
            "monto": "$historial_pagos.monto",
            "metodo": "$historial_pagos.metodo",
            "descripcion": "$historial_pagos.descripcion",
            "nombre_quien_envia": "$historial_pagos.nombre_quien_envia"  # ← AGREGAR ESTA LÍNEA
        }
    },
    {"$sort": {"fecha": -1}},
]
```

**Verificación:**
- Al consultar el endpoint `/venta-diaria/`, verificar que cada elemento en `abonos` incluya el campo `nombre_quien_envia`.

### 4. Normalización de Métodos de Pago

En el endpoint `get_venta_diaria`, después de obtener los abonos, normalizar los métodos de pago para mostrar el nombre en lugar del ID:

```python
# Después de obtener abonos_raw
for abono in abonos_raw:
    metodo_id = abono.get("metodo", "")
    # Convertir ID a nombre si es necesario
    if metodo_id in metodos_pago:
        abono["metodo"] = metodos_pago[metodo_id]
    # Asegurarse de que nombre_quien_envia esté presente
    if "nombre_quien_envia" not in abono:
        abono["nombre_quien_envia"] = ""  # O el valor por defecto que prefieras
```

## Estructura Esperada en MongoDB

Cada pedido debe tener `historial_pagos` con esta estructura:

```json
{
  "_id": ObjectId("..."),
  "cliente_id": "...",
  "cliente_nombre": "...",
  "historial_pagos": [
    {
      "fecha": "2024-01-15T10:30:00.000Z",
      "monto": 100.00,
      "metodo": "metodo_id_o_nombre",
      "estado": "abonado",
      "descripcion": "Pago inicial",
      "nombre_quien_envia": "Juan Pérez"  // ← Campo requerido
    },
    {
      "fecha": "2024-01-20T14:00:00.000Z",
      "monto": 50.00,
      "metodo": "otro_metodo_id",
      "estado": "abonado",
      "nombre_quien_envia": "María González"  // ← Campo requerido
    }
  ]
}
```

## Validación

Para verificar que todo funciona correctamente:

1. **Crear un pedido desde CrearPedido con un pago:**
   - Verificar en MongoDB que el pedido tenga `historial_pagos[0].nombre_quien_envia` guardado
   - Consultar `/venta-diaria/` y verificar que el abono muestre el nombre del titular

2. **Registrar un abono desde el módulo de Pagos:**
   - Verificar en MongoDB que el nuevo elemento en `historial_pagos` tenga `nombre_quien_envia` guardado
   - Consultar `/venta-diaria/` y verificar que el abono muestre el nombre del titular

3. **Verificar Resumen Venta Diaria:**
   - Consultar `/venta-diaria/?fecha_inicio=2024-01-01&fecha_fin=2024-12-31`
   - Verificar que cada elemento en `abonos` tenga el campo `nombre_quien_envia` con el valor correcto

## Notas Importantes

1. El campo `nombre_quien_envia` es **opcional** en el frontend (puede ser `undefined`), pero cuando se envía, **debe guardarse** en el backend.

2. Si un pago antiguo no tiene `nombre_quien_envia`, el frontend mostrará "-" (guion) en lugar del nombre.

3. El campo debe ser una **cadena de texto** (string), no un número ni un objeto.

4. Asegurarse de que el campo se **trimme** (elimine espacios al inicio y final) antes de guardarlo, aunque el frontend ya lo hace.

## Ejemplo de Respuesta Correcta del Endpoint /venta-diaria/

```json
{
  "total_ingresos": 150.00,
  "ingresos_por_metodo": {
    "Transferencia": 100.00,
    "Efectivo": 50.00
  },
  "abonos": [
    {
      "pedido_id": "507f1f77bcf86cd799439011",
      "cliente_nombre": "Cliente Ejemplo",
      "fecha": "2024-01-15T10:30:00.000Z",
      "monto": 100.00,
      "metodo": "Transferencia",
      "descripcion": "Pago inicial",
      "nombre_quien_envia": "Juan Pérez"  // ← Debe estar presente
    },
    {
      "pedido_id": "507f1f77bcf86cd799439012",
      "cliente_nombre": "Otro Cliente",
      "fecha": "2024-01-20T14:00:00.000Z",
      "monto": 50.00,
      "metodo": "Efectivo",
      "descripcion": "",
      "nombre_quien_envia": "María González"  // ← Debe estar presente
    }
  ]
}
```

