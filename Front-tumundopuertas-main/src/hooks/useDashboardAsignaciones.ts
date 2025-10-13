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
      // SOLUCIÓN SIMPLIFICADA: Usar endpoint directo sin logs excesivos
      const response = await fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso/`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Verificar que tenemos asignaciones
      if (!data.asignaciones || !Array.isArray(data.asignaciones)) {
        return [];
      }
      
      // Usar directamente las asignaciones del endpoint
      const todasAsignaciones = data.asignaciones;

      // Procesar asignaciones de manera eficiente
      
      // Normalizar las asignaciones de manera eficiente
      const asignacionesNormalizadas = todasAsignaciones.map((item: any) => {
        // Extraer información del empleado de manera simple
        const empleado_id = item.empleadoId || item.empleado_id || item.empleado?.identificador || item.empleado?.id || "Sin asignar";
        const empleado_nombre = item.nombreempleado || item.empleado_nombre || item.empleado?.nombreCompleto || item.empleado?.nombre || "Sin asignar";
        
        return {
          _id: item._id || `${item.pedido_id}_${item.item_id}`,
          pedido_id: item.pedido_id,
          orden: item.orden || 0,
          item_id: item.item_id,
          empleado_id,
          empleado_nombre,
          modulo: item.modulo || "herreria",
          estado: item.estado || item.estado_asignacion || "en_proceso",
          fecha_asignacion: item.fecha_asignacion || item.fecha || item.created_at || new Date().toISOString(),
          fecha_fin: item.fecha_fin || item.finished_at,
          descripcionitem: item.descripcionitem || item.descripcion || item.item_descripcion || "Sin descripción",
          detalleitem: item.detalleitem || item.detalle || item.item_detalle,
          cliente_nombre: item.cliente_nombre || item.cliente?.cliente_nombre || item.cliente?.nombre || "Sin cliente",
          costo_produccion: item.costo_produccion || item.costo || item.costo_produccion_item || 0,
          imagenes: item.imagenes || item.images || []
        };
      });
      
      return asignacionesNormalizadas;
    } catch (err: any) {
      setError(`Error al cargar asignaciones: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
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