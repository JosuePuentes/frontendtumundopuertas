import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { 
  Home, 
  Package, 
  ShoppingCart, 
  MessageSquare, 
  User, 
  Receipt, 
  HelpCircle,
  Menu,
  X
} from "lucide-react";
import Catalogo from "./Catalogo";
import MisPedidos from "./MisPedidos";
import Reclamo from "./Reclamo";
import Perfil from "./Perfil";
import Facturas from "./Facturas";
import Soporte from "./Soporte";
import MiCarrito from "./MiCarrito";
import { Toast } from "@/components/ui/toast";

type VistaActiva = "inicio" | "catalogo" | "mis-pedidos" | "reclamo" | "perfil" | "facturas" | "soporte" | "carrito";

const ClienteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>("inicio");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [itemsCarrito, setItemsCarrito] = useState<any[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const prevItemsCountRef = useRef(0);

  const menuItems = [
    { id: "inicio" as VistaActiva, label: "Inicio", icon: Home },
    { id: "catalogo" as VistaActiva, label: "Catálogo", icon: Package },
    { id: "mis-pedidos" as VistaActiva, label: "Mis Pedidos", icon: ShoppingCart },
    { id: "reclamo" as VistaActiva, label: "Reclamo", icon: MessageSquare },
    { id: "perfil" as VistaActiva, label: "Perfil", icon: User },
    { id: "facturas" as VistaActiva, label: "Facturas", icon: Receipt },
    { id: "soporte" as VistaActiva, label: "Soporte", icon: HelpCircle },
    { id: "carrito" as VistaActiva, label: "Mi Carrito", icon: ShoppingCart },
  ];

  // Verificar autenticación y cargar datos guardados desde BD
  useEffect(() => {
    const token = localStorage.getItem("cliente_access_token");
    if (!token) {
      navigate("/usuarios");
      return;
    }

    const clienteId = localStorage.getItem("cliente_id");
    if (!clienteId) return;

    // Cargar carrito desde BD
    const cargarCarritoBD = async () => {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
        const res = await fetch(`${apiUrl}/clientes/${clienteId}/carrito`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            setItemsCarrito(data.items);
            const itemsCount = data.items.reduce((total: number, item: any) => total + item.cantidad, 0);
            prevItemsCountRef.current = itemsCount;
          }
        }
      } catch (error) {
        console.error("Error al cargar carrito desde BD:", error);
        // Fallback a localStorage si hay error
        const carritoLocal = localStorage.getItem(`cliente_carrito_${clienteId}`);
        if (carritoLocal) {
          try {
            const carrito = JSON.parse(carritoLocal);
            if (Array.isArray(carrito) && carrito.length > 0) {
              setItemsCarrito(carrito);
              const itemsCount = carrito.reduce((total: number, item: any) => total + item.cantidad, 0);
              prevItemsCountRef.current = itemsCount;
            }
          } catch (e) {
            console.error("Error al cargar carrito desde localStorage:", e);
          }
        }
      }
    };

    // Cargar preferencias desde BD
    const cargarPreferenciasBD = async () => {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
        const res = await fetch(`${apiUrl}/clientes/${clienteId}/preferencias`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.vista_activa) {
            setVistaActiva(data.vista_activa as VistaActiva);
          }
        }
      } catch (error) {
        console.error("Error al cargar preferencias desde BD:", error);
      }
    };

    cargarCarritoBD();
    cargarPreferenciasBD();
  }, [navigate]);

  // Guardar carrito en BD cuando cambie (con debounce)
  useEffect(() => {
    const clienteId = localStorage.getItem("cliente_id");
    const token = localStorage.getItem("cliente_access_token");
    if (!clienteId || !token) return;

    // Guardar en localStorage inmediatamente (para rapidez)
    localStorage.setItem(`cliente_carrito_${clienteId}`, JSON.stringify(itemsCarrito));

    // Guardar en BD con debounce (cada 2 segundos después del último cambio)
    const timeoutId = setTimeout(async () => {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
        await fetch(`${apiUrl}/clientes/${clienteId}/carrito`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: itemsCarrito }),
        });
      } catch (error) {
        console.error("Error al guardar carrito en BD:", error);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [itemsCarrito]);

  // Detectar cuando se agregan items al carrito y mostrar notificación
  useEffect(() => {
    const itemsCount = itemsCarrito.reduce((total, item) => total + item.cantidad, 0);
    if (itemsCount > prevItemsCountRef.current && prevItemsCountRef.current > 0) {
      const cantidadAgregada = itemsCount - prevItemsCountRef.current;
      // Buscar el último item agregado o el que incrementó su cantidad
      let itemAgregado = itemsCarrito[itemsCarrito.length - 1];
      
      // Si no encontramos el último, buscar el que tiene más cantidad (probablemente el recién agregado)
      if (!itemAgregado || !itemAgregado.item) {
        itemAgregado = itemsCarrito.reduce((max, item) => 
          item.cantidad > (max?.cantidad || 0) ? item : max
        , null as any);
      }
      
      if (itemAgregado && itemAgregado.item) {
        const nombreProducto = itemAgregado.item.nombre || 'Producto';
        setToastMessage(`✓ ${cantidadAgregada} ${cantidadAgregada === 1 ? 'producto agregado' : 'productos agregados'} al carrito: ${nombreProducto}`);
        setToastVisible(true);
      }
    } else if (itemsCount > prevItemsCountRef.current && prevItemsCountRef.current === 0) {
      // Primer item agregado al carrito vacío
      const primerItem = itemsCarrito[0];
      if (primerItem && primerItem.item) {
        setToastMessage(`✓ ${primerItem.cantidad} ${primerItem.cantidad === 1 ? 'producto agregado' : 'productos agregados'} al carrito: ${primerItem.item.nombre}`);
        setToastVisible(true);
      }
    }
    prevItemsCountRef.current = itemsCount;
  }, [itemsCarrito]);

  const handleAddToCart = (item: any, cantidad: number) => {
    setItemsCarrito(prev => {
      const existe = prev.find(i => i.itemId === item._id);
      if (existe) {
        return prev.map(i => 
          i.itemId === item._id 
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        );
      }
      return [...prev, { itemId: item._id, item: item, cantidad }];
    });
  };


  const renderVista = () => {
    switch (vistaActiva) {
      case "inicio":
        return <Catalogo onAddToCart={handleAddToCart} />;
      case "catalogo":
        return <Catalogo onAddToCart={handleAddToCart} />;
      case "mis-pedidos":
        return <MisPedidos />;
      case "reclamo":
        return <Reclamo />;
      case "perfil":
        return <Perfil />;
      case "facturas":
        return <Facturas />;
      case "soporte":
        return <Soporte />;
      case "carrito":
        return <MiCarrito items={itemsCarrito} onUpdateItems={setItemsCarrito} />;
      default:
        return <Catalogo onAddToCart={handleAddToCart} />;
    }
  };

  const totalItemsCarrito = itemsCarrito.reduce((total, item) => total + item.cantidad, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700
          transform ${menuAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
        `}>
          <nav className="p-4 space-y-2">
            {/* Botón de cerrar en móvil */}
            <div className="lg:hidden flex justify-end mb-4">
              <button
                onClick={() => setMenuAbierto(false)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={async () => {
                    setVistaActiva(item.id);
                    setMenuAbierto(false);
                    // Guardar preferencia de vista activa en BD
                    const clienteId = localStorage.getItem("cliente_id");
                    const token = localStorage.getItem("cliente_access_token");
                    if (clienteId && token) {
                      try {
                        const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
                        await fetch(`${apiUrl}/clientes/${clienteId}/preferencias`, {
                          method: "PUT",
                          headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ vista_activa: item.id }),
                        });
                      } catch (error) {
                        console.error("Error al guardar preferencia:", error);
                      }
                    }
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${vistaActiva === item.id
                      ? 'bg-cyan-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Botón para abrir menú en móvil */}
          <button
            onClick={() => setMenuAbierto(true)}
            className="lg:hidden fixed top-4 left-4 z-50 bg-gray-800/80 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {menuAbierto && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setMenuAbierto(false)}
            />
          )}
          <div className="max-w-7xl mx-auto">
            {renderVista()}
          </div>
        </main>
      </div>

      {/* Toast de notificación */}
      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={3000}
      />

      {/* Carrito flotante */}
      {totalItemsCarrito > 0 && (
        <button
          onClick={() => setVistaActiva("carrito")}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-cyan-500/50 flex items-center justify-center group"
          title="Ver carrito"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {totalItemsCarrito > 99 ? '99+' : totalItemsCarrito}
            </span>
          </div>
        </button>
      )}
    </div>
  );
};

export default ClienteDashboard;

