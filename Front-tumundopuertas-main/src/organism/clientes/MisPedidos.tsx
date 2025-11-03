import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Package, Receipt, DollarSign, X, CheckCircle2, MessageCircle } from "lucide-react";
import ModalAbonarFactura from "./ModalAbonarFactura";
import ChatMessenger from "../pedidosWeb/ChatMessenger";

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
  historial_abonos?: Array<{
    fecha?: string;
    cantidad: number;
    metodo_pago?: string;
    numero_referencia?: string;
    comprobante_url?: string;
  }>;
  historialAbonos?: Array<{
    fecha?: string;
    cantidad: number;
    metodo_pago?: string;
    numero_referencia?: string;
    comprobante_url?: string;
  }>;
}

interface Pedido {
  _id: string;
  cliente_id?: string;
  cliente_nombre?: string;
  fecha_creacion?: string;
  estado_general?: string;
  estado?: string;
  total?: number;
  montoTotal?: number;
  items?: Array<{
    itemId?: string;
    cantidad: number;
    precio: number;
    nombre?: string;
    codigo?: string;
    descripcion?: string;
    categoria?: string;
    item?: {
      nombre?: string;
      codigo?: string;
      descripcion?: string;
      imagenes?: string[];
    };
    imagenes?: string[];
  }>;
  metodo_pago?: string;
  numero_referencia?: string;
  comprobante_url?: string;
  adicionales?: Array<{
    descripcion?: string;
    precio: number;
    cantidad?: number;
  }>;
}

const MisPedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [facturaPedido, setFacturaPedido] = useState<Factura | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [modalAbonarAbierto, setModalAbonarAbierto] = useState(false);
  const [cargandoFactura, setCargandoFactura] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [pedidoChatActual, setPedidoChatActual] = useState<Pedido | null>(null);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    cargarPedidos();
    
    // Restaurar chat persistido
    const clienteId = localStorage.getItem("cliente_id");
    if (clienteId) {
      const chatAbierto = localStorage.getItem(`chat_pedido_cliente_${clienteId}_abierto`) === "true";
      const pedidoData = localStorage.getItem(`chat_pedido_cliente_${clienteId}_data`);
      
      if (chatAbierto && pedidoData) {
        try {
          const pedido = JSON.parse(pedidoData);
          setPedidoChatActual(pedido);
          setChatAbierto(true);
        } catch (e) {
          console.error("Error al restaurar chat:", e);
        }
      }
    }
    
    // Polling cada 10 segundos para verificar mensajes nuevos
    const intervalId = setInterval(() => {
      cargarMensajesNoLeidos();
    }, 10000);
    return () => clearInterval(intervalId);
  }, [pedidos]);

  const cargarMensajesNoLeidos = async () => {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("cliente_access_token");
      if (!token) return;

      const contadores: Map<string, number> = new Map();
      
      await Promise.all(
        pedidos.map(async (pedido) => {
          try {
            const res = await fetch(`${apiUrl}/mensajes/pedido/${pedido._id}/no-leidos`, {
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            });
            
            if (res.ok) {
              const data = await res.json();
              const count = typeof data === 'number' ? data : (data.count || 0);
              if (count > 0) {
                contadores.set(pedido._id, count);
              }
            }
          } catch (error) {
            // Ignorar errores silenciosamente
          }
        })
      );
      
      setMensajesNoLeidos(contadores);
    } catch (error) {
      // Ignorar errores silenciosamente
    }
  };

  const cargarPedidos = async () => {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("cliente_access_token");
      const clienteId = localStorage.getItem("cliente_id");
      const res = await fetch(`${apiUrl}/pedidos/cliente/${clienteId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPedidos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarFacturaPedido = async (pedidoId: string) => {
    setCargandoFactura(true);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("cliente_access_token");
      const res = await fetch(`${apiUrl}/facturas/pedido/${pedidoId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const factura = Array.isArray(data) ? data[0] : data;
        if (factura) {
          setFacturaPedido({
            _id: factura._id || factura.id,
            numero_factura: factura.numero_factura || factura.numeroFactura,
            monto_total: factura.monto_total || factura.montoTotal || 0,
            monto_abonado: factura.monto_abonado || factura.montoAbonado || 0,
            saldo_pendiente: factura.saldo_pendiente || factura.saldoPendiente || 0,
            historial_abonos: factura.historial_abonos || factura.historialAbonos || [],
          });
        } else {
          setFacturaPedido(null);
        }
      } else {
        setFacturaPedido(null);
      }
    } catch (error) {
      console.error("Error al cargar factura:", error);
      setFacturaPedido(null);
    } finally {
      setCargandoFactura(false);
    }
  };

  const verDetalle = async (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setModalDetalleAbierto(true);
    await cargarFacturaPedido(pedido._id);
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

  const calcularTotalPedido = (pedido: Pedido) => {
    let totalItems = 0;
    if (pedido.items && pedido.items.length > 0) {
      totalItems = pedido.items.reduce((sum, item) => {
        return sum + (item.precio || 0) * (item.cantidad || 0);
      }, 0);
    }
    let totalAdicionales = 0;
    if (pedido.adicionales && pedido.adicionales.length > 0) {
      totalAdicionales = pedido.adicionales.reduce((sum, ad) => {
        return sum + (ad.precio || 0) * (ad.cantidad || 1);
      }, 0);
    }
    return totalItems + totalAdicionales;
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { color: string; label: string }> = {
      pendiente: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Pendiente" },
      procesando: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "Procesando" },
      confirmado: { color: "bg-green-100 text-green-800 border-green-300", label: "Confirmado" },
      orden4: { color: "bg-green-100 text-green-800 border-green-300", label: "Listo" },
      cancelado: { color: "bg-red-100 text-red-800 border-red-300", label: "Cancelado" },
    };
    return estados[estado.toLowerCase()] || estados.pendiente;
  };

  if (loading) {
    return <div className="text-center py-12"><p className="text-gray-300">Cargando pedidos...</p></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">Mis Pedidos</h2>
      {pedidos.length === 0 ? (
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <p className="text-gray-400 text-center">No tienes pedidos registrados</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const totalPedido = pedido.total || calcularTotalPedido(pedido);
            const estadoInfo = getEstadoBadge(pedido.estado_general || pedido.estado || "pendiente");
            
            return (
              <Card key={pedido._id} className="p-6 bg-gray-800/50 border-gray-700 hover:border-cyan-400/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-white font-bold">Pedido #{pedido._id.slice(-6)}</h3>
                    <p className="text-gray-400 text-sm">Fecha: {pedido.fecha_creacion ? new Date(pedido.fecha_creacion).toLocaleDateString() : "N/A"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-gray-400 text-sm">Estado:</p>
                      <Badge className={estadoInfo.color + " border"}>{estadoInfo.label}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-cyan-400 font-bold text-xl">${totalPedido.toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => verDetalle(pedido)}
                        variant="outline"
                        className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalle
                      </Button>
                      <Button
                        onClick={() => {
                          setPedidoChatActual(pedido);
                          setChatAbierto(true);
                          // Persistir estado del chat
                          const clienteId = localStorage.getItem("cliente_id");
                          if (clienteId) {
                            localStorage.setItem(`chat_pedido_cliente_${clienteId}_abierto`, "true");
                            localStorage.setItem(`chat_pedido_cliente_${clienteId}_data`, JSON.stringify(pedido));
                          }
                          // Marcar mensajes como leídos
                          if (mensajesNoLeidos.has(pedido._id)) {
                            setMensajesNoLeidos(prev => {
                              const nuevo = new Map(prev);
                              nuevo.delete(pedido._id);
                              return nuevo;
                            });
                          }
                        }}
                        variant="outline"
                        className="relative border-green-400 text-green-400 hover:bg-green-400/10"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {mensajesNoLeidos.get(pedido._id) ? (
                          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {mensajesNoLeidos.get(pedido._id)}
                          </Badge>
                        ) : null}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle del Pedido */}
      <Dialog open={modalDetalleAbierto} onOpenChange={setModalDetalleAbierto}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              <span>Detalle del Pedido</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setModalDetalleAbierto(false);
                  setPedidoSeleccionado(null);
                  setFacturaPedido(null);
                }}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {pedidoSeleccionado && (
            <div className="space-y-6 mt-4">
              {/* Información Básica del Pedido */}
              <Card className="bg-white border-gray-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Pedido #</p>
                      <p className="text-gray-900 font-semibold">{pedidoSeleccionado._id.slice(-6)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Fecha</p>
                      <p className="text-gray-900 font-semibold">{formatearFecha(pedidoSeleccionado.fecha_creacion)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Estado</p>
                      <Badge className={getEstadoBadge(pedidoSeleccionado.estado_general || pedidoSeleccionado.estado || "pendiente").color + " border"}>
                        {getEstadoBadge(pedidoSeleccionado.estado_general || pedidoSeleccionado.estado || "pendiente").label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Total del Pedido</p>
                      <p className="text-blue-600 font-bold text-xl">
                        ${(pedidoSeleccionado.total || calcularTotalPedido(pedidoSeleccionado)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items del Pedido */}
              {pedidoSeleccionado.items && pedidoSeleccionado.items.length > 0 && (
                <Card className="bg-white border-gray-200">
                  <CardContent className="pt-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      Items del Pedido
                    </h4>
                    <div className="space-y-3">
                      {pedidoSeleccionado.items.map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-4 flex gap-4 items-center border border-gray-200"
                        >
                          {/* Imagen del item */}
                          {(item.item?.imagenes && item.item.imagenes.length > 0) || (item.imagenes && item.imagenes.length > 0) ? (
                            <ItemImage imagenUrl={(item.item?.imagenes && item.item.imagenes.length > 0) ? item.item.imagenes[0] : (item.imagenes?.[0] || '')} />
                          ) : null}
                          <div className="flex-1">
                            <p className="text-gray-900 font-semibold">
                              {item.nombre || item.item?.nombre || `Item ${index + 1}`}
                            </p>
                            {item.codigo && (
                              <p className="text-gray-600 text-sm">Código: {item.codigo}</p>
                            )}
                            {item.descripcion && (
                              <p className="text-gray-600 text-sm mt-1">{item.descripcion}</p>
                            )}
                            <p className="text-gray-500 text-sm mt-1">Cantidad: {item.cantidad}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-900 font-semibold">
                              ${((item.precio || 0) * (item.cantidad || 0)).toFixed(2)}
                            </p>
                            <p className="text-gray-500 text-sm">${(item.precio || 0).toFixed(2)} c/u</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Adicionales */}
              {pedidoSeleccionado.adicionales && pedidoSeleccionado.adicionales.length > 0 && (
                <Card className="bg-white border-gray-200">
                  <CardContent className="pt-6">
                    <h4 className="text-lg font-semibold mb-4">Adicionales</h4>
                    <div className="space-y-2">
                      {pedidoSeleccionado.adicionales.map((ad, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-gray-900">{ad.descripcion || `Adicional ${index + 1}`}</span>
                          <span className="text-gray-900 font-semibold">
                            ${(ad.precio * (ad.cantidad || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Información de Factura y Abonos */}
              {cargandoFactura ? (
                <Card className="bg-white border-gray-200">
                  <CardContent className="pt-6">
                    <p className="text-gray-600">Cargando información de factura...</p>
                  </CardContent>
                </Card>
              ) : facturaPedido ? (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Receipt className="w-5 h-5 text-blue-600" />
                      <h4 className="text-lg font-semibold">Factura: {facturaPedido.numero_factura || "Sin número"}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Monto Total Factura</p>
                        <p className="text-gray-900 font-bold text-lg">${facturaPedido.monto_total?.toFixed(2) || "0.00"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Monto Total Abonado</p>
                        <p className="text-blue-600 font-bold text-lg">${facturaPedido.monto_abonado?.toFixed(2) || "0.00"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Saldo Pendiente</p>
                        <p className={`font-bold text-lg ${(facturaPedido.saldo_pendiente || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${facturaPedido.saldo_pendiente?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>

                    {/* Historial de Abonos */}
                    {(facturaPedido.historial_abonos || []).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-gray-700 text-sm mb-3 font-semibold">Historial de Abonos:</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {(facturaPedido.historial_abonos || []).map((abono, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 text-gray-900 text-sm">
                                  <DollarSign className="w-4 h-4 text-blue-600" />
                                  <span className="font-semibold">${abono.cantidad.toFixed(2)}</span>
                                  <span className="text-gray-400">-</span>
                                  <span className="text-gray-600">{abono.metodo_pago || "Sin método"}</span>
                                  <span className="text-gray-400">-</span>
                                  <span className="text-gray-500 text-xs">
                                    Ref: {abono.numero_referencia || "Sin referencia"}
                                  </span>
                                </div>
                                {abono.fecha && (
                                  <p className="text-gray-500 text-xs mt-1">
                                    {formatearFecha(abono.fecha)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botón de Abonar */}
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      {(facturaPedido.saldo_pendiente || 0) > 0 ? (
                        <Button
                          onClick={() => setModalAbonarAbierto(true)}
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Abonar
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="w-full bg-green-500 text-white cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Pedido totalmente pagado
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="pt-6">
                    <p className="text-gray-600 text-center">Este pedido aún no tiene factura asociada</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Abonar */}
      {facturaPedido && (
        <ModalAbonarFactura
          open={modalAbonarAbierto}
          onClose={() => {
            setModalAbonarAbierto(false);
          }}
          factura={facturaPedido}
          onAbonoEnviado={() => {
            setModalAbonarAbierto(false);
            cargarFacturaPedido(pedidoSeleccionado!._id);
            cargarPedidos();
          }}
        />
      )}

      {/* Chat Messenger */}
      {pedidoChatActual && (
        <ChatMessenger
          pedidoId={pedidoChatActual._id}
          clienteId={localStorage.getItem("cliente_id") || ""}
          clienteNombre={pedidoChatActual.cliente_nombre || "Yo"}
          usuarioActualId={localStorage.getItem("cliente_id") || ""}
          usuarioActualTipo="cliente"
          usuarioActualNombre={localStorage.getItem("cliente_nombre") || "Cliente"}
          tituloChat="Tu Mundo Puertas"
          open={chatAbierto}
          onClose={() => {
            // NO eliminar pedidoChatActual, solo cerrar el modal
            setChatAbierto(false);
            // Persistir estado (cerrado pero mantener datos)
            const clienteId = localStorage.getItem("cliente_id");
            if (clienteId && pedidoChatActual) {
              localStorage.setItem(`chat_pedido_cliente_${clienteId}_abierto`, "false");
              localStorage.setItem(`chat_pedido_cliente_${clienteId}_data`, JSON.stringify(pedidoChatActual));
            }
            cargarMensajesNoLeidos();
          }}
          onNuevoMensaje={() => {
            cargarMensajesNoLeidos();
          }}
        />
      )}
    </div>
  );
};

// Componente para mostrar imagen del item con presigned URL
const ItemImage: React.FC<{ imagenUrl: string }> = ({ imagenUrl }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cargarImagen = async () => {
      setLoading(true);
      setError(false);
      
      // Si ya es una URL completa HTTP/HTTPS, usarla directamente
      if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
        setImageUrl(imagenUrl);
        setLoading(false);
        return;
      }

      // Si parece ser un object name de R2, obtener presigned URL
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
        const token = localStorage.getItem("cliente_access_token");
        
        if (!token) {
          setImageUrl(imagenUrl);
          setLoading(false);
          return;
        }
        
        // Normalizar el object name
        let objectName = imagenUrl;
        if (!objectName.includes('/')) {
          // Si no tiene ruta, asumir que está en items/
          objectName = `items/${objectName}`;
        } else if (!objectName.startsWith('items/')) {
          objectName = `items/${objectName}`;
        }
        
        const res = await fetch(`${apiUrl}/files/presigned-url`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            object_name: objectName,
            operation: "get_object",
            expires_in: 3600,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setImageUrl(data.presigned_url || imagenUrl);
        } else {
          // Si falla, intentar con la URL original
          setImageUrl(imagenUrl);
        }
      } catch (err) {
        console.error("Error al obtener presigned URL para imagen:", err);
        setImageUrl(imagenUrl);
      } finally {
        setLoading(false);
      }
    };

    if (imagenUrl) {
      cargarImagen();
    }
  }, [imagenUrl]);

  if (loading) {
    return (
      <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg">
        <Package className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Item"
      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
      onError={() => setError(true)}
    />
  );
};

export default MisPedidos;

