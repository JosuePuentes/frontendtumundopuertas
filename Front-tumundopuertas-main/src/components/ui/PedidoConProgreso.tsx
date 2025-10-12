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
            <div className="flex items-center gap-4">
              <span>Pedido: {pedido._id.slice(-6)}</span>
              {/* Círculo de progreso */}
              {progreso && (
                <CirculoProgresoPedido 
                  porcentaje={progreso.porcentaje}
                  size={60}
                  strokeWidth={6}
                />
              )}
            </div>
            <Badge variant="secondary">
              {ordenMap[pedido.estado_general] || pedido.estado_general}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <strong>Cliente:</strong> {pedido.cliente_nombre}
          </div>
          {pedido.creado_por && (
            <div className="text-sm text-gray-600">
              <strong>Creado por:</strong> {pedido.creado_por}
            </div>
          )}
          {pedido.fecha_creacion && (
            <div className="text-base text-gray-700">
              Fecha: {new Date(pedido.fecha_creacion).toLocaleDateString()}
            </div>
          )}
          
          {/* Información de progreso */}
          {progreso && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progreso: {progreso.itemsCompletados}/{progreso.totalItems} items
                </span>
                <span className="text-sm font-bold" style={{ 
                  color: progreso.porcentaje >= 100 ? '#10b981' : 
                         progreso.porcentaje >= 75 ? '#3b82f6' : 
                         progreso.porcentaje >= 50 ? '#f59e0b' : '#f97316'
                }}>
                  {Math.round(progreso.porcentaje)}%
                </span>
              </div>
            </div>
          )}

          {Array.isArray(pedido.items) && pedido.items.length > 0 && (
            <div className="mt-2">
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
