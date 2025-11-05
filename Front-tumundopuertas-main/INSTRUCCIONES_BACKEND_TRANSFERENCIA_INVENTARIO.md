# Instrucciones Backend - Endpoint de Existencia por Sucursal

## Endpoint Requerido

Necesitas crear un endpoint en `back-tumundopuertas/api/src/routes/inventario.py`:

### Endpoint: `POST /inventario/{item_id}/existencia`

Este endpoint debe permitir cargar y descargar existencias de un item en una sucursal específica (Sucursal 1 o Sucursal 2).

### Parámetros del Request Body:

```json
{
  "cantidad": 10,              // número (float o int) - cantidad a cargar/descargar
  "tipo": "cargar",            // string - "cargar" o "descargar"
  "sucursal": "sucursal1"       // string - "sucursal1" o "sucursal2"
}
```

### Lógica del Endpoint:

1. **Validar el item_id**: Convertir a ObjectId y verificar que el item existe en la base de datos.

2. **Obtener existencia actual según sucursal**:
   - Si `sucursal == "sucursal1"`: usar el campo `existencia` o `cantidad` (verifica cuál usa tu modelo)
   - Si `sucursal == "sucursal2"`: usar el campo `existencia2`

3. **Validaciones**:
   - Si `tipo == "descargar"`: verificar que la existencia actual sea suficiente (>= cantidad)
   - Si no hay suficiente existencia, retornar error 400 con mensaje descriptivo

4. **Actualizar inventario**:
   - Si `tipo == "cargar"`: incrementar la existencia de la sucursal correspondiente
   - Si `tipo == "descargar"`: decrementar la existencia de la sucursal correspondiente

5. **Retornar el item actualizado** con las nuevas existencias.

### Ejemplo de Implementación:

```python
@router.post("/{item_id}/existencia")
async def actualizar_existencia_sucursal(
    item_id: str,
    request: dict = Body(...)
):
    """
    Actualizar existencia de un item en una sucursal específica.
    
    Body:
    - cantidad: número (cantidad a cargar/descargar)
    - tipo: "cargar" o "descargar"
    - sucursal: "sucursal1" o "sucursal2"
    """
    try:
        # Validar item_id
        try:
            item_obj_id = ObjectId(item_id)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"item_id inválido: {str(e)}")
        
        # Obtener item
        item = items_collection.find_one({"_id": item_obj_id})
        if not item:
            raise HTTPException(status_code=404, detail="Item no encontrado")
        
        # Obtener parámetros
        cantidad = request.get("cantidad")
        tipo = request.get("tipo")
        sucursal = request.get("sucursal")
        
        # Validar parámetros
        if not cantidad or cantidad <= 0:
            raise HTTPException(status_code=400, detail="Cantidad debe ser mayor a 0")
        
        if tipo not in ["cargar", "descargar"]:
            raise HTTPException(status_code=400, detail="Tipo debe ser 'cargar' o 'descargar'")
        
        if sucursal not in ["sucursal1", "sucursal2"]:
            raise HTTPException(status_code=400, detail="Sucursal debe ser 'sucursal1' o 'sucursal2'")
        
        # Determinar campo de existencia según sucursal
        campo_existencia = "cantidad" if sucursal == "sucursal1" else "existencia2"
        
        # Si tu modelo usa "existencia" para sucursal1, cambia la línea anterior a:
        # campo_existencia = "existencia" if sucursal == "sucursal1" else "existencia2"
        
        # Obtener existencia actual
        existencia_actual = item.get(campo_existencia, 0) or 0
        
        # Validar descarga
        if tipo == "descargar" and cantidad > existencia_actual:
            raise HTTPException(
                status_code=400, 
                detail=f"No hay suficiente existencia. Disponible: {existencia_actual}, Solicitado: {cantidad}"
            )
        
        # Calcular nueva existencia
        if tipo == "cargar":
            nueva_existencia = existencia_actual + cantidad
            operacion = {"$inc": {campo_existencia: cantidad}}
        else:  # descargar
            nueva_existencia = existencia_actual - cantidad
            operacion = {"$inc": {campo_existencia: -cantidad}}
        
        # Actualizar en base de datos
        items_collection.update_one(
            {"_id": item_obj_id},
            operacion
        )
        
        # Obtener item actualizado
        item_actualizado = items_collection.find_one({"_id": item_obj_id})
        item_actualizado["_id"] = str(item_actualizado["_id"])
        
        return item_actualizado
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar existencia: {str(e)}")
```

### Notas Importantes:

1. **Campo de existencia**: Verifica en tu modelo de Item qué campo usas para Sucursal 1:
   - Si usas `cantidad` para Sucursal 1, usa ese campo
   - Si usas `existencia` para Sucursal 1, cambia `campo_existencia = "cantidad"` por `campo_existencia = "existencia"`

2. **Campo de Sucursal 2**: Asegúrate de que el campo `existencia2` existe en tu modelo de Item.

3. **Valores por defecto**: Si un item no tiene `existencia2`, se debe inicializar en 0.

4. **Validaciones**: El endpoint debe validar que:
   - La cantidad sea mayor a 0
   - El tipo sea "cargar" o "descargar"
   - La sucursal sea "sucursal1" o "sucursal2"
   - Si es descarga, que haya suficiente existencia

5. **Manejo de errores**: Retorna mensajes de error claros y códigos HTTP apropiados.

### Uso desde el Frontend:

El frontend ya está configurado para usar este endpoint. La funcionalidad de transferencia hace dos llamadas:
1. Primero descarga de la sucursal origen
2. Luego carga en la sucursal destino

Si alguna de las dos operaciones falla, el frontend intenta revertir la primera operación automáticamente.

