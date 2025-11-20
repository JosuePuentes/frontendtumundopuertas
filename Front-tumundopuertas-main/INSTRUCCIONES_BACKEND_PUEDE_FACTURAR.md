# Instrucciones Backend - Agregar campo `puedeFacturar` al endpoint `/pedidos/{pedido_id}/pagos`

## Problema Reportado

Los pedidos que están listos para facturar (total == abonado) no están apareciendo en el modal de "Pendientes de Facturar" en el módulo de facturación.

El frontend está calculando `puedeFacturar` localmente, pero necesita que el backend devuelva este campo directamente para mayor confiabilidad.

## Cambio Necesario en el Backend

### Endpoint: `GET /pedidos/{pedido_id}/pagos`

**Archivo:** `api/src/routes/pedidos.py`  
**Función:** `get_pagos_pedido` (alrededor de línea 4198)

**Cambio necesario:**

Agregar el campo `puedeFacturar` a la respuesta del endpoint. Este campo debe ser `true` cuando `total_abonado >= total_pedido` (con una tolerancia de 0.01 para errores de redondeo).

**Código actual (línea ~4242):**
```python
return {
    "pedido_id": pedido_id,
    "historial_pagos": historial_pagos,
    "total_abonado": total_abonado,
    "total_pedido": total_pedido,
    "saldo_pendiente": saldo_pendiente,
    "estado_pago": pedido.get("pago", "")
}
```

**Código corregido:**
```python
# Calcular si puede facturar: total_abonado >= total_pedido (con tolerancia de 0.01)
puede_facturar = total_abonado >= (total_pedido - 0.01)

return {
    "pedido_id": pedido_id,
    "historial_pagos": historial_pagos,
    "total_abonado": total_abonado,
    "total_pedido": total_pedido,
    "saldo_pendiente": saldo_pendiente,
    "puedeFacturar": puede_facturar,  # ← NUEVO CAMPO
    "estado_pago": pedido.get("pago", "")
}
```

## Validaciones

- `puedeFacturar` debe ser `true` cuando `total_abonado >= total_pedido - 0.01`
- `puedeFacturar` debe ser `false` cuando `total_abonado < total_pedido - 0.01`
- La tolerancia de 0.01 es para manejar errores de redondeo en cálculos de punto flotante

## Ejemplo de Respuesta

**Antes:**
```json
{
  "pedido_id": "507f1f77bcf86cd799439011",
  "historial_pagos": [...],
  "total_abonado": 100.00,
  "total_pedido": 100.00,
  "saldo_pendiente": 0.00,
  "estado_pago": "abonado"
}
```

**Después:**
```json
{
  "pedido_id": "507f1f77bcf86cd799439011",
  "historial_pagos": [...],
  "total_abonado": 100.00,
  "total_pedido": 100.00,
  "saldo_pendiente": 0.00,
  "puedeFacturar": true,  // ← NUEVO CAMPO
  "estado_pago": "abonado"
}
```

## Impacto

Una vez implementado este cambio:
- El frontend podrá usar directamente `puedeFacturar` del backend
- Los pedidos listos para facturar aparecerán correctamente en "Pendientes de Facturar"
- El botón "Listo para facturar" se habilitará correctamente cuando `puedeFacturar: true`

## Notas Adicionales

- El cálculo de `total_pedido` ya debe considerar descuentos (ver `INSTRUCCIONES_BACKEND_FACTURACION_PAGOS.md`)
- El cálculo de `total_abonado` ya debe sumar todos los montos de `historial_pagos`
- La tolerancia de 0.01 es importante para evitar problemas de precisión en cálculos de punto flotante

