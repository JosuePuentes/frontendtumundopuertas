import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [mensaje, setMensaje] = useState("");
  const [pinModal, setPinModal] = useState<{
    isOpen: boolean;
    asignacion: Asignacion | null;
  }>({ isOpen: false, asignacion: null });
  const [verificandoPin, setVerificandoPin] = useState(false);
  
  const {
    loading,
    error,
    fetchAsignaciones,
    terminarAsignacion,
    obtenerColorModulo,
    obtenerIconoModulo,
    obtenerEstadisticasModulo
  } = useDashboardAsignaciones();
  
  // Función para probar endpoints manualmente
  const probarEndpoints = async () => {
    const endpoints = [
      '/pedidos/comisiones/produccion/enproceso',
      '/pedidos/comisiones/produccion',
      '/pedidos/produccion/enproceso',
      '/pedidos/enproceso',
      '/pedidos/comisiones/produccion/enproceso/?modulo=herreria',
      '/pedidos/comisiones/produccion/enproceso/?modulo=masillar',
      '/pedidos/comisiones/produccion/enproceso/?modulo=preparar'
    ];
    
    console.log('🔍 PROBANDO ENDPOINTS MANUALMENTE...');
    
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
    } catch (err) {
      console.error('Error al cargar asignaciones:', err);
    }
  };

  useEffect(() => {
    cargarAsignaciones();
  }, []);

  const handleTerminarAsignacion = (asignacion: Asignacion) => {
    setPinModal({ isOpen: true, asignacion });
  };

  const handleConfirmarPin = async (pin: string) => {
    if (!pinModal.asignacion) return;

    setVerificandoPin(true);
    try {
      const result = await terminarAsignacion({
        asignacion_id: pinModal.asignacion._id,
        pin: pin,
        empleado_id: pinModal.asignacion.empleado_id,
        pedido_id: pinModal.asignacion.pedido_id,
        item_id: pinModal.asignacion.item_id,
        modulo_actual: pinModal.asignacion.modulo,
      });

      let mensajeExito = "¡Asignación terminada exitosamente!";
      
      if (result.siguiente_modulo) {
        mensajeExito += ` El artículo ahora está en ${result.siguiente_modulo}.`;
      }
      
      if (result.comision_registrada) {
        mensajeExito += " Comisión registrada en el reporte.";
      }

      setMensaje(mensajeExito);
      setTimeout(() => setMensaje(""), 5000);
      
      // Recargar asignaciones
      cargarAsignaciones();
      
      // Cerrar modal
      setPinModal({ isOpen: false, asignacion: null });
      
    } catch (err: any) {
      console.error('Error al terminar asignación:', err);
    } finally {
      setVerificandoPin(false);
    }
  };

  // Estadísticas generales
  const estadisticasGenerales = {
    total: Array.isArray(asignaciones) ? asignaciones.length : 0,
    enProceso: Array.isArray(asignaciones) ? asignaciones.filter(a => a.estado === 'en_proceso').length : 0,
    terminadas: Array.isArray(asignaciones) ? asignaciones.filter(a => a.estado === 'terminado').length : 0,
    costoTotal: Array.isArray(asignaciones) ? asignaciones.reduce((sum, a) => sum + (a.costo_produccion || 0), 0) : 0
  };

  const estadisticasPorModulo = {
    herreria: obtenerEstadisticasModulo(Array.isArray(asignaciones) ? asignaciones : [], 'herreria'),
    masillar: obtenerEstadisticasModulo(Array.isArray(asignaciones) ? asignaciones : [], 'masillar'),
    preparar: obtenerEstadisticasModulo(Array.isArray(asignaciones) ? asignaciones : [], 'preparar'),
    listo_facturar: obtenerEstadisticasModulo(Array.isArray(asignaciones) ? asignaciones : [], 'listo_facturar')
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

      {Array.isArray(asignaciones) && asignaciones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No hay asignaciones
            </h3>
            <p className="text-gray-500">
              No se encontraron asignaciones de producción.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Array.isArray(asignaciones) && asignaciones.map((asignacion) => (
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
