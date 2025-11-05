# INSTRUCCIONES BACKEND: Limpiar pagos al cancelar pedido

## 📋 RESUMEN
Cuando se cancela un pedido desde MonitorPedidos, se deben **eliminar TODOS los pagos** relacionados con ese pedido:
- Pago inicial
- Todos los abonos del historial
- Campo `pago` debe quedar en "sin pago"
- Campo `total_abonado` debe quedar en 0
- Campo `historial_pagos` debe quedar vacío `[]`

---

## 🔧 CAMBIOS REQUERIDOS EN EL BACKEND

### OPCIÓN 1: Modificar endpoint existente `/pedidos/cancelar/{pedido_id}` (RECOMENDADO)

**Ubicación**: `back-tumundopuertas/api/src/routes/pedidos.py`

**Buscar el endpoint** alrededor de la línea 3149:
```python
@router.put("/cancelar/{pedido_id}")
async def cancelar_pedido(...)
```

**Modificar para que limpie los pagos automáticamente:**

```python
@router.put("/cancelar/{pedido_id}")
async def cancelar_pedido(
    pedido_id: str,
    request: CancelarPedidoRequest,
    user: dict = Depends(get_current_user)
):
    """
    Cancelar un pedido y limpiar todos sus pagos.
    """
    try:
        # ... código existente de validaciones ...
        
        # Validar formato de pedido_id
        try:
            pedido_obj_id = ObjectId(pedido_id)
        except:
            raise HTTPException(status_code=400, detail="ID de pedido inválido")
        
        # Buscar el pedido
        pedido = pedidos_collection.find_one({"_id": pedido_obj_id})
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
        # ... validaciones existentes (asignaciones activas, etc.) ...
        
        # ===== NUEVO: LIMPIAR TODOS LOS PAGOS =====
        print(f"🧹 Limpiando pagos del pedido {pedido_id} antes de cancelar...")
        
        # Actualizar el pedido: limpiar pagos y cancelar
        fecha_cancelacion = datetime.now().isoformat()
        usuario_cancelacion = user.get("username", "usuario_desconocido")
        
        result = pedidos_collection.update_one(
            {"_id": pedido_obj_id},
            {
                "$set": {
                    "estado_general": "cancelado",
                    "fecha_cancelacion": fecha_cancelacion,
                    "motivo_cancelacion": request.motivo_cancelacion,
                    "cancelado_por": usuario_cancelacion,
                    "fecha_actualizacion": fecha_cancelacion,
                    # LIMPIAR PAGOS
                    "pago": "sin pago",
                    "total_abonado": 0,
                    "historial_pagos": []  # Array vacío
                }
            }
        )
        
        print(f"✅ Pagos limpiados y pedido cancelado: {pedido_id}")
        
        # ... resto del código existente (actualizar items, etc.) ...
        
        return {
            "message": "Pedido cancelado exitosamente. Todos los pagos han sido eliminados.",
            "pedido_id": pedido_id,
            "pagos_eliminados": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al cancelar pedido: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al cancelar pedido: {str(e)}")
```

---

### OPCIÓN 2: Crear endpoint separado `/pedidos/{pedido_id}/limpiar-pagos` (OPCIONAL)

Si prefieres tener un endpoint separado para limpiar pagos:

**Ubicación**: `back-tumundopuertas/api/src/routes/pedidos.py`

**Agregar nuevo endpoint:**

```python
@router.delete("/{pedido_id}/limpiar-pagos")
async def limpiar_pagos_pedido(
    pedido_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Limpiar todos los pagos de un pedido.
    """
    try:
        # Validar formato de pedido_id
        try:
            pedido_obj_id = ObjectId(pedido_id)
        except:
            raise HTTPException(status_code=400, detail="ID de pedido inválido")
        
        # Buscar el pedido
        pedido = pedidos_collection.find_one({"_id": pedido_obj_id})
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
        # Limpiar todos los pagos
        result = pedidos_collection.update_one(
            {"_id": pedido_obj_id},
            {
                "$set": {
                    "pago": "sin pago",
                    "total_abonado": 0,
                    "historial_pagos": []
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="No se pudieron limpiar los pagos")
        
        return {
            "message": "Pagos limpiados exitosamente",
            "pedido_id": pedido_id,
            "historial_pagos_eliminados": len(pedido.get("historial_pagos", []))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al limpiar pagos: {str(e)}")
```

---

## ✅ CAMBIOS EN EL FRONTEND (YA IMPLEMENTADOS)

El frontend ya intenta limpiar los pagos antes de cancelar:
1. Primero intenta llamar a `/pedidos/{pedido_id}/limpiar-pagos` (DELETE)
2. Si no existe, intenta limpiar manualmente con PATCH
3. Luego cancela el pedido

**Pero la mejor opción es que el backend lo haga automáticamente en el endpoint de cancelación.**

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Modificar endpoint `/pedidos/cancelar/{pedido_id}` para limpiar pagos automáticamente
- [ ] Verificar que `pago` se establece en "sin pago"
- [ ] Verificar que `total_abonado` se establece en 0
- [ ] Verificar que `historial_pagos` se establece en `[]`
- [ ] Probar cancelando un pedido con pagos
- [ ] Verificar que los pagos desaparecen de Mis Pagos y Pagos
- [ ] Verificar que el pedido queda cancelado correctamente

---

## 🔍 VERIFICACIÓN

### Cómo verificar que funciona:

1. **Crear un pedido con pagos**:
   - Agregar pago inicial
   - Agregar uno o más abonos

2. **Cancelar el pedido** desde MonitorPedidos

3. **Verificar en MongoDB**:
   ```javascript
   db.PEDIDOS.find({_id: ObjectId("pedido_id")})
   // Verificar que:
   // - pago: "sin pago"
   // - total_abonado: 0
   // - historial_pagos: []
   ```

4. **Verificar en frontend**:
   - El pedido NO debe aparecer en Mis Pagos
   - El pedido NO debe aparecer en Pagos
   - El pedido debe aparecer como "cancelado" en MonitorPedidos

---

## ⚠️ NOTAS IMPORTANTES

1. **No eliminar registros de métodos de pago**: Solo limpiar los pagos del pedido, NO eliminar los métodos de pago de la colección `METODOS_PAGO`.

2. **Mantener historial de cancelación**: El motivo de cancelación y otros campos deben mantenerse.

3. **No afectar otros pedidos**: Solo limpiar los pagos del pedido que se está cancelando.

4. **Consistencia**: Asegúrate de que todos los campos relacionados con pagos se limpien:
   - `pago`: "sin pago"
   - `total_abonado`: 0
   - `historial_pagos`: []

---

## 🎯 RESULTADO ESPERADO

Después de implementar los cambios:

1. ✅ Al cancelar un pedido, todos sus pagos se eliminan automáticamente
2. ✅ El pedido no aparece en módulos de pagos
3. ✅ El pedido queda cancelado con estado "cancelado"
4. ✅ No hay registros de pagos residuales en la base de datos

