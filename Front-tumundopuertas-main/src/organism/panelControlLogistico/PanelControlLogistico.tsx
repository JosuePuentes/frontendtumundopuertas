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
  Target
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
      
      // Cargar resumen
      try {
        const resResumen = await fetch(`${apiUrl}/pedidos/panel-control-logistico/resumen/?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (resResumen.ok) {
          const dataResumen = await resResumen.json();
          setResumen(dataResumen);
          console.log('✅ Resumen cargado:', dataResumen);
        } else if (resResumen.status === 404) {
          console.warn('⚠️ Endpoint /resumen/ no encontrado (404)');
          errores.push('Endpoint de resumen no disponible');
        } else {
          console.error('❌ Error en resumen:', resResumen.status, resResumen.statusText);
          errores.push(`Error en resumen: ${resResumen.status}`);
        }
      } catch (e: any) {
        console.error('❌ Excepción al cargar resumen:', e);
        errores.push('Error al cargar resumen');
      }
      
      // Cargar items en producción
      try {
        const resItems = await fetch(`${apiUrl}/pedidos/panel-control-logistico/items-produccion/?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (resItems.ok) {
          const dataItems = await resItems.json();
          setItemsProduccion(dataItems.items || []);
          console.log('✅ Items producción cargados:', dataItems.items?.length || 0);
        } else if (resItems.status === 404) {
          console.warn('⚠️ Endpoint /items-produccion/ no encontrado (404)');
        }
      } catch (e: any) {
        console.error('❌ Excepción al cargar items producción:', e);
      }
      
      // Cargar items sin movimiento
      try {
        const resSinMov = await fetch(`${apiUrl}/pedidos/panel-control-logistico/items-sin-movimiento/?dias=7`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (resSinMov.ok) {
          const dataSinMov = await resSinMov.json();
          setItemsSinMovimiento(dataSinMov.items || []);
          console.log('✅ Items sin movimiento cargados:', dataSinMov.items?.length || 0);
        } else if (resSinMov.status === 404) {
          console.warn('⚠️ Endpoint /items-sin-movimiento/ no encontrado (404)');
        }
      } catch (e: any) {
        console.error('❌ Excepción al cargar items sin movimiento:', e);
      }
      
      // Cargar items más movidos
      try {
        const resMasMov = await fetch(`${apiUrl}/pedidos/panel-control-logistico/items-mas-movidos/?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (resMasMov.ok) {
          const dataMasMov = await resMasMov.json();
          setItemsMasMovidos(dataMasMov.items || []);
          console.log('✅ Items más movidos cargados:', dataMasMov.items?.length || 0);
        } else if (resMasMov.status === 404) {
          console.warn('⚠️ Endpoint /items-mas-movidos/ no encontrado (404)');
        }
      } catch (e: any) {
        console.error('❌ Excepción al cargar items más movidos:', e);
      }
      
      // Cargar items existencia cero
      try {
        const resCero = await fetch(`${apiUrl}/pedidos/panel-control-logistico/items-existencia-cero/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (resCero.ok) {
          const dataCero = await resCero.json();
          setItemsExistenciaCero(dataCero.items || []);
          console.log('✅ Items existencia cero cargados:', dataCero.items?.length || 0);
        } else if (resCero.status === 404) {
          console.warn('⚠️ Endpoint /items-existencia-cero/ no encontrado (404)');
        }
      } catch (e: any) {
        console.error('❌ Excepción al cargar items existencia cero:', e);
      }
      
      // Cargar sugerencias
      try {
        const resSug = await fetch(`${apiUrl}/pedidos/panel-control-logistico/sugerencia-produccion/?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (resSug.ok) {
          const dataSug = await resSug.json();
          setSugerencias(dataSug.sugerencias || []);
          console.log('✅ Sugerencias cargadas:', dataSug.sugerencias?.length || 0);
        } else if (resSug.status === 404) {
          console.warn('⚠️ Endpoint /sugerencia-produccion/ no encontrado (404)');
        }
      } catch (e: any) {
        console.error('❌ Excepción al cargar sugerencias:', e);
      }
      
      // Cargar gráficas
      try {
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
        
        const resGraf = await fetch(`${apiUrl}/pedidos/panel-control-logistico/graficas/?${paramsGraficas}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (resGraf.ok) {
          const dataGraf = await resGraf.json();
          setGraficasData(dataGraf);
          console.log('✅ Gráficas cargadas:', dataGraf);
        } else if (resGraf.status === 404) {
          console.warn('⚠️ Endpoint /graficas/ no encontrado (404)');
          errores.push('Endpoint de gráficas no disponible');
        } else {
          console.error('❌ Error en gráficas:', resGraf.status, resGraf.statusText);
          errores.push(`Error en gráficas: ${resGraf.status}`);
        }
      } catch (e: any) {
        console.error('❌ Excepción al cargar gráficas:', e);
        errores.push('Error al cargar gráficas');
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
            <Button
              onClick={handleActualizar}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
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

          {/* Tabs para diferentes vistas */}
          <Tabs defaultValue="produccion" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="produccion">Producción</TabsTrigger>
              <TabsTrigger value="graficas">Gráficas</TabsTrigger>
              <TabsTrigger value="sin-movimiento">Sin Movimiento</TabsTrigger>
              <TabsTrigger value="mas-movidos">Más Movidos</TabsTrigger>
              <TabsTrigger value="sugerencias">Sugerencias</TabsTrigger>
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
          </Tabs>
        </>
      )}
    </div>
  );
};

export default PanelControlLogistico;

