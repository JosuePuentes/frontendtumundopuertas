import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Package, 
  ShoppingCart, 
  FileText, 
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

type VistaActiva = "inicio" | "catalogo" | "mis-pedidos" | "reclamo" | "perfil" | "facturas" | "soporte" | "carrito";

const ClienteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>("inicio");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [itemsCarrito, setItemsCarrito] = useState<any[]>([]);
  const clienteNombre = localStorage.getItem("cliente_nombre") || "Usuario";

  // Verificar autenticación
  useEffect(() => {
    const token = localStorage.getItem("cliente_access_token");
    if (!token) {
      navigate("/usuarios");
    }
  }, [navigate]);

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

  const handleLogout = () => {
    localStorage.removeItem("cliente_access_token");
    localStorage.removeItem("cliente_usuario");
    localStorage.removeItem("cliente_id");
    localStorage.removeItem("cliente_nombre");
    navigate("/usuarios");
  };

  const renderVista = () => {
    switch (vistaActiva) {
      case "inicio":
        return <Catalogo onAddToCart={(item, cantidad) => {
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
        }} />;
      case "catalogo":
        return <Catalogo onAddToCart={(item, cantidad) => {
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
        }} />;
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
        return <Catalogo onAddToCart={(item, cantidad) => {
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
        }} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMenuAbierto(!menuAbierto)}
                className="lg:hidden text-gray-300 hover:text-white"
              >
                {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <img src="/puertalogo.PNG" alt="Logo" className="h-10 w-10" />
              <h1 className="text-xl font-bold">TU MUNDO PUERTAS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <p className="text-sm text-gray-300">Bienvenido, <span className="font-semibold text-cyan-400">{clienteNombre}</span></p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
              >
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700
          transform ${menuAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          pt-16 lg:pt-0
        `}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setVistaActiva(item.id);
                    setMenuAbierto(false);
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
    </div>
  );
};

export default ClienteDashboard;

