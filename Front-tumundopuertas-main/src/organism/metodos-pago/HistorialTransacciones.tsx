import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { getHistorialMetodo } from "../../lib/api";
import type { MetodoPago } from "../../hooks/useMetodosPago";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Transaccion {
  id: string;
  metodo_pago_id: string;
  tipo: "deposito" | "transferir";
  monto: number;
  concepto: string;
  fecha: string;
}

interface HistorialTransaccionesProps {
  isOpen: boolean;
  onClose: () => void;
  metodo: MetodoPago;
}

const HistorialTransacciones = ({ isOpen, onClose, metodo }: HistorialTransaccionesProps) => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && metodo.id) {
      // CRÍTICO: Siempre refrescar el historial cuando se abre el modal
      // Esto asegura que muestre los depósitos más recientes
      fetchHistorial();
    }
  }, [isOpen, metodo.id]);

  // También refrescar cuando el modal cambia de estado (se abre)
  useEffect(() => {
    if (isOpen) {
      // Pequeño delay para asegurar que el modal esté completamente abierto
      const timeoutId = setTimeout(() => {
        if (metodo.id) {
          fetchHistorial();
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  const fetchHistorial = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHistorialMetodo(metodo.id!);
      
      // Debug: Log para ver qué devuelve el backend
      console.log(`🔍 DEBUG HISTORIAL - Método ${metodo.id}:`, {
        metodoId: metodo.id,
        metodoNombre: metodo.nombre,
        datosRaw: data,
        tipoDatos: typeof data,
        esArray: Array.isArray(data),
        cantidad: Array.isArray(data) ? data.length : 'N/A',
        primerItem: Array.isArray(data) && data.length > 0 ? data[0] : null
      });
      
      // Normalizar datos: asegurar que sea un array y que tenga la estructura correcta
      const transaccionesNormalizadas = Array.isArray(data) ? data.map((t: any) => ({
        id: t.id || t._id || t.transaccion_id || `trans-${Date.now()}-${Math.random()}`,
        metodo_pago_id: t.metodo_pago_id || t.metodoPagoId || metodo.id || '',
        tipo: t.tipo || (t.monto > 0 ? 'deposito' : 'transferir'),
        monto: t.monto || 0,
        concepto: t.concepto || t.descripcion || 'Sin concepto',
        fecha: t.fecha || t.createdAt || t.created_at || new Date().toISOString()
      })) : [];
      
      console.log(`✅ DEBUG HISTORIAL - Transacciones normalizadas:`, {
        cantidad: transaccionesNormalizadas.length,
        transacciones: transaccionesNormalizadas
      });
      
      setTransacciones(transaccionesNormalizadas);
    } catch (err: any) {
      console.error(`❌ ERROR HISTORIAL - Método ${metodo.id}:`, err);
      setError(err.message || "Error al obtener historial");
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonto = (monto: number, tipo: string) => {
    const signo = tipo === "deposito" ? "+" : "-";
    return `${signo}${monto.toFixed(2)}`;
  };

  const getTipoColor = (tipo: string) => {
    return tipo === "deposito" ? "text-green-600" : "text-red-600";
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.text(`Historial de Transacciones - ${metodo.nombre}`, 14, 22);
    
    // Información del método
    doc.setFontSize(10);
    doc.text(`Banco: ${metodo.banco}`, 14, 30);
    doc.text(`Titular: ${metodo.titular}`, 14, 35);
    doc.text(`Número de Cuenta: ${metodo.numero_cuenta}`, 14, 40);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString('es-ES')}`, 14, 45);
    
    // Preparar datos para la tabla
    const tableData = transacciones.map(transaccion => [
      formatFecha(transaccion.fecha),
      transaccion.tipo.charAt(0).toUpperCase() + transaccion.tipo.slice(1),
      formatMonto(transaccion.monto, transaccion.tipo),
      transaccion.concepto
    ]);
    
    // Crear tabla
    autoTable(doc, {
      head: [['Fecha', 'Tipo', 'Monto', 'Concepto']],
      body: tableData,
      startY: 55,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    // Guardar archivo
    doc.save(`historial_${metodo.nombre}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    // Preparar datos
    const excelData = transacciones.map(transaccion => ({
      'Fecha': formatFecha(transaccion.fecha),
      'Tipo': transaccion.tipo.charAt(0).toUpperCase() + transaccion.tipo.slice(1),
      'Monto': formatMonto(transaccion.monto, transaccion.tipo),
      'Concepto': transaccion.concepto
    }));
    
    // Crear workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    
    // Agregar información del método como primera fila
    const infoData = [
      [`Historial de Transacciones - ${metodo.nombre}`],
      [`Banco: ${metodo.banco}`],
      [`Titular: ${metodo.titular}`],
      [`Número de Cuenta: ${metodo.numero_cuenta}`],
      [`Fecha de Reporte: ${new Date().toLocaleDateString('es-ES')}`],
      [''], // Fila vacía
    ];
    
    // Insertar información al inicio
    XLSX.utils.sheet_add_aoa(ws, infoData, { origin: 'A1' });
    
    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 20 }, // Fecha
      { wch: 12 }, // Tipo
      { wch: 15 }, // Monto
      { wch: 30 }, // Concepto
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
    
    // Guardar archivo
    XLSX.writeFile(wb, `historial_${metodo.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Historial de Transacciones - {metodo.nombre}</DialogTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchHistorial}
                disabled={loading}
              >
                {loading ? "Cargando..." : "🔄 Refrescar"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToPDF}
                disabled={transacciones.length === 0}
              >
                Exportar PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToExcel}
                disabled={transacciones.length === 0}
              >
                Exportar Excel
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="overflow-auto max-h-[60vh]">
          {loading && <p className="text-center py-4">Cargando historial...</p>}
          {error && <p className="text-red-500 text-center py-4">{error}</p>}
          
          {!loading && !error && (
            <>
              {transacciones.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No hay transacciones registradas</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Concepto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacciones.map((transaccion) => (
                      <TableRow key={transaccion.id}>
                        <TableCell>{formatFecha(transaccion.fecha)}</TableCell>
                        <TableCell>
                          <span className={`capitalize ${getTipoColor(transaccion.tipo)}`}>
                            {transaccion.tipo}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${getTipoColor(transaccion.tipo)}`}>
                            {formatMonto(transaccion.monto, transaccion.tipo)}
                          </span>
                        </TableCell>
                        <TableCell>{transaccion.concepto}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistorialTransacciones;