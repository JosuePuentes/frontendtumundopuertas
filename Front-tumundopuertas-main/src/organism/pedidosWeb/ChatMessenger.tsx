import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";

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

interface ChatMessengerProps {
  pedidoId: string;
  clienteId?: string;
  clienteNombre: string;
  usuarioActualId: string;
  usuarioActualTipo: "admin" | "cliente";
  usuarioActualNombre?: string;
  tituloChat?: string; // Título personalizado del chat (opcional)
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
      // Polling cada 3 segundos para nuevos mensajes
      const intervalId = setInterval(cargarMensajes, 3000);
      return () => clearInterval(intervalId);
    }
  }, [open, pedidoId]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const cargarMensajes = async () => {
    try {
      const token = localStorage.getItem(
        usuarioActualTipo === "admin" ? "access_token" : "cliente_access_token"
      );
      
      const res = await fetch(`${apiUrl}/mensajes/pedido/${pedidoId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const mensajesData = Array.isArray(data) ? data : [];
        setMensajes(mensajesData.sort((a, b) => 
          new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        ));
      }
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    } finally {
      setCargando(false);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    setEnviando(true);
    try {
      const token = localStorage.getItem(
        usuarioActualTipo === "admin" ? "access_token" : "cliente_access_token"
      );

      const mensajeData = {
        pedido_id: pedidoId,
        remitente_id: usuarioActualId,
        remitente_tipo: usuarioActualTipo,
        remitente_nombre: usuarioActualNombre || (usuarioActualTipo === "admin" ? "Administrador" : clienteNombre),
        mensaje: nuevoMensaje.trim(),
      };

      const res = await fetch(`${apiUrl}/mensajes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(mensajeData),
      });

      if (res.ok) {
        setNuevoMensaje("");
        await cargarMensajes();
        if (onNuevoMensaje) onNuevoMensaje();
      } else {
        const errorData = await res.json();
        alert(`Error al enviar mensaje: ${errorData.detail || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      alert("Error al enviar el mensaje");
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
                {tituloChat || `Chat - ${clienteNombre}`}
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

