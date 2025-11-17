# Especificaciones Backend - Panel de Control Logístico Completo

## Nuevos Endpoints Requeridos

### 1. Items en Producción por Estado
**GET** `/pedidos/panel-control-logistico/items-produccion-por-estado/`

Retorna:
- Total de items en herreria (estado_item = 1)
- Total de items en masillar (estado_item = 2)
- Total de items en preparar (estado_item = 3)
- Total general de items en producción

### 2. Asignaciones Terminadas por Estado
**GET** `/pedidos/panel-control-logistico/asignaciones-terminadas/?modulo={modulo}`

Retorna asignaciones terminadas (con fecha_fin) agrupadas por:
- herreria (orden = 1)
- masillar (orden = 2)
- preparar (orden = 3)

### 3. Empleados con Items Terminados por Estado
**GET** `/pedidos/panel-control-logistico/empleados-items-terminados/`

Retorna empleados con:
- Total de items terminados en herreria
- Total de items terminados en masillar
- Total de items terminados en preparar

### 4. Items por Ventas (Más Vendido a Menos Vendido) y por Sucursal
**GET** `/pedidos/panel-control-logistico/items-por-ventas/?fecha_inicio={fecha}&fecha_fin={fecha}`

Retorna:
- Items ordenados por cantidad vendida (descendente)
- Código y descripción de cada item
- Cantidad creada por sucursal 1
- Cantidad creada por sucursal 2

### 5. Total Items del Inventario por Sucursal
**GET** `/pedidos/panel-control-logistico/inventario-por-sucursal/`

Retorna:
- Total de items en sucursal 1 (suma de todos los items.cantidad o items.existencia)
- Total de items en sucursal 2 (suma de todos los items.existencia2)
- Total general (suma de ambas sucursales)

### 6. Sugerencia de Producción Mejorada
**GET** `/pedidos/panel-control-logistico/sugerencia-produccion-mejorada/?dias=7`

Retorna:
- Items con stock bajo vs ventas (para 7 días)
- Items con ventas 0 o bajas
- Cantidad sugerida para producir

### 7. Exportar a PDF
**GET** `/pedidos/panel-control-logistico/exportar-pdf/?fecha_inicio={fecha}&fecha_fin={fecha}`

Retorna todos los datos del panel en formato JSON para generar PDF en frontend.







