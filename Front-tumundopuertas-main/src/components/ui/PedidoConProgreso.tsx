import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  estadoSeleccionado: Record<string, string>;
  setEstadoSeleccionado: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  actualizando: string;
  onActualizarEstado: (pedidoId: string) => void;
}

const PedidoConProgreso: React.FC<PedidoConProgresoProps> = ({
  pedido,
  ordenMap,
  estadoSeleccionado,
  setEstadoSeleccionado,
  actualizando,
  onActualizarEstado
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
          {/* Círculo de progreso centrado y más visible */}
          {progreso && (
            <div className="absolute top-4 right-4 z-10">
              <CirculoProgresoPedido 
                porcentaje={progreso.porcentaje}
                size={80}
                strokeWidth={8}
              />
            </div>
          )}
          
          <div className="mb-2 pr-24">
            <strong>Cliente:</strong> {pedido.cliente_nombre}
          </div>
          {pedido.creado_por && (
            <div className="text-sm text-gray-600 pr-24">
              <strong>Creado por:</strong> {pedido.creado_por}
            </div>
          )}
          {pedido.fecha_creacion && (
            <div className="text-base text-gray-700 pr-24">
              Fecha: {new Date(pedido.fecha_creacion).toLocaleDateString()}
            </div>
          )}
          
          {/* Información de progreso */}
          {progreso && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg pr-24">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progreso: {progreso.contadorProgreso} módulos
                </span>
                <span className="text-sm font-bold" style={{ 
                  color: progreso.porcentaje >= 100 ? '#10b981' : 
                         progreso.porcentaje >= 80 ? '#3b82f6' : 
                         progreso.porcentaje >= 55 ? '#f59e0b' : 
                         progreso.porcentaje >= 20 ? '#f97316' : '#ef4444'
                }}>
                  {Math.round(progreso.porcentaje)}%
                </span>
              </div>
            </div>
          )}

          {Array.isArray(pedido.items) && pedido.items.length > 0 && (
            <div className="mt-2 pr-24">
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
        <div className="px-6 pb-4 flex flex-col gap-2">
          <Select
            value={estadoSeleccionado[pedido._id] || ""}
            onValueChange={(val) => setEstadoSeleccionado((prev) => ({ ...prev, [pedido._id]: val }))}
          >
            <SelectTrigger className="w-full max-w-xs" aria-label="Seleccionar estado">
              <SelectValue placeholder="Selecciona nuevo estado" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ordenMap).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="w-full max-w-xs bg-black text-white border-black hover:bg-gray-900 hover:text-white"
            disabled={!estadoSeleccionado[pedido._id] || actualizando === pedido._id}
            onClick={() => onActualizarEstado(pedido._id)}
          >
            {actualizando === pedido._id ? "Actualizando..." : "Cambiar Estado"}
          </Button>
        </div>
      </Card>
    </li>
  );
};

export default PedidoConProgreso;
