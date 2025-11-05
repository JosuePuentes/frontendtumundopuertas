# Instrucciones Backend: Eliminar Pedidos

## Problema a Resolver

El frontend necesita poder eliminar pedidos desde `/pedidos-web`. Cuando se elimina un pedido:
- Debe desaparecer de `/pedidos-web`
- Debe desaparecer de `/clientes` (Mis Pedidos)
- La eliminación debe ser permanente

## Endpoint Requerido

### DELETE `/pedidos/{pedido_id}`

**Propósito**: Eliminar un pedido permanentemente.

**Autenticación**: 
- Requiere token de **administrador** (`access_token`)
- Verificar que el usuario tenga rol "admin"

**Comportamiento Esperado**:
1. **Validar permisos**: Verificar que el usuario sea administrador
2. **Buscar el pedido**: Encontrar el pedido por `pedido_id` en la colección de pedidos
3. **Eliminar pedido**: Eliminar el documento del pedido de la base de datos
4. **Eliminar facturas relacionadas** (opcional pero recomendado):
   - Si el pedido tiene facturas asociadas, eliminarlas también
   - Buscar en `facturas_confirmadas_collection` (o tu colección de facturas) por `pedidoId`
5. **Eliminar mensajes del chat** (opcional pero recomendado):
   - Eliminar todos los mensajes asociados al pedido en la colección `mensajes`
   - Buscar por `pedido_id`
6. **Retornar confirmación**: Retornar éxito si se eliminó correctamente

**Estructura de Respuesta (Éxito)**:
```json
{
  "message": "Pedido eliminado exitosamente",
  "pedido_id": "pedido_id_456"
}
```

**Códigos de Estado HTTP**:
- `200 OK`: Pedido eliminado exitosamente
- `401 Unauthorized`: Token inválido o no proporcionado
- `403 Forbidden`: Usuario no es administrador
- `404 Not Found`: Pedido no encontrado
- `500 Internal Server Error`: Error del servidor

## Ejemplo de Implementación Python (FastAPI)

```python
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

router = APIRouter()

@router.delete("/pedidos/{pedido_id}")
async def eliminar_pedido(
    pedido_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Eliminar un pedido permanentemente.
    Solo permitido para administradores.
    """
    try:
        # 1. Verificar que el usuario sea admin
        if current_user.get("rol") != "admin":
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para eliminar pedidos"
            )
        
        # 2. Validar formato de pedido_id
        try:
            pedido_object_id = ObjectId(pedido_id)
        except:
            raise HTTPException(
                status_code=400,
                detail="ID de pedido inválido"
            )
        
        # 3. Verificar que el pedido existe
        pedido = pedidos_collection.find_one({"_id": pedido_object_id})
        if not pedido:
            raise HTTPException(
                status_code=404,
                detail="Pedido no encontrado"
            )
        
        # 4. Eliminar facturas asociadas (opcional)
        facturas_result = facturas_confirmadas_collection.delete_many(
            {"pedidoId": pedido_id}
        )
        print(f"Eliminadas {facturas_result.deleted_count} facturas asociadas")
        
        # 5. Eliminar mensajes del chat (opcional)
        mensajes_result = mensajes_collection.delete_many(
            {"pedido_id": pedido_id}
        )
        print(f"Eliminados {mensajes_result.deleted_count} mensajes asociados")
        
        # 6. Eliminar el pedido
        resultado = pedidos_collection.delete_one({"_id": pedido_object_id})
        
        if resultado.deleted_count == 0:
            raise HTTPException(
                status_code=500,
                detail="No se pudo eliminar el pedido"
            )
        
        return {
            "message": "Pedido eliminado exitosamente",
            "pedido_id": pedido_id,
            "facturas_eliminadas": facturas_result.deleted_count,
            "mensajes_eliminados": mensajes_result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR AL ELIMINAR PEDIDO: {str(e)}")
        import traceback
        print(f"TRACEBACK: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al eliminar pedido: {str(e)}"
        )
```

## Ejemplo de Implementación MongoDB (Consultas Directas)

```javascript
// Eliminar pedido y datos relacionados
db.pedidos.deleteOne({ "_id": ObjectId("pedido_id_456") });

// Eliminar facturas asociadas
db.facturas_confirmadas.deleteMany({ "pedidoId": "pedido_id_456" });

// Eliminar mensajes del chat
db.mensajes.deleteMany({ "pedido_id": "pedido_id_456" });
```

## Consideraciones Importantes

### 1. Eliminación en Cascada (Recomendado)

Es recomendable eliminar también:
- **Facturas asociadas**: Para mantener la integridad de los datos
- **Mensajes del chat**: Para evitar mensajes huérfanos
- **Cualquier otro dato relacionado**: Archivos, imágenes, etc.

### 2. Validación de Estado del Pedido (Opcional)

Puedes agregar validaciones adicionales:
```python
# Solo permitir eliminar pedidos en estados específicos
estados_permitidos = ["pendiente", "cancelado"]
if pedido.get("estado") not in estados_permitidos:
    raise HTTPException(
        status_code=400,
        detail=f"No se puede eliminar un pedido en estado: {pedido.get('estado')}"
    )
```

### 3. Logs y Auditoría

Recomendado registrar quién eliminó el pedido:
```python
# Guardar registro de eliminación
auditoria_collection.insert_one({
    "accion": "eliminar_pedido",
    "pedido_id": pedido_id,
    "usuario_id": current_user.get("id"),
    "usuario_nombre": current_user.get("usuario"),
    "fecha": datetime.utcnow(),
    "pedido_data": pedido  # Backup de datos del pedido
})
```

### 4. Backup antes de Eliminar (Opcional pero Recomendado)

Antes de eliminar, puedes hacer un backup:
```python
# Hacer backup del pedido antes de eliminar
pedidos_eliminados_collection.insert_one({
    **pedido,
    "eliminado_por": current_user.get("id"),
    "fecha_eliminacion": datetime.utcnow()
})
```

## Verificaciones

Después de implementar, verifica que:

1. ✅ El endpoint solo acepta tokens de administrador
2. ✅ Se retorna 403 si el usuario no es admin
3. ✅ Se retorna 404 si el pedido no existe
4. ✅ El pedido se elimina de la colección de pedidos
5. ✅ Las facturas asociadas se eliminan (opcional pero recomendado)
6. ✅ Los mensajes del chat se eliminan (opcional pero recomendado)
7. ✅ Se retorna un mensaje de éxito con el `pedido_id`
8. ✅ El frontend puede llamar el endpoint y recibir respuesta exitosa

## Estructura de Colecciones (Referencia)

- **Pedidos**: `pedidos_collection` (campo `_id`: ObjectId)
- **Facturas**: `facturas_confirmadas_collection` (campo `pedidoId`: string)
- **Mensajes**: `mensajes_collection` (campo `pedido_id`: string)


