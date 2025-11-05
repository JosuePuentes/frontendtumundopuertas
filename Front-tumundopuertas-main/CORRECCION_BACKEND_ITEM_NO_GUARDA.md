# CORRECCIÓN: Item no se guarda en base de datos

## 🔴 PROBLEMA
El backend responde con éxito (200) y devuelve el ID del item creado, pero el item **NO aparece en la base de datos**.

## 🔍 CAUSA PROBABLE
El problema está en cómo se construye el `item_dict` en el endpoint `create_item`. El uso de `exclude_unset=True` podría estar excluyendo campos necesarios.

## ✅ SOLUCIÓN

### Modificar: `api/src/routes/inventario.py`

**Buscar el endpoint `@router.post("/")` (alrededor de la línea 68-98):**

**REEMPLAZAR este código:**
```python
        # Crear el diccionario del item con el código (generado o proporcionado)
        item_dict = item.dict(by_alias=True, exclude_unset=True)
        item_dict["codigo"] = codigo_a_usar
        
        result = items_collection.insert_one(item_dict)
```

**Por este código CORREGIDO:**
```python
        # Crear el diccionario del item con el código (generado o proporcionado)
        # IMPORTANTE: Usar exclude_unset=False para asegurar que todos los campos se incluyan
        item_dict = item.dict(by_alias=True, exclude_unset=False)
        
        # Asegurar que el código esté presente
        item_dict["codigo"] = codigo_a_usar
        
        # Limpiar campos None para evitar problemas con MongoDB
        item_dict = {k: v for k, v in item_dict.items() if v is not None or k == "codigo"}
        
        # Asegurar campos requeridos con valores por defecto si no están presentes
        if "activo" not in item_dict:
            item_dict["activo"] = True
        if "imagenes" not in item_dict:
            item_dict["imagenes"] = []
        if "existencia" not in item_dict:
            item_dict["existencia"] = 0
        
        # Log para debug
        print(f"📝 DEBUG: Insertando item con datos: {item_dict}")
        print(f"📝 DEBUG: Campos del item: {list(item_dict.keys())}")
        
        # Insertar en MongoDB
        result = items_collection.insert_one(item_dict)
        
        # Verificar que realmente se insertó
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Error: No se pudo insertar el item en la base de datos")
        
        # Verificar que el item existe después de insertar
        item_verificado = items_collection.find_one({"_id": result.inserted_id})
        if not item_verificado:
            raise HTTPException(status_code=500, detail="Error: El item no se encontró después de insertar")
        
        print(f"✅ DEBUG: Item insertado exitosamente con ID: {result.inserted_id}")
        print(f"✅ DEBUG: Item verificado en BD: {item_verificado.get('codigo', 'sin código')}")
```

## 📝 CÓDIGO COMPLETO DEL ENDPOINT

```python
@router.post("/")
async def create_item(item: Item):
    try:
        # Si el código está vacío o solo tiene espacios, generar uno automáticamente
        codigo_a_usar = item.codigo.strip() if item.codigo and item.codigo.strip() else None
        
        if not codigo_a_usar:
            # Generar código automático
            codigo_a_usar = generar_codigo_secuencial()
            print(f"🔢 Código generado automáticamente: {codigo_a_usar}")
        else:
            # Verificar que el código proporcionado no exista
            existing_item = items_collection.find_one({"codigo": codigo_a_usar})
            if existing_item:
                raise HTTPException(status_code=400, detail=f"El item con el código '{codigo_a_usar}' ya existe")
        
        # Crear el diccionario del item con el código (generado o proporcionado)
        # IMPORTANTE: Usar exclude_unset=False para asegurar que todos los campos se incluyan
        item_dict = item.dict(by_alias=True, exclude_unset=False)
        
        # Asegurar que el código esté presente
        item_dict["codigo"] = codigo_a_usar
        
        # Limpiar campos None para evitar problemas con MongoDB
        item_dict = {k: v for k, v in item_dict.items() if v is not None or k == "codigo"}
        
        # Asegurar campos requeridos con valores por defecto si no están presentes
        if "activo" not in item_dict:
            item_dict["activo"] = True
        if "imagenes" not in item_dict:
            item_dict["imagenes"] = []
        if "existencia" not in item_dict:
            item_dict["existencia"] = 0
        
        # Log para debug
        print(f"📝 DEBUG: Insertando item con datos: {item_dict}")
        print(f"📝 DEBUG: Campos del item: {list(item_dict.keys())}")
        
        # Insertar en MongoDB
        result = items_collection.insert_one(item_dict)
        
        # Verificar que realmente se insertó
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Error: No se pudo insertar el item en la base de datos")
        
        # Verificar que el item existe después de insertar
        item_verificado = items_collection.find_one({"_id": result.inserted_id})
        if not item_verificado:
            raise HTTPException(status_code=500, detail="Error: El item no se encontró después de insertar")
        
        print(f"✅ DEBUG: Item insertado exitosamente con ID: {result.inserted_id}")
        print(f"✅ DEBUG: Item verificado en BD: {item_verificado.get('codigo', 'sin código')}")
        
        return {
            "message": "Item creado correctamente",
            "id": str(result.inserted_id),
            "codigo": codigo_a_usar  # Devolver el código usado (generado o proporcionado)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR al crear item: {str(e)}")
        print(f"❌ Tipo de error: {type(e).__name__}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"Error al crear el item: {str(e)}")
```

## 🔍 VERIFICACIÓN

Después de aplicar los cambios:

1. **Reiniciar el servidor backend**
2. **Revisar los logs del servidor** cuando crees un item - deberías ver:
   - `📝 DEBUG: Insertando item con datos:`
   - `✅ DEBUG: Item insertado exitosamente con ID:`
   - `✅ DEBUG: Item verificado en BD:`

3. **Verificar en MongoDB directamente**:
   ```javascript
   db.INVENTARIO.find({codigo: "ITEM-0273"})
   ```

4. **Si aún no funciona**, revisa los logs del servidor para ver qué error está ocurriendo realmente.

## ⚠️ NOTAS IMPORTANTES

- `exclude_unset=True` puede excluir campos que tienen valores por defecto en el modelo pero que no fueron enviados desde el frontend
- Los campos `None` pueden causar problemas en MongoDB dependiendo de la configuración
- Los logs de debug ayudarán a identificar exactamente qué está pasando

