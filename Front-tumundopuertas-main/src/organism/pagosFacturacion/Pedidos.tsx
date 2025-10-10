import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMetodosPago } from "@/hooks/useMetodosPago";

// Componente para gestionar pagos y abonos
const PagoManager: React.FC<{
  pedidoId: string;
  pagoInicial?: string;
  onSuccess?: () => void;
  metodosPago: any[];
}> = ({ pedidoId, pagoInicial, onSuccess, metodosPago }) => {
  const [monto, setMonto] = useState("");
  const [estado, setEstado] = useState(pagoInicial || "sin pago");
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Actualizar solo el estado del pago
  const actualizarEstado = async (nuevoEstado: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/${pedidoId}/pago`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pago: nuevoEstado }),
      });
      if (!res.ok) throw new Error("Error al actualizar estado");
      setEstado(nuevoEstado);
      setSuccess("Estado actualizado");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Registrar abono (actualiza estado y agrega al historial)
  const registrarAbono = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/${pedidoId}/pago`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pago: estado, monto: parseFloat(monto), metodo: selectedMetodoPago }),
      });
      if (!res.ok) throw new Error("Error al registrar abono");
      setSuccess("Abono registrado");
      setMonto("");
      
      // Refrescar métodos de pago para actualizar saldos
      // Nota: Los métodos de pago se refrescan desde el componente padre
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <select
        value={estado}
        onChange={e => actualizarEstado(e.target.value)}
        className="text-xs border rounded px-1 py-0.5"
        disabled={loading}
      >
        <option value="sin pago">Sin pago</option>
        <option value="abonado">Abonado</option>
        <option value="pagado">Pagado</option>
      </select>
      <div className="flex gap-1 mt-1">
        <Input
          type="number"
          placeholder="Abono"
          value={monto}
          onChange={e => setMonto(e.target.value)}
          className="text-xs w-24"
          disabled={loading}
        />
        <Select onValueChange={setSelectedMetodoPago} value={selectedMetodoPago || ""}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Método de pago" />
          </SelectTrigger>
          <SelectContent>
            {metodosPago.map((metodo: any, index: number) => {
              const metodoId = metodo._id || metodo.id || metodo.nombre || `metodo-${index}`;
              return (
                <SelectItem key={metodoId} value={metodoId}>
                  {metodo.nombre || 'Sin nombre'}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="text-xs px-2 py-1"
          onClick={registrarAbono}
          disabled={loading || !monto || isNaN(Number(monto)) || !selectedMetodoPago}
        >
          Abonar
        </Button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {success && <span className="text-xs text-green-600">{success}</span>}
    </div>
  );
};

interface PedidoItem {
  id: string;
  precio: number;
  cantidad: number;
}

interface RegistroPago {
  monto: number;
  fecha: string;
  metodo?: string;
}

interface Pedido {
  _id: string;
  cliente_nombre?: string;
  estado_general?: string;
  fecha_creacion?: string;
  pago?: string; // "sin pago" | "abonado" | "pagado"
  items?: PedidoItem[];
  historial_pagos?: RegistroPago[];
}

const ESTADOS = [
  "orden1",
  "orden2",
  "orden3",
  "orden4",
  "orden5",
  "orden6",
  "pendiente",
];

const Pedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { metodos: metodosPago, fetchMetodosPago } = useMetodosPago();

  // Fechas de filtro
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  // Filtro local por cliente
  const [clienteFiltro, setClienteFiltro] = useState<string>("");

  const refreshData = async () => {
    await Promise.all([
      fetchPedidos(),
      fetchMetodosPago()
    ]);
  };

  const fetchPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Construcción del query string
      let params = ESTADOS.map(
        (e) => `estado_general=${encodeURIComponent(e)}`
      ).join("&");
      if (fechaInicio) params += `&fecha_inicio=${fechaInicio}`;
      if (fechaFin) params += `&fecha_fin=${fechaFin}`;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/estado/?${params}`
      );
      if (!res.ok) throw new Error("Error al obtener pedidos");
      const data = await res.json();
      setPedidos(data);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };


  // Calcular suma de pagos realizados usando historial_pagos
  const sumaPagos = pedidos.reduce((acc, pedido) => {
    const sumaPedido = (pedido.historial_pagos || []).reduce(
      (a, pago) => a + (pago.monto || 0),
      0
    );
    return acc + sumaPedido;
  }, 0);

  return (
    <Card className="w-full shadow-md rounded-2xl max-w-5xl mx-auto px-1 sm:px-4">
      <CardHeader className="px-2 sm:px-6">
        <CardTitle className="text-lg sm:text-xl font-bold text-gray-800">
          Pedidos en Proceso
        </CardTitle>
        <p className="text-xs sm:text-sm text-gray-500">
          Estados: orden1 a orden6 y pendiente
        </p>
        <div className="mt-2 text-xs sm:text-sm text-green-700 font-semibold">
          Suma de pagos realizados: {sumaPagos.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
        </div>
      </CardHeader>
      <CardContent className="px-1 sm:px-6">
        {/* Controles de filtro */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col w-full sm:w-auto max-w-[110px]">
            <label className="text-xs sm:text-sm text-gray-600 mb-1">Fecha inicio</label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="text-xs sm:text-base px-1 py-1 min-w-0"
              style={{ width: "100px" }}
            />
          </div>
          <div className="flex flex-col w-full sm:w-auto max-w-[110px]">
            <label className="text-xs sm:text-sm text-gray-600 mb-1">Fecha fin</label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="text-xs sm:text-base px-1 py-1 min-w-0"
              style={{ width: "100px" }}
            />
          </div>
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-xs sm:text-sm text-gray-600 mb-1">Buscar cliente</label>
            <Input
              type="text"
              placeholder="Nombre del cliente"
              value={clienteFiltro}
              onChange={(e) => setClienteFiltro(e.target.value)}
              className="text-xs sm:text-base"
            />
          </div>
          <div className="flex items-end w-full sm:w-auto">
            <Button onClick={fetchPedidos} className="w-full sm:w-auto text-xs sm:text-base">Filtrar</Button>
          </div>
        </div>

        {/* Estados del fetch */}
        {loading ? (
          <div className="flex justify-center items-center py-8 text-gray-600">
            <Loader2 className="animate-spin w-6 h-6 mr-2" />
            Cargando pedidos...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center text-red-600 py-6">
            <AlertCircle className="w-5 h-5 mr-2" />
            Error: {error}
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            No hay pedidos en estos estados.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[600px] text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32 sm:w-1/4">ID</TableHead>
                  <TableHead className="w-32 sm:w-1/4">Cliente</TableHead>
                  <TableHead className="w-16 sm:w-20">Estado</TableHead>
                  <TableHead className="w-24 sm:w-1/4">Fecha</TableHead>
                  <TableHead className="w-24 sm:w-1/4">Pago</TableHead>
                  <TableHead className="w-24 sm:w-1/4">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos
                  .filter((pedido) =>
                    clienteFiltro.trim() === ""
                      ? true
                      : (pedido.cliente_nombre || "").toLowerCase().includes(clienteFiltro.trim().toLowerCase())
                  )
                  .map((pedido) => {
                  // Calcular el total del pedido
                  const total = (pedido.items || []).reduce(
                    (acc, item) => acc + (item.precio || 0) * (item.cantidad || 0),
                    0
                  );
                  return (
                    <TableRow key={pedido._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium break-all max-w-[120px]">
                        {pedido._id.slice(-4)}
                      </TableCell>
                      <TableCell className="break-words max-w-[120px]">{pedido.cliente_nombre || "-"}</TableCell>
                      <TableCell>
                        <span className="px-1 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-700 min-w-[40px] inline-block text-center">
                          {pedido.estado_general}
                        </span>
                      </TableCell>
                      <TableCell>
                        {pedido.fecha_creacion
                          ? new Date(pedido.fecha_creacion).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <PagoManager
                            pedidoId={pedido._id}
                            pagoInicial={pedido.pago}
                            onSuccess={refreshData}
                            metodosPago={metodosPago}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {pedido.historial_pagos && pedido.historial_pagos.length > 0 && (
                            <span className="text-xs text-green-700 font-semibold">
                              Pagos: {pedido.historial_pagos.reduce((a, pago) => a + (pago.monto || 0), 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                            </span>
                          )}
                        {total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Modal de Preliminar */}
      {pedidoSeleccionado && (
        <PreliminarImpresion
          isOpen={isPreliminarOpen}
          onClose={() => {
            setIsPreliminarOpen(false);
            setPedidoSeleccionado(null);
          }}
          pedido={pedidoSeleccionado}
        />
      )}
    </Card>
  );
};

export default Pedidos;