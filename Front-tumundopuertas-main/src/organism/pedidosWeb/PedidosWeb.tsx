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
  Bell,
  PlayCircle,
  Loader2,
  MessageCircle,
  HelpCircle,
  Users,
  Trash2
} from "lucide-react";
import ChatMessenger from "./ChatMessenger";

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
    nombre?: string;
    codigo?: string;
    descripcion?: string;
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
  total_abonado?: number;
  historial_pagos?: Array<{
    monto: number;
    cantidad?: number;
    fecha?: string;
    estado?: string;
    metodo_pago?: string;
    numero_referencia?: string;
    comprobante_url?: string;
  }>;
  adicionales?: Array<{
    descripcion?: string;
    precio: number;
    cantidad?: number;
  }>;
  estado: string;
  fecha_creacion?: string;
  createdAt?: string;
  factura?: Factura | null;
}

// Componente para mostrar comprobante con presigned URL
const ComprobanteImage: React.FC<{ comprobanteUrl: string }> = ({ comprobanteUrl }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cargarComprobante = async () => {
      setLoading(true);
      setError(false);
      
      // Si ya es una URL completa HTTP/HTTPS, usarla directamente
      if (comprobanteUrl.startsWith('http://') || comprobanteUrl.startsWith('https://')) {
        setImageUrl(comprobanteUrl);
        setLoading(false);
        return;
      }

      // Si parece ser un object name de R2, obtener presigned URL
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
        const token = localStorage.getItem("access_token");
        
        // Normalizar el object name
        let objectName = comprobanteUrl;
        if (!objectName.includes('/')) {
          // Si no tiene ruta, asumir que está en comprobantes_pago/
          objectName = `comprobantes_pago/${objectName}`;
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
          setImageUrl(data.presigned_url || comprobanteUrl);
        } else {
          // Si falla, intentar con la URL original
          setImageUrl(comprobanteUrl);
        }
      } catch (err) {
        console.error("Error al obtener presigned URL para comprobante:", err);
        setImageUrl(comprobanteUrl);
      } finally {
        setLoading(false);
      }
    };

    if (comprobanteUrl) {
      cargarComprobante();
    }
  }, [comprobanteUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
        <p className="text-sm">No se pudo cargar el comprobante</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <img
        src={imageUrl}
        alt="Comprobante de pago"
        className="max-w-full max-h-96 rounded-lg border border-gray-300"
        onError={() => setError(true)}
      />
    </div>
  );
};

const PedidosWeb: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoWeb[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoWeb | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"pedido" | "abono">("pedido");
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [pedidoChatActual, setPedidoChatActual] = useState<PedidoWeb | null>(null);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState<Map<string, number>>(new Map());
  const [pedidoAEliminar, setPedidoAEliminar] = useState<PedidoWeb | null>(null);
  const [confirmacionEliminarAbierta, setConfirmacionEliminarAbierta] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  
  // Estados para soporte
  const [soporteAbierto, setSoporteAbierto] = useState<boolean>(() => {
    const saved = localStorage.getItem("soporte_lista_abierta");
    return saved === "true";
  });
  const [conversacionesSoporte, setConversacionesSoporte] = useState<Array<{
    cliente_id: string;
    cliente_nombre: string;
    ultimoMensaje?: string;
    ultimaFecha?: string;
    noLeidos: number;
  }>>([]);
  const [chatSoporteActual, setChatSoporteActual] = useState<{
    cliente_id: string;
    cliente_nombre: string;
  } | null>(null);
  const [chatSoporteAbierto, setChatSoporteAbierto] = useState<boolean>(() => {
    const saved = localStorage.getItem("chat_soporte_actual");
    return saved !== null;
  });
  
  // Referencias para detectar cambios
  const pedidosAnterioresRef = useRef<Set<string>>(new Set());
  const abonosAnterioresRef = useRef<Map<string, number>>(new Map());
  
  const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');

  useEffect(() => {
    cargarPedidos();
    
    // Restaurar chat de pedido persistido
    const pedidosKeys = Object.keys(localStorage).filter(key => key.startsWith("chat_pedido_") && key.endsWith("_abierto"));
    pedidosKeys.forEach(key => {
      const pedidoId = key.replace("chat_pedido_", "").replace("_abierto", "");
      const chatAbierto = localStorage.getItem(key) === "true";
      const pedidoData = localStorage.getItem(`chat_pedido_${pedidoId}_data`);
      
      if (chatAbierto && pedidoData) {
        try {
          const pedido = JSON.parse(pedidoData);
          setPedidoChatActual(pedido);
          setChatAbierto(true);
        } catch (e) {
          console.error("Error al restaurar chat de pedido:", e);
        }
      }
    });
    
    // Polling cada 10 segundos para detectar nuevos pedidos y abonos
    const intervalId = setInterval(() => {
      cargarPedidos(true); // true = modo silencioso (no mostrar loading)
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Cargar mensajes no leídos cuando hay pedidos
    if (pedidos.length > 0) {
      cargarMensajesNoLeidos();
      // Polling cada 2 segundos para mensajes nuevos (más frecuente para notificaciones rápidas)
      const intervalId = setInterval(cargarMensajesNoLeidos, 2000);
      return () => clearInterval(intervalId);
    }
  }, [pedidos]);

  // Cargar conversaciones de soporte
  useEffect(() => {
    cargarConversacionesSoporte();
    // Polling cada 2 segundos para conversaciones de soporte en tiempo real
    const intervalId = setInterval(cargarConversacionesSoporte, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // Cargar estado persistido del chat de soporte
  useEffect(() => {
    const savedChat = localStorage.getItem("chat_soporte_actual");
    if (savedChat) {
      try {
        const chatData = JSON.parse(savedChat);
        setChatSoporteActual(chatData);
        setChatSoporteAbierto(true);
      } catch (e) {
        console.error("Error al cargar chat de soporte guardado:", e);
      }
    }
  }, []);

  // Persistir estado del chat de soporte
  useEffect(() => {
    if (chatSoporteActual) {
      localStorage.setItem("chat_soporte_actual", JSON.stringify(chatSoporteActual));
      localStorage.setItem("chat_soporte_abierto", "true");
    } else {
      localStorage.removeItem("chat_soporte_actual");
      localStorage.removeItem("chat_soporte_abierto");
    }
  }, [chatSoporteActual]);

  // Persistir estado de lista de soporte
  useEffect(() => {
    localStorage.setItem("soporte_lista_abierta", soporteAbierto.toString());
  }, [soporteAbierto]);

  const cargarConversacionesSoporte = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      // Intentar obtener conversaciones desde el endpoint de soporte
      const res = await fetch(`${apiUrl}/mensajes/soporte`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // El backend puede retornar un array directo o un objeto con {conversaciones: [...]}
        let conversaciones: any[] = [];
        if (Array.isArray(data)) {
          conversaciones = data;
        } else if (data && Array.isArray(data.conversaciones)) {
          conversaciones = data.conversaciones;
        } else {
          console.warn("⚠️ Respuesta de /mensajes/soporte no tiene formato esperado:", data);
          conversaciones = [];
        }
        setConversacionesSoporte(conversaciones);
      } else if (res.status === 404) {
        // Si el endpoint no existe, construir manualmente desde todos los mensajes
        // Buscar todos los mensajes y filtrar los que tienen pedido_id empezando con "soporte_"
        try {
          // Como fallback, intentar obtener mensajes y agruparlos
          // Nota: Esto es temporal hasta que el backend implemente el endpoint
          console.log("⚠️ Endpoint /mensajes/soporte no disponible, usando fallback");
          setConversacionesSoporte([]);
        } catch (fallbackError) {
          console.error("Error en fallback de conversaciones:", fallbackError);
        }
      } else {
        console.error("Error al cargar conversaciones de soporte:", res.status);
      }
    } catch (error) {
      console.error("Error al cargar conversaciones de soporte:", error);
    }
  };

  const abrirChatSoporte = (cliente_id: string, cliente_nombre: string) => {
    setChatSoporteActual({ cliente_id, cliente_nombre });
    setChatSoporteAbierto(true);
    // Persistir
    localStorage.setItem("chat_soporte_actual", JSON.stringify({ cliente_id, cliente_nombre }));
    localStorage.setItem("chat_soporte_abierto", "true");
  };

  const cerrarChatSoporte = () => {
    // NO eliminar completamente, solo marcar como cerrado pero mantener los datos
    setChatSoporteAbierto(false);
    localStorage.setItem("chat_soporte_abierto", "false");
    // NO eliminar chat_soporte_actual para que persista
  };

  const cargarMensajesNoLeidos = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token || pedidos.length === 0) return;

      // Contar mensajes no leídos para cada pedido
      const contadores: Map<string, number> = new Map();
      
      // Usar Promise.allSettled para que una falla no detenga las demás
      const resultados = await Promise.allSettled(
        pedidos.map(async (pedido) => {
          try {
            const res = await fetch(`${apiUrl}/mensajes/pedido/${pedido._id}/no-leidos`, {
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            });
            
            if (res.ok) {
              const data = await res.json();
              const count = typeof data === 'number' ? data : (data.count || data.total || 0);
              if (count > 0) {
                return { pedidoId: pedido._id, count };
              }
            }
            return null;
          } catch (error) {
            // Ignorar errores silenciosamente
            return null;
          }
        })
      );
      
      // Procesar resultados exitosos
      resultados.forEach((resultado) => {
        if (resultado.status === 'fulfilled' && resultado.value) {
          contadores.set(resultado.value.pedidoId, resultado.value.count);
        }
      });
      
      // Actualizar estado solo si hay cambios para evitar re-renders innecesarios
      setMensajesNoLeidos(prev => {
        const hasChanges = contadores.size !== prev.size || 
          Array.from(contadores.entries()).some(([id, count]) => prev.get(id) !== count);
        return hasChanges ? contadores : prev;
      });
    } catch (error) {
      // Ignorar errores silenciosamente
    }
  };

  const abrirChat = (pedido: PedidoWeb) => {
    setPedidoChatActual(pedido);
    setChatAbierto(true);
    // Persistir estado del chat abierto
    localStorage.setItem(`chat_pedido_${pedido._id}_abierto`, "true");
    localStorage.setItem(`chat_pedido_${pedido._id}_data`, JSON.stringify(pedido));
    // Marcar mensajes como leídos cuando se abre el chat
    if (mensajesNoLeidos.has(pedido._id)) {
      setMensajesNoLeidos(prev => {
        const nuevo = new Map(prev);
        nuevo.delete(pedido._id);
        return nuevo;
      });
    }
  };

  const cargarPedidos = async (silencioso = false) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }
      const token = localStorage.getItem("access_token");
      
      // OPTIMIZACIÓN: Usar el nuevo endpoint optimizado GET /pedidos/web/
      // Este endpoint solo retorna pedidos web con proyección optimizada
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos máximo
      
      try {
        const resPedidos = await fetch(`${apiUrl}/pedidos/web/`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (resPedidos.ok) {
          const data = await resPedidos.json();
          
          // El nuevo endpoint retorna {pedidos: [], total: number, success: boolean}
          const todosPedidos = data.success && Array.isArray(data.pedidos) ? data.pedidos : [];
          
          // OPTIMIZACIÓN: Procesar pedidos de forma síncrona (sin llamadas async innecesarias)
          // El backend ya incluye cliente_cedula y cliente_telefono, así que no necesitamos hacer llamadas adicionales
          const pedidosConFacturas: PedidoWeb[] = todosPedidos.map((pedido: any) => {
            const pedidoId = pedido._id || pedido.id;
            const clienteId = pedido.cliente_id || pedido.clienteId;
            
            // Calcular total del pedido (suma de items + adicionales)
            let totalCalculado = pedido.total || 0;
            if (!totalCalculado && pedido.items && Array.isArray(pedido.items)) {
              totalCalculado = pedido.items.reduce((sum: number, item: any) => {
                return sum + ((item.precio || 0) * (item.cantidad || 0));
              }, 0);
            }
            // Sumar adicionales si existen
            if (pedido.adicionales && Array.isArray(pedido.adicionales)) {
              const totalAdicionales = pedido.adicionales.reduce((sum: number, adic: any) => {
                return sum + ((adic.precio || 0) * (adic.cantidad || 1));
              }, 0);
              totalCalculado += totalAdicionales;
            }
            
            // Calcular monto abonado desde historial_pagos
            let totalAbonado = pedido.total_abonado || 0;
            if (!totalAbonado && pedido.historial_pagos && Array.isArray(pedido.historial_pagos)) {
              totalAbonado = pedido.historial_pagos
                .filter((pago: any) => pago.estado === "aprobado" || pago.estado === "confirmado")
                .reduce((sum: number, pago: any) => {
                  return sum + (pago.monto || pago.cantidad || 0);
                }, 0);
            }
            
            // Usar directamente los datos que vienen del backend (ya incluye cliente_cedula y cliente_telefono)
            return {
              _id: pedidoId,
              cliente_id: clienteId,
              cliente_nombre: pedido.cliente_nombre || pedido.clienteNombre || pedido.cliente?.nombre || "Sin nombre",
              cliente_cedula: pedido.cliente_cedula || pedido.clienteCedula || pedido.cliente?.cedula || "Sin cédula",
              cliente_direccion: pedido.cliente_direccion || pedido.clienteDireccion || pedido.cliente?.direccion || "Sin dirección",
              cliente_telefono: pedido.cliente_telefono || pedido.clienteTelefono || pedido.cliente?.telefono || "Sin teléfono",
              items: pedido.items || [],
              metodo_pago: pedido.metodo_pago || pedido.metodoPago || "No especificado",
              numero_referencia: pedido.numero_referencia || pedido.numeroReferencia || "Sin referencia",
              comprobante_url: pedido.comprobante_url || pedido.comprobanteUrl || pedido.comprobante || "",
              total: totalCalculado,
              total_abonado: totalAbonado,
              historial_pagos: pedido.historial_pagos || [],
              adicionales: pedido.adicionales || [],
              estado: pedido.estado || pedido.estado_general || "pendiente",
              fecha_creacion: pedido.fecha_creacion || pedido.fechaCreacion || pedido.createdAt || new Date().toISOString(),
              factura: undefined, // Se cargará cuando se abra el modal de detalle
            };
          });

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

        // Detectar nuevos abonos (solo si hay facturas cargadas)
        // Nota: Como ya no cargamos facturas en la carga inicial, esta lógica solo funciona
        // cuando se cargan facturas manualmente (al abrir modales, etc.)
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

        // Actualizar referencias de pedidos (sin facturas por ahora)
        pedidosAnterioresRef.current = new Set(pedidosConFacturas.map((p: PedidoWeb) => p._id));
        // Nota: No actualizamos referencias de abonos aquí porque las facturas no se cargan en la carga inicial

          setPedidos(pedidosConFacturas);
        } else {
          console.error("Error al cargar pedidos:", resPedidos.statusText);
          if (!silencioso) {
            setPedidos([]);
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error("⏱️ Timeout al cargar pedidos (más de 30 segundos)");
          if (!silencioso) {
            setPedidos([]);
            alert("La carga de pedidos está tardando demasiado. Por favor, intenta recargar la página.");
          }
        } else {
          console.error("Error al cargar pedidos:", fetchError);
          if (!silencioso) {
            setPedidos([]);
          }
        }
      }
    } catch (error) {
      console.error("Error general al cargar pedidos:", error);
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

  const verDetalle = async (pedido: PedidoWeb) => {
    setPedidoSeleccionado(pedido);
    setModalDetalleAbierto(true);
    
    // Cargar factura solo cuando se abre el modal (optimización)
    if (pedido._id) {
      try {
        const token = localStorage.getItem("access_token");
        const resFactura = await fetch(`${apiUrl}/facturas/pedido/${pedido._id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (resFactura.ok) {
          const facturaData = await resFactura.json();
          const factura = Array.isArray(facturaData) ? facturaData[0] : facturaData;
          if (factura) {
            // Actualizar el pedido con la factura
            setPedidoSeleccionado(prev => prev ? {
              ...prev,
              factura: {
                _id: factura._id || factura.id,
                numero_factura: factura.numero_factura || factura.numeroFactura || "Sin número",
                monto_total: factura.monto_total || factura.montoTotal || 0,
                monto_abonado: factura.monto_abonado || factura.montoAbonado || 0,
                saldo_pendiente: factura.saldo_pendiente || factura.saldoPendiente || (factura.monto_total || factura.montoTotal || 0) - (factura.monto_abonado || factura.montoAbonado || 0),
                historial_abonos: factura.historial_abonos || factura.historialAbonos || [],
                estado: factura.estado || "pendiente",
              }
            } : null);
          }
        }
      } catch (error) {
        // Silenciar errores 404 (es normal que no todos los pedidos tengan factura)
      }
    }
  };

  const cambiarEstadoPedido = async (nuevoEstado: string) => {
    if (!pedidoSeleccionado) return;
    
    setActualizandoEstado(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/pedidos/${pedidoSeleccionado._id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ nuevo_estado_general: nuevoEstado }),
      });

      if (res.ok) {
        // Actualizar el estado local del pedido
        setPedidoSeleccionado(prev => prev ? { ...prev, estado: nuevoEstado } : null);
        // Actualizar también en la lista de pedidos
        setPedidos(prev => prev.map(p => 
          p._id === pedidoSeleccionado._id ? { ...p, estado: nuevoEstado } : p
        ));
        setToastMessage(`✓ Estado del pedido actualizado a: ${getEstadoBadge(nuevoEstado).label}`);
        setToastType("pedido");
        setToastVisible(true);
      } else {
        const errorData = await res.json();
        alert(`Error al actualizar estado: ${errorData.detail || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("Error al actualizar el estado del pedido");
    } finally {
      setActualizandoEstado(false);
    }
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
      pendiente: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Pendiente" },
      procesando: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "Procesando" },
      confirmado: { color: "bg-green-100 text-green-800 border-green-300", label: "Confirmado" },
      cancelado: { color: "bg-red-100 text-red-800 border-red-300", label: "Cancelado" },
    };
    return estados[estado.toLowerCase()] || estados.pendiente;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Pedidos Web</h1>
          <Badge className="bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1">
            <Bell className="w-3 h-3" />
            <span>Monitoreo activo</span>
          </Badge>
        </div>
        <Button
          onClick={() => cargarPedidos()}
          variant="outline"
          className="border-blue-600 text-blue-700 hover:bg-blue-50"
        >
          Actualizar
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        <Input
          type="text"
          placeholder="Buscar por nombre, cédula, referencia, ID de pedido o número de factura..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Lista de pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
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
                className="bg-white border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-gray-900 flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-blue-600" />
                        {pedido.cliente_nombre}
                      </CardTitle>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-gray-500" />
                          Cédula: {pedido.cliente_cedula}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-500" />
                          {pedido.cliente_telefono}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          {pedido.cliente_direccion}
                        </span>
                      </div>
                    </div>
                    <Badge className={estadoInfo.color + " border"}>{estadoInfo.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{formatearFecha(pedido.fecha_creacion)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {pedido.metodo_pago} - Ref: {pedido.numero_referencia}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 font-bold">
                      <Package className="w-4 h-4" />
                      <span>${(pedido.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Información de Pago Inicial */}
                  {(pedido.total_abonado || (pedido.historial_pagos && pedido.historial_pagos.length > 0)) && (
                    <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <h4 className="text-gray-900 font-semibold">Información de Pago</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-gray-600 text-sm mb-1">Total del Pedido</p>
                          <p className="text-gray-900 font-bold text-lg">${(pedido.total || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm mb-1">Monto Abonado</p>
                          <p className="text-green-600 font-bold text-lg">${(pedido.total_abonado || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm mb-1">Saldo Pendiente</p>
                          <p className={`font-bold text-lg ${(pedido.total || 0) - (pedido.total_abonado || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${((pedido.total || 0) - (pedido.total_abonado || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Comprobante de Pago */}
                  {pedido.comprobante_url && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        <h4 className="text-gray-900 font-semibold">Comprobante de Pago</h4>
                      </div>
                      <ComprobanteImage comprobanteUrl={pedido.comprobante_url} />
                    </div>
                  )}

                  {/* Información de Factura */}
                  {factura && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Receipt className="w-5 h-5 text-blue-600" />
                        <h4 className="text-gray-900 font-semibold">Factura: {factura.numero_factura}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-gray-600 text-sm mb-1">Monto Total Factura</p>
                          <p className="text-gray-900 font-bold text-lg">${montoTotalFactura.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm mb-1">Monto Total Abonado</p>
                          <p className="text-blue-600 font-bold text-lg">${montoAbonado.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm mb-1">Saldo Pendiente</p>
                          <p className={`font-bold text-lg ${saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${saldoPendiente.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Historial de Abonos */}
                      {historialAbonos.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <p className="text-gray-700 text-sm mb-2 font-semibold">Historial de Abonos:</p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {historialAbonos.map((abono, index) => (
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-green-500 text-green-600 hover:bg-green-50 ml-2"
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

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {pedido.items.length} {pedido.items.length === 1 ? "item" : "items"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => abrirChat(pedido)}
                        variant="outline"
                        className="relative border-green-500 text-green-600 hover:bg-green-50"
                        size="sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {mensajesNoLeidos.get(pedido._id) ? (
                          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse shadow-lg border-2 border-white">
                            {mensajesNoLeidos.get(pedido._id)}
                          </Badge>
                        ) : null}
                        {mensajesNoLeidos.get(pedido._id) && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setPedidoAEliminar(pedido);
                          setConfirmacionEliminarAbierta(true);
                        }}
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => verDetalle(pedido)}
                        variant="outline"
                        className="border-blue-600 text-blue-700 hover:bg-blue-50"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle */}
      <Dialog open={modalDetalleAbierto} onOpenChange={setModalDetalleAbierto}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              <span>Detalle del Pedido</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalDetalleAbierto(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {pedidoSeleccionado && (
            <div className="space-y-6 mt-4">
              {/* Información del Cliente */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Nombre</p>
                      <p className="text-gray-900 font-semibold">{pedidoSeleccionado.cliente_nombre}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Cédula</p>
                      <p className="text-gray-900 font-semibold">{pedidoSeleccionado.cliente_cedula}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Teléfono</p>
                      <p className="text-gray-900 font-semibold">{pedidoSeleccionado.cliente_telefono}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Dirección</p>
                      <p className="text-gray-900 font-semibold">{pedidoSeleccionado.cliente_direccion}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información del Pedido */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Detalles del Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Fecha</p>
                      <p className="text-gray-900 font-semibold">{formatearFecha(pedidoSeleccionado.fecha_creacion)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Estado</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getEstadoBadge(pedidoSeleccionado.estado).color + " border"}>
                          {getEstadoBadge(pedidoSeleccionado.estado).label}
                        </Badge>
                        <Button
                          onClick={() => abrirChat(pedidoSeleccionado)}
                          variant="outline"
                          size="sm"
                          className="relative border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {mensajesNoLeidos.get(pedidoSeleccionado._id) ? (
                            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse shadow-lg border-2 border-white">
                              {mensajesNoLeidos.get(pedidoSeleccionado._id)}
                            </Badge>
                          ) : null}
                          {mensajesNoLeidos.get(pedidoSeleccionado._id) && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Método de Pago</p>
                      <p className="text-gray-900 font-semibold">{pedidoSeleccionado.metodo_pago}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Número de Referencia</p>
                      <p className="text-gray-900 font-semibold">{pedidoSeleccionado.numero_referencia}</p>
                    </div>
                  </div>

                  {/* Items del Pedido */}
                  <div className="mt-4">
                    <p className="text-gray-700 text-sm mb-2 font-semibold">Items del Pedido</p>
                    <div className="space-y-2">
                      {pedidoSeleccionado.items.map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-3 flex justify-between items-start border border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="text-gray-900 font-semibold text-base">
                              {item.item?.nombre || item.nombre || `Item ${index + 1}`}
                            </p>
                            {(item.item?.codigo || item.codigo) && (
                              <p className="text-gray-600 text-sm mt-1">
                                Código: {item.item?.codigo || item.codigo}
                              </p>
                            )}
                            {item.item?.descripcion && (
                              <p className="text-gray-600 text-sm mt-1">{item.item.descripcion}</p>
                            )}
                            <p className="text-gray-500 text-sm mt-2">
                              Cantidad: {item.cantidad}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-blue-600 font-semibold text-lg">
                              ${(item.precio * item.cantidad).toFixed(2)}
                            </p>
                            <p className="text-gray-500 text-xs">
                              ${item.precio.toFixed(2)} c/u
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${pedidoSeleccionado.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Botón para cambiar estado */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {pedidoSeleccionado.estado === "pendiente" && (
                      <Button
                        onClick={() => cambiarEstadoPedido("procesando")}
                        disabled={actualizandoEstado}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        {actualizandoEstado ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Actualizando...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Cambiar a "En Proceso"
                          </>
                        )}
                      </Button>
                    )}
                    {pedidoSeleccionado.estado === "procesando" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 text-sm font-semibold">
                          Este pedido está en proceso
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Información de Factura y Abonos */}
              {pedidoSeleccionado.factura && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-blue-600" />
                      Factura y Abonos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Número de Factura</p>
                        <p className="text-gray-900 font-semibold">{pedidoSeleccionado.factura?.numero_factura}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Monto Total Factura</p>
                        <p className="text-gray-900 font-bold text-lg">${(pedidoSeleccionado.factura?.monto_total || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Monto Total Abonado</p>
                        <p className="text-blue-600 font-bold text-lg">${(pedidoSeleccionado.factura?.monto_abonado || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Saldo Pendiente</p>
                      <p className={`font-bold text-xl ${(pedidoSeleccionado.factura?.saldo_pendiente || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${(pedidoSeleccionado.factura?.saldo_pendiente || 0).toFixed(2)}
                      </p>
                    </div>

                    {/* Botón para agregar abono si hay saldo pendiente */}
                    {(pedidoSeleccionado.factura?.saldo_pendiente || 0) > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <Button
                          onClick={() => {
                            // TODO: Abrir modal para agregar abono
                            alert("Funcionalidad para agregar abono - pendiente de implementación completa");
                          }}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Agregar Abono
                        </Button>
                      </div>
                    )}

                    {/* Historial de Abonos en Modal */}
                    {(pedidoSeleccionado.factura?.historial_abonos || []).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-gray-700 text-sm mb-3 font-semibold">Historial de Abonos:</p>
                        <div className="space-y-3">
                          {(pedidoSeleccionado.factura?.historial_abonos || []).map((abono, index) => {
                            const esPendiente = abono.estado === "pendiente" || !abono.estado;
                            return (
                              <div
                                key={index}
                                className={`bg-white rounded-lg p-4 border ${
                                  esPendiente ? "border-yellow-300 bg-yellow-50" : "border-gray-200"
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <DollarSign className="w-5 h-5 text-blue-600" />
                                      <span className="text-gray-900 font-bold text-lg">${abono.cantidad.toFixed(2)}</span>
                                      <Badge className={esPendiente ? "bg-yellow-100 text-yellow-800 border-yellow-300" : "bg-blue-100 text-blue-800 border-blue-300"}>
                                        {abono.metodo_pago || "Sin método"}
                                      </Badge>
                                      {esPendiente && (
                                        <Badge className="bg-red-100 text-red-800 border-red-300">
                                          Pendiente
                                        </Badge>
                                      )}
                                      {!esPendiente && (
                                        <Badge className="bg-green-100 text-green-800 border-green-300">
                                          Aprobado
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600">
                                      <p>Referencia: {abono.numero_referencia || "Sin referencia"}</p>
                                      {abono.fecha && <p>Fecha: {formatearFecha(abono.fecha)}</p>}
                                      {abono.comprobante_url && (
                                        <div className="mt-2">
                                          <a
                                            href={abono.comprobante_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline flex items-center gap-1"
                                          >
                                            <ImageIcon className="w-4 h-4" />
                                            Ver comprobante
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {esPendiente && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-green-500 text-green-600 hover:bg-green-50"
                                      onClick={async () => {
                                        // Aprobar abono
                                        try {
                                          const token = localStorage.getItem("access_token");
                                          const res = await fetch(`${apiUrl}/pedidos/${pedidoSeleccionado._id}/abono/${index}/aprobar`, {
                                            method: "POST",
                                            headers: {
                                              "Content-Type": "application/json",
                                              "Authorization": `Bearer ${token}`,
                                            },
                                          });

                                          if (res.ok) {
                                            setToastMessage("✅ Abono aprobado exitosamente");
                                            setToastType("abono");
                                            setToastVisible(true);
                                            // Recargar pedidos
                                            cargarPedidos(false);
                                            // Recargar detalles del pedido
                                            const updatedPedido = pedidos.find(p => p._id === pedidoSeleccionado._id);
                                            if (updatedPedido) {
                                              setPedidoSeleccionado(updatedPedido);
                                            }
                                          } else {
                                            const errorData = await res.json();
                                            alert(`Error al aprobar abono: ${errorData.detail || "Error desconocido"}`);
                                          }
                                        } catch (err) {
                                          console.error("Error al aprobar abono:", err);
                                          alert("Error al aprobar abono. Por favor, intente de nuevo.");
                                        }
                                      }}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Aprobar
                                    </Button>
                                  )}
                                  {!esPendiente && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-green-500 text-green-600 bg-green-50"
                                      disabled
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Aprobado
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Comprobante de Pago del Pedido */}
              {pedidoSeleccionado.comprobante_url && (
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                      Comprobante de Pago del Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ComprobanteImage comprobanteUrl={pedidoSeleccionado.comprobante_url} />
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

      {/* Modal de Confirmación para Eliminar Pedido */}
      <Dialog open={confirmacionEliminarAbierta} onOpenChange={setConfirmacionEliminarAbierta}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-md p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold text-red-600 flex items-center gap-2">
              <Trash2 className="w-6 h-6" />
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 mb-4">
            <p className="text-gray-700 mb-4">
              ¿Estás seguro de que deseas eliminar este pedido?
            </p>
            {pedidoAEliminar && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Cliente:</strong> {pedidoAEliminar.cliente_nombre}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Pedido #:</strong> {pedidoAEliminar._id.slice(-6)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Total:</strong> ${pedidoAEliminar.total?.toFixed(2) || '0.00'}
                </p>
              </div>
            )}
            <p className="text-sm text-red-600 font-semibold">
              ⚠️ Esta acción no se puede deshacer. El pedido será eliminado permanentemente.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmacionEliminarAbierta(false);
                setPedidoAEliminar(null);
              }}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!pedidoAEliminar) return;
                
                setEliminando(true);
                try {
                  const token = localStorage.getItem("access_token");
                  const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
                  
                  const res = await fetch(`${apiUrl}/pedidos/${pedidoAEliminar._id}`, {
                    method: "DELETE",
                    headers: {
                      "Authorization": `Bearer ${token}`,
                    },
                  });

                  if (res.ok) {
                    // Eliminar el pedido del estado local
                    setPedidos(prev => prev.filter(p => p._id !== pedidoAEliminar._id));
                    
                    // Cerrar modal de confirmación
                    setConfirmacionEliminarAbierta(false);
                    setPedidoAEliminar(null);
                    
                    // Mostrar mensaje de éxito
                    setToastMessage(`✅ Pedido #${pedidoAEliminar._id.slice(-6)} eliminado exitosamente`);
                    setToastType("pedido");
                    setToastVisible(true);
                    
                    // Limpiar chat si estaba abierto para este pedido
                    if (pedidoChatActual && pedidoChatActual._id === pedidoAEliminar._id) {
                      setChatAbierto(false);
                      setPedidoChatActual(null);
                    }
                  } else {
                    const errorData = await res.json().catch(() => ({ detail: "Error desconocido" }));
                    alert(`Error al eliminar pedido: ${errorData.detail || "Error desconocido"}`);
                  }
                } catch (error) {
                  console.error("Error al eliminar pedido:", error);
                  alert("Error al eliminar el pedido. Por favor, intenta de nuevo.");
                } finally {
                  setEliminando(false);
                }
              }}
              disabled={eliminando}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {eliminando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Pedido
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Messenger para Pedidos */}
      {pedidoChatActual && (
        <ChatMessenger
          pedidoId={pedidoChatActual._id}
          clienteId={pedidoChatActual.cliente_id}
          clienteNombre={pedidoChatActual.cliente_nombre || "Cliente"}
          usuarioActualId={localStorage.getItem("usuario_id") || ""}
          usuarioActualTipo="admin"
          usuarioActualNombre={localStorage.getItem("usuario") || "Administrador"}
          infoPedido={{
            numeroPedido: pedidoChatActual._id.slice(-6),
            total: pedidoChatActual.total || 0,
            estado: pedidoChatActual.estado || "pendiente",
            fechaCreacion: pedidoChatActual.fecha_creacion
          }}
          open={chatAbierto}
          onClose={() => {
            // NO eliminar pedidoChatActual, solo cerrar el modal
            setChatAbierto(false);
            // Persistir estado
            localStorage.setItem(`chat_pedido_${pedidoChatActual._id}_abierto`, "false");
            cargarMensajesNoLeidos();
          }}
          onNuevoMensaje={() => {
            // Recargar contadores de mensajes no leídos cuando hay un nuevo mensaje
            cargarMensajesNoLeidos();
          }}
        />
      )}

      {/* Chat Messenger para Soporte */}
      {chatSoporteActual && (
        <ChatMessenger
          pedidoId={`soporte_${chatSoporteActual.cliente_id}`}
          clienteId={chatSoporteActual.cliente_id}
          clienteNombre={chatSoporteActual.cliente_nombre}
          usuarioActualId={localStorage.getItem("usuario_id") || ""}
          usuarioActualTipo="admin"
          usuarioActualNombre={localStorage.getItem("usuario") || "Administrador"}
          tituloChat={chatSoporteActual.cliente_nombre}
          open={chatSoporteAbierto}
          onClose={() => {
            cerrarChatSoporte();
            cargarConversacionesSoporte();
          }}
          onNuevoMensaje={() => {
            cargarConversacionesSoporte();
          }}
        />
      )}

      {/* Icono Flotante de Soporte - Lado Derecho */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Botón del Icono Flotante */}
        <button
          onClick={() => setSoporteAbierto(!soporteAbierto)}
          className="relative bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          style={{ width: '56px', height: '56px' }}
        >
          <HelpCircle className="w-6 h-6" />
          {/* Badge de notificación */}
          {conversacionesSoporte.reduce((total, conv) => total + conv.noLeidos, 0) > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
              {conversacionesSoporte.reduce((total, conv) => total + conv.noLeidos, 0)}
            </span>
          )}
        </button>

        {/* Panel de Conversaciones - Se abre desde el icono */}
        {soporteAbierto && (
          <div className="absolute bottom-20 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl z-50">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-purple-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-white" />
                  <h3 className="text-white font-semibold">Soporte</h3>
                  {conversacionesSoporte.length > 0 && (
                    <Badge className="bg-white text-purple-600">{conversacionesSoporte.length}</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoporteAbierto(false)}
                  className="text-white hover:bg-purple-700 h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {conversacionesSoporte.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay conversaciones de soporte aún</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {conversacionesSoporte.map((conv) => {
                    const totalNoLeidos = conv.noLeidos || 0;
                    return (
                      <div
                        key={conv.cliente_id}
                        onClick={() => {
                          abrirChatSoporte(conv.cliente_id, conv.cliente_nombre);
                          setSoporteAbierto(false); // Cerrar el panel al abrir chat
                        }}
                        className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                          chatSoporteActual?.cliente_id === conv.cliente_id
                            ? "bg-purple-50 border-l-4 border-purple-500"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 truncate">
                                {conv.cliente_nombre}
                              </p>
                              {totalNoLeidos > 0 && (
                                <Badge className="bg-red-500 text-white text-xs flex-shrink-0">
                                  {totalNoLeidos}
                                </Badge>
                              )}
                            </div>
                            {conv.ultimoMensaje && (
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {conv.ultimoMensaje}
                              </p>
                            )}
                            {conv.ultimaFecha && (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(conv.ultimaFecha).toLocaleString('es-VE', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PedidosWeb;
