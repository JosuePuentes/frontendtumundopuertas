import React, { useState } from "react";
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
import { Loader2, AlertCircle, Download, FileText, Search } from "lucide-react";
import api from "@/lib/api"; // Import the centralized api function
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Abono {
  pedido_id: string;
  cliente_nombre: string;
  fecha: string;
  monto: number;
  metodo?: string;
}

interface VentaDiariaResponse {
  total_ingresos: number;
  abonos: Abono[];
  ingresos_por_metodo: { [key: string]: number };
}

const ResumenVentaDiaria: React.FC = () => {
  const [data, setData] = useState<VentaDiariaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // El backend espera fechas en formato YYYY-MM-DD directamente

  const fetchVentaDiaria = async () => {
    if (!fechaInicio || !fechaFin) {
      setError("Por favor, selecciona un rango de fechas.");
      return;
    }
    
    console.log('🔍 Iniciando consulta de resumen de venta diaria...');
    console.log('📅 Fechas seleccionadas (ISO):', { fechaInicio, fechaFin });
    
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      // El backend espera fecha_inicio y fecha_fin en formato YYYY-MM-DD
      params.append("fecha_inicio", fechaInicio);
      params.append("fecha_fin", fechaFin);

      const url = `/pedidos/venta-diaria?${params.toString()}`;
      console.log('🌐 URL de consulta:', url);

      const responseData: VentaDiariaResponse = await api(url);
      console.log('📊 Datos recibidos del backend:', responseData);
      
      if (responseData && responseData.abonos) {
        console.log('✅ Datos procesados:', {
          total_ingresos: responseData.total_ingresos,
          cantidad_abonos: responseData.abonos?.length || 0,
          metodos_pago: Object.keys(responseData.ingresos_por_metodo || {}).length
        });
        
        // Verificar las fechas de los primeros 5 abonos para debugging
        console.log('🔍 Fechas de los primeros 5 abonos:');
        responseData.abonos.slice(0, 5).forEach((abono, index) => {
          const fechaAbono = new Date(abono.fecha);
          const fechaISO = fechaAbono.toISOString().split('T')[0];
          const fechaLatino = `${fechaAbono.getDate().toString().padStart(2, '0')}/${(fechaAbono.getMonth() + 1).toString().padStart(2, '0')}/${fechaAbono.getFullYear()}`;
          console.log(`  ${index + 1}. ${fechaISO} (${fechaLatino}) - ${abono.cliente_nombre} - $${abono.monto}`);
        });
        
        // Verificar si las fechas están en el rango solicitado
        const fechaInicioDate = new Date(fechaInicio);
        const fechaFinDate = new Date(fechaFin);
        console.log('🎯 Rango solicitado:', {
          inicio: fechaInicioDate.toISOString().split('T')[0],
          fin: fechaFinDate.toISOString().split('T')[0]
        });
        
        const abonosEnRango = responseData.abonos.filter(abono => {
          const fechaAbono = new Date(abono.fecha);
          return fechaAbono >= fechaInicioDate && fechaAbono <= fechaFinDate;
        });
        
        console.log('📊 Análisis de filtrado:', {
          total_abonos: responseData.abonos.length,
          abonos_en_rango_solicitado: abonosEnRango.length,
          filtro_funciona: abonosEnRango.length === responseData.abonos.length ? '❌ NO' : '✅ SÍ'
        });
      }
      
      setData(responseData);
    } catch (err: any) {
      console.error('❌ Error al obtener resumen de venta diaria:', err);
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener TODOS los datos sin filtro de fecha
  const fetchTodosLosDatos = async () => {
    console.log('🔍 Obteniendo TODOS los datos sin filtro de fecha...');
    
    setLoading(true);
    setError(null);
    try {
      const url = `/pedidos/venta-diaria`;
      console.log('🌐 URL de consulta (sin filtros):', url);

      const responseData: VentaDiariaResponse = await api(url);
      console.log('📊 TODOS los datos recibidos:', responseData);
      
      if (responseData && responseData.abonos) {
        console.log('📅 Fechas disponibles en los datos:');
        const fechasUnicas = [...new Set(responseData.abonos.map(abono => {
          const fecha = new Date(abono.fecha);
          return fecha.toISOString().split('T')[0]; // YYYY-MM-DD
        }))].sort();
        
        console.log('📅 Fechas únicas encontradas:', fechasUnicas);
        
        // Mostrar las primeras 10 fechas para referencia
        fechasUnicas.slice(0, 10).forEach(fecha => {
          console.log(`📅 Fecha disponible: ${fecha} (${new Date(fecha).toLocaleDateString('es-ES')})`);
        });
      }
      
      setData(responseData);
    } catch (err: any) {
      console.error('❌ Error al obtener todos los datos:', err);
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Función para probar diferentes endpoints y formatos de fecha
  const probarEndpoints = async () => {
    console.log('🔍 Probando diferentes endpoints y formatos de fecha...');
    
    const fechaPrueba = '2025-09-15'; // Usar una fecha que sabemos que tiene datos
    
    const endpoints = [
      `/pedidos/venta-diaria`,
      `/pedidos/venta-diaria?fecha_inicio=${fechaPrueba}&fecha_fin=${fechaPrueba}`,
      `/pedidos/venta-diaria?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Probando: ${endpoint}`);
        const response = await api(endpoint);
        console.log(`✅ ${endpoint} - Respuesta:`, {
          total_ingresos: response.total_ingresos,
          cantidad_abonos: response.abonos?.length || 0
        });
      } catch (error) {
        console.log(`❌ ${endpoint} - Error:`, error);
      }
    }
  };

  const exportToPDF = () => {
    if (!data) {
      alert('No hay datos para exportar. Por favor, busca un resumen primero.');
      return;
    }

    const doc = new jsPDF();
    
    // Título del documento
    doc.setFontSize(20);
    doc.text('Resumen de Venta Diaria', 14, 22);
    
    // Información del rango de fechas
    doc.setFontSize(12);
    doc.text(`Período: ${fechaInicio} - ${fechaFin}`, 14, 32);
    
    // Total de ingresos
    doc.setFontSize(16);
    doc.text(`Total Ingresos: $${data.total_ingresos.toFixed(2)}`, 14, 45);
    
    // Tabla de ingresos por método de pago
    doc.setFontSize(14);
    doc.text('Ingresos por Método de Pago', 14, 60);
    
    const metodoPagoData = Object.entries(data.ingresos_por_metodo || {}).map(([metodo, total]) => [
      metodo,
      `$${total.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: 65,
      head: [['Método de Pago', 'Total']],
      body: metodoPagoData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
    });
    
    // Tabla de abonos detallados
    doc.setFontSize(14);
    doc.text('Detalle de Abonos', 14, (doc as any).lastAutoTable.finalY + 20);
    
    const abonosData = (data.abonos || []).map(abono => [
      abono.pedido_id,
      abono.cliente_nombre,
      new Date(abono.fecha).toLocaleDateString(),
      abono.metodo || "N/A",
      `$${abono.monto.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 25,
      head: [['ID Pedido', 'Cliente', 'Fecha', 'Método', 'Monto']],
      body: abonosData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        4: { halign: 'right' }
      }
    });
    
    // Guardar el PDF
    doc.save(`resumen-venta-diaria-${fechaInicio}-${fechaFin}.pdf`);
  };

  const exportToExcel = () => {
    if (!data) {
      alert('No hay datos para exportar. Por favor, busca un resumen primero.');
      return;
    }

    // Crear workbook
    const wb = XLSX.utils.book_new();
    
    // Hoja 1: Resumen general
    const resumenData = [
      ['Resumen de Venta Diaria'],
      ['Período:', `${fechaInicio} - ${fechaFin}`],
      ['Total Ingresos:', `$${data.total_ingresos.toFixed(2)}`],
      [''],
      ['Ingresos por Método de Pago'],
      ['Método de Pago', 'Total']
    ];
    
    // Agregar datos de métodos de pago
    Object.entries(data.ingresos_por_metodo || {}).forEach(([metodo, total]) => {
      resumenData.push([metodo, `$${total.toFixed(2)}`]);
    });
    
    const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');
    
    // Hoja 2: Detalle de abonos
    const abonosData = [
      ['ID Pedido', 'Cliente', 'Fecha', 'Método', 'Monto']
    ];
    
    (data.abonos || []).forEach(abono => {
      abonosData.push([
        abono.pedido_id,
        abono.cliente_nombre,
        new Date(abono.fecha).toLocaleDateString(),
        abono.metodo || "N/A",
        abono.monto.toFixed(2)
      ]);
    });
    
    const ws2 = XLSX.utils.aoa_to_sheet(abonosData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Abonos');
    
    // Guardar el archivo Excel
    XLSX.writeFile(wb, `resumen-venta-diaria-${fechaInicio}-${fechaFin}.xlsx`);
  };

  return (
    <Card className="w-full shadow-md rounded-2xl">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-gray-800">
              Resumen de Venta Diaria
            </CardTitle>
            <p className="text-sm text-gray-500">
              Consulta los ingresos por abonos en un rango de fechas.
            </p>
          </div>
          {data && (
            <div className="flex gap-2">
              <Button
                onClick={exportToPDF}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Exportar PDF
              </Button>
              <Button
                onClick={exportToExcel}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar Excel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
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
          <Button onClick={fetchVentaDiaria} className="sm:w-auto w-full">
            Buscar
          </Button>
          <Button 
            onClick={fetchTodosLosDatos}
            variant="outline" 
            className="sm:w-auto w-full"
            title="Mostrar todos los datos sin filtro de fecha"
            disabled={loading}
          >
            <Search className="w-4 h-4 mr-2" />
            Ver Todos
          </Button>
          <Button 
            onClick={probarEndpoints} 
            variant="outline" 
            className="sm:w-auto w-full"
            title="Probar diferentes formatos de fecha"
          >
            <Search className="w-4 h-4 mr-2" />
            Probar Formatos
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8 text-gray-600">
            <Loader2 className="animate-spin w-6 h-6 mr-2" />
            Cargando resumen...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center text-red-600 py-6">
            <AlertCircle className="w-5 h-5 mr-2" />
            Error: {error}
          </div>
        ) : data && data.total_ingresos === 0 && (!data.abonos || data.abonos.length === 0) ? (
          <div className="text-center py-8 text-gray-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron datos</h3>
            <p className="text-sm">
              No hay registros de ventas para el período seleccionado ({fechaInicio} - {fechaFin})
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Verifica que las fechas sean correctas y que existan abonos registrados en ese período
            </p>
          </div>
        ) : data && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-right font-bold text-2xl mt-6 p-4 bg-green-100 rounded-md text-green-800">
                Total Ingresos: ${(data.total_ingresos || 0).toFixed(2)}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Ingresos por Método de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método de Pago</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(data.ingresos_por_metodo || {}).map(([metodo, total]) => (
                        <TableRow key={metodo}>
                          <TableCell>{metodo}</TableCell>
                          <TableCell>${total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="overflow-x-auto mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.abonos || []).map((abono, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {abono.pedido_id}
                      </TableCell>
                      <TableCell>{abono.cliente_nombre}</TableCell>
                      <TableCell>
                        {new Date(abono.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{abono.metodo || "N/A"}</TableCell>
                      <TableCell>${(abono.monto || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumenVentaDiaria;