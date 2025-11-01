import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

const Facturas: React.FC = () => {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarFacturas();
  }, []);

  const cargarFacturas = async () => {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("cliente_access_token");
      const clienteId = localStorage.getItem("cliente_id");
      const res = await fetch(`${apiUrl}/facturas/cliente/${clienteId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFacturas(data);
      }
    } catch (error) {
      console.error("Error al cargar facturas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12"><p className="text-gray-300">Cargando facturas...</p></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">Mis Facturas</h2>
      {facturas.length === 0 ? (
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <p className="text-gray-400 text-center">No tienes facturas registradas</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {facturas.map((factura) => (
            <Card key={factura._id} className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-bold">{factura.numeroFactura || factura.numero_factura}</h3>
                  <p className="text-gray-400 text-sm">Fecha: {new Date(factura.fechaFacturacion || factura.fecha_facturacion).toLocaleDateString()}</p>
                </div>
                <p className="text-cyan-400 font-bold text-xl">${factura.montoTotal || 0}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Facturas;

