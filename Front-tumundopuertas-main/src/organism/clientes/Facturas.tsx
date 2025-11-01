import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, DollarSign, Calendar } from "lucide-react";
import ModalAbonarFactura from "./ModalAbonarFactura";

interface Factura {
  _id: string;
  numeroFactura?: string;
  numero_factura?: string;
  montoTotal?: number;
  monto_total?: number;
  montoAbonado?: number;
  monto_abonado?: number;
  saldoPendiente?: number;
  saldo_pendiente?: number;
  fechaFacturacion?: string;
  fecha_facturacion?: string;
  pedidoId?: string;
  pedido_id?: string;
}

const Facturas: React.FC = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [modalAbonarAbierto, setModalAbonarAbierto] = useState(false);

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
        // Normalizar datos
        const facturasNormalizadas = Array.isArray(data) ? data.map((factura: any) => ({
          _id: factura._id || factura.id,
          numeroFactura: factura.numeroFactura || factura.numero_factura || "Sin número",
          montoTotal: factura.montoTotal || factura.monto_total || 0,
          montoAbonado: factura.montoAbonado || factura.monto_abonado || 0,
          saldoPendiente: factura.saldoPendiente || factura.saldo_pendiente || (factura.montoTotal || factura.monto_total || 0) - (factura.montoAbonado || factura.monto_abonado || 0),
          fechaFacturacion: factura.fechaFacturacion || factura.fecha_facturacion || factura.createdAt,
          pedidoId: factura.pedidoId || factura.pedido_id,
        })) : [];
        setFacturas(facturasNormalizadas);
      }
    } catch (error) {
      console.error("Error al cargar facturas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAbonar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setModalAbonarAbierto(true);
  };

  const handleAbonoEnviado = () => {
    cargarFacturas(); // Recargar facturas después del abono
    setModalAbonarAbierto(false);
    setFacturaSeleccionada(null);
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "Fecha no disponible";
    try {
      return new Date(fecha).toLocaleDateString("es-VE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Fecha inválida";
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
          {facturas.map((factura) => {
            const montoTotal = factura.montoTotal || 0;
            const montoAbonado = factura.montoAbonado || 0;
            const saldoPendiente = factura.saldoPendiente || (montoTotal - montoAbonado);
            const estaPagada = saldoPendiente <= 0;

            return (
              <Card key={factura._id} className="bg-gray-800/50 border-gray-700 hover:border-cyan-400/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white flex items-center gap-2 mb-2">
                        <Receipt className="w-5 h-5" />
                        {factura.numeroFactura || `Factura #${factura._id.slice(-6)}`}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{formatearFecha(factura.fechaFacturacion)}</span>
                      </div>
                    </div>
                    {estaPagada && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Pagada
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Monto Total</p>
                      <p className="text-white font-bold text-xl">${montoTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Monto Abonado</p>
                      <p className="text-cyan-400 font-bold text-xl">${montoAbonado.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Saldo Pendiente</p>
                      <p className={`font-bold text-xl ${saldoPendiente > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        ${saldoPendiente.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {!estaPagada && (
                    <div className="pt-4 border-t border-gray-700">
                      <Button
                        onClick={() => handleAbonar(factura)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Abonar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Abonar */}
      {facturaSeleccionada && (
        <ModalAbonarFactura
          open={modalAbonarAbierto}
          onClose={() => {
            setModalAbonarAbierto(false);
            setFacturaSeleccionada(null);
          }}
          factura={facturaSeleccionada}
          onAbonoEnviado={handleAbonoEnviado}
        />
      )}
    </div>
  );
};

export default Facturas;

