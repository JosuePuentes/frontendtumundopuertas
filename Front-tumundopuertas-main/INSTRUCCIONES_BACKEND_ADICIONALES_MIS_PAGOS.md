# Instrucciones Backend - Incluir Adicionales en Mis Pagos

## Problema
El endpoint `/pedidos/mis-pagos` no está devolviendo el campo `adicionales`, por lo que el frontend no puede sumar los adicionales al total del pedido en el módulo Mis Pagos.

## Solución

### Endpoint a Modificar: `GET /pedidos/mis-pagos`

**Ubicación**: `back-tumundopuertas/api/src/routes/pedidos.py`

**Buscar el endpoint** (alrededor de la línea 3624):

```python
@router.get("/mis-pagos")
async def obtener_pagos(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio en formato YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin en formato YYYY-MM-DD"),
):
```

**Encontrar la sección donde se define qué campos devolver:**

```python
pedidos = list(
    pedidos_collection.find(
        filtro,
        {
            "_id": 1,
            "cliente_id": 1,
            "cliente_nombre": 1,
            "pago": 1,
            "historial_pagos": 1,
            "total_abonado": 1,
            "items": 1, # Necesario para calcular el total del pedido en el frontend
        },
    )
)
```

**Agregar el campo `adicionales`:**

```python
pedidos = list(
    pedidos_collection.find(
        filtro,
        {
            "_id": 1,
            "cliente_id": 1,
            "cliente_nombre": 1,
            "pago": 1,
            "historial_pagos": 1,
            "total_abonado": 1,
            "items": 1, # Necesario para calcular el total del pedido en el frontend
            "adicionales": 1, # ← AGREGAR ESTA LÍNEA
        },
    )
)
```

## Estructura de Adicionales

El campo `adicionales` es un array de objetos con la siguiente estructura:

```json
{
  "adicionales": [
    {
      "descripcion": "Transporte",
      "precio": 50.00,
      "cantidad": 1
    },
    {
      "descripcion": "Instalación",
      "precio": 100.00,
      "cantidad": 2
    }
  ]
}
```

**Notas:**
- `descripcion` es opcional
- `precio` es requerido (número)
- `cantidad` es opcional (default: 1)

## Verificación

Después de hacer el cambio, verificar que:

1. El endpoint devuelve el campo `adicionales` en cada pedido
2. Si un pedido no tiene adicionales, el campo debe ser un array vacío `[]` o `null`
3. El frontend puede calcular correctamente: `total = items + adicionales`

## Código Completo del Endpoint (Referencia)

```python
@router.get("/mis-pagos")
async def obtener_pagos(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio en formato YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin en formato YYYY-MM-DD"),
):
    """
    Retorna los pagos de los pedidos, filtrando por rango de fechas si se especifica.
    """

    filtro = {}

    if fecha_inicio and fecha_fin:
        try:
            inicio = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            fin = datetime.strptime(fecha_fin, "%Y-%m-%d") + timedelta(days=1)
            filtro["fecha_creacion"] = {"$gte": inicio, "$lt": fin}
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido, use YYYY-MM-DD")

    # Buscar pedidos
    pedidos = list(
        pedidos_collection.find(
            filtro,
            {
                "_id": 1,
                "cliente_id": 1,
                "cliente_nombre": 1,
                "pago": 1,
                "historial_pagos": 1,
                "total_abonado": 1,
                "items": 1,
                "adicionales": 1,  # ← AGREGAR ESTA LÍNEA
            },
        )
    )

    # Convertir ObjectId a str
    for p in pedidos:
        p["_id"] = str(p["_id"])

    return pedidos
```

## Impacto

Una vez implementado este cambio:
- ✅ El frontend podrá calcular correctamente el total del pedido incluyendo adicionales
- ✅ El saldo pendiente se calculará correctamente: `total (items + adicionales) - monto_abonado`
- ✅ Los totales generales en Mis Pagos incluirán los adicionales





