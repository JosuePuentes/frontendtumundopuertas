import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router";

// Componentes que se usan siempre (no lazy)
import Dashboard from "../organism/dashboard/Dashboard";
import HomePage from "../organism/home/HomePage";
import Login from "@/organism/auth/Login";

// Componentes pesados con lazy loading
const CrearPedido = lazy(() => import("../organism/pedido/CrearPedido"));
const DashboardPedidos = lazy(() => import("@/organism/pedido/DashboardPedidos"));
const ModificarEmpleado = lazy(() => import("@/organism/empleados/ModificarEmpleado"));
const PedidosHerreria = lazy(() => import("@/organism/fabricacion/creacion/PedidosHerreria"));
const CrearCliente = lazy(() => import("@/organism/clientes/CrearCliente"));
const CrearItem = lazy(() => import("@/organism/inventario/CrearItem"));
const CrearEmpleado = lazy(() => import("@/organism/empleados/CrearEmpleado"));
const PedidosMasillar = lazy(() => import("@/organism/fabricacion/masillar/Masillar"));
const PedidosPreparar = lazy(() => import("@/organism/fabricacion/preparar/Preparar"));
const FacturacionPage = lazy(() => import("@/organism/facturacion/facturacion/FacturacionPage"));
const EnvioPage = lazy(() => import("@/organism/envios/envio/Envio"));
const Register = lazy(() => import("@/organism/auth/Register"));
const ReporteComisionesProduccion = lazy(() => import("@/organism/pedido/ReporteComisionesProduccion"));
const ModificarItemPage = lazy(() => import("@/organism/inventario/ModificarItemPage"));
const CargarInventarioExcel = lazy(() => import("@/organism/inventario/CargarInventarioExcel"));
const ModificarUsuario = lazy(() => import("@/organism/usuarios/ModificarUsuario"));
const DashboardAsignaciones = lazy(() => import("@/organism/dashboard/DashboardAsignaciones"));
const DashboardItems = lazy(() => import("@/organism/dashboard/DashboardItems"));
const PanelControlLogistico = lazy(() => import("@/organism/panelControlLogistico/PanelControlLogistico"));
const ModificarCliente = lazy(() => import("@/organism/clientes/ModificarCliente"));
const TerminarAsignacion = lazy(() => import("@/organism/teminarasignacion/TerminarAsignacion"));
const MonitorPedidos = lazy(() => import("@/organism/monitorped/MonitorPedidos"));
const Pedidos = lazy(() => import("@/organism/pagosFacturacion/Pedidos"));
const MisPagos = lazy(() => import("@/organism/pagosFacturacion/MisPagos"));
const ResumenVentaDiaria = lazy(() => import("@/organism/ResumenVentaDiaria/ResumenVentaDiaria"));
const MetodosPago = lazy(() => import("@/organism/metodos-pago/MetodosPago"));
const FormatosImpresion = lazy(() => import("@/organism/formatosImpresion/FormatosImpresion"));
const AdminHome = lazy(() => import("@/organism/admin/AdminHome"));
const Apartados = lazy(() => import("@/organism/apartados/Apartados"));
const CuentasPorPagar = lazy(() => import("@/organism/cuentasPorPagar/CuentasPorPagar"));
const UsuariosPage = lazy(() => import("@/organism/clientes/UsuariosPage"));
const ClienteDashboard = lazy(() => import("@/organism/clientes/ClienteDashboard"));
const PedidosWeb = lazy(() => import("@/organism/pedidosWeb/PedidosWeb"));

// Componente de loading
const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

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
              <Suspense fallback={<LoadingFallback />}>
                <CrearPedido />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="pagos"
          element={
            <ProtectedRoute permiso="pagos">
              <Suspense fallback={<LoadingFallback />}>
                <Pedidos />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="mispagos"
          element={
            <ProtectedRoute permiso="pagos">
              <Suspense fallback={<LoadingFallback />}>
                <MisPagos />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="resumen-venta-diaria"
          element={
            <ProtectedRoute permiso="resumenVentaDiaria">
              <Suspense fallback={<LoadingFallback />}>
                <ResumenVentaDiaria />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute permiso="dashboard-asignaciones">
              <Suspense fallback={<LoadingFallback />}>
                <DashboardItems />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard-asignaciones"
          element={
            <ProtectedRoute permiso="dashboard-asignaciones">
              <Suspense fallback={<LoadingFallback />}>
                <DashboardAsignaciones />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="panel-control-logistico"
          element={
            <ProtectedRoute permiso="panel-control-logistico">
              <Suspense fallback={<LoadingFallback />}>
                <PanelControlLogistico />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="crearcliente"
          element={
            <ProtectedRoute permiso="crearclientes">
              <Suspense fallback={<LoadingFallback />}>
                <CrearCliente />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="modificarcliente"
          element={
            <ProtectedRoute permiso="modificarclientes">
              <Suspense fallback={<LoadingFallback />}>
                <ModificarCliente />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="crearitem"
          element={
            <ProtectedRoute permiso="crearinventario">
              <Suspense fallback={<LoadingFallback />}>
                <CrearItem />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="inventario/modificar"
          element={
            <ProtectedRoute permiso="modificarinventario">
              <Suspense fallback={<LoadingFallback />}>
                <ModificarItemPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="inventario/cargar-excel"
          element={
            <ProtectedRoute permiso="crearinventario">
              <Suspense fallback={<LoadingFallback />}>
                <CargarInventarioExcel />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="terminarasignacion"
          element={
            <ProtectedRoute permiso="terminarasignacion">
              <Suspense fallback={<LoadingFallback />}>
                <TerminarAsignacion />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="monitorpedidos"
          element={
            <ProtectedRoute permiso="monitorpedidos">
              <Suspense fallback={<LoadingFallback />}>
                <MonitorPedidos />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="pedidos/facturacion"
          element={
            <ProtectedRoute permiso="monitorpedidos">
              <Suspense fallback={<LoadingFallback />}>
                <Pedidos />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="pedidosherreria"
          element={
            <ProtectedRoute permiso="asignar">
              <Suspense fallback={<LoadingFallback />}>
                <PedidosHerreria />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route 
          path="dashboard" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <DashboardPedidos />
            </Suspense>
          } 
        />
        <Route
          path="crearempleado"
          element={
            <ProtectedRoute permiso="crearempleados">
              <Suspense fallback={<LoadingFallback />}>
                <CrearEmpleado />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="modificarempleado"
          element={
            <ProtectedRoute permiso="modificarempleados">
              <Suspense fallback={<LoadingFallback />}>
                <ModificarEmpleado />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="modificarusuario"
          element={
            <ProtectedRoute permiso="modificarusuarios">
              <Suspense fallback={<LoadingFallback />}>
                <ModificarUsuario />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="masillar"
          element={
            <ProtectedRoute permiso="asignar">
              <Suspense fallback={<LoadingFallback />}>
                <PedidosMasillar />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="preparar"
          element={
            <ProtectedRoute permiso="asignar">
              <Suspense fallback={<LoadingFallback />}>
                <PedidosPreparar />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="facturacion"
          element={
            <ProtectedRoute permiso="asignar">
              <Suspense fallback={<LoadingFallback />}>
                <FacturacionPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="envios"
          element={
            <ProtectedRoute permiso="asignar">
              <Suspense fallback={<LoadingFallback />}>
                <EnvioPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="reportes/comisiones/produccion"
          element={
            <ProtectedRoute permiso="admin">
              <Suspense fallback={<LoadingFallback />}>
                <ReporteComisionesProduccion />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="register"
          element={
            <ProtectedRoute permiso="admin">
              <Suspense fallback={<LoadingFallback />}>
                <Register />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="metodos-pago"
          element={
            <ProtectedRoute permiso="metodos_pago">
              <Suspense fallback={<LoadingFallback />}>
                <MetodosPago />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="cuentas-por-pagar"
          element={
            <ProtectedRoute permiso="cuentas_por_pagar">
              <Suspense fallback={<LoadingFallback />}>
                <CuentasPorPagar />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="formatos-impresion"
          element={
            <ProtectedRoute permiso="admin">
              <Suspense fallback={<LoadingFallback />}>
                <FormatosImpresion />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="admin-home"
          element={
            <ProtectedRoute permiso="admin-home">
              <Suspense fallback={<LoadingFallback />}>
                <AdminHome />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="apartados"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Apartados />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<Login />} />
        <Route 
          path="usuarios" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <UsuariosPage />
            </Suspense>
          } 
        />
        <Route 
          path="clientes" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ClienteDashboard />
            </Suspense>
          } 
        />
        <Route
          path="pedidos-web"
          element={
            <ProtectedRoute permiso="pedidos_web">
              <Suspense fallback={<LoadingFallback />}>
                <PedidosWeb />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Route>
    </Routes>
  );
}
export default AppRouter;