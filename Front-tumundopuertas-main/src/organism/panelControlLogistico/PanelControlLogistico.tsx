import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  Activity,
  Warehouse,
  Factory,
  BarChart3,
  Target,
  Download
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface ResumenGeneral {
  total_items_produccion: number;
  total_unidades_produccion: number;
  total_items_vendidos_periodo: number;
  total_unidades_vendidas_periodo: number;
  total_items_sin_movimiento: number;
  total_items_mas_movidos: number;
  total_items_existencia_cero: number;
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
    dias: number;
  };
}

interface ItemProduccion {
  item_id: string;
  item_nombre: string;
  item_descripcion: string;
  codigo: string;
  cantidad_total_produccion: number;
  pedidos_en_produccion: Array<{
    pedido_id: string;
    pedido_codigo: string;
    cliente_nombre: string;
    cantidad: number;
    estado_general: string;
    fecha_creacion: string;
  }>;
  estado_actual: string;
  existencia_actual: number;
  ultima_movimiento: string;
  dias_sin_movimiento: number;
  movimientos_ultimos_7_dias: number;
  categoria_movimiento: "sin_movimiento" | "normal" | "mas_movido";
}

interface ItemSinMovimiento {
  item_id: string;
  item_nombre: string;
  codigo: string;
  cantidad_produccion: number;
  ultima_movimiento: string;
  dias_sin_movimiento: number;
  pedidos_afectados: Array<{
    pedido_id: string;
    pedido_codigo: string;
    cliente_nombre: string;
    cantidad: number;
    estado_general: string;
    fecha_creacion: string;
  }>;
  modulo_actual: string;
  empleado_asignado: string;
}

interface ItemMasMovido {
  item_id: string;
  item_nombre: string;
  codigo: string;
  total_movimientos: number;
  entradas: number;
  salidas: number;
  ventas: number;
  promedio_diario: number;
  tendencia: "creciente" | "decreciente" | "estable";
  pedidos_afectados: number;
  ultima_movimiento: string;
}

interface ItemExistenciaCero {
  item_id: string;
  item_nombre: string;
  codigo: string;
  existencia_actual: number;
  ultima_venta: string;
  dias_sin_existencia: number;
  pedidos_pendientes: Array<{
    pedido_id: string;
    pedido_codigo: string;
    cliente_nombre: string;
    cantidad_solicitada: number;
    fecha_creacion: string;
    prioridad: string;
  }>;
  total_pedidos_pendientes: number;
  total_unidades_solicitadas: number;
}

interface SugerenciaProduccion {
  item_id: string;
  item_nombre: string;
  codigo: string;
  prioridad: "alta" | "media" | "baja";
  razon: string;
  existencia_actual: number;
  unidades_solicitadas: number;
  unidades_en_produccion: number;
  unidades_sugeridas: number;
  dias_estimados_produccion: number;
  pedidos_afectados: number;
  factores: string[];
}

interface GraficasData {
  periodo_actual: {
    fecha_inicio: string;
    fecha_fin: string;
    dias: number;
  };
  periodo_anterior?: {
    fecha_inicio: string;
    fecha_fin: string;
    dias: number;
  };
  graficas: {
    movimientos_diarios: Array<{
      fecha: string;
      entradas: number;
      salidas: number;
      ventas: number;
      produccion: number;
    }>;
    items_top_produccion: Array<{
      item_id: string;
      item_nombre: string;
      cantidad: number;
      porcentaje: number;
    }>;
    items_top_ventas: Array<{
      item_id: string;
      item_nombre: string;
      cantidad: number;
      porcentaje: number;
    }>;
    distribucion_estados: {
      herreria: number;
      masillar: number;
      preparar: number;
      facturacion: number;
    };
    tiempo_promedio_produccion: {
      herreria: number;
      masillar: number;
      preparar: number;
      total: number;
    };
  };
  comparacion?: {
    variacion_items_produccion: number;
    variacion_unidades_produccion: number;
    variacion_items_vendidos: number;
    variacion_unidades_vendidas: number;
    variacion_tiempo_promedio: number;
    tendencia: "creciente" | "decreciente" | "estable";
  };
  promedios: {
    items_produccion_diario: number;
    unidades_produccion_diario: number;
    items_vendidos_diario: number;
    unidades_vendidas_diario: number;
    tiempo_promedio_produccion: number;
  };
}

interface ItemsProduccionPorEstado {
  herreria: { cantidad: number; estado: string };
  masillar: { cantidad: number; estado: string };
  preparar: { cantidad: number; estado: string };
  total: number;
}

interface AsignacionTerminada {
  pedido_id: string;
  item_id: string;
  item_nombre: string;
  codigo: string;
  empleado_id: string;
  empleado_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  modulo: string;
}

interface AsignacionesTerminadas {
  herreria: { total: number; asignaciones: AsignacionTerminada[] };
  masillar: { total: number; asignaciones: AsignacionTerminada[] };
  preparar: { total: number; asignaciones: AsignacionTerminada[] };
  total_general: number;
}

interface EmpleadoItemsTerminados {
  empleado_id: string;
  empleado_nombre: string;
  herreria: number;
  masillar: number;
  preparar: number;
  total: number;
}

interface ItemPorVentas {
  item_id: string;
  item_nombre: string;
  codigo: string;
  descripcion: string;
  ventas: number;
  sucursal1_creados: number;
  sucursal2_creados: number;
}

interface InventarioPorSucursal {
  sucursal1: { nombre: string; total_items: number };
  sucursal2: { nombre: string; total_items: number };
  total_general: number;
}

interface SugerenciaProduccionMejorada {
  item_id: string;
  item_nombre: string;
  codigo: string;
  descripcion: string;
  existencia_actual: number;
  ventas_periodo: number;
  ventas_diarias: number;
  necesidad_7_dias: number;
  unidades_sugeridas: number;
  prioridad: "alta" | "media" | "baja";
  razon: string;
}

interface ItemSinVentas {
  item_id: string;
  item_nombre: string;
  codigo: string;
  descripcion: string;
  existencia_total: number;
  dias_sin_ventas: number;
}

const PanelControlLogistico: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fechas
  const [fechaInicio, setFechaInicio] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [compararPeriodo, setCompararPeriodo] = useState(false);
  
  // Datos
  const [resumen, setResumen] = useState<ResumenGeneral | null>(null);
  const [itemsProduccion, setItemsProduccion] = useState<ItemProduccion[]>([]);
  const [itemsSinMovimiento, setItemsSinMovimiento] = useState<ItemSinMovimiento[]>([]);
  const [itemsMasMovidos, setItemsMasMovidos] = useState<ItemMasMovido[]>([]);
  const [itemsExistenciaCero, setItemsExistenciaCero] = useState<ItemExistenciaCero[]>([]);
  const [sugerencias, setSugerencias] = useState<SugerenciaProduccion[]>([]);
  const [graficasData, setGraficasData] = useState<GraficasData | null>(null);
  
  // Nuevos datos
  const [itemsProduccionPorEstado, setItemsProduccionPorEstado] = useState<ItemsProduccionPorEstado | null>(null);
  const [asignacionesTerminadas, setAsignacionesTerminadas] = useState<AsignacionesTerminadas | null>(null);
  const [empleadosItemsTerminados, setEmpleadosItemsTerminados] = useState<EmpleadoItemsTerminados[]>([]);
  const [itemsPorVentas, setItemsPorVentas] = useState<ItemPorVentas[]>([]);
  const [inventarioPorSucursal, setInventarioPorSucursal] = useState<InventarioPorSucursal | null>(null);
  const [sugerenciasMejoradas, setSugerenciasMejoradas] = useState<SugerenciaProduccionMejorada[]>([]);
  const [itemsSinVentas, setItemsSinVentas] = useState<ItemSinVentas[]>([]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    const errores: string[] = [];
    
    try {
      const params = new URLSearchParams({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });
      
      const token = localStorage.getItem('access_token');
      const apiUrl = getApiUrl();
      
      // Preparar parámetros para gráficas
      const paramsGraficas = new URLSearchParams({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });
      
      if (compararPeriodo) {
        const fechaInicioAnterior = new Date(fechaInicio);
        fechaInicioAnterior.setDate(fechaInicioAnterior.getDate() - (new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24));
        const fechaFinAnterior = new Date(fechaInicio);
        fechaFinAnterior.setDate(fechaFinAnterior.getDate() - 1);
        
        paramsGraficas.append('comparar_con', fechaInicioAnterior.toISOString().split('T')[0]);
        paramsGraficas.append('comparar_fin', fechaFinAnterior.toISOString().split('T')[0]);
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // OPTIMIZACIÓN: Cargar todos los endpoints en paralelo con Promise.allSettled
      const resultados = await Promise.allSettled([
        // Resumen
        fetch(`${apiUrl}/pedidos/panel-control-logistico/resumen/?${params}`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
        // Items en producción
        fetch(`${apiUrl}/pedidos/panel-control-logistico/items-produccion/?${params}`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
        // Items sin movimiento
        fetch(`${apiUrl}/pedidos/panel-control-logistico/items-sin-movimiento/?dias=7`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
        // Items más movidos
        fetch(`${apiUrl}/pedidos/panel-control-logistico/items-mas-movidos/?${params}`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
        // Items existencia cero
        fetch(`${apiUrl}/pedidos/panel-control-logistico/items-existencia-cero/`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
        // Sugerencias
        fetch(`${apiUrl}/pedidos/panel-control-logistico/sugerencia-produccion/?${params}`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
        // Gráficas
        fetch(`${apiUrl}/pedidos/panel-control-logistico/graficas/?${paramsGraficas}`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
        // Items producción por estado
        fetch(`${apiUrl}/pedidos/panel-control-logistico/items-produccion-por-estado/`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
        // Asignaciones terminadas
        fetch(`${apiUrl}/pedidos/panel-control-logistico/asignaciones-terminadas/`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
        // Empleados items terminados
        fetch(`${apiUrl}/pedidos/panel-control-logistico/empleados-items-terminados/`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
        // Items por ventas
        fetch(`${apiUrl}/pedidos/panel-control-logistico/items-por-ventas/?${params}`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
        // Inventario por sucursal
        fetch(`${apiUrl}/pedidos/panel-control-logistico/inventario-por-sucursal/`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
        // Sugerencias mejoradas
        fetch(`${apiUrl}/pedidos/panel-control-logistico/sugerencia-produccion-mejorada/?dias=7`, { headers }).then(res => res.ok ? res.json() : null).catch(() => null),
      ]);
      
      // Procesar resultados
      const [
        resResumen,
        resItems,
        resSinMov,
        resMasMov,
        resCero,
        resSug,
        resGraf,
        resItemsEstado,
        resAsigTerm,
        resEmpleados,
        resItemsVentas,
        resInventario,
        resSugMejoradas
      ] = resultados;
      
      // Procesar resumen
      if (resResumen.status === 'fulfilled' && resResumen.value) {
        setResumen(resResumen.value);
        console.log('✅ Resumen cargado');
      } else {
        errores.push('Endpoint de resumen no disponible');
      }
      
      // Procesar items producción
      if (resItems.status === 'fulfilled' && resItems.value) {
        setItemsProduccion(resItems.value.items || []);
        console.log('✅ Items producción cargados:', resItems.value.items?.length || 0);
      }
      
      // Procesar items sin movimiento
      if (resSinMov.status === 'fulfilled' && resSinMov.value) {
        setItemsSinMovimiento(resSinMov.value.items || []);
        console.log('✅ Items sin movimiento cargados:', resSinMov.value.items?.length || 0);
      }
      
      // Procesar items más movidos
      if (resMasMov.status === 'fulfilled' && resMasMov.value) {
        setItemsMasMovidos(resMasMov.value.items || []);
        console.log('✅ Items más movidos cargados:', resMasMov.value.items?.length || 0);
      }
      
      // Procesar items existencia cero
      if (resCero.status === 'fulfilled' && resCero.value) {
        setItemsExistenciaCero(resCero.value.items || []);
        console.log('✅ Items existencia cero cargados:', resCero.value.items?.length || 0);
      }
      
      // Procesar sugerencias
      if (resSug.status === 'fulfilled' && resSug.value) {
        setSugerencias(resSug.value.sugerencias || []);
        console.log('✅ Sugerencias cargadas:', resSug.value.sugerencias?.length || 0);
      }
      
      // Procesar gráficas
      if (resGraf.status === 'fulfilled' && resGraf.value) {
        setGraficasData(resGraf.value);
        console.log('✅ Gráficas cargadas');
      } else {
        errores.push('Endpoint de gráficas no disponible');
      }
      
      // Procesar items producción por estado
      if (resItemsEstado.status === 'fulfilled' && resItemsEstado.value) {
        setItemsProduccionPorEstado(resItemsEstado.value);
        console.log('✅ Items producción por estado cargados');
      }
      
      // Procesar asignaciones terminadas
      if (resAsigTerm.status === 'fulfilled' && resAsigTerm.value) {
        setAsignacionesTerminadas(resAsigTerm.value);
        console.log('✅ Asignaciones terminadas cargadas');
      }
      
      // Procesar empleados items terminados
      if (resEmpleados.status === 'fulfilled' && resEmpleados.value) {
        setEmpleadosItemsTerminados(resEmpleados.value.empleados || []);
        console.log('✅ Empleados items terminados cargados');
      }
      
      // Procesar items por ventas
      if (resItemsVentas.status === 'fulfilled' && resItemsVentas.value) {
        setItemsPorVentas(resItemsVentas.value.items || []);
        console.log('✅ Items por ventas cargados');
      }
      
      // Procesar inventario por sucursal
      if (resInventario.status === 'fulfilled' && resInventario.value) {
        setInventarioPorSucursal(resInventario.value);
        console.log('✅ Inventario por sucursal cargado');
      }
      
      // Procesar sugerencias mejoradas
      if (resSugMejoradas.status === 'fulfilled' && resSugMejoradas.value) {
        setSugerenciasMejoradas(resSugMejoradas.value.sugerencias || []);
        setItemsSinVentas(resSugMejoradas.value.items_sin_ventas || []);
        console.log('✅ Sugerencias mejoradas cargadas');
      }
      
      // Si todos los endpoints fallaron, mostrar mensaje
      if (errores.length > 0 && !resumen && !graficasData && itemsProduccion.length === 0) {
        setError(`Los endpoints del backend aún no están implementados. Por favor, implementa los endpoints según las especificaciones en ESPECIFICACIONES_BACKEND_PANEL_CONTROL_LOGISTICO.md. Errores: ${errores.join(', ')}`);
      }
      
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleActualizar = () => {
    cargarDatos();
  };

  const handleExportarPDF = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = getApiUrl();
      const params = new URLSearchParams({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });
      
      const response = await fetch(`${apiUrl}/pedidos/panel-control-logistico/exportar-pdf/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Crear contenido HTML para el PDF
        const htmlContent = generarHTMLParaPDF(data);
        
        // Abrir ventana nueva con el contenido
        const ventana = window.open('', '_blank');
        if (ventana) {
          ventana.document.write(htmlContent);
          ventana.document.close();
          
          // Esperar a que se cargue y luego imprimir
          setTimeout(() => {
            ventana.print();
          }, 500);
        }
      } else {
        alert('Error al exportar el PDF');
      }
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar el PDF');
    }
  };

  const generarHTMLParaPDF = (data: any): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Panel de Control Logístico - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .total { font-weight: bold; font-size: 1.2em; }
            @media print {
              body { padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Panel de Control Logístico</h1>
          <p><strong>Fecha de Exportación:</strong> ${new Date(data.fecha_exportacion).toLocaleString()}</p>
          <p><strong>Período:</strong> ${data.periodo.fecha_inicio || 'N/A'} - ${data.periodo.fecha_fin || 'N/A'}</p>
          
          <h2>Items en Producción por Estado</h2>
          <div class="card">
            <p><strong>Herrería:</strong> ${data.items_produccion_por_estado?.herreria?.cantidad || 0}</p>
            <p><strong>Masillar:</strong> ${data.items_produccion_por_estado?.masillar?.cantidad || 0}</p>
            <p><strong>Preparar:</strong> ${data.items_produccion_por_estado?.preparar?.cantidad || 0}</p>
            <p class="total"><strong>Total:</strong> ${data.items_produccion_por_estado?.total || 0}</p>
          </div>
          
          <h2>Inventario por Sucursal</h2>
          <div class="card">
            <p><strong>Sucursal 1:</strong> ${data.inventario_por_sucursal?.sucursal1?.total_items || 0} items</p>
            <p><strong>Sucursal 2:</strong> ${data.inventario_por_sucursal?.sucursal2?.total_items || 0} items</p>
            <p class="total"><strong>Total General:</strong> ${data.inventario_por_sucursal?.total_general || 0} items</p>
          </div>
          
          <h2>Asignaciones Terminadas</h2>
          <div class="card">
            <p><strong>Herrería:</strong> ${data.asignaciones_terminadas?.herreria?.total || 0}</p>
            <p><strong>Masillar:</strong> ${data.asignaciones_terminadas?.masillar?.total || 0}</p>
            <p><strong>Preparar:</strong> ${data.asignaciones_terminadas?.preparar?.total || 0}</p>
            <p class="total"><strong>Total General:</strong> ${data.asignaciones_terminadas?.total_general || 0}</p>
          </div>
          
          <h2>Empleados con Items Terminados</h2>
          <table>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Herrería</th>
                <th>Masillar</th>
                <th>Preparar</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(data.empleados_items_terminados?.empleados || []).map((emp: any) => `
                <tr>
                  <td>${emp.empleado_nombre}</td>
                  <td>${emp.herreria}</td>
                  <td>${emp.masillar}</td>
                  <td>${emp.preparar}</td>
                  <td>${emp.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Items por Ventas (Top 20)</h2>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Item</th>
                <th>Ventas</th>
                <th>Sucursal 1</th>
                <th>Sucursal 2</th>
              </tr>
            </thead>
            <tbody>
              ${(data.items_por_ventas?.items || []).slice(0, 20).map((item: any) => `
                <tr>
                  <td>${item.codigo}</td>
                  <td>${item.item_nombre}</td>
                  <td>${item.ventas}</td>
                  <td>${item.sucursal1_creados}</td>
                  <td>${item.sucursal2_creados}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Sugerencias de Producción</h2>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Item</th>
                <th>Existencia</th>
                <th>Ventas (7 días)</th>
                <th>Unidades Sugeridas</th>
                <th>Prioridad</th>
              </tr>
            </thead>
            <tbody>
              ${(data.sugerencias_produccion?.sugerencias || []).map((sug: any) => `
                <tr>
                  <td>${sug.codigo}</td>
                  <td>${sug.item_nombre}</td>
                  <td>${sug.existencia_actual}</td>
                  <td>${sug.ventas_periodo}</td>
                  <td>${sug.unidades_sugeridas}</td>
                  <td>${sug.prioridad}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Items Sin Ventas</h2>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Item</th>
                <th>Existencia</th>
                <th>Días Sin Ventas</th>
              </tr>
            </thead>
            <tbody>
              ${(data.sugerencias_produccion?.items_sin_ventas || []).map((item: any) => `
                <tr>
                  <td>${item.codigo}</td>
                  <td>${item.item_nombre}</td>
                  <td>${item.existencia_total}</td>
                  <td>${item.dias_sin_ventas}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };

  // Colores para gráficas
  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

  // Colores según categoría
  const getColorCategoria = (categoria: string) => {
    switch (categoria) {
      case 'sin_movimiento':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'mas_movido':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'normal':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getColorPrioridad = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-600';
      case 'media':
        return 'bg-yellow-600';
      case 'baja':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="w-full max-w-[2000px] mx-auto mt-4 md:mt-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel de Control Logístico</h1>
        <p className="text-gray-600">Gestión de inventario y producción</p>
      </div>

      {/* Filtros de Fecha */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-medium">Fecha Inicio:</label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Fecha Fin:</label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-40"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={compararPeriodo}
                  onChange={(e) => setCompararPeriodo(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Comparar con período anterior</span>
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleActualizar}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button
                onClick={handleExportarPDF}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !resumen ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex justify-center items-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-3" />
              <span className="text-blue-600 font-semibold">Cargando datos...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumen General */}
          {resumen && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Items en Producción</p>
                      <p className="text-2xl font-bold text-gray-800">{resumen.total_items_produccion}</p>
                    </div>
                    <Factory className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Unidades en Producción</p>
                      <p className="text-2xl font-bold text-gray-800">{resumen.total_unidades_produccion}</p>
                    </div>
                    <Package className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Items Vendidos</p>
                      <p className="text-2xl font-bold text-gray-800">{resumen.total_items_vendidos_periodo}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Unidades Vendidas</p>
                      <p className="text-2xl font-bold text-gray-800">{resumen.total_unidades_vendidas_periodo}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-red-300 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-700">Sin Movimiento</p>
                      <p className="text-2xl font-bold text-red-800">{resumen.total_items_sin_movimiento}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-green-300 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Más Movidos</p>
                      <p className="text-2xl font-bold text-green-800">{resumen.total_items_mas_movidos}</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-orange-300 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700">Existencia 0</p>
                      <p className="text-2xl font-bold text-orange-800">{resumen.total_items_existencia_cero}</p>
                    </div>
                    <Warehouse className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Nuevos Resúmenes */}
          {itemsProduccionPorEstado && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-blue-300 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">Herrería</p>
                      <p className="text-2xl font-bold text-blue-800">{itemsProduccionPorEstado.herreria.cantidad}</p>
                    </div>
                    <Factory className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-purple-300 bg-purple-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700">Masillar</p>
                      <p className="text-2xl font-bold text-purple-800">{itemsProduccionPorEstado.masillar.cantidad}</p>
                    </div>
                    <Package className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-orange-300 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700">Preparar</p>
                      <p className="text-2xl font-bold text-orange-800">{itemsProduccionPorEstado.preparar.cantidad}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-green-300 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Total Producción</p>
                      <p className="text-2xl font-bold text-green-800">{itemsProduccionPorEstado.total}</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {inventarioPorSucursal && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-blue-300 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">Sucursal 1</p>
                      <p className="text-2xl font-bold text-blue-800">{inventarioPorSucursal.sucursal1.total_items}</p>
                      <p className="text-xs text-blue-600 mt-1">items</p>
                    </div>
                    <Warehouse className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-purple-300 bg-purple-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700">Sucursal 2</p>
                      <p className="text-2xl font-bold text-purple-800">{inventarioPorSucursal.sucursal2.total_items}</p>
                      <p className="text-xs text-purple-600 mt-1">items</p>
                    </div>
                    <Warehouse className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-green-300 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Total Inventario</p>
                      <p className="text-2xl font-bold text-green-800">{inventarioPorSucursal.total_general}</p>
                      <p className="text-xs text-green-600 mt-1">items</p>
                    </div>
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs para diferentes vistas */}
          <Tabs defaultValue="produccion" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="produccion">Producción</TabsTrigger>
              <TabsTrigger value="produccion-estado">Por Estado</TabsTrigger>
              <TabsTrigger value="asignaciones">Asignaciones</TabsTrigger>
              <TabsTrigger value="empleados">Empleados</TabsTrigger>
              <TabsTrigger value="ventas">Ventas</TabsTrigger>
              <TabsTrigger value="graficas">Gráficas</TabsTrigger>
              <TabsTrigger value="sugerencias">Sugerencias</TabsTrigger>
              <TabsTrigger value="sin-ventas">Sin Ventas</TabsTrigger>
            </TabsList>

            {/* Tab: Items en Producción */}
            <TabsContent value="produccion" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Items en Producción</CardTitle>
                </CardHeader>
                <CardContent>
                  {itemsProduccion.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-2">No hay items en producción</p>
                      <p className="text-sm text-gray-500">Los datos aparecerán cuando el backend implemente los endpoints</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="p-3 text-left text-sm font-semibold">Item</th>
                            <th className="p-3 text-left text-sm font-semibold">Código</th>
                            <th className="p-3 text-left text-sm font-semibold">Cantidad Producción</th>
                            <th className="p-3 text-left text-sm font-semibold">Existencia</th>
                            <th className="p-3 text-left text-sm font-semibold">Estado</th>
                            <th className="p-3 text-left text-sm font-semibold">Categoría</th>
                            <th className="p-3 text-left text-sm font-semibold">Días Sin Mov.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsProduccion.map((item) => (
                          <tr 
                            key={item.item_id}
                            className={`border-b border-gray-200 hover:bg-gray-50 ${getColorCategoria(item.categoria_movimiento)}`}
                          >
                            <td className="p-3">
                              <div className="font-semibold">{item.item_nombre}</div>
                              {item.item_descripcion && (
                                <div className="text-xs text-gray-600 mt-1">{item.item_descripcion}</div>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="font-mono">
                                {item.codigo}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary">{item.cantidad_total_produccion}</Badge>
                            </td>
                            <td className="p-3">
                              <Badge className={item.existencia_actual === 0 ? 'bg-orange-600' : 'bg-green-600'}>
                                {item.existencia_actual}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">{item.estado_actual}</td>
                            <td className="p-3">
                              <Badge className={getColorCategoria(item.categoria_movimiento)}>
                                {item.categoria_movimiento === 'sin_movimiento' ? 'Sin Movimiento' :
                                 item.categoria_movimiento === 'mas_movido' ? 'Más Movido' : 'Normal'}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {item.dias_sin_movimiento > 0 ? (
                                <span className="text-red-600 font-semibold">{item.dias_sin_movimiento}</span>
                              ) : (
                                <span className="text-green-600">0</span>
                              )}
                            </td>
                          </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Gráficas */}
            <TabsContent value="graficas" className="space-y-6">
              {!graficasData ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-2">No hay datos de gráficas disponibles</p>
                      <p className="text-sm text-gray-500">Los datos aparecerán cuando el backend implemente el endpoint /graficas/</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Comparación si está activada */}
                  {graficasData.comparacion && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Comparación con Período Anterior</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Items Producción</p>
                            <p className={`text-lg font-bold ${graficasData.comparacion.variacion_items_produccion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {graficasData.comparacion.variacion_items_produccion >= 0 ? '+' : ''}
                              {graficasData.comparacion.variacion_items_produccion.toFixed(1)}%
                              {graficasData.comparacion.variacion_items_produccion >= 0 ? (
                                <TrendingUp className="w-4 h-4 inline ml-1" />
                              ) : (
                                <TrendingDown className="w-4 h-4 inline ml-1" />
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Unidades Producción</p>
                            <p className={`text-lg font-bold ${graficasData.comparacion.variacion_unidades_produccion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {graficasData.comparacion.variacion_unidades_produccion >= 0 ? '+' : ''}
                              {graficasData.comparacion.variacion_unidades_produccion.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Items Vendidos</p>
                            <p className={`text-lg font-bold ${graficasData.comparacion.variacion_items_vendidos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {graficasData.comparacion.variacion_items_vendidos >= 0 ? '+' : ''}
                              {graficasData.comparacion.variacion_items_vendidos.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Unidades Vendidas</p>
                            <p className={`text-lg font-bold ${graficasData.comparacion.variacion_unidades_vendidas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {graficasData.comparacion.variacion_unidades_vendidas >= 0 ? '+' : ''}
                              {graficasData.comparacion.variacion_unidades_vendidas.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Tiempo Promedio</p>
                            <p className={`text-lg font-bold ${graficasData.comparacion.variacion_tiempo_promedio <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {graficasData.comparacion.variacion_tiempo_promedio >= 0 ? '+' : ''}
                              {graficasData.comparacion.variacion_tiempo_promedio.toFixed(1)} días
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Gráfica de Movimientos Diarios */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Movimientos Diarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={graficasData.graficas.movimientos_diarios}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="fecha" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="entradas" stroke="#3b82f6" name="Entradas" />
                          <Line type="monotone" dataKey="salidas" stroke="#ef4444" name="Salidas" />
                          <Line type="monotone" dataKey="ventas" stroke="#10b981" name="Ventas" />
                          <Line type="monotone" dataKey="produccion" stroke="#8b5cf6" name="Producción" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Gráfica de Items Top Producción */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Items en Producción</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={graficasData.graficas.items_top_produccion.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="item_nombre" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="cantidad" fill="#3b82f6" name="Cantidad" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Gráfica de Distribución por Estados */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribución por Estados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={[
                              { name: 'Herrería', value: graficasData.graficas.distribucion_estados.herreria },
                              { name: 'Masillar', value: graficasData.graficas.distribucion_estados.masillar },
                              { name: 'Preparar', value: graficasData.graficas.distribucion_estados.preparar },
                              { name: 'Facturación', value: graficasData.graficas.distribucion_estados.facturacion }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(props: any) => {
                              const { cx, cy, midAngle, innerRadius, outerRadius, name, percent } = props;
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              return (
                                <text 
                                  x={x} 
                                  y={y} 
                                  fill="white" 
                                  textAnchor={x > cx ? 'start' : 'end'} 
                                  dominantBaseline="central"
                                  fontSize={12}
                                >
                                  {`${name}: ${(percent * 100).toFixed(0)}%`}
                                </text>
                              );
                            }}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[0, 1, 2, 3].map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Promedios */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Promedios del Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Items Producción/Día</p>
                          <p className="text-2xl font-bold">{graficasData.promedios.items_produccion_diario.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Unidades Producción/Día</p>
                          <p className="text-2xl font-bold">{graficasData.promedios.unidades_produccion_diario.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Items Vendidos/Día</p>
                          <p className="text-2xl font-bold">{graficasData.promedios.items_vendidos_diario.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Unidades Vendidas/Día</p>
                          <p className="text-2xl font-bold">{graficasData.promedios.unidades_vendidas_diario.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tiempo Promedio</p>
                          <p className="text-2xl font-bold">{graficasData.promedios.tiempo_promedio_produccion.toFixed(1)} días</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Tab: Sin Movimiento */}
            <TabsContent value="sin-movimiento" className="space-y-6">
              <Card className="border-red-300">
                <CardHeader>
                  <CardTitle className="text-red-700">Items Sin Movimiento (7+ días)</CardTitle>
                </CardHeader>
                <CardContent>
                  {itemsSinMovimiento.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-2">No hay items sin movimiento</p>
                      <p className="text-sm text-gray-500">Los datos aparecerán cuando el backend implemente los endpoints</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-red-100 border-b-2 border-red-300">
                            <th className="p-3 text-left text-sm font-semibold">Item</th>
                            <th className="p-3 text-left text-sm font-semibold">Código</th>
                            <th className="p-3 text-left text-sm font-semibold">Cantidad</th>
                            <th className="p-3 text-left text-sm font-semibold">Días Sin Mov.</th>
                            <th className="p-3 text-left text-sm font-semibold">Última Mov.</th>
                            <th className="p-3 text-left text-sm font-semibold">Módulo</th>
                            <th className="p-3 text-left text-sm font-semibold">Empleado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsSinMovimiento.map((item) => (
                          <tr key={item.item_id} className="border-b border-red-200 bg-red-50">
                            <td className="p-3 font-semibold">{item.item_nombre}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="font-mono">{item.codigo}</Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary">{item.cantidad_produccion}</Badge>
                            </td>
                            <td className="p-3">
                              <span className="text-red-600 font-bold">{item.dias_sin_movimiento}</span>
                            </td>
                            <td className="p-3 text-sm">
                              {new Date(item.ultima_movimiento).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-sm">{item.modulo_actual}</td>
                            <td className="p-3 text-sm">{item.empleado_asignado || 'Sin asignar'}</td>
                          </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Más Movidos */}
            <TabsContent value="mas-movidos" className="space-y-6">
              <Card className="border-green-300">
                <CardHeader>
                  <CardTitle className="text-green-700">Items Más Movidos (7 días)</CardTitle>
                </CardHeader>
                <CardContent>
                  {itemsMasMovidos.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-2">No hay items más movidos</p>
                      <p className="text-sm text-gray-500">Los datos aparecerán cuando el backend implemente los endpoints</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-green-100 border-b-2 border-green-300">
                            <th className="p-3 text-left text-sm font-semibold">Item</th>
                            <th className="p-3 text-left text-sm font-semibold">Código</th>
                            <th className="p-3 text-left text-sm font-semibold">Total Mov.</th>
                            <th className="p-3 text-left text-sm font-semibold">Entradas</th>
                            <th className="p-3 text-left text-sm font-semibold">Salidas</th>
                            <th className="p-3 text-left text-sm font-semibold">Ventas</th>
                            <th className="p-3 text-left text-sm font-semibold">Promedio/Día</th>
                            <th className="p-3 text-left text-sm font-semibold">Tendencia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsMasMovidos.map((item) => (
                          <tr key={item.item_id} className="border-b border-green-200 bg-green-50">
                            <td className="p-3 font-semibold">{item.item_nombre}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="font-mono">{item.codigo}</Badge>
                            </td>
                            <td className="p-3">
                              <Badge className="bg-green-600">{item.total_movimientos}</Badge>
                            </td>
                            <td className="p-3">{item.entradas}</td>
                            <td className="p-3">{item.salidas}</td>
                            <td className="p-3">{item.ventas}</td>
                            <td className="p-3 font-semibold">{item.promedio_diario.toFixed(2)}</td>
                            <td className="p-3">
                              <Badge className={item.tendencia === 'creciente' ? 'bg-green-600' : item.tendencia === 'decreciente' ? 'bg-red-600' : 'bg-gray-600'}>
                                {item.tendencia === 'creciente' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                                {item.tendencia === 'decreciente' && <TrendingDown className="w-3 h-3 inline mr-1" />}
                                {item.tendencia}
                              </Badge>
                            </td>
                          </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Sugerencias */}
            <TabsContent value="sugerencias" className="space-y-6">
              {/* Items con Existencia 0 */}
              <Card className="border-orange-300">
                <CardHeader>
                  <CardTitle className="text-orange-700">Items con Existencia en 0</CardTitle>
                </CardHeader>
                <CardContent>
                  {itemsExistenciaCero.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Warehouse className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-2">No hay items con existencia en 0</p>
                      <p className="text-sm text-gray-500">Los datos aparecerán cuando el backend implemente los endpoints</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-orange-100 border-b-2 border-orange-300">
                            <th className="p-3 text-left text-sm font-semibold">Item</th>
                            <th className="p-3 text-left text-sm font-semibold">Código</th>
                            <th className="p-3 text-left text-sm font-semibold">Días Sin Exist.</th>
                            <th className="p-3 text-left text-sm font-semibold">Pedidos Pendientes</th>
                            <th className="p-3 text-left text-sm font-semibold">Unidades Solicitadas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsExistenciaCero.map((item) => (
                          <tr key={item.item_id} className="border-b border-orange-200 bg-orange-50">
                            <td className="p-3 font-semibold">{item.item_nombre}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="font-mono">{item.codigo}</Badge>
                            </td>
                            <td className="p-3">
                              <span className="text-orange-600 font-bold">{item.dias_sin_existencia}</span>
                            </td>
                            <td className="p-3">
                              <Badge className="bg-orange-600">{item.total_pedidos_pendientes}</Badge>
                            </td>
                            <td className="p-3">
                              <Badge className="bg-red-600">{item.total_unidades_solicitadas}</Badge>
                            </td>
                          </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sugerencias de Producción */}
              <Card>
                <CardHeader>
                  <CardTitle>Sugerencias de Producción</CardTitle>
                </CardHeader>
                <CardContent>
                  {sugerencias.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-2">No hay sugerencias de producción</p>
                      <p className="text-sm text-gray-500">Los datos aparecerán cuando el backend implemente los endpoints</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sugerencias.map((sug) => (
                      <Card key={sug.item_id} className={`border-l-4 ${
                        sug.prioridad === 'alta' ? 'border-red-500' :
                        sug.prioridad === 'media' ? 'border-yellow-500' : 'border-blue-500'
                      }`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={getColorPrioridad(sug.prioridad)}>
                                  {sug.prioridad.toUpperCase()}
                                </Badge>
                                <h3 className="font-bold text-lg">{sug.item_nombre}</h3>
                                <Badge variant="outline" className="font-mono">{sug.codigo}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{sug.razon}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Existencia Actual:</p>
                                  <p className="font-bold">{sug.existencia_actual}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">En Producción:</p>
                                  <p className="font-bold">{sug.unidades_en_produccion}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Solicitadas:</p>
                                  <p className="font-bold">{sug.unidades_solicitadas}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Sugeridas:</p>
                                  <p className="font-bold text-blue-600">{sug.unidades_sugeridas}</p>
                                </div>
                              </div>
                              <div className="mt-3">
                                <p className="text-xs text-gray-500">
                                  Tiempo estimado: {sug.dias_estimados_produccion} días | 
                                  Pedidos afectados: {sug.pedidos_afectados} |
                                  Factores: {sug.factores.join(', ')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Producción por Estado */}
            <TabsContent value="produccion-estado" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Items en Producción por Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  {itemsProduccionPorEstado ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-blue-300">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-blue-700 mb-2">Herrería</h3>
                          <p className="text-3xl font-bold text-blue-800">{itemsProduccionPorEstado.herreria.cantidad}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-purple-300">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-purple-700 mb-2">Masillar</h3>
                          <p className="text-3xl font-bold text-purple-800">{itemsProduccionPorEstado.masillar.cantidad}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-orange-300">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-orange-700 mb-2">Preparar</h3>
                          <p className="text-3xl font-bold text-orange-800">{itemsProduccionPorEstado.preparar.cantidad}</p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-12">Cargando datos...</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Asignaciones Terminadas */}
            <TabsContent value="asignaciones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Asignaciones Terminadas</CardTitle>
                </CardHeader>
                <CardContent>
                  {asignacionesTerminadas ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-blue-300">
                          <CardContent className="pt-6">
                            <h3 className="font-semibold text-blue-700 mb-2">Herrería</h3>
                            <p className="text-3xl font-bold text-blue-800">{asignacionesTerminadas.herreria.total}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-purple-300">
                          <CardContent className="pt-6">
                            <h3 className="font-semibold text-purple-700 mb-2">Masillar</h3>
                            <p className="text-3xl font-bold text-purple-800">{asignacionesTerminadas.masillar.total}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-orange-300">
                          <CardContent className="pt-6">
                            <h3 className="font-semibold text-orange-700 mb-2">Preparar</h3>
                            <p className="text-3xl font-bold text-orange-800">{asignacionesTerminadas.preparar.total}</p>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Total General:</strong> {asignacionesTerminadas.total_general} asignaciones terminadas
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">Cargando datos...</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Empleados */}
            <TabsContent value="empleados" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Empleados con Items Terminados</CardTitle>
                </CardHeader>
                <CardContent>
                  {empleadosItemsTerminados.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="p-3 text-left text-sm font-semibold">Empleado</th>
                            <th className="p-3 text-left text-sm font-semibold">Herrería</th>
                            <th className="p-3 text-left text-sm font-semibold">Masillar</th>
                            <th className="p-3 text-left text-sm font-semibold">Preparar</th>
                            <th className="p-3 text-left text-sm font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {empleadosItemsTerminados.map((emp) => (
                            <tr key={emp.empleado_id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-3 font-semibold">{emp.empleado_nombre}</td>
                              <td className="p-3">
                                <Badge className="bg-blue-600">{emp.herreria}</Badge>
                              </td>
                              <td className="p-3">
                                <Badge className="bg-purple-600">{emp.masillar}</Badge>
                              </td>
                              <td className="p-3">
                                <Badge className="bg-orange-600">{emp.preparar}</Badge>
                              </td>
                              <td className="p-3">
                                <Badge className="bg-green-600">{emp.total}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">No hay datos disponibles</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Ventas */}
            <TabsContent value="ventas" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Items por Ventas (Más Vendido a Menos Vendido)</CardTitle>
                </CardHeader>
                <CardContent>
                  {itemsPorVentas.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="p-3 text-left text-sm font-semibold">Código</th>
                            <th className="p-3 text-left text-sm font-semibold">Item</th>
                            <th className="p-3 text-left text-sm font-semibold">Descripción</th>
                            <th className="p-3 text-left text-sm font-semibold">Ventas</th>
                            <th className="p-3 text-left text-sm font-semibold">Sucursal 1</th>
                            <th className="p-3 text-left text-sm font-semibold">Sucursal 2</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsPorVentas.map((item) => (
                            <tr key={item.item_id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-3">
                                <Badge variant="outline" className="font-mono">{item.codigo}</Badge>
                              </td>
                              <td className="p-3 font-semibold">{item.item_nombre}</td>
                              <td className="p-3 text-sm text-gray-600">{item.descripcion}</td>
                              <td className="p-3">
                                <Badge className="bg-green-600">{item.ventas}</Badge>
                              </td>
                              <td className="p-3">{item.sucursal1_creados}</td>
                              <td className="p-3">{item.sucursal2_creados}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">No hay datos disponibles</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Sin Ventas */}
            <TabsContent value="sin-ventas" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Items Sin Ventas o con Ventas Bajas</CardTitle>
                </CardHeader>
                <CardContent>
                  {sugerenciasMejoradas.length > 0 || itemsSinVentas.length > 0 ? (
                    <div className="space-y-6">
                      {sugerenciasMejoradas.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-4">Sugerencias de Producción (Stock Bajo)</h3>
                          <div className="space-y-4">
                            {sugerenciasMejoradas.map((sug) => (
                              <Card key={sug.item_id} className={`border-l-4 ${
                                sug.prioridad === 'alta' ? 'border-red-500' :
                                sug.prioridad === 'media' ? 'border-yellow-500' : 'border-blue-500'
                              }`}>
                                <CardContent className="pt-6">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <Badge className={getColorPrioridad(sug.prioridad)}>
                                          {sug.prioridad.toUpperCase()}
                                        </Badge>
                                        <h3 className="font-bold text-lg">{sug.item_nombre}</h3>
                                        <Badge variant="outline" className="font-mono">{sug.codigo}</Badge>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-3">{sug.razon}</p>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <p className="text-gray-600">Existencia:</p>
                                          <p className="font-bold">{sug.existencia_actual}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Ventas (7 días):</p>
                                          <p className="font-bold">{sug.ventas_periodo}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Necesidad (7 días):</p>
                                          <p className="font-bold">{sug.necesidad_7_dias.toFixed(1)}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Sugeridas:</p>
                                          <p className="font-bold text-blue-600">{sug.unidades_sugeridas}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {itemsSinVentas.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-4">Items Sin Ventas</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-100 border-b-2 border-gray-300">
                                  <th className="p-3 text-left text-sm font-semibold">Código</th>
                                  <th className="p-3 text-left text-sm font-semibold">Item</th>
                                  <th className="p-3 text-left text-sm font-semibold">Existencia</th>
                                  <th className="p-3 text-left text-sm font-semibold">Días Sin Ventas</th>
                                </tr>
                              </thead>
                              <tbody>
                                {itemsSinVentas.map((item) => (
                                  <tr key={item.item_id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="p-3">
                                      <Badge variant="outline" className="font-mono">{item.codigo}</Badge>
                                    </td>
                                    <td className="p-3 font-semibold">{item.item_nombre}</td>
                                    <td className="p-3">{item.existencia_total}</td>
                                    <td className="p-3">
                                      <Badge className="bg-red-600">{item.dias_sin_ventas}</Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">No hay datos disponibles</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default PanelControlLogistico;

