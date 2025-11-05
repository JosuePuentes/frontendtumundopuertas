# INSTRUCCIONES BACKEND: Filtrar pedidos de TU MUNDO PUERTA en módulos de pagos

## 📋 RESUMEN
Los pedidos del cliente **TU MUNDO PUERTA** (RIF: **J-507172554**) NO deben aparecer en los módulos de **Pagos** ni **Mis Pagos**.

---

## ✅ CAMBIOS EN EL FRONTEND (YA IMPLEMENTADOS)
- ✅ Validación de método de pago y monto (EXCEPTO para TU MUNDO PUERTA)
- ✅ Filtrado en frontend de MisPagos.tsx
- ✅ Filtrado en frontend de Pedidos.tsx

---

## 🔧 CAMBIOS REQUERIDOS EN EL BACKEND

### Cliente a filtrar:
- **RIF**: `J-507172554`
- **Nombre**: `TU MUNDO PUERTA` o `TU MUNDO  PUERTA` (con espacios variables)

---

## 📝 ENDPOINTS A MODIFICAR

### 1. ENDPOINT: `GET /pedidos/mis-pagos`

**Ubicación**: `back-tumundopuertas/api/src/routes/pedidos.py`

**Buscar el endpoint** (alrededor de la línea donde está definido `/mis-pagos`):

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
        
        # EXCLUIR pedidos de TU MUNDO PUERTA (RIF: J-507172554)
        # Buscar el cliente_id de TU MUNDO PUERTA
        cliente_tumundo = clientes_collection.find_one({"rif": "J-507172554"})
        if cliente_tumundo:
            cliente_tumundo_id = str(cliente_tumundo["_id"])
            # Excluir pedidos de este cliente
            filtro["cliente_id"] = {"$ne": cliente_tumundo_id}
        
        # Obtener pedidos con filtro
        pedidos = list(pedidos_collection.find(filtro))
        
        # Convertir _id a string
        for pedido in pedidos:
            pedido["_id"] = str(pedido["_id"])
        
        return pedidos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener mis pagos: {str(e)}")
```

---

### 2. ENDPOINT: `GET /pedidos/all/` (usado en módulo Pagos)

**Ubicación**: `back-tumundopuertas/api/src/routes/pedidos.py`

**Buscar el endpoint** (alrededor de la línea donde está definido `/all/`):

**Agregar filtro para excluir pedidos de TU MUNDO PUERTA:**

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
        
        # EXCLUIR pedidos de TU MUNDO PUERTA (RIF: J-507172554)
        # Buscar el cliente_id de TU MUNDO PUERTA
        cliente_tumundo = clientes_collection.find_one({"rif": "J-507172554"})
        if cliente_tumundo:
            cliente_tumundo_id = str(cliente_tumundo["_id"])
            # Excluir pedidos de este cliente
            filtro["cliente_id"] = {"$ne": cliente_tumundo_id}
        
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

### 3. ALTERNATIVA: Filtrar por cliente_nombre (si no tienes acceso directo a cliente_id)

Si prefieres filtrar directamente por `cliente_nombre` en lugar de buscar el cliente:

```python
# En lugar de buscar por cliente_id, filtrar directamente por nombre
filtro["cliente_nombre"] = {
    "$not": {
        "$regex": "TU MUNDO.*PUERTA",
        "$options": "i"
    }
}
```

O más simple:
```python
# Excluir pedidos donde cliente_nombre contiene "TU MUNDO PUERTA"
filtro["cliente_nombre"] = {"$not": {"$regex": "TU MUNDO.*PUERTA", "$options": "i"}}
```

---

## 🔍 VERIFICACIÓN

### Cómo verificar que funciona:

1. **Crear un pedido con cliente TU MUNDO PUERTA** (RIF: J-507172554)
2. **Verificar que NO aparece en `/pedidos/mis-pagos`**
3. **Verificar que NO aparece en `/pedidos/all/`** cuando se usa desde el módulo Pagos

### Pruebas en MongoDB:

```javascript
// Buscar el cliente TU MUNDO PUERTA
db.CLIENTES.find({rif: "J-507172554"})

// Verificar que los pedidos de este cliente existen
db.PEDIDOS.find({cliente_id: "68c1b1dbcf0cb5d079dc9476"})

// Verificar que el filtro los excluye (desde el endpoint)
// Los pedidos de este cliente NO deben aparecer en las respuestas
```

---

## ⚠️ NOTAS IMPORTANTES

1. **RIF exacto**: El RIF es `J-507172554` (sin espacios, mayúsculas)
2. **Nombre variable**: El nombre puede tener espacios variables (`TU MUNDO PUERTA` o `TU MUNDO  PUERTA`)
3. **Filtrado consistente**: Asegúrate de aplicar el mismo filtro en todos los endpoints relacionados con pagos
4. **Otros endpoints**: Si hay otros endpoints que muestran pedidos relacionados con pagos, también deben filtrarse

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Modificar endpoint `/pedidos/mis-pagos` para excluir TU MUNDO PUERTA
- [ ] Modificar endpoint `/pedidos/all/` para excluir TU MUNDO PUERTA
- [ ] Verificar que el cliente_id se obtiene correctamente
- [ ] Probar creando un pedido de TU MUNDO PUERTA
- [ ] Verificar que NO aparece en Mis Pagos
- [ ] Verificar que NO aparece en Pagos
- [ ] Revisar otros endpoints relacionados con pagos si existen

---

## 🔄 ENDPOINTS ADICIONALES A REVISAR

Si hay otros endpoints que devuelven pedidos para módulos de pago, también deben filtrarse:

- `/pedidos/estado/` (si se usa para pagos)
- Cualquier endpoint que devuelva lista de pedidos con información de pagos

---

## 📞 RESULTADO ESPERADO

Después de aplicar los cambios:

1. ✅ Los pedidos de TU MUNDO PUERTA NO aparecen en Mis Pagos
2. ✅ Los pedidos de TU MUNDO PUERTA NO aparecen en Pagos
3. ✅ Los pedidos de otros clientes se muestran normalmente
4. ✅ El frontend también filtra por si acaso (doble protección)

