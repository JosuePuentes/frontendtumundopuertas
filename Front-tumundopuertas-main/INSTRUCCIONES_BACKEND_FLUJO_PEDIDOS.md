# Instrucciones para Backend: Flujo de Pedidos

## Problema Actual
Los pedidos creados desde `/crearpedido` no están apareciendo en:
1. **Monitor de Pedidos** (`/monitorpedidos`)
2. **Pedidos Herreria** (`/pedidosherreria`)

Mientras que los pedidos creados desde `/clientes` (pedidos web) NO deberían aparecer en estos módulos, solo en `/pedidos-web`.

## Solución Requerida

### 1. Diferenciar Pedidos Normales de Pedidos Web

**Pedidos desde `/crearpedido` (POST /pedidos/):**
- Deben aparecer en **Monitor de Pedidos**
- Si algún item no tiene cantidad disponible, debe aparecer en **Pedidos Herreria**
- Estos son pedidos internos creados por administradores

**Pedidos desde `/clientes` (POST /pedidos/cliente):**
- NO deben aparecer en Monitor de Pedidos
- NO deben aparecer en Pedidos Herreria
- SOLO deben aparecer en `/pedidos-web`

### 2. Identificación de Pedidos Web

Los pedidos web se pueden identificar por alguna de estas características:
- Campo `tipo` o `origen` = `"web"` o `"cliente"`
- Presencia de campos como `metodo_pago`, `numero_referencia`, `comprobante_url`
- Campo `cliente_id` que viene de la colección de clientes no autenticados

**Recomendación:** Agregar un campo `tipo_pedido` o `origen_pedido` al modelo `Pedido`:
```python
tipo_pedido: str = "interno"  # "interno" o "web"
# o
origen_pedido: str = "administrador"  # "administrador" o "cliente"
```

### 3. Endpoints que Deben Filtrar

#### GET /pedidos/all/
- **Actualmente:** Retorna todos los pedidos
- **Cambio requerido:** Agregar filtro opcional para excluir pedidos web
- **Ejemplo:**
  ```python
  @router.get("/pedidos/all/")
  async def get_all_pedidos(
      exclude_web: bool = False,  # Nuevo parámetro
      current_user: dict = Depends(get_current_user)
  ):
      query = {}
      if exclude_web:
          # Excluir pedidos web
          query["tipo_pedido"] = {"$ne": "web"}
          # o query["origen_pedido"] = {"$ne": "cliente"}
      
      pedidos = pedidos_collection.find(query)
      # ... resto del código
  ```

#### GET /pedidos/herreria/
- **Actualmente:** Retorna items sin cantidad disponible
- **Cambio requerido:** Excluir items de pedidos web
- **Ejemplo:**
  ```python
  @router.get("/pedidos/herreria/")
  async def get_items_herreria(...):
      # En la lógica que busca items sin cantidad disponible,
      # asegurarse de excluir items que pertenecen a pedidos web
      query = {
          "estado_item": {"$lt": 4},  # Items activos
          # Excluir items de pedidos web
          "pedido_tipo": {"$ne": "web"}  # O el campo que uses
      }
      # ... resto del código
  ```

### 4. Al Crear Pedidos

#### POST /pedidos/ (desde /crearpedido)
Al crear un pedido desde este endpoint:
```python
@router.post("/pedidos/")
async def create_pedido(...):
    pedido_data = {
        ...datos_del_pedido,
        "tipo_pedido": "interno",  # o "origen_pedido": "administrador"
        # ... resto de campos
    }
    # ... crear pedido
```

#### POST /pedidos/cliente (desde /clientes)
Al crear un pedido desde este endpoint:
```python
@router.post("/pedidos/cliente")
async def create_pedido_cliente(...):
    pedido_data = {
        ...datos_del_pedido,
        "tipo_pedido": "web",  # o "origen_pedido": "cliente"
        # ... resto de campos
    }
    # ... crear pedido
```

### 5. Validación de Items en Pedidos Normales

Cuando se crea un pedido desde `/crearpedido`:
- Verificar cantidad disponible de cada item
- Si un item NO tiene cantidad suficiente:
  - El pedido completo debe aparecer en **Monitor de Pedidos**
  - Los items sin cantidad suficiente deben aparecer en **Pedidos Herreria**
  - Los items con cantidad suficiente pueden procesarse normalmente

### 6. Consultas a Modificar

#### Monitor de Pedidos
El frontend usa `GET /pedidos/all/` sin filtros especiales, pero internamente el backend debe:
- Incluir solo pedidos con `tipo_pedido != "web"` (o similar)
- O usar el parámetro `exclude_web=true` si se implementa

#### Pedidos Herreria
El frontend usa `GET /pedidos/herreria/`, que debe:
- Retornar items sin cantidad disponible
- Excluir items que pertenecen a pedidos web
- Solo incluir items de pedidos internos (`tipo_pedido == "interno"`)

### 7. Migración de Datos Existentes

Si ya existen pedidos en la base de datos:
- Identificar pedidos web por características existentes (presencia de `metodo_pago`, `comprobante_url`, etc.)
- Agregar el campo `tipo_pedido` a todos los pedidos existentes:
  ```python
  # Script de migración (ejecutar una vez)
  pedidos_collection.update_many(
      {
          "$or": [
              {"metodo_pago": {"$exists": True}},
              {"comprobante_url": {"$exists": True}},
              {"numero_referencia": {"$exists": True}}
          ]
      },
      {"$set": {"tipo_pedido": "web"}}
  )
  
  pedidos_collection.update_many(
      {"tipo_pedido": {"$exists": False}},
      {"$set": {"tipo_pedido": "interno"}}
  )
  ```

### 8. Verificación

Después de implementar estos cambios:
1. Crear un pedido desde `/crearpedido`
   - ✅ Debe aparecer en Monitor de Pedidos
   - ✅ Items sin cantidad deben aparecer en Pedidos Herreria

2. Crear un pedido desde `/clientes`
   - ✅ NO debe aparecer en Monitor de Pedidos
   - ✅ NO debe aparecer en Pedidos Herreria
   - ✅ Debe aparecer SOLO en `/pedidos-web`

## Resumen de Cambios Necesarios

1. ✅ Agregar campo `tipo_pedido` o `origen_pedido` al modelo Pedido
2. ✅ Modificar `POST /pedidos/` para marcar pedidos como `"interno"`
3. ✅ Modificar `POST /pedidos/cliente` para marcar pedidos como `"web"`
4. ✅ Modificar `GET /pedidos/all/` para excluir pedidos web (o usar filtro)
5. ✅ Modificar `GET /pedidos/herreria/` para excluir items de pedidos web
6. ✅ Ejecutar script de migración para pedidos existentes

## Nota Importante

El frontend NO necesita cambios adicionales. Solo el backend necesita implementar estos filtros y marcadores de tipo de pedido.

