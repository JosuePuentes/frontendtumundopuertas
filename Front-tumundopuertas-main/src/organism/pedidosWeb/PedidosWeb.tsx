import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  Eye, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Package,
  Image as ImageIcon,
  FileText,
  X
} from "lucide-react";

interface PedidoWeb {
  _id: string;
  cliente_id: string;
  cliente_nombre?: string;
  cliente_cedula?: string;
  cliente_direccion?: string;
  cliente_telefono?: string;
  items: Array<{
    itemId: string;
    cantidad: number;
    precio: number;
    item?: {
      nombre?: string;
      codigo?: string;
      descripcion?: string;
    };
  }>;
  metodo_pago?: string;
  numero_referencia?: string;
  comprobante_url?: string;
  total: number;
  estado: string;
  fecha_creacion?: string;
  createdAt?: string;
}

const PedidosWeb: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoWeb[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoWeb | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/pedidos/cliente`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Normalizar datos de pedidos
        const pedidosNormalizados = Array.isArray(data) ? data.map((pedido: any) => ({
          _id: pedido._id || pedido.id,
          cliente_id: pedido.cliente_id || pedido.clienteId,
          cliente_nombre: pedido.cliente_nombre || pedido.clienteNombre || pedido.cliente?.nombre || "Sin nombre",
          cliente_cedula: pedido.cliente_cedula || pedido.clienteCedula || pedido.cliente?.cedula || "Sin cédula",
          cliente_direccion: pedido.cliente_direccion || pedido.clienteDireccion || pedido.cliente?.direccion || "Sin dirección",
          cliente_telefono: pedido.cliente_telefono || pedido.clienteTelefono || pedido.cliente?.telefono || "Sin teléfono",
          items: pedido.items || [],
          metodo_pago: pedido.metodo_pago || pedido.metodoPago || "No especificado",
          numero_referencia: pedido.numero_referencia || pedido.numeroReferencia || "Sin referencia",
          comprobante_url: pedido.comprobante_url || pedido.comprobanteUrl || pedido.comprobante || "",
          total: pedido.total || 0,
          estado: pedido.estado || "pendiente",
          fecha_creacion: pedido.fecha_creacion || pedido.fechaCreacion || pedido.createdAt || new Date().toISOString(),
        })) : [];
        
        setPedidos(pedidosNormalizados);
      } else {
        console.error("Error al cargar pedidos:", res.statusText);
        setPedidos([]);
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const searchLower = search.toLowerCase();
    return (
      (pedido.cliente_nombre || "").toLowerCase().includes(searchLower) ||
      (pedido.cliente_cedula || "").toLowerCase().includes(searchLower) ||
      (pedido.numero_referencia || "").toLowerCase().includes(searchLower) ||
      (pedido._id || "").toLowerCase().includes(searchLower)
    );
  });

  const verDetalle = (pedido: PedidoWeb) => {
    setPedidoSeleccionado(pedido);
    setModalDetalleAbierto(true);
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "Fecha no disponible";
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString("es-VE", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { color: string; label: string }> = {
      pendiente: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Pendiente" },
      procesando: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Procesando" },
      confirmado: { color: "bg-green-500/20 text-green-400 border-green-500/30", label: "Confirmado" },
      cancelado: { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Cancelado" },
    };
    return estados[estado.toLowerCase()] || estados.pendiente;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Pedidos Web</h1>
        <Button
          onClick={cargarPedidos}
          variant="outline"
          className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
        >
          Actualizar
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Buscar por nombre, cédula, referencia o ID de pedido..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400"
        />
      </div>

      {/* Lista de pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {search ? "No se encontraron pedidos con esa búsqueda" : "No hay pedidos web registrados"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pedidosFiltrados.map((pedido) => {
            const estadoInfo = getEstadoBadge(pedido.estado);
            return (
              <Card
                key={pedido._id}
                className="bg-gray-800/50 border-gray-700 hover:border-cyan-400/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white flex items-center gap-2 mb-2">
                        <User className="w-5 h-5" />
                        {pedido.cliente_nombre}
                      </CardTitle>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          Cédula: {pedido.cliente_cedula}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {pedido.cliente_telefono}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {pedido.cliente_direccion}
                        </span>
                      </div>
                    </div>
                    <Badge className={estadoInfo.color + " border"}>{estadoInfo.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{formatearFecha(pedido.fecha_creacion)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm">
                        {pedido.metodo_pago} - Ref: {pedido.numero_referencia}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                      <Package className="w-4 h-4" />
                      <span>${pedido.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                      {pedido.items.length} {pedido.items.length === 1 ? "item" : "items"}
                    </div>
                    <Button
                      onClick={() => verDetalle(pedido)}
                      variant="outline"
                      className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle */}
      <Dialog open={modalDetalleAbierto} onOpenChange={setModalDetalleAbierto}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              <span>Detalle del Pedido</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalDetalleAbierto(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {pedidoSeleccionado && (
            <div className="space-y-6 mt-4">
              {/* Información del Cliente */}
              <Card className="bg-gray-700/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Nombre</p>
                      <p className="text-white font-semibold">{pedidoSeleccionado.cliente_nombre}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Cédula</p>
                      <p className="text-white font-semibold">{pedidoSeleccionado.cliente_cedula}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Teléfono</p>
                      <p className="text-white font-semibold">{pedidoSeleccionado.cliente_telefono}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Dirección</p>
                      <p className="text-white font-semibold">{pedidoSeleccionado.cliente_direccion}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información del Pedido */}
              <Card className="bg-gray-700/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Detalles del Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Fecha</p>
                      <p className="text-white font-semibold">{formatearFecha(pedidoSeleccionado.fecha_creacion)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Estado</p>
                      <Badge className={getEstadoBadge(pedidoSeleccionado.estado).color + " border"}>
                        {getEstadoBadge(pedidoSeleccionado.estado).label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Método de Pago</p>
                      <p className="text-white font-semibold">{pedidoSeleccionado.metodo_pago}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Número de Referencia</p>
                      <p className="text-white font-semibold">{pedidoSeleccionado.numero_referencia}</p>
                    </div>
                  </div>

                  {/* Items del Pedido */}
                  <div className="mt-4">
                    <p className="text-gray-400 text-sm mb-2">Items del Pedido</p>
                    <div className="space-y-2">
                      {pedidoSeleccionado.items.map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center"
                        >
                          <div>
                            <p className="text-white font-semibold">
                              {item.item?.nombre || `Item ${index + 1}`}
                            </p>
                            {item.item?.codigo && (
                              <p className="text-gray-400 text-sm">Código: {item.item.codigo}</p>
                            )}
                            {item.item?.descripcion && (
                              <p className="text-gray-400 text-sm mt-1">{item.item.descripcion}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">
                              Cantidad: {item.cantidad}
                            </p>
                            <p className="text-cyan-400 font-semibold">
                              ${(item.precio * item.cantidad).toFixed(2)}
                            </p>
                            <p className="text-gray-400 text-xs">
                              ${item.precio.toFixed(2)} c/u
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-600 flex justify-between items-center">
                      <span className="text-lg font-semibold text-white">Total:</span>
                      <span className="text-2xl font-bold text-cyan-400">
                        ${pedidoSeleccionado.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comprobante de Pago */}
              {pedidoSeleccionado.comprobante_url && (
                <Card className="bg-gray-700/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Comprobante de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center">
                      <img
                        src={pedidoSeleccionado.comprobante_url}
                        alt="Comprobante de pago"
                        className="max-w-full max-h-96 rounded-lg border border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.png";
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PedidosWeb;

