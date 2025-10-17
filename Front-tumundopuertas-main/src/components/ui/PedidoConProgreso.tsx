import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CirculoProgresoPedido from "./CirculoProgresoPedido";
import ProgresoItemMonitor from "./ProgresoItemMonitor";
import { useProgresoPedido } from "@/hooks/useProgresoPedido";
import { getApiUrl } from "@/lib/api";
import { XCircle } from "lucide-react";

interface Pedido {
  _id: string;
  cliente_nombre: string;
  estado_general: string;
  fecha_creacion?: string;
  creado_por?: string;
  puede_cancelar?: boolean;
  items?: Array<{
    nombre: string;
    descripcion: string;
    cantidad: number;
    costoProduccion?: string;
  }>;
}

interface PedidoConProgresoProps {
  pedido: Pedido;
  ordenMap: Record<string, string>;
}

interface ProgresoBackend {
  pedidoId: string;
  progreso_general: number;
  porcentaje: number; // Agregar para compatibilidad
  contadorProgreso: string; // Agregar para compatibilidad
  items: Array<{
    id: string;
    nombre: string;
    estado_actual: string;
    modulo_actual: string;
    porcentaje: number;
  }>;
  modulos: Array<{
    modulo: string;
    porcentaje: number;
    estado: string;
    en_proceso: number;
    terminadas: number;
    total: number;
  }>;
}

const PedidoConProgreso: React.FC<PedidoConProgresoProps> = ({
  pedido,
  ordenMap
}) => {
  const { progreso } = useProgresoPedido(pedido._id);
  const [progresoBackend, setProgresoBackend] = useState<ProgresoBackend | null>(null);
  const [loadingProgreso, setLoadingProgreso] = useState(false);
  
  // Estados para cancelación
  const [cancelModal, setCancelModal] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Función para obtener progreso preciso del backend
  const fetchProgresoPreciso = async () => {
    try {
      setLoadingProgreso(true);
      console.log(`🔍 Obteniendo progreso preciso para pedido ${pedido._id}...`);
      
      const response = await fetch(`${getApiUrl()}/pedidos/progreso-pedido/${pedido._id}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Progreso preciso obtenido del backend:', data);
      
      // Agregar campos de compatibilidad si no existen
      const dataCompatible = {
        ...data,
        porcentaje: data.progreso_general || 0,
        contadorProgreso: `${data.items?.filter((item: any) => item.estado_actual === 'completado').length || 0}/4`
      };
      
      setProgresoBackend(dataCompatible);
      
    } catch (err: any) {
      console.error('❌ Error al obtener progreso preciso:', err);
      // Mantener progreso del hook como fallback
    } finally {
      setLoadingProgreso(false);
    }
  };

  // Función para cancelar pedido
  const cancelarPedido = async () => {
    if (!motivoCancelacion.trim()) {
      setMensaje("❌ Debes ingresar un motivo para cancelar el pedido");
      return;
    }

    setCancelando(true);
    setMensaje("");

    try {
      console.log(`🚫 Cancelando pedido ${pedido._id} con motivo: ${motivoCancelacion}`);
      
      // Verificar que el token existe
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
      }
      
      console.log('🔑 Token encontrado, enviando request...');
      
      const response = await fetch(`${getApiUrl()}/pedidos/cancelar/${pedido._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motivo_cancelacion: motivoCancelacion
        })
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Pedido cancelado exitosamente:', result);
      
      setMensaje("✅ Pedido cancelado exitosamente");
      setCancelModal(false);
      setMotivoCancelacion("");
      
      // Disparar evento para actualizar la lista de pedidos
      window.dispatchEvent(new CustomEvent('pedidoCancelado', {
        detail: { pedidoId: pedido._id }
      }));
      
      // También disparar evento para actualizar el estado del pedido localmente
      window.dispatchEvent(new CustomEvent('actualizarPedido', {
        detail: { 
          pedidoId: pedido._id, 
          nuevoEstado: 'cancelado',
          motivo: motivoCancelacion
        }
      }));
      
    } catch (error: any) {
      console.error('❌ Error al cancelar pedido:', error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setMensaje('❌ Error de autenticación. Verifica tu sesión o contacta al administrador.');
        console.log('🔍 Token actual:', localStorage.getItem('token')?.substring(0, 20) + '...');
        // NO redirigir automáticamente, solo mostrar mensaje
      } else if (error.message.includes('400')) {
        setMensaje('❌ Este pedido no se puede cancelar en su estado actual');
      } else if (error.message.includes('403')) {
        setMensaje('❌ No tienes permisos para cancelar este pedido');
      } else if (error.message.includes('404')) {
        setMensaje('❌ Pedido no encontrado');
      } else {
        setMensaje(`❌ Error al cancelar pedido: ${error.message}`);
      }
    } finally {
      setCancelando(false);
    }
  };

  // Cargar progreso preciso al montar
  useEffect(() => {
    fetchProgresoPreciso();
  }, [pedido._id]);

  // Escuchar cambios de estado para actualizar progreso
  useEffect(() => {
    const handleCambioEstado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const evento = customEvent.detail;
      
      // Solo actualizar si el cambio es relevante para este pedido
      if (evento.pedidoId === pedido._id) {
        console.log(`🔄 PedidoConProgreso: Cambio de estado detectado para pedido ${pedido._id}`, evento);
        await fetchProgresoPreciso();
      }
    };

    window.addEventListener('cambioEstadoItem', handleCambioEstado);
    return () => {
      window.removeEventListener('cambioEstadoItem', handleCambioEstado);
    };
  }, [pedido._id]);

  // Usar progreso del backend si está disponible, sino usar el del hook
  const progresoFinal = progresoBackend || progreso;

  return (
    <li key={pedido._id}>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Pedido: {pedido._id.slice(-6)}</span>
            <Badge variant="secondary">
              {ordenMap[pedido.estado_general] || pedido.estado_general}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {/* Círculo de progreso centrado y estético */}
          {progresoFinal && (
            <div className="absolute top-1/2 right-6 transform -translate-y-1/2 z-10">
              <CirculoProgresoPedido 
                porcentaje={progresoBackend?.progreso_general || progresoFinal.porcentaje}
                size={100}
                strokeWidth={10}
              />
              {loadingProgreso && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          )}
          
          <div className="mb-2 pr-32">
            <strong>Cliente:</strong> {pedido.cliente_nombre}
          </div>
          {pedido.creado_por && (
            <div className="text-sm text-gray-600 pr-32">
              <strong>Creado por:</strong> {pedido.creado_por}
            </div>
          )}
          {pedido.fecha_creacion && (
            <div className="text-base text-gray-700 pr-32">
              Fecha: {new Date(pedido.fecha_creacion).toLocaleDateString()}
            </div>
          )}
          
          {/* Información de progreso mejorada */}
          {progresoFinal && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg pr-32 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  📊 Progreso: {progresoBackend?.progreso_general ? 
                    `${progresoBackend.progreso_general.toFixed(1)}% (Backend)` : 
                    `${progresoFinal.contadorProgreso} módulos completados`}
                </span>
                <span className="text-sm font-bold px-2 py-1 rounded-full" style={{ 
                  backgroundColor: (progresoBackend?.progreso_general || progresoFinal.porcentaje) >= 100 ? '#dcfce7' : 
                                 (progresoBackend?.progreso_general || progresoFinal.porcentaje) >= 80 ? '#dbeafe' : 
                                 (progresoBackend?.progreso_general || progresoFinal.porcentaje) >= 55 ? '#fef3c7' : 
                                 (progresoBackend?.progreso_general || progresoFinal.porcentaje) >= 20 ? '#fed7aa' : '#fee2e2',
                  color: (progresoBackend?.progreso_general || progresoFinal.porcentaje) >= 100 ? '#166534' : 
                         (progresoBackend?.progreso_general || progresoFinal.porcentaje) >= 80 ? '#1e40af' : 
                         (progresoBackend?.progreso_general || progresoFinal.porcentaje) >= 55 ? '#92400e' : 
                         (progresoBackend?.progreso_general || progresoFinal.porcentaje) >= 20 ? '#9a3412' : '#991b1b'
                }}>
                  {Math.round(progresoBackend?.progreso_general || progresoFinal.porcentaje)}%
                </span>
              </div>
              {progresoBackend && (
                <div className="text-xs text-gray-600">
                  ✅ Progreso preciso desde el backend
                </div>
              )}
            </div>
          )}

          {Array.isArray(pedido.items) && pedido.items.length > 0 && (
            <div className="mt-2 pr-32">
              <div className="font-semibold mb-1">Items:</div>
              <ul className="list-disc ml-6">
                {pedido.items.map((item, idx) => {
                  // Obtener progreso del item desde el backend o fallback
                  const itemProgreso = progresoBackend?.items?.find(i => i.nombre === item.nombre) || 
                                     progresoFinal?.items?.[idx];
                  
                  return (
                    <li key={idx} className="mb-1 flex items-center gap-2">
                      {/* Ícono de progreso del item */}
                      {progresoFinal && (
                        <ProgresoItemMonitor 
                          estadoActual={itemProgreso?.estado_actual || 'pendiente'}
                          size={20}
                        />
                      )}
                      <div className="flex-1">
                        <span className="font-bold">{item.nombre}</span> - {item.descripcion} 
                        <span className="text-gray-600"> x{item.cantidad}</span>
                        {item.costoProduccion && (
                          <span className="ml-2 text-green-700 font-semibold">${item.costoProduccion}</span>
                        )}
                      </div>
                      {/* Contador de progreso del item */}
                      {progresoFinal && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {itemProgreso?.estado_actual === 'pendiente' ? '0/4' :
                             itemProgreso?.modulo_actual === 'herreria' ? '1/4' :
                             itemProgreso?.modulo_actual === 'masillar' ? '2/4' :
                             itemProgreso?.modulo_actual === 'preparar' ? '3/4' :
                             itemProgreso?.modulo_actual === 'facturar' ? '4/4' :
                             itemProgreso?.estado_actual === 'completado' ? '4/4' : '0/4'}
                          </span>
                          {itemProgreso?.porcentaje && (
                            <span className="text-xs text-gray-600">
                              {Math.round(itemProgreso.porcentaje)}%
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Botón de cancelar pedido - SIEMPRE VISIBLE */}
          <div className="mt-4 pr-32">
            <Button
              variant="destructive"
              size="default"
              onClick={() => setCancelModal(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md"
            >
              <XCircle className="w-5 h-5" />
              🚫 Cancelar Pedido
            </Button>
          </div>

          {/* Mensaje de estado */}
          {mensaje && (
            <div className={`mt-2 pr-32 p-2 rounded text-sm ${
              mensaje.includes("Error") || mensaje.includes("❌")
                ? "bg-red-100 text-red-700 border border-red-300" 
                : "bg-green-100 text-green-700 border border-green-300"
            }`}>
              {mensaje}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de cancelación */}
      <Dialog open={cancelModal} onOpenChange={(open) => {
        if (!open) {
          setCancelModal(false);
          setMotivoCancelacion("");
          setMensaje("");
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white border-2 border-red-200 shadow-xl">
          <DialogHeader className="bg-red-50 p-4 rounded-t-lg sticky top-0 z-10">
            <DialogTitle className="text-xl font-bold text-red-900 flex items-center gap-2">
              <XCircle className="w-6 h-6" />
              Cancelar Pedido
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 p-4 max-h-[calc(90vh-120px)] overflow-y-auto">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-red-900">Pedido: {pedido._id.slice(-6)}</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Cliente:</strong> {pedido.cliente_nombre}</p>
                <p><strong>Estado actual:</strong> {ordenMap[pedido.estado_general] || pedido.estado_general}</p>
                <p><strong>Fecha:</strong> {pedido.fecha_creacion ? new Date(pedido.fecha_creacion).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo" className="text-sm font-medium text-gray-700">
                Motivo de cancelación *
              </Label>
              <Input
                id="motivo"
                type="text"
                placeholder="Ej: Cliente solicitó cancelación, problema con materiales, etc."
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                className="w-full"
                disabled={cancelando}
              />
            </div>

            {/* Mensaje de estado dentro del modal */}
            {mensaje && (
              <div className={`p-3 rounded text-sm ${
                mensaje.includes("Error") || mensaje.includes("❌")
                  ? "bg-red-100 text-red-700 border border-red-300" 
                  : "bg-green-100 text-green-700 border border-green-300"
              }`}>
                {mensaje}
              </div>
            )}
          </div>
          
          {/* Botones fijos en la parte inferior */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCancelModal(false);
                  setMotivoCancelacion("");
                  setMensaje("");
                }}
                disabled={cancelando}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
              >
                ❌ Cancelar Operación
              </Button>
              <Button
                variant="destructive"
                onClick={cancelarPedido}
                disabled={cancelando || !motivoCancelacion.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md flex items-center justify-center gap-2"
              >
                {cancelando ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Cancelando...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    ✅ Confirmar Cancelación
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </li>
  );
};

export default PedidoConProgreso;
