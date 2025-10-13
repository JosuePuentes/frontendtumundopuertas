import { useState } from 'react';
import { getApiUrl } from '@/lib/api';

export interface Asignacion {
  _id: string;
  pedido_id: string;
  orden: number;  // ← AGREGAR ESTA PROPIEDAD
  item_id: string;
  empleado_id: string;
  empleado_nombre: string;
  modulo: string;
  estado: string;
  fecha_asignacion: string;
  fecha_fin?: string;
  descripcionitem: string;
  detalleitem?: string;
  cliente_nombre: string;
  costo_produccion: number;
  imagenes?: string[];
}

export interface TerminarAsignacionData {
  pedido_id: string;
  orden: number;  // ← AGREGAR ESTE PARÁMETRO
  item_id: string;
  empleado_id: string;
  estado: string;
  fecha_fin: string;
  pin: string;
}

export interface TerminarAsignacionResponse {
  success: boolean;
  message: string;
  asignacion_actualizada?: any;
}

export const useDashboardAsignaciones = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAsignaciones = async (): Promise<Asignacion[]> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando asignaciones desde endpoint general...');
      
      // SOLUCIÓN DIRECTA: Usar endpoint general de pedidos y extraer asignaciones
      const response = await fetch(`${getApiUrl()}/pedidos/`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📋 Datos recibidos del endpoint general:', data);
      
      // Verificar que tenemos pedidos
      if (!data.pedidos || !Array.isArray(data.pedidos)) {
        console.log('⚠️ No hay pedidos en la respuesta');
        return [];
      }
      
      // Extraer todas las asignaciones de todos los pedidos
      const todasAsignaciones: any[] = [];
      
      data.pedidos.forEach((pedido: any) => {
        if (pedido.seguimiento && Array.isArray(pedido.seguimiento)) {
          pedido.seguimiento.forEach((subestado: any) => {
            if (subestado.asignaciones_articulos && Array.isArray(subestado.asignaciones_articulos)) {
              subestado.asignaciones_articulos.forEach((asignacion: any) => {
                // Solo incluir asignaciones en proceso
                if (asignacion.estado === 'en_proceso') {
                  todasAsignaciones.push({
                    ...asignacion,
                    pedido_id: pedido._id,
                    cliente_nombre: pedido.cliente_nombre || pedido.cliente?.nombre || 'Sin cliente',
                    orden: subestado.orden,
                    modulo: obtenerModuloPorOrden(subestado.orden)
                  });
                }
              });
            }
          });
        }
      });
      
      console.log('🎯 Asignaciones extraídas:', todasAsignaciones.length);
      
      // Normalizar las asignaciones
      const asignacionesNormalizadas = todasAsignaciones.map((item: any) => {
        return {
          _id: item._id || `${item.pedido_id}_${item.item_id}`,
          pedido_id: item.pedido_id,
          orden: item.orden || 0,
          item_id: item.item_id,
          empleado_id: item.empleadoId || item.empleado_id || "Sin asignar",
          empleado_nombre: item.nombreempleado || item.empleado_nombre || "Sin asignar",
          modulo: item.modulo || "herreria",
          estado: item.estado || "en_proceso",
          fecha_asignacion: item.fecha_inicio || item.fecha_asignacion || new Date().toISOString(),
          fecha_fin: item.fecha_fin,
          descripcionitem: item.descripcionitem || "Sin descripción",
          detalleitem: item.detalleitem,
          cliente_nombre: item.cliente_nombre || "Sin cliente",
          costo_produccion: item.costoproduccion || item.costo_produccion || 0,
          imagenes: item.imagenes || []
        };
      });
      
      console.log('✅ Asignaciones normalizadas:', asignacionesNormalizadas.length);
      return asignacionesNormalizadas;
      
    } catch (err: any) {
      console.error('❌ Error al cargar asignaciones:', err);
      setError(`Error al cargar asignaciones: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función helper para obtener módulo por orden
  const obtenerModuloPorOrden = (orden: number): string => {
    switch (orden) {
      case 1: return 'herreria';
      case 2: return 'masillar';
      case 3: return 'preparar';
      case 4: return 'facturar';
      default: return 'herreria';
    }
  };

  const terminarAsignacion = async (data: TerminarAsignacionData): Promise<TerminarAsignacionResponse> => {
    try {
      const response = await fetch(`${getApiUrl()}/pedidos/asignacion/terminar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      throw new Error(`Error al terminar asignación: ${err.message}`);
    }
  };

  const obtenerSiguienteModulo = (moduloActual: string): string => {
    switch (moduloActual) {
      case 'herreria':
        return 'masillar';
      case 'masillar':
        return 'preparar';
      case 'preparar':
        return 'listo_facturar';
      default:
        return 'herreria';
    }
  };

  const obtenerColorModulo = (modulo: string): string => {
    switch (modulo) {
      case 'herreria':
        return 'bg-blue-100 text-blue-800';
      case 'masillar':
        return 'bg-green-100 text-green-800';
      case 'preparar':
        return 'bg-yellow-100 text-yellow-800';
      case 'listo_facturar':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const obtenerIconoModulo = (modulo: string): string => {
    switch (modulo) {
      case 'herreria':
        return '🔨';
      case 'masillar':
        return '🎨';
      case 'preparar':
        return '📦';
      case 'listo_facturar':
        return '✅';
      default:
        return '📋';
    }
  };

  const obtenerEstadisticasModulo = (asignaciones: Asignacion[], modulo: string) => {
    const asignacionesModulo = asignaciones.filter(a => a.modulo === modulo);
    return {
      total: asignacionesModulo.length,
      enProceso: asignacionesModulo.filter(a => a.estado === 'en_proceso').length,
      terminadas: asignacionesModulo.filter(a => a.estado === 'terminado').length,
      costoTotal: asignacionesModulo.reduce((sum, a) => sum + (a.costo_produccion || 0), 0)
    };
  };

  return {
    loading,
    error,
    fetchAsignaciones,
    terminarAsignacion,
    obtenerSiguienteModulo,
    obtenerColorModulo,
    obtenerIconoModulo,
    obtenerEstadisticasModulo
  };
};