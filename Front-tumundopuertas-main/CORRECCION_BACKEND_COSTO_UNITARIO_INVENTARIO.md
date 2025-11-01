# CORRECCIÓN BACKEND - Campo Costo en Inventario debe ser Costo Unitario

## Problema Identificado

El backend está sumando el **costo total** (`costo_unitario * cantidad`) al campo `costo` del inventario, cuando en realidad el campo `costo` debe almacenar el **costo unitario** del item.

## Estructura Actual del Inventario

Según la estructura de datos que proporcionaste:

```javascript
{
  _id: "68af08a410b63f047bce95dc",
  codigo: "0003",
  nombre: "PUERTA VICTORIA3 2X1",
  cantidad: 0,      // ← Cantidad de unidades en stock
  costo: 0,        // ← Este campo debe ser COSTO UNITARIO, no total acumulado
  ...
}
```

## ❌ Lo que NO debe hacer

**NO sumar el costo total al campo `costo`:**
```python
# ❌ INCORRECTO
costo_total_del_item = costo_unitario * cantidad  # 100 * 10 = 1000
costo_actual += costo_total_del_item  # Esto daría 1000, 2000, 3000...
```

## ✅ Lo que SÍ debe hacer

El campo `costo` debe almacenar el **costo unitario** del item. Hay dos enfoques:

### Opción 1: Actualizar con el costo unitario más reciente (Recomendado)

Cada vez que se agregue un item desde una cuenta por pagar, actualizar el costo unitario con el valor más reciente:

```python
# Para cada item en la cuenta por pagar
for item in items:
    item_id = item['itemId']
    costo_unitario_nuevo = item['costo']  # ← Costo unitario de esta compra
    cantidad_item = item['cantidad']
    
    # Actualizar inventario
    inventario_collection.update_one(
        {"_id": ObjectId(item_id)},
        {
            "$inc": {
                "cantidad": cantidad_item  # Sumar cantidad: 0 + 10 = 10
            },
            "$set": {
                "costo": costo_unitario_nuevo  # Actualizar costo unitario: 100
            }
        }
    )
```

**Resultado:**
- Cantidad: `0 + 10 = 10` unidades
- Costo: `100` (costo unitario más reciente)

### Opción 2: Promedio Ponderado del Costo Unitario

Calcular el promedio ponderado basado en las cantidades:

```python
for item in items:
    item_id = item['itemId']
    costo_unitario_nuevo = item['costo']
    cantidad_item = item['cantidad']
    
    # Obtener item actual
    item_actual = inventario_collection.find_one({"_id": ObjectId(item_id)})
    cantidad_actual = item_actual.get('cantidad', 0) or 0
    costo_actual = item_actual.get('costo', 0) or 0
    
    # Calcular nuevo costo unitario (promedio ponderado)
    total_cantidad = cantidad_actual + cantidad_item
    if total_cantidad > 0:
        # Promedio ponderado: (costo_actual * cantidad_actual + costo_nuevo * cantidad_nueva) / total
        costo_total_actual = costo_actual * cantidad_actual
        costo_total_nuevo = costo_unitario_nuevo * cantidad_item
        nuevo_costo_unitario = (costo_total_actual + costo_total_nuevo) / total_cantidad
    else:
        nuevo_costo_unitario = costo_unitario_nuevo
    
    # Actualizar inventario
    inventario_collection.update_one(
        {"_id": ObjectId(item_id)},
        {
            "$inc": {
                "cantidad": cantidad_item
            },
            "$set": {
                "costo": nuevo_costo_unitario
            }
        }
    )
```

## Ejemplo con Opción 1 (Costo Más Reciente)

**Estado inicial del inventario:**
```json
{
  "_id": "68af08a410b63f047bce95dc",
  "cantidad": 0,
  "costo": 0
}
```

**Cuenta por pagar:**
```json
{
  "items": [
    {
      "itemId": "68af08a410b63f047bce95dc",
      "costo": 100,      // ← Costo unitario
      "cantidad": 10      // ← 10 unidades
    }
  ],
  "total": 1000          // ← Total: 100 * 10
}
```

**Operación:**
```python
# Sumar cantidad
nueva_cantidad = 0 + 10 = 10

# Actualizar costo unitario
nuevo_costo = 100  # ← Costo unitario, NO 1000
```

**Estado después:**
```json
{
  "_id": "68af08a410b63f047bce95dc",
  "cantidad": 10,        // ✅ Correcto: 10 unidades
  "costo": 100           // ✅ Correcto: costo unitario, NO total
}
```

## Ejemplo con Opción 2 (Promedio Ponderado)

**Estado inicial:**
```json
{
  "cantidad": 5,
  "costo": 80   // ← Ya tiene 5 unidades a $80 c/u
}
```

**Agregar desde cuenta por pagar:**
```json
{
  "costo": 100,
  "cantidad": 10
}
```

**Cálculo:**
```python
costo_total_actual = 80 * 5 = 400
costo_total_nuevo = 100 * 10 = 1000
total_cantidad = 5 + 10 = 15
nuevo_costo_unitario = (400 + 1000) / 15 = 93.33
```

**Estado después:**
```json
{
  "cantidad": 15,
  "costo": 93.33  // ← Promedio ponderado
}
```

## Recomendación

**Usar Opción 1 (Costo Más Reciente)** porque:
- Es más simple
- Refleja el costo de compra más reciente
- Es más fácil de entender y auditar
- Coincide con lo que el usuario espera ver

## Código Correcto para el Backend (Opción 1)

```python
# En el endpoint POST /cuentas-por-pagar
# Después de crear la cuenta, pero antes de retornar la respuesta:

if cuenta_data.get('items') and len(cuenta_data['items']) > 0:
    for item in cuenta_data['items']:
        item_id = item['itemId']
        costo_unitario = item['costo']  # ← Costo POR UNIDAD (ej: 100)
        cantidad_item = item['cantidad']  # ← Cantidad de unidades (ej: 10)
        
        # Actualizar inventario
        inventario_collection.update_one(
            {"_id": ObjectId(item_id)},
            {
                "$inc": {
                    "cantidad": cantidad_item  # Sumar cantidad: +10 unidades
                },
                "$set": {
                    "costo": costo_unitario  # Establecer costo unitario: 100
                }
            }
        )
        
        print(f"📦 Item {item_id}:")
        print(f"   Cantidad: +{cantidad_item} unidades (total ahora)")
        print(f"   Costo unitario actualizado: ${costo_unitario}")
        print(f"   NOTA: Costo total de esta compra = ${costo_unitario * cantidad_item}")
```

## Validación

Después de actualizar, verificar:

```python
item_actualizado = inventario_collection.find_one({"_id": ObjectId(item_id)})
print(f"✅ Item actualizado:")
print(f"   Cantidad: {item_actualizado['cantidad']} unidades")
print(f"   Costo unitario: ${item_actualizado['costo']}")
print(f"   Verificación: El costo debe ser el unitario ({costo_unitario}), no el total ({costo_unitario * cantidad_item})")
```

## Resumen

- ✅ **Sumar:** `cantidad_item` a `cantidad` del inventario
- ✅ **Actualizar:** `costo` con el `costo_unitario` (valor unitario, no total)
- ❌ **NO sumar:** `costo_unitario * cantidad_item` al campo `costo`
- ✅ **El campo `costo`:** Debe representar el costo por unidad, no el costo total acumulado

