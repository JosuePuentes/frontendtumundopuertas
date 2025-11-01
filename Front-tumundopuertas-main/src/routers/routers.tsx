import { Routes, Route, Navigate } from "react-router";
import Dashboard from "../organism/dashboard/Dashboard";
import HomePage from "../organism/home/HomePage";
import CrearPedido from "../organism/pedido/CrearPedido";
import DashboardPedidos from "@/organism/pedido/DashboardPedidos";
import ModificarEmpleado from "@/organism/empleados/ModificarEmpleado";
import PedidosHerreria from "@/organism/fabricacion/creacion/PedidosHerreria";
import CrearCliente from "@/organism/clientes/CrearCliente";
import CrearItem from "@/organism/inventario/CrearItem";
import CrearEmpleado from "@/organism/empleados/CrearEmpleado";
import PedidosMasillar from "@/organism/fabricacion/masillar/Masillar";
import PedidosPreparar from "@/organism/fabricacion/preparar/Preparar";
import FacturacionPage from "@/organism/facturacion/facturacion/FacturacionPage";
import EnvioPage from "@/organism/envios/envio/Envio";
import Register from "@/organism/auth/Register";
import Login from "@/organism/auth/Login";
import ReporteComisionesProduccion from "@/organism/pedido/ReporteComisionesProduccion";
import ModificarItemPage from "@/organism/inventario/ModificarItemPage";
import CargarInventarioExcel from "@/organism/inventario/CargarInventarioExcel";
import ModificarUsuario from "@/organism/usuarios/ModificarUsuario";
import DashboardAsignaciones from "@/organism/dashboard/DashboardAsignaciones";
import ModificarCliente from "@/organism/clientes/ModificarCliente";
import TerminarAsignacion from "@/organism/teminarasignacion/TerminarAsignacion";
import MonitorPedidos from "@/organism/monitorped/MonitorPedidos";
import  Pedidos  from "@/organism/pagosFacturacion/Pedidos";
import MisPagos from "@/organism/pagosFacturacion/MisPagos";
import ResumenVentaDiaria from "@/organism/ResumenVentaDiaria/ResumenVentaDiaria";
import MetodosPago from "@/organism/metodos-pago/MetodosPago";
import FormatosImpresion from "@/organism/formatosImpresion/FormatosImpresion";
import AdminHome from "@/organism/admin/AdminHome";
import Apartados from "@/organism/apartados/Apartados";
import CuentasPorPagar from "@/organism/cuentasPorPagar/CuentasPorPagar";
import UsuariosPage from "@/organism/clientes/UsuariosPage";
import ClienteDashboard from "@/organism/clientes/ClienteDashboard";
import PedidosWeb from "@/organism/pedidosWeb/PedidosWeb";

function AppRouter() {
  // Función para verificar token y permisos
  const getPermisos = (): string[] => {
    try {
      const raw = localStorage.getItem("permisos");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const getToken = (): string | null => localStorage.getItem("access_token");

  // Puedes agregar lógica de expiración si guardas el tiempo en el token
  const isAuthenticated = () => {
    const token = getToken();
    return !!token;
  };

  // Componente para proteger rutas
  const ProtectedRoute = ({
    children,
    permiso,
  }: {
    children: React.ReactNode;
    permiso?: string;
  }) => {
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    if (permiso && !getPermisos().includes(permiso))
      return <Navigate to="/" replace />;
    return <>{children}</>;
  };

  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
        <Route
          path="crearpedido"
          element={
            <ProtectedRoute permiso="ventas">
              <CrearPedido />
            </ProtectedRoute>
          }
        />
        <Route
          path="pagos"
          element={
            <ProtectedRoute permiso="pagos">
              <Pedidos />
            </ProtectedRoute>
          }
        />
        <Route
          path="mispagos"
          element={
            <ProtectedRoute permiso="pagos">
              <MisPagos />
            </ProtectedRoute>
          }
        />
        <Route
          path="resumen-venta-diaria"
          element={
            <ProtectedRoute permiso="resumenVentaDiaria">
              <ResumenVentaDiaria />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard-asignaciones"
          element={
            <ProtectedRoute permiso="dashboard-asignaciones">
              <DashboardAsignaciones />
            </ProtectedRoute>
          }
        />
        <Route
          path="crearcliente"
          element={
            <ProtectedRoute permiso="crearclientes">
              <CrearCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="modificarcliente"
          element={
            <ProtectedRoute permiso="modificarclientes">
              <ModificarCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="crearitem"
          element={
            <ProtectedRoute permiso="crearinventario">
              <CrearItem />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventario/modificar"
          element={
            <ProtectedRoute permiso="modificarinventario">
              <ModificarItemPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventario/cargar-excel"
          element={
            <ProtectedRoute permiso="crearinventario">
              <CargarInventarioExcel />
            </ProtectedRoute>
          }
        />
        <Route
          path="terminarasignacion"
          element={
            <ProtectedRoute permiso="terminarasignacion">
              <TerminarAsignacion />
            </ProtectedRoute>
          }
        />
        <Route
          path="monitorpedidos"
          element={
            <ProtectedRoute permiso="monitorpedidos">
              <MonitorPedidos />
            </ProtectedRoute>
          }
        />
        <Route
          path="pedidos/facturacion"
          element={
            <ProtectedRoute permiso="monitorpedidos">
              <Pedidos />
            </ProtectedRoute>
          }
        />
        <Route
          path="pedidosherreria"
          element={
            <ProtectedRoute permiso="asignar">
              <PedidosHerreria />
            </ProtectedRoute>
          }
        />
        <Route path="dashboard" element={<DashboardPedidos />} />
        <Route
          path="crearempleado"
          element={
            <ProtectedRoute permiso="crearempleados">
              <CrearEmpleado />
            </ProtectedRoute>
          }
        />
        <Route
          path="modificarempleado"
          element={
            <ProtectedRoute permiso="modificarempleados">
              <ModificarEmpleado />
            </ProtectedRoute>
          }
        />
        <Route
          path="modificarusuario"
          element={
            <ProtectedRoute permiso="modificarusuarios">
              <ModificarUsuario />
            </ProtectedRoute>
          }
        />
        <Route
          path="masillar"
          element={
            <ProtectedRoute permiso="asignar">
              <PedidosMasillar />
            </ProtectedRoute>
          }
        />
        <Route
          path="preparar"
          element={
            <ProtectedRoute permiso="asignar">
              <PedidosPreparar />
            </ProtectedRoute>
          }
        />
        <Route
          path="facturacion"
          element={
            <ProtectedRoute permiso="asignar">
              <FacturacionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="envios"
          element={
            <ProtectedRoute permiso="asignar">
              <EnvioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="reportes/comisiones/produccion"
          element={
            <ProtectedRoute permiso="admin">
              <ReporteComisionesProduccion />
            </ProtectedRoute>
          }
        />
        <Route
          path="register"
          element={
            <ProtectedRoute permiso="admin">
              <Register />
            </ProtectedRoute>
          }
        />
        <Route
          path="metodos-pago"
          element={
            <ProtectedRoute permiso="metodos_pago">
              <MetodosPago />
            </ProtectedRoute>
          }
        />
        <Route
          path="cuentas-por-pagar"
          element={
            <ProtectedRoute permiso="cuentas_por_pagar">
              <CuentasPorPagar />
            </ProtectedRoute>
          }
        />
        <Route
          path="formatos-impresion"
          element={
            <ProtectedRoute permiso="admin">
              <FormatosImpresion />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin-home"
          element={
            <ProtectedRoute permiso="admin">
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="apartados"
          element={
            <ProtectedRoute>
              <Apartados />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<Login />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="clientes" element={<ClienteDashboard />} />
        <Route
          path="pedidos-web"
          element={
            <ProtectedRoute permiso="pedidos_web">
              <PedidosWeb />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Route>
    </Routes>
  );
}
export default AppRouter;