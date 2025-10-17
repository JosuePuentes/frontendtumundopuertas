import { useState, useEffect, useCallback } from 'react';

// Evento personalizado para notificar cambios de estado
const EVENTO_CAMBIO_ESTADO = 'cambioEstadoItem';

interface CambioEstadoEvent {
  pedidoId: string;
  itemId: string;
  nuevoEstado: string;
  moduloAnterior: string;
  moduloSiguiente: string;
}

class SincronizadorEstados {
  private static instance: SincronizadorEstados;
  private listeners: Set<(evento: CambioEstadoEvent) => void> = new Set();

  static getInstance(): SincronizadorEstados {
    if (!SincronizadorEstados.instance) {
      SincronizadorEstados.instance = new SincronizadorEstados();
    }
    return SincronizadorEstados.instance;
  }

  // Notificar cambio de estado a todos los componentes
  notificarCambioEstado(evento: CambioEstadoEvent) {
    console.log('🔄 Notificando cambio de estado:', evento);
    
    // Notificar a todos los listeners
    this.listeners.forEach(listener => {
      try {
        listener(evento);
      } catch (error) {
        console.error('❌ Error en listener de cambio de estado:', error);
      }
    });

    // También disparar evento personalizado para compatibilidad
    const customEvent = new CustomEvent(EVENTO_CAMBIO_ESTADO, {
      detail: evento
    });
    window.dispatchEvent(customEvent);
  }

  // Suscribirse a cambios de estado
  suscribirse(listener: (evento: CambioEstadoEvent) => void) {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Obtener el siguiente módulo basado en el módulo actual
  obtenerSiguienteModulo(moduloActual: string): string {
    switch (moduloActual) {
      case 'herreria':
        return 'masillar';
      case 'masillar':
        return 'preparar';
      case 'preparar':
        return 'facturar';
      case 'facturar':
        return 'completado';
      default:
        return 'herreria';
    }
  }
}

export const useSincronizacionEstados = () => {
  const [cambiosRecientes, setCambiosRecientes] = useState<CambioEstadoEvent[]>([]);

  // Función para notificar un cambio de estado
  const notificarCambioEstado = useCallback((evento: CambioEstadoEvent) => {
    const sincronizador = SincronizadorEstados.getInstance();
    sincronizador.notificarCambioEstado(evento);
    
    // Agregar a cambios recientes
    setCambiosRecientes(prev => [evento, ...prev.slice(0, 9)]); // Mantener solo los últimos 10
  }, []);

  // Función para suscribirse a cambios de estado
  const suscribirseACambios = useCallback((callback: (evento: CambioEstadoEvent) => void) => {
    const sincronizador = SincronizadorEstados.getInstance();
    return sincronizador.suscribirse(callback);
  }, []);

  // Función para obtener el siguiente módulo
  const obtenerSiguienteModulo = useCallback((moduloActual: string): string => {
    const sincronizador = SincronizadorEstados.getInstance();
    return sincronizador.obtenerSiguienteModulo(moduloActual);
  }, []);

  return {
    notificarCambioEstado,
    suscribirseACambios,
    obtenerSiguienteModulo,
    cambiosRecientes
  };
};

// Hook para componentes que necesitan reaccionar a cambios de estado
export const useReaccionarACambiosEstado = (
  pedidoId: string,
  itemId: string,
  callback: (evento: CambioEstadoEvent) => void
) => {
  const { suscribirseACambios } = useSincronizacionEstados();

  useEffect(() => {
    const unsubscribe = suscribirseACambios((evento) => {
      // Solo reaccionar si el cambio es para este pedido e item específico
      if (evento.pedidoId === pedidoId && evento.itemId === itemId) {
        console.log(`🎯 Reaccionando a cambio de estado para item ${itemId}:`, evento);
        callback(evento);
      }
    });

    return unsubscribe;
  }, [pedidoId, itemId, callback, suscribirseACambios]);
};

export default SincronizadorEstados;




