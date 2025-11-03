# Instrucciones para Backend - Endpoint GET /clientes/id/{cliente_id}/

## Problema Actual

El endpoint `GET /clientes/id/{cliente_id}/` tiene los siguientes problemas:

1. **No convierte `cliente_id` a ObjectId**: Usa `{"_id": cliente_id}` directamente como string, lo cual falla en MongoDB.
2. **No convierte `_id` a string en la respuesta**: MongoDB ObjectId no es JSON serializable directamente.
3. **No normaliza campos**: Debe manejar tanto `cedula`/`rif` como `telefono`/`telefono_contacto`.

## Solución Requerida

Corregir el endpoint `GET /clientes/id/{cliente_id}/` para que:

### 1. Convierta `cliente_id` a ObjectId

```python
from bson import ObjectId

@router.get("/id/{cliente_id}/")
async def get_cliente(cliente_id: str):
    try:
        # Convertir string a ObjectId
        object_id = ObjectId(cliente_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de cliente inválido")
    
    cliente = clientes_collection.find_one({"_id": object_id})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Convertir _id a string para JSON
    if "_id" in cliente:
        cliente["_id"] = str(cliente["_id"])
    
    # Normalizar campos para compatibilidad con frontend
    cliente_normalizado = {
        "_id": cliente.get("_id"),
        "nombre": cliente.get("nombre") or cliente.get("nombres", ""),
        "cedula": cliente.get("cedula") or cliente.get("rif", ""),  # Priorizar cedula, usar rif como fallback
        "direccion": cliente.get("direccion", ""),
        "telefono": cliente.get("telefono") or cliente.get("telefono_contacto", ""),  # Priorizar telefono
    }
    
    return cliente_normalizado
```

### 2. Campos a Retornar

El endpoint debe retornar al menos estos campos (normalizados):
- `nombre` (o `nombres` como fallback)
- `cedula` (o `rif` como fallback)
- `direccion`
- `telefono` (o `telefono_contacto` como fallback)

### 3. Manejo de Errores

- **400 Bad Request**: Si `cliente_id` no es un ObjectId válido
- **404 Not Found**: Si el cliente no existe en `clientes_collection`

### 4. Autenticación

- **Opcional**: El frontend puede enviar token de administrador, pero el endpoint debería funcionar sin él también.
- Si requieres autenticación, usa `get_current_user` (administrador) en lugar de `get_current_cliente`.

## Contexto

Este endpoint se usa en `/pedidos-web` cuando:
- Un pedido tiene `cliente_id` pero no tiene los datos del cliente embebidos
- El frontend necesita cargar `nombre`, `cedula`, `direccion` y `telefono` del cliente para mostrarlos

Los pedidos web generalmente tienen clientes de `clientes_collection` (no autenticados), por eso usamos `/clientes/id/{cliente_id}/` en lugar de `/clientes/{cliente_id}`.

