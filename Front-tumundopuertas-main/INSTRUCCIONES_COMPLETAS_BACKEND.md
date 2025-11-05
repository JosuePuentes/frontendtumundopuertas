# 📋 INSTRUCCIONES COMPLETAS PARA EL BACKEND

Este documento contiene TODAS las modificaciones que necesitas hacer en el backend para que el frontend funcione correctamente.

---

## 🎯 RESUMEN DE CAMBIOS

1. **Limpiar pagos al cancelar pedido** - Eliminar todos los pagos cuando se cancela un pedido
2. **Filtrar pedidos de TU MUNDO PUERTA** - Excluir pedidos de este cliente en módulos de pagos

---

# 📝 CAMBIO 1: LIMPIAR PAGOS AL CANCELAR PEDIDO

## Objetivo
Cuando se cancela un pedido desde MonitorPedidos, se deben **eliminar TODOS los pagos** relacionados con ese pedido.

## Endpoint a Modificar
**`PUT /pedidos/cancelar/{pedido_id}`**

**Ubicación**: `back-tumundopuertas/api/src/routes/pedidos.py` (alrededor de la línea 3149)

## Código a Modificar

Busca esta función:
```python
@router.put("/cancelar/{pedido_id}")
async def cancelar_pedido(
    pedido_id: str,
    request: CancelarPedidoRequest,
    user: dict = Depends(get_current_user)
):
```

**MODIFICAR el bloque donde se actualiza el pedido** (alrededor de la línea 3212):

**ANTES:**
```python
# Actualizar el estado_general del pedido
result = pedidos_collection.update_one(
    {"_id": pedido_obj_id},
    {
        "$set": {
            "estado_general": "cancelado",
            "fecha_cancelacion": fecha_cancelacion,
            "motivo_cancelacion": request.motivo_cancelacion,
            "cancelado_por": usuario_cancelacion,
            "fecha_actualizacion": fecha_cancelacion
        }
    }
)
```

**DESPUÉS:**
```python
# Actualizar el estado_general del pedido Y LIMPIAR PAGOS
result = pedidos_collection.update_one(
    {"_id": pedido_obj_id},
    {
        "$set": {
            "estado_general": "cancelado",
            "fecha_cancelacion": fecha_cancelacion,
            "motivo_cancelacion": request.motivo_cancelacion,
            "cancelado_por": usuario_cancelacion,
            "fecha_actualizacion": fecha_cancelacion,
            # LIMPIAR TODOS LOS PAGOS
            "pago": "sin pago",
            "total_abonado": 0,
            "historial_pagos": []  # Array vacío
        }
    }
)
```

## Notas Importantes
- Los items ya se actualizan correctamente a `estado_item = 4` (línea ~3236), así que NO aparecerán en PedidosHerreria
- Solo necesitas agregar las 3 líneas para limpiar pagos
- Esto hará que el pedido cancelado NO aparezca en Mis Pagos ni en Pagos

---

# 📝 CAMBIO 2: FILTRAR PEDIDOS DE TU MUNDO PUERTA EN MÓDULOS DE PAGOS

## Objetivo
Los pedidos del cliente **TU MUNDO PUERTA** (RIF: `J-507172554`) NO deben aparecer en los módulos de pagos.

## Cliente a Filtrar
- **RIF**: `J-507172554`
- **Nombre**: `TU MUNDO PUERTA` o `TU MUNDO  PUERTA` (con espacios variables)
- **_id**: `68c1b1dbcf0cb5d079dc9476`

## Endpoints a Modificar

### 2.1. Endpoint: `GET /pedidos/mis-pagos`

**Ubicación**: `back-tumundopuertas/api/src/routes/pedidos.py`

**Buscar el endpoint** (busca `/mis-pagos` en el código):

**Agregar filtro para excluir pedidos de TU MUNDO PUERTA:**

```python
@router.get("/mis-pagos")
async def get_mis_pagos(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None
):
    try:
        # Construir filtro de fecha si se proporciona
        filtro = {}
        if fecha_inicio and fecha_fin:
            filtro["fecha_creacion"] = {
                "$gte": fecha_inicio,
                "$lte": fecha_fin
            }
        
        # ===== NUEVO: EXCLUIR pedidos de TU MUNDO PUERTA (RIF: J-507172554) =====
        # Buscar el cliente_id de TU MUNDO PUERTA
        cliente_tumundo = clientes_collection.find_one({"rif": "J-507172554"})
        if cliente_tumundo:
            cliente_tumundo_id = str(cliente_tumundo["_id"])
            # Excluir pedidos de este cliente
            filtro["cliente_id"] = {"$ne": cliente_tumundo_id}
        # ===== FIN NUEVO =====
        
        # Obtener pedidos con filtro
        pedidos = list(pedidos_collection.find(filtro))
        
        # Convertir _id a string
        for pedido in pedidos:
            pedido["_id"] = str(pedido["_id"])
        
        return pedidos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener mis pagos: {str(e)}")
```

**O alternativamente por nombre (si prefieres):**
```python
# Si prefieres filtrar por nombre en lugar de buscar el cliente_id:
filtro["cliente_nombre"] = {"$not": {"$regex": "TU MUNDO.*PUERTA", "$options": "i"}}
```

---

### 2.2. Endpoint: `GET /pedidos/all/`

**Ubicación**: `back-tumundopuertas/api/src/routes/pedidos.py`

**Buscar el endpoint** (busca `/all/` en el código):

**Agregar el mismo filtro:**

```python
@router.get("/all/")
async def get_all_pedidos(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    ordenar: str = "fecha_desc"
):
    try:
        # Construir filtro de fecha si se proporciona
        filtro = {}
        if fecha_inicio and fecha_fin:
            filtro["fecha_creacion"] = {
                "$gte": fecha_inicio,
                "$lte": fecha_fin
            }
        
        # ===== NUEVO: EXCLUIR pedidos de TU MUNDO PUERTA (RIF: J-507172554) =====
        cliente_tumundo = clientes_collection.find_one({"rif": "J-507172554"})
        if cliente_tumundo:
            cliente_tumundo_id = str(cliente_tumundo["_id"])
            filtro["cliente_id"] = {"$ne": cliente_tumundo_id}
        # ===== FIN NUEVO =====
        
        # Obtener pedidos con filtro
        pedidos = list(pedidos_collection.find(filtro))
        
        # Ordenar según parámetro
        if ordenar == "fecha_desc":
            pedidos.sort(key=lambda x: x.get("fecha_creacion", ""), reverse=True)
        elif ordenar == "fecha_asc":
            pedidos.sort(key=lambda x: x.get("fecha_creacion", ""))
        
        # Convertir _id a string
        for pedido in pedidos:
            pedido["_id"] = str(pedido["_id"])
        
        return pedidos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener pedidos: {str(e)}")
```

---

## Importaciones Necesarias

Asegúrate de tener estas importaciones al inicio del archivo:
```python
from typing import Optional
from fastapi import HTTPException
from bson import ObjectId
```

---

# ✅ CHECKLIST DE IMPLEMENTACIÓN

## Cambio 1: Limpiar Pagos al Cancelar
- [ ] Encontrar endpoint `/pedidos/cancelar/{pedido_id}` en `pedidos.py`
- [ ] Agregar `"pago": "sin pago"` al `$set`
- [ ] Agregar `"total_abonado": 0` al `$set`
- [ ] Agregar `"historial_pagos": []` al `$set`
- [ ] Probar cancelando un pedido con pagos
- [ ] Verificar que los pagos desaparecen de Mis Pagos y Pagos
- [ ] Verificar que los items NO aparecen en PedidosHerreria (ya funciona)
- [ ] Verificar que el pedido SÍ aparece en MonitorPedidos con filtro de cancelados

## Cambio 2: Filtrar TU MUNDO PUERTA
- [ ] Encontrar endpoint `/pedidos/mis-pagos` en `pedidos.py`
- [ ] Agregar código para buscar cliente TU MUNDO PUERTA
- [ ] Agregar filtro `cliente_id` para excluir pedidos de este cliente
- [ ] Encontrar endpoint `/pedidos/all/` en `pedidos.py`
- [ ] Agregar el mismo filtro en `/pedidos/all/`
- [ ] Probar creando un pedido de TU MUNDO PUERTA
- [ ] Verificar que NO aparece en Mis Pagos
- [ ] Verificar que NO aparece en Pagos
- [ ] Verificar que SÍ aparece en MonitorPedidos

---

# 🔍 VERIFICACIÓN

## Para Cambio 1 (Limpiar Pagos):
1. Crear un pedido con pagos
2. Cancelar el pedido desde MonitorPedidos
3. Verificar en MongoDB:
   ```javascript
   db.PEDIDOS.find({_id: ObjectId("pedido_id")})
   // Debe mostrar:
   // - pago: "sin pago"
   // - total_abonado: 0
   // - historial_pagos: []
   ```
4. Verificar que NO aparece en Mis Pagos ni Pagos
5. Verificar que los items NO aparecen en PedidosHerreria
6. Verificar que SÍ aparece en MonitorPedidos con filtro de cancelados

## Para Cambio 2 (Filtrar TU MUNDO PUERTA):
1. Crear un pedido con cliente TU MUNDO PUERTA (RIF: J-507172554)
2. Verificar en MongoDB:
   ```javascript
   // Buscar el cliente
   db.CLIENTES.find({rif: "J-507172554"})
   
   // Verificar que los endpoints lo filtran
   // GET /pedidos/mis-pagos -> NO debe aparecer
   // GET /pedidos/all/ -> NO debe aparecer
   ```
3. Verificar que NO aparece en Mis Pagos
4. Verificar que NO aparece en Pagos
5. Verificar que SÍ aparece en MonitorPedidos

---

# 📝 NOTAS IMPORTANTES

1. **RIF exacto**: El RIF es `J-507172554` (sin espacios, mayúsculas)
2. **Nombre variable**: El nombre puede tener espacios variables (`TU MUNDO PUERTA` o `TU MUNDO  PUERTA`)
3. **Items ya funcionan**: Los items de pedidos cancelados ya NO aparecen en PedidosHerreria porque el backend actualiza `estado_item = 4` (línea ~3236)
4. **MonitorPedidos funciona**: El filtro de cancelados ya está implementado en el frontend
5. **Filtrado consistente**: Asegúrate de aplicar el mismo filtro en todos los endpoints relacionados con pagos

---

# 🎯 RESULTADO FINAL ESPERADO

## Después de implementar Cambio 1:
- ✅ Al cancelar un pedido, todos sus pagos se eliminan automáticamente
- ✅ El pedido no aparece en módulos de pagos (Mis Pagos, Pagos)
- ✅ Los items del pedido NO aparecen en PedidosHerreria
- ✅ El pedido SÍ aparece en MonitorPedidos cuando se activa el filtro de cancelados

## Después de implementar Cambio 2:
- ✅ Los pedidos de TU MUNDO PUERTA NO aparecen en Mis Pagos
- ✅ Los pedidos de TU MUNDO PUERTA NO aparecen en Pagos
- ✅ Los pedidos de TU MUNDO PUERTA SÍ aparecen en MonitorPedidos
- ✅ Los pedidos de otros clientes se muestran normalmente

---

# 📞 ENDPOINTS ADICIONALES A REVISAR (OPCIONAL)

Si hay otros endpoints que devuelven pedidos para módulos de pago, también deben filtrarse:
- `/pedidos/estado/` (si se usa para pagos)
- Cualquier endpoint que devuelva lista de pedidos con información de pagos

---

# 🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **Primero**: Cambio 1 (Limpiar Pagos) - Es más simple y directo
2. **Segundo**: Cambio 2 (Filtrar TU MUNDO PUERTA) - Requiere modificar 2 endpoints

---

**¡Listo!** Con estos cambios, el frontend funcionará completamente. El frontend ya está preparado y esperando estos cambios en el backend.

