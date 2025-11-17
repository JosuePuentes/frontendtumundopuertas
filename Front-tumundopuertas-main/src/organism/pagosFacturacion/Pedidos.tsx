import React, { useState, useEffect } from "react";
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
  onSuccess?: () => void;
  metodosPago: any[];
}> = ({ pedidoId, onSuccess, metodosPago }) => {
  const [monto, setMonto] = useState("");
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>("");
  const [nombreTitular, setNombreTitular] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Registrar abono (actualiza estado y agrega al historial)
  const registrarAbono = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const montoNumero = parseFloat(monto);
      if (isNaN(montoNumero) || montoNumero <= 0) {
        setError("El monto debe ser mayor a cero");
        setLoading(false);
        return;
      }
      if (!nombreTitular.trim()) {
        setError("Debe ingresar el nombre del titular");
        setLoading(false);
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/${pedidoId}/pago`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pago: "abonado", // Campo requerido por el backend
          monto: montoNumero, 
          metodo: selectedMetodoPago,
          nombre_quien_envia: nombreTitular.trim()
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Error al registrar abono" }));
        throw new Error(errorData.detail || "Error al registrar abono");
      }
      
      setSuccess("Abono registrado");
      setMonto("");
      setSelectedMetodoPago("");
      setNombreTitular("");
      
      // Notificar a otros módulos que se registró un pago
      window.dispatchEvent(new CustomEvent('pagoRealizado', { detail: { pedidoId } }));
      
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
          disabled={loading || !monto || isNaN(Number(monto)) || !selectedMetodoPago || !nombreTitular.trim()}
        >
          Abonar
        </Button>
      </div>
      {selectedMetodoPago && (
        <Input
          type="text"
          placeholder="Nombre del titular *"
          value={nombreTitular}
          onChange={e => setNombreTitular(e.target.value)}
          className="text-xs mt-1"
          disabled={loading}
          required
        />
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
      {success && <span className="text-xs text-green-600">{success}</span>}
    </div>
  );
};

interface PedidoItem {
  id: string;
  precio: number;
  cantidad: number;
  descuento?: number; // Descuento en monto ($)
  estado_item?: number; // 0=pendiente, 1=herreria, 2=masillar, 3=preparar, 4=terminado
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
  adicionales?: Array<{
    descripcion?: string;
    precio: number;
    cantidad?: number;
  }>;
  historial_pagos?: RegistroPago[];
  total_abonado?: number; // Total abonado del pedido
}

// Removido el filtro de estados - ahora muestra TODOS los pedidos
// const ESTADOS = [
//   "orden1",
//   "orden2", 
//   "orden3",
//   "orden4",
//   "orden5",
//   "orden6",
//   "pendiente",
// ];

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

  // Cargar pedidos automáticamente al montar el componente
  useEffect(() => {
    fetchPedidos();
    fetchMetodosPago();
  }, []);

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
      // Construcción del query string - ahora obtiene TODOS los pedidos
      let params = "";
      if (fechaInicio) params += `fecha_inicio=${fechaInicio}`;
      if (fechaFin) params += `${params ? '&' : ''}fecha_fin=${fechaFin}`;

      // Usar endpoint que devuelve todos los pedidos sin filtro de estado
      const endpoint = params 
        ? `${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/all/?${params}`
        : `${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/all/`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Error al obtener pedidos");
      const data = await res.json();
      
      // Asegurar que siempre sea un array
      const pedidosArray = Array.isArray(data) ? data : (data.pedidos || []);
      
      console.log(`📥 PAGOS: Total pedidos recibidos del backend: ${pedidosArray.length}`);
      
      // Filtrar pedidos de TU MUNDO PUERTA (RIF: J-507172554)
      const datosFiltrados = pedidosArray.filter((pedido: Pedido) => {
        const nombreCliente = (pedido.cliente_nombre || "").toUpperCase();
        return !nombreCliente.includes("TU MUNDO PUERTA") && !nombreCliente.includes("TU MUNDO  PUERTA");
      });
      
      console.log(`📥 PAGOS: Pedidos después de filtrar TU MUNDO PUERTA: ${datosFiltrados.length}`);
      
      setPedidos(datosFiltrados);
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
          Gestión de Pagos
        </CardTitle>
        <p className="text-xs sm:text-sm text-gray-500">
          Se muestran todos los pedidos con saldo pendiente mayor a 0 (total mayor a abonado)
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
                {(() => {
                  console.log(`🔍 PAGOS: Total pedidos antes de filtrar: ${pedidos.length}`);
                  const pedidosFiltrados = pedidos.filter((pedido) => {
                    // Filtro por cliente
                    const pasaFiltroCliente = clienteFiltro.trim() === ""
                      ? true
                      : (pedido.cliente_nombre || "").toLowerCase().includes(clienteFiltro.trim().toLowerCase());
                    
                    if (!pasaFiltroCliente) return false;
                    
                    // FILTRO: Mostrar pedidos con saldo pendiente > 0
                    const items = pedido.items || [];
                    if (items.length === 0) return false; // No mostrar pedidos sin items
                    // Calcular total incluyendo adicionales y descuentos
                    const totalItems = items.reduce(
                      (acc, item) => {
                        const precioBase = item.precio || 0;
                        const descuento = item.descuento || 0;
                        const precioConDescuento = Math.max(0, precioBase - descuento);
                        return acc + (precioConDescuento * (item.cantidad || 0));
                      },
                      0
                    );
                    const adicionales = pedido.adicionales || [];
                    const totalAdicionales = adicionales.reduce((sum, ad) => {
                      const cantidad = ad.cantidad || 1;
                      const precio = ad.precio || 0;
                      return sum + (precio * cantidad);
                    }, 0);
                    const totalPedido = totalItems + totalAdicionales;
                    
                    // Calcular monto abonado desde múltiples fuentes (prioridad: total_abonado > historial_pagos)
                    let montoAbonado = 0;
                    if (pedido.total_abonado !== undefined && pedido.total_abonado !== null && pedido.total_abonado > 0) {
                      montoAbonado = pedido.total_abonado;
                    } else if (pedido.historial_pagos && pedido.historial_pagos.length > 0) {
                      // Calcular desde historial_pagos si total_abonado no está disponible o es 0
                      montoAbonado = pedido.historial_pagos.reduce(
                        (acc, pago) => acc + (pago.monto || 0),
                        0
                      );
                    }
                    
                    // Calcular saldo pendiente
                    const saldoPendiente = totalPedido - montoAbonado;
                    
                    // Log para debugging
                    console.log(`🔍 FILTRO PAGOS - Pedido ${pedido._id.slice(-4)}:`, {
                      totalPedido: totalPedido.toFixed(2),
                      montoAbonado: montoAbonado.toFixed(2),
                      saldoPendiente: saldoPendiente.toFixed(2),
                      tiene_total_abonado: !!pedido.total_abonado,
                      tiene_historial_pagos: !!(pedido.historial_pagos && pedido.historial_pagos.length > 0),
                      pasaFiltro: saldoPendiente > 0.01
                    });
                    
                    // Mostrar pedidos que:
                    // 1. Tienen saldo pendiente > 0 (total > abonado y aún resta)
                    // 2. Tienen abonos (montoAbonado > 0) pero aún no están completamente pagados
                    // Excluir SOLO los que están completamente pagados (saldo pendiente <= 0.01 para tolerancia de redondeo)
                    
                    // Si el pedido tiene un total válido y está completamente pagado, excluirlo
                    if (totalPedido > 0 && saldoPendiente <= 0.01) {
                      // Pedido completamente pagado (con tolerancia de redondeo), no mostrar
                      return false;
                    }
                    
                    // Incluir todos los demás casos:
                    // - Tiene saldo pendiente > 0
                    // - Tiene abonos pero aún resta
                    // - Total es 0 o negativo (incluir por seguridad, puede ser error de cálculo)
                    return true;
                  });
                  
                  console.log(`✅ PAGOS: Total pedidos después de filtrar: ${pedidosFiltrados.length}`);
                  return pedidosFiltrados;
                })().map((pedido) => {
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
                            onSuccess={refreshData}
                            metodosPago={metodosPago}
                          />
                          {/* Información de pagos: Abonado, Total, Resta */}
                          <div className="flex flex-col gap-0.5 text-[10px] sm:text-xs mt-1">
                            {(() => {
                              // Calcular total incluyendo adicionales y descuentos
                              const totalItems = (pedido.items || []).reduce(
                                (acc, item) => {
                                  const precioBase = item.precio || 0;
                                  const descuento = item.descuento || 0;
                                  const precioConDescuento = Math.max(0, precioBase - descuento);
                                  return acc + (precioConDescuento * (item.cantidad || 0));
                                },
                                0
                              );
                              const adicionales = pedido.adicionales || [];
                              const totalAdicionales = adicionales.reduce((sum, ad) => {
                                const cantidad = ad.cantidad || 1;
                                const precio = ad.precio || 0;
                                return sum + (precio * cantidad);
                              }, 0);
                              const totalPedido = totalItems + totalAdicionales;
                              
                              // Calcular monto abonado
                              const montoAbonado = pedido.total_abonado || (pedido.historial_pagos || []).reduce(
                                (acc, pago) => acc + (pago.monto || 0),
                                0
                              );
                              
                              // Calcular resta
                              const resta = totalPedido - montoAbonado;
                              
                              return (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Abonado:</span>
                                    <span className="font-semibold text-green-700">${montoAbonado.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Total:</span>
                                    <span className="font-semibold text-gray-900">${totalPedido.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-0.5">
                                    <span className="text-gray-600">Resta:</span>
                                    <span className={`font-semibold ${resta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      ${resta.toFixed(2)}
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                          {(() => {
                            // Calcular total incluyendo adicionales y descuentos
                            const totalItems = (pedido.items || []).reduce(
                              (acc, item) => {
                                const precioBase = item.precio || 0;
                                const descuento = item.descuento || 0;
                                const precioConDescuento = Math.max(0, precioBase - descuento);
                                return acc + (precioConDescuento * (item.cantidad || 0));
                              },
                              0
                            );
                            const adicionales = pedido.adicionales || [];
                            const totalAdicionales = adicionales.reduce((sum, ad) => {
                              const cantidad = ad.cantidad || 1;
                              const precio = ad.precio || 0;
                              return sum + (precio * cantidad);
                            }, 0);
                            const totalPedido = totalItems + totalAdicionales;
                            
                            // Calcular monto abonado
                            const montoAbonado = pedido.total_abonado || (pedido.historial_pagos || []).reduce(
                              (acc, pago) => acc + (pago.monto || 0),
                              0
                            );
                            
                            // Calcular resta
                            const resta = totalPedido - montoAbonado;
                            
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total:</span>
                                  <span className="font-semibold text-gray-900">${totalPedido.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Abonado:</span>
                                  <span className="font-semibold text-green-700">${montoAbonado.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-0.5">
                                  <span className="text-gray-600">Resta:</span>
                                  <span className={`font-semibold ${resta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ${resta.toFixed(2)}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
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
    </Card>
  );
};

// Componente Pedidos - Gestión de pedidos y pagos
export default Pedidos;