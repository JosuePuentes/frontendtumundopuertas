import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import useTerminarEmpleado from "@/hooks/useTerminarEmpleado";
import ImageDisplay from "@/upfile/ImageDisplay";
import { getApiUrl } from "@/lib/api";
import { RefreshCw } from "lucide-react";
interface Asignacion {
  pedido_id: string;
  item_id: string;
  descripcionitem: string;
  costoproduccion: string;
  estado: string;
  orden?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  nombreempleado?: string;
  estado_subestado?: string;
  detalleitem?: string;
  cliente_id?: string;
  imagenes?: string[];
  cliente: {
    cliente_nombre?: string;
    cliente_direccion?: string;
    cliente_telefono?: string;
    cliente_email?: string;
  };
}

const TerminarAsignacion: React.FC = () => {
  // VERSION ACTUALIZADA - FORZAR DESPLIEGUE COMPLETO
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string>("");
  const [articuloTerminado, setArticuloTerminado] = useState<string | null>(null);
  const identificador = localStorage.getItem("identificador");
  
  // Estados para el modal de PIN
  const [pinModal, setPinModal] = useState<{
    isOpen: boolean;
    asignacion: Asignacion | null;
  }>({ isOpen: false, asignacion: null });
  const [pin, setPin] = useState("");
  const [verificandoPin, setVerificandoPin] = useState(false);
  
  // Funciones para manejar el PIN
  const handleTerminarConPin = (asignacion: Asignacion) => {
    setPinModal({ isOpen: true, asignacion });
    setPin("");
  };

  const handleConfirmarPin = async () => {
    if (!pinModal.asignacion || pin.length !== 4) {
      setMensaje("Por favor ingresa un PIN válido de 4 dígitos");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setVerificandoPin(true);
    try {
      const asig = pinModal.asignacion;
      
      // Marcar inmediatamente como terminado en la UI
      console.log('=== INICIANDO TERMINACIÓN CON PIN ===');
      console.log('Marcando artículo como terminado:', asig.item_id);
      console.log('PIN ingresado:', pin);
      
      setArticuloTerminado(asig.item_id);
      
      // Cambiar la llamada de terminación al nuevo endpoint
      const response = await fetch(`${getApiUrl()}/asignacion/terminar-mejorado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: asig.pedido_id,
          item_id: asig.item_id,
          empleado_id: identificador,
          pin: pin
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Asignación terminada con nuevo endpoint:', result);
      
      console.log('=== TERMINACIÓN CON PIN COMPLETADA ===');
      
      // Cerrar modal
      setPinModal({ isOpen: false, asignacion: null });
      setPin("");
      
    } catch (error: any) {
      console.error('❌ Error al terminar asignación con PIN:', error);
      setMensaje("Error al terminar la asignación: " + error.message);
      setTimeout(() => setMensaje(""), 5000);
    } finally {
      setVerificandoPin(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  // Debug: Verificar que el código actualizado se está ejecutando
  console.log('🚀🚀🚀 CÓDIGO ACTUALIZADO EJECUTÁNDOSE - VERSIÓN CON PIN OBLIGATORIO 🚀🚀🚀');
  console.log('🔧 VERSIÓN: 6.0 - CON PIN OBLIGATORIO');
  console.log('📅 TIMESTAMP:', new Date().toISOString());
  
  // FORZAR DESPLIEGUE - CAMBIO DRÁSTICO
  const VERSION_ACTUAL = "6.0-PIN-OBLIGATORIO";
  console.log('🔥 VERSIÓN ACTUAL:', VERSION_ACTUAL);
  
  // FORZAR ALERT VISUAL - CAMBIO DRÁSTICO
  useEffect(() => {
    alert('🚀🚀🚀 VERSIÓN 6.0 CON PIN OBLIGATORIO DESPLEGADA 🚀🚀🚀\n\nSi ves este mensaje, el código actualizado se está ejecutando correctamente.\n\nDeberías ver:\n- Mensaje azul en la página\n- Botón "Refrescar" en la parte superior derecha\n- Modal de PIN al terminar asignaciones\n- Logs detallados en la consola\n\nCOMMIT: PIN-OBLIGATORIO');
    
    // FORZAR LOGS INMEDIATOS
    console.log('🚀🚀🚀 VERSIÓN 6.0 CON PIN OBLIGATORIO EJECUTÁNDOSE 🚀🚀🚀');
    console.log('🔧 COMMIT: PIN-OBLIGATORIO');
    console.log('📅 TIMESTAMP:', new Date().toISOString());
  }, []);

  const { loading: terminando } = useTerminarEmpleado({
    onSuccess: (data) => {
      console.log('✅ Asignación terminada exitosamente:', data);
      setMensaje("¡Asignación terminada exitosamente!");
      setTimeout(() => setMensaje(""), 3000);
      
      // SOLUCIÓN TEMPORAL: Marcar artículo como terminado localmente inmediatamente
      const itemIdTerminado = data.item_id || data.asignacion_actualizada?.item_id;
      const pedidoId = data.pedido_id;
      
      if (itemIdTerminado) {
        console.log('🚀 Marcando artículo como terminado localmente:', itemIdTerminado);
        setArticuloTerminado(itemIdTerminado);
        
        // Intentar mover al siguiente módulo
        if (pedidoId) {
          moverArticuloSiguienteModulo(pedidoId, itemIdTerminado);
        }
      }
      
      // Recargar las asignaciones inmediatamente y luego cada 2 segundos por 10 segundos
      const fetchAsignaciones = async () => {
        setLoading(true);
        try {
          console.log('🔄 Recargando asignaciones...');
          const res = await fetch(
            `${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?empleado_id=${identificador}`
          );
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const data = await res.json();
          console.log('📊 Asignaciones del backend:', data);
          console.log('📈 Cantidad total:', data.length);
          
          // Filtrar asignaciones terminadas del backend
          const asignacionesActivas = data.filter((asig: any) => {
            const isEnProceso = asig.estado_subestado === "en_proceso";
            const isNotTerminado = asig.estado !== "terminado";
            const isNotTerminadoLocal = articuloTerminado !== asig.item_id;
            const shouldShow = isEnProceso && isNotTerminado && isNotTerminadoLocal;
            
            console.log(`🔍 Artículo ${asig.item_id}:`, {
              estado_subestado: asig.estado_subestado,
              estado: asig.estado,
              isEnProceso,
              isNotTerminado,
              isNotTerminadoLocal,
              shouldShow
            });
            
            return shouldShow;
          });
          console.log('✅ Asignaciones activas después del filtro:', asignacionesActivas.length);
          
          // Mostrar detalles de cada asignación
          asignacionesActivas.forEach((asig: any, index: number) => {
            console.log(`📋 Asignación ${index + 1}:`, {
              item_id: asig.item_id,
              estado_subestado: asig.estado_subestado,
              estado: asig.estado,
              descripcion: asig.descripcionitem
            });
          });
          
          setAsignaciones(asignacionesActivas);
        } catch (err) {
          console.error('❌ Error al recargar asignaciones:', err);
        }
        setLoading(false);
      };
      
      // Recargar inmediatamente
      if (identificador) fetchAsignaciones();
      
      // Recargar cada 2 segundos por 10 segundos para asegurar sincronización
      const intervalId = setInterval(() => {
        if (identificador) fetchAsignaciones();
      }, 2000);
      
      setTimeout(() => {
        clearInterval(intervalId);
        console.log('⏰ Deteniendo recargas automáticas');
      }, 10000);
    },
    onError: (error) => {
      console.error('❌ Error al terminar asignación:', error);
      setMensaje("Error al terminar la asignación: " + error.message);
      setTimeout(() => setMensaje(""), 5000);
    }
  })

  // SOLUCIÓN TEMPORAL: Función para mover artículo al siguiente módulo
  const moverArticuloSiguienteModulo = async (pedidoId: string, itemId: string) => {
    try {
      console.log('🚀 Moviendo artículo al siguiente módulo...');
      const response = await fetch(`${getApiUrl()}/pedidos/mover-siguiente-modulo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pedido_id: pedidoId,
          item_id: itemId,
          empleado_id: identificador
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Artículo movido al siguiente módulo:', result);
        return true;
      } else {
        console.log('⚠️ No se pudo mover el artículo (endpoint no existe)');
        return false;
      }
    } catch (error) {
      console.log('⚠️ Error al mover artículo:', error);
      return false;
    }
  };

  const fetchAsignaciones = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando asignaciones para empleado:', identificador);
      const res = await fetch(
        `${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?empleado_id=${identificador}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      
      console.log('📊 Respuesta del backend:', data);
      console.log('📈 Total de asignaciones:', data.length);
      
      // Filtrar asignaciones terminadas del backend
      const asignacionesActivas = data.filter((asig: any) => {
        const isEnProceso = asig.estado_subestado === "en_proceso";
        const isNotTerminado = asig.estado !== "terminado";
        const shouldShow = isEnProceso && isNotTerminado;
        
        console.log(`🔍 INICIAL - Artículo ${asig.item_id}:`, {
          estado_subestado: asig.estado_subestado,
          estado: asig.estado,
          isEnProceso,
          isNotTerminado,
          shouldShow
        });
        
        return shouldShow;
      });
      
      console.log('✅ Asignaciones activas:', asignacionesActivas.length);
      
      // Mostrar detalles de cada asignación
      asignacionesActivas.forEach((asig: any, index: number) => {
        console.log(`📋 Asignación ${index + 1}:`, {
          item_id: asig.item_id,
          estado_subestado: asig.estado_subestado,
          estado: asig.estado,
          descripcion: asig.descripcionitem,
          pedido_id: asig.pedido_id
        });
      });
      
      setAsignaciones(asignacionesActivas);
    } catch (err) {
      console.error('❌ Error al cargar asignaciones:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (identificador) fetchAsignaciones();
  }, [identificador]);

  if (loading) return <div>Cargando asignaciones...</div>;
  
  // Debug: Log de asignaciones actuales
  console.log('=== ESTADO ACTUAL ===');
  console.log('Asignaciones en estado:', asignaciones.length);
  console.log('Articulo terminado local:', articuloTerminado);
  asignaciones.forEach((a, index) => {
    console.log(`Asignación ${index}:`, {
      item_id: a.item_id,
      estado_subestado: a.estado_subestado,
      estado: a.estado,
      cliente: a.cliente?.cliente_nombre
    });
  });
  
  document.querySelectorAll('input[type="number"].no-mouse-wheel');
  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Asignaciones en proceso</h2>
          <p className="text-sm text-green-600 font-bold">🚀 VERSIÓN 6.0 - CON PIN OBLIGATORIO - COMMIT PIN-OBLIGATORIO</p>
        </div>
        <Button
          onClick={fetchAsignaciones}
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </Button>
      </div>
      
      {/* Debug: Confirmar que el código actualizado se está ejecutando */}
      <div className="mb-4 p-6 bg-green-100 text-green-800 rounded border-4 border-green-500 shadow-lg">
        <strong className="text-2xl">🚀🚀🚀 VERSIÓN 6.0 CON PIN OBLIGATORIO DESPLEGADA 🚀🚀🚀</strong><br/>
        <strong className="text-lg">🔧 CÓDIGO ACTUALIZADO:</strong> Si ves este mensaje VERDE, el código con PIN obligatorio se está ejecutando correctamente.<br/>
        <strong className="text-lg">📅 TIMESTAMP:</strong> {new Date().toISOString()}<br/>
        <strong className="text-lg">🚀 VERSIÓN:</strong> 6.0-PIN-OBLIGATORIO<br/>
        <strong className="text-lg">🔐 PIN OBLIGATORIO:</strong> Ahora al terminar asignaciones se pedirá PIN obligatorio<br/>
        <strong className="text-lg">📊 COMMIT:</strong> PIN-OBLIGATORIO
      </div>
      
      {mensaje && (
        <div className={`mb-4 p-3 rounded ${
          mensaje.includes("Error") 
            ? "bg-red-100 text-red-700 border border-red-300" 
            : "bg-green-100 text-green-700 border border-green-300"
        }`}>
          {mensaje}
        </div>
      )}
      
      {asignaciones.length === 0 ? (
        <div className="text-gray-500">No tienes asignaciones en proceso.</div>
      ) : (
        <ul className="space-y-6">
          {asignaciones
            .filter((asig) => {
              // Filtrar artículos terminados tanto localmente como en el backend
              const isEnProceso = asig.estado_subestado === "en_proceso";
              const isNotTerminadoBackend = asig.estado !== "terminado";
              const isNotTerminadoLocal = articuloTerminado !== asig.item_id;
              const shouldShow = isEnProceso && isNotTerminadoBackend && isNotTerminadoLocal;
              
              console.log(`🔍 RENDER - Artículo ${asig.item_id}:`, {
                estado_subestado: asig.estado_subestado,
                estado: asig.estado,
                isEnProceso,
                isNotTerminadoBackend,
                isNotTerminadoLocal,
                articuloTerminado,
                shouldShow
              });
              
              return shouldShow;
            })
            .map((asig, idx) => (
              <li key={idx}>
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-primary">
                      Pedido #{asig.pedido_id?.slice(-4) || asig.pedido_id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Mostrar imágenes si existen */}
                    {Array.isArray(asig.imagenes) && asig.imagenes.length > 0 && (
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {asig.imagenes.slice(0, 3).map((img, imgIdx) => (
                          <ImageDisplay
                            key={imgIdx}
                            imageName={img}
                            alt={`Imagen ${imgIdx + 1}`}
                            style={{ maxWidth: 70, maxHeight: 70, borderRadius: 8, border: '1px solid #ddd' }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="font-bold text-gray-900">Descripción:</div>
                    <div className="text-gray-700 mb-2">
                      {asig.descripcionitem}
                    </div>
                    {asig.detalleitem && (
                      <div className="text-green-600 mb-2">
                        <span className="font-bold">Detalle:</span>{" "}
                        <span className="font-normal">{asig.detalleitem}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        {asig.cliente.cliente_nombre && (
                          <div>
                            <span className="font-semibold">
                              Cliente:
                            </span>{" "}
                            {asig.cliente.cliente_nombre}
                          </div>
                        )}
                        {asig.cliente_id && (
                          <div>
                            <span className="font-semibold">ID Cliente:</span>{" "}
                            {asig.cliente_id}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleTerminarConPin(asig)}
                          disabled={terminando || articuloTerminado === asig.item_id}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {terminando && articuloTerminado === asig.item_id ? "Terminando..." : "Terminar con PIN"}
                        </button>
                        
                        {/* SOLUCIÓN TEMPORAL: Botón para mover manualmente */}
                        <button
                          onClick={async () => {
                            if (confirm(`¿Mover este artículo al siguiente módulo manualmente?`)) {
                              const movido = await moverArticuloSiguienteModulo(asig.pedido_id, asig.item_id);
                              if (movido) {
                                setMensaje("¡Artículo movido al siguiente módulo!");
                                setTimeout(() => setMensaje(""), 3000);
                                fetchAsignaciones();
                              } else {
                                setMensaje("No se pudo mover el artículo. Verifica el backend.");
                                setTimeout(() => setMensaje(""), 5000);
                              }
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          Mover al Siguiente Módulo
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
        </ul>
      )}

      {/* Modal de verificación de PIN */}
      <Dialog open={pinModal.isOpen} onOpenChange={() => setPinModal({ isOpen: false, asignacion: null })}>
        <DialogContent className="max-w-md bg-white border-2 border-gray-200 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-t-lg border-b">
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                🔒
              </div>
              Verificación de PIN
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 p-6 bg-gray-50">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <Label htmlFor="pin" className="text-base font-medium text-gray-700 block mb-3">
                Ingresa tu PIN para confirmar la terminación del artículo
              </Label>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Artículo:</span> {pinModal.asignacion?.descripcionitem}
                </p>
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Cliente:</span> {pinModal.asignacion?.cliente?.cliente_nombre}
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
                onClick={() => setPinModal({ isOpen: false, asignacion: null })}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium py-3"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmarPin}
                disabled={pin.length !== 4 || verificandoPin}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verificandoPin ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verificando...
                  </div>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TerminarAsignacion;
