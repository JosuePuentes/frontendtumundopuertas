import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CirculoProgresoPedido from "./CirculoProgresoPedido";
import ProgresoItemMonitor from "./ProgresoItemMonitor";
import { useProgresoPedido } from "@/hooks/useProgresoPedido";
import { getApiUrl } from "@/lib/api";

interface Pedido {
  _id: string;
  cliente_nombre: string;
  estado_general: string;
  fecha_creacion?: string;
  creado_por?: string;
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
        </CardContent>
      </Card>
    </li>
  );
};

export default PedidoConProgreso;
