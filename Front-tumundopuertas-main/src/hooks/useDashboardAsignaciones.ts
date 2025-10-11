import { useState } from 'react';
import { getApiUrl } from '@/lib/api';

interface Asignacion {
  _id: string;
  pedido_id: string;
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

interface TerminarAsignacionData {
  asignacion_id: string;
  pin: string;
  empleado_id: string;
}

interface TerminarAsignacionResponse {
  message: string;
  success: boolean;
  asignacion_actualizada: Asignacion;
  siguiente_modulo?: string;
  comision_registrada?: boolean;
}

export const useDashboardAsignaciones = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAsignaciones = async (): Promise<Asignacion[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getApiUrl()}/dashboard/asignaciones`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(`Error al cargar asignaciones: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const terminarAsignacion = async (data: TerminarAsignacionData): Promise<TerminarAsignacionResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getApiUrl()}/dashboard/asignaciones/terminar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al terminar asignación");
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const obtenerSiguienteModulo = (moduloActual: string): string => {
    const flujoModulos: Record<string, string> = {
      'herreria': 'masillar',
      'masillar': 'preparar',
      'preparar': 'listo_facturar',
      'listo_facturar': 'completado'
    };
    
    return flujoModulos[moduloActual] || 'completado';
  };

  const obtenerModuloAnterior = (moduloActual: string): string => {
    const flujoModulos: Record<string, string> = {
      'masillar': 'herreria',
      'preparar': 'masillar',
      'listo_facturar': 'preparar',
      'completado': 'listo_facturar'
    };
    
    return flujoModulos[moduloActual] || 'herreria';
  };

  const obtenerColorModulo = (modulo: string): string => {
    const colores: Record<string, string> = {
      'herreria': 'bg-orange-100 text-orange-800',
      'masillar': 'bg-blue-100 text-blue-800',
      'preparar': 'bg-green-100 text-green-800',
      'listo_facturar': 'bg-purple-100 text-purple-800',
      'completado': 'bg-gray-100 text-gray-800'
    };
    
    return colores[modulo] || 'bg-gray-100 text-gray-800';
  };

  const obtenerIconoModulo = (modulo: string): string => {
    const iconos: Record<string, string> = {
      'herreria': '🔨',
      'masillar': '🎨',
      'preparar': '📦',
      'listo_facturar': '📋',
      'completado': '✅'
    };
    
    return iconos[modulo] || '⚙️';
  };

  const filtrarAsignacionesPorModulo = (asignaciones: Asignacion[], modulo: string): Asignacion[] => {
    return asignaciones.filter(asignacion => asignacion.modulo === modulo);
  };

  const filtrarAsignacionesPorEmpleado = (asignaciones: Asignacion[], empleadoId: string): Asignacion[] => {
    return asignaciones.filter(asignacion => asignacion.empleado_id === empleadoId);
  };

  const obtenerEstadisticasModulo = (asignaciones: Asignacion[], modulo: string) => {
    const asignacionesModulo = filtrarAsignacionesPorModulo(asignaciones, modulo);
    const enProceso = asignacionesModulo.filter(a => a.estado === 'en_proceso').length;
    const terminadas = asignacionesModulo.filter(a => a.estado === 'terminado').length;
    const costoTotal = asignacionesModulo.reduce((sum, a) => sum + a.costo_produccion, 0);
    
    return {
      total: asignacionesModulo.length,
      enProceso,
      terminadas,
      costoTotal
    };
  };

  return {
    loading,
    error,
    fetchAsignaciones,
    terminarAsignacion,
    obtenerSiguienteModulo,
    obtenerModuloAnterior,
    obtenerColorModulo,
    obtenerIconoModulo,
    filtrarAsignacionesPorModulo,
    filtrarAsignacionesPorEmpleado,
    obtenerEstadisticasModulo
  };
};
