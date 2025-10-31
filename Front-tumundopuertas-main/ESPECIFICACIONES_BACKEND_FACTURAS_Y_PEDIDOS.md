# Especificaciones Backend - Persistencia de Facturas Confirmadas y Pedidos Cargados al Inventario

## Resumen del Problema

Actualmente, cuando se factura un pedido o se carga al inventario, los datos se guardan solo en `localStorage` del navegador. Esto significa que:
- Se pierden al recargar la página
- Se pierden al cambiar de navegador/dispositivo
- No hay historial permanente

**Solución:** El backend debe guardar estos datos en MongoDB para que persistan permanentemente.

---

## 1. Facturas Confirmadas

### Colección: `facturas_confirmadas`

### Estructura de Documento:
```javascript
{
  _id: ObjectId,
  pedidoId: String,  // ID del pedido facturado (único, no debe duplicarse)
  numeroFactura: String,  // Ejemplo: "F-20251031-123456"
  clienteNombre: String,
  clienteId: String,  // RIF del cliente
  montoTotal: Number,
  fechaCreacion: String (ISO 8601),  // Fecha de creación del pedido
  fechaFacturacion: String (ISO 8601),  // Fecha en que se facturó
  items: [
    {
      id: String,
      codigo: String,
      nombre: String,
      descripcion: String,
      cantidad: Number,
      precio: Number
    }
  ]
}
```

### Endpoints Requeridos:

#### POST `/facturas-confirmadas`
**Descripción:** Guarda una nueva factura confirmada

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "pedidoId": "string",
  "numeroFactura": "string",
  "clienteNombre": "string",
  "clienteId": "string",
  "montoTotal": "number",
  "fechaCreacion": "string (ISO 8601)",
  "fechaFacturacion": "string (ISO 8601)",
  "items": [
    {
      "id": "string",
      "codigo": "string",
      "nombre": "string",
      "descripcion": "string",
      "cantidad": "number",
      "precio": "number"
    }
  ]
}
```

**Validaciones:**
- `pedidoId` es requerido
- `pedidoId` debe ser único (no debe existir otra factura con el mismo `pedidoId`)
- Si ya existe una factura con ese `pedidoId`, retornar 409 (Conflict) o actualizar la existente

**Respuesta (201):**
```json
{
  "_id": "string",
  "pedidoId": "string",
  "numeroFactura": "string",
  "clienteNombre": "string",
  "clienteId": "string",
  "montoTotal": "number",
  "fechaCreacion": "string",
  "fechaFacturacion": "string",
  "items": [...]
}
```

---

#### GET `/facturas-confirmadas`
**Descripción:** Obtiene todas las facturas confirmadas

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
[
  {
    "_id": "string",
    "pedidoId": "string",
    "numeroFactura": "string",
    "clienteNombre": "string",
    "clienteId": "string",
    "montoTotal": "number",
    "fechaCreacion": "string",
    "fechaFacturacion": "string",
    "items": [...]
  }
]
```

**Orden:** Ordenar por `fechaFacturacion` descendente (más reciente primero)

---

#### DELETE `/facturas-confirmadas/{pedidoId}`
**Descripción:** Elimina una factura confirmada por pedidoId (opcional, para casos especiales)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros:**
- `pedidoId`: ID del pedido

**Respuesta (200):**
```json
{
  "message": "Factura eliminada exitosamente"
}
```

---

## 2. Pedidos Cargados al Inventario

### Colección: `pedidos_cargados_inventario`

### Estructura de Documento:
```javascript
{
  _id: ObjectId,
  pedidoId: String,  // ID del pedido (único, no debe duplicarse)
  clienteNombre: String,
  clienteId: String,  // RIF del cliente
  montoTotal: Number,
  fechaCreacion: String (ISO 8601),  // Fecha de creación del pedido
  fechaCargaInventario: String (ISO 8601),  // Fecha en que se cargó al inventario
  items: [
    {
      codigo: String,
      nombre: String,
      descripcion: String,
      cantidad: Number,
      precio: Number
    }
  ]
}
```

### Endpoints Requeridos:

#### POST `/pedidos-cargados-inventario`
**Descripción:** Guarda un pedido que fue cargado al inventario

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "pedidoId": "string",
  "clienteNombre": "string",
  "clienteId": "string",
  "montoTotal": "number",
  "fechaCreacion": "string (ISO 8601)",
  "fechaCargaInventario": "string (ISO 8601)",
  "items": [
    {
      "codigo": "string",
      "nombre": "string",
      "descripcion": "string",
      "cantidad": "number",
      "precio": "number"
    }
  ]
}
```

**Validaciones:**
- `pedidoId` es requerido
- `pedidoId` debe ser único (no debe existir otro registro con el mismo `pedidoId`)
- Si ya existe un registro con ese `pedidoId`, actualizar el existente (usar `fechaCargaInventario` más reciente)

**Respuesta (201):**
```json
{
  "_id": "string",
  "pedidoId": "string",
  "clienteNombre": "string",
  "clienteId": "string",
  "montoTotal": "number",
  "fechaCreacion": "string",
  "fechaCargaInventario": "string",
  "items": [...]
}
```

---

#### GET `/pedidos-cargados-inventario`
**Descripción:** Obtiene todos los pedidos cargados al inventario

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
[
  {
    "_id": "string",
    "pedidoId": "string",
    "clienteNombre": "string",
    "clienteId": "string",
    "montoTotal": "number",
    "fechaCreacion": "string",
    "fechaCargaInventario": "string",
    "items": [...]
  }
]
```

**Orden:** Ordenar por `fechaCreacion` descendente (más reciente primero)

---

#### PATCH `/pedidos-cargados-inventario/{pedidoId}`
**Descripción:** Actualiza un pedido cargado al inventario (útil para actualizar `fechaCargaInventario`)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parámetros:**
- `pedidoId`: ID del pedido

**Body:**
```json
{
  "fechaCargaInventario": "string (ISO 8601)",
  // ... otros campos opcionales
}
```

**Respuesta (200):**
```json
{
  "_id": "string",
  "pedidoId": "string",
  // ... campos actualizados
}
```

---

## Índices Recomendados

### Para `facturas_confirmadas`:
```javascript
db.facturas_confirmadas.createIndex({ "pedidoId": 1 }, { unique: true });
db.facturas_confirmadas.createIndex({ "fechaFacturacion": -1 });
db.facturas_confirmadas.createIndex({ "clienteId": 1 });
```

### Para `pedidos_cargados_inventario`:
```javascript
db.pedidos_cargados_inventario.createIndex({ "pedidoId": 1 }, { unique: true });
db.pedidos_cargados_inventario.createIndex({ "fechaCreacion": -1 });
db.pedidos_cargados_inventario.createIndex({ "clienteId": 1 });
db.pedidos_cargados_inventario.createIndex({ "fechaCargaInventario": -1 });
```

---

## Comportamiento Esperado

### Al facturar un pedido:
1. Frontend llama a `POST /facturas-confirmadas` con los datos de la factura
2. Backend guarda en `facturas_confirmadas`
3. Backend retorna la factura guardada
4. Frontend también guarda en localStorage como backup

### Al cargar existencias al inventario:
1. Frontend llama a `POST /pedidos-cargados-inventario` con los datos del pedido
2. Backend guarda en `pedidos_cargados_inventario`
3. Backend retorna el pedido guardado
4. Frontend también guarda en localStorage como backup

### Al cargar la página `/facturacion`:
1. Frontend llama a `GET /facturas-confirmadas`
2. Frontend llama a `GET /pedidos-cargados-inventario`
3. Si falla el backend, usa localStorage como backup
4. Muestra las facturas en "Facturas Procesadas"
5. Muestra los pedidos en "Pedidos con Existencias Cargadas"

---

## Ejemplo de Código Backend (Python/FastAPI)

### Router para Facturas Confirmadas:
```python
from fastapi import APIRouter, HTTPException
from ..config.mongodb import facturas_confirmadas_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/facturas-confirmadas")
async def crear_factura_confirmada(factura: dict):
    # Verificar si ya existe
    existe = facturas_confirmadas_collection.find_one({"pedidoId": factura["pedidoId"]})
    if existe:
        # Actualizar la existente
        facturas_confirmadas_collection.update_one(
            {"pedidoId": factura["pedidoId"]},
            {"$set": factura}
        )
        return facturas_confirmadas_collection.find_one({"pedidoId": factura["pedidoId"]})
    
    # Crear nueva
    factura["_id"] = ObjectId()
    facturas_confirmadas_collection.insert_one(factura)
    factura["_id"] = str(factura["_id"])
    return factura

@router.get("/facturas-confirmadas")
async def obtener_facturas_confirmadas():
    facturas = list(facturas_confirmadas_collection.find().sort("fechaFacturacion", -1))
    for factura in facturas:
        factura["_id"] = str(factura["_id"])
    return facturas
```

### Router para Pedidos Cargados al Inventario:
```python
@router.post("/pedidos-cargados-inventario")
async def crear_pedido_cargado(pedido: dict):
    # Verificar si ya existe
    existe = pedidos_cargados_inventario_collection.find_one({"pedidoId": pedido["pedidoId"]})
    if existe:
        # Actualizar la existente
        pedidos_cargados_inventario_collection.update_one(
            {"pedidoId": pedido["pedidoId"]},
            {"$set": pedido}
        )
        resultado = pedidos_cargados_inventario_collection.find_one({"pedidoId": pedido["pedidoId"]})
        resultado["_id"] = str(resultado["_id"])
        return resultado
    
    # Crear nuevo
    pedido["_id"] = ObjectId()
    pedidos_cargados_inventario_collection.insert_one(pedido)
    pedido["_id"] = str(pedido["_id"])
    return pedido

@router.get("/pedidos-cargados-inventario")
async def obtener_pedidos_cargados():
    pedidos = list(pedidos_cargados_inventario_collection.find().sort("fechaCreacion", -1))
    for pedido in pedidos:
        pedido["_id"] = str(pedido["_id"])
    return pedidos
```

---

## Resumen para la IA del Backend

**Necesitas crear 6 endpoints:**

### Facturas Confirmadas:
1. `POST /facturas-confirmadas` - Guardar factura
2. `GET /facturas-confirmadas` - Listar todas
3. `DELETE /facturas-confirmadas/{pedidoId}` - Eliminar (opcional)

### Pedidos Cargados al Inventario:
1. `POST /pedidos-cargados-inventario` - Guardar pedido
2. `GET /pedidos-cargados-inventario` - Listar todos
3. `PATCH /pedidos-cargados-inventario/{pedidoId}` - Actualizar (opcional)

**Colecciones MongoDB:**
- `facturas_confirmadas`
- `pedidos_cargados_inventario`

**Importante:**
- `pedidoId` debe ser único en cada colección
- Si se intenta guardar un `pedidoId` que ya existe, actualizar el registro existente
- Ordenar por fecha descendente al listar
- Todos los endpoints requieren autenticación con JWT



