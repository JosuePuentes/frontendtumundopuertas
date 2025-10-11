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
      // Obtener asignaciones de todos los módulos de producción
      const [herreriaRes, masillarRes, prepararRes] = await Promise.all([
        fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=herreria`).catch(() => ({ ok: false })),
        fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=masillar`).catch(() => ({ ok: false })),
        fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=preparar`).catch(() => ({ ok: false }))
      ]);

      const [herreriaData, masillarData, prepararData] = await Promise.all([
        herreriaRes.ok ? (herreriaRes as Response).json() : Promise.resolve([]),
        masillarRes.ok ? (masillarRes as Response).json() : Promise.resolve([]),
        prepararRes.ok ? (prepararRes as Response).json() : Promise.resolve([])
      ]);

      // Validar que los datos sean arrays
      const herreriaArray = Array.isArray(herreriaData) ? herreriaData : [];
      const masillarArray = Array.isArray(masillarData) ? masillarData : [];
      const prepararArray = Array.isArray(prepararData) ? prepararData : [];

      console.log('Datos recibidos:', {
        herreria: herreriaArray.length,
        masillar: masillarArray.length,
        preparar: prepararArray.length,
        herreriaData: herreriaData,
        masillarData: masillarData,
        prepararData: prepararData
      });

      // Combinar todas las asignaciones y normalizar la estructura
      const todasAsignaciones = [
        ...herreriaArray.map((item: any) => ({
          _id: item._id || `${item.pedido_id}_${item.item_id}`,
          pedido_id: item.pedido_id,
          item_id: item.item_id,
          empleado_id: item.empleado_id,
          empleado_nombre: item.empleado_nombre || "Sin asignar",
          modulo: "herreria",
          estado: item.estado || "en_proceso",
          fecha_asignacion: item.fecha_asignacion || new Date().toISOString(),
          fecha_fin: item.fecha_fin,
          descripcionitem: item.descripcionitem,
          detalleitem: item.detalleitem,
          cliente_nombre: item.cliente?.cliente_nombre || "Sin cliente",
          costo_produccion: item.costo_produccion || 0,
          imagenes: item.imagenes || []
        })),
        ...masillarArray.map((item: any) => ({
          _id: item._id || `${item.pedido_id}_${item.item_id}`,
          pedido_id: item.pedido_id,
          item_id: item.item_id,
          empleado_id: item.empleado_id,
          empleado_nombre: item.empleado_nombre || "Sin asignar",
          modulo: "masillar",
          estado: item.estado || "en_proceso",
          fecha_asignacion: item.fecha_asignacion || new Date().toISOString(),
          fecha_fin: item.fecha_fin,
          descripcionitem: item.descripcionitem,
          detalleitem: item.detalleitem,
          cliente_nombre: item.cliente?.cliente_nombre || "Sin cliente",
          costo_produccion: item.costo_produccion || 0,
          imagenes: item.imagenes || []
        })),
        ...prepararArray.map((item: any) => ({
          _id: item._id || `${item.pedido_id}_${item.item_id}`,
          pedido_id: item.pedido_id,
          item_id: item.item_id,
          empleado_id: item.empleado_id,
          empleado_nombre: item.empleado_nombre || "Sin asignar",
          modulo: "preparar",
          estado: item.estado || "en_proceso",
          fecha_asignacion: item.fecha_asignacion || new Date().toISOString(),
          fecha_fin: item.fecha_fin,
          descripcionitem: item.descripcionitem,
          detalleitem: item.detalleitem,
          cliente_nombre: item.cliente?.cliente_nombre || "Sin cliente",
          costo_produccion: item.costo_produccion || 0,
          imagenes: item.imagenes || []
        }))
      ];
      
      return todasAsignaciones;
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
