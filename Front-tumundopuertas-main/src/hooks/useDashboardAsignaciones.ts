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
  siguiente_estado_item?: number;
  estado_anterior?: number;
  asignacion_actualizada?: {
    pedido_id: string;
    item_id: string;
    empleado_id: string;
    estado: string;
    fecha_fin: string;
    siguiente_modulo?: string;
    comision_registrada?: boolean;
  };
}

export const useDashboardAsignaciones = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAsignaciones = async (): Promise<Asignacion[]> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando asignaciones...');
      
      // Intentar primero el endpoint optimizado /asignaciones
      try {
        const response = await fetch(`${getApiUrl()}/asignaciones`);
        if (response.ok) {
          const data = await response.json();
          const asignaciones = data.asignaciones || [];
          console.log('✅ Asignaciones obtenidas del endpoint /asignaciones:', asignaciones.length);
          return asignaciones;
        }
      } catch (error) {
        console.log('⚠️ Endpoint /asignaciones no disponible, usando fallback...');
      }
      
      // Fallback: Usar el endpoint de comisiones en proceso
      console.log('🔄 Usando endpoint de fallback...');
      const response = await fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso/`);
      const data = await response.json();
      
      // Convertir las asignaciones del backend al formato esperado
      const asignaciones: Asignacion[] = Array.isArray(data) ? data.map((asig: any) => ({
        _id: asig._id || `${asig.pedido_id}_${asig.item_id}`,
        pedido_id: asig.pedido_id,
        orden: asig.orden || 1,
        item_id: asig.item_id,
        empleado_id: asig.empleado_id || "sin_asignar",
        empleado_nombre: asig.nombreempleado || "Sin asignar",
        modulo: obtenerModuloPorOrden(asig.orden || 1),
        estado: asig.estado || "en_proceso",
        fecha_asignacion: asig.fecha_inicio || new Date().toISOString(),
        fecha_fin: asig.fecha_fin,
        descripcionitem: asig.descripcionitem || "",
        detalleitem: asig.detalleitem || "",
        cliente_nombre: asig.cliente?.cliente_nombre || "",
        costo_produccion: asig.costoproduccion || 0,
        imagenes: asig.imagenes || []
      })) : [];
      
      console.log('✅ Asignaciones obtenidas del endpoint de fallback:', asignaciones.length);
      return asignaciones;
      
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
      const response = await fetch(`${getApiUrl()}/asignacion/terminar-mejorado/`, {
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
      costoTotal: asignacionesModulo.reduce((sum, a) => sum + (Number(a.costo_produccion) || 0), 0)
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