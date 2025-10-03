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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // New state for confirmation
  const [selectedPedidoForInvoice, setSelectedPedidoForInvoice] = useState<PedidoConPagos | null>(null);
  const [showPreliminarModal, setShowPreliminarModal] = useState(false);
  const [selectedPedidoForPreliminar, setSelectedPedidoForPreliminar] = useState<PedidoConPagos | null>(null);

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
      setShowInvoiceModal(true); // Show invoice modal
    } catch (err: any) {
      setError(err.message || "Error desconocido al totalizar");
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-print-section");
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printContents = printContent.innerHTML;

      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Reload to restore original page content and functionality
    } else {
      console.error("Could not find print section");
    }
  };

  const handlePrintPreliminar = () => {
    const printContent = document.getElementById("preliminar-print-section");
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printContents = printContent.innerHTML;

      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Reload to restore original page content and functionality
    } else {
      console.error("Could not find print section");
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

        {/* Invoice Modal */}
        <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
          <DialogContent className="sm:max-w-[600px] p-6 mx-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                {selectedPedidoForInvoice?.pago === "pagado" ? "Nota de Entrega" : "Comprobante de Abono"}
              </DialogTitle>
              <DialogDescription className="text-center">
                Detalle de la transacción y el pedido.
              </DialogDescription>
            </DialogHeader>
            {selectedPedidoForInvoice && (
              <div id="invoice-print-section" className="mt-4 space-y-4 text-sm p-4 border rounded-md bg-white">
                {/* Company Details */}
                <div className="border-b pb-2 mb-4 text-center">
                  <p className="font-bold text-xl text-gray-800">J507172554 TU MUNDO PUERTAS, C.A.</p>
                  <p className="text-gray-600">DOMICILIO FISCAL AV 50 CASA NRO 158-79 BARRIO RAFAEL URDANETA SUR SAN</p>
                  <p className="text-gray-600">FRANCISCO ZULIA ZONA POSTAL 4004</p>
                </div>

                {/* Client Details */}
                <div className="border-b pb-2 mb-4">
                  <p className="font-bold text-base text-gray-700">Cliente: {selectedPedidoForInvoice.cliente_nombre}</p>
                  {/* Add more client details if available in pedido object */}
                </div>

                {/* Items */}
                <div className="mb-4">
                  <p className="font-bold mb-2 text-base text-gray-700">Items del Pedido:</p>
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Código</TableHead>
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Descripción</TableHead>
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cantidad</TableHead>
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Precio Unitario</TableHead>
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Item</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPedidoForInvoice.items.map((item, idx) => (
                        <TableRow key={idx} className="border-b hover:bg-gray-50">
                          <TableCell className="py-2 px-4 whitespace-nowrap">{item.codigo}</TableCell>
                          <TableCell className="py-2 px-4">{item.nombre} - {item.descripcion}</TableCell>
                          <TableCell className="py-2 px-4 whitespace-nowrap text-center">{(item.cantidad || 0)}</TableCell>
                          <TableCell className="py-2 px-4 whitespace-nowrap text-right">${(item.precio || 0).toFixed(2)}</TableCell>
                          <TableCell className="py-2 px-4 whitespace-nowrap text-right">${((item.precio || 0) * (item.cantidad || 0)).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Abonos */}
                <div className="mb-4">
                  <p className="font-bold mb-2 text-base text-gray-700">Historial de Abonos:</p>
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</TableHead>
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Monto Abonado</TableHead>
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPedidoForInvoice.historial_pagos?.map((pago, idx) => (
                        <TableRow key={idx} className="border-b hover:bg-gray-50">
                          <TableCell className="py-2 px-4 whitespace-nowrap">{new Date(pago.fecha).toLocaleDateString()}</TableCell>
                          <TableCell className="py-2 px-4 whitespace-nowrap text-right">${(pago.monto || 0).toFixed(2)}</TableCell>
                          <TableCell className="py-2 px-4 whitespace-nowrap">{pago.estado}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals */}
                <div className="text-right font-bold text-lg mt-6 p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-800">Total Pedido: <span className="text-blue-600">${(calculateTotalPedido(selectedPedidoForInvoice) || 0).toFixed(2)}</span></p>
                  <p className="text-gray-800">Total Abonado: <span className="text-green-600">${selectedPedidoForInvoice.pago === "pagado" ? calculateTotalPedido(selectedPedidoForInvoice).toFixed(2) : (selectedPedidoForInvoice.total_abonado || 0).toFixed(2)}</span></p>
                  <p className="text-gray-800">Monto Pendiente: <span className="text-red-600">${selectedPedidoForInvoice.pago === "pagado" ? (0).toFixed(2) : ((calculateTotalPedido(selectedPedidoForInvoice) || 0) - (selectedPedidoForInvoice.total_abonado || 0)).toFixed(2)}</span></p>
                </div>
              </div>
            )}
            <DialogFooter className="mt-6 flex justify-between">
              <Button onClick={() => setShowInvoiceModal(false)} variant="outline">Cerrar</Button>
              <Button onClick={handlePrint} className="bg-green-500 hover:bg-green-600 text-white">Imprimir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preliminar Modal */}
        <Dialog open={showPreliminarModal} onOpenChange={setShowPreliminarModal}>
          <DialogContent className="sm:max-w-[600px] p-6 mx-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Recibo Preliminar</DialogTitle>
              <DialogDescription className="text-center">
                Información preliminar del pedido y sus pagos.
              </DialogDescription>
            </DialogHeader>
            {selectedPedidoForPreliminar && (
              <div id="preliminar-print-section" className="mt-4 space-y-4 text-sm p-4 border rounded-md bg-white">
                {/* Company Details */}
                <div className="border-b pb-2 mb-4 text-center">
                  <p className="font-bold text-xl text-gray-800">J507172554 TU MUNDO PUERTAS, C.A.</p>
                  <p className="text-gray-600">DOMICILIO FISCAL AV 50 CASA NRO 158-79 BARRIO RAFAEL URDANETA SUR SAN</p>
                  <p className="text-gray-600">FRANCISCO ZULIA ZONA POSTAL 4004</p>
                </div>

                {/* Client Details */}
                <div className="border-b pb-2 mb-4">
                  <p className="font-bold text-base text-gray-700">Cliente: {selectedPedidoForPreliminar.cliente_nombre}</p>
                </div>

                {/* Items */}
                <div className="mb-4">
                  <p className="font-bold mb-2 text-base text-gray-700">Items del Pedido:</p>
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Código</TableHead>
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Descripción</TableHead>
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cantidad</TableHead>
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Precio Unitario</TableHead>
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Item</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPedidoForPreliminar.items.map((item, idx) => (
                        <TableRow key={idx} className="border-b hover:bg-gray-50">
                          <TableCell className="py-2 px-4 whitespace-nowrap">{item.codigo}</TableCell>
                          <TableCell className="py-2 px-4">{item.nombre} - {item.descripcion}</TableCell>
                          <TableCell className="py-2 px-4 whitespace-nowrap text-center">{(item.cantidad || 0)}</TableCell>
                          <TableCell className="py-2 px-4 whitespace-nowrap text-right">${(item.precio || 0).toFixed(2)}</TableCell>
                          <TableCell className="py-2 px-4 whitespace-nowrap text-right">${((item.precio || 0) * (item.cantidad || 0)).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Abonos */}
                <div className="mb-4">
                  <p className="font-bold mb-2 text-base text-gray-700">Historial de Abonos:</p>
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</TableHead>
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Monto Abonado</TableHead>
                        <TableHead className="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPedidoForPreliminar.historial_pagos?.map((pago, idx) => (
                        <TableRow key={idx} className="border-b hover:bg-gray-50">
                          <TableCell className="py-2 px-4 whitespace-nowrap">{new Date(pago.fecha).toLocaleDateString()}</TableCell>
                          <TableCell className="py-2 px-4 whitespace-nowrap text-right">${(pago.monto || 0).toFixed(2)}</TableCell>
                          <TableCell className="py-2 px-4 whitespace-nowrap">{pago.estado}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals */}
                <div className="text-right font-bold text-lg mt-6 p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-800">Total Pedido: <span className="text-blue-600">${(calculateTotalPedido(selectedPedidoForPreliminar) || 0).toFixed(2)}</span></p>
                  <p className="text-gray-800">Total Abonado: <span className="text-green-600">${(selectedPedidoForPreliminar.total_abonado || 0).toFixed(2)}</span></p>
                  <p className="text-gray-800">Monto Pendiente: <span className="text-red-600">${((calculateTotalPedido(selectedPedidoForPreliminar) || 0) - (selectedPedidoForPreliminar.total_abonado || 0)).toFixed(2)}</span></p>
                </div>
              </div>
            )}
            <DialogFooter className="mt-6 flex justify-between">
              <Button onClick={() => setShowPreliminarModal(false)} variant="outline">Cerrar</Button>
              <Button onClick={handlePrintPreliminar} className="bg-green-500 hover:bg-green-600 text-white">Imprimir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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