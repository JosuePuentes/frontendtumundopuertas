import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import PreliminarImpresion from "@/organism/formatosImpresion/PreliminarImpresion";
import NotaEntregaImpresion from "@/organism/formatosImpresion/NotaEntregaImpresion";

interface Pago {
  fecha: string;
  monto: number;
  estado: string;
}

interface PedidoConPagos {
  _id: string;
  cliente_id: string; // Added
  cliente_nombre: string;
  pago?: string;
  historial_pagos?: Pago[];
  items: any[]; // Assuming items are part of the pedido
  total_abonado: number; // Assuming this field exists
}

const MisPagos: React.FC = () => {
  const [pagos, setPagos] = useState<PedidoConPagos[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState<string>(""); // Added state for client filter
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // New state for confirmation
  const [selectedPedidoForInvoice, setSelectedPedidoForInvoice] = useState<PedidoConPagos | null>(null);
  const [showPreliminarModal, setShowPreliminarModal] = useState(false);
  const [selectedPedidoForPreliminar, setSelectedPedidoForPreliminar] = useState<PedidoConPagos | null>(null);
  const [showNotaEntregaModal, setShowNotaEntregaModal] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL.replace('http://', 'https://');

  const fetchPagos = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append("fecha_inicio", fechaInicio);
      if (fechaFin) params.append("fecha_fin", fechaFin);

      const res = await fetch(`${apiUrl}/pedidos/mis-pagos?${params.toString()}`);
      if (!res.ok) throw new Error("Error al obtener pagos");

      const data = await res.json();
      setPagos(data);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagos();
  }, []);

  const handleTotalizarClick = (pedido: PedidoConPagos) => {
    setSelectedPedidoForInvoice(pedido);
    setShowConfirmationModal(true); // Show confirmation modal first
  };

  const handlePreliminarClick = (pedido: PedidoConPagos) => {
    setSelectedPedidoForPreliminar(pedido);
    setShowPreliminarModal(true);
  };

  const handleConfirmTotalizar = async () => {
    if (!selectedPedidoForInvoice) return;

    try {
      const res = await fetch(`${apiUrl}/pedidos/${selectedPedidoForInvoice._id}/totalizar-pago`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Error al totalizar el pago");

      await fetchPagos(); // Refresh payments
      setShowConfirmationModal(false); // Close confirmation modal
      setShowNotaEntregaModal(true); // Show nota de entrega modal
    } catch (err: any) {
      setError(err.message || "Error desconocido al totalizar");
    }
  };


  const calculateTotalPedido = (pedido: PedidoConPagos) => {
    return (pedido.items || []).reduce((sum, item) => sum + ((item.precio || 0) * (item.cantidad || 0)), 0);
  };

  return (
    <Card className="w-full shadow-md rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800">
          Mis Pagos
        </CardTitle>
        <p className="text-sm text-gray-500">
          Consulta de pagos registrados en tus pedidos
        </p>
      </CardHeader>
      <CardContent>
        {/* Filtros de fecha y cliente */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="sm:w-1/3"
            placeholder="Fecha inicio"
          />
          <Input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="sm:w-1/3"
            placeholder="Fecha fin"
          />
          <Input
            type="text"
            value={clienteFiltro}
            onChange={(e) => setClienteFiltro(e.target.value)}
            className="sm:w-1/3"
            placeholder="Buscar por nombre de cliente..."
          />
          <Button onClick={fetchPagos} className="sm:w-auto w-full">
            Buscar
          </Button>
        </div>

        {/* Estados de carga */}
        {loading ? (
          <div className="flex justify-center items-center py-8 text-gray-600">
            <Loader2 className="animate-spin w-6 h-6 mr-2" />
            Cargando pagos...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center text-red-600 py-6">
            <AlertCircle className="w-5 h-5 mr-2" />
            Error: {error}
          </div>
        ) : pagos.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            No hay pagos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Cliente</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total Pedido</TableHead>
                  <TableHead>Monto Abonado</TableHead>
                  <TableHead>Monto Pendiente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos
                  .filter((pedido) =>
                    clienteFiltro.trim() === ""
                      ? true
                      : (pedido.cliente_nombre || "").toLowerCase().includes(clienteFiltro.trim().toLowerCase())
                  )
                  .sort((a, b) => {
                    // Obtener fecha más reciente de todo el historial_pagos (ordenar fechas y tomar la más reciente)
                    const getFechaMasReciente = (pedido: PedidoConPagos): number => {
                      if (!pedido.historial_pagos || pedido.historial_pagos.length === 0) {
                        return 0;
                      }
                      // Ordenar fechas descendente y tomar la primera (más reciente)
                      const fechas = pedido.historial_pagos
                        .map(pago => new Date(pago.fecha).getTime())
                        .sort((a, b) => b - a);
                      return fechas[0] || 0;
                    };
                    
                    const fechaA = getFechaMasReciente(a);
                    const fechaB = getFechaMasReciente(b);
                    
                    // Ordenar descendente (fechas más recientes primero)
                    return fechaB - fechaA;
                  })
                  .map((pedido) => {
                  const totalPedido = calculateTotalPedido(pedido);
                  const montoAbonado = pedido.total_abonado || 0;
                  const montoPendiente = totalPedido - montoAbonado;

                  return (
                    <TableRow key={pedido._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {pedido.cliente_id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {pedido.cliente_nombre}
                      </TableCell>
                      <TableCell>
                        {pedido.historial_pagos?.[0]?.fecha
                          ? new Date(pedido.historial_pagos[0].fecha).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>${totalPedido.toFixed(2)}</TableCell>
                      <TableCell>${montoAbonado.toFixed(2)}</TableCell>
                      <TableCell>${montoPendiente.toFixed(2)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            pedido.pago === "pagado"
                              ? "bg-green-200 text-green-800"
                              : pedido.pago === "abonado"
                              ? "bg-yellow-200 text-yellow-800"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {pedido.pago}
                        </span>
                      </TableCell>
                      <TableCell className="flex gap-2">
                          <Button
                            onClick={() => handleTotalizarClick(pedido)}
                            size="sm"
                            variant="outline"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            Totalizar
                          </Button>
                          <Button
                            onClick={() => handlePreliminarClick(pedido)}
                            size="sm"
                            variant="outline"
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            Preliminar
                          </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Nota de Entrega Modal */}
        {selectedPedidoForInvoice && (
          <NotaEntregaImpresion
            isOpen={showNotaEntregaModal}
            onClose={() => {
              setShowNotaEntregaModal(false);
              setSelectedPedidoForInvoice(null);
            }}
            pedido={selectedPedidoForInvoice}
          />
        )}

        {/* Preliminar Modal */}
        {selectedPedidoForPreliminar && (
          <PreliminarImpresion
            isOpen={showPreliminarModal}
            onClose={() => {
              setShowPreliminarModal(false);
              setSelectedPedidoForPreliminar(null);
            }}
            pedido={selectedPedidoForPreliminar}
          />
        )}

        {/* Confirmation Modal */}
        <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
          <DialogContent className="bg-white p-6 rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>Confirmar Totalización</DialogTitle>
              <DialogDescription>
                {selectedPedidoForInvoice?.pago === "pagado"
                  ? "Este pedido ya está marcado como completamente pagado. ¿Deseas continuar con la totalización?"
                  : `Este pedido ${selectedPedidoForInvoice?.pago === "abonado" ? "ha sido abonado parcialmente" : "no ha recibido abonos"}. Al confirmar, se marcará como completamente pagado. ¿Deseas continuar?`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end space-x-2 mt-4">
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={() => setShowConfirmationModal(false)}>Cancelar</Button>
              <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={handleConfirmTotalizar}>Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MisPagos;