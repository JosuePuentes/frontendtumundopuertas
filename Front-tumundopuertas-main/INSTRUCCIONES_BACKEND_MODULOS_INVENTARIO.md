# Instrucciones para el Backend - Módulos Movidos a Inventario

## Resumen
Los módulos "Pedidos TU MUNDO PUERTA" y "Pedidos con Existencias Cargadas" han sido movidos del frontend de `/facturacion` a `/inventario/cargar-excel`. **NO se requieren cambios en el backend**.

## Verificación
El frontend utiliza los siguientes endpoints que ya existen:

1. **`GET /pedidos/all/`** - Para obtener todos los pedidos y filtrar por cliente especial (RIF: J-507172554)
2. **`GET /pedidos/id/{pedido_id}/`** - Para obtener detalles de un pedido específico
3. **`POST /inventario/cargar-existencias-desde-pedido`** - Para cargar existencias desde un pedido al inventario
   - Body: `{ "pedido_id": "..." }`
   - Este endpoint ya existe y funciona correctamente
4. **`POST /pedidos-cargados-inventario`** - Para guardar un pedido cargado al inventario
   - Body: `{ id, pedidoId, clienteNombre, clienteId, montoTotal, fechaCreacion, fechaCargaInventario, items }`
5. **`GET /pedidos-cargados-inventario`** - Para obtener todos los pedidos cargados al inventario

## Notas Importantes
- **No hay cambios requeridos en el backend**
- Los endpoints mencionados ya están funcionando y son utilizados por el frontend
- La lógica de negocio permanece igual, solo cambió la ubicación de la UI en el frontend
- El filtrado del cliente especial "TU MUNDO PUERTA" (RIF: J-507172554) se hace en el frontend

## Confirmación
Si todo está funcionando correctamente, no necesitas hacer nada en el backend. Los módulos ahora estarán disponibles en `/inventario/cargar-excel` en lugar de `/facturacion`.










