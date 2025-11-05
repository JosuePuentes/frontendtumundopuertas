# Especificaciones Backend - Panel de Control Logístico

## Objetivo
Crear endpoints para el Panel de Control Logístico que permita al Coordinador de Almacén y Producción:
- Ver todos los items en producción con cantidades
- Analizar movimientos de unidades según pedidos
- Identificar items sin movimiento en 7 días
- Identificar items más movidos en 7 días
- Ver items con existencia en 0
- Generar planificación de producción
- Ver gráficas, promedios y comparaciones de períodos

---

## 1. Endpoint: Obtener Resumen General de Producción

### GET `/pedidos/panel-control-logistico/resumen/?fecha_inicio={fecha}&fecha_fin={fecha}`

**Query Parameters:**
- `fecha_inicio` (opcional): Fecha inicio del rango (ISO 8601)
- `fecha_fin` (opcional): Fecha fin del rango (ISO 8601)
- Si no se envían, usar últimos 7 días por defecto

**Response:**
```json
{
  "total_items_produccion": 150,
  "total_unidades_produccion": 450,
  "total_items_vendidos_periodo": 80,
  "total_unidades_vendidas_periodo": 240,
  "total_items_sin_movimiento": 25,
  "total_items_mas_movidos": 15,
  "total_items_existencia_cero": 10,
  "periodo": {
    "fecha_inicio": "2025-01-01T00:00:00Z",
    "fecha_fin": "2025-01-08T00:00:00Z",
    "dias": 7
  }
}
```

---

## 2. Endpoint: Items en Producción (Detallado)

### GET `/pedidos/panel-control-logistico/items-produccion/?fecha_inicio={fecha}&fecha_fin={fecha}`

**Response:**
```json
{
  "items": [
    {
      "item_id": "item123",
      "item_nombre": "Puerta Principal",
      "item_descripcion": "Puerta de metal 2x1",
      "codigo": "P001",
      "cantidad_total_produccion": 15,
      "pedidos_en_produccion": [
        {
          "pedido_id": "pedido123",
          "pedido_codigo": "#123456",
          "cliente_nombre": "Cliente ABC",
          "cantidad": 5,
          "estado_general": "orden2",
          "fecha_creacion": "2025-01-05T10:00:00Z",
          "items_estado": [
            {
              "item_id": "item123",
              "estado_item": 2,
              "modulo_actual": "masillar",
              "empleado_asignado": "emp123",
              "empleado_nombre": "Juan Pérez"
            }
          ]
        }
      ],
      "estado_actual": "En producción - Masillar",
      "existencia_actual": 0,
      "ultima_movimiento": "2025-01-06T14:30:00Z",
      "dias_sin_movimiento": 2,
      "movimientos_ultimos_7_dias": 8,
      "categoria_movimiento": "sin_movimiento" // "sin_movimiento", "normal", "mas_movido"
    }
  ],
  "total_items": 150,
  "total_unidades": 450
}
```

**Lógica de categorización:**
- `sin_movimiento`: No tiene movimientos en los últimos 7 días (dias_sin_movimiento >= 7)
- `mas_movido`: Tiene más movimientos que el promedio + 2 desviaciones estándar
- `normal`: Resto de items

---

## 3. Endpoint: Movimientos de Unidades por Item

### GET `/pedidos/panel-control-logistico/movimientos-unidades/?item_id={item_id}&fecha_inicio={fecha}&fecha_fin={fecha}`

**Query Parameters:**
- `item_id` (opcional): Si se envía, filtrar por ese item
- `fecha_inicio` (opcional): Fecha inicio del rango
- `fecha_fin` (opcional): Fecha fin del rango

**Response:**
```json
{
  "movimientos": [
    {
      "item_id": "item123",
      "item_nombre": "Puerta Principal",
      "codigo": "P001",
      "fecha": "2025-01-06T10:00:00Z",
      "tipo_movimiento": "entrada_produccion", // "entrada_produccion", "salida_produccion", "venta", "ajuste"
      "pedido_id": "pedido123",
      "pedido_codigo": "#123456",
      "cliente_nombre": "Cliente ABC",
      "cantidad": 5,
      "modulo_origen": "herreria",
      "modulo_destino": "masillar",
      "empleado_responsable": "Juan Pérez",
      "existencia_antes": 10,
      "existencia_despues": 15
    }
  ],
  "resumen": {
    "total_entradas": 50,
    "total_salidas": 30,
    "total_ventas": 20,
    "saldo_periodo": 20
  }
}
```

---

## 4. Endpoint: Items Sin Movimiento (7 días)

### GET `/pedidos/panel-control-logistico/items-sin-movimiento/?dias={dias}`

**Query Parameters:**
- `dias` (opcional, default: 7): Días sin movimiento

**Response:**
```json
{
  "items": [
    {
      "item_id": "item123",
      "item_nombre": "Puerta Principal",
      "codigo": "P001",
      "cantidad_produccion": 5,
      "ultima_movimiento": "2024-12-30T10:00:00Z",
      "dias_sin_movimiento": 8,
      "pedidos_afectados": [
        {
          "pedido_id": "pedido123",
          "pedido_codigo": "#123456",
          "cliente_nombre": "Cliente ABC",
          "cantidad": 5,
          "estado_general": "orden1",
          "fecha_creacion": "2024-12-25T10:00:00Z"
        }
      ],
      "modulo_actual": "herreria",
      "empleado_asignado": "Juan Pérez"
    }
  ],
  "total_items": 25,
  "total_unidades": 75
}
```

---

## 5. Endpoint: Items Más Movidos (7 días)

### GET `/pedidos/panel-control-logistico/items-mas-movidos/?fecha_inicio={fecha}&fecha_fin={fecha}&limite={limite}`

**Query Parameters:**
- `fecha_inicio` (opcional): Fecha inicio
- `fecha_fin` (opcional): Fecha fin
- `limite` (opcional, default: 20): Número de items a retornar

**Response:**
```json
{
  "items": [
    {
      "item_id": "item123",
      "item_nombre": "Puerta Principal",
      "codigo": "P001",
      "total_movimientos": 25,
      "entradas": 15,
      "salidas": 10,
      "ventas": 5,
      "promedio_diario": 3.57,
      "tendencia": "creciente", // "creciente", "decreciente", "estable"
      "pedidos_afectados": 8,
      "ultima_movimiento": "2025-01-07T16:00:00Z"
    }
  ],
  "total_items": 15,
  "promedio_movimientos": 12.5,
  "desviacion_estandar": 8.3
}
```

---

## 6. Endpoint: Items con Existencia en 0

### GET `/pedidos/panel-control-logistico/items-existencia-cero/`

**Response:**
```json
{
  "items": [
    {
      "item_id": "item123",
      "item_nombre": "Puerta Principal",
      "codigo": "P001",
      "existencia_actual": 0,
      "ultima_venta": "2025-01-05T10:00:00Z",
      "dias_sin_existencia": 3,
      "pedidos_pendientes": [
        {
          "pedido_id": "pedido123",
          "pedido_codigo": "#123456",
          "cliente_nombre": "Cliente ABC",
          "cantidad_solicitada": 5,
          "fecha_creacion": "2025-01-06T10:00:00Z",
          "prioridad": "alta" // "alta", "media", "baja" según fecha de creación
        }
      ],
      "total_pedidos_pendientes": 3,
      "total_unidades_solicitadas": 15,
      "ultima_compra": "2024-12-20T10:00:00Z",
      "ultima_produccion": "2024-12-25T10:00:00Z"
    }
  ],
  "total_items": 10,
  "total_unidades_solicitadas": 45
}
```

---

## 7. Endpoint: Sugerencia de Producción

### GET `/pedidos/panel-control-logistico/sugerencia-produccion/?fecha_inicio={fecha}&fecha_fin={fecha}`

**Response:**
```json
{
  "sugerencias": [
    {
      "item_id": "item123",
      "item_nombre": "Puerta Principal",
      "codigo": "P001",
      "prioridad": "alta", // "alta", "media", "baja"
      "razon": "Existencia en 0 con pedidos pendientes",
      "existencia_actual": 0,
      "unidades_solicitadas": 15,
      "unidades_en_produccion": 5,
      "unidades_sugeridas": 20,
      "dias_estimados_produccion": 7,
      "pedidos_afectados": 3,
      "factores": [
        "existencia_cero",
        "pedidos_pendientes",
        "alta_demanda_historica"
      ]
    },
    {
      "item_id": "item456",
      "item_nombre": "Ventana",
      "codigo": "V001",
      "prioridad": "media",
      "razon": "Sin movimiento en 7 días con producción activa",
      "existencia_actual": 10,
      "unidades_solicitadas": 8,
      "unidades_en_produccion": 15,
      "unidades_sugeridas": 0,
      "dias_estimados_produccion": 0,
      "pedidos_afectados": 2,
      "factores": [
        "sin_movimiento_reciente",
        "produccion_excesiva"
      ]
    }
  ],
  "total_sugerencias": 25,
  "resumen": {
    "alta_prioridad": 10,
    "media_prioridad": 10,
    "baja_prioridad": 5
  }
}
```

---

## 8. Endpoint: Gráficas y Estadísticas

### GET `/pedidos/panel-control-logistico/graficas/?fecha_inicio={fecha}&fecha_fin={fecha}&comparar_con={fecha_inicio_anterior}&comparar_fin={fecha_fin_anterior}`

**Query Parameters:**
- `fecha_inicio`: Fecha inicio del período actual
- `fecha_fin`: Fecha fin del período actual
- `comparar_con`: Fecha inicio del período anterior (opcional)
- `comparar_fin`: Fecha fin del período anterior (opcional)

**Response:**
```json
{
  "periodo_actual": {
    "fecha_inicio": "2025-01-01T00:00:00Z",
    "fecha_fin": "2025-01-08T00:00:00Z",
    "dias": 7
  },
  "periodo_anterior": {
    "fecha_inicio": "2024-12-25T00:00:00Z",
    "fecha_fin": "2024-12-31T00:00:00Z",
    "dias": 7
  },
  "graficas": {
    "movimientos_diarios": [
      {
        "fecha": "2025-01-01",
        "entradas": 10,
        "salidas": 8,
        "ventas": 5,
        "produccion": 15
      }
    ],
    "items_top_produccion": [
      {
        "item_id": "item123",
        "item_nombre": "Puerta Principal",
        "cantidad": 50,
        "porcentaje": 25.5
      }
    ],
    "items_top_ventas": [
      {
        "item_id": "item123",
        "item_nombre": "Puerta Principal",
        "cantidad": 30,
        "porcentaje": 20.0
      }
    ],
    "distribucion_estados": {
      "herreria": 40,
      "masillar": 35,
      "preparar": 20,
      "facturacion": 5
    },
    "tiempo_promedio_produccion": {
      "herreria": 2.5,
      "masillar": 3.0,
      "preparar": 1.5,
      "total": 7.0
    }
  },
  "comparacion": {
    "variacion_items_produccion": 5.2, // porcentaje
    "variacion_unidades_produccion": -3.1,
    "variacion_items_vendidos": 8.5,
    "variacion_unidades_vendidas": 12.3,
    "variacion_tiempo_promedio": -0.5,
    "tendencia": "creciente" // "creciente", "decreciente", "estable"
  },
  "promedios": {
    "items_produccion_diario": 21.4,
    "unidades_produccion_diario": 64.3,
    "items_vendidos_diario": 11.4,
    "unidades_vendidas_diario": 34.3,
    "tiempo_promedio_produccion": 7.0
  }
}
```

---

## 9. Endpoint: Planificación de Producción

### GET `/pedidos/panel-control-logistico/planificacion-produccion/?fecha_inicio={fecha}&fecha_fin={fecha}`

**Response:**
```json
{
  "planificacion": [
    {
      "item_id": "item123",
      "item_nombre": "Puerta Principal",
      "codigo": "P001",
      "existencia_actual": 0,
      "demanda_estimada": 20,
      "en_produccion": 5,
      "sugerido_producir": 25,
      "prioridad": "alta",
      "razones": [
        "Existencia en 0",
        "3 pedidos pendientes",
        "Alta demanda histórica"
      ],
      "tiempo_estimado_dias": 7,
      "modulos_requeridos": ["herreria", "masillar", "preparar"],
      "recursos_necesarios": {
        "empleados": 3,
        "materiales": ["metal", "pintura", "manijas"]
      }
    }
  ],
  "resumen": {
    "total_items_planificar": 25,
    "total_unidades_sugeridas": 500,
    "tiempo_total_estimado_dias": 14,
    "recursos_totales": {
      "empleados_requeridos": 15,
      "modulos_afectados": ["herreria", "masillar", "preparar"]
    }
  }
}
```

---

## Consideraciones de Implementación

1. **Movimientos**: Se deben registrar movimientos cuando:
   - Se crea un pedido (entrada a producción)
   - Se termina una asignación en un módulo (movimiento entre módulos)
   - Se factura un pedido (salida de producción/venta)
   - Se ajusta inventario manualmente

2. **Cálculo de Existencias**: 
   - Existencia = Unidades en inventario - Unidades en producción - Unidades vendidas
   - Se debe considerar items en producción (estado_item < 4)

3. **Categorización de Items**:
   - Sin movimiento: No tiene cambios en seguimiento/estado en X días
   - Más movido: Movimientos > promedio + 2*desviación estándar
   - Normal: Resto

4. **Priorización de Sugerencias**:
   - Alta: Existencia 0 + pedidos pendientes
   - Media: Sin movimiento + producción activa o baja demanda
   - Baja: Resto

5. **Gráficas**: 
   - Usar datos agregados por día
   - Comparar con período anterior si se proporciona
   - Calcular variaciones porcentuales

6. **Performance**:
   - Cachear resultados por 5 minutos
   - Usar índices en MongoDB para búsquedas por fecha
   - Agregar datos en lugar de procesar todos los pedidos cada vez

---

## Ejemplo de Registro de Movimiento

Cuando ocurre un movimiento, registrar en una colección `movimientos_logisticos`:

```json
{
  "_id": ObjectId("..."),
  "item_id": "item123",
  "pedido_id": "pedido123",
  "fecha": ISODate("2025-01-06T10:00:00Z"),
  "tipo": "entrada_produccion", // "entrada_produccion", "cambio_modulo", "salida_produccion", "venta", "ajuste"
  "modulo_origen": "pendiente",
  "modulo_destino": "herreria",
  "cantidad": 5,
  "empleado_responsable": "emp123",
  "existencia_antes": 10,
  "existencia_despues": 15
}
```

