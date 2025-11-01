# Especificaciones Backend - Pedidos Clientes y Sistema de Facturación con Abonos

## Descripción General
Este documento especifica los requerimientos del backend para:
1. **Pedidos desde el carrito de clientes**: Cuando un cliente envía un pedido desde su carrito (`/clientes`), se debe almacenar en su módulo "Mis Pedidos"
2. **Creación automática de factura**: Al crear un pedido, se debe generar automáticamente una factura asociada
3. **Sistema de abonos**: Los clientes pueden realizar abonos parciales a sus facturas con comprobantes de pago

---

## 1. FLUJO DE CREACIÓN DE PEDIDO Y FACTURA

### POST `/pedidos/cliente` (Ya existe en frontend, necesita actualización backend)

**Request Body:**
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

**Proceso Backend (CRÍTICO):**

1. **Validar datos del cliente:**
   - Buscar cliente por `cliente_id`
   - Obtener: `nombre`, `cedula`, `direccion`, `telefono`
   - Si el cliente no existe, retornar error 404

2. **Crear el pedido:**
   - Guardar en colección `pedidos_cliente` (o similar)
   - Almacenar datos del cliente directamente en el pedido (para persistencia)
   - Estructura del pedido:
   ```javascript
   {
     _id: ObjectId(),
     cliente_id: ObjectId("507f1f77bcf86cd799439012"),
     cliente_nombre: "Juan Pérez",
     cliente_cedula: "V-12345678",
     cliente_direccion: "Av. Principal, Caracas",
     cliente_telefono: "04141234567",
     items: [
       {
         itemId: ObjectId("507f1f77bcf86cd799439013"),
         cantidad: 2,
         precio: 150.00
       }
     ],
     metodo_pago: "transferencia",
     numero_referencia: "REF123456",
     comprobante_url: "https://storage.example.com/comprobantes/abc123.png",
     total: 300.00,
     estado: "pendiente",
     fecha_creacion: ISODate(),
     createdAt: ISODate(),
     updatedAt: ISODate()
   }
   ```

3. **CREAR FACTURA AUTOMÁTICAMENTE:**
   - Inmediatamente después de crear el pedido, generar una factura
   - Generar número de factura único (formato recomendado: `F-YYYYMMDD-XXXXXX` o secuencial)
   - Estructura de la factura:
   ```javascript
   {
     _id: ObjectId(),
     numero_factura: "F-20250115-000001", // Generar número único
     pedido_id: ObjectId(), // ID del pedido recién creado
     cliente_id: ObjectId("507f1f77bcf86cd799439012"),
     cliente_nombre: "Juan Pérez",
     cliente_cedula: "V-12345678",
     cliente_direccion: "Av. Principal, Caracas",
     cliente_telefono: "04141234567",
     monto_total: 300.00,
     monto_abonado: 0.00, // Inicialmente 0
     saldo_pendiente: 300.00, // Igual a monto_total inicialmente
     historial_abonos: [], // Array vacío inicialmente
     estado: "pendiente", // "pendiente", "parcial", "pagada"
     fecha_facturacion: ISODate(),
     fecha_creacion: ISODate(),
     createdAt: ISODate(),
     updatedAt: ISODate()
   }
   ```

4. **Respuesta:**
   ```json
   {
     "pedido": {
       "_id": "507f1f77bcf86cd799439011",
       "cliente_id": "507f1f77bcf86cd799439012",
       "total": 300.00,
       "estado": "pendiente",
       "fecha_creacion": "2025-01-15T10:30:00Z"
     },
     "factura": {
       "_id": "507f1f77bcf86cd799439014",
       "numero_factura": "F-20250115-000001",
       "monto_total": 300.00,
       "monto_abonado": 0.00,
       "saldo_pendiente": 300.00
     },
     "mensaje": "Pedido y factura creados exitosamente"
   }
   ```

---

## 2. OBTENER PEDIDOS DEL CLIENTE

### GET `/pedidos/cliente/{cliente_id}`

**Descripción:** Obtiene todos los pedidos de un cliente específico para mostrar en "Mis Pedidos".

**Autenticación:** Requiere token de cliente (`Bearer token`) y el `cliente_id` debe coincidir con el usuario autenticado.

**Respuesta (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "cliente_id": "507f1f77bcf86cd799439012",
    "items": [
      {
        "itemId": "507f1f77bcf86cd799439013",
        "cantidad": 2,
        "precio": 150.00,
        "item": {
          "nombre": "Puerta Victoria 2x1",
          "codigo": "0001"
        }
      }
    ],
    "total": 300.00,
    "estado": "pendiente",
    "fecha_creacion": "2025-01-15T10:30:00Z"
  }
]
```

**Validaciones:**
- Verificar que el `cliente_id` del token coincide con el `cliente_id` del endpoint
- Si no coincide, retornar 403 Forbidden
- Opcional: Poblar datos completos de items desde `inventario`

---

## 3. OBTENER FACTURAS DEL CLIENTE

### GET `/facturas/cliente/{cliente_id}`

**Descripción:** Obtiene todas las facturas de un cliente específico para mostrar en "Mis Facturas".

**Autenticación:** Requiere token de cliente (`Bearer token`) y el `cliente_id` debe coincidir con el usuario autenticado.

**Respuesta (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439014",
    "numero_factura": "F-20250115-000001",
    "monto_total": 300.00,
    "monto_abonado": 150.00,
    "saldo_pendiente": 150.00,
    "estado": "parcial",
    "fecha_facturacion": "2025-01-15T10:30:00Z",
    "pedido_id": "507f1f77bcf86cd799439011"
  }
]
```

**Validaciones:**
- Verificar que el `cliente_id` del token coincide con el `cliente_id` del endpoint
- Si no coincide, retornar 403 Forbidden
- Calcular `saldo_pendiente` como `monto_total - monto_abonado` si no está almacenado
- Actualizar `estado` según:
  - `pagada`: `saldo_pendiente <= 0`
  - `parcial`: `monto_abonado > 0 && saldo_pendiente > 0`
  - `pendiente`: `monto_abonado == 0`

---

## 4. SISTEMA DE ABONOS A FACTURAS

### POST `/facturas/{factura_id}/abonar`

**Descripción:** Permite a un cliente realizar un abono parcial a una factura.

**Autenticación:** Requiere token de cliente (`Bearer token`) y verificar que la factura pertenece al cliente autenticado.

**Request Body:**
```json
{
  "cantidad": 150.00,
  "metodo_pago": "transferencia",
  "numero_referencia": "REF789012",
  "comprobante_url": "https://storage.example.com/comprobantes/def456.png"
}
```

**Proceso Backend (CRÍTICO):**

1. **Validar factura:**
   - Buscar factura por `factura_id`
   - Verificar que existe
   - Verificar que pertenece al cliente autenticado (comparar `cliente_id`)
   - Si no pertenece, retornar 403 Forbidden

2. **Validar cantidad:**
   - Verificar que `cantidad > 0`
   - Verificar que `cantidad <= saldo_pendiente`
   - Si `cantidad > saldo_pendiente`, retornar error 400 con mensaje descriptivo

3. **Crear registro de abono:**
   ```javascript
   {
     fecha: ISODate(),
     cantidad: 150.00,
     metodo_pago: "transferencia",
     numero_referencia: "REF789012",
     comprobante_url: "https://storage.example.com/comprobantes/def456.png",
     estado: "pendiente" // "pendiente", "confirmado", "rechazado"
   }
   ```

4. **Actualizar factura (usar operación atómica):**
   ```javascript
   {
     "$inc": {
       "monto_abonado": 150.00,
       "saldo_pendiente": -150.00
     },
     "$push": {
       "historial_abonos": {
         "fecha": ISODate(),
         "cantidad": 150.00,
         "metodo_pago": "transferencia",
         "numero_referencia": "REF789012",
         "comprobante_url": "https://storage.example.com/comprobantes/def456.png",
         "estado": "pendiente"
       }
     },
     "$set": {
       "updatedAt": ISODate()
     }
   }
   ```

5. **Actualizar estado de la factura:**
   - Calcular nuevo `saldo_pendiente`
   - Si `saldo_pendiente <= 0`: `estado = "pagada"`
   - Si `monto_abonado > 0 && saldo_pendiente > 0`: `estado = "parcial"`
   - Si `monto_abonado == 0`: `estado = "pendiente"`

6. **Respuesta exitosa (200):**
   ```json
   {
     "_id": "507f1f77bcf86cd799439014",
     "numero_factura": "F-20250115-000001",
     "monto_total": 300.00,
     "monto_abonado": 150.00,
     "saldo_pendiente": 150.00,
     "estado": "parcial",
     "historial_abonos": [
       {
         "fecha": "2025-01-16T14:30:00Z",
         "cantidad": 150.00,
         "metodo_pago": "transferencia",
         "numero_referencia": "REF789012",
         "comprobante_url": "https://storage.example.com/comprobantes/def456.png",
         "estado": "pendiente"
       }
     ],
     "mensaje": "Abono registrado exitosamente"
   }
   ```

---

## 5. ESTRUCTURAS DE DATOS EN MONGODB

### Colección: `pedidos_cliente`

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
      precio: 150.00
    }
  ],
  metodo_pago: "transferencia",
  numero_referencia: "REF123456",
  comprobante_url: "https://storage.example.com/comprobantes/abc123.png",
  total: 300.00,
  estado: "pendiente", // "pendiente", "procesando", "confirmado", "cancelado"
  fecha_creacion: ISODate("2025-01-15T10:30:00Z"),
  createdAt: ISODate("2025-01-15T10:30:00Z"),
  updatedAt: ISODate("2025-01-15T10:30:00Z")
}
```

### Colección: `facturas_cliente`

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  numero_factura: "F-20250115-000001", // ÚNICO, generar automáticamente
  pedido_id: ObjectId("507f1f77bcf86cd799439011"),
  cliente_id: ObjectId("507f1f77bcf86cd799439012"),
  cliente_nombre: "Juan Pérez",
  cliente_cedula: "V-12345678",
  cliente_direccion: "Av. Principal, Caracas",
  cliente_telefono: "04141234567",
  monto_total: 300.00,
  monto_abonado: 150.00,
  saldo_pendiente: 150.00,
  historial_abonos: [
    {
      fecha: ISODate("2025-01-16T14:30:00Z"),
      cantidad: 150.00,
      metodo_pago: "transferencia",
      numero_referencia: "REF789012",
      comprobante_url: "https://storage.example.com/comprobantes/def456.png",
      estado: "pendiente" // "pendiente", "confirmado", "rechazado"
    }
  ],
  estado: "parcial", // "pendiente", "parcial", "pagada"
  fecha_facturacion: ISODate("2025-01-15T10:30:00Z"),
  fecha_creacion: ISODate("2025-01-15T10:30:00Z"),
  createdAt: ISODate("2025-01-15T10:30:00Z"),
  updatedAt: ISODate("2025-01-15T10:30:00Z")
}
```

---

## 6. ÍNDICES RECOMENDADOS

```javascript
// Colección pedidos_cliente
db.pedidos_cliente.createIndex({ "cliente_id": 1 });
db.pedidos_cliente.createIndex({ "fecha_creacion": -1 });
db.pedidos_cliente.createIndex({ "estado": 1 });

// Colección facturas_cliente
db.facturas_cliente.createIndex({ "numero_factura": 1 }, { unique: true });
db.facturas_cliente.createIndex({ "cliente_id": 1 });
db.facturas_cliente.createIndex({ "pedido_id": 1 });
db.facturas_cliente.createIndex({ "fecha_facturacion": -1 });
db.facturas_cliente.createIndex({ "estado": 1 });
```

---

## 7. GENERACIÓN DE NÚMERO DE FACTURA

**Recomendación:** Usar formato `F-YYYYMMDD-XXXXXX` donde:
- `F`: Prefijo "Factura"
- `YYYYMMDD`: Fecha en formato año-mes-día
- `XXXXXX`: Número secuencial del día (6 dígitos, padding con ceros)

**Ejemplo:** `F-20250115-000001`, `F-20250115-000002`, etc.

**Implementación sugerida:**
- Usar contador por fecha o contador global
- Asegurar unicidad con índice único en MongoDB
- Si hay conflicto, incrementar y reintentar

---

## 8. VALIDACIONES Y REGLAS DE NEGOCIO

### Al crear pedido:
- ✅ Validar que `cliente_id` existe
- ✅ Validar que todos los `items` tienen `itemId`, `cantidad` y `precio`
- ✅ Validar que `total` coincide con la suma de `items` (precio * cantidad)
- ✅ Validar que `comprobante_url` es una URL válida o está vacía
- ✅ **CRÍTICO:** Crear factura automáticamente después del pedido

### Al abonar factura:
- ✅ Validar que la factura existe
- ✅ Validar que la factura pertenece al cliente autenticado
- ✅ Validar que `cantidad > 0`
- ✅ Validar que `cantidad <= saldo_pendiente`
- ✅ Usar operación atómica (`$inc`) para actualizar `monto_abonado` y `saldo_pendiente`
- ✅ Actualizar `estado` de la factura según el nuevo saldo
- ✅ Agregar abono al `historial_abonos`

### Al obtener pedidos/facturas:
- ✅ Verificar autenticación
- ✅ Verificar que el `cliente_id` del token coincide con el solicitado
- ✅ Si no coincide, retornar 403 Forbidden

---

## 9. EJEMPLO DE IMPLEMENTACIÓN BACKEND (Python/FastAPI)

```python
from fastapi import APIRouter, Depends, HTTPException
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from typing import List
import re

router = APIRouter(prefix="/pedidos", tags=["Pedidos Clientes"])
router_facturas = APIRouter(prefix="/facturas", tags=["Facturas Clientes"])

# === CREAR PEDIDO Y FACTURA ===
@router.post("/cliente")
async def crear_pedido_cliente(pedido_data: dict, current_user: dict = Depends(verify_cliente_token)):
    """
    Crea un pedido desde el carrito de clientes y genera automáticamente una factura.
    """
    try:
        cliente_id = pedido_data.get("cliente_id")
        
        # Validar cliente
        cliente = await db.clientes.find_one({"_id": ObjectId(cliente_id)})
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Validar que el cliente_id coincide con el usuario autenticado
        if str(cliente["_id"]) != current_user.get("cliente_id"):
            raise HTTPException(status_code=403, detail="No autorizado")
        
        # Crear pedido
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
        
        # Insertar pedido
        pedido_result = await db.pedidos_cliente.insert_one(pedido_doc)
        pedido_id = pedido_result.inserted_id
        
        # Generar número de factura único
        fecha_hoy = datetime.utcnow().strftime("%Y%m%d")
        numero_factura = await generar_numero_factura(fecha_hoy)
        
        # Crear factura automáticamente
        factura_doc = {
            "numero_factura": numero_factura,
            "pedido_id": pedido_id,
            "cliente_id": ObjectId(cliente_id),
            "cliente_nombre": cliente.get("nombre", ""),
            "cliente_cedula": cliente.get("cedula", ""),
            "cliente_direccion": cliente.get("direccion", ""),
            "cliente_telefono": cliente.get("telefono", ""),
            "monto_total": pedido_data.get("total", 0),
            "monto_abonado": 0.00,
            "saldo_pendiente": pedido_data.get("total", 0),
            "historial_abonos": [],
            "estado": "pendiente",
            "fecha_facturacion": datetime.utcnow(),
            "fecha_creacion": datetime.utcnow(),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        factura_result = await db.facturas_cliente.insert_one(factura_doc)
        
        return {
            "pedido": {
                "_id": str(pedido_id),
                "cliente_id": cliente_id,
                "total": pedido_data.get("total", 0),
                "estado": "pendiente",
                "fecha_creacion": pedido_doc["fecha_creacion"].isoformat()
            },
            "factura": {
                "_id": str(factura_result.inserted_id),
                "numero_factura": numero_factura,
                "monto_total": factura_doc["monto_total"],
                "monto_abonado": 0.00,
                "saldo_pendiente": factura_doc["saldo_pendiente"]
            },
            "mensaje": "Pedido y factura creados exitosamente"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === OBTENER PEDIDOS DEL CLIENTE ===
@router.get("/cliente/{cliente_id}")
async def obtener_pedidos_cliente(
    cliente_id: str,
    current_user: dict = Depends(verify_cliente_token)
):
    """
    Obtiene todos los pedidos de un cliente.
    """
    # Validar que el cliente_id coincide
    if cliente_id != current_user.get("cliente_id"):
        raise HTTPException(status_code=403, detail="No autorizado")
    
    pedidos = await db.pedidos_cliente.find(
        {"cliente_id": ObjectId(cliente_id)}
    ).sort("fecha_creacion", -1).to_list(length=1000)
    
    # Convertir ObjectId a string
    for pedido in pedidos:
        pedido["_id"] = str(pedido["_id"])
        pedido["cliente_id"] = str(pedido["cliente_id"])
    
    return pedidos

# === OBTENER FACTURAS DEL CLIENTE ===
@router_facturas.get("/cliente/{cliente_id}")
async def obtener_facturas_cliente(
    cliente_id: str,
    current_user: dict = Depends(verify_cliente_token)
):
    """
    Obtiene todas las facturas de un cliente.
    """
    # Validar que el cliente_id coincide
    if cliente_id != current_user.get("cliente_id"):
        raise HTTPException(status_code=403, detail="No autorizado")
    
    facturas = await db.facturas_cliente.find(
        {"cliente_id": ObjectId(cliente_id)}
    ).sort("fecha_facturacion", -1).to_list(length=1000)
    
    # Convertir ObjectId a string y calcular saldo si falta
    for factura in facturas:
        factura["_id"] = str(factura["_id"])
        factura["cliente_id"] = str(factura["cliente_id"])
        factura["pedido_id"] = str(factura.get("pedido_id", ""))
        
        # Recalcular saldo si es necesario
        if "saldo_pendiente" not in factura:
            factura["saldo_pendiente"] = factura.get("monto_total", 0) - factura.get("monto_abonado", 0)
        
        # Actualizar estado
        saldo = factura["saldo_pendiente"]
        if saldo <= 0:
            factura["estado"] = "pagada"
        elif factura.get("monto_abonado", 0) > 0:
            factura["estado"] = "parcial"
        else:
            factura["estado"] = "pendiente"
    
    return facturas

# === ABONAR FACTURA ===
@router_facturas.post("/{factura_id}/abonar")
async def abonar_factura(
    factura_id: str,
    abono_data: dict,
    current_user: dict = Depends(verify_cliente_token)
):
    """
    Registra un abono a una factura.
    """
    try:
        # Buscar factura
        factura = await db.facturas_cliente.find_one({"_id": ObjectId(factura_id)})
        if not factura:
            raise HTTPException(status_code=404, detail="Factura no encontrada")
        
        # Validar que pertenece al cliente autenticado
        if str(factura["cliente_id"]) != current_user.get("cliente_id"):
            raise HTTPException(status_code=403, detail="No autorizado para abonar esta factura")
        
        cantidad = float(abono_data.get("cantidad", 0))
        saldo_actual = factura.get("saldo_pendiente", factura.get("monto_total", 0) - factura.get("monto_abonado", 0))
        
        # Validar cantidad
        if cantidad <= 0:
            raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")
        if cantidad > saldo_actual:
            raise HTTPException(status_code=400, detail=f"La cantidad no puede ser mayor al saldo pendiente (${saldo_actual:.2f})")
        
        # Crear registro de abono
        abono_registro = {
            "fecha": datetime.utcnow(),
            "cantidad": cantidad,
            "metodo_pago": abono_data.get("metodo_pago", ""),
            "numero_referencia": abono_data.get("numero_referencia", ""),
            "comprobante_url": abono_data.get("comprobante_url", ""),
            "estado": "pendiente"
        }
        
        # Actualizar factura con operación atómica
        nuevo_saldo = saldo_actual - cantidad
        
        update_doc = {
            "$inc": {
                "monto_abonado": cantidad,
                "saldo_pendiente": -cantidad
            },
            "$push": {
                "historial_abonos": abono_registro
            },
            "$set": {
                "updatedAt": datetime.utcnow()
            }
        }
        
        # Actualizar estado según nuevo saldo
        if nuevo_saldo <= 0:
            update_doc["$set"]["estado"] = "pagada"
        elif factura.get("monto_abonado", 0) + cantidad > 0:
            update_doc["$set"]["estado"] = "parcial"
        
        await db.facturas_cliente.update_one(
            {"_id": ObjectId(factura_id)},
            update_doc
        )
        
        # Obtener factura actualizada
        factura_actualizada = await db.facturas_cliente.find_one({"_id": ObjectId(factura_id)})
        factura_actualizada["_id"] = str(factura_actualizada["_id"])
        factura_actualizada["cliente_id"] = str(factura_actualizada["cliente_id"])
        factura_actualizada["pedido_id"] = str(factura_actualizada.get("pedido_id", ""))
        
        return {
            **factura_actualizada,
            "mensaje": "Abono registrado exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === FUNCIÓN AUXILIAR: GENERAR NÚMERO DE FACTURA ===
async def generar_numero_factura(fecha_str: str) -> str:
    """
    Genera un número de factura único con formato F-YYYYMMDD-XXXXXX
    """
    prefijo = f"F-{fecha_str}-"
    
    # Buscar el último número del día
    ultima_factura = await db.facturas_cliente.find_one(
        {"numero_factura": {"$regex": f"^{prefijo}"}},
        sort=[("numero_factura", -1)]
    )
    
    if ultima_factura:
        # Extraer número y incrementar
        ultimo_num = int(ultima_factura["numero_factura"].split("-")[-1])
        nuevo_num = ultimo_num + 1
    else:
        nuevo_num = 1
    
    # Formatear con padding de 6 dígitos
    numero_factura = f"{prefijo}{nuevo_num:06d}"
    
    # Verificar unicidad (si hay conflicto, reintentar)
    existe = await db.facturas_cliente.find_one({"numero_factura": numero_factura})
    if existe:
        nuevo_num += 1
        numero_factura = f"{prefijo}{nuevo_num:06d}"
    
    return numero_factura
```

---

## 10. RESUMEN DE ENDPOINTS NECESARIOS

### Endpoints de Pedidos:
1. `POST /pedidos/cliente` - Crear pedido y factura automáticamente
2. `GET /pedidos/cliente/{cliente_id}` - Obtener pedidos del cliente

### Endpoints de Facturas:
1. `GET /facturas/cliente/{cliente_id}` - Obtener facturas del cliente
2. `POST /facturas/{factura_id}/abonar` - Registrar abono a factura

### Endpoints Administrativos (ya existentes):
1. `GET /pedidos/cliente` - Obtener todos los pedidos web (para módulo Pedidos Web)

---

## 11. NOTAS IMPORTANTES

- **CRÍTICO:** Al crear un pedido, SIEMPRE crear una factura automáticamente
- **CRÍTICO:** Usar operaciones atómicas (`$inc`) para actualizar `monto_abonado` y `saldo_pendiente`
- **CRÍTICO:** Validar siempre que el `cliente_id` del token coincide con el solicitado
- Los datos del cliente deben almacenarse directamente en pedidos y facturas (para persistencia)
- El número de factura debe ser único (usar índice único en MongoDB)
- Los abonos deben agregarse al `historial_abonos` y actualizar el estado de la factura

---

## 12. ESTRUCTURA DE RESPUESTAS DE ERROR

```json
{
  "detail": "Mensaje descriptivo del error"
}
```

**Códigos de estado:**
- `400 Bad Request`: Datos inválidos (cantidad mayor al saldo, etc.)
- `403 Forbidden`: No autorizado (cliente_id no coincide)
- `404 Not Found`: Recurso no encontrado (cliente, factura, etc.)
- `500 Internal Server Error`: Error del servidor

