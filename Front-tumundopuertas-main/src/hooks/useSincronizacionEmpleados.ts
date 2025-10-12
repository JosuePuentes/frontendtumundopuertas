import { useState, useEffect } from 'react';

interface Empleado {
  id?: string;
  identificador: string;
  nombre?: string;
  cargo?: string | null;
  pin?: string;
  activo?: boolean;
}

interface CambioEmpleado {
  identificador: string;
  campo: 'nombre' | 'cargo';
  valorAnterior: string;
  valorNuevo: string;
  timestamp: string;
}

export const useSincronizacionEmpleados = () => {
  const [cambiosPendientes, setCambiosPendientes] = useState<CambioEmpleado[]>([]);
  const [sincronizando, setSincronizando] = useState(false);

  // Función para detectar cambios automáticamente
  const detectarCambioEmpleado = (
    empleadoOriginal: Empleado,
    empleadoModificado: Empleado
  ): CambioEmpleado | null => {
    const cambios: CambioEmpleado[] = [];

    // Detectar cambio en nombre
    if (empleadoOriginal.nombre !== empleadoModificado.nombre) {
      cambios.push({
        identificador: empleadoOriginal.identificador,
        campo: 'nombre',
        valorAnterior: empleadoOriginal.nombre || '',
        valorNuevo: empleadoModificado.nombre || '',
        timestamp: new Date().toISOString()
      });
    }

    // Detectar cambio en cargo
    if (empleadoOriginal.cargo !== empleadoModificado.cargo) {
      cambios.push({
        identificador: empleadoOriginal.identificador,
        campo: 'cargo',
        valorAnterior: empleadoOriginal.cargo || '',
        valorNuevo: empleadoModificado.cargo || '',
        timestamp: new Date().toISOString()
      });
    }

    return cambios.length > 0 ? cambios[0] : null;
  };

  // Función para sincronizar cambios con el backend
  const sincronizarConBackend = async (cambio: CambioEmpleado): Promise<boolean> => {
    try {
      setSincronizando(true);
      
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      
      const response = await fetch(`${apiUrl}/empleados/sincronizar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identificador: cambio.identificador,
          campo: cambio.campo,
          valorNuevo: cambio.valorNuevo,
          timestamp: cambio.timestamp
        })
      });

      if (response.ok) {
        console.log('✅ Cambio sincronizado:', cambio);
        return true;
      } else {
        console.error('❌ Error al sincronizar:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    } finally {
      setSincronizando(false);
    }
  };

  // Función para procesar cambios automáticamente
  const procesarCambioAutomatico = async (cambio: CambioEmpleado) => {
    // Agregar a la cola de cambios pendientes
    setCambiosPendientes(prev => [...prev, cambio]);
    
    // Intentar sincronizar inmediatamente
    const exito = await sincronizarConBackend(cambio);
    
    if (exito) {
      // Remover de la cola si fue exitoso
      setCambiosPendientes(prev => prev.filter(c => c.timestamp !== cambio.timestamp));
    }
  };

  // Función para reintentar cambios fallidos
  const reintentarCambiosFallidos = async () => {
    const cambiosFallidos = [...cambiosPendientes];
    
    for (const cambio of cambiosFallidos) {
      const exito = await sincronizarConBackend(cambio);
      if (exito) {
        setCambiosPendientes(prev => prev.filter(c => c.timestamp !== cambio.timestamp));
      }
    }
  };

  // Auto-reintento cada 30 segundos
  useEffect(() => {
    if (cambiosPendientes.length > 0) {
      const interval = setInterval(reintentarCambiosFallidos, 30000);
      return () => clearInterval(interval);
    }
  }, [cambiosPendientes]);

  return {
    detectarCambioEmpleado,
    procesarCambioAutomatico,
    sincronizarConBackend,
    reintentarCambiosFallidos,
    cambiosPendientes,
    sincronizando
  };
};
