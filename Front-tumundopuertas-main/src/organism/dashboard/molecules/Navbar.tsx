import React, { useState, useEffect, useRef } from "react";
// 1. Corregido: NavLink se importa desde 'react-router-dom'
import { NavLink } from "react-router";
import { LogOutIcon, XIcon, MenuIcon } from "lucide-react";

interface NavbarProps {
  links?: { label: string; href: string }[];
}

// --- Datos de ejemplo y configuración (sin cambios en la lógica) ---
const defaultLinks = [
  { label: "Inicio", href: "/" },
  { label: "Crear Cliente", href: "/crearcliente" },
  { label: "Modificar Cliente", href: "/modificarcliente" },
  { label: "Crear Item", href: "/crearitem" },
  { label: "Modificar Item", href: "/inventario/modificar" },
  { label: "Mi Inventario", href: "/inventario/cargar-excel" },
  { label: "Crear Pedido", href: "/crearpedido" },
  { label: "Monitor Pedidos", href: "/monitorpedidos" },
  { label: "Dashboard Asignaciones", href: "/dashboard-asignaciones" },
  { label: "Mis Asignaciones", href: "/terminarasignacion" },
  { label: "Asignar Produccion", href: "/pedidosherreria" },
  { label: "Facturacion", href: "/facturacion" },
  { label: "Apartados", href: "/apartados" },
  { label: "Pagos", href: "/pagos" },
  { label: "Mis Pagos", href: "/mispagos" },
  { label: "Resumen Venta Diaria", href: "/resumen-venta-diaria" },
  { label: "Bancos", href: "/metodos-pago" },
  { label: "Cuentas por Pagar", href: "/cuentas-por-pagar" },
  { label: "Pedidos Web", href: "/pedidos-web" },
  { label: "Formatos de Impresión", href: "/formatos-impresion" },
  { label: "Administrar Home", href: "/admin-home" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Crear Empleado", href: "/crearempleado" },
  { label: "Modificar Empleado", href: "/modificarempleado" },
  { label: "Crear Usuario", href: "/register" },
  { label: "Modificar Usuario", href: "/modificarusuario" },
  { label: "Reportes Comision", href: "/reportes/comisiones/produccion" },
];

const permisosRuta: Record<string, string | null> = {
  "/crearpedido": "ventas",
  "/crearcliente": "crearclientes",
  "/modificarcliente": "modificarclientes",
  "/crearitem": "crearinventario",
  "/inventario/modificar": "modificarinventario",
  "/inventario/cargar-excel": "crearinventario",
  "/pedidosherreria": "asignar",
  "/facturacion": "asignar",
  "/dashboard": "dashboard",
  "/crearempleado": "crearempleados",
  "/modificarempleado": "modificarempleados",
  "/register": "crearusuarios",
  "/modificarusuario": "modificarusuarios",
  "/dashboard-asignaciones": "dashboard-asignaciones",
  "/terminarasignacion": "terminarasignacion",
  "/monitorpedidos": "monitorpedidos",
  "/pagos": "pagos",
  "/mispagos": "pagos",
  "/resumen-venta-diaria": "resumenVentaDiaria",
  "/metodos-pago": "metodos_pago",
  "/cuentas-por-pagar": "cuentas_por_pagar",
  "/pedidos-web": "pedidos_web",
  "/formatos-impresion": "admin",
  "/admin-home": "admin",
  "/home": null,
  "/": null,
};

// --- Componente Navbar Mejorado ---
const Navbar: React.FC<NavbarProps> = ({ links = defaultLinks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Lógica para obtener permisos
  const getPermisos = () => {
    try {
      const raw = localStorage.getItem("permisos");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const [permisos, setPermisos] = useState<string[]>(getPermisos());
  console.log("Permisos en Navbar:", permisos);

  // Escuchar eventos de actualización de permisos
  useEffect(() => {
    const handlePermisosActualizados = (event: CustomEvent) => {
      const nuevosPermisos = event.detail?.permisos || getPermisos();
      setPermisos(nuevosPermisos);
      console.log("🔄 Permisos actualizados en Navbar:", nuevosPermisos);
    };

    window.addEventListener('permisosActualizados', handlePermisosActualizados as EventListener);
    
    return () => {
      window.removeEventListener('permisosActualizados', handlePermisosActualizados as EventListener);
    };
  }, []);

  // Lógica de filtrado de enlaces (sin cambios)
  const filteredLinks = links.filter((link) => {
    const permiso = permisosRuta[link.href];
    return !permiso || permisos.includes(permiso);
  });

  // Función para cerrar sesión (sin cambios)
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // Cierra el menú si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="bg-black sticky top-0 z-50 shadow"
      style={{ background: "#000000" }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Sección Izquierda: Logo */}
          <div className="flex-shrink-0">
            <NavLink
              to="/"
              className="text-xl sm:text-2xl font-bold text-white hover:text-cyan-400 transition-colors"
            >
              TU MUNDO PUERTAS
            </NavLink>
          </div>

          <div className="-mr-2 flex">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-white hover:text-cyan-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menú principal</span>
              {isOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`fixed z-50 bg-black transition-all duration-300 ease-in-out w-full sm:w-auto sm:max-w-xs md:max-w-sm top-16 sm:top-14 ${
          isOpen
            ? "overflow-auto max-h-[calc(100vh-4rem)] ocultar-scrollbar right-0"
            : "max-h-0 hidden"
        }`}
        id="mobile-menu"
        style={{ backgroundColor: "#000000", opacity: 1, backdropFilter: "none", WebkitBackdropFilter: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)" }}
      >
        <div className="px-3 pt-3 pb-3 space-y-1 sm:px-4 border-t border-gray-700">
          {filteredLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              onClick={() => setIsOpen(false)} // Cierra el menú al hacer clic
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500 text-white shadow-sm"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-4 mt-4 border-t border-gray-700">
          </div>
        </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 rounded-md font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow"
            >
              <LogOutIcon />
              Cerrar Sesión
            </button>
      </div>
    </nav>
  );
};

export default Navbar;