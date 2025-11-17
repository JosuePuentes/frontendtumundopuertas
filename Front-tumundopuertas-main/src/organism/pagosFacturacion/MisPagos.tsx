import React, { useEffect, useState, useMemo } from "react";
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
import { Loader2, AlertCircle, Download, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import PreliminarImpresion from "@/organism/formatosImpresion/PreliminarImpresion";

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
  adicionales?: Array<{
    descripcion?: string;
    precio: number;
    cantidad?: number;
  }>;
  total_abonado: number; // Assuming this field exists
  fecha_creacion?: string; // Fecha de creación del pedido
  createdAt?: string; // Alternativa de fecha
}

const MisPagos: React.FC = () => {
  const [pagos, setPagos] = useState<PedidoConPagos[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState<string>(""); // Added state for client filter
  const [filtroEstadoPago, setFiltroEstadoPago] = useState<string>("todos"); // Filtro por estado de pago (todos, pagado, abonado, sin pago)
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
      
      // Filtrar pedidos de TU MUNDO PUERTA (RIF: J-507172554)
      // Necesitamos obtener el RIF del cliente para filtrar
      const datosFiltrados = data.filter((pedido: PedidoConPagos) => {
        // Si el pedido tiene cliente_id, buscar el cliente para obtener su RIF
        // Por ahora, filtrar por cliente_nombre que contiene "TU MUNDO PUERTA"
        const nombreCliente = (pedido.cliente_nombre || "").toUpperCase();
        return !nombreCliente.includes("TU MUNDO PUERTA") && !nombreCliente.includes("TU MUNDO  PUERTA");
      });
      
      // Ordenar inmediatamente después de obtener los datos
      const datosOrdenados = [...datosFiltrados].sort((a: PedidoConPagos, b: PedidoConPagos) => {
        // Obtener fecha más reciente: primero del historial_pagos, sino de fecha_creacion
        const getFechaMasReciente = (pedido: PedidoConPagos): number => {
          // Si hay historial de pagos, usar la fecha más reciente del historial
          if (pedido.historial_pagos && pedido.historial_pagos.length > 0) {
            const fechas = pedido.historial_pagos
              .map(pago => {
                try {
                  const fecha = new Date(pago.fecha);
                  return isNaN(fecha.getTime()) ? 0 : fecha.getTime();
                } catch {
                  return 0;
                }
              })
              .filter(f => f > 0)
              .sort((a, b) => b - a);
            if (fechas.length > 0) {
              return fechas[0];
            }
          }
          
          // Si no hay historial de pagos, usar fecha_creacion o createdAt
          const fechaCreacion = pedido.fecha_creacion || (pedido as any).createdAt || (pedido as any).fechaCreacion;
          if (fechaCreacion) {
            try {
              const fecha = new Date(fechaCreacion);
              return isNaN(fecha.getTime()) ? 0 : fecha.getTime();
            } catch {
              return 0;
            }
          }
          
          return 0; // Sin fecha, aparecerán al final
        };
        
        const fechaA = getFechaMasReciente(a);
        const fechaB = getFechaMasReciente(b);
        
        // Ordenar descendente (fechas más recientes primero)
        if (fechaA === 0 && fechaB === 0) return 0;
        if (fechaA === 0) return 1; // a sin fecha va al final
        if (fechaB === 0) return -1; // b sin fecha va al final
        
        return fechaB - fechaA; // Más reciente primero
      });
      
      console.log("📅 Pagos ordenados por fecha (más reciente primero):", datosOrdenados.map(p => ({
        id: p._id,
        cliente: p.cliente_nombre,
        fecha: p.historial_pagos?.[0]?.fecha || p.fecha_creacion || "N/A"
      })));
      
      setPagos(datosOrdenados);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagos();
    
    // Escuchar evento de pago realizado para actualizar datos
    const handlePagoRealizado = () => {
      console.log('🔄 MIS PAGOS: Evento pagoRealizado recibido, actualizando datos...');
      // Esperar un poco para que el backend procese el pago
      setTimeout(() => {
        fetchPagos();
      }, 500);
    };
    
    window.addEventListener('pagoRealizado', handlePagoRealizado as EventListener);
    
    return () => {
      window.removeEventListener('pagoRealizado', handlePagoRealizado as EventListener);
    };
  }, []);

  const handlePreliminarClick = (pedido: PedidoConPagos) => {
    setSelectedPedidoForPreliminar(pedido);
    setShowPreliminarModal(true);
  };


  const calculateTotalPedido = (pedido: PedidoConPagos) => {
    // Calcular total de items considerando descuentos
    const totalItems = (pedido.items || []).reduce((sum, item) => {
      const precioBase = item.precio || 0;
      const descuento = item.descuento || 0;
      const precioConDescuento = Math.max(0, precioBase - descuento);
      return sum + (precioConDescuento * (item.cantidad || 0));
    }, 0);
    
    // Calcular total de adicionales (normalizar si es null, undefined o no es array)
    const adicionalesRaw = pedido.adicionales;
    const adicionales = (adicionalesRaw && Array.isArray(adicionalesRaw)) ? adicionalesRaw : [];
    const totalAdicionales = adicionales.reduce((sum, ad) => {
      const cantidad = ad.cantidad || 1;
      const precio = ad.precio || 0;
      return sum + (precio * cantidad);
    }, 0);
    
    return totalItems + totalAdicionales;
  };

  // Calcular el estado del pedido basado en totalPedido vs montoAbonado
  const calcularEstadoPago = (pedido: PedidoConPagos): string => {
    const totalPedido = calculateTotalPedido(pedido);
    const montoAbonado = pedido.total_abonado || 0;
    
    // Lógica correcta:
    // - Si monto_abonado == 0 → "sin_pago"
    // - Si monto_abonado == total_pedido → "pagado"
    // - Si monto_abonado > 0 y monto_abonado < total_pedido → "abonado"
    
    if (montoAbonado === 0) {
      return "sin_pago";
    } else if (montoAbonado >= totalPedido && totalPedido > 0) {
      return "pagado";
    } else if (montoAbonado > 0 && montoAbonado < totalPedido) {
      return "abonado";
    } else {
      return "sin_pago";
    }
  };

  // Calcular datos filtrados y totales
  const pedidosFiltrados = useMemo(() => {
    return pagos.filter((pedido) => {
      // Filtro por cliente
      const pasaFiltroCliente = clienteFiltro.trim() === ""
        ? true
        : (pedido.cliente_nombre || "").toLowerCase().includes(clienteFiltro.trim().toLowerCase());
      
      if (!pasaFiltroCliente) return false;
      
      // Filtro por estado de pago (basado en comparación de totalPedido vs montoAbonado)
      if (filtroEstadoPago === "todos") {
        return true;
      }
      
      const totalPedido = calculateTotalPedido(pedido);
      const montoAbonado = pedido.total_abonado || 0;
      
      if (filtroEstadoPago === "pagado") {
        // Pagado: monto_abonado == total_pedido
        return totalPedido > 0 && montoAbonado >= totalPedido;
      } else if (filtroEstadoPago === "abonado") {
        // Abonado: monto_abonado > 0 y monto_abonado < total_pedido
        return montoAbonado > 0 && montoAbonado < totalPedido;
      } else if (filtroEstadoPago === "sin_pago") {
        // Sin pago: monto_abonado == 0
        return montoAbonado === 0;
      }
      
      return true;
    });
  }, [pagos, clienteFiltro, filtroEstadoPago]);

  // Calcular totales generales
  const totales = useMemo(() => {
    const totalPedido = pedidosFiltrados.reduce((sum, pedido) => sum + calculateTotalPedido(pedido), 0);
    const totalAbonado = pedidosFiltrados.reduce((sum, pedido) => sum + (pedido.total_abonado || 0), 0);
    const totalPendiente = totalPedido - totalAbonado;
    return { totalPedido, totalAbonado, totalPendiente };
  }, [pedidosFiltrados]);

  const handleExportPdf = () => {
    if (!pedidosFiltrados || pedidosFiltrados.length === 0) {
      setError('No hay datos para exportar.');
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Título del documento
      doc.setFontSize(18);
      doc.text('Mis Pagos - Reporte de Pagos', 14, 22);
      
      // Información del reporte
      doc.setFontSize(10);
      doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
      
      if (fechaInicio && fechaFin) {
        doc.text(`Período: ${fechaInicio} - ${fechaFin}`, 14, 36);
      }
      
      if (clienteFiltro) {
        doc.text(`Filtrado por cliente: "${clienteFiltro}"`, 14, fechaInicio && fechaFin ? 42 : 36);
      }
      
      doc.text(`Total de Registros: ${pedidosFiltrados.length}`, 14, fechaInicio && fechaFin ? (clienteFiltro ? 48 : 42) : (clienteFiltro ? 42 : 36));
      
      // Preparar datos para la tabla
      const tableData = pedidosFiltrados.map((pedido) => {
        const totalPedido = calculateTotalPedido(pedido);
        const montoAbonado = pedido.total_abonado || 0;
        const montoPendiente = totalPedido - montoAbonado;
        const fecha = pedido.historial_pagos?.[0]?.fecha
          ? new Date(pedido.historial_pagos[0].fecha).toLocaleDateString('es-ES')
          : pedido.fecha_creacion 
          ? new Date(pedido.fecha_creacion).toLocaleDateString('es-ES')
          : 'N/A';
        
        return [
          pedido.cliente_id || 'N/A',
          pedido.cliente_nombre || 'Sin nombre',
          fecha,
          `$${totalPedido.toFixed(2)}`,
          `$${montoAbonado.toFixed(2)}`,
          `$${montoPendiente.toFixed(2)}`,
          pedido.pago || 'pendiente'
        ];
      });
      
      // Crear tabla
      const startY = fechaInicio && fechaFin ? (clienteFiltro ? 54 : 48) : (clienteFiltro ? 48 : 42);
      autoTable(doc, {
        head: [['ID Cliente', 'Cliente', 'Fecha', 'Total Pedido', 'Monto Abonado', 'Monto Pendiente', 'Estado']],
        body: tableData,
        startY: startY,
        styles: {
          fontSize: 7,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          3: { halign: 'right' }, // Total Pedido
          4: { halign: 'right' }, // Monto Abonado
          5: { halign: 'right' }, // Monto Pendiente
        },
      });
      
      // Agregar totales al final
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTALES GENERALES', 14, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Pedido: $${totales.totalPedido.toFixed(2)}`, 14, finalY + 8);
      doc.text(`Total Abonado: $${totales.totalAbonado.toFixed(2)}`, 14, finalY + 14);
      doc.text(`Total Pendiente: $${totales.totalPendiente.toFixed(2)}`, 14, finalY + 20);
      
      // Guardar archivo
      const nombreArchivo = `mis_pagos_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);
      
      setError(null);
    } catch (error: any) {
      console.error('Error al exportar a PDF:', error);
      setError(`Error al exportar a PDF: ${error.message}`);
    }
  };

  const handleExportExcel = () => {
    if (!pedidosFiltrados || pedidosFiltrados.length === 0) {
      setError('No hay datos para exportar.');
      return;
    }

    try {
      // Preparar datos para Excel
      const excelData = pedidosFiltrados.map((pedido) => {
        const totalPedido = calculateTotalPedido(pedido);
        const montoAbonado = pedido.total_abonado || 0;
        const montoPendiente = totalPedido - montoAbonado;
        const fecha = pedido.historial_pagos?.[0]?.fecha
          ? new Date(pedido.historial_pagos[0].fecha).toLocaleDateString('es-ES')
          : pedido.fecha_creacion 
          ? new Date(pedido.fecha_creacion).toLocaleDateString('es-ES')
          : 'N/A';
        
        return {
          'ID Cliente': pedido.cliente_id || 'N/A',
          'Cliente': pedido.cliente_nombre || 'Sin nombre',
          'Fecha': fecha,
          'Total Pedido': totalPedido,
          'Monto Abonado': montoAbonado,
          'Monto Pendiente': montoPendiente,
          'Estado': pedido.pago || 'pendiente'
        };
      });
      
      // Crear workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      
      // Agregar información del reporte como primeras filas
      const infoData = [
        ['Mis Pagos - Reporte de Pagos'],
        [`Fecha de Reporte: ${new Date().toLocaleDateString('es-ES')}`],
        fechaInicio && fechaFin ? [`Período: ${fechaInicio} - ${fechaFin}`] : [''],
        clienteFiltro ? [`Filtrado por cliente: "${clienteFiltro}"`] : [''],
        [`Total de Registros: ${pedidosFiltrados.length}`],
        [''], // Fila vacía
      ];
      
      // Insertar información al inicio
      XLSX.utils.sheet_add_aoa(ws, infoData, { origin: 'A1' });
      
      // Agregar totales al final
      const totalesRow = pedidosFiltrados.length + 8; // Después de los datos y fila vacía
      XLSX.utils.sheet_add_aoa(ws, [
        [''],
        ['TOTALES GENERALES'],
        [`Total Pedido: $${totales.totalPedido.toFixed(2)}`],
        [`Total Abonado: $${totales.totalAbonado.toFixed(2)}`],
        [`Total Pendiente: $${totales.totalPendiente.toFixed(2)}`],
      ], { origin: `A${totalesRow}` });
      
      // Ajustar ancho de columnas
      ws['!cols'] = [
        { wch: 15 }, // ID Cliente
        { wch: 25 }, // Cliente
        { wch: 12 }, // Fecha
        { wch: 15 }, // Total Pedido
        { wch: 15 }, // Monto Abonado
        { wch: 15 }, // Monto Pendiente
        { wch: 12 }, // Estado
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Mis Pagos');
      
      // Guardar archivo
      const nombreArchivo = `mis_pagos_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);
      
      setError(null);
    } catch (error: any) {
      console.error('Error al exportar a Excel:', error);
      setError(`Error al exportar a Excel: ${error.message}`);
    }
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
        {/* Filtros de fecha, cliente y estado de pago */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="sm:w-1/4"
            placeholder="Fecha inicio"
          />
          <Input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="sm:w-1/4"
            placeholder="Fecha fin"
          />
          <Input
            type="text"
            value={clienteFiltro}
            onChange={(e) => setClienteFiltro(e.target.value)}
            className="sm:w-1/4"
            placeholder="Buscar por nombre de cliente..."
          />
          <Select value={filtroEstadoPago} onValueChange={setFiltroEstadoPago}>
            <SelectTrigger className="sm:w-1/4">
              <SelectValue placeholder="Estado de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pagado">Pagado</SelectItem>
              <SelectItem value="abonado">Abonado</SelectItem>
              <SelectItem value="sin_pago">Sin pago</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchPagos} className="sm:w-auto w-full">
            Buscar
          </Button>
        </div>

        {/* Botones de Exportación */}
        {pagos.length > 0 && (
          <div className="flex gap-2 mb-4 justify-end">
            <Button 
              onClick={handleExportPdf} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Exportar a PDF
            </Button>
            <Button 
              onClick={handleExportExcel} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar a Excel
            </Button>
          </div>
        )}

        {/* Totales Generales */}
        {pagos.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Totales Generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Pedido</p>
                <p className="text-gray-900 font-bold text-xl">${totales.totalPedido.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Abonado</p>
                <p className="text-blue-600 font-bold text-xl">${totales.totalAbonado.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Pendiente</p>
                <p className={`font-bold text-xl ${totales.totalPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${totales.totalPendiente.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

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
                {pedidosFiltrados
                  .sort((a, b) => {
                    // Función auxiliar para obtener fecha más reciente
                    const getFechaMasReciente = (pedido: PedidoConPagos): number => {
                      if (pedido.historial_pagos && pedido.historial_pagos.length > 0) {
                        const fechas = pedido.historial_pagos
                          .map(pago => {
                            try {
                              const fecha = new Date(pago.fecha);
                              return isNaN(fecha.getTime()) ? 0 : fecha.getTime();
                            } catch {
                              return 0;
                            }
                          })
                          .filter(f => f > 0)
                          .sort((a, b) => b - a);
                        if (fechas.length > 0) {
                          return fechas[0];
                        }
                      }
                      
                      const fechaCreacion = pedido.fecha_creacion || (pedido as any).createdAt || (pedido as any).fechaCreacion;
                      if (fechaCreacion) {
                        try {
                          const fecha = new Date(fechaCreacion);
                          return isNaN(fecha.getTime()) ? 0 : fecha.getTime();
                        } catch {
                          return 0;
                        }
                      }
                      
                      return 0;
                    };
                    
                    const fechaA = getFechaMasReciente(a);
                    const fechaB = getFechaMasReciente(b);
                    
                    if (fechaA === 0 && fechaB === 0) return 0;
                    if (fechaA === 0) return 1;
                    if (fechaB === 0) return -1;
                    
                    return fechaB - fechaA; // Más reciente primero
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
                        {(() => {
                          const estadoCalculado = calcularEstadoPago(pedido);
                          return (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                estadoCalculado === "pagado"
                                  ? "bg-green-200 text-green-800"
                                  : estadoCalculado === "abonado"
                                  ? "bg-yellow-200 text-yellow-800"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {estadoCalculado === "pagado" ? "pagado" : estadoCalculado === "abonado" ? "abonado" : "sin pago"}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="flex gap-2">
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
      </CardContent>
    </Card>
  );
};

export default MisPagos;