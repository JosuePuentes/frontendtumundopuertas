# Instrucciones Backend - Descuento por Item en Pedidos

## Resumen de Cambios Frontend

Se ha agregado la funcionalidad de descuento por item en el componente `CrearPedido.tsx`. Cada item del pedido ahora puede tener un descuento en monto ($) que se resta del precio del item.

## Cambios Realizados en Frontend

1. **Tipo `SelectedItem`**: Se agregó el campo opcional `descuento?: number`
2. **Interfaz `PedidoItem`**: Se agregó el campo opcional `descuento?: number`
3. **Cálculo de totales**: El total de items ahora resta el descuento del precio antes de multiplicar por la cantidad
4. **UI**: Se agregó un campo de input para el descuento que muestra el porcentaje calculado automáticamente
5. **Payload**: El campo `descuento` se envía en cada item del array `items` al crear el pedido

## Estructura del Payload

El backend recibirá en cada item del array `items` el campo `descuento` (opcional):

```json
{
  "items": [
    {
      "id": "...",
      "_id": "...",
      "codigo": "...",
      "nombre": "...",
      "precio": 100.00,
      "descuento": 10.00,  // ← NUEVO CAMPO (opcional)
      "cantidad": 2,
      // ... otros campos
    }
  ]
}
```

## Instrucciones para el Backend

### 1. Actualizar el Modelo de Pedido

En el modelo de Pedido (probablemente en `models/pedido.py` o similar), agregar el campo `descuento` a cada item:

```python
# En el schema/modelo del item dentro del pedido
items = [
    {
        "id": str,
        "codigo": str,
        "nombre": str,
        "precio": float,
        "descuento": float,  # ← NUEVO CAMPO (opcional, default 0)
        "cantidad": int,
        # ... otros campos
    }
]
```

### 2. Validación del Descuento

- El descuento debe ser un número positivo o cero
- El descuento no debe exceder el precio del item (validar: `descuento <= precio`)
- Si no se envía `descuento`, asumir `0`

### 3. Cálculo del Precio Final

Al calcular el total del pedido o el precio de cada item:

```python
# Precio final del item = precio - descuento
precio_final = max(0, precio - (descuento or 0))  # No permitir precios negativos
total_item = precio_final * cantidad
```

### 4. Persistencia en Base de Datos

- Guardar el campo `descuento` en cada item del pedido
- Asegurarse de que se persista correctamente al crear y actualizar pedidos
- Al recuperar pedidos, incluir el campo `descuento` en la respuesta

### 5. Endpoints Afectados

Verificar y actualizar los siguientes endpoints si es necesario:

- `POST /pedidos/` - Crear pedido (recibir `descuento` en items)
- `GET /pedidos/:id` - Obtener pedido (devolver `descuento` en items)
- `PUT /pedidos/:id` - Actualizar pedido (recibir y guardar `descuento`)
- Cualquier endpoint que calcule totales de pedidos

### 6. Cálculo de Totales

Asegurarse de que todos los cálculos de totales consideren el descuento:

```python
# Ejemplo de cálculo de total
total_pedido = sum(
    max(0, (item["precio"] - (item.get("descuento", 0) or 0))) * item["cantidad"]
    for item in pedido["items"]
)
```

### 7. Compatibilidad hacia atrás

- Si un pedido antiguo no tiene el campo `descuento`, asumir `0`
- No romper funcionalidad existente si `descuento` no está presente

## Ejemplo de Item con Descuento

```json
{
  "id": "item123",
  "codigo": "PROD001",
  "nombre": "Producto Ejemplo",
  "precio": 100.00,
  "descuento": 15.00,  // Descuento de $15 (15% del precio)
  "cantidad": 2,
  "costo": 50.00,
  "costoProduccion": 30.00
}
```

**Cálculo:**
- Precio unitario con descuento: $100 - $15 = $85
- Total del item: $85 × 2 = $170
- Porcentaje de descuento: (15 / 100) × 100 = 15%

## Notas Importantes

1. El descuento se aplica **por unidad**, no al total del item
2. El descuento se resta del precio antes de multiplicar por la cantidad
3. El precio final nunca puede ser negativo (usar `max(0, precio - descuento)`)
4. El campo es opcional, si no se envía, el descuento es 0

## Testing

Probar los siguientes casos:

1. ✅ Crear pedido con items sin descuento (compatibilidad)
2. ✅ Crear pedido con items con descuento
3. ✅ Descuento igual al precio (precio final = 0)
4. ✅ Descuento mayor al precio (debe validarse y rechazarse)
5. ✅ Actualizar pedido agregando/modificando descuentos
6. ✅ Verificar que los totales se calculen correctamente con descuentos

