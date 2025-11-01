import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, Package } from "lucide-react";
import EnviarPedidoModal from "./EnviarPedidoModal";

interface MiCarritoProps {
  items: Array<{
    itemId: string;
    item: any;
    cantidad: number;
  }>;
  onUpdateItems: (items: any[]) => void;
}

const MiCarrito: React.FC<MiCarritoProps> = ({ items, onUpdateItems }) => {
  const [mostrarModalEnvio, setMostrarModalEnvio] = useState(false);
  const [imagenesFallidas, setImagenesFallidas] = useState<Set<string>>(new Set());

  // Función para validar si una imagen es válida
  const obtenerImagenItem = (item: any): string | null => {
    if (!item.imagenes || item.imagenes.length === 0) {
      return null;
    }
    
    const primeraImagen = item.imagenes[0];
    
    // Si ya sabemos que esta imagen falló, no intentar cargarla
    if (imagenesFallidas.has(primeraImagen)) {
      return null;
    }
    
    // Validar que sea una URL válida
    if (typeof primeraImagen === 'string' && primeraImagen.trim() !== '') {
      // Si es una URL relativa que empieza con /, puede ser válida
      if (primeraImagen.startsWith('/') || primeraImagen.startsWith('http')) {
        return primeraImagen;
      }
      // Si no tiene formato válido, retornar null
      return null;
    }
    
    return null;
  };

  const manejarErrorImagen = (url: string) => {
    setImagenesFallidas(prev => new Set(prev).add(url));
  };

  const actualizarCantidad = (itemId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarItem(itemId);
      return;
    }
    onUpdateItems(
      items.map(item =>
        item.itemId === itemId ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  };

  const eliminarItem = (itemId: string) => {
    onUpdateItems(items.filter(item => item.itemId !== itemId));
  };

  const calcularTotal = () => {
    return items.reduce((total, item) => {
      return total + (item.item.precio || 0) * item.cantidad;
    }, 0);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg mb-4">Tu carrito está vacío</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">Mi Carrito</h2>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <div className="space-y-4">
          {items.map((carritoItem) => (
            <div
              key={carritoItem.itemId}
              className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600"
            >
              <div className="flex items-center space-x-4 flex-1">
                {/* Imagen del item - Siempre mostrar */}
                <div className="w-20 h-20 flex-shrink-0">
                  {(() => {
                    const imagenUrl = obtenerImagenItem(carritoItem.item);
                    const tieneImagenValida = imagenUrl !== null;
                    
                    return tieneImagenValida && imagenUrl ? (
                      <img
                        src={imagenUrl}
                        alt={carritoItem.item.nombre}
                        className="w-full h-full object-cover rounded-lg border border-gray-600"
                        onError={() => {
                          manejarErrorImagen(imagenUrl);
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700 rounded-lg border border-gray-600">
                        <Package className="w-8 h-8 text-gray-500" />
                      </div>
                    );
                  })()}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">{carritoItem.item.nombre}</h3>
                  {carritoItem.item.codigo && (
                    <p className="text-gray-400 text-sm mb-1">
                      Código: <span className="font-medium text-cyan-300">{carritoItem.item.codigo}</span>
                    </p>
                  )}
                  <p className="text-cyan-400 font-bold">
                    ${(carritoItem.item.precio || 0).toFixed(2)} c/u
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => actualizarCantidad(carritoItem.itemId, carritoItem.cantidad - 1)}
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-white font-semibold w-8 text-center">
                    {carritoItem.cantidad}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => actualizarCantidad(carritoItem.itemId, carritoItem.cantidad + 1)}
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-white font-bold w-24 text-right">
                  ${((carritoItem.item.precio || 0) * carritoItem.cantidad).toFixed(2)}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => eliminarItem(carritoItem.itemId)}
                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-600">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-semibold text-white">Total:</span>
            <span className="text-2xl font-bold text-cyan-400">
              ${calcularTotal().toFixed(2)}
            </span>
          </div>
          <Button
            onClick={() => setMostrarModalEnvio(true)}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg py-3"
          >
            Enviar Pedido
          </Button>
        </div>
      </div>

      <EnviarPedidoModal
        open={mostrarModalEnvio}
        onClose={() => setMostrarModalEnvio(false)}
        items={items}
        total={calcularTotal()}
        onPedidoEnviado={() => {
          onUpdateItems([]);
          setMostrarModalEnvio(false);
        }}
      />
    </div>
  );
};

export default MiCarrito;

