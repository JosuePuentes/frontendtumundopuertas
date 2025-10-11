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
      console.log('🔍 Obteniendo datos de módulos específicos que sabemos que funcionan...');
      
      // Usar los endpoints específicos que sabemos que funcionan según los logs del backend
      const [herreriaRes, masillarRes, prepararRes] = await Promise.all([
        fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=herreria`),
        fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=masillar`),
        fetch(`${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?modulo=preparar`)
      ]);

      console.log('📊 Respuestas de módulos:', {
        herreria: { status: herreriaRes.status, ok: herreriaRes.ok },
        masillar: { status: masillarRes.status, ok: masillarRes.ok },
        preparar: { status: prepararRes.status, ok: prepararRes.ok }
      });

      const [herreriaData, masillarData, prepararData] = await Promise.all([
        herreriaRes.ok ? herreriaRes.json() : null,
        masillarRes.ok ? masillarRes.json() : null,
        prepararRes.ok ? prepararRes.json() : null
      ]);

      console.log('📋 Datos recibidos por módulo:', {
        herreria: herreriaData ? (herreriaData.asignaciones ? herreriaData.asignaciones.length : 'No tiene asignaciones') : 'Error',
        masillar: masillarData ? (masillarData.asignaciones ? masillarData.asignaciones.length : 'No tiene asignaciones') : 'Error',
        preparar: prepararData ? (prepararData.asignaciones ? prepararData.asignaciones.length : 'No tiene asignaciones') : 'Error'
      });

      // Combinar todas las asignaciones de los módulos
      const todasAsignaciones: any[] = [];
      
      if (herreriaData && herreriaData.asignaciones) {
        herreriaData.asignaciones.forEach((item: any) => {
          todasAsignaciones.push({
            ...item,
            modulo: "herreria"
          });
        });
      }
      
      if (masillarData && masillarData.asignaciones) {
        masillarData.asignaciones.forEach((item: any) => {
          todasAsignaciones.push({
            ...item,
            modulo: "masillar"
          });
        });
      }
      
      if (prepararData && prepararData.asignaciones) {
        prepararData.asignaciones.forEach((item: any) => {
          todasAsignaciones.push({
            ...item,
            modulo: "preparar"
          });
        });
      }

      console.log('✅ Total de asignaciones combinadas:', todasAsignaciones.length);
      
      // Mostrar muestra de datos para debugging
      if (todasAsignaciones.length > 0) {
        console.log('🔍 Muestra de datos sin procesar:', {
          primerItem: todasAsignaciones[0],
          segundoItem: todasAsignaciones[1] || 'No hay segundo item'
        });
        
        // Mostrar estructura completa del primer item
        console.log('🔍 Estructura completa del primer item:', JSON.stringify(todasAsignaciones[0], null, 2));
        
        // Buscar items que tengan información de empleado
        const itemsConEmpleado = todasAsignaciones.filter(item => 
          item.empleadoId || 
          item.nombreempleado ||
          item.empleado_id || 
          item.empleado_nombre || 
          item.empleado || 
          item.empleado?.id || 
          item.empleado?.identificador ||
          item.empleado?.nombre
        );
        
        console.log('🔍 Items que podrían tener empleado:', itemsConEmpleado.length);
        if (itemsConEmpleado.length > 0) {
          console.log('🔍 Primer item con posible empleado:', JSON.stringify(itemsConEmpleado[0], null, 2));
        } else {
          // Si no hay items con empleado, mostrar las propiedades del primer item
          console.log('🔍 Propiedades disponibles en el primer item:', Object.keys(todasAsignaciones[0]));
          console.log('🔍 Primer item completo:', todasAsignaciones[0]);
          
          // Buscar propiedades que podrían contener información del empleado
          const primerItem = todasAsignaciones[0];
          const propiedadesConEmpleado = Object.keys(primerItem).filter(key => 
            key.toLowerCase().includes('empleado') || 
            key.toLowerCase().includes('asignado') || 
            key.toLowerCase().includes('responsable') || 
            key.toLowerCase().includes('trabajador') ||
            key.toLowerCase().includes('user') ||
            key.toLowerCase().includes('worker')
          );
          
          console.log('🔍 Propiedades que podrían contener empleado:', propiedadesConEmpleado);
          if (propiedadesConEmpleado.length > 0) {
            propiedadesConEmpleado.forEach(prop => {
              console.log(`🔍 ${prop}:`, primerItem[prop]);
            });
          }
        }
      }
      
      // Normalizar las asignaciones
      const asignacionesNormalizadas = todasAsignaciones.map((item: any) => {
        // Extraer información del empleado de diferentes formas posibles
        let empleado_id = "Sin asignar";
        let empleado_nombre = "Sin asignar";
        
        // Intentar diferentes formas de obtener el empleado
        if (item.empleadoId) {
          empleado_id = item.empleadoId;
        } else if (item.empleado_id) {
          empleado_id = item.empleado_id;
        } else if (item.empleado?.identificador) {
          empleado_id = item.empleado.identificador;
        } else if (item.empleado?.id) {
          empleado_id = item.empleado.id;
        } else if (item.empleado?.empleado_id) {
          empleado_id = item.empleado.empleado_id;
        }
        
        if (item.nombreempleado) {
          empleado_nombre = item.nombreempleado;
        } else if (item.empleado_nombre) {
          empleado_nombre = item.empleado_nombre;
        } else if (item.empleado?.nombreCompleto) {
          empleado_nombre = item.empleado.nombreCompleto;
        } else if (item.empleado?.nombre) {
          empleado_nombre = item.empleado.nombre;
        } else if (item.empleado?.nombre_completo) {
          empleado_nombre = item.empleado.nombre_completo;
        } else if (item.empleado?.primer_nombre && item.empleado?.apellido) {
          empleado_nombre = `${item.empleado.primer_nombre} ${item.empleado.apellido}`;
        }
        
        const asignacionNormalizada = {
          _id: item._id || `${item.pedido_id}_${item.item_id}`,
          pedido_id: item.pedido_id,
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
        
        // Log para debugging de empleados
        if (empleado_nombre !== "Sin asignar") {
          console.log(`👤 Empleado encontrado: ${empleado_nombre} (ID: ${empleado_id})`);
        } else {
          // Log detallado cuando NO se encuentra empleado (solo los primeros 3 para evitar spam)
          const index = todasAsignaciones.indexOf(item);
          if (index < 3) {
            console.log(`❌ Sin empleado - Item ${index + 1}:`, {
              empleadoId: item.empleadoId,
              nombreempleado: item.nombreempleado,
              empleado_id: item.empleado_id,
              empleado_nombre: item.empleado_nombre
            });
          }
        }
        
        return asignacionNormalizada;
      });
      
      // Contar empleados encontrados
      const empleadosConAsignacion = asignacionesNormalizadas.filter(a => a.empleado_nombre !== "Sin asignar");
      console.log('✅ Asignaciones normalizadas:', asignacionesNormalizadas.length);
      console.log('👥 Empleados con asignaciones:', empleadosConAsignacion.length);
      console.log('📋 Lista de empleados:', empleadosConAsignacion.map(a => a.empleado_nombre).filter((nombre, index, arr) => arr.indexOf(nombre) === index));
      
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