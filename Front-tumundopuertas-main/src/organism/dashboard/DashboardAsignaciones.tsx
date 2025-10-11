import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Eye, CheckCircle, Clock, AlertCircle, TrendingUp, Package } from "lucide-react";
import { useDashboardAsignaciones } from "@/hooks/useDashboardAsignaciones";
import ImageDisplay from "@/upfile/ImageDisplay";
import { getApiUrl } from "@/lib/api";

interface Asignacion {
  _id: string;
  pedido_id: string;
  item_id: string;
  empleado_id: string;
  empleado_nombre: string;
  modulo: string;
  estado: string;
  fecha_asignacion: string;
  fecha_fin?: string;
  descripcionitem: string;
  detalleitem?: string;
  cliente_nombre: string;
  costo_produccion: number;
  imagenes?: string[];
}

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Verificación de PIN</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pin">
              Ingresa tu PIN para confirmar la terminación del artículo
            </Label>
            <p className="text-sm text-gray-600 mb-2">
              Empleado: <strong>{empleadoNombre}</strong>
            </p>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={handlePinChange}
              placeholder="1234"
              maxLength={4}
              className="text-center text-2xl tracking-widest"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pin.length !== 4 || loading}
              className="flex-1"
            >
              {loading ? "Verificando..." : "Confirmar"}
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

  const cargarAsignaciones = async () => {
    try {
      const data = await fetchAsignaciones();
      setAsignaciones(data);
      aplicarFiltros(data, modulosSeleccionados, empleadoSeleccionado, filtroFecha);
      setMensaje(`Cargadas ${data.length} asignaciones`);
      setTimeout(() => setMensaje(""), 3000);
    } catch (err) {
      console.error('Error al cargar asignaciones:', err);
      setMensaje(`Error al cargar asignaciones`);
      setTimeout(() => setMensaje(""), 5000);
    }
  };

  // Función para aplicar filtros
  const aplicarFiltros = (datos: Asignacion[], modulos: string[], empleado: string, fecha: string) => {
    let filtrados = [...datos];

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
    aplicarFiltros(asignaciones, nuevosModulos, empleadoSeleccionado, filtroFecha);
  };

  const handleEmpleadoChange = (value: string) => {
    setEmpleadoSeleccionado(value);
    aplicarFiltros(asignaciones, modulosSeleccionados, value, filtroFecha);
  };

  const handleFiltroFechaChange = (value: string) => {
    setFiltroFecha(value);
    aplicarFiltros(asignaciones, modulosSeleccionados, empleadoSeleccionado, value);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setModulosSeleccionados([]);
    setEmpleadoSeleccionado("");
    setFiltroFecha("");
    setAsignacionesFiltradas(asignaciones);
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

  useEffect(() => {
    cargarAsignaciones();
  }, []);

  // Inicializar asignaciones filtradas cuando cambien las asignaciones
  useEffect(() => {
    if (asignaciones.length > 0 && asignacionesFiltradas.length === 0) {
      setAsignacionesFiltradas(asignaciones);
    }
  }, [asignaciones]);


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
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={
                  modulosSeleccionados.length === 0 
                    ? "Selecciona módulos primero" 
                    : "Selecciona un empleado"
                } />
              </SelectTrigger>
              <SelectContent>
                {obtenerEmpleadosDisponibles().map((empleado) => (
                  <SelectItem key={empleado} value={empleado}>
                    {empleado}
                  </SelectItem>
                ))}
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
              className="mt-1"
            />
          </div>
        </div>

        {/* Botón limpiar filtros */}
        <div className="mt-4 flex justify-end">
          <Button
            onClick={limpiarFiltros}
            variant="outline"
            disabled={modulosSeleccionados.length === 0 && !empleadoSeleccionado && !filtroFecha}
          >
            Limpiar Filtros
          </Button>
        </div>

        {/* Información de filtros activos */}
        {(modulosSeleccionados.length > 0 || empleadoSeleccionado || filtroFecha) && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
            <strong>Filtros activos:</strong>
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
                    <p className="text-sm text-gray-600">Detalles:</p>
                    <p className="text-sm bg-gray-50 p-2 rounded">
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
