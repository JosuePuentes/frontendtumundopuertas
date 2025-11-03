import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Minus, ShoppingCart, Search, X, Package } from "lucide-react";

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
  const [busqueda, setBusqueda] = useState("");
  const [imagenesFallidas, setImagenesFallidas] = useState<Set<string>>(new Set());
  const itemsPorPagina = 10;
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  // Función para construir URL de imagen válida (síncrona, para casos donde no necesitamos presigned URL)
  const construirUrlImagen = (imagenRaw: string): string | null => {
    if (!imagenRaw || typeof imagenRaw !== 'string') return null;
    
    const imagen = imagenRaw.trim();
    if (!imagen) return null;
    
    // Si ya es una URL completa (http/https), retornarla directamente
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }
    
    // Si empieza con /, es relativa al dominio actual
    if (imagen.startsWith('/')) {
      return imagen;
    }
    
    // Para otros casos, las presigned URLs se obtienen durante cargarInventario
    return null;
  };

  // Función para validar si una imagen es válida
  const obtenerImagenItem = (item: Item): string | null => {
    if (!item.imagenes || item.imagenes.length === 0) {
      return null;
    }
    
    const primeraImagen = item.imagenes[0];
    
    // Si ya sabemos que esta imagen falló, no intentar cargarla
    if (imagenesFallidas.has(primeraImagen)) {
      return null;
    }
    
    // Construir URL válida usando la función auxiliar
    const urlImagen = construirUrlImagen(primeraImagen);
    return urlImagen;
  };

  const manejarErrorImagen = (url: string) => {
    setImagenesFallidas(prev => new Set(prev).add(url));
  };

  // Función auxiliar para obtener presigned URL para una imagen
  const obtenerPresignedUrl = async (objectName: string): Promise<string | null> => {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("cliente_access_token");
      
      if (!token) return null;
      
      const res = await fetch(`${apiUrl}/files/presigned-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          object_name: objectName,
          operation: "get_object",
          expires_in: 3600,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        return data.presigned_url || null;
      }
    } catch (error) {
      console.error("Error al obtener presigned URL:", error);
    }
    return null;
  };

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
        
        // Normalizar URLs de imágenes y obtener presigned URLs donde sea necesario
        const itemsNormalizados = await Promise.all(itemsActivos.map(async (item: any) => {
          // Intentar múltiples campos para encontrar imágenes
          let imagenesRaw = item.imagenes || item.imagen || item.imagenes_item || [];
          
          // Si no es array, convertirlo
          if (!Array.isArray(imagenesRaw)) {
            imagenesRaw = imagenesRaw ? [imagenesRaw] : [];
          }
          
          // Normalizar cada URL de imagen
          const imagenesNormalizadas = await Promise.all(
            imagenesRaw
              .filter((img: any) => img != null && img !== '')
              .map(async (img: any) => {
                if (typeof img !== 'string') return null;
                const imgUrl = img.trim();
                
                // Si es una URL completa, mantenerla
                if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
                  return imgUrl;
                }
                
                // Si empieza con /, es relativa al dominio
                if (imgUrl.startsWith('/')) {
                  return imgUrl;
                }
                
                // Si parece ser un object name de R2 (contiene "items/" o es un filename con extensión)
                if (imgUrl.includes('items/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(imgUrl)) {
                  const objectName = imgUrl.includes('items/') ? imgUrl : `items/${imgUrl}`;
                  const presignedUrl = await obtenerPresignedUrl(objectName);
                  if (presignedUrl) {
                    return presignedUrl;
                  }
                  // Fallback: intentar URL directa (puede dar 404, pero no bloquea)
                  return `${apiUrl}/files/${imgUrl}`;
                }
                
                // Si contiene barras pero no es items/, puede ser una ruta relativa
                if (imgUrl.includes('/') || imgUrl.includes('\\')) {
                  const rutaNormalizada = imgUrl.replace(/\\/g, '/');
                  return rutaNormalizada.startsWith('/') ? rutaNormalizada : `/${rutaNormalizada}`;
                }
                
                // Último intento: asumir que es un nombre de archivo y necesita presigned URL
                const objectName = `items/${imgUrl}`;
                const presignedUrl = await obtenerPresignedUrl(objectName);
                if (presignedUrl) {
                  return presignedUrl;
                }
                
                // Fallback final
                return `${apiUrl}/files/${imgUrl}`;
              })
          );
          
          const imagenesFiltradas = imagenesNormalizadas.filter((img: any) => img !== null);
          
          // Si hay imágenes normalizadas, usarlas
          if (imagenesFiltradas.length > 0) {
            item.imagenes = imagenesFiltradas;
          } else {
            // Si no hay imágenes, dejar array vacío
            item.imagenes = [];
          }
          
          // Log para debugging (solo para primeros items)
          if (itemsActivos.indexOf(item) < 3) {
            console.log(`Item ${item.nombre}:`, {
              imagenesRaw: imagenesRaw,
              imagenesNormalizadas: item.imagenes,
            });
          }
          
          return item;
        }));
        
        setItems(itemsNormalizados);
      }
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar items en tiempo real según la búsqueda
  const itemsFiltrados = useMemo(() => {
    if (!busqueda.trim()) {
      return items;
    }
    
    const busquedaLower = busqueda.toLowerCase().trim();
    return items.filter(item => {
      const codigo = (item.codigo || "").toLowerCase();
      const nombre = (item.nombre || "").toLowerCase();
      const descripcion = (item.descripcion || "").toLowerCase();
      
      return codigo.includes(busquedaLower) || 
             nombre.includes(busquedaLower) || 
             descripcion.includes(busquedaLower);
    });
  }, [items, busqueda]);

  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  const totalPaginas = Math.ceil(itemsFiltrados.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const itemsPagina = itemsFiltrados.slice(inicio, fin);

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

      {/* Buscador en tiempo real */}
      <div className="relative max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar por código, nombre o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10 pr-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {busqueda && (
          <p className="text-sm text-gray-400 mt-2 text-center">
            {itemsFiltrados.length} {itemsFiltrados.length === 1 ? 'producto encontrado' : 'productos encontrados'}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No hay productos disponibles</p>
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No se encontraron productos que coincidan con "{busqueda}"</p>
          <Button
            onClick={() => setBusqueda("")}
            variant="outline"
            className="mt-4 border-gray-600 text-white hover:bg-gray-700"
          >
            Limpiar búsqueda
          </Button>
        </div>
      ) : (
        <>
          {/* Grid de productos - 4 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {itemsPagina.map((item) => {
              const cantidad = cantidades[item._id] || 0;
              const imagenUrl = obtenerImagenItem(item);
              const tieneImagenValida = imagenUrl !== null;

              return (
                <div
                  key={item._id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden hover:border-cyan-400 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 flex flex-col h-full"
                >
                  {/* Imagen - Siempre mostrar */}
                  <div
                    className="relative h-48 bg-gray-700 cursor-pointer group flex-shrink-0 overflow-hidden"
                    onClick={() => tieneImagenValida && imagenUrl && setImagenModal(imagenUrl)}
                  >
                    {tieneImagenValida && imagenUrl ? (
                      <img
                        src={imagenUrl}
                        alt={item.nombre}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={() => {
                          manejarErrorImagen(imagenUrl);
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700">
                        <Package className="w-16 h-16 text-gray-500" />
                      </div>
                    )}
                    {tieneImagenValida && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm">Click para ampliar</p>
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 min-h-[3.5rem]">{item.nombre}</h3>
                    {item.descripcion && (
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">{item.descripcion}</p>
                    )}
                    {item.codigo && (
                      <p className="text-cyan-300 text-xs font-medium mb-2">
                        Código: <span className="font-semibold">{item.codigo}</span>
                      </p>
                    )}
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

                    {/* Botón agregar al carrito - siempre al final */}
                    <Button
                      onClick={() => agregarAlCarrito(item)}
                      disabled={cantidad === 0}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mt-auto h-10 flex items-center justify-center"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Agregar al Carrito</span>
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

