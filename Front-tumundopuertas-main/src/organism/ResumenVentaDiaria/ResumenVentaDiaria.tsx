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
  descripcion?: string;
  nombre_quien_envia?: string;
  creado_por?: string;
  total_pedido?: number;
}

interface VentaDiariaResponse {
  total_ingresos: number;
  abonos: Abono[];
  ingresos_por_metodo: { [key: string]: number };
}

interface IngresoPorUsuario {
  usuario: string;
  total: number;
  cantidad_pedidos: number;
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
    
    // Validar que la fecha fin sea mayor o igual a la fecha inicio
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);
    
    if (fechaFinDate < fechaInicioDate) {
      setError("La fecha 'Hasta' debe ser mayor o igual a la fecha 'Desde'.");
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
      
      // Obtener pedidos completos para tener información de creado_por y montoTotal
      let pedidosCompletos: any[] = [];
      try {
        const pedidosRes = await api('/pedidos/all/');
        if (Array.isArray(pedidosRes)) {
          pedidosCompletos = pedidosRes;
          console.log('📦 Pedidos completos obtenidos:', pedidosCompletos.length);
        }
      } catch (err) {
        console.warn('⚠️ No se pudieron obtener pedidos completos:', err);
      }
      
      // IMPORTANTE: Confiar en el backend y mostrar TODOS los abonos que envía
      // No hacer filtrado adicional en el frontend para evitar perder abonos
      if (responseData && responseData.abonos && Array.isArray(responseData.abonos)) {
        console.log('✅ Abonos recibidos del backend:', {
          total_abonos: responseData.abonos.length,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin
        });
        
        // Enriquecer abonos con información de pedidos (creado_por y total_pedido)
        const abonosEnriquecidos = responseData.abonos.map(abono => {
          const pedido = pedidosCompletos.find((p: any) => {
            const pedidoIdStr = String(p._id || p.id || '');
            const abonoPedidoIdStr = String(abono.pedido_id || '');
            return pedidoIdStr === abonoPedidoIdStr;
          });
          
          if (pedido) {
            console.log('✅ Pedido encontrado para abono:', {
              pedido_id: abono.pedido_id,
              creado_por: pedido.creado_por,
              montoTotal: pedido.montoTotal
            });
            
            // Calcular total del pedido considerando descuentos
            const adicionalesRaw = pedido.adicionales;
            const adicionalesNormalizados = (adicionalesRaw && Array.isArray(adicionalesRaw)) ? adicionalesRaw : [];
            
            // Subtotal sin descuento
            const subtotalSinDescuento = pedido.items?.reduce((acc: number, item: any) => {
              const precioBase = item.precio || 0;
              return acc + (precioBase * (item.cantidad || 0));
            }, 0) || 0;
            
            // Descuento total
            const descuentoTotal = pedido.items?.reduce((acc: number, item: any) => {
              const descuento = item.descuento || 0;
              const cantidad = item.cantidad || 0;
              return acc + (descuento * cantidad);
            }, 0) || 0;
            
            // Monto items con descuento
            const montoItems = subtotalSinDescuento - descuentoTotal;
            
            // Monto adicionales
            const montoAdicionales = adicionalesNormalizados.reduce((acc: number, ad: any) => {
              const cantidad = ad.cantidad || 1;
              const precio = ad.precio || 0;
              return acc + (precio * cantidad);
            }, 0);
            
            // Total con descuento y adicionales
            const totalPedido = montoItems + montoAdicionales;
            
            return {
              ...abono,
              creado_por: pedido.creado_por || 'N/A',
              total_pedido: pedido.montoTotal || totalPedido
            };
          } else {
            console.warn('⚠️ Pedido no encontrado para abono:', {
              pedido_id: abono.pedido_id,
              total_pedidos_disponibles: pedidosCompletos.length
            });
          }
          
          return {
            ...abono,
            creado_por: 'N/A',
            total_pedido: 0
          };
        });
        
        console.log('📊 Abonos enriquecidos (muestra):', abonosEnriquecidos.slice(0, 3).map(a => ({
          pedido_id: a.pedido_id,
          creado_por: a.creado_por,
          total_pedido: a.total_pedido
        })));
        
        responseData.abonos = abonosEnriquecidos;
        
        // Asegurarse de que total_ingresos esté calculado correctamente
        if (!responseData.total_ingresos || responseData.total_ingresos === 0) {
          responseData.total_ingresos = responseData.abonos.reduce((sum, abono) => sum + (abono.monto || 0), 0);
        }
        
        // Asegurarse de que ingresos_por_metodo esté calculado
        if (!responseData.ingresos_por_metodo || Object.keys(responseData.ingresos_por_metodo).length === 0) {
          const ingresosPorMetodo: { [key: string]: number } = {};
          responseData.abonos.forEach(abono => {
            const metodo = abono.metodo || 'Sin método';
            ingresosPorMetodo[metodo] = (ingresosPorMetodo[metodo] || 0) + (abono.monto || 0);
          });
          responseData.ingresos_por_metodo = ingresosPorMetodo;
        }
        
        console.log('✅ Datos procesados:', {
          total_abonos: responseData.abonos.length,
          total_ingresos: responseData.total_ingresos
        });
      } else {
        console.warn('⚠️ No hay abonos en la respuesta o no es un array:', responseData);
        // Asegurar que siempre haya un array vacío
        if (!responseData.abonos) {
          responseData.abonos = [];
        }
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
      // Llamar al endpoint sin parámetros de fecha para obtener TODOS los abonos
      const url = `/pedidos/venta-diaria`;
      console.log('🌐 URL de consulta (sin filtros):', url);

      const responseData: VentaDiariaResponse = await api(url);
      console.log('📊 TODOS los datos recibidos del backend:', responseData);
      
      // Obtener pedidos completos para tener información de creado_por y montoTotal
      let pedidosCompletos: any[] = [];
      try {
        const pedidosRes = await api('/pedidos/all/');
        if (Array.isArray(pedidosRes)) {
          pedidosCompletos = pedidosRes;
          console.log('📦 Pedidos completos obtenidos:', pedidosCompletos.length);
        }
      } catch (err) {
        console.warn('⚠️ No se pudieron obtener pedidos completos:', err);
      }
      
      // Asegurarse de que todos los abonos se muestren
      if (responseData && responseData.abonos && Array.isArray(responseData.abonos)) {
        console.log('✅ Total de abonos recibidos (sin filtro):', responseData.abonos.length);
        
        // Enriquecer abonos con información de pedidos (creado_por y total_pedido)
        const abonosEnriquecidos = responseData.abonos.map(abono => {
          const pedido = pedidosCompletos.find((p: any) => {
            const pedidoIdStr = String(p._id || p.id || '');
            const abonoPedidoIdStr = String(abono.pedido_id || '');
            return pedidoIdStr === abonoPedidoIdStr;
          });
          
          if (pedido) {
            // Calcular total del pedido considerando descuentos
            const adicionalesRaw = pedido.adicionales;
            const adicionalesNormalizados = (adicionalesRaw && Array.isArray(adicionalesRaw)) ? adicionalesRaw : [];
            
            // Subtotal sin descuento
            const subtotalSinDescuento = pedido.items?.reduce((acc: number, item: any) => {
              const precioBase = item.precio || 0;
              return acc + (precioBase * (item.cantidad || 0));
            }, 0) || 0;
            
            // Descuento total
            const descuentoTotal = pedido.items?.reduce((acc: number, item: any) => {
              const descuento = item.descuento || 0;
              const cantidad = item.cantidad || 0;
              return acc + (descuento * cantidad);
            }, 0) || 0;
            
            // Monto items con descuento
            const montoItems = subtotalSinDescuento - descuentoTotal;
            
            // Monto adicionales
            const montoAdicionales = adicionalesNormalizados.reduce((acc: number, ad: any) => {
              const cantidad = ad.cantidad || 1;
              const precio = ad.precio || 0;
              return acc + (precio * cantidad);
            }, 0);
            
            // Total con descuento y adicionales
            const totalPedido = montoItems + montoAdicionales;
            
            return {
              ...abono,
              creado_por: pedido.creado_por || 'N/A',
              total_pedido: pedido.montoTotal || totalPedido
            };
          }
          
          return {
            ...abono,
            creado_por: 'N/A',
            total_pedido: 0
          };
        });
        
        responseData.abonos = abonosEnriquecidos;
        
        // Calcular totales si no vienen del backend
        if (!responseData.total_ingresos || responseData.total_ingresos === 0) {
          responseData.total_ingresos = responseData.abonos.reduce((sum, abono) => sum + (abono.monto || 0), 0);
        }
        
        if (!responseData.ingresos_por_metodo || Object.keys(responseData.ingresos_por_metodo).length === 0) {
          const ingresosPorMetodo: { [key: string]: number } = {};
          responseData.abonos.forEach(abono => {
            const metodo = abono.metodo || 'Sin método';
            ingresosPorMetodo[metodo] = (ingresosPorMetodo[metodo] || 0) + (abono.monto || 0);
          });
          responseData.ingresos_por_metodo = ingresosPorMetodo;
        }
      } else {
        if (!responseData.abonos) {
          responseData.abonos = [];
        }
      }
      
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
      `$${abono.monto.toFixed(2)}`,
      abono.descripcion || "-",
      abono.nombre_quien_envia || "-"
    ]);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 25,
      head: [['ID Pedido', 'Cliente', 'Fecha', 'Método', 'Monto', 'Descripción', 'Quien Envía']],
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
      ['ID Pedido', 'Cliente', 'Fecha', 'Método', 'Monto', 'Descripción', 'Quien Envía']
    ];
    
    (data.abonos || []).forEach(abono => {
      abonosData.push([
        abono.pedido_id,
        abono.cliente_nombre,
        new Date(abono.fecha).toLocaleDateString(),
        abono.metodo || "N/A",
        abono.monto.toFixed(2),
        abono.descripcion || "-",
        abono.nombre_quien_envia || "-"
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
          <div className="sm:w-1/3 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                // Si la fecha fin es menor que la nueva fecha inicio, ajustarla
                if (fechaFin && e.target.value && new Date(e.target.value) > new Date(fechaFin)) {
                  setFechaFin(e.target.value);
                }
              }}
              max={fechaFin || undefined}
              className="w-full"
              placeholder="Fecha inicio"
            />
          </div>
          <div className="sm:w-1/3 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                // Validar que la fecha fin sea mayor o igual a fecha inicio
                if (fechaInicio && e.target.value && new Date(e.target.value) < new Date(fechaInicio)) {
                  setError("La fecha 'Hasta' debe ser mayor o igual a la fecha 'Desde'.");
                } else {
                  setError(null);
                }
              }}
              min={fechaInicio || undefined}
              className="w-full"
              placeholder="Fecha fin"
            />
          </div>
          <Button onClick={fetchVentaDiaria} className="sm:w-auto w-full" disabled={loading || !fechaInicio || !fechaFin}>
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
            <div className="text-right font-bold text-2xl mt-6 p-4 bg-green-100 rounded-md text-green-800 mb-4">
              Total Ingresos: ${(data.total_ingresos || 0).toFixed(2)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Card>
                <CardHeader>
                  <CardTitle>Ingresos por Usuario Creador</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Total Pedidos</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        // Calcular totales correctamente: sumar total_pedido una vez por pedido único por usuario
                        const ingresosPorUsuarioMap: { [key: string]: { total: number; pedidos: Set<string> } } = {};
                        
                        (data.abonos || []).forEach(abono => {
                          const usuario = abono.creado_por || 'N/A';
                          
                          // Inicializar si no existe
                          if (!ingresosPorUsuarioMap[usuario]) {
                            ingresosPorUsuarioMap[usuario] = {
                              total: 0,
                              pedidos: new Set()
                            };
                          }
                          
                          // Solo sumar el total del pedido una vez por pedido único
                          if (abono.total_pedido && abono.total_pedido > 0) {
                            // Verificar si el pedido ya fue contado para este usuario
                            if (!ingresosPorUsuarioMap[usuario].pedidos.has(abono.pedido_id)) {
                              ingresosPorUsuarioMap[usuario].pedidos.add(abono.pedido_id);
                              ingresosPorUsuarioMap[usuario].total += abono.total_pedido;
                            }
                          }
                        });
                        
                        // Convertir a array y ordenar
                        const ingresosPorUsuarioFinal: IngresoPorUsuario[] = Object.keys(ingresosPorUsuarioMap).map(usuario => ({
                          usuario,
                          total: ingresosPorUsuarioMap[usuario].total,
                          cantidad_pedidos: ingresosPorUsuarioMap[usuario].pedidos.size
                        }));
                        
                        // Ordenar por total descendente
                        ingresosPorUsuarioFinal.sort((a, b) => b.total - a.total);
                        
                        // Debug: mostrar en consola
                        console.log('📊 Ingresos por Usuario:', ingresosPorUsuarioFinal);
                        console.log('📊 Abonos con datos:', (data.abonos || []).map(a => ({
                          pedido_id: a.pedido_id,
                          creado_por: a.creado_por,
                          total_pedido: a.total_pedido
                        })));
                        
                        if (ingresosPorUsuarioFinal.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-gray-500">
                                No hay datos disponibles
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        return ingresosPorUsuarioFinal.map((item) => (
                          <TableRow key={item.usuario}>
                            <TableCell className="font-medium">{item.usuario}</TableCell>
                            <TableCell>{item.cantidad_pedidos}</TableCell>
                            <TableCell className="font-bold">${item.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ));
                      })()}
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
                    <TableHead>Descripción</TableHead>
                    <TableHead>Nombre del Titular</TableHead>
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
                      <TableCell>{abono.descripcion || "-"}</TableCell>
                      <TableCell>{abono.nombre_quien_envia || "-"}</TableCell>
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