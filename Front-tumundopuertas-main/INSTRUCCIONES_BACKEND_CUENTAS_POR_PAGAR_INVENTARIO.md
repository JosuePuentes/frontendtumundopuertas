# Instrucciones Backend - Actualización de Inventario y Abonos en Cuentas por Pagar

## Problema Identificado

1. **Abonos no se están sumando correctamente**: El saldo se rebaja pero `montoAbonado` no refleja la suma total de los abonos del historial.
2. **Inventario no se actualiza**: Cuando se crea una cuenta por pagar con items, las cantidades y costos no se suman al inventario.

## Solución Requerida en el Backend

### 1. Endpoint POST `/cuentas-por-pagar` - Actualización de Inventario

**Cuando se crea una cuenta por pagar con items, el backend DEBE:**

1. **Para cada item en la cuenta:**
   - Obtener el item actual del inventario usando `itemId`
   - **SUMAR** la cantidad: `cantidad_nueva = cantidad_actual + cantidad_del_item`
   - **SUMAR** el costo: `costo_nuevo = costo_actual + (costo_del_item * cantidad_del_item)`

**Ejemplo de lógica Python/Python:**

```python
# Para cada item en la cuenta por pagar
for item in items:
    item_id = item['itemId']
    cantidad_a_sumar = item['cantidad']
    costo_unitario = item['costo']
    costo_total_item = costo_unitario * cantidad_a_sumar
    
    # Obtener item actual del inventario
    item_actual = inventario_collection.find_one({"_id": ObjectId(item_id)})
    
    if item_actual:
        # SUMAR cantidades
        nueva_cantidad = (item_actual.get('cantidad', 0) or 0) + cantidad_a_sumar
        
        # SUMAR costos (costo total del item agregado)
        costo_actual = item_actual.get('costo', 0) or 0
        nuevo_costo = costo_actual + costo_total_item
        
        # Actualizar el inventario
        inventario_collection.update_one(
            {"_id": ObjectId(item_id)},
            {
                "$set": {
                    "cantidad": nueva_cantidad,
                    "costo": nuevo_costo
                }
            }
        )
    else:
        # Manejar error: item no encontrado
        raise ValueError(f"Item {item_id} no encontrado en inventario")
```

**Importante:**
- ✅ Usar `$inc` de MongoDB para sumar (más seguro en concurrencia):
  ```python
  inventario_collection.update_one(
      {"_id": ObjectId(item_id)},
      {
          "$inc": {
              "cantidad": cantidad_a_sumar,
              "costo": costo_total_item  # costo_unitario * cantidad
          }
      }
  )
  ```

---

### 2. Endpoint POST `/cuentas-por-pagar/{id}/abonar` - Suma de Abonos

**El backend DEBE actualizar correctamente `montoAbonado` sumando cada abono:**

**Proceso correcto:**

```python
# 1. Obtener la cuenta actual
cuenta = cuentas_por_pagar_collection.find_one({"_id": ObjectId(id)})

monto_actual_abonado = cuenta.get('montoAbonado', 0) or 0
saldo_actual = cuenta.get('saldoPendiente', 0) or 0
monto_nuevo_abono = monto  # del body

# 2. Calcular nuevos valores
nuevo_monto_abonado = monto_actual_abonado + monto_nuevo_abono
nuevo_saldo_pendiente = saldo_actual - monto_nuevo_abono

# 3. Obtener nombre del método de pago
metodo_pago = metodos_pago_collection.find_one({"_id": ObjectId(metodo_pago_id)})
nombre_metodo = metodo_pago.get('nombre', 'N/A') if metodo_pago else 'N/A'

# 4. Crear registro de abono
nuevo_abono = {
    "fecha": datetime.utcnow().isoformat(),
    "monto": monto_nuevo_abono,
    "metodoPago": metodo_pago_id,
    "metodoPagoNombre": nombre_metodo
}

# 5. Actualizar la cuenta
nuevo_estado = "pagada" if nuevo_saldo_pendiente == 0 else "pendiente"

cuentas_por_pagar_collection.update_one(
    {"_id": ObjectId(id)},
    {
        "$set": {
            "montoAbonado": nuevo_monto_abonado,  # IMPORTANTE: Sumar correctamente
            "saldoPendiente": nuevo_saldo_pendiente,
            "estado": nuevo_estado
        },
        "$push": {
            "historialAbonos": nuevo_abono
        }
    }
)
```

**Usando $inc (más seguro):**

```python
# Actualizar usando $inc para montoAbonado (sumar)
# y $set para saldoPendiente y estado
cuentas_por_pagar_collection.update_one(
    {"_id": ObjectId(id)},
    {
        "$inc": {
            "montoAbonado": monto_nuevo_abono  # Esto suma automáticamente
        },
        "$set": {
            "saldoPendiente": nuevo_saldo_pendiente,
            "estado": nuevo_estado
        },
        "$push": {
            "historialAbonos": nuevo_abono
        }
    }
)
```

**IMPORTANTE - Verificación de datos:**

Asegúrate de que cuando se retorna la cuenta después de abonar, los valores sean correctos:

```python
cuenta_actualizada = cuentas_por_pagar_collection.find_one({"_id": ObjectId(id)})

# Verificar que montoAbonado sea la suma de todos los abonos
suma_historial = sum(abono.get('monto', 0) for abono in cuenta_actualizada.get('historialAbonos', []))
monto_abonado_guardado = cuenta_actualizada.get('montoAbonado', 0)

# Si no coinciden, corregir (solo para debugging)
if abs(suma_historial - monto_abonado_guardado) > 0.01:  # Tolerancia para decimales
    print(f"⚠️ ADVERTENCIA: montoAbonado ({monto_abonado_guardado}) no coincide con suma de historial ({suma_historial})")
    # Corregir si es necesario
    cuentas_por_pagar_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"montoAbonado": suma_historial}}
    )
```

---

## Resumen de Cambios Necesarios en el Backend

### Endpoint: `POST /cuentas-por-pagar`

**Después de crear la cuenta, pero ANTES de retornar la respuesta:**

1. Si `items` existe y tiene elementos:
   ```python
   for item in items:
       item_id = item['itemId']
       cantidad = item['cantidad']
       costo_unitario = item['costo']
       costo_total = costo_unitario * cantidad
       
       # SUMAR al inventario usando $inc
       inventario_collection.update_one(
           {"_id": ObjectId(item_id)},
           {
               "$inc": {
                   "cantidad": cantidad,
                   "costo": costo_total
               }
           }
       )
   ```

### Endpoint: `POST /cuentas-por-pagar/{id}/abonar`

**Cambios necesarios:**

1. **Calcular `montoAbonado` correctamente:**
   ```python
   # Opción 1: Usar $inc (recomendado)
   cuentas_por_pagar_collection.update_one(
       {"_id": ObjectId(id)},
       {
           "$inc": {"montoAbonado": monto},
           "$set": {
               "saldoPendiente": nuevo_saldo_pendiente,
               "estado": nuevo_estado
           },
           "$push": {"historialAbonos": nuevo_abono}
       }
   )
   
   # Opción 2: Calcular manualmente y usar $set
   nuevo_monto_abonado = monto_actual + monto_nuevo
   cuentas_por_pagar_collection.update_one(
       {"_id": ObjectId(id)},
       {
           "$set": {
               "montoAbonado": nuevo_monto_abonado,
               "saldoPendiente": nuevo_saldo_pendiente,
               "estado": nuevo_estado
           },
           "$push": {"historialAbonos": nuevo_abono}
       }
   )
   ```

2. **Validar que `montoAbonado` coincida con la suma del historial:**
   - Después de cada abono, verificar que `montoAbonado == sum(historialAbonos[].monto)`
   - Si no coincide, corregir automáticamente

---

## Estructura del Item en Inventario

Según la estructura que proporcionaste:

```javascript
{
  _id: ObjectId("68af08a410b63f047bce95dc"),
  codigo: "0003",
  nombre: "PUERTA VICTORIA3 2X1",
  descripcion: "PUERTA VICTORIA 3 2X1",
  categoria: "PUERTAS",
  precio: 340,
  costo: 0,  // ← Este campo se debe SUMAR
  costoProduccion: 25,
  cantidad: 0,  // ← Este campo se debe SUMAR
  activo: true,
  imagenes: [],
  modelo: ""
}
```

**Campos a actualizar:**
- `cantidad`: SUMAR la cantidad del item de la cuenta por pagar
- `costo`: SUMAR el costo total (costo_unitario * cantidad) del item

---

## Notas Importantes

1. **Usar transacciones de MongoDB** si es posible para asegurar atomicidad (que todas las operaciones se ejecuten o ninguna).

2. **Validar que el item existe** antes de intentar actualizarlo.

3. **Manejar errores** apropiadamente si el item no se encuentra.

4. **Logs para debugging:**
   ```python
   print(f"📦 Actualizando item {item_id}:")
   print(f"   Cantidad actual: {cantidad_actual} + {cantidad_a_sumar} = {nueva_cantidad}")
   print(f"   Costo actual: {costo_actual} + {costo_total_item} = {nuevo_costo}")
   ```

5. **No duplicar la lógica**: El frontend actualmente intenta actualizar el inventario, pero deberías **ELIMINAR esa lógica del frontend** y dejar que el backend lo maneje todo. El frontend no debería tener permisos para modificar inventario directamente.

---

## Pruebas Recomendadas

1. Crear una cuenta por pagar con un item que tenga cantidad=0 y costo=0
2. Verificar que después de crear la cuenta, el inventario muestre cantidad > 0 y costo > 0
3. Realizar múltiples abonos a una cuenta
4. Verificar que `montoAbonado` sea la suma de todos los abonos del historial
5. Verificar que `saldoPendiente = total - montoAbonado`

