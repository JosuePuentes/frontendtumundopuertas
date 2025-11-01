# Especificaciones Backend - Flujo Completo Pedidos Web

## ⚠️ IMPORTANTE: Este documento aclara el flujo completo

Este documento complementa las especificaciones existentes y explica **cómo funciona el sistema completo** desde que un cliente envía un pedido hasta que aparece en el módulo administrativo "Pedidos Web".

---

## FLUJO COMPLETO DEL SISTEMA

### 1. Cliente envía pedido desde `/clientes` (Frontend)

**Frontend llama a:**
```
POST /pedidos/cliente
```

**Body enviado:**
```json
{
  "cliente_id": "507f1f77bcf86cd799439012",
  "items": [...],
  "metodo_pago": "transferencia",
  "numero_referencia": "REF123456",
  "comprobante_url": "https://...",
  "total": 300.00,
  "estado": "pendiente"
}
```

### 2. Backend recibe el pedido y DEBE:

**A. Crear el pedido en la base de datos:**
- **Colección:** `pedidos_cliente` (o la que uses para pedidos web)
- **IMPORTANTE:** Este es el MISMO pedido que verán los administradores
- Guardar con todos los datos del cliente incluidos directamente

**B. Crear la factura automáticamente:**
- **Colección:** `facturas_cliente`
- Generar número de factura único
- Asociar `pedido_id` a la factura
- Ver especificaciones completas en `ESPECIFICACIONES_BACKEND_PEDIDOS_CLIENTES_Y_FACTURAS.md`

### 3. Administrador accede a `/pedidos-web` (Frontend)

**Frontend llama a:**
```
GET /pedidos/cliente
```

**⚠️ CRÍTICO:** Este endpoint DEBE retornar:
- **Los mismos pedidos** que se crearon con `POST /pedidos/cliente`
- No son pedidos diferentes
- Es la MISMA colección (`pedidos_cliente`)
- Solo cambia quién los consulta (cliente vs administrador)

**El backend DEBE:**
- Buscar en la colección `pedidos_cliente`
- Retornar TODOS los pedidos creados desde el carrito web
- Ordenar por fecha descendente (más recientes primero)

### 4. Cliente ve sus pedidos en "Mis Pedidos" (Frontend)

**Frontend llama a:**
```
GET /pedidos/cliente/{cliente_id}
```

**⚠️ IMPORTANTE:** Este endpoint retorna:
- Solo los pedidos del cliente específico
- Filtrados por `cliente_id`
- De la MISMA colección `pedidos_cliente`

---

## PREGUNTA CLAVE: ¿Son diferentes colecciones?

### ❌ NO - Es la misma colección

**Un solo pedido, tres vistas diferentes:**

1. **Cliente crea pedido:**
   - `POST /pedidos/cliente` → Guarda en `pedidos_cliente`
   - El cliente ve: "Mi pedido fue enviado"

2. **Cliente ve sus pedidos:**
   - `GET /pedidos/cliente/{cliente_id}` → Lee de `pedidos_cliente` (filtrado)
   - El cliente ve: Solo sus pedidos en "Mis Pedidos"

3. **Administrador ve todos los pedidos:**
   - `GET /pedidos/cliente` → Lee de `pedidos_cliente` (sin filtrar)
   - El administrador ve: Todos los pedidos en "Pedidos Web"

---

## ESTRUCTURA DE LA BASE DE DATOS

### Colección: `pedidos_cliente`

**Esta es la única colección necesaria para los pedidos web.**

Todos los pedidos creados desde `/clientes` se guardan aquí, y desde aquí se consultan tanto para "Mis Pedidos" del cliente como para "Pedidos Web" del administrador.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  cliente_id: ObjectId("507f1f77bcf86cd799439012"),
  cliente_nombre: "Juan Pérez",
  cliente_cedula: "V-12345678",
  cliente_direccion: "Av. Principal, Caracas",
  cliente_telefono: "04141234567",
  items: [...],
  metodo_pago: "transferencia",
  numero_referencia: "REF123456",
  comprobante_url: "https://...",
  total: 300.00,
  estado: "pendiente",
  fecha_creacion: ISODate("2025-01-15T10:30:00Z"),
  createdAt: ISODate("2025-01-15T10:30:00Z"),
  updatedAt: ISODate("2025-01-15T10:30:00Z")
}
```

---

## DIFERENCIAS ENTRE ENDPOINTS

### POST `/pedidos/cliente` (Crear pedido)
- **Quién lo usa:** Cliente (desde `/clientes`)
- **Qué hace:** Crea un pedido nuevo
- **Dónde guarda:** Colección `pedidos_cliente`
- **Autenticación:** Token de cliente

### GET `/pedidos/cliente` (Obtener todos los pedidos)
- **Quién lo usa:** Administrador (desde `/pedidos-web`)
- **Qué hace:** Retorna TODOS los pedidos
- **Dónde lee:** Colección `pedidos_cliente`
- **Autenticación:** Token de administrador
- **Filtros:** Ninguno (todos los pedidos)

### GET `/pedidos/cliente/{cliente_id}` (Obtener pedidos de un cliente)
- **Quién lo usa:** Cliente (desde "Mis Pedidos")
- **Qué hace:** Retorna solo los pedidos del cliente
- **Dónde lee:** Colección `pedidos_cliente`
- **Autenticación:** Token de cliente
- **Filtros:** Por `cliente_id` (solo sus pedidos)

---

## RESPUESTA A LA PREGUNTA

**¿El backend sabe que cuando se envía un pedido desde `/clientes`, debe llegar a `/pedidos-web`?**

**SÍ, siempre y cuando:**

1. ✅ **El endpoint `POST /pedidos/cliente` guarde en la colección `pedidos_cliente`**
2. ✅ **El endpoint `GET /pedidos/cliente` lea de la MISMA colección `pedidos_cliente`**
3. ✅ **No uses colecciones diferentes para cliente y administrador**

**Si haces esto:**
- Un pedido creado desde `/clientes` → Aparece automáticamente en `/pedidos-web`
- No necesitas sincronización ni lógica adicional
- Son la misma base de datos, solo cambia quién consulta

---

## EJEMPLO DE IMPLEMENTACIÓN BACKEND

```python
from fastapi import APIRouter, Depends, HTTPException
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/pedidos/cliente", tags=["Pedidos Clientes"])

# ========================================
# CREAR PEDIDO (desde /clientes)
# ========================================
@router.post("")
async def crear_pedido_cliente(pedido_data: dict, current_user: dict = Depends(verify_cliente_token)):
    """
    Crea un pedido desde el carrito de clientes.
    Este pedido aparecerá automáticamente en /pedidos-web cuando un administrador
    llame a GET /pedidos/cliente
    """
    cliente_id = pedido_data.get("cliente_id")
    
    # Buscar cliente para obtener datos
    cliente = await db.clientes.find_one({"_id": ObjectId(cliente_id)})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Crear pedido en la colección pedidos_cliente
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
    
    # Guardar en pedidos_cliente
    result = await db.pedidos_cliente.insert_one(pedido_doc)
    
    # Crear factura automáticamente (ver especificaciones de facturas)
    # ...
    
    return {"_id": str(result.inserted_id), "mensaje": "Pedido creado exitosamente"}

# ========================================
# OBTENER TODOS LOS PEDIDOS (para /pedidos-web)
# ========================================
@router.get("")
async def obtener_todos_los_pedidos(current_user: dict = Depends(verify_admin_token)):
    """
    Obtiene TODOS los pedidos creados desde /clientes.
    Usado por el módulo "Pedidos Web" para mostrar todos los pedidos.
    
    IMPORTANTE: Retorna los mismos pedidos que se crearon con POST /pedidos/cliente
    """
    # Leer de la MISMA colección pedidos_cliente
    pedidos = await db.pedidos_cliente.find({}).sort("fecha_creacion", -1).to_list(length=1000)
    
    # Convertir ObjectId a string
    for pedido in pedidos:
        pedido["_id"] = str(pedido["_id"])
        pedido["cliente_id"] = str(pedido.get("cliente_id", ""))
    
    return pedidos

# ========================================
# OBTENER PEDIDOS DE UN CLIENTE (para "Mis Pedidos")
# ========================================
@router.get("/{cliente_id}")
async def obtener_pedidos_cliente(
    cliente_id: str,
    current_user: dict = Depends(verify_cliente_token)
):
    """
    Obtiene los pedidos de un cliente específico.
    Usado por "Mis Pedidos" del cliente.
    
    IMPORTANTE: Lee de la MISMA colección pedidos_cliente, solo filtra por cliente_id
    """
    # Validar que el cliente_id coincide con el usuario autenticado
    if cliente_id != current_user.get("cliente_id"):
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Leer de la MISMA colección, pero filtrado por cliente_id
    pedidos = await db.pedidos_cliente.find(
        {"cliente_id": ObjectId(cliente_id)}
    ).sort("fecha_creacion", -1).to_list(length=1000)
    
    # Convertir ObjectId a string
    for pedido in pedidos:
        pedido["_id"] = str(pedido["_id"])
        pedido["cliente_id"] = str(pedido.get("cliente_id", ""))
    
    return pedidos
```

---

## VERIFICACIÓN DEL FLUJO

### ✅ Flujo Correcto:

1. Cliente crea pedido:
   - `POST /pedidos/cliente` → Guarda en `pedidos_cliente`
   
2. Administrador ve pedido:
   - `GET /pedidos/cliente` → Lee de `pedidos_cliente`
   - ✅ El pedido aparece automáticamente

3. Cliente ve su pedido:
   - `GET /pedidos/cliente/{cliente_id}` → Lee de `pedidos_cliente` (filtrado)
   - ✅ El pedido aparece en "Mis Pedidos"

### ❌ Flujo Incorrecto (Evitar):

1. Cliente crea pedido:
   - `POST /pedidos/cliente` → Guarda en `pedidos_cliente`
   
2. Administrador ve pedido:
   - `GET /pedidos/cliente` → Lee de `pedidos_administrativos` (otra colección)
   - ❌ El pedido NO aparece (colecciones diferentes)

---

## RESUMEN

**Para que funcione correctamente:**

1. ✅ **Usa UNA sola colección:** `pedidos_cliente`
2. ✅ **POST `/pedidos/cliente`** → Guarda en `pedidos_cliente`
3. ✅ **GET `/pedidos/cliente`** → Lee de `pedidos_cliente` (sin filtros)
4. ✅ **GET `/pedidos/cliente/{cliente_id}`** → Lee de `pedidos_cliente` (con filtro)

**Si sigues este patrón:**
- ✅ Los pedidos de `/clientes` aparecen automáticamente en `/pedidos-web`
- ✅ No necesitas sincronización
- ✅ No necesitas lógica adicional
- ✅ Funciona inmediatamente

---

## DOCUMENTOS RELACIONADOS

- `ESPECIFICACIONES_BACKEND_PEDIDOS_WEB.md` - Especificaciones del módulo Pedidos Web
- `ESPECIFICACIONES_BACKEND_PEDIDOS_CLIENTES_Y_FACTURAS.md` - Especificaciones de pedidos y facturas

---

## NOTA FINAL

**Si el backend implementa correctamente:**
- ✅ `POST /pedidos/cliente` guarda en `pedidos_cliente`
- ✅ `GET /pedidos/cliente` lee de `pedidos_cliente`

**Entonces NO necesita hacer nada adicional. El pedido aparecerá automáticamente en `/pedidos-web` porque es la misma base de datos.**

