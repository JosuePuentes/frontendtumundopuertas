import React, { useState, useEffect } from "react";
import { useEmpleadosPorModulo } from "@/hooks/useEmpleadosPorModulo";
import { useEstadoItems } from "@/hooks/useEstadoItems";
import ImageDisplay from "@/upfile/ImageDisplay";
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
  fecha_asignacion?: string;
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
  const [endpointDisponible, setEndpointDisponible] = useState<boolean>(true);

  const { loading: _loadingEmpleados } = useEmpleadosPorModulo();
  const { cargarEstadosItems } = useEstadoItems(pedidoId, items);

  const obtenerModulo = (): string => {
    const ordenNum = parseInt(numeroOrden) || 1;
    if (ordenNum === 1) return "herreria";
    if (ordenNum === 2) return "masillar";
    return "preparar";
  };

  const fetchAsignacionesDisponibles = async (): Promise<AsignacionesDisponibles | null> => {
    // Si el endpoint no está disponible, no intentar llamarlo
    if (!endpointDisponible) {
      return null;
    }

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("access_token");
      const modulo = obtenerModulo();

      const res = await fetch(`${apiUrl}/pedidos/asignaciones-disponibles/${pedidoId}/${modulo}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        mode: 'cors'
      });

      if (!res.ok) {
        // Si es error 500, deshabilitar el endpoint temporalmente
        if (res.status === 500) {
          setEndpointDisponible(false);
        }
        return null;
      }

      const data = await res.json();
      console.log('📋 Asignaciones disponibles cargadas:', data);
      // Si funciona, asegurar que el endpoint está disponible
      setEndpointDisponible(true);
      return data;
    } catch (error: any) {
      // Silenciar errores CORS/Network - deshabilitar el endpoint
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('ERR_FAILED')) {
        setEndpointDisponible(false);
        return null;
      }
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

    // Validar que empleados sea un array
    if (!empleados || !Array.isArray(empleados)) {
      setMessage("⚠️ Error: No se pudo cargar la lista de empleados");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("access_token");
      const modulo = obtenerModulo();
      const empleado = empleados.find(e => e && (e._id === empleadoId || e.id === empleadoId || e.identificador === empleadoId));
      const empleadoNombre = empleado?.nombreCompleto || empleado?.nombre || "";
      const fechaAsignacion = new Date().toISOString();

      // ACTUALIZACIÓN OPTIMISTA: Actualizar UI inmediatamente antes de la respuesta del servidor
      setAsignacionesDisponibles(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(it => {
            if (it.item_id === itemId) {
              return {
                ...it,
                unidades: it.unidades.map(u => {
                  if (u.unidad_index === unidadIndex && u.disponible) {
                    return {
                      ...u,
                      empleadoId: empleadoId,
                      nombreempleado: empleadoNombre,
                      fecha_asignacion: fechaAsignacion,
                      estado: "en_proceso",
                      disponible: false
                    };
                  }
                  return u;
                })
              };
            }
            return it;
          })
        };
      });

      // Limpiar el estado de asignación pendiente inmediatamente
      setAsignacionesPendientes(prev => {
        const nuevo = { ...prev };
        delete nuevo[`${itemId}-${unidadIndex}`];
        return nuevo;
      });

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
        // Si falla, revertir la actualización optimista
        const data = await fetchAsignacionesDisponibles();
        if (data) {
          setAsignacionesDisponibles(data);
        }
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText}`);
      }

      const resultado = await res.json();
      console.log('✅ Unidad asignada:', resultado);

      // Sincronizar con el backend (pero sin recargar la página)
      const data = await fetchAsignacionesDisponibles();
      if (data) {
        setAsignacionesDisponibles(data);
      }

      window.dispatchEvent(new CustomEvent('asignacionRealizada', {
        detail: {
          pedidoId,
          itemId,
          unidadIndex,
          empleadoId,
          timestamp: fechaAsignacion,
        }
      }));

      // NO llamar a cargarEstadosItems() para evitar recargar toda la página
      setMessage(`✅ Unidad ${unidadIndex} asignada a ${empleadoNombre}`);
    } catch (err: any) {
      console.error("❌ Error al asignar unidad:", err);
      setMessage(`❌ Error al asignar unidad: ${err.message}`);
      
      // Revertir actualización optimista en caso de error
      const data = await fetchAsignacionesDisponibles();
      if (data) {
        setAsignacionesDisponibles(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTerminarAsignacion = async (itemId: string, empleadoId: string, unidadIndex?: number) => {
    setLoading(true);
    setMessage("");

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      // NOTA: No se envía PIN porque este componente se usa en PedidosHerreria donde no se requiere PIN
      // El PIN solo se requiere en Dashboard de Asignaciones
      const payload: any = {
        pedido_id: pedidoId,
        orden: parseInt(numeroOrden),
        item_id: itemId,
        empleado_id: empleadoId,
        estado: "terminado",
        fecha_fin: new Date().toISOString(),
        // pin: No se envía - solo requerido en Dashboard de Asignaciones
      };
      
      // CRÍTICO: Enviar unidad_index si está disponible para terminar la unidad correcta
      if (unidadIndex !== undefined) {
        payload.unidad_index = unidadIndex;
      }
      
      const res = await fetch(`${apiUrl}/pedidos/asignacion/terminar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText}`);
      }

      const result = await res.json();
      console.log("✅ Asignación terminada:", result);

      // Disparar evento para que PedidosHerreria recargue datos
      window.dispatchEvent(new CustomEvent('asignacionTerminada', {
        detail: {
          pedidoId,
          itemId,
          unidadIndex,
          timestamp: new Date().toISOString()
        }
      }));

      // Recargar datos de asignaciones disponibles
      const data = await fetchAsignacionesDisponibles();
      if (data) {
        setAsignacionesDisponibles(data);
      }
      await cargarEstadosItems();
      await cargarEmpleadosPorItem();
      setMessage("✅ Asignación terminada exitosamente. El artículo ha avanzado al siguiente módulo.");
    } catch (err: any) {
      setMessage("❌ Error al terminar la asignación: " + (err.message || "Error desconocido"));
      console.error("❌ Error al terminar asignación:", err);
    } finally {
      setLoading(false);
    }
  };

  const getItemConUnidades = (itemId: string): ItemConUnidades | null => {
    if (!asignacionesDisponibles) return null;
    return asignacionesDisponibles.items.find(it => it.item_id === itemId) || null;
  };

  const obtenerNombreEmpleado = (empleadoId: string | null): string => {
    if (!empleadoId) return "Sin asignar";
    
    // Validar que empleados sea un array
    if (!empleados || !Array.isArray(empleados)) {
      return empleadoId;
    }
    
    // Buscar el empleado en la lista por cualquier campo posible
    const empleado = empleados.find(e => {
      if (!e) return false;
      // Comparar como strings para asegurar coincidencia
      const idMatch = e._id && String(e._id) === String(empleadoId);
      const idAltMatch = e.id && String(e.id) === String(empleadoId);
      const identificadorMatch = e.identificador && String(e.identificador) === String(empleadoId);
      return idMatch || idAltMatch || identificadorMatch;
    });
    
    if (empleado) {
      const nombre = empleado.nombreCompleto || empleado.nombre;
      if (nombre) {
        return nombre;
      }
    }
    
    // Si no se encuentra el empleado, intentar cargarlo del backend si es necesario
    // Por ahora, retornar el ID como fallback pero con un mensaje más claro
    console.warn('⚠️ Empleado no encontrado en lista local:', empleadoId, 'Total empleados:', empleados?.length || 0);
    return empleadoId; // Devolver el ID si no se encuentra
  };

  const obtenerCargoEmpleado = (empleadoId: string | null): string => {
    if (!empleadoId || !empleados || !Array.isArray(empleados)) return "";
    
    const empleado = empleados.find(e => {
      if (!e) return false;
      const idMatch = e._id && String(e._id) === String(empleadoId);
      const idAltMatch = e.id && String(e.id) === String(empleadoId);
      const identificadorMatch = e.identificador && String(e.identificador) === String(empleadoId);
      return idMatch || idAltMatch || identificadorMatch;
    });
    
    return empleado?.cargo || "";
  };

  const formatearFecha = (fecha: string | undefined): string => {
    if (!fecha) return "";
    try {
      const date = new Date(fecha);
      const dia = date.getDate().toString().padStart(2, '0');
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      const año = date.getFullYear();
      return `${dia}/${mes}/${año}`;
    } catch {
      return "";
    }
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

              {mostrarUnidades ? (
                <div className="space-y-2">
                  {/* Resumen de empleados asignados a este item */}
                  {itemConUnidades && itemConUnidades.unidades_asignadas > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                      <div className="text-sm font-semibold text-blue-800 mb-2">
                        📋 Empleados asignados:
                      </div>
                      <div className="space-y-2">
                        {Array.from(
                          new Map(
                            itemConUnidades.unidades
                              .filter(u => u.empleadoId)
                              .map(u => [
                                u.empleadoId,
                                {
                                  empleadoId: u.empleadoId,
                                  nombre: u.nombreempleado || obtenerNombreEmpleado(u.empleadoId),
                                  cargo: obtenerCargoEmpleado(u.empleadoId),
                                  fecha: u.fecha_asignacion,
                                  cantidad: 1
                                }
                              ])
                          ).values()
                        ).map((info, idx) => {
                          // Contar cuántas unidades están asignadas a este empleado
                          const cantidadAsignada = itemConUnidades.unidades.filter(
                            u => u.empleadoId === info.empleadoId
                          ).length;
                          
                          return (
                            <div key={`${info.empleadoId}-${idx}`} className="text-sm text-blue-700 border-l-4 border-blue-400 pl-2">
                              <div>
                                <span className="font-semibold">Asignado a:</span> <b>{info.nombre}</b>
                                {info.cargo && (
                                  <span className="text-gray-600"> ({info.cargo})</span>
                                )}
                                {cantidadAsignada > 1 && (
                                  <span className="text-gray-600"> · {cantidadAsignada} unidad{cantidadAsignada > 1 ? 'es' : ''}</span>
                                )}
                              </div>
                              {info.fecha && (
                                <div className="text-xs text-gray-600">
                                  <span className="font-semibold">Fecha asignación:</span> {formatearFecha(info.fecha)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
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
                          <div className="text-sm text-blue-700 space-y-1">
                            <div>
                              <span className="font-semibold">Asignado a:</span> <b>{
                                unidad.nombreempleado || 
                                obtenerNombreEmpleado(unidad.empleadoId)
                              }</b>
                              {obtenerCargoEmpleado(unidad.empleadoId) && (
                                <span className="text-gray-600"> ({obtenerCargoEmpleado(unidad.empleadoId)})</span>
                              )}
                            </div>
                            {unidad.fecha_asignacion && (
                              <div className="text-xs text-gray-600">
                                <span className="font-semibold">Fecha asignación:</span> {formatearFecha(unidad.fecha_asignacion)}
                              </div>
                            )}
                          </div>
                          {unidad.estado !== "terminado" && (
                            <button
                              type="button"
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 w-fit"
                              onClick={() => handleTerminarAsignacion(item.id, unidad.empleadoId!, unidad.unidad_index)}
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
                              const key = `${item.id}-${unidad.unidad_index}`;
                              
                              if (empleadoId) {
                                // Actualizar solo esta unidad específica
                                setAsignacionesPendientes(prev => ({
                                  ...prev,
                                  [key]: [{ unidad_index: unidad.unidad_index, empleadoId }]
                                }));
                              } else {
                                // Si se resetea a vacío, limpiar el estado para esta unidad
                                setAsignacionesPendientes(prev => {
                                  const nuevo = { ...prev };
                                  delete nuevo[key];
                                  return nuevo;
                                });
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

// Memoizar el componente para evitar re-renderizados innecesarios
export default React.memo(AsignarArticulos);
