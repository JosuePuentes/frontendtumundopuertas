import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
// Importaciones removidas: usePedido y DetalleHerreria ya no se usan con la nueva estructura
import { useEmpleado } from "@/hooks/useEmpleado";
import AsignarArticulos from "@/organism/asignar/AsignarArticulos";
import IndicadorEstadosItem from "@/components/IndicadorEstadosItem";

// Tipos explícitos - NUEVA ESTRUCTURA: Items individuales
interface ItemIndividual {
  id: string;
  pedido_id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  costo: number;
  cantidad: number;
  activo: boolean;
  costoProduccion: number;
  detalleitem?: string;
  imagenes?: string[];
  estado_item: number; // NUEVO: Estado del item (1, 2, 3, 4)
  empleado_asignado?: string; // NUEVO: Empleado asignado
  fecha_asignacion?: string; // NUEVO: Fecha de asignación
  fecha_terminacion?: string; // NUEVO: Fecha de terminación
  cliente_nombre?: string; // NUEVO: Nombre del cliente
  fecha_creacion?: string; // NUEVO: Fecha de creación del pedido
}

// Interfaces PedidoItem y PedidoSeguimiento removidas - ya no se usan con la nueva estructura de items individuales

const PedidosHerreria: React.FC = () => {
  // NUEVA ESTRUCTURA: Manejar items individuales en lugar de pedidos completos
  const [itemsIndividuales, setItemsIndividuales] = useState<ItemIndividual[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { dataEmpleados, fetchEmpleado } = useEmpleado();
  
  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroAsignacion, setFiltroAsignacion] = useState<string>("todos");
  const [filtrosAplicados, setFiltrosAplicados] = useState<{estado: string, asignacion: string}>({estado: "todos", asignacion: "todos"});
  
  // Estado para barra de progreso por item
  const [progresoItems, setProgresoItems] = useState<Record<string, number>>({});
  
  // Función para obtener progreso de un item
  const obtenerProgresoItem = async (pedidoId: string, itemId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/item-estado/${pedidoId}/${itemId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener progreso del item:', error);
      return { progreso: 0 };
    }
  };
  
  // Función para construir URL de filtrado dinámico - OPTIMIZADA para herrería
  const construirUrlFiltro = () => {
    // NUEVO: Usar el endpoint optimizado específico para herrería
    let url = "/pedidos/herreria/?";
    
    // Agregar parámetro de asignación si es necesario
    if (filtrosAplicados.asignacion === "sin_asignar") {
      url += "sin_asignar=true&";
    }
    
    // Agregar ordenamiento por fecha (más recientes primero)
    url += "ordenar=fecha_desc&";
    
    return url;
  };

  // Función para aplicar filtros con debounce
  const aplicarFiltros = () => {
    setFiltrosAplicados({
      estado: filtroEstado,
      asignacion: filtroAsignacion
    });
  };

  // Función para recargar datos - NUEVA ESTRUCTURA: Items individuales
  const recargarDatos = async () => {
    console.log('🔄 Recargando items individuales de PedidosHerreria usando endpoint optimizado /pedidos/herreria/...');
    console.log('🎯 Filtros aplicados:', { filtroEstado, filtroAsignacion });
    
    setLoading(true);
    try {
      const urlFiltro = construirUrlFiltro();
      console.log('📡 URL de filtro optimizada:', urlFiltro);
      
      // NUEVA ESTRUCTURA: Obtener items individuales directamente
      const response = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}${urlFiltro}`);
      const data = await response.json();
      
      console.log('📋 Respuesta del backend:', data);
      console.log('🔍 Tipo de respuesta:', typeof data);
      console.log('🔍 Es array?', Array.isArray(data));
      console.log('🔍 Tiene propiedad items?', 'items' in data);
      
      // El backend ahora devuelve {items: Array} o Array directo
      const itemsArray = data.items || data;
      console.log('📋 Items extraídos:', itemsArray);
      console.log('📊 Cantidad de items:', Array.isArray(itemsArray) ? itemsArray.length : 'No es array');
      
      // Debug específico para el pedido que estamos buscando
      if (Array.isArray(itemsArray)) {
        const itemsDelPedido = itemsArray.filter((item: any) => item.pedido_id === "68f2bc424dbb7f6039f6ec09");
        console.log('🎯 ITEMS DEL PEDIDO 68f2bc424dbb7f6039f6ec09:', itemsDelPedido);
        console.log('📊 Cantidad encontrada:', itemsDelPedido.length);
        
        if (itemsDelPedido.length === 0) {
          console.log('❌ NO SE ENCONTRARON ITEMS DEL PEDIDO');
          console.log('🔍 Todos los pedido_ids disponibles:', itemsArray.map((item: any) => item.pedido_id));
        }
      }
      
      if (Array.isArray(itemsArray)) {
        setItemsIndividuales(itemsArray);
        console.log('✅ Items individuales cargados:', itemsArray.length);
        
        // Cargar progreso de todos los items
        const cargarProgresoItems = async () => {
          const progresoData: Record<string, number> = {};
          for (const item of itemsArray) {
            const progresoItem = await obtenerProgresoItem(item.pedido_id, item.id);
            progresoData[item.id] = progresoItem.progreso || 0;
          }
          setProgresoItems(progresoData);
        };
        
        cargarProgresoItems();
      } else {
        console.log('⚠️ No hay items - itemsArray no es array:', itemsArray);
        setItemsIndividuales([]);
      }
      
      await fetchEmpleado(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/empleados/all/`);
      console.log('✅ Datos recargados exitosamente usando nueva estructura');
    } catch (error) {
      console.error('❌ Error al recargar datos:', error);
      setError("Error al recargar los items");
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

  // Debug: Log todos los items cuando cambien
  useEffect(() => {
    if (Array.isArray(itemsIndividuales) && itemsIndividuales.length > 0) {
      console.log('📋 Todos los items individuales recibidos:', itemsIndividuales.map((item: ItemIndividual) => ({
        id: item.id,
        pedido_id: item.pedido_id,
        nombre: item.nombre,
        estado_item: item.estado_item,
        empleado_asignado: item.empleado_asignado,
        cliente_nombre: item.cliente_nombre
      })));
      
      // Buscar específicamente el pedido que estamos buscando
      const itemsDelPedido = itemsIndividuales.filter((item: ItemIndividual) => item.pedido_id === "68f2bc424dbb7f6039f6ec09");
      
      if (itemsDelPedido.length > 0) {
        console.log('🎯 ITEMS DEL PEDIDO NUEVO ENCONTRADOS:', itemsDelPedido);
        console.log('📊 Cantidad de items:', itemsDelPedido.length);
        console.log('📊 Estados de los items:', itemsDelPedido.map(i => ({
          id: i.id,
          nombre: i.nombre,
          estado_item: i.estado_item
        })));
      } else {
        console.log('❌ NO SE ENCONTRARON ITEMS DEL PEDIDO NUEVO');
      }
    } else {
      console.log('⚠️ No hay items o itemsIndividuales no es un array:', itemsIndividuales);
    }
  }, [itemsIndividuales]);

  // Sincronización: Escuchar cambios de estado usando evento personalizado
  useEffect(() => {
    const handleCambioEstado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const evento = customEvent.detail;
      console.log(`🔄 PedidosHerreria: Cambio de estado detectado:`, evento);
      
      // Verificar si el cambio es relevante para los items actuales
      const esRelevante = itemsIndividuales.some(item => 
        item.pedido_id === evento.pedidoId && 
        item.id === evento.itemId
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
  }, [itemsIndividuales]);

  // ...

  return (
    <Card className="max-w-4xl mx-auto mt-8 border-gray-200">
      <CardHeader>
        <CardTitle>Gestión de Items Individuales - PedidosHerreria</CardTitle>
        
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
                <SelectItem value="todos" className="hover:bg-gray-100">Todos los Estados Activos</SelectItem>
                <SelectItem value="pendiente" className="hover:bg-gray-100">Pendientes</SelectItem>
                <SelectItem value="orden1" className="hover:bg-gray-100">Orden 1 (Herrería)</SelectItem>
                <SelectItem value="orden2" className="hover:bg-gray-100">Orden 2 (Masillar/Pintar)</SelectItem>
                <SelectItem value="orden3" className="hover:bg-gray-100">Orden 3 (Manillar)</SelectItem>
                <SelectItem value="orden4" className="hover:bg-gray-100">Orden 4 (Facturar)</SelectItem>
                <SelectItem value="terminado" className="hover:bg-gray-100">Terminados</SelectItem>
                <SelectItem value="cancelado" className="hover:bg-gray-100">Cancelados</SelectItem>
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
          
          <div className="flex items-end gap-2">
            <Button 
              onClick={aplicarFiltros}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              Aplicar Filtros
            </Button>
            <Button 
              onClick={async () => {
                console.log('🔍 DEBUG: Consultando endpoint directamente...');
                try {
                  const response = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/herreria/`);
                  const data = await response.json();
                  console.log('🔍 DEBUG - Respuesta directa:', data);
                  console.log('🔍 DEBUG - Status:', response.status);
                  console.log('🔍 DEBUG - Headers:', Object.fromEntries(response.headers.entries()));
                } catch (error) {
                  console.error('🔍 DEBUG - Error:', error);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
            >
              Debug API
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-2"></span>
            <span className="text-blue-600 font-semibold">Cargando items...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 font-semibold py-4">{error}</div>
        ) : !Array.isArray(itemsIndividuales) || itemsIndividuales.length === 0 ? (
          <p className="text-gray-500">No hay items para gestionar.</p>
        ) : (
          <ul className="space-y-6">
            {itemsIndividuales
              .filter((item) => {
                // Solo mostrar items que NO estén completamente terminados (estado_item < 4)
                return item.estado_item < 4;
              })
              .map((item) => {
                const progreso = progresoItems[item.id] || 0;
                return (
                  <li key={item.id} className="border rounded-xl bg-white shadow p-6 transition-all duration-300 hover:shadow-lg">
                    {/* Información del item individual */}
                    <div className="space-y-4">
                      {/* Header del item */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.nombre}</h3>
                          <p className="text-sm text-gray-600">Pedido: {item.pedido_id.slice(-6)}</p>
                          <p className="text-sm text-gray-600">Cliente: {item.cliente_nombre || 'Sin cliente'}</p>
                          <p className="text-sm text-gray-600">Fecha: {item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">Costo: ${item.costoProduccion?.toFixed(2) || '0.00'}</p>
                          <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
                        </div>
                      </div>
                      
                      {/* Detalles del item */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700"><strong>Descripción:</strong> {item.descripcion}</p>
                        <p className="text-sm text-gray-700"><strong>Detalles:</strong> {item.detalleitem || 'Sin detalles adicionales'}</p>
                        <p className="text-sm text-gray-700"><strong>Categoría:</strong> {item.categoria}</p>
                      </div>
                      
                      {/* Estado del item */}
                      <div className="space-y-2">
                        <IndicadorEstadosItem
                          estadoItem={item.estado_item}
                          itemNombre={item.nombre}
                        />
                        
                        {/* Barra de progreso del item */}
                        <div className="progreso-bar bg-gray-200 rounded-full h-4 relative">
                          <div 
                            className="progreso bg-blue-500 h-4 rounded-full transition-all duration-300"
                            style={{width: `${progreso}%`}}
                          ></div>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                            {progreso}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Información de asignación */}
                      {item.empleado_asignado && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-800"><strong>Asignado a:</strong> {item.empleado_asignado}</p>
                          <p className="text-sm text-blue-600">Fecha asignación: {item.fecha_asignacion ? new Date(item.fecha_asignacion).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      )}
                      
                      {/* Componente de asignación */}
                      <div className="mt-4">
                        <AsignarArticulos
                          estado_general="independiente"
                          numeroOrden="independiente"
                          items={[item]} // Pasar solo este item individual
                          empleados={Array.isArray(dataEmpleados) ? dataEmpleados : []}
                          pedidoId={item.pedido_id}
                          tipoEmpleado={[]}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default PedidosHerreria;
