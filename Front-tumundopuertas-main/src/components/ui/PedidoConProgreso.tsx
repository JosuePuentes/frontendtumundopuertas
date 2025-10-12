import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CirculoProgresoPedido from "./CirculoProgresoPedido";
import ProgresoItemMonitor from "./ProgresoItemMonitor";
import { useProgresoPedido } from "@/hooks/useProgresoPedido";

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

const PedidoConProgreso: React.FC<PedidoConProgresoProps> = ({
  pedido,
  ordenMap
}) => {
  const { progreso } = useProgresoPedido(pedido._id);

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
          {progreso && (
            <div className="absolute top-1/2 right-6 transform -translate-y-1/2 z-10">
              <CirculoProgresoPedido 
                porcentaje={progreso.porcentaje}
                size={100}
                strokeWidth={10}
              />
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
          {progreso && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg pr-32 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  📊 Progreso: {progreso.contadorProgreso} módulos completados
                </span>
                <span className="text-sm font-bold px-2 py-1 rounded-full" style={{ 
                  backgroundColor: progreso.porcentaje >= 100 ? '#dcfce7' : 
                                 progreso.porcentaje >= 80 ? '#dbeafe' : 
                                 progreso.porcentaje >= 55 ? '#fef3c7' : 
                                 progreso.porcentaje >= 20 ? '#fed7aa' : '#fee2e2',
                  color: progreso.porcentaje >= 100 ? '#166534' : 
                         progreso.porcentaje >= 80 ? '#1e40af' : 
                         progreso.porcentaje >= 55 ? '#92400e' : 
                         progreso.porcentaje >= 20 ? '#9a3412' : '#991b1b'
                }}>
                  {Math.round(progreso.porcentaje)}%
                </span>
              </div>
            </div>
          )}

          {Array.isArray(pedido.items) && pedido.items.length > 0 && (
            <div className="mt-2 pr-32">
              <div className="font-semibold mb-1">Items:</div>
              <ul className="list-disc ml-6">
                {pedido.items.map((item, idx) => (
                  <li key={idx} className="mb-1 flex items-center gap-2">
                    {/* Ícono de progreso del item */}
                    {progreso && (
                      <ProgresoItemMonitor 
                        estadoActual={progreso.items[idx]?.estado_actual || 'pendiente'}
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
                    {progreso && (
                      <span className="text-sm font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {progreso.items[idx]?.estado_actual === 'pendiente' ? '0/4' :
                         progreso.items[idx]?.modulo_actual === 'herreria' ? '1/4' :
                         progreso.items[idx]?.modulo_actual === 'masillar' ? '2/4' :
                         progreso.items[idx]?.modulo_actual === 'preparar' ? '3/4' :
                         progreso.items[idx]?.modulo_actual === 'facturar' ? '4/4' :
                         progreso.items[idx]?.estado_actual === 'completado' ? '4/4' : '0/4'}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  );
};

export default PedidoConProgreso;
