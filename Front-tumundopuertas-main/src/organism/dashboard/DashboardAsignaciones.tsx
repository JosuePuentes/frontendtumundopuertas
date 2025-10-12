import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Eye, CheckCircle, Clock, AlertCircle, TrendingUp, Package, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useDashboardAsignaciones, type Asignacion } from "@/hooks/useDashboardAsignaciones";
import ImageDisplay from "@/upfile/ImageDisplay";
import { getApiUrl } from "@/lib/api";

interface PinVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  empleadoNombre: string;
  loading: boolean;
}

const PinVerification: React.FC<PinVerificationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  empleadoNombre,
  loading
}) => {
  const [pin, setPin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4) {
      onConfirm(pin);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border-2 border-gray-200 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-t-lg border-b">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              🔒
            </div>
            Verificación de PIN
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-gray-50">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <Label htmlFor="pin" className="text-base font-medium text-gray-700 block mb-3">
              Ingresa tu PIN para confirmar la terminación del artículo
            </Label>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Empleado:</span> {empleadoNombre}
              </p>
            </div>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={handlePinChange}
              placeholder="••••"
              maxLength={4}
              className="text-center text-3xl tracking-widest font-mono bg-white border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-16"
              required
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Ingresa 4 dígitos numéricos
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium py-3"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pin.length !== 4 || loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verificando...
                </div>
              ) : (
                "Confirmar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DashboardAsignaciones: React.FC = () => {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [asignacionesFiltradas, setAsignacionesFiltradas] = useState<Asignacion[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [pinModal, setPinModal] = useState<{
    isOpen: boolean;
    asignacion: Asignacion | null;
  }>({ isOpen: false, asignacion: null });
  const [verificandoPin, setVerificandoPin] = useState(false);
  
  // Estados para filtros
  const [modulosSeleccionados, setModulosSeleccionados] = useState<string[]>([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"en_proceso" | "terminado" | "todos">("en_proceso");
  
  // Estados para reportes
  const [fechaInicioReporte, setFechaInicioReporte] = useState("");
  const [fechaFinReporte, setFechaFinReporte] = useState("");
  const [generandoReporte, setGenerandoReporte] = useState(false);
  
  const {
    loading,
    error,
    fetchAsignaciones,
    terminarAsignacion,
    obtenerColorModulo,
    obtenerIconoModulo,
    obtenerEstadisticasModulo,
    obtenerSiguienteModulo
  } = useDashboardAsignaciones();
  
  // Función para probar endpoints manualmente
  const probarEndpoints = async () => {
    const endpoints = [
      '/pedidos/comisiones/produccion/enproceso/?modulo=herreria',
      '/pedidos/comisiones/produccion/enproceso/?modulo=masillar',
      '/pedidos/comisiones/produccion/enproceso/?modulo=preparar'
    ];
    
    console.log('🔍 PROBANDO ENDPOINTS DE MÓDULOS ESPECÍFICOS...');
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${getApiUrl()}${endpoint}`);
        const data = await response.json();
        console.log(`📊 ${endpoint}:`, {
          status: response.status,
          ok: response.ok,
          dataLength: Array.isArray(data) ? data.length : 'No es array',
          data: data
        });
      } catch (err) {
        console.log(`❌ ${endpoint}:`, err);
      }
    }
  };

  // Función para diagnosticar empleados
  const diagnosticarEmpleados = async () => {
    console.log('🔍 DIAGNÓSTICO DE EMPLEADOS');
    console.log('================================');
    
    try {
      // 1. Verificar empleados en la base de datos
      console.log('1️⃣ Obteniendo empleados de la base de datos...');
      const empleadosResponse = await fetch(`${getApiUrl()}/empleados/all/`);
      const empleadosData = await empleadosResponse.json();
      
      console.log('📋 Empleados en BD:', {
        status: empleadosResponse.status,
        ok: empleadosResponse.ok,
        cantidad: Array.isArray(empleadosData) ? empleadosData.length : 'No es array',
        empleados: empleadosData
      });

      // 2. Verificar empleados en asignaciones
      console.log('2️⃣ Verificando empleados en asignaciones...');
      const asignacionesData = await fetchAsignaciones();
      
      const empleadosEnAsignaciones = asignacionesData
        .map(a => a.empleado_nombre)
        .filter((nombre, index, arr) => arr.indexOf(nombre) === index && nombre !== "Sin asignar")
        .sort();

      console.log('👥 Empleados en asignaciones:', {
        cantidad: empleadosEnAsignaciones.length,
        empleados: empleadosEnAsignaciones
      });

      // 3. Comparar empleados
      console.log('3️⃣ Comparando empleados...');
      if (Array.isArray(empleadosData)) {
        const empleadosBD = empleadosData.map(e => e.nombreCompleto || e.identificador).filter(Boolean);
        const empleadosSoloEnBD = empleadosBD.filter(e => !empleadosEnAsignaciones.includes(e));
        const empleadosSoloEnAsignaciones = empleadosEnAsignaciones.filter(e => !empleadosBD.includes(e));
        
        console.log('📊 Comparación:', {
          empleadosSoloEnBD: empleadosSoloEnBD,
          empleadosSoloEnAsignaciones: empleadosSoloEnAsignaciones,
          totalBD: empleadosBD.length,
          totalAsignaciones: empleadosEnAsignaciones.length
        });
      }

      setMensaje(`✅ Diagnóstico completado. Revisa la consola para detalles.`);
      setTimeout(() => setMensaje(""), 5000);

    } catch (error: any) {
      console.error('❌ Error en diagnóstico:', error);
      setMensaje(`❌ Error en diagnóstico: ${error.message || 'Error desconocido'}`);
      setTimeout(() => setMensaje(""), 5000);
    }
  };

  const cargarAsignaciones = async () => {
    try {
      const data = await fetchAsignaciones();
      setAsignaciones(data);
      aplicarFiltros(data, modulosSeleccionados, empleadoSeleccionado, filtroFecha, filtroEstado);
      setMensaje(`Cargadas ${data.length} asignaciones`);
      setTimeout(() => setMensaje(""), 3000);
    } catch (err) {
      console.error('Error al cargar asignaciones:', err);
      setMensaje(`Error al cargar asignaciones`);
      setTimeout(() => setMensaje(""), 5000);
    }
  };

  // Función para aplicar filtros
  const aplicarFiltros = (datos: Asignacion[], modulos: string[], empleado: string, fecha: string, estado: "en_proceso" | "terminado" | "todos") => {
    let filtrados = [...datos];

    // Filtro por estado (PRIMERO - más importante)
    if (estado !== "todos") {
      filtrados = filtrados.filter(asignacion => 
        asignacion.estado === estado
      );
    }

    // Filtro por módulos
    if (modulos.length > 0) {
      filtrados = filtrados.filter(asignacion => 
        modulos.includes(asignacion.modulo)
      );
    }

    // Filtro por empleado específico
    if (empleado.trim()) {
      filtrados = filtrados.filter(asignacion => 
        asignacion.empleado_nombre === empleado
      );
    }

    // Filtro por fecha
    if (fecha) {
      filtrados = filtrados.filter(asignacion => {
        const fechaAsignacion = new Date(asignacion.fecha_asignacion);
        const fechaFiltro = new Date(fecha);
        
        // Comparar solo año, mes y día (ignorar hora)
        return fechaAsignacion.getFullYear() === fechaFiltro.getFullYear() &&
               fechaAsignacion.getMonth() === fechaFiltro.getMonth() &&
               fechaAsignacion.getDate() === fechaFiltro.getDate();
      });
    }

    setAsignacionesFiltradas(filtrados);
  };

  // Manejar cambios en filtros
  const handleModuloChange = (modulo: string, checked: boolean) => {
    let nuevosModulos = [...modulosSeleccionados];
    if (checked) {
      nuevosModulos.push(modulo);
    } else {
      nuevosModulos = nuevosModulos.filter(m => m !== modulo);
    }
    setModulosSeleccionados(nuevosModulos);
  };

  const handleEmpleadoChange = (value: string) => {
    setEmpleadoSeleccionado(value);
  };

  const handleFiltroFechaChange = (value: string) => {
    setFiltroFecha(value);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setModulosSeleccionados([]);
    setEmpleadoSeleccionado("");
    setFiltroFecha("");
    setFiltroEstado("en_proceso"); // Volver al estado por defecto
  };

  // Obtener empleados únicos de los módulos seleccionados
  const obtenerEmpleadosDisponibles = () => {
    if (modulosSeleccionados.length === 0) {
      return [];
    }
    
    const empleados = asignaciones
      .filter(a => modulosSeleccionados.includes(a.modulo))
      .map(a => a.empleado_nombre)
      .filter((nombre, index, arr) => arr.indexOf(nombre) === index && nombre !== "Sin asignar")
      .sort();
    
    return empleados;
  };

  // Función para generar reporte de asignaciones
  const generarReporteAsignaciones = () => {
    if (!fechaInicioReporte || !fechaFinReporte) {
      setMensaje("Por favor selecciona un rango de fechas para el reporte");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setGenerandoReporte(true);
    
    try {
      // Filtrar asignaciones por rango de fechas
      const asignacionesEnRango = asignaciones.filter(asignacion => {
        const fechaAsignacion = new Date(asignacion.fecha_asignacion);
        const fechaInicio = new Date(fechaInicioReporte);
        const fechaFin = new Date(fechaFinReporte);
        
        return fechaAsignacion >= fechaInicio && fechaAsignacion <= fechaFin;
      });

      // Agrupar por empleado
      const reportePorEmpleado: { [key: string]: {
        empleado: string;
        enProceso: number;
        terminadas: number;
        total: number;
        costoTotal: number;
        modulos: string[];
      } } = {};

      asignacionesEnRango.forEach(asignacion => {
        const empleado = asignacion.empleado_nombre || "Sin asignar";
        
        if (!reportePorEmpleado[empleado]) {
          reportePorEmpleado[empleado] = {
            empleado,
            enProceso: 0,
            terminadas: 0,
            total: 0,
            costoTotal: 0,
            modulos: []
          };
        }

        const reporte = reportePorEmpleado[empleado];
        
        if (asignacion.estado === "terminado") {
          reporte.terminadas++;
        } else {
          reporte.enProceso++;
        }
        
        reporte.total++;
        reporte.costoTotal += asignacion.costo_produccion || 0;
        
        if (!reporte.modulos.includes(asignacion.modulo)) {
          reporte.modulos.push(asignacion.modulo);
        }
      });

      // Convertir a array y ordenar por total de asignaciones
      const datosReporte = Object.values(reportePorEmpleado)
        .sort((a, b) => b.total - a.total);

      // Generar datos para Excel
      const datosExcel = [
        // Encabezados
        [
          "Empleado",
          "Asignaciones En Proceso",
          "Asignaciones Terminadas", 
          "Total Asignaciones",
          "Costo Total Producción",
          "Módulos Trabajados"
        ],
        // Datos
        ...datosReporte.map(item => [
          item.empleado,
          item.enProceso,
          item.terminadas,
          item.total,
          `$${item.costoTotal.toFixed(2)}`,
          item.modulos.join(", ")
        ]),
        // Resumen
        [],
        ["RESUMEN GENERAL"],
        ["Total Empleados", datosReporte.length],
        ["Total Asignaciones En Proceso", datosReporte.reduce((sum, item) => sum + item.enProceso, 0)],
        ["Total Asignaciones Terminadas", datosReporte.reduce((sum, item) => sum + item.terminadas, 0)],
        ["Total Asignaciones", datosReporte.reduce((sum, item) => sum + item.total, 0)],
        ["Costo Total Producción", `$${datosReporte.reduce((sum, item) => sum + item.costoTotal, 0).toFixed(2)}`]
      ];

      // Exportar a Excel
      const ws = XLSX.utils.aoa_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reporte Asignaciones");
      
      const nombreArchivo = `Reporte_Asignaciones_${fechaInicioReporte}_a_${fechaFinReporte}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);

      setMensaje(`✅ Reporte Excel exportado exitosamente: ${nombreArchivo}`);
      setTimeout(() => setMensaje(""), 5000);

    } catch (error) {
      console.error('Error al generar reporte:', error);
      setMensaje("❌ Error al generar el reporte");
      setTimeout(() => setMensaje(""), 5000);
    } finally {
      setGenerandoReporte(false);
    }
  };

  // Función para generar reporte en PDF
  const generarReportePDF = () => {
    if (!fechaInicioReporte || !fechaFinReporte) {
      setMensaje("Por favor selecciona un rango de fechas para el reporte");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setGenerandoReporte(true);
    
    try {
      // Filtrar asignaciones por rango de fechas
      const asignacionesEnRango = asignaciones.filter(asignacion => {
        const fechaAsignacion = new Date(asignacion.fecha_asignacion);
        const fechaInicio = new Date(fechaInicioReporte);
        const fechaFin = new Date(fechaFinReporte);
        
        return fechaAsignacion >= fechaInicio && fechaAsignacion <= fechaFin;
      });

      // Agrupar por empleado
      const reportePorEmpleado: { [key: string]: {
        empleado: string;
        enProceso: number;
        terminadas: number;
        total: number;
        costoTotal: number;
        modulos: string[];
      } } = {};

      asignacionesEnRango.forEach(asignacion => {
        const empleado = asignacion.empleado_nombre || "Sin asignar";
        
        if (!reportePorEmpleado[empleado]) {
          reportePorEmpleado[empleado] = {
            empleado,
            enProceso: 0,
            terminadas: 0,
            total: 0,
            costoTotal: 0,
            modulos: []
          };
        }

        const reporte = reportePorEmpleado[empleado];
        
        if (asignacion.estado === "terminado") {
          reporte.terminadas++;
        } else {
          reporte.enProceso++;
        }
        
        reporte.total++;
        reporte.costoTotal += asignacion.costo_produccion || 0;
        
        if (!reporte.modulos.includes(asignacion.modulo)) {
          reporte.modulos.push(asignacion.modulo);
        }
      });

      // Convertir a array y ordenar por total de asignaciones
      const datosReporte = Object.values(reportePorEmpleado)
        .sort((a, b) => b.total - a.total);

      // Crear PDF
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('REPORTE DE ASIGNACIONES', 20, 20);
      
      // Información del rango de fechas
      doc.setFontSize(12);
      doc.text(`Período: ${new Date(fechaInicioReporte).toLocaleDateString()} - ${new Date(fechaFinReporte).toLocaleDateString()}`, 20, 35);
      doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 45);
      
      // Datos de la tabla
      const tableData = datosReporte.map(item => [
        item.empleado,
        item.enProceso.toString(),
        item.terminadas.toString(),
        item.total.toString(),
        `$${item.costoTotal.toFixed(2)}`,
        item.modulos.join(", ")
      ]);

      // Agregar tabla
      (doc as any).autoTable({
        startY: 60,
        head: [['Empleado', 'En Proceso', 'Terminadas', 'Total', 'Costo Total', 'Módulos']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // Resumen general
      const totalEmpleados = datosReporte.length;
      const totalEnProceso = datosReporte.reduce((sum, item) => sum + item.enProceso, 0);
      const totalTerminadas = datosReporte.reduce((sum, item) => sum + item.terminadas, 0);
      const totalAsignaciones = datosReporte.reduce((sum, item) => sum + item.total, 0);
      const costoTotal = datosReporte.reduce((sum, item) => sum + item.costoTotal, 0);

      const finalY = (doc as any).lastAutoTable.finalY + 20;
      
      doc.setFontSize(14);
      doc.text('RESUMEN GENERAL', 20, finalY);
      
      doc.setFontSize(11);
      doc.text(`Total de Empleados: ${totalEmpleados}`, 20, finalY + 15);
      doc.text(`Asignaciones En Proceso: ${totalEnProceso}`, 20, finalY + 25);
      doc.text(`Asignaciones Terminadas: ${totalTerminadas}`, 20, finalY + 35);
      doc.text(`Total de Asignaciones: ${totalAsignaciones}`, 20, finalY + 45);
      doc.text(`Costo Total de Producción: $${costoTotal.toFixed(2)}`, 20, finalY + 55);

      // Guardar PDF
      const nombreArchivo = `Reporte_Asignaciones_${fechaInicioReporte}_a_${fechaFinReporte}.pdf`;
      doc.save(nombreArchivo);

      setMensaje(`✅ Reporte PDF exportado exitosamente: ${nombreArchivo}`);
      setTimeout(() => setMensaje(""), 5000);

    } catch (error) {
      console.error('Error al generar reporte PDF:', error);
      setMensaje("❌ Error al generar el reporte PDF");
      setTimeout(() => setMensaje(""), 5000);
    } finally {
      setGenerandoReporte(false);
    }
  };

  useEffect(() => {
    cargarAsignaciones();
  }, []);

  // Actualización automática cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Actualización automática cada 5 minutos...');
      cargarAsignaciones();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  // Aplicar filtros cuando cambien los filtros o las asignaciones
  useEffect(() => {
    if (asignaciones.length > 0) {
      aplicarFiltros(asignaciones, modulosSeleccionados, empleadoSeleccionado, filtroFecha, filtroEstado);
    }
  }, [asignaciones, modulosSeleccionados, empleadoSeleccionado, filtroFecha, filtroEstado]);


  const handleTerminarAsignacion = (asignacion: Asignacion) => {
    setPinModal({ isOpen: true, asignacion });
  };

  const handleConfirmarPin = async (pin: string) => {
    if (!pinModal.asignacion) return;

    console.log('🔄 Iniciando proceso de terminación de asignación...');
    console.log('📋 Datos de la asignación:', {
      pedido_id: pinModal.asignacion.pedido_id,
      item_id: pinModal.asignacion.item_id,
      empleado_id: pinModal.asignacion.empleado_id,
      empleado_nombre: pinModal.asignacion.empleado_nombre,
      modulo_actual: pinModal.asignacion.modulo,
      descripcion: pinModal.asignacion.descripcionitem,
      costo_produccion: pinModal.asignacion.costo_produccion
    });

    setVerificandoPin(true);
    try {
      const result = await terminarAsignacion({
        pedido_id: pinModal.asignacion.pedido_id,
        orden: pinModal.asignacion.orden || 0,  // ← AGREGAR ESTE PARÁMETRO
        item_id: pinModal.asignacion.item_id,
        empleado_id: pinModal.asignacion.empleado_id,
        estado: "terminado",
        fecha_fin: new Date().toISOString(),
        pin: pin,
      });

      console.log('✅ Respuesta del backend:', result);

      let mensajeExito = "¡Asignación terminada exitosamente!";
      
      if (result.asignacion_actualizada?.siguiente_modulo) {
        const siguienteModulo = result.asignacion_actualizada.siguiente_modulo;
        mensajeExito += ` El artículo ahora está en ${siguienteModulo}.`;
        console.log(`🔄 Artículo movido de ${pinModal.asignacion.modulo} a ${siguienteModulo}`);
      }
      
      if (result.asignacion_actualizada?.comision_registrada) {
        mensajeExito += " Comisión registrada en el reporte.";
        console.log(`💰 Comisión registrada: $${pinModal.asignacion.costo_produccion} para ${pinModal.asignacion.empleado_nombre}`);
      }

      console.log('📊 Flujo de producción completado:', {
        modulo_anterior: pinModal.asignacion.modulo,
        modulo_siguiente: result.asignacion_actualizada?.siguiente_modulo,
        empleado: pinModal.asignacion.empleado_nombre,
        costo_comision: pinModal.asignacion.costo_produccion,
        comision_registrada: result.asignacion_actualizada?.comision_registrada
      });

      setMensaje(mensajeExito);
      setTimeout(() => setMensaje(""), 5000);
      
      // Recargar asignaciones para reflejar los cambios
      console.log('🔄 Recargando asignaciones para mostrar cambios...');
      cargarAsignaciones();
      
      // Cerrar modal
      setPinModal({ isOpen: false, asignacion: null });
      
    } catch (err: any) {
      console.error('❌ Error al terminar asignación:', err);
      setMensaje(`Error al terminar asignación: ${err.message}`);
      setTimeout(() => setMensaje(""), 5000);
    } finally {
      setVerificandoPin(false);
    }
  };

  // Estadísticas generales (usando asignaciones filtradas)
  const estadisticasGenerales = {
    total: Array.isArray(asignacionesFiltradas) ? asignacionesFiltradas.length : 0,
    enProceso: Array.isArray(asignacionesFiltradas) ? asignacionesFiltradas.filter(a => a.estado === 'en_proceso').length : 0,
    terminadas: Array.isArray(asignacionesFiltradas) ? asignacionesFiltradas.filter(a => a.estado === 'terminado').length : 0,
    costoTotal: Array.isArray(asignacionesFiltradas) ? asignacionesFiltradas.reduce((sum, a) => sum + (a.costo_produccion || 0), 0) : 0
  };

  const estadisticasPorModulo = {
    herreria: obtenerEstadisticasModulo(Array.isArray(asignacionesFiltradas) ? asignacionesFiltradas : [], 'herreria'),
    masillar: obtenerEstadisticasModulo(Array.isArray(asignacionesFiltradas) ? asignacionesFiltradas : [], 'masillar'),
    preparar: obtenerEstadisticasModulo(Array.isArray(asignacionesFiltradas) ? asignacionesFiltradas : [], 'preparar'),
    listo_facturar: obtenerEstadisticasModulo(Array.isArray(asignacionesFiltradas) ? asignacionesFiltradas : [], 'listo_facturar')
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "en_proceso": return <Clock className="w-4 h-4 text-yellow-600" />;
      case "terminado": return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Cargando asignaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Asignaciones</h1>
          <p className="text-gray-600">Gestiona todas las asignaciones de producción</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={probarEndpoints}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            🔍 Probar Endpoints
          </Button>
          <Button
            onClick={diagnosticarEmpleados}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            👥 Diagnosticar Empleados
          </Button>
          <Button
            onClick={cargarAsignaciones}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
        </div>
      </div>

      {/* Sección de Reportes */}
      <div className="bg-white p-4 rounded-lg mb-6 border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Generar Reportes
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Fecha de inicio */}
          <div>
            <Label htmlFor="fecha-inicio-reporte" className="text-sm font-medium">
              Fecha de Inicio
            </Label>
            <Input
              id="fecha-inicio-reporte"
              type="date"
              value={fechaInicioReporte}
              onChange={(e) => setFechaInicioReporte(e.target.value)}
              className="mt-1 bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Fecha de fin */}
          <div>
            <Label htmlFor="fecha-fin-reporte" className="text-sm font-medium">
              Fecha de Fin
            </Label>
            <Input
              id="fecha-fin-reporte"
              type="date"
              value={fechaFinReporte}
              onChange={(e) => setFechaFinReporte(e.target.value)}
              className="mt-1 bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Botones de exportación */}
        <div className="flex gap-3">
          <Button
            onClick={generarReporteAsignaciones}
            disabled={generandoReporte || !fechaInicioReporte || !fechaFinReporte}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {generandoReporte ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exportar Excel
          </Button>
          
          <Button
            onClick={generarReportePDF}
            disabled={generandoReporte || !fechaInicioReporte || !fechaFinReporte}
            variant="outline"
            className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
          >
            {generandoReporte ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exportar PDF
          </Button>
        </div>

        {/* Información del reporte */}
        <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-700">
          <strong>📊 Información del Reporte:</strong>
          <ul className="mt-1 ml-4 list-disc">
            <li>Resumen por empleado con asignaciones en proceso y terminadas</li>
            <li>Costo total de producción por empleado</li>
            <li>Módulos trabajados por cada empleado</li>
            <li>Resumen general con totales</li>
            <li>Datos filtrados por el rango de fechas seleccionado</li>
          </ul>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        
        {/* Filtro por módulos */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">Módulos de Producción</Label>
          <div className="flex gap-4 flex-wrap">
            {['herreria', 'masillar', 'preparar'].map((modulo) => (
              <div key={modulo} className="flex items-center space-x-2">
                <Checkbox
                  id={`modulo-${modulo}`}
                  checked={modulosSeleccionados.includes(modulo)}
                  onCheckedChange={(checked) => handleModuloChange(modulo, checked as boolean)}
                />
                <Label htmlFor={`modulo-${modulo}`} className="text-sm">
                  {modulo.toUpperCase()}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Filtro por estado */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">Estado de Asignaciones</Label>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="estado-en-proceso"
                checked={filtroEstado === "en_proceso"}
                onCheckedChange={(checked) => checked && setFiltroEstado("en_proceso")}
              />
              <Label htmlFor="estado-en-proceso" className="text-sm">
                🔄 En Proceso (para terminar)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="estado-terminado"
                checked={filtroEstado === "terminado"}
                onCheckedChange={(checked) => checked && setFiltroEstado("terminado")}
              />
              <Label htmlFor="estado-terminado" className="text-sm">
                ✅ Terminadas
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="estado-todos"
                checked={filtroEstado === "todos"}
                onCheckedChange={(checked) => checked && setFiltroEstado("todos")}
              />
              <Label htmlFor="estado-todos" className="text-sm">
                📋 Todos
              </Label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por empleado */}
          <div>
            <Label htmlFor="filtro-empleado" className="text-sm font-medium">
              Empleado
            </Label>
            <Select
              value={empleadoSeleccionado}
              onValueChange={handleEmpleadoChange}
              disabled={modulosSeleccionados.length === 0}
            >
              <SelectTrigger className={`mt-1 ${
                modulosSeleccionados.length === 0 
                  ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed" 
                  : "bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              }`}>
                <SelectValue placeholder={
                  modulosSeleccionados.length === 0 
                    ? "Selecciona módulos primero" 
                    : "Selecciona un empleado"
                } />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                {obtenerEmpleadosDisponibles().length > 0 ? (
                  obtenerEmpleadosDisponibles().map((empleado) => (
                    <SelectItem 
                      key={empleado} 
                      value={empleado}
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      {empleado}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50">
                    No hay empleados en los módulos seleccionados
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por fecha */}
          <div>
            <Label htmlFor="filtro-fecha" className="text-sm font-medium">
              Fecha de asignación
            </Label>
            <Input
              id="filtro-fecha"
              type="date"
              value={filtroFecha}
              onChange={(e) => handleFiltroFechaChange(e.target.value)}
              className="mt-1 bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Botón limpiar filtros */}
        <div className="mt-4 flex justify-end">
          <Button
            onClick={limpiarFiltros}
            variant="outline"
            disabled={modulosSeleccionados.length === 0 && !empleadoSeleccionado && !filtroFecha && filtroEstado === "en_proceso"}
          >
            Limpiar Filtros
          </Button>
        </div>

        {/* Información de filtros activos */}
        {(modulosSeleccionados.length > 0 || empleadoSeleccionado || filtroFecha || filtroEstado !== "en_proceso") && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
            <strong>Filtros activos:</strong>
            {filtroEstado !== "en_proceso" && (
              <span> Estado: {filtroEstado === "terminado" ? "✅ Terminadas" : "📋 Todos"}</span>
            )}
            {modulosSeleccionados.length > 0 && (
              <span> Módulos: {modulosSeleccionados.map(m => m.toUpperCase()).join(', ')}</span>
            )}
            {empleadoSeleccionado && <span> Empleado: "{empleadoSeleccionado}"</span>}
            {filtroFecha && <span> Fecha: {new Date(filtroFecha).toLocaleDateString()}</span>}
            <span className="ml-2">
              ({asignacionesFiltradas.length} de {asignaciones.length} asignaciones)
            </span>
          </div>
        )}
      </div>

      {/* Flujo de Producción */}
      <div className="bg-white p-4 rounded-lg mb-6 border">
        <h3 className="text-lg font-semibold mb-4">Flujo de Producción</h3>
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-100 text-blue-800">🔨 HERRERÍA</Badge>
            <span className="text-gray-400">→</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-100 text-green-800">🎨 MASILLAR</Badge>
            <span className="text-gray-400">→</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-yellow-100 text-yellow-800">⚙️ PREPARAR</Badge>
            <span className="text-gray-400">→</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-purple-100 text-purple-800">✅ LISTO FACTURAR</Badge>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Cada empleado termina su trabajo y el artículo pasa al siguiente módulo automáticamente
        </p>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Asignaciones</p>
                <p className="text-2xl font-bold">{estadisticasGenerales.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-yellow-600">{estadisticasGenerales.enProceso}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Terminadas</p>
                <p className="text-2xl font-bold text-green-600">{estadisticasGenerales.terminadas}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Costo Total</p>
                <p className="text-2xl font-bold text-purple-600">${estadisticasGenerales.costoTotal.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas por Módulo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(estadisticasPorModulo).map(([modulo, stats]) => (
          <Card key={modulo}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge className={obtenerColorModulo(modulo)}>
                  {obtenerIconoModulo(modulo)} {modulo.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Total: {stats.total}</p>
                <p className="text-sm text-gray-600">En Proceso: {stats.enProceso}</p>
                <p className="text-sm text-gray-600">Terminadas: {stats.terminadas}</p>
                <p className="text-sm font-semibold">Costo: ${stats.costoTotal.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mensaje && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
          {error}
        </div>
      )}

      {Array.isArray(asignacionesFiltradas) && asignacionesFiltradas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {asignaciones.length === 0 ? "No hay asignaciones" : "No hay resultados"}
            </h3>
            <p className="text-gray-500">
              {asignaciones.length === 0 
                ? "No se encontraron asignaciones de producción."
                : "No se encontraron asignaciones que coincidan con los filtros aplicados."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Array.isArray(asignacionesFiltradas) && asignacionesFiltradas.map((asignacion) => (
            <Card key={asignacion._id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {asignacion.descripcionitem}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={obtenerColorModulo(asignacion.modulo)}>
                        {obtenerIconoModulo(asignacion.modulo)} {asignacion.modulo.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getEstadoIcon(asignacion.estado)}
                        <span className="text-sm text-gray-600">
                          {asignacion.estado.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Asignado a:</p>
                    <p className="font-semibold">{asignacion.empleado_nombre}</p>
                    <p className="text-sm text-gray-500">
                      ${asignacion.costo_produccion.toFixed(2)}
                    </p>
                    {asignacion.estado === "en_proceso" && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Próximo módulo:</p>
                        <Badge className={obtenerColorModulo(obtenerSiguienteModulo(asignacion.modulo))}>
                          {obtenerIconoModulo(obtenerSiguienteModulo(asignacion.modulo))} {obtenerSiguienteModulo(asignacion.modulo).toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Mostrar imágenes si existen */}
                {Array.isArray(asignacion.imagenes) && asignacion.imagenes.length > 0 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {asignacion.imagenes.slice(0, 3).map((img, imgIdx) => (
                      <ImageDisplay
                        key={imgIdx}
                        imageName={img}
                        alt={`Imagen ${imgIdx + 1}`}
                        style={{ maxWidth: 70, maxHeight: 70, borderRadius: 8, border: '1px solid #ddd' }}
                      />
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Cliente:</p>
                    <p className="font-medium">{asignacion.cliente_nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de asignación:</p>
                    <p className="font-medium">
                      {new Date(asignacion.fecha_asignacion).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {asignacion.detalleitem && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Detalles:</p>
                    <p className="text-base bg-blue-50 border border-blue-200 p-3 rounded-lg text-gray-800 font-medium">
                      {asignacion.detalleitem}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  {asignacion.estado === "en_proceso" && (
                    <Button
                      onClick={() => handleTerminarAsignacion(asignacion)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Terminar Asignación
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PinVerification
        isOpen={pinModal.isOpen}
        onClose={() => setPinModal({ isOpen: false, asignacion: null })}
        onConfirm={handleConfirmarPin}
        empleadoNombre={pinModal.asignacion?.empleado_nombre || ""}
        loading={verificandoPin}
      />
    </div>
  );
};

export default DashboardAsignaciones;
