# Instrucciones Backend - Soporte para Sucursales en Inventario

## Cambios Necesarios en el Backend

### 1. Modelo de Item - Agregar campo `existencia2`

En el modelo de Item (`back-tumundopuertas/api/src/models/authmodels.py` o donde esté definido), agregar:

```python
existencia2: Optional[float] = 0  # Existencia para Sucursal 2
```

O si usas MongoDB directamente, asegúrate de que los items puedan tener el campo `existencia2`.

### 2. Endpoint POST `/inventario/{item_id}/existencia`

**Ubicación:** `back-tumundopuertas/api/src/routes/inventario.py`

**Acción:** Crear este endpoint si no existe, o modificarlo si ya existe.

**Código necesario:**

```python
@router.post("/{item_id}/existencia")
async def actualizar_existencia(
    item_id: str,
    request: dict = Body(...)
):
    """
    Endpoint para cargar o descargar existencia de un item
    Soporta sucursal 1 (existencia/cantidad) y sucursal 2 (existencia2)
    """
    try:
        item_obj_id = ObjectId(item_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"item_id no es un ObjectId válido: {str(e)}")
    
    item = items_collection.find_one({"_id": item_obj_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    cantidad = request.get("cantidad", 0)
    tipo = request.get("tipo", "cargar")  # 'cargar' o 'descargar'
    sucursal = request.get("sucursal", "sucursal1")  # 'sucursal1' o 'sucursal2'
    
    if cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")
    
    # Determinar qué campo actualizar según la sucursal
    if sucursal == "sucursal1":
        # Sucursal 1 usa 'cantidad' o 'existencia'
        campo = "cantidad" if "cantidad" in item else "existencia"
        existencia_actual = item.get("cantidad", item.get("existencia", 0))
        
        if tipo == "descargar" and cantidad > existencia_actual:
            raise HTTPException(
                status_code=400, 
                detail=f"No puedes descargar más de lo disponible. Sucursal 1 actual: {existencia_actual}"
            )
        
        if tipo == "cargar":
            items_collection.update_one(
                {"_id": item_obj_id},
                {"$inc": {campo: cantidad}}
            )
        else:  # descargar
            items_collection.update_one(
                {"_id": item_obj_id},
                {"$inc": {campo: -cantidad}}
            )
    
    elif sucursal == "sucursal2":
        # Sucursal 2 usa 'existencia2'
        existencia_actual = item.get("existencia2", 0)
        
        if tipo == "descargar" and cantidad > existencia_actual:
            raise HTTPException(
                status_code=400, 
                detail=f"No puedes descargar más de lo disponible. Sucursal 2 actual: {existencia_actual}"
            )
        
        if tipo == "cargar":
            items_collection.update_one(
                {"_id": item_obj_id},
                {"$inc": {"existencia2": cantidad}}
            )
        else:  # descargar
            items_collection.update_one(
                {"_id": item_obj_id},
                {"$inc": {"existencia2": -cantidad}}
            )
    else:
        raise HTTPException(status_code=400, detail="Sucursal inválida. Use 'sucursal1' o 'sucursal2'")
    
    # Obtener el item actualizado para retornar
    item_actualizado = items_collection.find_one({"_id": item_obj_id})
    item_actualizado["_id"] = str(item_actualizado["_id"])
    
    return item_actualizado
```

### 3. Endpoint de Carga Excel - Aceptar columnas "Sucursal 1" y "Sucursal 2"

**Ubicación:** `back-tumundopuertas/api/src/routes/inventario.py` en el endpoint `upload_inventory_excel`

**Modificaciones:**

```python
# En la línea donde defines expected_headers, cambiar:
expected_headers = ["codigo", "descripcion", "departamento", "marca", "precio", "costo", "existencia", "Sucursal 1", "Sucursal 2"]
# Nota: Hacer que "Sucursal 1" y "Sucursal 2" sean opcionales

# En la parte donde mapeas a Item, agregar:
existencia = excel_item.existencia if hasattr(excel_item, 'existencia') else (row_data.get("Sucursal 1") or 0)
existencia2 = row_data.get("Sucursal 2", 0) if "Sucursal 2" in row_data else 0

# Y al crear item_data:
item_data = Item(
    codigo=excel_item.codigo,
    nombre=excel_item.descripcion,
    descripcion=excel_item.descripcion,
    departamento=excel_item.departamento,
    marca=excel_item.marca,
    categoria="General",
    precio=excel_item.precio,
    costo=excel_item.costo,
    cantidad=0,
    existencia=existencia,  # Sucursal 1
    existencia2=existencia2,  # Sucursal 2 - NUEVO
    activo=True,
    imagenes=[]
)
```

### 4. Endpoint Bulk - Soporte para existencia2

**Ubicación:** `back-tumundopuertas/api/src/routes/inventario.py` en el endpoint `bulk_upsert_items`

**Modificación:** Agregar `existencia2` al update_fields si viene en los datos:

```python
update_fields = {
    "descripcion": item_dict.get("descripcion"),
    "modelo": item_dict.get("modelo"),
    "precio": item_dict.get("precio"),
    "costo": item_dict.get("costo"),
    "nombre": item_dict.get("nombre"),
    "categoria": item_dict.get("categoria"),
    "costoProduccion": item_dict.get("costoProduccion"),
    "activo": item_dict.get("activo"),
    "imagenes": item_dict.get("imagenes"),
    "existencia2": item_dict.get("existencia2"),  # NUEVO
}
```

## Resumen de Campos

- **Sucursal 1:** Usa `cantidad` o `existencia` (según tu modelo actual)
- **Sucursal 2:** Usa `existencia2` (nuevo campo)

## Notas Importantes

1. El frontend envía `sucursal: "sucursal1"` o `"sucursal2"` en el body del POST
2. El frontend espera que el Excel tenga columnas opcionales: "Sucursal 1" y "Sucursal 2"
3. Si un item no tiene `existencia2`, asumir que es 0
4. Todas las operaciones deben actualizar el campo correcto según la sucursal seleccionada










