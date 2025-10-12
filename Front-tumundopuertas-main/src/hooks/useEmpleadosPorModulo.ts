import { useState } from 'react';
import { getApiUrl } from '@/lib/api';

export interface EmpleadoFiltrado {
  _id: string;
  identificador: string;
  nombreCompleto: string;
  permisos: string[];
}

export interface EmpleadosPorModuloResponse {
  empleados: EmpleadoFiltrado[];
  modulo_actual: string;
  total_empleados: number;
}

export const useEmpleadosPorModulo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerEmpleadosPorModulo = async (
    pedidoId: string, 
    itemId: string
  ): Promise<EmpleadoFiltrado[]> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Obteniendo empleados para pedido ${pedidoId}, item ${itemId}...`);
      
      const response = await fetch(
        `${getApiUrl()}/pedidos/empleados-por-modulo/${pedidoId}/${itemId}`
      );
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: EmpleadosPorModuloResponse = await response.json();
      
      console.log('👥 Empleados obtenidos:', {
        modulo_actual: data.modulo_actual,
        total_empleados: data.total_empleados,
        empleados: data.empleados
      });
      
      return data.empleados;
      
    } catch (error: any) {
      console.error('❌ Error al obtener empleados por módulo:', error);
      setError(error.message || 'Error al obtener empleados');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    obtenerEmpleadosPorModulo,
    loading,
    error
  };
};
