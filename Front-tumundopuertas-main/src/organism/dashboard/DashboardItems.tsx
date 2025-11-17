import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, Package, User, MapPin } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface ItemInfo {
  pedido_id: string;
  pedido_codigo: string;
  cliente_nombre: string;
  item_id: string;
  item_nombre: string;
  item_descripcion: string;
  cantidad: number;
  estado_item: number;
  estado_nombre: string;
  empleado_id?: string;
  empleado_nombre?: string;
  modulo_actual?: string;
  fecha_asignacion?: string;
}

const DashboardItems: React.FC = () => {
  const [items, setItems] = useState<ItemInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("");

  // Mapeo de estados
  const estadoMap: Record<number, { nombre: string; color: string; modulo: string }> = {
    0: { nombre: "Pendiente", color: "bg-gray-500", modulo: "Sin asignar" },
    1: { nombre: "Herrería", color: "bg-blue-600", modulo: "Herrería" },
    2: { nombre: "Masillar/Pintar", color: "bg-purple-600", modulo: "Masillar" },
    3: { nombre: "Preparar", color: "bg-yellow-600", modulo: "Preparar" },
    4: { nombre: "Facturación", color: "bg-green-600", modulo: "Facturación" }
  };

  const cargarItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getApiUrl()}/pedidos/all/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error("Error al obtener pedidos");
      }
      
      const pedidos = await response.json();
      const itemsList: ItemInfo[] = [];
      
      // Procesar todos los pedidos y extraer items
      pedidos.forEach((pedido: any) => {
        const pedidoId = pedido._id || '';
        const pedidoCodigo = pedidoId.slice(-6);
        const clienteNombre = pedido.cliente_nombre || pedido.cliente_id || 'Sin cliente';
        
        if (pedido.items && Array.isArray(pedido.items)) {
          pedido.items.forEach((item: any) => {
            const estadoItem = item.estado_item ?? 0;
            const estadoInfo = estadoMap[estadoItem] || estadoMap[0];
            
            itemsList.push({
              pedido_id: pedidoId,
              pedido_codigo: pedidoCodigo,
              cliente_nombre: clienteNombre,
              item_id: item.id || item._id || '',
              item_nombre: item.nombre || 'Sin nombre',
              item_descripcion: item.descripcion || item.detalleitem || '',
              cantidad: item.cantidad || 1,
              estado_item: estadoItem,
              estado_nombre: estadoInfo.nombre,
              empleado_id: item.empleado_asignado,
              empleado_nombre: item.nombre_empleado || item.empleado_nombre,
              modulo_actual: item.modulo_actual || estadoInfo.modulo,
              fecha_asignacion: item.fecha_asignacion
            });
          });
        }
      });
      
      setItems(itemsList);
    } catch (err: any) {
      setError(err.message || "Error al cargar items");
      console.error("Error cargando items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarItems();
  }, []);

  // Filtrar items
  const itemsFiltrados = items.filter(item => {
    const matchSearch = 
      item.item_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pedido_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.empleado_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    
    const matchEstado = filterEstado === "" || item.estado_item.toString() === filterEstado;
    
    return matchSearch && matchEstado;
  });

  // Agrupar por estado para estadísticas
  const estadisticas = items.reduce((acc, item) => {
    const estado = item.estado_nombre;
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-full max-w-[2000px] mx-auto mt-4 md:mt-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard de Items</h1>
        <p className="text-gray-600">Estado de todos los items en producción</p>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por item, cliente, pedido o empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="border rounded px-4 py-2 bg-white"
              >
                <option value="">Todos los estados</option>
                {Object.entries(estadoMap).map(([key, value]) => (
                  <option key={key} value={key}>{value.nombre}</option>
                ))}
              </select>
              
              <Button
                onClick={cargarItems}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(estadoMap).map(([key, value]) => {
          const cantidad = estadisticas[value.nombre] || 0;
          return (
            <Card key={key} className="text-center">
              <CardContent className="pt-6">
                <div className={`${value.color} text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2`}>
                  <Package className="w-6 h-6" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{cantidad}</p>
                <p className="text-sm text-gray-600">{value.nombre}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lista de items */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex justify-center items-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-3" />
              <span className="text-blue-600 font-semibold">Cargando items...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-red-600 font-semibold">{error}</div>
          </CardContent>
        </Card>
      ) : itemsFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No se encontraron items</p>
              <p className="text-sm mt-2">
                {searchTerm || filterEstado ? 'Intenta ajustar los filtros' : 'No hay items para mostrar'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Items encontrados: {itemsFiltrados.length}</span>
              <span className="text-sm font-normal text-gray-600">
                Total: {items.length} items
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Item</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Pedido</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Cantidad</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Módulo</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Empleado Asignado</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Fecha Asignación</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsFiltrados.map((item, index) => {
                    const estadoInfo = estadoMap[item.estado_item] || estadoMap[0];
                    return (
                      <tr 
                        key={`${item.pedido_id}-${item.item_id}-${index}`}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3">
                          <div className="font-semibold text-gray-800">{item.item_nombre}</div>
                          {item.item_descripcion && (
                            <div className="text-xs text-gray-500 mt-1">{item.item_descripcion}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="font-mono">
                            #{item.pedido_codigo}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-700">{item.cliente_nombre}</td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary">{item.cantidad}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={`${estadoInfo.color} text-white`}>
                            {item.estado_nombre}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{item.modulo_actual}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {item.empleado_nombre ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-800">
                                {item.empleado_nombre}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Sin asignar</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {item.fecha_asignacion 
                            ? new Date(item.fecha_asignacion).toLocaleDateString('es-VE')
                            : '-'
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardItems;









