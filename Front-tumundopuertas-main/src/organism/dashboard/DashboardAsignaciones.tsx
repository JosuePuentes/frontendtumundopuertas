import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Package, CheckCircle } from "lucide-react";
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
  descripcionitem: string;
  detalleitem: string;
  cliente_nombre: string;
  costo_produccion: number;
  imagenes: string[];
}

const DashboardAsignaciones: React.FC = () => {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empleados, setEmpleados] = useState<any[]>([]);
  
  // Estados para el modal de PIN
  const [pinModal, setPinModal] = useState<{
    isOpen: boolean;
    asignacion: Asignacion | null;
  }>({ isOpen: false, asignacion: null });
  const [pin, setPin] = useState("");
  const [verificandoPin, setVerificandoPin] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Función para cargar empleados
  const cargarEmpleados = async () => {
    try {
      console.log('🔄 Cargando empleados...');
      const response = await fetch(`${getApiUrl()}/empleados/all/`);
      console.log('📡 Response empleados status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Datos empleados obtenidos:', data);
        console.log('🔍 Tipo de datos empleados:', Array.isArray(data) ? 'Array' : typeof data);
        
        // ARREGLADO: El backend puede devolver {empleados: Array} o Array directo
        const empleadosArray = data.empleados || data;
        console.log('📋 Empleados extraídos:', empleadosArray);
        
        if (Array.isArray(empleadosArray)) {
          const empleadosActivos = empleadosArray.filter(emp => emp.activo !== false);
          setEmpleados(empleadosActivos);
          console.log('✅ Empleados activos cargados:', empleadosActivos.length);
          console.log('📋 Primer empleado:', empleadosActivos[0]);
        } else {
          console.log('⚠️ Datos de empleados no es array:', empleadosArray);
          setEmpleados([]);
        }
      } else {
        console.error('❌ Response empleados no ok:', response.status);
        setEmpleados([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar empleados:', error);
      setEmpleados([]);
    }
  };

  // Función optimizada para cargar asignaciones con múltiples endpoints
  const cargarAsignaciones = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando asignaciones...');
      console.log('🌐 API URL:', getApiUrl());
      
      // Intentar primero el endpoint optimizado /asignaciones
      try {
        console.log('🔄 Intentando endpoint /asignaciones...');
        const response = await fetch(`${getApiUrl()}/asignaciones`);
        console.log('📡 Response /asignaciones status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📋 Datos /asignaciones obtenidos:', data);
          
          const asignacionesArray = data.asignaciones || data;
          console.log('📋 Asignaciones extraídas:', asignacionesArray);
          
          if (Array.isArray(asignacionesArray) && asignacionesArray.length > 0) {
            console.log('✅ Asignaciones obtenidas del endpoint /asignaciones:', asignacionesArray.length);
            
            // Convertir al formato esperado
            const asignacionesData: Asignacion[] = asignacionesArray.map((asig: any) => ({
              _id: asig._id || `${asig.pedido_id}_${asig.item_id}`,
              pedido_id: asig.pedido_id,
              item_id: asig.item_id,
              empleado_id: asig.empleado_id || "sin_asignar",
              empleado_nombre: asig.empleado_nombre || asig.nombreempleado || "Sin asignar",
              modulo: asig.modulo || (asig.orden === 1 ? 'herreria' : 
                     asig.orden === 2 ? 'masillar' : 
                     asig.orden === 3 ? 'preparar' : 
                     asig.orden === 4 ? 'facturar' : 'herreria'),
              estado: asig.estado || "en_proceso",
              fecha_asignacion: asig.fecha_asignacion || asig.fecha_inicio || new Date().toISOString(),
              descripcionitem: asig.descripcionitem || "Sin descripción",
              detalleitem: asig.detalleitem || "",
              cliente_nombre: asig.cliente_nombre || asig.cliente?.cliente_nombre || "Sin cliente",
              costo_produccion: Number(asig.costo_produccion || asig.costoproduccion) || 0,
              imagenes: asig.imagenes || []
            }));
            
            // Ordenar por fecha (más recientes primero)
            const asignacionesOrdenadas = asignacionesData.sort((a, b) => {
              const fechaA = new Date(a.fecha_asignacion).getTime();
              const fechaB = new Date(b.fecha_asignacion).getTime();
              return fechaB - fechaA;
            });
            
            setAsignaciones(asignacionesOrdenadas);
            console.log('✅ Estado actualizado con asignaciones del endpoint /asignaciones');
            return;
          }
        }
      } catch (error) {
        console.log('⚠️ Endpoint /asignaciones no disponible, usando fallback...', error);
      }
      
      // Fallback: Usar endpoint de comisiones en proceso
      console.log('🔄 Usando endpoint de fallback /pedidos/comisiones/produccion/enproceso/...');
      const url = `${getApiUrl()}/pedidos/comisiones/produccion/enproceso/`;
      console.log('📡 URL completa:', url);
      
      const response = await fetch(url);
      console.log('📡 Response fallback status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Datos fallback obtenidos:', data);
        
        const asignacionesArray = data.asignaciones || data;
        console.log('📋 Asignaciones fallback extraídas:', asignacionesArray);
        
        if (Array.isArray(asignacionesArray) && asignacionesArray.length > 0) {
          console.log('✅ Asignaciones obtenidas del endpoint fallback:', asignacionesArray.length);
          
          // Convertir asignaciones del backend al formato esperado
          const asignacionesData: Asignacion[] = asignacionesArray.map((asig: any) => ({
            _id: asig._id || `${asig.pedido_id}_${asig.item_id}`,
            pedido_id: asig.pedido_id,
            item_id: asig.item_id,
            empleado_id: asig.empleado_id || "sin_asignar",
            empleado_nombre: asig.nombreempleado || "Sin asignar",
            modulo: asig.orden === 1 ? 'herreria' : 
                   asig.orden === 2 ? 'masillar' : 
                   asig.orden === 3 ? 'preparar' : 
                   asig.orden === 4 ? 'facturar' : 'herreria',
            estado: asig.estado || "en_proceso",
            fecha_asignacion: asig.fecha_inicio || new Date().toISOString(),
            descripcionitem: asig.descripcionitem || "Sin descripción",
            detalleitem: asig.detalleitem || "",
            cliente_nombre: asig.cliente?.cliente_nombre || "Sin cliente",
            costo_produccion: Number(asig.costoproduccion) || 0,
            imagenes: asig.imagenes || []
          }));
          
          // Ordenar por fecha (más recientes primero)
          const asignacionesOrdenadas = asignacionesData.sort((a, b) => {
            const fechaA = new Date(a.fecha_asignacion).getTime();
            const fechaB = new Date(b.fecha_asignacion).getTime();
            return fechaB - fechaA;
          });
          
          setAsignaciones(asignacionesOrdenadas);
          console.log('✅ Estado actualizado con asignaciones del endpoint fallback');
        } else {
          console.log('⚠️ No hay asignaciones en proceso');
          setAsignaciones([]);
        }
      } else {
        console.error('❌ Response fallback no ok:', response.status, response.statusText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
    } catch (err: any) {
      console.error('❌ Error al cargar asignaciones:', err);
      setError(`Error al cargar asignaciones: ${err.message}`);
      setAsignaciones([]);
    } finally {
      setLoading(false);
    }
  };

  // Debug del estado de asignaciones
  useEffect(() => {
    console.log('🔍 ESTADO ASIGNACIONES CAMBIÓ:', asignaciones.length, asignaciones);
  }, [asignaciones]);

  // Cargar datos solo al montar el componente
  useEffect(() => {
    cargarAsignaciones();
    cargarEmpleados();
  }, []);

  // NUEVO: Escuchar eventos de asignación realizada
  useEffect(() => {
    const handleAsignacionRealizada = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { pedidoId, asignaciones, timestamp } = customEvent.detail;
      console.log('🎯 DashboardAsignaciones: Asignación realizada detectada:', { pedidoId, asignaciones, timestamp });
      
      // Recargar asignaciones para mostrar la nueva asignación
      cargarAsignaciones();
    };

    window.addEventListener('asignacionRealizada', handleAsignacionRealizada);
    
    return () => {
      window.removeEventListener('asignacionRealizada', handleAsignacionRealizada);
    };
  }, []);

  // Función para obtener color del módulo
  const obtenerColorModulo = (modulo: string) => {
    const colores: { [key: string]: string } = {
      herreria: "bg-orange-100 text-orange-800",
      masillar: "bg-blue-100 text-blue-800", 
      preparar: "bg-green-100 text-green-800",
      facturar: "bg-purple-100 text-purple-800"
    };
    return colores[modulo] || "bg-gray-100 text-gray-800";
  };

  // Función para obtener icono del estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "en_proceso":
        return "🔄";
      case "terminado":
        return "✅";
      default:
        return "⏳";
    }
  };


  // Función para manejar la terminación con PIN
  const handleConfirmarPin = async () => {
    if (!pinModal.asignacion || pin.length !== 4) {
      setMensaje("Por favor ingresa un PIN válido de 4 dígitos");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setVerificandoPin(true);
    try {
      const asig = pinModal.asignacion;
      
      console.log('=== INICIANDO TERMINACIÓN CON PIN ===');
      console.log('Marcando artículo como terminado:', asig.item_id);
      console.log('PIN ingresado:', pin);
      
      // Usar el endpoint optimizado para terminar asignaciones (SIN mover automáticamente)
      const response = await fetch(`${getApiUrl()}/asignacion/terminar-mejorado/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: asig.pedido_id,
          item_id: asig.item_id,
          empleado_id: asig.empleado_id,
          pin: pin
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Asignación terminada con endpoint optimizado:', result);
      
      console.log('=== TERMINACIÓN CON PIN COMPLETADA ===');
      
      // Cerrar modal y limpiar
      setPinModal({ isOpen: false, asignacion: null });
      setPin("");
      setMensaje("✅ Asignación terminada exitosamente");
      
      // Recargar asignaciones
      await cargarAsignaciones();
      
    } catch (error: any) {
      console.error('❌ Error al terminar asignación con PIN:', error);
      setMensaje("❌ Error al terminar la asignación: " + error.message);
    } finally {
      setVerificandoPin(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Asignaciones</h1>
          <p className="text-gray-600">Gestiona todas las asignaciones de producción</p>
        </div>
        <div className="flex gap-2">
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
          <Button
            onClick={() => {
              console.log('🔍 DEBUG: Verificando pedido específico 68f5d8e235699cda22fa83fa');
              console.log('🔍 Asignaciones actuales:', asignaciones);
              console.log('🔍 Asignaciones con pedido_id:', asignaciones.filter(a => a.pedido_id === '68f5d8e235699cda22fa83fa'));
              console.log('🔍 Asignaciones que contienen el ID:', asignaciones.filter(a => a.pedido_id?.includes('68f5d8e235699cda22fa83fa')));
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200"
          >
            🔍 Debug Pedido
          </Button>
        </div>
      </div>

      {/* Mensaje de estado */}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 border border-red-300">
          {error}
        </div>
      )}


      {/* Mensaje de éxito/error */}
      {mensaje && (
        <div className={`mb-4 p-3 rounded ${
          mensaje.includes("Error") || mensaje.includes("❌")
            ? "bg-red-100 text-red-700 border border-red-300" 
            : "bg-green-100 text-green-700 border border-green-300"
        }`}>
          {mensaje}
        </div>
      )}

      {/* Estadísticas simples */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Asignaciones</p>
                <p className="text-2xl font-bold text-blue-600">{asignaciones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-orange-600">
                  {asignaciones.filter(a => a.estado === "en_proceso").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {asignaciones.filter(a => a.estado === "terminado").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empleados Activos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {empleados.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de asignaciones */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-600 font-semibold">Cargando asignaciones...</span>
        </div>
      ) : asignaciones.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay asignaciones</h3>
          <p className="text-gray-500">
            {error 
              ? "Error al cargar las asignaciones. Verifica que el backend esté funcionando."
              : "No se encontraron asignaciones en el sistema."
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {asignaciones.map((asignacion) => (
            <Card key={asignacion._id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {asignacion.descripcionitem}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={obtenerColorModulo(asignacion.modulo)}>
                        {asignacion.modulo.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <span>{getEstadoIcon(asignacion.estado)}</span>
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
                      ${Number(asignacion.costo_produccion || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Cliente:</p>
                    <p className="font-medium">{asignacion.cliente_nombre || "Sin cliente"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pedido:</p>
                    <p className="font-medium">#{asignacion.pedido_id ? asignacion.pedido_id.slice(-4) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de asignación:</p>
                    <p className="font-medium">
                      {asignacion.fecha_asignacion ? new Date(asignacion.fecha_asignacion).toLocaleDateString() : 'Sin fecha'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Item ID:</p>
                    <p className="font-medium">{asignacion.item_id}</p>
                  </div>
                </div>

                {asignacion.detalleitem && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Detalles:</p>
                    <p className="text-sm bg-gray-50 p-2 rounded border">
                      {asignacion.detalleitem}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {asignacion.estado === "en_proceso" && (
                    <Button
                      size="sm"
                      onClick={() => setPinModal({ isOpen: true, asignacion })}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Terminar Asignación
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de verificación PIN */}
      <Dialog open={pinModal.isOpen} onOpenChange={(open) => {
        if (!open) {
          setPinModal({ isOpen: false, asignacion: null });
          setPin("");
        }
      }}>
        <DialogContent className="sm:max-w-md bg-white border-2 border-gray-200 shadow-xl">
          <DialogHeader className="bg-blue-50 p-4 rounded-t-lg">
            <DialogTitle className="text-xl font-bold text-blue-900">Terminar Asignación</DialogTitle>
          </DialogHeader>
          
          {pinModal.asignacion && (
            <div className="space-y-4 p-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-blue-900">{pinModal.asignacion.descripcionitem}</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Empleado:</span> 
                    <span className="text-gray-900 font-semibold">{pinModal.asignacion.empleado_nombre || "Sin asignar"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Módulo:</span> 
                    <span className="text-gray-900">{pinModal.asignacion.modulo || "N/A"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Cliente:</span> 
                    <span className="text-gray-900">{pinModal.asignacion.cliente_nombre || "Sin cliente"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Pedido:</span> 
                    <span className="text-gray-900">#{pinModal.asignacion.pedido_id ? pinModal.asignacion.pedido_id.slice(-4) : 'N/A'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Fecha:</span> 
                    <span className="text-gray-900">
                      {pinModal.asignacion.fecha_asignacion ? new Date(pinModal.asignacion.fecha_asignacion).toLocaleDateString() : 'Sin fecha'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Costo:</span> 
                    <span className="text-gray-900 font-semibold">${(pinModal.asignacion.costo_produccion || 0).toFixed(2)}</span>
                  </p>
                </div>
                
                {pinModal.asignacion.detalleitem && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="font-medium text-gray-700 mb-1">Detalles del Item:</p>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      {pinModal.asignacion.detalleitem}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label htmlFor="pin" className="text-sm font-medium text-gray-700 block mb-2">
                  Ingresa tu PIN de 4 dígitos
                </Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="0000"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  className="text-center text-xl tracking-widest font-mono border-2 border-gray-300 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPinModal({ isOpen: false, asignacion: null });
                    setPin("");
                  }}
                  disabled={verificandoPin}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmarPin}
                  disabled={pin.length !== 4 || verificandoPin}
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                >
                  {verificandoPin ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verificando...
                    </div>
                  ) : (
                    "Confirmar Terminación"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardAsignaciones;