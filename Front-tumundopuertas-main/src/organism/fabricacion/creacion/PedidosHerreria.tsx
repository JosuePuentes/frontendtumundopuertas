import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePedido } from "@/hooks/usePedido";
import DetalleHerreria from "./DetalleHerreria";
import { useEmpleado } from "@/hooks/useEmpleado";
import AsignarArticulos from "@/organism/asignar/AsignarArticulos";
import IndicadorEstadosItem from "@/components/IndicadorEstadosItem";

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
  
  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroAsignacion, setFiltroAsignacion] = useState<string>("todos");
  const [filtrosAplicados, setFiltrosAplicados] = useState<{estado: string, asignacion: string}>({estado: "todos", asignacion: "todos"});
  
  // Función para construir URL de filtrado dinámico
  const construirUrlFiltro = () => {
    // Cambiar a endpoint que obtenga todos los pedidos para filtrar por estado_item
    let url = "/pedidos/?";
    
    // Agregar parámetro de asignación si es necesario
    if (filtrosAplicados.asignacion === "sin_asignar") {
      url += "sin_asignar=true&";
    }
    
    return url.slice(0, -1); // Remover el último &
  };

  // Función para aplicar filtros con debounce
  const aplicarFiltros = () => {
    setFiltrosAplicados({
      estado: filtroEstado,
      asignacion: filtroAsignacion
    });
  };

  // Función para recargar datos - OPTIMIZADA con filtros dinámicos
  const recargarDatos = async () => {
    console.log('🔄 Recargando datos de PedidosHerreria (FILTROS DINÁMICOS)...');
    console.log('🎯 Filtros aplicados:', { filtroEstado, filtroAsignacion });
    
    setLoading(true);
    try {
      const urlFiltro = construirUrlFiltro();
      console.log('📡 URL de filtro:', urlFiltro);
      
      await fetchPedido(urlFiltro);
      await fetchEmpleado(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/empleados/all/`);
      console.log('✅ Datos recargados exitosamente - FILTROS APLICADOS');
    } catch (error) {
      console.error('❌ Error al recargar datos:', error);
      setError("Error al recargar los pedidos");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    recargarDatos();
  }, []);

  // Recargar datos cuando cambien los filtros aplicados
  useEffect(() => {
    recargarDatos();
  }, [filtrosAplicados]);

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
    <Card className="max-w-4xl mx-auto mt-8 border-gray-200">
      <CardHeader>
        <CardTitle>Gestión de Items por Estado (Con Filtros)</CardTitle>
        
        {/* Controles de Filtro Mejorados */}
        <div className="flex gap-4 mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex-1">
            <Label htmlFor="filtro-estado" className="text-sm font-medium text-gray-700 mb-2 block">
              Estado del Pedido:
            </Label>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full bg-white border-gray-300">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="todos" className="hover:bg-gray-100">Todos los Estados</SelectItem>
                <SelectItem value="pendiente" className="hover:bg-gray-100">Pendientes</SelectItem>
                <SelectItem value="orden1" className="hover:bg-gray-100">Orden 1 (Herrería)</SelectItem>
                <SelectItem value="orden2" className="hover:bg-gray-100">Orden 2 (Masillar/Pintar)</SelectItem>
                <SelectItem value="orden3" className="hover:bg-gray-100">Orden 3 (Manillar)</SelectItem>
                <SelectItem value="orden4" className="hover:bg-gray-100">Orden 4 (Facturar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <Label htmlFor="filtro-asignacion" className="text-sm font-medium text-gray-700 mb-2 block">
              Asignación:
            </Label>
            <Select value={filtroAsignacion} onValueChange={setFiltroAsignacion}>
              <SelectTrigger className="w-full bg-white border-gray-300">
                <SelectValue placeholder="Seleccionar asignación" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="todos" className="hover:bg-gray-100">Todos</SelectItem>
                <SelectItem value="sin_asignar" className="hover:bg-gray-100">Sin Asignar</SelectItem>
                <SelectItem value="asignados" className="hover:bg-gray-100">Asignados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={aplicarFiltros}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
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
            {(dataPedidos as Pedido[])
              .filter((pedido) => {
                // Solo mostrar pedidos que tengan items
                return pedido.items && pedido.items.length > 0;
              })
              .map((pedido) => (
              <li key={pedido._id} className="border rounded-xl bg-white shadow p-4 transition-all duration-300 hover:shadow-lg">
                <DetalleHerreria pedido={pedido} />
                
                {/* Indicadores de estado por item */}
                <div className="mt-4 space-y-3">
                  {pedido.items.map((item: any) => (
                    <IndicadorEstadosItem
                      key={item.id}
                      estadoItem={item.estado_item || 1}
                      itemId={item.id}
                      itemNombre={item.nombre}
                    />
                  ))}
                </div>
                
                <div className="mt-4">
                  <AsignarArticulos
                    estado_general="independiente" // Estado independiente por item
                    numeroOrden="independiente"
                    items={pedido.items} // Mostrar todos los items
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
