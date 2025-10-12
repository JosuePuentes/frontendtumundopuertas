import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { usePedido } from "@/hooks/usePedido";
import DetalleHerreria from "./DetalleHerreria";
import { useEmpleado } from "@/hooks/useEmpleado";
import AsignarArticulos from "@/organism/asignar/AsignarArticulos";
import { useReaccionarACambiosEstado } from "@/hooks/useSincronizacionEstados";

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Función para recargar datos
  const recargarDatos = async () => {
    console.log('🔄 Recargando datos de PedidosHerreria...');
    setLoading(true);
    try {
      await fetchPedido("/pedidos/estado/?estado_general=orden1&estado_general=pendiente&/");
      await fetchEmpleado(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/empleados/all/`);
      console.log('✅ Datos recargados exitosamente');
    } catch (error) {
      console.error('❌ Error al recargar datos:', error);
      setError("Error al recargar los pedidos");
    } finally {
      setLoading(false);
    }
  };

  // Función para determinar el tipo de empleado según el estado del pedido
  const obtenerTipoEmpleadoPorEstado = (estadoGeneral: string): string[] => {
    switch (estadoGeneral) {
      case "orden1":
      case "herreria":
        return ["herreria", "ayudante"]; // HERRERIA + AYUDANTES
      case "orden2":
      case "masillar":
        return ["masillar", "pintar", "ayudante"]; // MASILLADOR/PINTOR + AYUDANTES
      case "orden3":
      case "preparar":
        return ["mantenimiento", "ayudante"]; // MANILLAR + AYUDANTES
      case "orden4":
      case "facturar":
        return ["facturacion", "ayudante"]; // FACTURAR + AYUDANTES
      default:
        return ["herreria", "ayudante"]; // Por defecto para herrería
    }
  };

  useEffect(() => {
    recargarDatos();
  }, []);

  // Sincronización: Escuchar cambios de estado para todos los pedidos
  useEffect(() => {
    if (!Array.isArray(dataPedidos) || dataPedidos.length === 0) return;

    const pedidos = dataPedidos as Pedido[];
    
    // Crear listeners para cada pedido y sus items
    pedidos.forEach(pedido => {
      pedido.items.forEach(item => {
        useReaccionarACambiosEstado(pedido._id, item.id, async (evento) => {
          console.log(`🔄 PedidosHerreria: Cambio de estado detectado para pedido ${pedido._id}, item ${item.id}:`, evento);
          
          // Recargar datos cuando hay un cambio de estado
          await recargarDatos();
          
          // Incrementar trigger para forzar re-render
          setRefreshTrigger(prev => prev + 1);
          
          console.log(`✅ PedidosHerreria: Datos actualizados después del cambio de estado`);
        });
      });
    });
  }, [dataPedidos, refreshTrigger]);

  // ...

  return (
    <Card className="max-w-3xl mx-auto mt-8 border-gray-200">
      <CardHeader>
        <CardTitle>Pedidos Herreria</CardTitle>
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
          <p className="text-gray-500">No hay pedidos pendientes.</p>
        ) : (
          <ul className="space-y-8">
            {(dataPedidos as Pedido[]).map((pedido) => (
              <li key={pedido._id} className="border rounded-xl bg-white shadow p-4 transition-all duration-300 hover:shadow-lg">
                <DetalleHerreria pedido={pedido} />
                <div className="mt-4">
                  <AsignarArticulos
                    estado_general={pedido.estado_general || "orden1"}
                    numeroOrden="1"
                    items={pedido.items}
                    empleados={Array.isArray(dataEmpleados) ? dataEmpleados : []}
                    pedidoId={pedido._id}
                    tipoEmpleado={obtenerTipoEmpleadoPorEstado(pedido.estado_general || "orden1")}
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
