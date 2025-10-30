import React, { useState, useEffect } from "react";
import { useEmpleadosPorModulo } from "@/hooks/useEmpleadosPorModulo";
import { useEstadoItems } from "@/hooks/useEstadoItems";
import ImageDisplay from "@/upfile/ImageDisplay";
import BarraProgresoItem from "@/components/ui/BarraProgresoItem";
import GestorEmpleadosAutomatico from "@/components/GestorEmpleadosAutomatico";

interface PedidoItem {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  costo: number;
  cantidad: number;
  activo: boolean;
  costoProduccion: number;
  imagenes?: string[];
}

interface Empleado {
  id?: string;
  _id?: string; // MongoDB _id
  identificador: string;
  nombre?: string;
  nombreCompleto?: string;
  cargo?: string | null;
  permisos?: string[];
  pin?: string;
  activo?: boolean;
}

interface UnidadAsignable {
  unidad_index: number;
  estado: string;
  empleadoId: string | null;
  nombreempleado: string | null;
  disponible: boolean;
}

interface ItemConUnidades {
  item_id: string;
  item_nombre: string;
  cantidad_total: number;
  unidades_asignadas: number;
  unidades_disponibles: number;
  unidades_terminadas: number;
  unidades: UnidadAsignable[];
}

interface AsignacionesDisponibles {
  pedido_id: string;
  modulo: string;
  items: ItemConUnidades[];
}

interface AsignarArticulosProps {
  items: PedidoItem[];
  empleados: Empleado[];
  pedidoId: string;
  numeroOrden: string;
  estado_general: string;
  tipoEmpleado: string[];
}

const AsignarArticulos: React.FC<AsignarArticulosProps> = ({
  items,
  empleados,
  pedidoId,
  numeroOrden,
  estado_general: _estado_general,
  tipoEmpleado: _tipoEmpleado,
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [asignacionesDisponibles, setAsignacionesDisponibles] = useState<AsignacionesDisponibles | null>(null);
  const [_empleadosPorItem, setEmpleadosPorItem] = useState<Record<string, any[]>>({});
  const [asignacionesPendientes, setAsignacionesPendientes] = useState<Record<string, Array<{ unidad_index: number; empleadoId: string }>>>({});

  const { loading: _loadingEmpleados } = useEmpleadosPorModulo();
  const { obtenerEstadoItem, cargarEstadosItems } = useEstadoItems(pedidoId, items);

  const obtenerModulo = (): string => {
    const ordenNum = parseInt(numeroOrden) || 1;
    if (ordenNum === 1) return "herreria";
    if (ordenNum === 2) return "masillar";
    return "preparar";
  };

  const fetchAsignacionesDisponibles = async (): Promise<AsignacionesDisponibles | null> => {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("access_token");
      const modulo = obtenerModulo();

      const res = await fetch(`${apiUrl}/pedidos/asignaciones-disponibles/${pedidoId}/${modulo}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        console.warn('⚠️ No se pudo obtener asignaciones disponibles:', res.status);
        return null;
      }

      const data = await res.json();
      console.log('📋 Asignaciones disponibles cargadas:', data);
      return data;
    } catch (error) {
      console.error('❌ Error al cargar asignaciones disponibles:', error);
      return null;
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      const data = await fetchAsignacionesDisponibles();
      if (data) {
        setAsignacionesDisponibles(data);
      }
      await cargarEmpleadosPorItem();
    };
    cargarDatos();
  }, [pedidoId, numeroOrden]);

  useEffect(() => {
    const handleCambioEstado = async () => {
      const data = await fetchAsignacionesDisponibles();
      if (data) {
        setAsignacionesDisponibles(data);
      }
      await cargarEstadosItems();
      await cargarEmpleadosPorItem();
    };

    window.addEventListener('cambioEstadoItem', handleCambioEstado);
    return () => window.removeEventListener('cambioEstadoItem', handleCambioEstado);
  }, [cargarEstadosItems]);

  const cargarEmpleadosPorItem = async () => {
    const empleadosPorItemData: Record<string, any[]> = {};
    for (const item of items) {
      empleadosPorItemData[item.id] = empleados;
    }
    setEmpleadosPorItem(empleadosPorItemData);
  };

  const handleAsignarUnidad = async (itemId: string, unidadIndex: number, empleadoId: string) => {
    if (!empleadoId) {
      setMessage("⚠️ Debes seleccionar un empleado");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("access_token");
      const modulo = obtenerModulo();
      const empleado = empleados.find(e => e._id === empleadoId);
      const empleadoNombre = empleado?.nombreCompleto || empleado?.nombre || "";

      const res = await fetch(`${apiUrl}/pedidos/asignar-item/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          pedido_id: pedidoId,
          item_id: itemId,
          empleado_id: empleadoId,
          empleado_nombre: empleadoNombre,
          modulo: modulo,
          unidad_index: unidadIndex
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText}`);
      }

      const resultado = await res.json();
      console.log('✅ Unidad asignada:', resultado);

      window.dispatchEvent(new CustomEvent('asignacionRealizada', {
        detail: {
          pedidoId,
          itemId,
          unidadIndex,
          empleadoId,
          timestamp: new Date().toISOString(),
        }
      }));

      const data = await fetchAsignacionesDisponibles();
      if (data) {
        setAsignacionesDisponibles(data);
      }
      await cargarEstadosItems();
      setMessage(`✅ Unidad ${unidadIndex} asignada correctamente`);
    } catch (err: any) {
      console.error("❌ Error al asignar unidad:", err);
      setMessage(`❌ Error al asignar unidad: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminarAsignacion = async (itemId: string, empleadoId: string) => {
    setLoading(true);
    setMessage("");

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const res = await fetch(`${apiUrl}/pedidos/asignacion/terminar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_id: pedidoId,
          orden: parseInt(numeroOrden),
          item_id: itemId,
          empleado_id: empleadoId,
          estado: "terminado",
          fecha_fin: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      console.log("✅ Asignación terminada:", result);

      const data = await fetchAsignacionesDisponibles();
      if (data) {
        setAsignacionesDisponibles(data);
      }
      await cargarEstadosItems();
      await cargarEmpleadosPorItem();
      setMessage("Asignación terminada exitosamente. El artículo ha avanzado al siguiente módulo.");
    } catch (err) {
      setMessage("Error al terminar la asignación");
      console.error("❌ Error al terminar asignación:", err);
    } finally {
      setLoading(false);
    }
  };

  const getItemConUnidades = (itemId: string): ItemConUnidades | null => {
    if (!asignacionesDisponibles) return null;
    return asignacionesDisponibles.items.find(it => it.item_id === itemId) || null;
  };

  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">Asignar empleados por artículo:</h4>
      <ul className="space-y-4">
        {items.map((item, idx) => {
          const itemConUnidades = getItemConUnidades(item.id);
          const mostrarUnidades = itemConUnidades && itemConUnidades.unidades && itemConUnidades.unidades.length > 0;

          return (
            <li key={`${item.id}-${idx}`} className="flex flex-col gap-2 border rounded p-3">
              <span className="font-medium">{item.nombre}</span>
              
              <BarraProgresoItem 
                pedidoId={pedidoId}
                itemId={item.id}
                moduloActual={obtenerEstadoItem(item.id)}
              />
              
              {item.imagenes && item.imagenes.length > 0 && (
                <div className="flex flex-col gap-2 items-center justify-center">
                  <span className="text-xs text-gray-600 mb-1">Imágenes:</span>
                  <div className="flex gap-2 flex-row">
                    {item.imagenes.slice(0, 3).map((img: string, imgIdx: number) => (
                      <ImageDisplay
                        key={imgIdx}
                        imageName={img}
                        alt={`Imagen ${imgIdx + 1}`}
                        style={{ maxWidth: 60, maxHeight: 60, borderRadius: 6, border: '1px solid #ddd' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {itemConUnidades && (
                <div className="text-xs text-gray-600 mb-2 bg-blue-50 p-2 rounded">
                  Total: <b>{itemConUnidades.cantidad_total}</b> · 
                  Asignadas: <b>{itemConUnidades.unidades_asignadas}</b> · 
                  Disponibles: <b className="text-green-600">{itemConUnidades.unidades_disponibles}</b> · 
                  Terminadas: <b>{itemConUnidades.unidades_terminadas}</b>
                </div>
              )}

              {mostrarUnidades ? (
                <div className="space-y-2">
                  {itemConUnidades && itemConUnidades.cantidad_total > 1 && (
                    <div className="text-sm font-semibold text-gray-700">Unidades individuales:</div>
                  )}
                  {itemConUnidades?.unidades.map((unidad) => (
                    <div key={unidad.unidad_index} className="border rounded p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Unidad {unidad.unidad_index}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          unidad.estado === "terminado" ? "bg-green-100 text-green-700" :
                          unidad.estado === "en_proceso" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {unidad.estado === "terminado" ? "✓ Terminada" :
                           unidad.estado === "en_proceso" ? "⚙ En proceso" :
                           "⏳ Pendiente"}
                        </span>
                      </div>

                      {unidad.empleadoId ? (
                        <div className="flex flex-col gap-2">
                          <div className="text-sm text-blue-700">
                            Asignada a: <b>{unidad.nombreempleado || "Empleado"}</b>
                          </div>
                          {unidad.estado !== "terminado" && (
                            <button
                              type="button"
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 w-fit"
                              onClick={() => handleTerminarAsignacion(item.id, unidad.empleadoId!)}
                              disabled={loading}
                            >
                              {loading ? "Terminando..." : "Terminar asignación"}
                            </button>
                          )}
                        </div>
                      ) : unidad.disponible ? (
                        <div className="flex gap-2 items-center">
                          <select
                            className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 bg-white"
                            value={asignacionesPendientes[`${item.id}-${unidad.unidad_index}`]?.[0]?.empleadoId || ""}
                            onChange={(e) => {
                              const empleadoId = e.target.value;
                              if (empleadoId) {
                                setAsignacionesPendientes(prev => ({
                                  ...prev,
                                  [`${item.id}-${unidad.unidad_index}`]: [{ unidad_index: unidad.unidad_index, empleadoId }]
                                }));
                              }
                            }}
                          >
                            <option value="">👤 Seleccionar empleado...</option>
                            {empleados
                              .filter(e => e && e._id && (e.nombre || e.nombreCompleto))
                              .map((emp) => (
                                <option key={emp._id} value={emp._id}>
                                  {emp.nombreCompleto || emp.nombre || emp._id}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            onClick={() => {
                              const pendiente = asignacionesPendientes[`${item.id}-${unidad.unidad_index}`]?.[0];
                              if (pendiente?.empleadoId) {
                                handleAsignarUnidad(item.id, unidad.unidad_index, pendiente.empleadoId);
                              } else {
                                setMessage("⚠️ Debes seleccionar un empleado");
                              }
                            }}
                            disabled={loading}
                          >
                            Asignar
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No disponible para asignación</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : itemConUnidades && itemConUnidades.unidades_disponibles === 0 ? (
                <div className="text-sm text-gray-600">
                  🚫 Todas las unidades están asignadas o terminadas
                </div>
              ) : !itemConUnidades ? (
                <div className="text-sm text-yellow-600">
                  ⚠️ Cargando unidades disponibles...
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      
      {message && (
        <div className={`mt-2 font-semibold ${
          message.startsWith("✅") ? "text-green-600" : 
          message.startsWith("⚠️") ? "text-yellow-600" : 
          "text-red-600"
        }`}>
          {message}
        </div>
      )}
      
      <GestorEmpleadosAutomatico 
        empleados={empleados}
        onEmpleadosChange={(nuevosEmpleados) => {
          console.log('🔄 Empleados actualizados automáticamente:', nuevosEmpleados);
        }}
      />
    </div>
  );
};

export default AsignarArticulos;
