# CORRECCIÓN BACKEND - Suma de Costo en Inventario

## Problema Identificado

El backend está sumando el **total de la cuenta por pagar** en el campo `costo` del inventario, cuando debería sumar el **costo unitario del item multiplicado por la cantidad**.

## Estructura de Datos que Envía el Frontend

Cuando se crea una cuenta por pagar con items, el frontend envía:

```json
{
  "proveedor": { ... },
  "items": [
    {
      "itemId": "68af08a410b63f047bce95dc",
      "codigo": "0003",
      "nombre": "PUERTA VICTORIA3 2X1",
      "costo": 150,        // ← ESTE ES EL COSTO UNITARIO (por unidad)
      "cantidad": 5        // ← CANTIDAD de unidades
    }
  ],
  "total": 750,            // ← ESTE ES EL TOTAL DE LA CUENTA (150 * 5)
  ...
}
```

## ❌ Lo que NO debe hacer

**NO usar el campo `total` de la cuenta por pagar para actualizar el costo del inventario.**

El campo `total` es la suma de todos los items (o el monto total de la cuenta), NO el costo unitario.

## ✅ Lo que SÍ debe hacer

Para cada item en `items[]`, debe:

1. **Obtener el item actual del inventario:**
   ```python
   item_actual = inventario_collection.find_one({"_id": ObjectId(item['itemId'])})
   cantidad_actual = item_actual.get('cantidad', 0) or 0
   costo_actual = item_actual.get('costo', 0) or 0
   ```

2. **Calcular el costo total del item que se está agregando:**
   ```python
   costo_unitario = item['costo']  # ← Costo por unidad que el usuario ingresó
   cantidad_item = item['cantidad']  # ← Cantidad de unidades
   costo_total_del_item = costo_unitario * cantidad_item  # ← 150 * 5 = 750
   ```

3. **Actualizar el inventario SUMANDO:**
   ```python
   inventario_collection.update_one(
       {"_id": ObjectId(item['itemId'])},
       {
           "$inc": {
               "cantidad": cantidad_item,              # Sumar cantidad: 0 + 5 = 5
               "costo": costo_total_del_item           # Sumar costo: 0 + 750 = 750
           }
       }
   )
   ```

## Ejemplo Completo

**Item en la cuenta por pagar:**
```json
{
  "itemId": "68af08a410b63f047bce95dc",
  "codigo": "0003",
  "nombre": "PUERTA VICTORIA3 2X1",
  "costo": 150,      // Costo unitario
  "cantidad": 5      // 5 unidades
}
```

**Estado actual del inventario:**
```json
{
  "_id": "68af08a410b63f047bce95dc",
  "cantidad": 0,
  "costo": 0
}
```

**Cálculo:**
```python
costo_unitario = 150
cantidad_item = 5
costo_total_del_item = 150 * 5 = 750

nueva_cantidad = 0 + 5 = 5
nuevo_costo = 0 + 750 = 750
```

**Estado después de actualizar:**
```json
{
  "_id": "68af08a410b63f047bce95dc",
  "cantidad": 5,     // ✅ Correcto
  "costo": 750       // ✅ Correcto (150 * 5)
}
```

## Código Correcto para el Backend

```python
# En el endpoint POST /cuentas-por-pagar
# Después de crear la cuenta, pero antes de retornar la respuesta:

if cuenta_data.get('items') and len(cuenta_data['items']) > 0:
    for item in cuenta_data['items']:
        item_id = item['itemId']
        costo_unitario = item['costo']  # ← Costo POR UNIDAD
        cantidad_item = item['cantidad']
        
        # Calcular costo total del item
        costo_total_del_item = costo_unitario * cantidad_item
        
        # Actualizar inventario usando $inc
        inventario_collection.update_one(
            {"_id": ObjectId(item_id)},
            {
                "$inc": {
                    "cantidad": cantidad_item,          # Sumar cantidad
                    "costo": costo_total_del_item       # Sumar costo TOTAL del item (unitario * cantidad)
                }
            }
        )
        
        print(f"📦 Item {item_id}:")
        print(f"   Cantidad: +{cantidad_item} unidades")
        print(f"   Costo unitario: ${costo_unitario}")
        print(f"   Costo total agregado: ${costo_total_del_item} (${costo_unitario} * {cantidad_item})")
```

## Validación

Después de actualizar, verificar que el cálculo sea correcto:

```python
item_actualizado = inventario_collection.find_one({"_id": ObjectId(item_id)})
print(f"✅ Item actualizado:")
print(f"   Cantidad final: {item_actualizado['cantidad']}")
print(f"   Costo final: {item_actualizado['costo']}")
print(f"   Verificación: {costo_total_del_item} fue sumado correctamente")
```

## Resumen

- ✅ **Sumar:** `cantidad_item` a `cantidad` del inventario
- ✅ **Sumar:** `costo_unitario * cantidad_item` a `costo` del inventario
- ❌ **NO sumar:** El campo `total` de la cuenta por pagar
- ✅ **Usar:** `item['costo'] * item['cantidad']` para cada item individual

## Nota Importante

Si una cuenta por pagar tiene múltiples items, debe hacer este proceso **para cada item**:

```python
# Ejemplo con múltiples items
items = [
    {"itemId": "id1", "costo": 100, "cantidad": 2},  # Agregar 200 al costo
    {"itemId": "id2", "costo": 50, "cantidad": 3}   # Agregar 150 al costo
]

# Total de la cuenta = 200 + 150 = 350
# Pero cada item actualiza su propio inventario:
# - Item id1: cantidad += 2, costo += 200
# - Item id2: cantidad += 3, costo += 150
```

