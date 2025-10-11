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
      
      // Obtener datos de los módulos específicos donde ya hay asignaciones
      console.log('🔍 Obteniendo datos de módulos específicos con asignaciones...');
      
      const [herreriaRes, masillarRes, prepararRes] = await Promise.all([
        fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=herreria`).catch(() => ({ ok: false })),
        fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=masillar`).catch(() => ({ ok: false })),
        fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=preparar`).catch(() => ({ ok: false }))
      ]);

      console.log('📊 Respuestas de módulos:', {
        herreria: { 
          status: herreriaRes.ok ? (herreriaRes as Response).status : 'error', 
          ok: herreriaRes.ok,
          url: `${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=herreria`
        },
        masillar: { 
          status: masillarRes.ok ? (masillarRes as Response).status : 'error', 
          ok: masillarRes.ok,
          url: `${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=masillar`
        },
        preparar: { 
          status: prepararRes.ok ? (prepararRes as Response).status : 'error', 
          ok: prepararRes.ok,
          url: `${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=preparar`
        }
      });

      const [herreriaData, masillarData, prepararData] = await Promise.all([
        herreriaRes.ok ? (herreriaRes as Response).json() : Promise.resolve([]),
        masillarRes.ok ? (masillarRes as Response).json() : Promise.resolve([]),
        prepararRes.ok ? (prepararRes as Response).json() : Promise.resolve([])
      ]);

      console.log('📋 Datos recibidos por módulo:', {
        herreria: Array.isArray(herreriaData) ? herreriaData.length : 'No es array',
        masillar: Array.isArray(masillarData) ? masillarData.length : 'No es array',
        preparar: Array.isArray(prepararData) ? prepararData.length : 'No es array'
      });

      // Log detallado de los datos recibidos
      if (Array.isArray(herreriaData) && herreriaData.length > 0) {
        console.log('🔍 Datos de herrería:', herreriaData[0]);
      }
      if (Array.isArray(masillarData) && masillarData.length > 0) {
        console.log('🔍 Datos de masillar:', masillarData[0]);
      }
      if (Array.isArray(prepararData) && prepararData.length > 0) {
        console.log('🔍 Datos de preparar:', prepararData[0]);
      }

      // Combinar todos los datos de los módulos
      const datosEncontrados = [
        ...(Array.isArray(herreriaData) ? herreriaData : []),
        ...(Array.isArray(masillarData) ? masillarData : []),
        ...(Array.isArray(prepararData) ? prepararData : [])
      ];
      
      if (datosEncontrados.length === 0) {
        console.log('⚠️ No se encontraron datos en endpoints específicos, probando endpoint general...');
        
        // Fallback: probar endpoint general
        try {
          const generalResponse = await fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso`);
          console.log('📊 Respuesta endpoint general:', generalResponse.status, generalResponse.ok);
          
          if (generalResponse.ok) {
            const generalData = await generalResponse.json();
            console.log('📋 Datos endpoint general:', generalData);
            
            // Verificar si tiene asignaciones
            if (generalData.asignaciones && Array.isArray(generalData.asignaciones)) {
              console.log('✅ Encontrados datos en generalData.asignaciones:', generalData.asignaciones.length);
              return generalData.asignaciones.map((item: any) => ({
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
              }));
            } else if (Array.isArray(generalData)) {
              console.log('✅ Encontrados datos como array directo:', generalData.length);
              return generalData.map((item: any) => ({
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
              }));
            }
          }
        } catch (err) {
          console.log('❌ Error en endpoint general:', err);
        }
        
        console.log('⚠️ No se encontraron datos en ningún endpoint');
        return [];
      }
      
      // Normalizar los datos encontrados con información del módulo
      const asignacionesNormalizadas: Asignacion[] = [];
      
      // Procesar datos de herreria
      if (Array.isArray(herreriaData)) {
        herreriaData.forEach((item: any) => {
          asignacionesNormalizadas.push({
            _id: item._id || `${item.pedido_id}_${item.item_id}`,
            pedido_id: item.pedido_id,
            item_id: item.item_id,
            empleado_id: item.empleado_id || item.empleado?.identificador || item.empleado?.id,
            empleado_nombre: item.empleado_nombre || item.empleado?.nombreCompleto || item.empleado?.nombre || "Sin asignar",
            modulo: "herreria",
            estado: item.estado || item.estado_asignacion || "en_proceso",
            fecha_asignacion: item.fecha_asignacion || item.fecha || item.created_at || new Date().toISOString(),
            fecha_fin: item.fecha_fin || item.finished_at,
            descripcionitem: item.descripcionitem || item.descripcion || item.item_descripcion || "Sin descripción",
            detalleitem: item.detalleitem || item.detalle || item.item_detalle,
            cliente_nombre: item.cliente_nombre || item.cliente?.cliente_nombre || item.cliente?.nombre || "Sin cliente",
            costo_produccion: item.costo_produccion || item.costo || item.costo_produccion_item || 0,
            imagenes: item.imagenes || item.images || []
          });
        });
      }
      
      // Procesar datos de masillar
      if (Array.isArray(masillarData)) {
        masillarData.forEach((item: any) => {
          asignacionesNormalizadas.push({
            _id: item._id || `${item.pedido_id}_${item.item_id}`,
            pedido_id: item.pedido_id,
            item_id: item.item_id,
            empleado_id: item.empleado_id || item.empleado?.identificador || item.empleado?.id,
            empleado_nombre: item.empleado_nombre || item.empleado?.nombreCompleto || item.empleado?.nombre || "Sin asignar",
            modulo: "masillar",
            estado: item.estado || item.estado_asignacion || "en_proceso",
            fecha_asignacion: item.fecha_asignacion || item.fecha || item.created_at || new Date().toISOString(),
            fecha_fin: item.fecha_fin || item.finished_at,
            descripcionitem: item.descripcionitem || item.descripcion || item.item_descripcion || "Sin descripción",
            detalleitem: item.detalleitem || item.detalle || item.item_detalle,
            cliente_nombre: item.cliente_nombre || item.cliente?.cliente_nombre || item.cliente?.nombre || "Sin cliente",
            costo_produccion: item.costo_produccion || item.costo || item.costo_produccion_item || 0,
            imagenes: item.imagenes || item.images || []
          });
        });
      }
      
      // Procesar datos de preparar
      if (Array.isArray(prepararData)) {
        prepararData.forEach((item: any) => {
          asignacionesNormalizadas.push({
            _id: item._id || `${item.pedido_id}_${item.item_id}`,
            pedido_id: item.pedido_id,
            item_id: item.item_id,
            empleado_id: item.empleado_id || item.empleado?.identificador || item.empleado?.id,
            empleado_nombre: item.empleado_nombre || item.empleado?.nombreCompleto || item.empleado?.nombre || "Sin asignar",
            modulo: "preparar",
            estado: item.estado || item.estado_asignacion || "en_proceso",
            fecha_asignacion: item.fecha_asignacion || item.fecha || item.created_at || new Date().toISOString(),
            fecha_fin: item.fecha_fin || item.finished_at,
            descripcionitem: item.descripcionitem || item.descripcion || item.item_descripcion || "Sin descripción",
            detalleitem: item.detalleitem || item.detalle || item.item_detalle,
            cliente_nombre: item.cliente_nombre || item.cliente?.cliente_nombre || item.cliente?.nombre || "Sin cliente",
            costo_produccion: item.costo_produccion || item.costo || item.costo_produccion_item || 0,
            imagenes: item.imagenes || item.images || []
          });
        });
      }
      
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
