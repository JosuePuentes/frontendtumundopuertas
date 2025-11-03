import React, { useState, useEffect } from "react";
import ChatMessenger from "../pedidosWeb/ChatMessenger";

const Soporte: React.FC = () => {
  const clienteId = localStorage.getItem("cliente_id") || "";
  const clienteNombre = localStorage.getItem("cliente_nombre") || "Cliente";
  
  // ID especial para soporte: "soporte_{cliente_id}"
  const soportePedidoId = `soporte_${clienteId}`;
  
  // Persistir estado del chat abierto en localStorage
  const [chatAbierto, setChatAbierto] = useState<boolean>(() => {
    const saved = localStorage.getItem(`soporte_chat_abierto_${clienteId}`);
    return saved === "true";
  });

  // Guardar estado del chat cuando cambie
  useEffect(() => {
    localStorage.setItem(`soporte_chat_abierto_${clienteId}`, chatAbierto.toString());
  }, [chatAbierto, clienteId]);

  // Cargar estado persistido al montar
  useEffect(() => {
    // Asegurarse de que el chat esté abierto por defecto para soporte
    if (!localStorage.getItem(`soporte_chat_abierto_${clienteId}`)) {
      setChatAbierto(true);
    }
  }, [clienteId]);

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-3xl font-bold text-white mb-6">Soporte</h2>
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-gray-300 mb-4">
        <p className="text-sm">
          Si tienes alguna pregunta o necesitas ayuda, escríbenos aquí. Te responderemos lo antes posible.
        </p>
      </div>
      
      {/* Chat de Soporte - Siempre visible */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg">
        <ChatMessenger
          pedidoId={soportePedidoId}
          clienteId={clienteId}
          clienteNombre={clienteNombre}
          usuarioActualId={clienteId}
          usuarioActualTipo="cliente"
          usuarioActualNombre={clienteNombre}
          tituloChat="Tu Mundo Puertas"
          open={chatAbierto}
          onClose={() => {
            // No permitir cerrar completamente, solo minimizar
            setChatAbierto(false);
            // Guardar estado
            localStorage.setItem(`soporte_chat_abierto_${clienteId}`, "false");
          }}
          onNuevoMensaje={() => {
            // Notificar cuando hay un nuevo mensaje
          }}
        />
      </div>
      
      {/* Botón para abrir chat si está cerrado */}
      {!chatAbierto && (
        <button
          onClick={() => {
            setChatAbierto(true);
            localStorage.setItem(`soporte_chat_abierto_${clienteId}`, "true");
          }}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
        >
          Abrir Chat de Soporte
        </button>
      )}
    </div>
  );
};

export default Soporte;
