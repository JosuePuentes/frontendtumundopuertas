import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

const MisPedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPedidos();
  }, []);

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
        setPedidos(data);
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
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
          {pedidos.map((pedido) => (
            <Card key={pedido._id} className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-bold">Pedido #{pedido._id.slice(-6)}</h3>
                  <p className="text-gray-400 text-sm">Fecha: {new Date(pedido.fecha_creacion).toLocaleDateString()}</p>
                  <p className="text-gray-400 text-sm">Estado: {pedido.estado_general || pedido.estado}</p>
                </div>
                <p className="text-cyan-400 font-bold text-xl">${pedido.montoTotal || 0}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisPedidos;

