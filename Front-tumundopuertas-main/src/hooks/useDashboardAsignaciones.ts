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
  pedido_id: string;
  item_id: string;
  modulo_actual: string;
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
      console.log('🔍 Intentando obtener datos de producción...');
      
      // Intentar diferentes endpoints para obtener datos
      const endpoints = [
        `${getApiUrl()}/pedidos/comisiones/produccion/enproceso`,
        `${getApiUrl()}/pedidos/comisiones/produccion`,
        `${getApiUrl()}/pedidos/produccion/enproceso`,
        `${getApiUrl()}/pedidos/enproceso`
      ];
      
      let datosEncontrados = [];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Probando endpoint: ${endpoint}`);
          const response = await fetch(endpoint);
          console.log(`📊 Respuesta del endpoint ${endpoint}:`, response.status, response.ok);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`📋 Datos recibidos de ${endpoint}:`, data);
            
            // Verificar si los datos están en formato de respuesta con asignaciones
            let datosArray = [];
            if (data.asignaciones && Array.isArray(data.asignaciones)) {
              datosArray = data.asignaciones;
              console.log(`📦 Datos encontrados en data.asignaciones:`, datosArray.length, 'elementos');
            } else if (Array.isArray(data)) {
              datosArray = data;
              console.log(`📦 Datos encontrados como array directo:`, datosArray.length, 'elementos');
            }
            
            if (datosArray.length > 0) {
              datosEncontrados = datosArray;
              console.log(`✅ Datos encontrados en ${endpoint}:`, datosArray.length, 'elementos');
              break;
            }
          }
        } catch (err) {
          console.log(`❌ Error en endpoint ${endpoint}:`, err);
        }
      }
      
      if (datosEncontrados.length === 0) {
        console.log('⚠️ No se encontraron datos en ningún endpoint');
        return [];
      }
      
      // Normalizar los datos encontrados
      const asignacionesNormalizadas = datosEncontrados.map((item: any) => {
        console.log('🔍 Normalizando item:', item);
        
        return {
          _id: item._id || `${item.pedido_id}_${item.item_id}`,
          pedido_id: item.pedido_id,
          item_id: item.item_id,
          empleado_id: item.empleado_id || item.empleado?.identificador || item.empleado?.id,
          empleado_nombre: item.empleado_nombre || item.empleado?.nombreCompleto || item.empleado?.nombre || "Sin asignar",
          modulo: item.modulo || item.estado_subestado || item.subestado || "herreria",
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
      
      console.log('✅ Asignaciones normalizadas:', asignacionesNormalizadas.length);
      return asignacionesNormalizadas;
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
      // Usar el endpoint existente de terminar asignación
      const response = await fetch(`${getApiUrl()}/pedidos/asignacion/terminar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pedido_id: data.pedido_id,
          item_id: data.item_id,
          empleado_id: data.empleado_id,
          estado: "terminado",
          fecha_fin: new Date().toISOString(),
          pin: data.pin
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al terminar asignación");
      }

      const result = await response.json();
      
      // Determinar el siguiente módulo basado en el módulo actual
      const siguienteModulo = obtenerSiguienteModulo(data.modulo_actual || "herreria");
      
      return {
        message: result.message || "Asignación terminada exitosamente",
        success: true,
        asignacion_actualizada: result.asignacion_actualizada,
        siguiente_modulo: siguienteModulo,
        comision_registrada: true
      };
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
