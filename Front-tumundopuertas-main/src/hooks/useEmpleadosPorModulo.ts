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
      
      // TEMPORAL: El endpoint no existe en el backend, usar fallback
      console.warn(`⚠️ Endpoint /pedidos/empleados-por-modulo/ no existe en el backend - usando fallback`);
      
      // Fallback: Obtener todos los empleados activos
      const response = await fetch(`${getApiUrl()}/empleados/all/`);
      
      if (!response.ok) {
        console.warn(`⚠️ Error ${response.status} al obtener empleados - devolviendo array vacío`);
        return [];
      }
      
      const data = await response.json();
      const empleadosArray = data.empleados || data;
      
      if (Array.isArray(empleadosArray)) {
        const empleadosActivos = empleadosArray.filter((emp: any) => emp.activo !== false);
        console.log(`✅ Fallback: ${empleadosActivos.length} empleados activos obtenidos`);
        
        // Convertir al formato esperado
        return empleadosActivos.map((emp: any) => ({
          _id: emp._id,
          nombreCompleto: emp.nombreCompleto || emp.nombre || 'Sin nombre',
          permisos: emp.permisos || [],
          identificador: emp.identificador || emp._id // Agregar identificador requerido
        }));
      }
      
      return [];
      
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
