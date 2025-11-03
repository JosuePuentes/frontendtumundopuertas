# Especificaciones Backend - Adicionales con Método de Pago

## Resumen
Cuando se crea un pedido con adicionales que tienen un método de pago asociado, el backend debe:
1. **Guardar los adicionales** en el pedido (ya implementado)
2. **Registrar el depósito** en el método de pago correspondiente
3. **Incluir los adicionales en el cálculo del monto total** del pedido
4. **Registrar la transacción** en el historial del método de pago

---

## Flujo Completo

### 1. Creación del Pedido con Adicionales

**Endpoint**: `POST /pedidos/`

**Payload del Frontend**:
```json
{
  "cliente_id": "...",
  "cliente_nombre": "...",
  "items": [...],
  "adicionales": [
    {
      "descripcion": "Transporte",
      "monto": 50.00,
      "metodoPago": "67890abcdef1234567890123",
      "metodoPagoNombre": "Banesco USD"
    }
  ],
  ...
}
```

**Requisitos del Backend**:

#### A. Guardar Adicionales en el Pedido
Los adicionales ya se están guardando en el campo `adicionales` del pedido. Esto está correcto.

#### B. Calcular `montoTotal` Incluyendo Adicionales
```python
# Cálculo del monto total del pedido
monto_items = sum(item['precio'] * item['cantidad'] for item in pedido['items'])
monto_adicionales = sum(ad['monto'] for ad in pedido.get('adicionales', []))
monto_total = monto_items + monto_adicionales

# Guardar en el pedido
pedido['montoTotal'] = monto_total
```

#### C. Registrar Depósitos en Métodos de Pago
Para cada adicional con `metodoPago`:

```python
from datetime import datetime

# Para cada adicional con método de pago
for adicional in pedido.get('adicionales', []):
    if adicional.get('metodoPago') and adicional.get('monto', 0) > 0:
        metodo_pago_id = adicional['metodoPago']
        monto_adicional = adicional['monto']
        descripcion_adicional = adicional.get('descripcion', 'Adicional sin descripción')
        
        # 1. Incrementar saldo del método de pago
        metodo_pago = metodos_pago_collection.find_one({"_id": ObjectId(metodo_pago_id)})
        if metodo_pago:
            # Usar $inc para incrementar saldo atómicamente
            metodos_pago_collection.update_one(
                {"_id": ObjectId(metodo_pago_id)},
                {"$inc": {"saldo": monto_adicional}}
            )
            
            # 2. Registrar transacción en el historial
            transaccion = {
                "metodo_pago_id": metodo_pago_id,
                "tipo": "deposito",
                "monto": monto_adicional,
                "concepto": f"Adicional pedido {pedido_id}: {descripcion_adicional}",
                "fecha": datetime.utcnow().isoformat(),
                "pedido_id": str(pedido['_id']),  # Opcional: vincular con el pedido
                "adicional": True  # Flag para identificar que es un adicional
            }
            
            transacciones_collection.insert_one(transaccion)
            
            print(f"✓ Adicional '{descripcion_adicional}' de ${monto_adicional} registrado en método {metodo_pago.get('nombre')}")
        else:
            print(f"⚠ Método de pago {metodo_pago_id} no encontrado para adicional '{descripcion_adicional}'")
```

---

## Estructura de Datos

### Pedido
```python
{
  "_id": ObjectId("..."),
  "cliente_id": "...",
  "cliente_nombre": "...",
  "items": [...],
  "adicionales": [
    {
      "descripcion": "Transporte",
      "monto": 50.00,
      "metodoPago": "67890abcdef1234567890123",
      "metodoPagoNombre": "Banesco USD"  # Opcional, solo para referencia
    }
  ],
  "montoTotal": 350.00,  # Items + Adicionales
  ...
}
```

### Transacción en Método de Pago
```python
{
  "_id": ObjectId("..."),
  "metodo_pago_id": "67890abcdef1234567890123",
  "tipo": "deposito",
  "monto": 50.00,
  "concepto": "Adicional pedido 69042b91a9a8ebdaf861c3f0: Transporte",
  "fecha": "2025-01-15T10:30:00.000Z",
  "pedido_id": "69042b91a9a8ebdaf861c3f0",  # Opcional
  "adicional": True  # Flag para identificar que es un adicional
}
```

---

## Consideraciones Importantes

1. **Atomicidad**: Usar `$inc` para actualizar el saldo del método de pago de forma atómica.
2. **Validación**: Verificar que el método de pago existe antes de registrar el depósito.
3. **Rollback**: Si el pedido falla después de registrar los depósitos, considerar revertir los depósitos (o implementar transacciones).
4. **Historial**: Todas las transacciones de adicionales deben aparecer en el historial del método de pago (`/metodos-pago/{id}/historial`).
5. **Total del Pedido**: El `montoTotal` del pedido **SIEMPRE** debe incluir los adicionales en todos los módulos (Monitor de Pedidos, Facturación, etc.).

---

## Ejemplo de Implementación Completa

```python
@router.post("/")
async def crear_pedido(pedido: Pedido):
    try:
        # ... validaciones existentes ...
        
        # Calcular monto total incluyendo adicionales
        monto_items = sum(item['precio'] * item['cantidad'] for item in pedido.items)
        monto_adicionales = sum(ad['monto'] for ad in pedido.get('adicionales', []))
        monto_total = monto_items + monto_adicionales
        
        # Preparar documento del pedido
        pedido_dict = pedido.dict()
        pedido_dict['montoTotal'] = monto_total
        pedido_dict['fecha_creacion'] = datetime.utcnow().isoformat()
        pedido_dict['fecha_actualizacion'] = datetime.utcnow().isoformat()
        
        # Insertar pedido
        result = pedidos_collection.insert_one(pedido_dict)
        pedido_id = result.inserted_id
        
        # Registrar depósitos para adicionales
        for adicional in pedido.get('adicionales', []):
            if adicional.get('metodoPago') and adicional.get('monto', 0) > 0:
                metodo_pago_id = adicional['metodoPago']
                monto_adicional = adicional['monto']
                descripcion_adicional = adicional.get('descripcion', 'Adicional sin descripción')
                
                # Verificar que el método de pago existe
                metodo_pago = metodos_pago_collection.find_one({"_id": ObjectId(metodo_pago_id)})
                if metodo_pago:
                    # Incrementar saldo
                    metodos_pago_collection.update_one(
                        {"_id": ObjectId(metodo_pago_id)},
                        {"$inc": {"saldo": monto_adicional}}
                    )
                    
                    # Registrar transacción
                    transaccion = {
                        "metodo_pago_id": metodo_pago_id,
                        "tipo": "deposito",
                        "monto": monto_adicional,
                        "concepto": f"Adicional pedido {str(pedido_id)}: {descripcion_adicional}",
                        "fecha": datetime.utcnow().isoformat(),
                        "pedido_id": str(pedido_id),
                        "adicional": True
                    }
                    transacciones_collection.insert_one(transaccion)
                else:
                    print(f"⚠ Método de pago {metodo_pago_id} no encontrado")
        
        # Retornar pedido creado
        pedido_creado = pedidos_collection.find_one({"_id": pedido_id})
        return object_id_to_str(pedido_creado)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Verificación

1. ✅ Crear un pedido con adicionales y método de pago.
2. ✅ Verificar que el `montoTotal` incluye los adicionales.
3. ✅ Verificar que el saldo del método de pago se incrementó.
4. ✅ Verificar que aparece una transacción en el historial del método de pago.
5. ✅ Verificar que el total se muestra correctamente en Monitor de Pedidos.
6. ✅ Verificar que el total se muestra correctamente en Facturación.

