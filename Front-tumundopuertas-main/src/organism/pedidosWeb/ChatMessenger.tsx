import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, Loader2, Package } from "lucide-react";

interface Mensaje {
  _id?: string;
  pedido_id: string;
  remitente_id: string;
  remitente_tipo: "admin" | "cliente";
  remitente_nombre?: string;
  mensaje: string;
  fecha: string;
  leido?: boolean;
}

interface InfoPedido {
  numeroPedido?: string;
  total?: number;
  estado?: string;
  fechaCreacion?: string;
}

interface ChatMessengerProps {
  pedidoId: string;
  clienteId?: string;
  clienteNombre: string;
  usuarioActualId: string;
  usuarioActualTipo: "admin" | "cliente";
  usuarioActualNombre?: string;
  tituloChat?: string; // Título personalizado del chat (opcional)
  infoPedido?: InfoPedido; // Información del pedido para mostrar anclada (opcional)
  open: boolean;
  onClose: () => void;
  onNuevoMensaje?: () => void;
}

const ChatMessenger: React.FC<ChatMessengerProps> = ({
  pedidoId,
  clienteNombre,
  usuarioActualId,
  usuarioActualTipo,
  usuarioActualNombre,
  tituloChat,
  infoPedido,
  open,
  onClose,
  onNuevoMensaje,
}) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      cargarMensajes();
      // Polling cada 1 segundo para comunicación en tiempo real
      const intervalId = setInterval(() => {
        cargarMensajes();
      }, 1000);
      return () => clearInterval(intervalId);
    } else {
      setCargando(false);
    }
  }, [open, pedidoId]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const cargarMensajes = async (preservarTemporales = false) => {
    try {
      const token = localStorage.getItem(
        usuarioActualTipo === "admin" ? "access_token" : "cliente_access_token"
      );
      
      if (!token) {
        console.warn("⚠️ No hay token para cargar mensajes");
        return;
      }
      
      const res = await fetch(`${apiUrl}/mensajes/pedido/${pedidoId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const mensajesData = Array.isArray(data) ? data : [];
        
        if (preservarTemporales) {
          // Combinar mensajes del backend con mensajes temporales (sin _id)
          setMensajes(prev => {
            // Mantener mensajes temporales (sin _id) que aún no están en el backend
            const temporales = prev.filter(m => !m._id);
            
            // Combinar y eliminar duplicados
            const todosMensajes = [...mensajesData, ...temporales];
            
            // Eliminar duplicados: si un mensaje temporal coincide con uno del backend (mismo texto y remitente en los últimos 5 segundos), mantener solo el del backend
            const mensajesUnicos = todosMensajes.filter((mensaje, index, arr) => {
              if (!mensaje._id) return true; // Siempre mantener temporales
              
              // Buscar si hay un temporal que coincida
              const fechaMensaje = new Date(mensaje.fecha || mensaje.createdAt || 0).getTime();
              
              return !arr.some((otro, otroIndex) => {
                if (otroIndex === index || otro._id) return false;
                const fechaOtro = new Date(otro.fecha || 0).getTime();
                const diffTiempo = Math.abs(fechaMensaje - fechaOtro);
                return (
                  otro.mensaje === mensaje.mensaje &&
                  otro.remitente_id === mensaje.remitente_id &&
                  diffTiempo < 5000 // 5 segundos de tolerancia
                );
              });
            });
            
            // Ordenar por fecha
            return mensajesUnicos.sort((a, b) => 
              new Date(a.fecha || a.createdAt || 0).getTime() - new Date(b.fecha || b.createdAt || 0).getTime()
            );
          });
        } else {
          // Actualización normal: reemplazar todo
          const mensajesOrdenados = mensajesData.sort((a, b) => 
            new Date(a.fecha || a.createdAt || 0).getTime() - new Date(b.fecha || b.createdAt || 0).getTime()
          );
          setMensajes(mensajesOrdenados);
        }
      } else if (res.status === 404) {
        // Si no hay mensajes aún, mantener mensajes temporales si existen
        if (!preservarTemporales) {
          setMensajes(prev => prev.filter(m => m._id)); // Solo mantener los que tienen _id del backend
        }
        // No hacer nada si preservarTemporales = true, mantiene los mensajes actuales
      } else {
        console.error("Error al cargar mensajes:", res.status, await res.text().catch(() => ""));
        // En caso de error, mantener los mensajes actuales
      }
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
      // En caso de error, mantener los mensajes actuales
    } finally {
      setCargando(false);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    const mensajeTexto = nuevoMensaje.trim();
    const mensajeTemporal: Mensaje = {
      pedido_id: pedidoId,
      remitente_id: usuarioActualId,
      remitente_tipo: usuarioActualTipo,
      remitente_nombre: usuarioActualNombre || (usuarioActualTipo === "admin" ? "Administrador" : clienteNombre),
      mensaje: mensajeTexto,
      fecha: new Date().toISOString(),
      leido: false,
    };

    // Optimistic update: mostrar el mensaje inmediatamente
    setMensajes(prev => [...prev, mensajeTemporal]);
    setNuevoMensaje("");
    scrollToBottom();

    setEnviando(true);
    try {
      const token = localStorage.getItem(
        usuarioActualTipo === "admin" ? "access_token" : "cliente_access_token"
      );

      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const mensajeData = {
        pedido_id: pedidoId,
        remitente_id: usuarioActualId,
        remitente_tipo: usuarioActualTipo,
        remitente_nombre: usuarioActualNombre || (usuarioActualTipo === "admin" ? "Administrador" : clienteNombre),
        mensaje: mensajeTexto,
      };

      console.log("📤 Enviando mensaje:", mensajeData);

      const res = await fetch(`${apiUrl}/mensajes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(mensajeData),
      });

      if (res.ok) {
        const respuestaBackend = await res.json();
        console.log("✅ Mensaje enviado exitosamente:", respuestaBackend);
        
        // El backend puede retornar el mensaje en formato { message: "...", mensaje: {...} }
        // o directamente como el objeto mensaje
        const mensajeRespuesta = respuestaBackend.mensaje || respuestaBackend;
        
        console.log("📝 Mensaje extraído del backend:", mensajeRespuesta);
        
        // Actualizar el mensaje temporal con los datos del backend
        setMensajes(prev => {
          // Buscar el mensaje temporal que coincide
          const mensajeIndex = prev.findIndex(m => 
            !m._id && 
            m.mensaje === mensajeTexto && 
            m.remitente_id === usuarioActualId &&
            Math.abs(new Date(m.fecha).getTime() - Date.now()) < 10000 // 10 segundos de tolerancia
          );
          
          if (mensajeIndex !== -1 && mensajeRespuesta) {
            // Reemplazar el mensaje temporal con el mensaje real del backend
            const mensajeConId = {
              ...mensajeRespuesta,
              _id: mensajeRespuesta._id || mensajeRespuesta.id,
              fecha: mensajeRespuesta.fecha || mensajeRespuesta.createdAt || mensajeTemporal.fecha
            };
            
            const nuevos = [...prev];
            nuevos[mensajeIndex] = mensajeConId;
            console.log("🔄 Mensaje temporal reemplazado con datos del backend:", mensajeConId);
            return nuevos;
          } else if (mensajeRespuesta && (mensajeRespuesta._id || mensajeRespuesta.id)) {
            // Si no se encontró el temporal pero hay mensaje del backend, agregarlo
            const mensajeConId = {
              ...mensajeRespuesta,
              _id: mensajeRespuesta._id || mensajeRespuesta.id
            };
            console.log("➕ Agregando mensaje del backend:", mensajeConId);
            return [...prev, mensajeConId];
          } else {
            // Si no hay datos del backend, mantener los mensajes actuales (incluyendo el temporal)
            console.log("⚠️ No se pudo extraer mensaje del backend, manteniendo mensajes actuales");
            return prev;
          }
        });
        
        // Recargar mensajes para sincronizar (pero preservando temporales ya manejados arriba)
        // Solo hacer esto después de un pequeño delay para dar tiempo al backend
        setTimeout(() => {
          cargarMensajes(true);
        }, 500);
        
        // Notificar que hay un nuevo mensaje
        if (onNuevoMensaje) onNuevoMensaje();
      } else {
        const errorData = await res.json().catch(() => ({ detail: "Error desconocido" }));
        console.error("❌ Error al enviar mensaje:", errorData);
        
        // Revertir optimistic update - buscar por contenido, no por referencia
        setMensajes(prev => prev.filter(m => {
          // Mantener todos excepto el mensaje temporal que coincide con este
          if (!m._id && 
              m.mensaje === mensajeTexto && 
              m.remitente_id === usuarioActualId &&
              Math.abs(new Date(m.fecha).getTime() - new Date(mensajeTemporal.fecha).getTime()) < 1000) {
            return false; // Eliminar este mensaje temporal
          }
          return true;
        }));
        setNuevoMensaje(mensajeTexto);
        
        alert(`Error al enviar mensaje: ${errorData.detail || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("❌ Error al enviar mensaje:", error);
      
      // Revertir optimistic update - buscar por contenido
      setMensajes(prev => prev.filter(m => {
        if (!m._id && 
            m.mensaje === mensajeTexto && 
            m.remitente_id === usuarioActualId &&
            Math.abs(new Date(m.fecha).getTime() - new Date(mensajeTemporal.fecha).getTime()) < 1000) {
          return false;
        }
        return true;
      }));
      setNuevoMensaje(mensajeTexto);
      
      alert(`Error al enviar el mensaje: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setEnviando(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    try {
      const date = new Date(fecha);
      const ahora = new Date();
      const diffMs = ahora.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Ahora";
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} h`;
      
      return date.toLocaleDateString("es-VE", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fecha;
    }
  };

  // Persistir estado del chat abierto en localStorage
  useEffect(() => {
    if (open) {
      // Guardar que este chat está abierto
      localStorage.setItem(`chat_${pedidoId}_abierto`, "true");
    }
  }, [open, pedidoId]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Si se intenta cerrar, solo minimizar pero mantener datos
      if (!isOpen) {
        onClose();
      }
    }}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg h-[600px] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <DialogTitle className="text-lg font-semibold">
                {tituloChat ? tituloChat : `Chat - ${clienteNombre}`}
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Información del Pedido Anclada (solo si se proporciona infoPedido y no es chat de soporte) */}
        {infoPedido && !pedidoId.startsWith('soporte_') && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-3 text-sm">
              <Package className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                {infoPedido.numeroPedido && (
                  <span className="font-semibold text-blue-900">
                    Pedido #{infoPedido.numeroPedido}
                  </span>
                )}
                {infoPedido.total !== undefined && (
                  <span className="ml-2 text-blue-700">
                    • ${infoPedido.total.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
                {infoPedido.estado && (
                  <Badge 
                    variant="outline" 
                    className="ml-2 text-xs"
                    style={{
                      backgroundColor: infoPedido.estado === 'pendiente' ? '#FEF3C7' :
                                     infoPedido.estado === 'en proceso' ? '#DBEAFE' :
                                     infoPedido.estado === 'completado' ? '#D1FAE5' : '#F3F4F6',
                      borderColor: infoPedido.estado === 'pendiente' ? '#F59E0B' :
                                  infoPedido.estado === 'en proceso' ? '#3B82F6' :
                                  infoPedido.estado === 'completado' ? '#10B981' : '#6B7280',
                      color: infoPedido.estado === 'pendiente' ? '#92400E' :
                            infoPedido.estado === 'en proceso' ? '#1E40AF' :
                            infoPedido.estado === 'completado' ? '#065F46' : '#374151'
                    }}
                  >
                    {infoPedido.estado}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
          {cargando ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : mensajes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No hay mensajes aún. ¡Inicia la conversación!</p>
            </div>
          ) : (
            mensajes.map((msg) => {
              const esMio = msg.remitente_id === usuarioActualId;
              return (
                <div
                  key={msg._id || Math.random()}
                  className={`flex ${esMio ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      esMio
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    {!esMio && (
                      <p className="text-xs font-semibold mb-1 opacity-75">
                        {msg.remitente_nombre || "Usuario"}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.mensaje}</p>
                    <p
                      className={`text-xs mt-1 ${
                        esMio ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {formatearFecha(msg.fecha)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={mensajesEndRef} />
        </div>

        {/* Input de mensaje */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <Input
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviarMensaje();
                }
              }}
              placeholder="Escribe un mensaje..."
              className="flex-1"
              disabled={enviando}
            />
            <Button
              onClick={enviarMensaje}
              disabled={enviando || !nuevoMensaje.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {enviando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatMessenger;

