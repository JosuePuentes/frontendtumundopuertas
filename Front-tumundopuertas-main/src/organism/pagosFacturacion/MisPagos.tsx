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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
      
      // Ordenar inmediatamente después de obtener los datos
      const datosOrdenados = [...data].sort((a: PedidoConPagos, b: PedidoConPagos) => {
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

  // Calcular datos filtrados y totales
  const pedidosFiltrados = useMemo(() => {
    return pagos.filter((pedido) =>
      clienteFiltro.trim() === ""
        ? true
        : (pedido.cliente_nombre || "").toLowerCase().includes(clienteFiltro.trim().toLowerCase())
    );
  }, [pagos, clienteFiltro]);

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
      doc.setFont(undefined, 'bold');
      doc.text('TOTALES GENERALES', 14, finalY);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
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