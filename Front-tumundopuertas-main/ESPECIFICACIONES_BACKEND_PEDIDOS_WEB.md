# Especificaciones Backend - Módulo Pedidos Web

## Descripción
Este documento especifica los requerimientos del backend para el módulo **Pedidos Web**, que permite a los administradores ver y gestionar los pedidos que los clientes realizan desde el catálogo web (`/clientes`).

## Endpoint Principal

### GET `/pedidos/cliente`

**Descripción:** Obtiene todos los pedidos creados desde el carrito de clientes web.

**Autenticación:** Requiere token de administrador (`Bearer token`).

**Respuesta Exitosa (200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "cliente_id": "507f1f77bcf86cd799439012",
    "cliente_nombre": "Juan Pérez",
    "cliente_cedula": "V-12345678",
    "cliente_direccion": "Av. Principal, Caracas",
    "cliente_telefono": "04141234567",
    "items": [
      {
        "itemId": "507f1f77bcf86cd799439013",
        "cantidad": 2,
        "precio": 150.00,
        "item": {
          "nombre": "Puerta Victoria 2x1",
          "codigo": "0001",
          "descripcion": "Puerta de metal con acabado premium"
        }
      }
    ],
    "metodo_pago": "transferencia",
    "numero_referencia": "REF123456",
    "comprobante_url": "https://storage.example.com/comprobantes/abc123.png",
    "total": 300.00,
    "estado": "pendiente",
    "fecha_creacion": "2025-01-15T10:30:00Z",
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

## Estructura de Datos en MongoDB

### Colección: `pedidos_cliente` (o similar)

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  cliente_id: ObjectId("507f1f77bcf86cd799439012"),
  cliente_nombre: "Juan Pérez",
  cliente_cedula: "V-12345678",
  cliente_direccion: "Av. Principal, Caracas",
  cliente_telefono: "04141234567",
  items: [
    {
      itemId: ObjectId("507f1f77bcf86cd799439013"),
      cantidad: 2,
      precio: 150.00,
      // Opcional: Puedes incluir datos del item completo si lo necesitas
      item: {
        nombre: "Puerta Victoria 2x1",
        codigo: "0001",
        descripcion: "Puerta de metal con acabado premium"
      }
    }
  ],
  metodo_pago: "transferencia", // "transferencia", "pago_movil", "efectivo", "otro"
  numero_referencia: "REF123456",
  comprobante_url: "https://storage.example.com/comprobantes/abc123.png",
  total: 300.00,
  estado: "pendiente", // "pendiente", "procesando", "confirmado", "cancelado"
  fecha_creacion: ISODate("2025-01-15T10:30:00Z"),
  createdAt: ISODate("2025-01-15T10:30:00Z"),
  updatedAt: ISODate("2025-01-15T10:30:00Z")
}
```

## Endpoint de Creación (ya existe en frontend)

El frontend actualmente envía pedidos a:

### POST `/pedidos/cliente`

**Body:**
```json
{
  "cliente_id": "507f1f77bcf86cd799439012",
  "items": [
    {
      "itemId": "507f1f77bcf86cd799439013",
      "cantidad": 2,
      "precio": 150.00
    }
  ],
  "metodo_pago": "transferencia",
  "numero_referencia": "REF123456",
  "comprobante_url": "https://storage.example.com/comprobantes/abc123.png",
  "total": 300.00,
  "estado": "pendiente"
}
```

**Recomendación Backend:**
1. Al recibir el `POST /pedidos/cliente`, el backend debe:
   - Buscar el cliente por `cliente_id` para obtener `nombre`, `cedula`, `direccion`, `telefono`
   - Almacenar estos datos en el documento del pedido (para evitar dependencias futuras)
   - Opcionalmente, poblar los datos completos de cada `item` desde la colección `inventario`
   - Guardar el pedido en la base de datos

## Requisitos Importantes

### 1. Normalización de Datos
El backend debe asegurar que los datos del cliente se almacenen directamente en el pedido:
- `cliente_nombre`
- `cliente_cedula`
- `cliente_direccion`
- `cliente_telefono`

Esto permite mostrar la información incluso si el cliente se elimina o modifica en el futuro.

### 2. Poblado de Items (Opcional pero Recomendado)
Si es posible, cuando se recupera el pedido, poblar los datos completos de cada item desde la colección `inventario`:
- `item.nombre`
- `item.codigo`
- `item.descripcion`

Esto mejora la visualización en el frontend.

### 3. Manejo de Estados
Los estados posibles son:
- `pendiente`: Pedido recién creado, esperando revisión
- `procesando`: Pedido en proceso de revisión/procesamiento
- `confirmado`: Pedido confirmado y listo para procesar
- `cancelado`: Pedido cancelado

### 4. Ordenamiento
El endpoint `GET /pedidos/cliente` debe ordenar los pedidos por fecha de creación descendente (más recientes primero).

### 5. Filtrado (Opcional)
Considerar agregar parámetros de query para filtrar por:
- `estado`: Filtrar por estado específico
- `cliente_id`: Filtrar pedidos de un cliente específico
- `fecha_inicio` / `fecha_fin`: Filtrar por rango de fechas

## Ejemplo de Implementación Backend (Python/FastAPI)

```python
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from models.pedidos_cliente import PedidoCliente
from services.auth import verify_admin_token

router = APIRouter(prefix="/pedidos/cliente", tags=["Pedidos Web"])

@router.get("", response_model=List[PedidoCliente])
async def obtener_pedidos_cliente(
    current_user: dict = Depends(verify_admin_token)
):
    """
    Obtiene todos los pedidos creados desde el carrito de clientes web.
    Requiere autenticación de administrador.
    """
    try:
        # Buscar todos los pedidos, ordenados por fecha descendente
        pedidos = await db.pedidos_cliente.find(
            {}
        ).sort("fecha_creacion", -1).to_list(length=1000)
        
        # Poblar datos de items si es necesario
        for pedido in pedidos:
            for item in pedido.get("items", []):
                item_data = await db.inventario.find_one(
                    {"_id": ObjectId(item["itemId"])}
                )
                if item_data:
                    item["item"] = {
                        "nombre": item_data.get("nombre"),
                        "codigo": item_data.get("codigo"),
                        "descripcion": item_data.get("descripcion")
                    }
        
        return pedidos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def crear_pedido_cliente(
    pedido_data: dict,
    current_user: dict = Depends(verify_cliente_token)
):
    """
    Crea un nuevo pedido desde el carrito de clientes.
    Requiere autenticación de cliente.
    """
    try:
        cliente_id = pedido_data.get("cliente_id")
        
        # Buscar datos del cliente
        cliente = await db.clientes.find_one({"_id": ObjectId(cliente_id)})
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Preparar documento del pedido con datos del cliente
        pedido_doc = {
            "cliente_id": ObjectId(cliente_id),
            "cliente_nombre": cliente.get("nombre", ""),
            "cliente_cedula": cliente.get("cedula", ""),
            "cliente_direccion": cliente.get("direccion", ""),
            "cliente_telefono": cliente.get("telefono", ""),
            "items": pedido_data.get("items", []),
            "metodo_pago": pedido_data.get("metodo_pago", ""),
            "numero_referencia": pedido_data.get("numero_referencia", ""),
            "comprobante_url": pedido_data.get("comprobante_url", ""),
            "total": pedido_data.get("total", 0),
            "estado": "pendiente",
            "fecha_creacion": datetime.utcnow(),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await db.pedidos_cliente.insert_one(pedido_doc)
        
        return {
            "_id": str(result.inserted_id),
            "mensaje": "Pedido creado exitosamente"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Índices Recomendados

```javascript
// Índices para optimizar consultas
db.pedidos_cliente.createIndex({ "fecha_creacion": -1 });
db.pedidos_cliente.createIndex({ "cliente_id": 1 });
db.pedidos_cliente.createIndex({ "estado": 1 });
db.pedidos_cliente.createIndex({ "cliente_nombre": 1 }); // Para búsquedas
```

## Validaciones

1. **Al crear un pedido:**
   - Validar que `cliente_id` existe
   - Validar que todos los `items` tienen `itemId`, `cantidad` y `precio`
   - Validar que `total` coincide con la suma de `items` (precio * cantidad)
   - Validar que `comprobante_url` es una URL válida o está vacía

2. **Al obtener pedidos:**
   - Verificar que el usuario tiene permisos de administrador
   - Retornar lista vacía si no hay pedidos (no error)

## Notas Adicionales

- Los pedidos web son diferentes a los pedidos administrativos (`/pedidos/all`). Mantener colecciones separadas o un campo `origen: "web"` para diferenciarlos.
- La imagen del comprobante se sube previamente usando `/files/upload` (endpoint existente).
- Considerar agregar endpoints para actualizar el estado del pedido desde el panel administrativo.

