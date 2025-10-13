import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { usePedido } from "@/hooks/usePedido";
import DetalleHerreria from "./DetalleHerreria";
import { useEmpleado } from "@/hooks/useEmpleado";
import AsignarArticulos from "@/organism/asignar/AsignarArticulos";

// Tipos explícitos
interface PedidoItem {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  costo: number;
  cantidad: number;
  activo: boolean;
  costoProduccion: number; // Nuevo campo
  detalleitem?: string;
  imagenes?: string[];
}

interface PedidoSeguimiento {
  orden: number;
  nombre_subestado: string;
  estado: string;
  asignado_a?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  notas?: string;
}

interface Pedido {
  _id: string;
  cliente_id: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  estado_general: string;
  items: PedidoItem[];
  seguimiento: PedidoSeguimiento[];
}

const PedidosHerreria: React.FC = () => {
  const { fetchPedido, dataPedidos } = usePedido();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { dataEmpleados, fetchEmpleado } = useEmpleado();
  
  // Función para recargar datos - AHORA TRAE TODOS LOS PEDIDOS CON ITEMS INDEPENDIENTES
  const recargarDatos = async () => {
    console.log('🔄 Recargando datos de PedidosHerreria (ITEMS INDEPENDIENTES)...');
    setLoading(true);
    try {
      // Traer TODOS los pedidos, no solo los de orden1/pendiente
      await fetchPedido("/pedidos/all/");
      await fetchEmpleado(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/empleados/all/`);
      console.log('✅ Datos recargados exitosamente - TODOS LOS PEDIDOS');
    } catch (error) {
      console.error('❌ Error al recargar datos:', error);
      setError("Error al recargar los pedidos");
    } finally {
      setLoading(false);
    }
  };

  // Función para determinar el tipo de empleado según el estado INDIVIDUAL del item
  const obtenerTipoEmpleadoPorEstadoItem = (estadoItem: string): string[] => {
    console.log(`🎯 Obteniendo tipo empleado para estado de item: ${estadoItem}`);
    
    switch (estadoItem) {
      case "1":
      case "herreria":
        return ["herreria", "ayudante"]; // HERRERIA + AYUDANTES
      case "2":
      case "masillar":
        return ["masillar", "pintar", "ayudante"]; // MASILLADOR/PINTOR + AYUDANTES
      case "3":
      case "preparar":
        return ["mantenimiento", "ayudante"]; // MANILLAR + AYUDANTES
      case "4":
      case "facturar":
        return ["facturacion", "ayudante"]; // FACTURAR + AYUDANTES
      default:
        return ["herreria", "ayudante"]; // Por defecto para herrería
    }
  };

  useEffect(() => {
    recargarDatos();
  }, []);

  // Sincronización: Escuchar cambios de estado usando evento personalizado
  useEffect(() => {
    const handleCambioEstado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const evento = customEvent.detail;
      console.log(`🔄 PedidosHerreria: Cambio de estado detectado:`, evento);
      
      // Verificar si el cambio es relevante para los pedidos actuales
      const pedidos = dataPedidos as Pedido[];
      const esRelevante = pedidos.some(pedido => 
        pedido._id === evento.pedidoId && 
        pedido.items.some(item => item.id === evento.itemId)
      );
      
      if (esRelevante) {
        console.log(`🎯 Cambio relevante detectado, recargando datos...`);
        
        // Recargar datos cuando hay un cambio de estado relevante
        await recargarDatos();
        
        console.log(`✅ PedidosHerreria: Datos actualizados después del cambio de estado`);
      }
    };

    // Suscribirse al evento personalizado
    window.addEventListener('cambioEstadoItem', handleCambioEstado);

    // Cleanup: remover el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('cambioEstadoItem', handleCambioEstado);
    };
  }, [dataPedidos]);

  // ...

  return (
    <Card className="max-w-3xl mx-auto mt-8 border-gray-200">
      <CardHeader>
        <CardTitle>Gestión de Items por Estado (Independientes)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-2"></span>
            <span className="text-blue-600 font-semibold">Cargando pedidos...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 font-semibold py-4">{error}</div>
        ) : !Array.isArray(dataPedidos) || dataPedidos.length === 0 ? (
          <p className="text-gray-500">No hay items para gestionar.</p>
        ) : (
          <ul className="space-y-8">
            {(dataPedidos as Pedido[]).map((pedido) => (
              <li key={pedido._id} className="border rounded-xl bg-white shadow p-4 transition-all duration-300 hover:shadow-lg">
                <DetalleHerreria pedido={pedido} />
                <div className="mt-4">
                  <AsignarArticulos
                    estado_general="independiente" // Estado independiente por item
                    numeroOrden="independiente"
                    items={pedido.items}
                    empleados={Array.isArray(dataEmpleados) ? dataEmpleados : []}
                    pedidoId={pedido._id}
                    tipoEmpleado={[]} // Se determinará individualmente por item
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default PedidosHerreria;
