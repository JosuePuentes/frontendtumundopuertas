import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMetodosPago } from "@/hooks/useMetodosPago";

interface Asignacion {
  pedido_id: string;
  item_id: string;
  descripcionitem: string;
  costoproduccion: string;
  precio_item?: number;
  orden?: number;
  nombre_subestado?: string;
  estado_subestado?: string;
  fecha_inicio_subestado?: string;
  fecha_fin_subestado?: string;
  key?: string;
  empleadoId?: string;
  nombreempleado?: string;
  fecha_inicio?: string;
  estado?: string;
  fecha_fin?: string;
}

interface EmpleadoComision {
  empleado_id: string;
  nombre_empleado: string;
  asignaciones: Asignacion[];
}

const ReporteComisionesProduccion: React.FC = () => {
  const [data, setData] = useState<EmpleadoComision[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(true);
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [buscando, setBuscando] = useState<boolean>(false);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [filtroAyudante, setFiltroAyudante] = useState<
    "sin-ayudante" | "solo-ayudante" | "todos"
  >("sin-ayudante");
  const [busquedaEmpleado, setBusquedaEmpleado] = useState("");
  const [valesPorEmpleado, setValesPorEmpleado] = useState<Record<string, number>>({});
  const [inputVales, setInputVales] = useState<Record<string, string>>({});
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<Record<string, string>>({});
  const { metodos, fetchMetodosPago } = useMetodosPago();
  const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:8002").replace('http://', 'https://');

  useEffect(() => {
    const fetchEmpleados = async () => {
      setLoadingEmpleados(true);
      try {
        const res = await fetch(`${apiUrl}/empleados/all/`);
        if (!res.ok) throw new Error("Error al cargar empleados");
        const empleadosData = await res.json();
        empleadosData.forEach((empleado: any) => {
          if (
            typeof empleado.identificador === "string" &&
            (empleado.identificador.startsWith("v") ||
              empleado.identificador.startsWith("V"))
          ) {
            empleado.identificador = empleado.identificador.slice(1);
          }
        });
        setEmpleados(empleadosData);
      } catch (err) {
        console.error("Error cargando empleados:", err);
      } finally {
        setLoadingEmpleados(false);
      }
    };
    fetchEmpleados();
  }, []);

  // OPTIMIZACIÓN: Filtrar permisos para mostrar solo los módulos relevantes
  // Solo mostrar: herreria, masillar, preparar, ayudante
  const permisosUnicos = useMemo(() => {
    const todosPermisos = Array.from(
      new Set(empleados.flatMap((empleado) => empleado.permisos || []))
    );
    // Filtrar solo los permisos relevantes para producción
    const permisosRelevantes = todosPermisos.filter(permiso => {
      const permisoLower = permiso.toLowerCase();
      return permisoLower === 'herreria' || 
             permisoLower === 'masillar' || 
             permisoLower === 'preparar' || 
             permisoLower === 'ayudante';
    });
    return permisosRelevantes;
  }, [empleados]);
  
  const [permisosSeleccionados, setPermisosSeleccionados] = useState<string[]>([]);

  const togglePermiso = (permiso: string) => {
    setPermisosSeleccionados((prev) =>
      prev.includes(permiso)
        ? prev.filter((p) => p !== permiso)
        : [...prev, permiso]
    );
  };

  const formatFecha = (fecha: string | undefined) =>
    fecha
      ? new Date(fecha).toLocaleString("es-VE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "-";

  // Función para cargar vales de un empleado
  const cargarValesEmpleado = async (empleadoId: string) => {
    try {
      const res = await fetch(`${apiUrl}/empleados/${empleadoId}/vales`);
      if (res.ok) {
        const data = await res.json();
        return data.total_pendiente || 0;
      } else {
        // Si es 400, probablemente es un ID inválido, no lo registramos como error crítico
        if (res.status !== 400) {
          console.error(`Error ${res.status} cargando vales para empleado ${empleadoId}`);
        }
      }
    } catch (error) {
      // Solo registrar errores de red, no errores 400 que son esperados si el ID no es válido
      console.error(`Error de red cargando vales para empleado ${empleadoId}:`, error);
    }
    return 0;
  };

  // Normalizar identificador (remover "v" o "V" si existe)
  const normalizarIdentificador = (id: string | number | undefined): string => {
    if (id === undefined || id === null) return "";
    const idStr = String(id);
    if (idStr.startsWith("v") || idStr.startsWith("V")) {
      return idStr.slice(1);
    }
    return idStr;
  };

  // Obtener _id del empleado por identificador
  const obtenerIdEmpleado = (identificador: string): string | null => {
    const identificadorNormalizado = normalizarIdentificador(identificador);
    const empleado = empleados.find((emp) => {
      const empIdentificador = normalizarIdentificador(emp.identificador || emp._id);
      return empIdentificador === identificadorNormalizado || String(emp._id) === identificadorNormalizado;
    });
    return empleado?._id || null;
  };

  const handleAgregarVales = async (identificador: string) => {
    const valorInput = inputVales[identificador] || "0";
    const valor = parseFloat(valorInput);
    if (isNaN(valor) || valor <= 0) {
      alert("Por favor ingresa un valor válido mayor a 0");
      return;
    }
    
    const metodoPagoId = metodoPagoSeleccionado[identificador];
    if (!metodoPagoId) {
      alert("Por favor selecciona un método de pago");
      return;
    }
    
    // Verificar que el método de pago tenga saldo suficiente
    const metodoPago = metodos.find(m => m.id === metodoPagoId);
    if (!metodoPago) {
      alert("Error: Método de pago no encontrado");
      return;
    }
    
    if (metodoPago.saldo < valor) {
      alert(`Saldo insuficiente. Saldo disponible: ${metodoPago.moneda === "dolar" ? "$" : "Bs."}${metodoPago.saldo.toFixed(2)}`);
      return;
    }
    
    const empleadoId = obtenerIdEmpleado(identificador);
    if (!empleadoId) {
      alert("Error: No se encontró el empleado");
      return;
    }
    
    try {
      // Primero, restar el saldo del método de pago usando el endpoint de transferencia
      const metodoPagoRes = await fetch(`${apiUrl}/metodos-pago/${metodoPagoId}/transferir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monto: valor,
          concepto: `Vale para empleado ${identificador} - ${valor}`,
        }),
      });
      
      if (!metodoPagoRes.ok) {
        const errorData = await metodoPagoRes.json().catch(() => ({ detail: "Error al transferir saldo del método de pago" }));
        throw new Error(errorData.detail || "Error al transferir saldo del método de pago");
      }
      
      // Luego, agregar el vale al empleado
      const res = await fetch(`${apiUrl}/empleados/${empleadoId}/vales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monto: valor,
          descripcion: `Vale agregado desde reporte de comisiones - Método de pago: ${metodoPago.nombre}`,
          metodo_pago_id: metodoPagoId,
        }),
      });
      
      if (!res.ok) {
        // Si falla agregar el vale, revertir el saldo del método de pago usando depósito
        await fetch(`${apiUrl}/metodos-pago/${metodoPagoId}/deposito`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            monto: valor,
            concepto: `Reversión de vale cancelado para empleado ${identificador}`,
          }),
        });
        
        const errorData = await res.json().catch(() => ({ detail: "Error al agregar vale" }));
        throw new Error(errorData.detail || "Error al agregar vale");
      }
      
      // Recargar los vales del empleado para obtener el total_pendiente actualizado
      const totalPendiente = await cargarValesEmpleado(empleadoId);
      
      // Actualizar el estado con el total pendiente del backend (usando identificador como key)
      setValesPorEmpleado((prev) => ({
        ...prev,
        [identificador]: totalPendiente,
      }));
      
      // Actualizar el saldo del método de pago en el estado local
      fetchMetodosPago();
      
      // Limpiar inputs
      setInputVales((prev) => ({
        ...prev,
        [identificador]: "",
      }));
      
      setMetodoPagoSeleccionado((prev) => {
        const nuevo = { ...prev };
        delete nuevo[identificador];
        return nuevo;
      });
      
      alert("Vale agregado exitosamente y saldo del método de pago actualizado");
    } catch (error: any) {
      console.error("Error agregando vale:", error);
      alert(error.message || "Error al agregar vale. Intenta nuevamente.");
    }
  };

  const handleAbonarVales = async (identificador: string) => {
    const valorInput = inputVales[identificador] || "0";
    const valor = parseFloat(valorInput);
    if (isNaN(valor) || valor <= 0) {
      alert("Por favor ingresa un valor válido mayor a 0");
      return;
    }
    
    const valesActuales = valesPorEmpleado[identificador] || 0;
    if (valor > valesActuales) {
      alert("No puedes abonar más vales de los que tiene el empleado");
      return;
    }
    
    const empleadoId = obtenerIdEmpleado(identificador);
    if (!empleadoId) {
      alert("Error: No se encontró el empleado");
      return;
    }
    
    try {
      const res = await fetch(`${apiUrl}/empleados/${empleadoId}/vales/abonar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monto_abono: valor,
          descripcion: "Abono desde reporte de comisiones",
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Error al abonar vale" }));
        throw new Error(errorData.detail || "Error al abonar vale");
      }
      
      // Recargar los vales del empleado para obtener el total_pendiente actualizado
      const totalPendiente = await cargarValesEmpleado(empleadoId);
      
      // Actualizar el estado con el total pendiente del backend (usando identificador como key)
      setValesPorEmpleado((prev) => ({
        ...prev,
        [identificador]: totalPendiente,
      }));
      
      setInputVales((prev) => ({
        ...prev,
        [identificador]: "",
      }));
      
      alert("Abono realizado exitosamente");
    } catch (error: any) {
      console.error("Error abonando vale:", error);
      alert(error.message || "Error al abonar vale. Intenta nuevamente.");
    }
  };

  // Cargar vales de todos los empleados con asignaciones
  const cargarValesEmpleados = async (empleadosIds: string[]) => {
    // Mapear identificadores normalizados a _id de empleados
    const mapeoIds: Record<string, string> = {};
    empleados.forEach((emp) => {
      const identificadorNormalizado = normalizarIdentificador(emp.identificador || emp._id);
      mapeoIds[identificadorNormalizado] = emp._id;
    });
    
    const valesPromises = empleadosIds.map(async (identificador) => {
      const identificadorNormalizado = normalizarIdentificador(identificador);
      const empleadoId = mapeoIds[identificadorNormalizado];
      
      if (!empleadoId) {
        // Si no encontramos el empleado, retornar 0 para ese identificador
        return { identificador, totalPendiente: 0 };
      }
      
      const totalPendiente = await cargarValesEmpleado(empleadoId);
      return { identificador, totalPendiente };
    });
    
    const resultados = await Promise.all(valesPromises);
    const nuevosVales: Record<string, number> = {};
    
    resultados.forEach(({ identificador, totalPendiente }) => {
      nuevosVales[identificador] = totalPendiente;
    });
    
    setValesPorEmpleado((prev) => ({ ...prev, ...nuevosVales }));
  };

  const handleBuscar = async () => {
    setBuscando(true);
    setLoadingData(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append("fecha_inicio", fechaInicio);
      if (fechaFin) params.append("fecha_fin", fechaFin);
      
      const res = await fetch(
        `${apiUrl}/pedidos/comisiones/produccion/terminadas/?${params.toString()}`
      );
      
      if (!res.ok) throw new Error("Error al obtener datos");
      
      const json = await res.json();
      const jsonFormateado = json.map((empleado: EmpleadoComision) => ({
        ...empleado,
        empleado_id:
          typeof empleado.empleado_id === "string" &&
          (empleado.empleado_id.startsWith("v") ||
            empleado.empleado_id.startsWith("V"))
            ? empleado.empleado_id.slice(1)
            : empleado.empleado_id,
      }));
      setData(jsonFormateado);
      
      // Cargar vales de todos los empleados que tienen asignaciones
      const empleadosIds = jsonFormateado.map((e: EmpleadoComision) => e.empleado_id);
      await cargarValesEmpleados(empleadosIds);
    } catch (error) {
      console.error("Error buscando comisiones:", error);
      alert("Error al cargar las comisiones. Intenta nuevamente.");
    } finally {
      setLoadingData(false);
      setBuscando(false);
    }
  };
  // Memoizar empleados filtrados para evitar recalcular en cada render
  const empleadosFiltrados = useMemo(() => {
    return empleados.filter((empleado) => {
      if (
        permisosSeleccionados.length > 0 &&
        !(empleado.permisos || []).some((p:any) => permisosSeleccionados.includes(p))
      ) {
        return false;
      }
      const empleadoComision = data.find(
        (e) => e.empleado_id === empleado.identificador
      );
      if (filtroAyudante === "sin-ayudante") {
        return (
          !empleado.permisos?.includes("ayudante") &&
          empleadoComision &&
          empleadoComision.asignaciones?.length > 0
        );
      }
      if (filtroAyudante === "solo-ayudante") {
        return (
          empleado.permisos?.includes("ayudante") &&
          empleadoComision &&
          empleadoComision.asignaciones?.length > 0
        );
      }
      return empleadoComision && empleadoComision.asignaciones?.length > 0;
    });
  }, [empleados, permisosSeleccionados, filtroAyudante, data]);

  // Memoizar total general para evitar recalcular en cada render
  const totalGeneral = useMemo(() => {
    return empleadosFiltrados.reduce((acc, empleado) => {
      const empleadoComision = data.find(
        (e) => e.empleado_id === empleado.identificador
      );
      if (empleado.permisos?.includes("ayudante")) return acc;
      const asignacionesFiltradas = empleadoComision?.asignaciones?.filter((asig) => {
        if (!fechaInicio && !fechaFin) return true;
        const fecha = asig.fecha_inicio_subestado || asig.fecha_inicio || "";
        if (!fecha) return false;
        const fechaObj = new Date(fecha);
        if (fechaInicio && fechaObj < new Date(fechaInicio)) return false;
        if (fechaFin && fechaObj > new Date(fechaFin + "T23:59:59")) return false;
        return true;
      }) || [];
      const totalEmpleado = asignacionesFiltradas.reduce((acc2, asig) => {
        const val = parseFloat(asig.costoproduccion) || 0;
        return acc2 + val;
      }, 0);
      return acc + totalEmpleado;
    }, 0);
  }, [empleadosFiltrados, data, fechaInicio, fechaFin]);

// Removido: totalGeneralPrecios ya no se usa
// const totalGeneralPrecios = empleadosFiltrados.reduce((acc, empleado) => {
//   const empleadoComision = data.find(
//     (e) => e.empleado_id === empleado.identificador
//   );
//   if (!empleadoComision) return acc;
//   const asignacionesFiltradas = empleadoComision.asignaciones?.filter((asig) => {
//     if (!fechaInicio && !fechaFin) return true;
//     const fecha = asig.fecha_inicio_subestado || asig.fecha_inicio || "";
//     if (!fecha) return false;
//     const fechaObj = new Date(fecha);
//     if (fechaInicio && fechaObj < new Date(fechaInicio)) return false;
//     if (fechaFin && fechaObj > new Date(fechaFin + "T23:59:59")) return false;
//     return true;
//   }) || [];
//   const subtotal = asignacionesFiltradas.reduce((acc2, asig) => {
//     const precio = asig.precio_item || 0;
//     const cantidad = (asig as any).cantidad ? Number((asig as any).cantidad) : 1;
//     return acc2 + precio * cantidad;
//   }, 0);
//   return acc + subtotal;
// }, 0);

  // Memoizar la lista de empleados para el render (con filtro de búsqueda)
  const empleadosParaRender = useMemo(() => {
    return empleadosFiltrados.filter((empleado) => {
      if (!busquedaEmpleado) return true;
      const nombre = (empleado.nombreCompleto || "").toLowerCase();
      return nombre.includes(busquedaEmpleado.toLowerCase());
    });
  }, [empleadosFiltrados, busquedaEmpleado]);

  if (loadingEmpleados) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-10">
          <div className="text-lg text-gray-600">Cargando empleados...</div>
          <div className="mt-4 inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
          Reporte de Comisiones de Producción
        </h2>
        <div className="flex flex-col items-end gap-1">
          <span className="px-4 py-2 rounded-xl bg-green-100 text-green-800 text-lg font-bold shadow-sm">
            Total General: ${totalGeneral.toFixed(2)}
          </span>
          {(fechaInicio || fechaFin) && (
            <span className="text-xs text-gray-500 italic">
              {fechaInicio && fechaFin 
                ? `Filtrado: ${fechaInicio} a ${fechaFin}`
                : fechaInicio 
                ? `Desde: ${fechaInicio}`
                : `Hasta: ${fechaFin}`}
            </span>
          )}
        </div>
      </div>

      {/* FILTROS */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Desde</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Hasta</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold mb-1">
                Filtrar empleados
              </label>
              <Button
                variant="outline"
                onClick={() => {
                  if (filtroAyudante === "sin-ayudante")
                    setFiltroAyudante("solo-ayudante");
                  else if (filtroAyudante === "solo-ayudante")
                    setFiltroAyudante("todos");
                  else setFiltroAyudante("sin-ayudante");
                }}
              >
                {filtroAyudante === "sin-ayudante" && "Sin ayudantes"}
                {filtroAyudante === "solo-ayudante" && "Solo ayudantes"}
                {filtroAyudante === "todos" && "Mostrar todos"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={handleBuscar} 
              disabled={loadingData || buscando}
              className="min-w-[120px]"
            >
              {buscando ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Buscando...
                </span>
              ) : (
                "Buscar"
              )}
            </Button>
            <input
              type="text"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Buscar por nombre..."
              value={busquedaEmpleado}
              onChange={(e) => setBusquedaEmpleado(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={permisosSeleccionados.length === 0 ? "default" : "outline"}
              className="cursor-pointer px-3 py-1 text-sm border"
              onClick={() => setPermisosSeleccionados([])}
            >
              Todos
            </Badge>
            {permisosUnicos.map((permiso) => (
              <Badge
                key={permiso}
                variant={
                  permisosSeleccionados.includes(permiso) ? "default" : "outline"
                }
                className="cursor-pointer px-3 py-1 text-sm capitalize"
                onClick={() => togglePermiso(permiso)}
              >
                {permiso}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* LISTA DE EMPLEADOS */}
      {loadingData && data.length === 0 ? (
        <div className="text-center text-gray-500 py-6">
          <div className="text-lg text-gray-600 mb-2">Cargando datos de comisiones...</div>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : empleadosParaRender.length === 0 ? (
        <div className="text-center text-gray-500 py-6">
          {data.length === 0 
            ? "No hay datos para mostrar. Selecciona un rango de fechas y haz clic en 'Buscar'."
            : "No hay empleados que coincidan con los filtros seleccionados."}
        </div>
      ) : (
        <ul className="space-y-6">
          {empleadosParaRender.map((empleado) => {
              const empleadoComision = data.find(
                (e) => e.empleado_id === empleado.identificador
              );
              
              // Filtrar asignaciones por fecha (si hay fechas seleccionadas)
              // Nota: El backend ya puede estar filtrando, pero aplicamos filtro adicional por seguridad
              const asignacionesFiltradas =
                empleadoComision?.asignaciones?.filter((asig) => {
                  // Si no hay filtros de fecha en el frontend, mostrar todas las asignaciones que devolvió el backend
                  if (!fechaInicio && !fechaFin) return true;
                  
                  // Intentar obtener la fecha de la asignación (probar múltiples campos)
                  const fecha =
                    asig.fecha_inicio_subestado || 
                    asig.fecha_inicio || 
                    asig.fecha_fin_subestado ||
                    asig.fecha_fin ||
                    "";
                  
                  // Si no tiene fecha y estamos filtrando, excluirla
                  if (!fecha) return false;
                  
                  try {
                    const fechaObj = new Date(fecha);
                    if (isNaN(fechaObj.getTime())) return false; // Fecha inválida
                    
                    const fechaInicioObj = fechaInicio ? new Date(fechaInicio + "T00:00:00") : null;
                    const fechaFinObj = fechaFin ? new Date(fechaFin + "T23:59:59") : null;
                    
                    // Validar que la fecha esté en el rango
                    if (fechaInicioObj && fechaObj < fechaInicioObj) return false;
                    if (fechaFinObj && fechaObj > fechaFinObj) return false;
                    
                    return true;
                  } catch {
                    return false; // Si hay error parseando la fecha, excluirla
                  }
                }) || [];
              
              // Calcular Total Generado SOLO con las asignaciones filtradas por fecha
              // Si no hay asignaciones filtradas, el total será 0
              const total = empleado.permisos?.includes("ayudante")
                ? 0
                : asignacionesFiltradas.reduce((acc, asig) => {
                  const costoUnitario = parseFloat(asig.costoproduccion) || 0;
                  const cantidad = (asig as any).cantidad ? Number((asig as any).cantidad) : 1;
                  const costoTotal = costoUnitario * cantidad;
                  return acc + costoTotal;
                }, 0);
              return (
                <li key={empleado._id}>
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="flex flex-row sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {empleado.nombreCompleto || empleado._id}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {empleado.permisos?.map((permiso: string) => (
                              <Badge
                                key={permiso}
                                variant="outline"
                                className="bg-blue-100 text-blue-800 border-blue-300 text-xs"
                              >
                                {permiso}
                              </Badge>
                            ))}
                          </div>
                          {/* Total Generado del empleado */}
                          <div className="mt-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-600">Total Generado: </span>
                              <span className="text-lg font-bold text-green-700">${total.toFixed(2)}</span>
                              {(fechaInicio || fechaFin) && (
                                <span className="text-xs text-gray-500 italic">
                                  {asignacionesFiltradas.length} asignación{asignacionesFiltradas.length !== 1 ? 'es' : ''} en rango
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Sección de Vales */}
                          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-700">Vales:</span>
                              <span className="text-lg font-bold text-yellow-700">
                                ${(valesPorEmpleado[empleado.identificador] || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {/* Selector de Método de Pago */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Método de Pago:
                                </label>
                                <Select
                                  value={metodoPagoSeleccionado[empleado.identificador] || ""}
                                  onValueChange={(value) =>
                                    setMetodoPagoSeleccionado((prev) => ({
                                      ...prev,
                                      [empleado.identificador]: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-full border border-gray-300 bg-white">
                                    <SelectValue placeholder="Selecciona un método de pago" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {metodos.map((metodo) => (
                                      <SelectItem key={metodo.id} value={metodo.id || ""}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{metodo.nombre} - {metodo.banco}</span>
                                          <span className="ml-2 text-xs text-gray-500">
                                            {metodo.moneda === "dolar" ? "$" : "Bs."}{metodo.saldo.toFixed(2)}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Monto"
                                  value={inputVales[empleado.identificador] || ""}
                                  onChange={(e) =>
                                    setInputVales((prev) => ({
                                      ...prev,
                                      [empleado.identificador]: e.target.value,
                                    }))
                                  }
                                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                                <Button
                                  type="button"
                                  onClick={() => handleAgregarVales(empleado.identificador)}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                  disabled={!metodoPagoSeleccionado[empleado.identificador]}
                                >
                                  Agregar Vales
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => handleAbonarVales(empleado.identificador)}
                                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                  disabled={(valesPorEmpleado[empleado.identificador] || 0) <= 0}
                                >
                                  Abonar Vales
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardTitle>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-2 w-full">
                            {asignacionesFiltradas.map((asig, idx) => {
                              const cantidad = (asig as any).cantidad ? Number((asig as any).cantidad) : 1;
                              const totalLinea = (asig.precio_item || 0) * cantidad;
                              return (
                                <div
                                  key={idx}
                                  className="py-4 flex flex-col gap-2 bg-slate-50 rounded-lg p-4 shadow-sm"
                                >
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <span className="text-lg font-semibold text-blue-700">
                                      Pedido: {asig.pedido_id}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      Item ID: {asig.item_id}
                                    </span>
                                  </div>
                                  <p className="text-gray-700">
                                    <span className="font-semibold">Descripción: </span>
                                    {asig.descripcionitem}
                                  </p>
                                  <div className="flex flex-wrap gap-6 mt-2">
                                    <span className="text-gray-700 font-medium">
                                      Precio:{" "}
                                      <span className="text-slate-900 font-bold">
                                        ${asig.precio_item?.toFixed(2) || "0.00"}
                                      </span>
                                    </span>
                                    <span className="text-gray-700 font-medium">
                                      Cantidad: <span className="text-slate-900 font-bold">{cantidad}</span>
                                    </span>
                                    <span className="text-gray-700 font-medium">
                                      Total línea: <span className="text-slate-900 font-bold">${totalLinea.toFixed(2)}</span>
                                    </span>
                                    <span className="text-gray-700 font-medium">
                                      Costo Producción:{" "}
                                      <span className="text-green-700 font-bold">
                                        ${(parseFloat(asig.costoproduccion) || 0).toFixed(2)}
                                        {cantidad > 1 && (
                                          <span className="text-green-600 ml-1">
                                            ({cantidad} x ${(parseFloat(asig.costoproduccion) || 0).toFixed(2)} = ${((parseFloat(asig.costoproduccion) || 0) * cantidad).toFixed(2)})
                                          </span>
                                        )}
                                      </span>
                                    </span>
                                  </div>
                                  {asig.estado && (
                                    <span className="text-sm text-gray-600">
                                      Estado General:{" "}
                                      <span className="font-medium">{asig.estado}</span>
                                    </span>
                                  )}
                                  {asig.estado_subestado && (
                                    <span className="text-sm text-gray-600">
                                      Estado de la Asignación:{" "}
                                      <span className="font-medium">
                                        {asig.estado_subestado}
                                      </span>
                                    </span>
                                  )}
                                  {asig.fecha_inicio && (
                                    <span className="text-sm text-gray-600">
                                      Inicio: {formatFecha(asig.fecha_inicio)}
                                    </span>
                                  )}
                                  {asig.fecha_fin && (
                                    <span className="text-sm text-gray-600">
                                      Fin: {formatFecha(asig.fecha_fin)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </CardContent>
                    </CardHeader>
                  </Card>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
};

export default ReporteComisionesProduccion;
