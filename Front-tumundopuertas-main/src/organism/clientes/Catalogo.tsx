import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Minus, ShoppingCart } from "lucide-react";

interface Item {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenes?: string[];
  cantidad?: number;
}

interface CatalogoProps {
  onAddToCart: (item: Item, cantidad: number) => void;
}

const Catalogo: React.FC<CatalogoProps> = ({ onAddToCart }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [imagenModal, setImagenModal] = useState<string | null>(null);
  const itemsPorPagina = 10;
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("cliente_access_token");
      const res = await fetch(`${apiUrl}/inventario/all`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Filtrar solo items activos y con precio
        const itemsActivos = data.filter((item: any) => item.activo !== false && item.precio > 0);
        setItems(itemsActivos);
      }
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPaginas = Math.ceil(items.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const itemsPagina = items.slice(inicio, fin);

  const aumentarCantidad = (itemId: string) => {
    setCantidades(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const disminuirCantidad = (itemId: string) => {
    setCantidades(prev => {
      const actual = prev[itemId] || 0;
      if (actual <= 1) return { ...prev, [itemId]: 0 };
      return { ...prev, [itemId]: actual - 1 };
    });
  };

  const agregarAlCarrito = (item: Item) => {
    const cantidad = cantidades[item._id] || 1;
    if (cantidad > 0) {
      onAddToCart(item, cantidad);
      setCantidades(prev => ({ ...prev, [item._id]: 0 }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Catálogo de Productos</h2>
        <p className="text-gray-300">Explora nuestro catálogo completo</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No hay productos disponibles</p>
        </div>
      ) : (
        <>
          {/* Grid de productos - 4 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {itemsPagina.map((item) => {
              const cantidad = cantidades[item._id] || 0;
              const imagenPrincipal = item.imagenes && item.imagenes.length > 0 
                ? item.imagenes[0] 
                : "/placeholder.png";

              return (
                <div
                  key={item._id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden hover:border-cyan-400 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20"
                >
                  {/* Imagen */}
                  <div
                    className="relative h-48 bg-gray-700 cursor-pointer group"
                    onClick={() => setImagenModal(imagenPrincipal)}
                  >
                    <img
                      src={imagenPrincipal}
                      alt={item.nombre}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.png";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity">Click para ampliar</p>
                    </div>
                  </div>

                  {/* Información */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{item.nombre}</h3>
                    <p className="text-cyan-400 text-xl font-bold mb-4">
                      ${item.precio.toFixed(2)}
                    </p>

                    {/* Controles de cantidad */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disminuirCantidad(item._id)}
                          disabled={cantidad === 0}
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-white font-semibold w-8 text-center">{cantidad}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => aumentarCantidad(item._id)}
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Botón agregar al carrito */}
                    <Button
                      onClick={() => agregarAlCarrito(item)}
                      disabled={cantidad === 0}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Agregar al Carrito
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-8">
              <Button
                onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                disabled={paginaActual === 1}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              <span className="text-gray-300">
                Página {paginaActual} de {totalPaginas}
              </span>
              <Button
                onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                disabled={paginaActual === totalPaginas}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal de imagen ampliada */}
      <Dialog open={!!imagenModal} onOpenChange={() => setImagenModal(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 p-0 max-w-4xl">
          {imagenModal && (
            <img
              src={imagenModal}
              alt="Imagen ampliada"
              className="w-full h-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.png";
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Catalogo;

