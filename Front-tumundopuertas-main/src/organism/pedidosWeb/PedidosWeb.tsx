import React, { useState, useEffect, useRef } from "react";
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
  X,
  Receipt,
  DollarSign,
  CheckCircle2,
  Bell
} from "lucide-react";

interface Abono {
  fecha?: string;
  cantidad: number;
  metodo_pago?: string;
  numero_referencia?: string;
  comprobante_url?: string;
  estado?: string;
}

interface Factura {
  _id: string;
  numero_factura?: string;
  numeroFactura?: string;
  monto_total?: number;
  montoTotal?: number;
  monto_abonado?: number;
  montoAbonado?: number;
  saldo_pendiente?: number;
  saldoPendiente?: number;
  historial_abonos?: Abono[];
  historialAbonos?: Abono[];
  estado?: string;
}

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
  factura?: Factura | null;
}

const PedidosWeb: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoWeb[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoWeb | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"pedido" | "abono">("pedido");
  
  // Referencias para detectar cambios
  const pedidosAnterioresRef = useRef<Set<string>>(new Set());
  const abonosAnterioresRef = useRef<Map<string, number>>(new Map());
  
  const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');

  useEffect(() => {
    cargarPedidos();
    
    // Polling cada 10 segundos para detectar nuevos pedidos y abonos
    const intervalId = setInterval(() => {
      cargarPedidos(true); // true = modo silencioso (no mostrar loading)
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const cargarPedidos = async (silencioso = false) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }
      const token = localStorage.getItem("access_token");
      
      // Cargar pedidos
      const resPedidos = await fetch(`${apiUrl}/pedidos/cliente`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (resPedidos.ok) {
        const dataPedidos = await resPedidos.json();
        
        // Para cada pedido, cargar su factura asociada
        const pedidosConFacturas = await Promise.all(
          (Array.isArray(dataPedidos) ? dataPedidos : []).map(async (pedido: any) => {
            try {
              // Buscar factura por pedido_id
              const resFactura = await fetch(`${apiUrl}/facturas/pedido/${pedido._id || pedido.id}`, {
                headers: {
                  "Authorization": `Bearer ${token}`,
                },
              });
              
              let factura = null;
              if (resFactura.ok) {
                const dataFactura = await resFactura.json();
                factura = Array.isArray(dataFactura) ? dataFactura[0] : dataFactura;
              }
              
              return {
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
                factura: factura ? {
                  _id: factura._id || factura.id,
                  numero_factura: factura.numero_factura || factura.numeroFactura || "Sin número",
                  monto_total: factura.monto_total || factura.montoTotal || 0,
                  monto_abonado: factura.monto_abonado || factura.montoAbonado || 0,
                  saldo_pendiente: factura.saldo_pendiente || factura.saldoPendiente || (factura.monto_total || factura.montoTotal || 0) - (factura.monto_abonado || factura.montoAbonado || 0),
                  historial_abonos: factura.historial_abonos || factura.historialAbonos || [],
                  estado: factura.estado || "pendiente",
                } : undefined,
              };
            } catch (error) {
              console.error("Error al cargar factura para pedido:", error);
              return {
                _id: pedido._id || pedido.id,
                cliente_id: pedido.cliente_id || pedido.clienteId,
                cliente_nombre: pedido.cliente_nombre || pedido.clienteNombre || "Sin nombre",
                cliente_cedula: pedido.cliente_cedula || pedido.clienteCedula || "Sin cédula",
                cliente_direccion: pedido.cliente_direccion || pedido.clienteDireccion || "Sin dirección",
                cliente_telefono: pedido.cliente_telefono || pedido.clienteTelefono || "Sin teléfono",
                items: pedido.items || [],
                metodo_pago: pedido.metodo_pago || pedido.metodoPago || "No especificado",
                numero_referencia: pedido.numero_referencia || pedido.numeroReferencia || "Sin referencia",
                comprobante_url: pedido.comprobante_url || pedido.comprobanteUrl || "",
                total: pedido.total || 0,
                estado: pedido.estado || "pendiente",
                fecha_creacion: pedido.fecha_creacion || pedido.fechaCreacion || new Date().toISOString(),
                factura: null,
              };
            }
          })
        );

        // Detectar nuevos pedidos
        if (silencioso && pedidosAnterioresRef.current.size > 0) {
          const pedidosNuevos = pedidosConFacturas.filter(
            (p) => !pedidosAnterioresRef.current.has(p._id)
          );
          if (pedidosNuevos.length > 0) {
            setToastMessage(`🔔 Nuevo pedido de ${pedidosNuevos[0].cliente_nombre}`);
            setToastType("pedido");
            setToastVisible(true);
          }
        }

        // Detectar nuevos abonos
        if (silencioso) {
          pedidosConFacturas.forEach((pedido) => {
            if (pedido.factura) {
              const cantidadAbonosActual = (pedido.factura.historial_abonos || []).length;
              const cantidadAbonosAnterior = abonosAnterioresRef.current.get(pedido._id) || 0;
              
              if (cantidadAbonosActual > cantidadAbonosAnterior && cantidadAbonosAnterior > 0) {
                setToastMessage(`💰 Nuevo abono de ${pedido.cliente_nombre} - ${pedido.factura.numero_factura}`);
                setToastType("abono");
                setToastVisible(true);
              }
              
              abonosAnterioresRef.current.set(pedido._id, cantidadAbonosActual);
            }
          });
        }

        // Actualizar referencias
        pedidosAnterioresRef.current = new Set(pedidosConFacturas.map((p) => p._id));
        pedidosConFacturas.forEach((pedido) => {
          if (pedido.factura) {
            abonosAnterioresRef.current.set(
              pedido._id,
              (pedido.factura.historial_abonos || []).length
            );
          }
        });

        setPedidos(pedidosConFacturas);
      } else {
        console.error("Error al cargar pedidos:", resPedidos.statusText);
        if (!silencioso) {
          setPedidos([]);
        }
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      if (!silencioso) {
        setPedidos([]);
      }
    } finally {
      if (!silencioso) {
        setLoading(false);
      }
    }
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const searchLower = search.toLowerCase();
    return (
      (pedido.cliente_nombre || "").toLowerCase().includes(searchLower) ||
      (pedido.cliente_cedula || "").toLowerCase().includes(searchLower) ||
      (pedido.numero_referencia || "").toLowerCase().includes(searchLower) ||
      (pedido._id || "").toLowerCase().includes(searchLower) ||
      (pedido.factura?.numero_factura || "").toLowerCase().includes(searchLower)
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
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">Pedidos Web</h1>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center gap-1">
            <Bell className="w-3 h-3" />
            <span>Monitoreo activo</span>
          </Badge>
        </div>
        <Button
          onClick={() => cargarPedidos()}
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
          placeholder="Buscar por nombre, cédula, referencia, ID de pedido o número de factura..."
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
            const factura = pedido.factura;
            const montoTotalFactura = factura?.monto_total || pedido.total || 0;
            const montoAbonado = factura?.monto_abonado || 0;
            const saldoPendiente = factura?.saldo_pendiente || (montoTotalFactura - montoAbonado);
            const historialAbonos = factura?.historial_abonos || [];
            
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

                  {/* Información de Factura */}
                  {factura && (
                    <div className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                      <div className="flex items-center gap-2 mb-3">
                        <Receipt className="w-5 h-5 text-cyan-400" />
                        <h4 className="text-white font-semibold">Factura: {factura.numero_factura}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Monto Total Factura</p>
                          <p className="text-white font-bold text-lg">${montoTotalFactura.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Monto Total Abonado</p>
                          <p className="text-cyan-400 font-bold text-lg">${montoAbonado.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Saldo Pendiente</p>
                          <p className={`font-bold text-lg ${saldoPendiente > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            ${saldoPendiente.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Historial de Abonos */}
                      {historialAbonos.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <p className="text-gray-400 text-sm mb-2 font-semibold">Historial de Abonos:</p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {historialAbonos.map((abono, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-600"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 text-white text-sm">
                                    <DollarSign className="w-4 h-4 text-cyan-400" />
                                    <span className="font-semibold">${abono.cantidad.toFixed(2)}</span>
                                    <span className="text-gray-400">-</span>
                                    <span className="text-gray-400">{abono.metodo_pago || "Sin método"}</span>
                                    <span className="text-gray-400">-</span>
                                    <span className="text-gray-400 text-xs">
                                      Ref: {abono.numero_referencia || "Sin referencia"}
                                    </span>
                                  </div>
                                  {abono.fecha && (
                                    <p className="text-gray-500 text-xs mt-1">
                                      {formatearFecha(abono.fecha)}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-green-500/30 text-green-400 hover:bg-green-500/10 ml-2"
                                  disabled
                                  title="Botón visual - No modifica nada"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Validar
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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

              {/* Información de Factura y Abonos */}
              {pedidoSeleccionado.factura && (
                <Card className="bg-gray-700/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      Factura y Abonos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Número de Factura</p>
                        <p className="text-white font-semibold">{pedidoSeleccionado.factura?.numero_factura}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Monto Total Factura</p>
                        <p className="text-white font-bold text-lg">${(pedidoSeleccionado.factura?.monto_total || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Monto Total Abonado</p>
                        <p className="text-cyan-400 font-bold text-lg">${(pedidoSeleccionado.factura?.monto_abonado || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Saldo Pendiente</p>
                      <p className={`font-bold text-xl ${(pedidoSeleccionado.factura?.saldo_pendiente || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        ${(pedidoSeleccionado.factura?.saldo_pendiente || 0).toFixed(2)}
                      </p>
                    </div>

                    {/* Historial de Abonos en Modal */}
                    {(pedidoSeleccionado.factura?.historial_abonos || []).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <p className="text-gray-400 text-sm mb-3 font-semibold">Historial de Abonos:</p>
                        <div className="space-y-3">
                          {(pedidoSeleccionado.factura?.historial_abonos || []).map((abono, index) => (
                            <div
                              key={index}
                              className="bg-gray-800/50 rounded-lg p-4 border border-gray-600"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-5 h-5 text-cyan-400" />
                                    <span className="text-white font-bold text-lg">${abono.cantidad.toFixed(2)}</span>
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                      {abono.metodo_pago || "Sin método"}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-400">
                                    <p>Referencia: {abono.numero_referencia || "Sin referencia"}</p>
                                    {abono.fecha && <p>Fecha: {formatearFecha(abono.fecha)}</p>}
                                    {abono.comprobante_url && (
                                      <div className="mt-2">
                                        <a
                                          href={abono.comprobante_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-cyan-400 hover:underline flex items-center gap-1"
                                        >
                                          <ImageIcon className="w-4 h-4" />
                                          Ver comprobante
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                                  disabled
                                  title="Botón visual - No modifica nada"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Validar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Comprobante de Pago del Pedido */}
              {pedidoSeleccionado.comprobante_url && (
                <Card className="bg-gray-700/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Comprobante de Pago del Pedido
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

      {/* Toast de Notificación */}
      <div className={`fixed top-20 right-4 z-[100] transition-all duration-300 ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
        <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-[300px] max-w-md ${
          toastType === "pedido" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
        }`}>
          {toastType === "pedido" ? (
            <Bell className="w-5 h-5 flex-shrink-0" />
          ) : (
            <DollarSign className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="flex-1 text-sm font-medium">{toastMessage}</p>
          <button
            onClick={() => setToastVisible(false)}
            className="flex-shrink-0 hover:bg-black/20 rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PedidosWeb;
