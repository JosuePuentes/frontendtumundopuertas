import { useState, useEffect } from 'react';

export const useEstadoItems = (pedidoId: string, items: any[]) => {
  const [estadosItems, setEstadosItems] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const determinarEstadoRealItem = async (itemId: string): Promise<string> => {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const res = await fetch(`${apiUrl}/pedidos/id/${pedidoId}/`);
      if (!res.ok) return "herreria";
      
      const pedido = await res.json();
      
      if (pedido.seguimiento && Array.isArray(pedido.seguimiento)) {
        // Buscar el estado más avanzado del item en el seguimiento
        let estadoMasAvanzado = "herreria";
        
        for (const subestado of pedido.seguimiento) {
          if (subestado.asignaciones_articulos && Array.isArray(subestado.asignaciones_articulos)) {
            const asignacionItem = subestado.asignaciones_articulos.find((a: any) => a.item_id === itemId);
            
            if (asignacionItem) {
              // Determinar el estado basado en el orden del subestado
              switch(subestado.orden) {
                case 1:
                  if (subestado.estado === "terminado") {
                    estadoMasAvanzado = "masillar"; // Si terminó herrería, va a masillar
                  } else {
                    estadoMasAvanzado = "herreria";
                  }
                  break;
                case 2:
                  if (subestado.estado === "terminado") {
                    estadoMasAvanzado = "preparar"; // Si terminó masillar, va a preparar
                  } else {
                    estadoMasAvanzado = "masillar";
                  }
                  break;
                case 3:
                  if (subestado.estado === "terminado") {
                    estadoMasAvanzado = "facturar"; // Si terminó preparar, va a facturar
                  } else {
                    estadoMasAvanzado = "preparar";
                  }
                  break;
                case 4:
                  estadoMasAvanzado = "facturar";
                  break;
              }
            }
          }
        }
        
        console.log(`🎯 Estado real del item ${itemId}: ${estadoMasAvanzado}`);
        return estadoMasAvanzado;
      }
      
      return "herreria";
    } catch (error) {
      console.error("❌ Error al determinar estado real del item:", error);
      return "herreria";
    }
  };

  const cargarEstadosItems = async () => {
    if (!pedidoId || !items.length) return;
    
    setLoading(true);
    const nuevosEstados: Record<string, string> = {};
    
    for (const item of items) {
      const estado = await determinarEstadoRealItem(item.id);
      nuevosEstados[item.id] = estado;
    }
    
    setEstadosItems(nuevosEstados);
    setLoading(false);
  };

  useEffect(() => {
    cargarEstadosItems();
  }, [pedidoId, items]);

  const obtenerEstadoItem = (itemId: string): string => {
    return estadosItems[itemId] || "herreria";
  };

  const actualizarEstadoItem = (itemId: string, nuevoEstado: string) => {
    setEstadosItems(prev => ({
      ...prev,
      [itemId]: nuevoEstado
    }));
  };

  return {
    estadosItems,
    obtenerEstadoItem,
    actualizarEstadoItem,
    cargarEstadosItems,
    loading
  };
};
