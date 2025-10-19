import { useState } from 'react';
import { getApiUrl } from '@/lib/api';

export interface ItemDisponible {
  pedido_id: string;
  item_id: string;
  item_nombre: string;
  estado_item: number;
  modulo_actual: string;
  cliente_nombre: string;
  costo_produccion: number;
  imagenes: string[];
}

export interface ItemsDisponiblesResponse {
  items_disponibles: ItemDisponible[];
  total: number;
}

export const useItemsDisponibles = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItemsDisponibles = async (): Promise<ItemDisponible[]> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Obteniendo items disponibles para asignación...');
      
      const response = await fetch(`${getApiUrl()}/pedidos/items-disponibles-asignacion/`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: ItemsDisponiblesResponse = await response.json();
      console.log('📋 Items disponibles recibidos:', data);
      
      return data.items_disponibles || [];
      
    } catch (err: any) {
      console.error('❌ Error al obtener items disponibles:', err);
      setError(`Error al obtener items disponibles: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const asignarItemSiguienteModulo = async (
    pedidoId: string,
    itemId: string,
    empleadoId: string,
    moduloDestino: number
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🔄 Asignando item al siguiente módulo...', {
        pedidoId,
        itemId,
        empleadoId,
        moduloDestino
      });
      
      const response = await fetch(`${getApiUrl()}/pedidos/asignar-siguiente-modulo/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pedido_id: pedidoId,
          item_id: itemId,
          empleado_id: empleadoId,
          modulo_destino: moduloDestino
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Item asignado al siguiente módulo:', result);
      
      return {
        success: true,
        message: result.message || 'Item asignado correctamente'
      };
      
    } catch (err: any) {
      console.error('❌ Error al asignar item:', err);
      return {
        success: false,
        message: `Error al asignar item: ${err.message}`
      };
    }
  };

  const obtenerEmpleadosPorModuloItem = async (
    pedidoId: string,
    itemId: string
  ): Promise<{
    empleados: Array<{
      _id: string;
      nombre: string;
      tipo: string;
      activo: boolean;
    }>;
    modulo_actual: string;
    tipos_requeridos: string[];
    total_empleados: number;
  }> => {
    try {
      console.log('🔄 Obteniendo empleados para módulo del item...', {
        pedidoId,
        itemId
      });
      
      // TEMPORAL: El endpoint no existe en el backend, usar fallback
      console.warn(`⚠️ Endpoint /pedidos/empleados-por-modulo/ no existe en el backend - usando fallback`);
      
      // Fallback: Obtener todos los empleados activos
      const response = await fetch(`${getApiUrl()}/empleados/all/`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const empleadosArray = data.empleados || data;
      
      if (Array.isArray(empleadosArray)) {
        const empleadosActivos = empleadosArray.filter((emp: any) => emp.activo !== false);
        
        const result = {
          empleados: empleadosActivos.map((emp: any) => ({
            _id: emp._id,
            nombre: emp.nombreCompleto || emp.nombre || 'Sin nombre',
            tipo: emp.tipo || 'general',
            activo: emp.activo !== false
          })),
          modulo_actual: 'herreria', // Valor por defecto
          tipos_requeridos: ['herreria'],
          total_empleados: empleadosActivos.length
        };
        
        console.log('👥 Empleados obtenidos (fallback):', result);
        return result;
      }
      
      // Devolver estructura vacía si no hay empleados
      return {
        empleados: [],
        modulo_actual: 'herreria',
        tipos_requeridos: ['herreria'],
        total_empleados: 0
      };
      
    } catch (err: any) {
      console.error('❌ Error al obtener empleados:', err);
      throw err;
    }
  };

  return {
    loading,
    error,
    fetchItemsDisponibles,
    asignarItemSiguienteModulo,
    obtenerEmpleadosPorModuloItem
  };
};


