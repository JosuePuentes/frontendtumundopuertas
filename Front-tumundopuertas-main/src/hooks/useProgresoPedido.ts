import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';

interface ItemProgreso {
  id: string;
  nombre: string;
  estado_actual: string;
  modulo_actual: string;
}

interface ProgresoPedido {
  pedidoId: string;
  porcentaje: number;
  items: ItemProgreso[];
  totalItems: number;
  itemsCompletados: number;
  contadorProgreso: string; // "0/4", "1/4", "2/4", etc.
}

export const useProgresoPedido = (pedidoId: string) => {
  const [progreso, setProgreso] = useState<ProgresoPedido | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcularPorcentaje = (items: ItemProgreso[]): number => {
    if (items.length === 0) return 0;

    // Pesos específicos para cada módulo (Masillar/Pintar tiene más peso por ser más largo)
    const pesosModulos = {
      'herreria': 20,      // 20%
      'masillar': 35,      // 35% (más largo)
      'preparar': 25,      // 25%
      'facturar': 20       // 20%
    };
    
    let totalProgreso = 0;
    
    items.forEach(item => {
      // Si está pendiente, no suma nada (0%)
      if (item.estado_actual === 'pendiente') {
        totalProgreso += 0;
        return;
      }

      // Si está completado, suma 100%
      if (item.estado_actual === 'completado' || item.estado_actual === 'orden6') {
        totalProgreso += 100;
        return;
      }

      // Calcular progreso basado en el módulo actual
      const peso = pesosModulos[item.modulo_actual as keyof typeof pesosModulos] || 0;
      
      // Sumar el peso acumulado de módulos anteriores + parte del módulo actual
      let progresoItem = 0;
      
      switch (item.modulo_actual) {
        case 'herreria':
          progresoItem = peso; // 20%
          break;
        case 'masillar':
          progresoItem = pesosModulos.herreria + peso; // 20% + 35% = 55%
          break;
        case 'preparar':
          progresoItem = pesosModulos.herreria + pesosModulos.masillar + peso; // 20% + 35% + 25% = 80%
          break;
        case 'facturar':
          progresoItem = pesosModulos.herreria + pesosModulos.masillar + pesosModulos.preparar + peso; // 20% + 35% + 25% + 20% = 100%
          break;
      }
      
      totalProgreso += progresoItem;
    });

    return Math.min(totalProgreso / items.length, 100);
  };

  const calcularContadorProgreso = (items: ItemProgreso[]): string => {
    const modulos = ['herreria', 'masillar', 'preparar', 'facturar'];
    const totalModulos = modulos.length;
    
    let modulosCompletados = 0;
    
    items.forEach(item => {
      if (item.estado_actual === 'completado' || item.estado_actual === 'orden6') {
        modulosCompletados = totalModulos; // Si está completado, cuenta todos los módulos
      } else if (item.estado_actual !== 'pendiente') {
        const moduloIndex = modulos.indexOf(item.modulo_actual);
        if (moduloIndex !== -1) {
          modulosCompletados = Math.max(modulosCompletados, moduloIndex + 1);
        }
      }
    });
    
    return `${modulosCompletados}/${totalModulos}`;
  };

  const obtenerProgresoPedido = async (): Promise<ProgresoPedido | null> => {
    try {
      setLoading(true);
      setError(null);

      // Obtener información detallada del pedido
      const response = await fetch(`${getApiUrl()}/pedidos/id/${pedidoId}/`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const pedido = await response.json();
      
      if (!pedido || !pedido.items) {
        return null;
      }

      // Mapear items con su estado actual - MEJORADO para estados independientes
      const items: ItemProgreso[] = pedido.items.map((item: any) => {
        // Determinar el módulo actual basado en el seguimiento Y en el estado del item
        let moduloActual = 'herreria'; // por defecto
        let estadoActual = 'pendiente';

        // PRIMERO: Intentar obtener el estado del item directamente
        if (item.estado_item) {
          // Si el item tiene estado_item, usarlo directamente
          switch (item.estado_item) {
            case 1:
            case 'orden1':
            case 'herreria':
              moduloActual = 'herreria';
              estadoActual = 'herreria';
              break;
            case 2:
            case 'orden2':
            case 'masillar':
              moduloActual = 'masillar';
              estadoActual = 'masillar';
              break;
            case 3:
            case 'orden3':
            case 'preparar':
              moduloActual = 'preparar';
              estadoActual = 'preparar';
              break;
            case 4:
            case 'orden4':
            case 'facturar':
              moduloActual = 'facturar';
              estadoActual = 'facturar';
              break;
            case 5:
            case 'orden5':
            case 'completado':
              moduloActual = 'facturar';
              estadoActual = 'completado';
              break;
          }
        } else if (pedido.seguimiento && Array.isArray(pedido.seguimiento)) {
          // FALLBACK: Usar el seguimiento del pedido (método anterior)
          const subestadoEnProceso = pedido.seguimiento.find((s: any) => 
            s.estado === 'en_proceso' && s.asignaciones_articulos && 
            s.asignaciones_articulos.some((a: any) => a.item_id === item._id)
          );

          if (subestadoEnProceso) {
            switch (subestadoEnProceso.orden) {
              case 1:
                moduloActual = 'herreria';
                estadoActual = 'herreria';
                break;
              case 2:
                moduloActual = 'masillar';
                estadoActual = 'masillar';
                break;
              case 3:
                moduloActual = 'preparar';
                estadoActual = 'preparar';
                break;
              case 4:
                moduloActual = 'facturar';
                estadoActual = 'facturar';
                break;
            }
          }

          // Verificar si está completado
          const subestadoCompletado = pedido.seguimiento.find((s: any) => 
            s.estado === 'terminado' && s.asignaciones_articulos && 
            s.asignaciones_articulos.some((a: any) => a.item_id === item._id)
          );

          if (subestadoCompletado && subestadoCompletado.orden === 4) {
            estadoActual = 'completado';
            moduloActual = 'facturar';
          }
        }

        console.log(`🔍 Item ${item._id}: estado_item=${item.estado_item}, moduloActual=${moduloActual}, estadoActual=${estadoActual}`);

        return {
          id: item._id,
          nombre: item.nombre,
          estado_actual: estadoActual,
          modulo_actual: moduloActual
        };
      });

      const porcentaje = calcularPorcentaje(items);
      const contadorProgreso = calcularContadorProgreso(items);
      const itemsCompletados = items.filter(item => 
        item.estado_actual === 'completado' || item.modulo_actual === 'facturar'
      ).length;

      return {
        pedidoId,
        porcentaje,
        items,
        totalItems: items.length,
        itemsCompletados,
        contadorProgreso
      };

    } catch (err: any) {
      console.error('Error al obtener progreso del pedido:', err);
      setError(err.message || 'Error al obtener progreso del pedido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pedidoId) {
      obtenerProgresoPedido().then(setProgreso);
    }
  }, [pedidoId]);

  // Escuchar cambios de estado de items para actualizar el progreso
  useEffect(() => {
    const handleCambioEstado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const evento = customEvent.detail;
      
      // Solo actualizar si el cambio es relevante para este pedido
      if (evento.pedidoId === pedidoId) {
        console.log(`🔄 useProgresoPedido: Cambio de estado detectado para pedido ${pedidoId}`, evento);
        await actualizarProgreso();
      }
    };

    window.addEventListener('cambioEstadoItem', handleCambioEstado);
    return () => {
      window.removeEventListener('cambioEstadoItem', handleCambioEstado);
    };
  }, [pedidoId]);

  const actualizarProgreso = async () => {
    const nuevoProgreso = await obtenerProgresoPedido();
    setProgreso(nuevoProgreso);
  };

  return {
    progreso,
    loading,
    error,
    actualizarProgreso
  };
};
