import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  const permisosUnicos = useMemo(() => {
    return Array.from(
      new Set(empleados.flatMap((empleado) => empleado.permisos || []))
    );
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

  const handleAgregarVales = (empleadoId: string) => {
    const valorInput = inputVales[empleadoId] || "0";
    const valor = parseFloat(valorInput);
    if (isNaN(valor) || valor <= 0) {
      alert("Por favor ingresa un valor válido mayor a 0");
      return;
    }
    setValesPorEmpleado((prev) => ({
      ...prev,
      [empleadoId]: (prev[empleadoId] || 0) + valor,
    }));
    setInputVales((prev) => ({
      ...prev,
      [empleadoId]: "",
    }));
  };

  const handleAbonarVales = (empleadoId: string) => {
    const valorInput = inputVales[empleadoId] || "0";
    const valor = parseFloat(valorInput);
    if (isNaN(valor) || valor <= 0) {
      alert("Por favor ingresa un valor válido mayor a 0");
      return;
    }
    const valesActuales = valesPorEmpleado[empleadoId] || 0;
    if (valor > valesActuales) {
      alert("No puedes abonar más vales de los que tiene el empleado");
      return;
    }
    setValesPorEmpleado((prev) => ({
      ...prev,
      [empleadoId]: (prev[empleadoId] || 0) - valor,
    }));
    setInputVales((prev) => ({
      ...prev,
      [empleadoId]: "",
    }));
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
              const asignacionesFiltradas =
                empleadoComision?.asignaciones?.filter((asig) => {
                  // Si no hay filtros de fecha, mostrar todas las asignaciones
                  if (!fechaInicio && !fechaFin) return true;
                  
                  // Obtener la fecha de la asignación
                  const fecha =
                    asig.fecha_inicio_subestado || asig.fecha_inicio || "";
                  if (!fecha) return false;
                  
                  const fechaObj = new Date(fecha);
                  const fechaInicioObj = fechaInicio ? new Date(fechaInicio) : null;
                  const fechaFinObj = fechaFin ? new Date(fechaFin + "T23:59:59") : null;
                  
                  // Validar que la fecha esté en el rango
                  if (fechaInicioObj && fechaObj < fechaInicioObj) return false;
                  if (fechaFinObj && fechaObj > fechaFinObj) return false;
                  
                  return true;
                }) || [];
              
              // Calcular Total Generado SOLO con las asignaciones filtradas por fecha
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
