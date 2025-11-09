# Instrucciones Backend - Panel de Control Logístico Completo

## ✅ Endpoints Implementados

Todos los endpoints ya están implementados en `back-tumundopuertas/api/src/routes/pedidos.py` (líneas 5186-5676).

## 📋 Endpoints Disponibles

### 1. Items en Producción por Estado
**GET** `/pedidos/panel-control-logistico/items-produccion-por-estado/`

**Respuesta:**
```json
{
  "herreria": {
    "cantidad": 10,
    "estado": "Herrería"
  },
  "masillar": {
    "cantidad": 5,
    "estado": "Masillar"
  },
  "preparar": {
    "cantidad": 6,
    "estado": "Preparar"
  },
  "total": 21
}
```

### 2. Asignaciones Terminadas
**GET** `/pedidos/panel-control-logistico/asignaciones-terminadas/?modulo={modulo}`

**Query Parameters:**
- `modulo` (opcional): "herreria", "masillar", "preparar"

**Respuesta:**
```json
{
  "herreria": {
    "total": 15,
    "asignaciones": [...]
  },
  "masillar": {
    "total": 12,
    "asignaciones": [...]
  },
  "preparar": {
    "total": 8,
    "asignaciones": [...]
  },
  "total_general": 35
}
```

### 3. Empleados con Items Terminados
**GET** `/pedidos/panel-control-logistico/empleados-items-terminados/`

**Respuesta:**
```json
{
  "empleados": [
    {
      "empleado_id": "emp123",
      "empleado_nombre": "Juan Pérez",
      "herreria": 5,
      "masillar": 3,
      "preparar": 2,
      "total": 10
    }
  ],
  "total_empleados": 10
}
```

### 4. Items por Ventas
**GET** `/pedidos/panel-control-logistico/items-por-ventas/?fecha_inicio={fecha}&fecha_fin={fecha}`

**Query Parameters:**
- `fecha_inicio` (opcional): YYYY-MM-DD
- `fecha_fin` (opcional): YYYY-MM-DD

**Respuesta:**
```json
{
  "items": [
    {
      "item_id": "item123",
      "item_nombre": "Puerta Principal",
      "codigo": "P001",
      "descripcion": "Puerta de metal",
      "ventas": 25,
      "sucursal1_creados": 15,
      "sucursal2_creados": 10
    }
  ],
  "total_items": 50,
  "periodo": {
    "fecha_inicio": "2025-01-01",
    "fecha_fin": "2025-01-08"
  }
}
```

### 5. Inventario por Sucursal
**GET** `/pedidos/panel-control-logistico/inventario-por-sucursal/`

**Respuesta:**
```json
{
  "sucursal1": {
    "nombre": "Sucursal 1",
    "total_items": 150
  },
  "sucursal2": {
    "nombre": "Sucursal 2",
    "total_items": 120
  },
  "total_general": 270
}
```

### 6. Sugerencia de Producción Mejorada
**GET** `/pedidos/panel-control-logistico/sugerencia-produccion-mejorada/?dias=7`

**Query Parameters:**
- `dias` (opcional, default: 7): Días para calcular sugerencia

**Respuesta:**
```json
{
  "sugerencias": [
    {
      "item_id": "item123",
      "item_nombre": "Puerta Principal",
      "codigo": "P001",
      "descripcion": "Puerta de metal",
      "existencia_actual": 1,
      "ventas_periodo": 4,
      "ventas_diarias": 0.57,
      "necesidad_7_dias": 4.0,
      "unidades_sugeridas": 3,
      "prioridad": "alta",
      "razon": "Stock bajo (1) vs demanda estimada (4.0)"
    }
  ],
  "items_sin_ventas": [
    {
      "item_id": "item456",
      "item_nombre": "Ventana",
      "codigo": "V001",
      "descripcion": "Ventana de aluminio",
      "existencia_total": 5,
      "dias_sin_ventas": 7
    }
  ],
  "total_sugerencias": 10,
  "total_sin_ventas": 5,
  "periodo_dias": 7
}
```

### 7. Exportar a PDF
**GET** `/pedidos/panel-control-logistico/exportar-pdf/?fecha_inicio={fecha}&fecha_fin={fecha}`

**Query Parameters:**
- `fecha_inicio` (opcional): YYYY-MM-DD
- `fecha_fin` (opcional): YYYY-MM-DD

**Respuesta:**
Retorna un objeto JSON con todos los datos del panel para generar PDF en el frontend.

## 🔧 Notas de Implementación

1. **Items en Producción**: Se cuentan items con `estado_item` = 1 (herreria), 2 (masillar), 3 (preparar)
2. **Asignaciones Terminadas**: Se identifican por tener `fecha_fin` en las asignaciones
3. **Ventas**: Se consideran items con `estado_item` = 4 (terminado/vendido)
4. **Inventario**: 
   - Sucursal 1 usa el campo `cantidad` o `existencia`
   - Sucursal 2 usa el campo `existencia2`
5. **Sugerencias**: Calcula necesidad para 7 días basado en ventas diarias promedio

## ✅ Verificación

Todos los endpoints están implementados y listos para usar. El frontend ya está configurado para consumirlos.

## 🚀 Próximos Pasos

1. Reiniciar el servidor backend si es necesario
2. Verificar que los endpoints respondan correctamente
3. Probar desde el frontend en `/panel-control-logistico`

