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
}

export const useProgresoPedido = (pedidoId: string) => {
  const [progreso, setProgreso] = useState<ProgresoPedido | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcularPorcentaje = (items: ItemProgreso[]): number => {
    if (items.length === 0) return 0;

    const modulos = ['herreria', 'masillar', 'preparar', 'facturar'];
    
    let totalProgreso = 0;
    
    items.forEach(item => {
      const moduloIndex = modulos.indexOf(item.modulo_actual);
      if (moduloIndex !== -1) {
        // Cada módulo representa 25% (100% / 4 módulos)
        totalProgreso += (moduloIndex + 1) * 25;
      } else if (item.estado_actual === 'completado' || item.estado_actual === 'orden6') {
        // Si está completado, cuenta como 100%
        totalProgreso += 100;
      }
    });

    return Math.min(totalProgreso / items.length, 100);
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

      // Mapear items con su estado actual
      const items: ItemProgreso[] = pedido.items.map((item: any) => {
        // Determinar el módulo actual basado en el seguimiento
        let moduloActual = 'herreria'; // por defecto
        let estadoActual = 'pendiente';

        if (pedido.seguimiento && Array.isArray(pedido.seguimiento)) {
          // Buscar el subestado en proceso
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

        return {
          id: item._id,
          nombre: item.nombre,
          estado_actual: estadoActual,
          modulo_actual: moduloActual
        };
      });

      const porcentaje = calcularPorcentaje(items);
      const itemsCompletados = items.filter(item => 
        item.estado_actual === 'completado' || item.modulo_actual === 'facturar'
      ).length;

      return {
        pedidoId,
        porcentaje,
        items,
        totalItems: items.length,
        itemsCompletados
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
