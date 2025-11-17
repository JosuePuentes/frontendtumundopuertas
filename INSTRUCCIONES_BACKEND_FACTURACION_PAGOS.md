# Instrucciones Backend - Correcciones para Facturación y Pagos

## Problemas Reportados

1. El nombre del titular no aparece en resumen-venta-diaria
2. En el módulo de facturación no aparecen los pagos que se están haciendo por el módulo de pagos
3. El botón "pendiente pago" en el módulo de facturación debe mostrar el total ya con descuento (monto total)
4. Cuando se abone por el módulo pagos, el botón debe habilitarse sumando los pagos
5. Las facturas procesadas no están cargando

---

## Cambios Necesarios en el Backend

### 1. Actualizar endpoint `/pedidos/{pedido_id}/pagos` para considerar descuentos

**Archivo:** `api/src/routes/pedidos.py`  
**Función:** `get_pagos_pedido` (alrededor de línea 4198)

**Cambio necesario:**

El cálculo de `total_pedido` actualmente NO considera los descuentos en los items. Necesitas modificar el cálculo para que considere el campo `descuento` de cada item.

**Código actual (línea ~4223):**
```python
# Calcular total del pedido (items + adicionales)
total_items = sum(item.get("precio", 0) * item.get("cantidad", 0) for item in pedido.get("items", []))
```

**Código corregido:**
```python
# Calcular total del pedido (items + adicionales) considerando descuentos
total_items = 0
for item in pedido.get("items", []):
    precio_base = item.get("precio", 0)
    descuento = item.get("descuento", 0)  # Obtener descuento del item
    precio_con_descuento = max(0, precio_base - descuento)  # Precio final después del descuento
    cantidad = item.get("cantidad", 0)
    total_items += precio_con_descuento * cantidad

# Calcular total de adicionales (sin cambios)
adicionales = pedido.get("adicionales", [])
if not isinstance(adicionales, list):
    adicionales = []
total_adicionales = sum(
    (ad.get("precio", 0) * (ad.get("cantidad", 1)) for ad in adicionales)
)

total_pedido = total_items + total_adicionales
```

**¿Por qué?**  
El frontend en el módulo de facturación calcula el `montoTotal` considerando descuentos. Si el backend no lo hace, habrá inconsistencias y el botón "Pendiente pago" mostrará un monto incorrecto.

---

### 2. Verificar que el endpoint de venta-diaria devuelve `nombre_quien_envia`

**Archivo:** `api/src/routes/pedidos.py`  
**Función:** Endpoint de venta diaria (alrededor de línea 3705)

**Verificación:**

El código ya incluye `nombre_quien_envia` en el pipeline de agregación (línea ~3705):
```python
"nombre_quien_envia": "$historial_pagos.nombre_quien_envia"
```

Y también en el procesamiento de abonos (línea ~3847):
```python
"nombre_quien_envia": abono.get("nombre_quien_envia", "")
```

**Acción:** Solo verifica que estos campos estén presentes. Si ya están, no necesitas hacer cambios.

---

### 3. Crear endpoints para Facturas Confirmadas (Facturas Procesadas)

**Problema:** Las facturas procesadas no están cargando porque el endpoint `/facturas-confirmadas` no existe.

**Archivo:** Crear nuevo archivo `api/src/routes/facturas_confirmadas.py` o agregar a `api/src/routes/pedidos.py`

**Endpoints requeridos:**

#### 3.1. GET `/facturas-confirmadas`
**Descripción:** Obtiene todas las facturas confirmadas/procesadas

**Respuesta esperada:**
```json
[
  {
    "_id": "string",
    "pedidoId": "string",
    "numeroFactura": "string",
    "clienteNombre": "string",
    "clienteId": "string",
    "montoTotal": "number",
    "fechaCreacion": "string (ISO 8601)",
    "fechaFacturacion": "string (ISO 8601)",
    "items": [...]
  }
]
```

**Orden:** Ordenar por `fechaFacturacion` descendente (más reciente primero)

#### 3.2. POST `/facturas-confirmadas`
**Descripción:** Guarda una nueva factura confirmada

**Body:**
```json
{
  "pedidoId": "string",
  "numeroFactura": "string",
  "clienteNombre": "string",
  "clienteId": "string",
  "montoTotal": "number",
  "fechaCreacion": "string (ISO 8601)",
  "fechaFacturacion": "string (ISO 8601)",
  "items": [...]
}
```

**Validaciones:**
- `pedidoId` es requerido
- Si ya existe una factura con ese `pedidoId`, actualizar la existente (upsert)

#### 3.3. DELETE `/facturas-confirmadas/{pedidoId}` (Opcional)
**Descripción:** Elimina una factura confirmada por pedidoId

**Parámetros:**
- `pedidoId`: ID del pedido

**Colección MongoDB:** `facturas_confirmadas`

**Índice recomendado:**
```javascript
db.facturas_confirmadas.createIndex({ "pedidoId": 1 }, { unique: true });
db.facturas_confirmadas.createIndex({ "fechaFacturacion": -1 });
```

**Nota:** Ver especificaciones completas en `ESPECIFICACIONES_BACKEND_FACTURAS_Y_PEDIDOS.md`

---

### 4. Registrar el router de facturas confirmadas en el main

**Archivo:** `api/src/main.py` (o donde se registren los routers)

**Acción:** Si creaste un nuevo archivo `facturas_confirmadas.py`, asegúrate de registrar el router:

```python
from .routes import facturas_confirmadas

app.include_router(facturas_confirmadas.router, prefix="/facturas-confirmadas", tags=["facturas-confirmadas"])
```

O si lo agregaste a `pedidos.py`, verifica que el router esté incluido.

---

## Resumen de Cambios

1. ✅ **Frontend:** Ya actualizado - emite evento `pagoRealizado` cuando se registra un pago
2. ⚠️ **Backend:** Actualizar cálculo de `total_pedido` en `/pedidos/{pedido_id}/pagos` para considerar descuentos
3. ⚠️ **Backend:** Crear endpoints `/facturas-confirmadas` (GET, POST, DELETE)
4. ✅ **Backend:** Verificar que `nombre_quien_envia` se devuelve en venta-diaria (ya está implementado)

---

## Orden de Implementación Recomendado

1. Primero: Actualizar el cálculo de `total_pedido` con descuentos (cambio rápido, impacto inmediato)
2. Segundo: Crear endpoints de facturas confirmadas (requiere más trabajo pero resuelve el problema de facturas procesadas)
3. Tercero: Verificar que todo funciona correctamente

---

## Notas Importantes

- El frontend ya está preparado para recibir estos cambios
- Los cambios en el frontend NO requieren cambios en el backend para funcionar (excepto los endpoints de facturas confirmadas)
- El evento `pagoRealizado` que emite el frontend permite que el módulo de facturación se actualice automáticamente cuando se registra un pago

