import { useState } from 'react';
import { getApiUrl } from '@/lib/api';

export interface Asignacion {
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

export interface TerminarAsignacionData {
  pedido_id: string;
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
      console.log('🔍 Obteniendo datos del endpoint general y filtrando por módulo...');
      
      // Usar endpoint general que sabemos que funciona
      const generalResponse = await fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso`);
      console.log('📊 Respuesta endpoint general:', generalResponse.status, generalResponse.ok);
      
      if (!generalResponse.ok) {
        throw new Error(`HTTP error! status: ${generalResponse.status}`);
      }
      
      const generalData = await generalResponse.json();
      console.log('📋 Datos endpoint general:', generalData);
      
      if (!generalData.asignaciones || !Array.isArray(generalData.asignaciones)) {
        console.log('⚠️ No se encontraron asignaciones en el endpoint general');
        return [];
      }
      
      console.log('✅ Encontrados datos en generalData.asignaciones:', generalData.asignaciones.length);
      
      // Filtrar solo asignaciones que tienen empleados asignados (no "Sin asignar")
      const asignacionesConEmpleados = generalData.asignaciones.filter((item: any) => {
        const tieneEmpleado = item.empleado_id || item.empleado?.identificador || item.empleado?.id;
        const nombreEmpleado = item.empleado_nombre || item.empleado?.nombreCompleto || item.empleado?.nombre;
        return tieneEmpleado && nombreEmpleado && nombreEmpleado !== "Sin asignar";
      });
      
      console.log('👥 Asignaciones con empleados:', asignacionesConEmpleados.length);
      
      // Determinar módulo basado en el estado_subestado o crear lógica de asignación
      const asignacionesConModulo = asignacionesConEmpleados.map((item: any) => {
        // Determinar módulo basado en estado_subestado o lógica de negocio
        let modulo = "herreria"; // default
        
        if (item.estado_subestado) {
          switch (item.estado_subestado) {
            case "herreria":
            case "en_proceso":
              modulo = "herreria";
              break;
            case "masillar":
              modulo = "masillar";
              break;
            case "preparar":
              modulo = "preparar";
              break;
            default:
              modulo = "herreria";
          }
        }
        
        return {
          _id: item._id || `${item.pedido_id}_${item.item_id}`,
          pedido_id: item.pedido_id,
          item_id: item.item_id,
          empleado_id: item.empleado_id || item.empleado?.identificador || item.empleado?.id,
          empleado_nombre: item.empleado_nombre || item.empleado?.nombreCompleto || item.empleado?.nombre || "Sin asignar",
          modulo: modulo,
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
      
      console.log('✅ Asignaciones procesadas con módulos:', asignacionesConModulo.length);
      return asignacionesConModulo;
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