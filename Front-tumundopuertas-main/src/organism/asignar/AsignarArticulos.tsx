import React, { useState, useEffect } from "react";
import { useEmpleadosPorModulo } from "@/hooks/useEmpleadosPorModulo";
// import { useItemsDisponibles } from "@/hooks/useItemsDisponibles"; // TODO: Usar cuando backend esté listo
import { useEstadoItems } from "@/hooks/useEstadoItems";
import ImageDisplay from "@/upfile/ImageDisplay"; // Added this import
import BarraProgresoItem from "@/components/ui/BarraProgresoItem";
import GestorEmpleadosAutomatico from "@/components/GestorEmpleadosAutomatico";
// import { getApiUrl } from "@/lib/api"; // Removido - no se usa

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
  imagenes?: string[]; // Added this line
}

interface Empleado {
  id?: string;
  identificador: string;
  nombre?: string;
  nombreCompleto?: string;
  cargo?: string | null;
  permisos?: string[];
  pin?: string;
  activo?: boolean;
}

interface AsignacionArticulo {
  key: string;
  empleadoId: string;
  nombreempleado: string;
  fecha_inicio: string;
  estado: string;
  descripcionitem: string;
  costoproduccion: string;
}

interface AsignarArticulosProps {
  items: PedidoItem[];
  empleados: Empleado[];
  pedidoId: string;
  numeroOrden: string;
  estado_general: string;
  tipoEmpleado: string[];
}

// Función debounce para evitar múltiples clicks
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const AsignarArticulos: React.FC<AsignarArticulosProps> = ({
  items,
  empleados,
  pedidoId,
  numeroOrden,
  estado_general: _estado_general, // Prefijo con _ para indicar que no se usa
  tipoEmpleado,
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [asignadosPrevios, setAsignadosPrevios] = useState<Record<string, AsignacionArticulo>>({});
  const [showCambio, setShowCambio] = useState<Record<string, boolean>>({});
  const [empleadosPorItem, setEmpleadosPorItem] = useState<Record<string, any[]>>({});
  // NUEVO: filas de asignación por item (empleado + cantidad)
  const [asignacionesPorItem, setAsignacionesPorItem] = useState<Record<string, Array<{ empleadoId: string; cantidad: number }>>>({});


  // Hook para obtener empleados por módulo
  const { loading: loadingEmpleados } = useEmpleadosPorModulo();
  // const { asignarItemSiguienteModulo } = useItemsDisponibles(); // TODO: Usar cuando backend esté listo
  
  // Hook para manejar estados individuales de items
  const { obtenerEstadoItem, cargarEstadosItems } = useEstadoItems(pedidoId, items);
  
  // Escuchar cambios de estado usando evento personalizado
  useEffect(() => {
    const handleCambioEstado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const evento = customEvent.detail;
      console.log(`🔄 AsignarArticulos: Cambio de estado detectado:`, evento);
      
      // Verificar si el cambio es relevante para los items actuales
      const esRelevante = items.some(item => item.id === evento.itemId);
      
      if (esRelevante) {
        console.log(`🎯 Cambio relevante detectado, recargando datos...`);
        
        // Recargar estados de items
        await cargarEstadosItems();
        
        // Recargar empleados por item
        await cargarEmpleadosPorItem();
        
        console.log(`✅ AsignarArticulos: Datos actualizados después del cambio de estado`);
      }
    };

    // Suscribirse al evento personalizado
    window.addEventListener('cambioEstadoItem', handleCambioEstado);

    // Cleanup: remover el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('cambioEstadoItem', handleCambioEstado);
    };
  }, [items, cargarEstadosItems]);

  // Cargar empleados filtrados para cada item
  const cargarEmpleadosPorItem = async () => {
    const empleadosPorItemData: Record<string, any[]> = {};
    
    for (const item of items) {
      try {
        console.log(`🔍 Cargando empleados para item ${item.id} del pedido ${pedidoId}...`);
        
        // TEMPORAL: El endpoint no existe en el backend, usar fallback
        console.warn(`⚠️ Endpoint /pedidos/empleados-por-modulo/ no existe en el backend - usando empleados generales`);
        
        // Fallback: Usar empleados generales
        empleadosPorItemData[item.id] = empleados;
        console.log(`✅ ${empleados.length} empleados generales para item ${item.id}`);
        
      } catch (error) {
        console.error(`❌ Error al cargar empleados para item ${item.id}:`, error);
        // Fallback a empleados generales si hay error
        empleadosPorItemData[item.id] = empleados;
        console.log(`🔄 Usando empleados generales como fallback para item ${item.id}`);
      }
    }
    
    setEmpleadosPorItem(empleadosPorItemData);
    console.log('📋 Empleados cargados por item:', empleadosPorItemData);
  };

  // Función para obtener el tipo de empleado según el estado real del item (INDEPENDIENTE)
  const obtenerTipoEmpleadoPorItem = (itemId: string): string[] => {
    const estadoItem = obtenerEstadoItem(itemId); // Usar el estado real del item
    
    console.log(`🎯 Obteniendo tipo empleado para item ${itemId}, estado INDIVIDUAL: ${estadoItem}`);
    
    // NUEVA LÓGICA: Permitir saltar módulos según el estado del item
    switch (estadoItem) {
      case "1":
      case "herreria":
        // Si está en herrería, puede asignar herreros, masilladores, pintores, manilladores y ayudantes
        return ["herreria", "masillar", "pintar", "manillar", "mantenimiento", "ayudante"];
      case "2":
      case "masillar":
        // Si está en masillar, puede asignar masilladores, pintores, manilladores y ayudantes
        return ["masillar", "pintar", "manillar", "mantenimiento", "ayudante"];
      case "3":
      case "preparar":
        // Si está en preparar, puede asignar manilladores, mantenimiento y ayudantes
        return ["manillar", "mantenimiento", "facturacion", "ayudante"];
      case "4":
      case "facturar":
        // Si está en facturar, solo puede asignar facturación y ayudantes
        return ["facturacion", "ayudante"];
      default:
        // Por defecto, mostrar todos los empleados disponibles
        return ["herreria", "masillar", "pintar", "manillar", "mantenimiento", "facturacion", "ayudante"];
    }
  };

  // Buscar asignaciones previas al montar
  React.useEffect(() => {
    const fetchPedido = async () => {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
        const res = await fetch(`${apiUrl}/pedidos/id/${pedidoId}/`);
        if (!res.ok) return;
        const pedido = await res.json();
        
        // SOLUCIÓN: Buscar asignaciones en TODOS los subestados, no solo uno específico
        const prev: Record<string, AsignacionArticulo> = {};
        
        if (Array.isArray(pedido.seguimiento)) {
          pedido.seguimiento.forEach((s: any) => {
            if (s.asignaciones_articulos && Array.isArray(s.asignaciones_articulos)) {
              s.asignaciones_articulos.forEach((a: AsignacionArticulo) => {
                // Solo incluir asignaciones en proceso
                if (a.estado === "en_proceso") {
                  prev[a.key] = a;
                }
              });
            }
          });
        }
        
        console.log('🔍 Asignaciones previas encontradas:', Object.keys(prev).length);
        setAsignadosPrevios(prev);
      } catch (error) {
        console.error('❌ Error al cargar asignaciones previas:', error);
      }
    };
    fetchPedido();
  }, [pedidoId]); // Remover numeroOrden de las dependencias

  // Cargar empleados filtrados cuando cambien los items (SOLO UNA VEZ)
  useEffect(() => {
    if (items.length > 0) {
      cargarEmpleadosPorItem();
    }
  }, [items.length, pedidoId]); // Solo cuando cambie la cantidad de items o el pedidoId

  // Debug: Log de empleados cuando cambien (SOLO UNA VEZ)
  useEffect(() => {
    if (empleados.length > 0) {
      console.log('🔍 EMPLEADOS CARGADOS:', {
        empleadosLength: empleados.length,
        primerEmpleado: empleados[0]?.identificador,
        tipoEmpleado: tipoEmpleado
      });
    }
  }, [empleados.length]); // Solo cuando cambie la cantidad de empleados

  // Copia asignaciones previas al estado local si no existen
  React.useEffect(() => {
    if (Object.keys(asignadosPrevios).length > 0) {
      setAsignaciones((prev) => {
        const nuevo = { ...prev };
        Object.entries(asignadosPrevios).forEach(([key, asignacion]) => {
          if (!nuevo[key]) {
            nuevo[key] = { ...asignacion };
          }
        });
        return nuevo;
      });
    }
  }, [asignadosPrevios]);

  // Eliminado: lógica antigua de selección única por empleado

  const handleAsignarOriginal = async () => {
    console.log('🚀 INICIANDO ASIGNACIÓN...');
    // Verificar que hay filas con empleado y cantidad > 0 en asignacionesPorItem
    const hayFilasValidas = items.some((it) =>
      (asignacionesPorItem[it.id] || []).some((f) => f.empleadoId && Number(f.cantidad) > 0)
    );
    if (!hayFilasValidas) {
      setMessage("⚠️ Debes agregar al menos una fila con empleado y cantidad");
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    // NUEVO: enviar asignaciones por item (POST /pedidos/asignar)
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://crafteo.onrender.com").replace('http://', 'https://');
      const ordenNum = parseInt(numeroOrden) || 1;

      // Validar cantidades por item
      for (const item of items) {
        const filas = asignacionesPorItem[item.id] || [];
        if (filas.length === 0) continue;
        const suma = filas.reduce((acc, f) => acc + (Number(f.cantidad) || 0), 0);
        if (suma <= 0) {
          setMessage(`⚠️ Debes ingresar cantidades a asignar para ${item.nombre}`);
          setLoading(false);
          return;
        }
        if (suma > (item.cantidad || 0)) {
          setMessage(`⚠️ La suma (${suma}) excede la cantidad del item (${item.cantidad}) en ${item.nombre}`);
          setLoading(false);
          return;
        }
      }

      const resultados: any[] = [];
      for (const item of items) {
        const filas = (asignacionesPorItem[item.id] || []).filter(f => f.empleadoId && Number(f.cantidad) > 0);
        if (filas.length === 0) continue;

        const payload = {
          pedido_id: pedidoId,
          item_id: item.id,
          orden: ordenNum,
          asignaciones: filas.map(f => ({ empleado_id: f.empleadoId, cantidad: Number(f.cantidad) })),
          descripcionitem: item.descripcion,
          costoproduccion: item.costoProduccion
        };

        console.log('📤 Enviando asignación múltiple:', payload);
        const res = await fetch(`${apiUrl}/pedidos/asignar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Error ${res.status}: ${t}`);
        }
        resultados.push(await res.json());
      }

      setMessage(`✅ Asignaciones enviadas correctamente`);
      
      // Recargar datos después de la asignación
      await cargarEstadosItems();
      await cargarEmpleadosPorItem();
      
    } catch (err: any) {
      console.error("❌ Error al enviar asignación:", err);
      setMessage(`❌ Error al enviar la asignación: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función debounced para evitar múltiples clicks (reducido a 300ms)
  const handleAsignar = debounce(handleAsignarOriginal, 300);

  // Función para manejar la terminación de asignaciones
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
      
      // Actualizar los estados de los items después de terminar la asignación
      await cargarEstadosItems();
      
      // Recargar empleados por item para reflejar el nuevo estado
      await cargarEmpleadosPorItem();
      
      setMessage("Asignación terminada exitosamente. El artículo ha avanzado al siguiente módulo.");
      
    } catch (err) {
      setMessage("Error al terminar la asignación");
      console.error("❌ Error al terminar asignación:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">Asignar empleados por artículo:</h4>
      <ul className="space-y-4">
        {items.map((item, idx) => {
          const key = `${item.id}-${idx}`;
          const asignadoPrevio = asignadosPrevios[key];
          const cambioActivo = showCambio[key];
          
          return (
            <li key={key} className="flex flex-col gap-2 border rounded p-3">
              <span className="font-medium">{item.nombre}</span>
              
              {/* Barra de progreso del item */}
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
              {asignadoPrevio && !cambioActivo ? (
                <div className="flex flex-col gap-2">
                  <span className="text-blue-700 text-sm font-semibold">
                    Ya asignado a: {asignadoPrevio.nombreempleado}
                  </span>
                  <div className="flex flex-row gap-4 w-full justify-center p-4">

                  <button
                    type="button"
                    className="bg-yellow-500 text-white px-2 py-1 rounded shadow hover:bg-yellow-600 w-fit"
                    onClick={() => setShowCambio((prev) => ({ ...prev, [key]: true }))}
                  >
                    Cambiar asignación
                  </button>
                  
                  {/* Botón para terminar asignación */}
                  <button
                    type="button"
                    className="bg-green-600 text-white px-2 py-1 rounded shadow hover:bg-green-700 w-fit"
                    onClick={() => handleTerminarAsignacion(item.id, asignadoPrevio.empleadoId)}
                    disabled={loading}
                  >
                    {loading ? "Terminando..." : "Terminar asignación"}
                  </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 items-start">
                  {loadingEmpleados ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Cargando empleados...
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="border rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Asignaciones parciales</span>
                          <button
                            type="button"
                            className="text-sm px-2 py-1 bg-blue-600 text-white rounded"
                            onClick={() => {
                              setAsignacionesPorItem(prev => {
                                const filas = prev[item.id] ? [...prev[item.id]] : [];
                                filas.push({ empleadoId: "", cantidad: 1 });
                                return { ...prev, [item.id]: filas };
                              });
                            }}
                          >
                            + Agregar fila
                          </button>
                        </div>
                        {(asignacionesPorItem[item.id] || []).map((fila, fidx) => {
                          const listaEmpleadosDisponibles = (empleadosPorItem[item.id] && empleadosPorItem[item.id].length > 0) ? empleadosPorItem[item.id] : empleados;
                          const empleadosValidos = listaEmpleadosDisponibles.filter(e => e && e.identificador && (e.nombre || e.nombreCompleto));
                          return (
                            <div key={`${item.id}-fila-${fidx}`} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center mb-2">
                              <div className="md:col-span-7">
                  <select
                                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 bg-white"
                                  value={fila.empleadoId}
                    onChange={(e) => {
                                    const value = e.target.value;
                                    setAsignacionesPorItem(prev => {
                                      const filas = [...(prev[item.id] || [])];
                                      filas[fidx] = { ...filas[fidx], empleadoId: value };
                                      return { ...prev, [item.id]: filas };
                                    });
                                  }}
                                >
                                  <option value="">👤 Seleccionar empleado...</option>
                                  {empleadosValidos.map((emp) => (
                                    <option key={emp.identificador} value={emp.identificador}>
                                      {emp.nombreCompleto || emp.nombre || emp.identificador}
                          </option>
                                  ))}
                                </select>
                              </div>
                              <div className="md:col-span-4">
                                <input
                                  type="number"
                                  min={1}
                                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2"
                                  value={fila.cantidad}
                                  onChange={(e) => {
                                    const value = Number(e.target.value) || 0;
                                    setAsignacionesPorItem(prev => {
                                      const filas = [...(prev[item.id] || [])];
                                      filas[fidx] = { ...filas[fidx], cantidad: value };
                                      return { ...prev, [item.id]: filas };
                                    });
                                  }}
                                />
                              </div>
                              <div className="md:col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  className="px-2 py-1 text-sm bg-red-500 text-white rounded"
                                  onClick={() => {
                                    setAsignacionesPorItem(prev => {
                                      const filas = [...(prev[item.id] || [])];
                                      filas.splice(fidx, 1);
                                      return { ...prev, [item.id]: filas };
                                    });
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <div className="text-xs text-gray-600 mt-2">
                          Cantidad total del item: <b>{item.cantidad}</b>
                        </div>
                      </div>
                      
                      <div className="text-xs">
                        {empleadosPorItem[item.id] && empleadosPorItem[item.id].length > 0 ? (
                          <span className="text-green-600 font-medium">✅ {empleadosPorItem[item.id].length} empleados filtrados por módulo</span>
                        ) : (
                          <span className="text-orange-600 font-medium">⚠️ {empleados.length} empleados generales (filtrado no disponible)</span>
                        )}
                        <div className="mt-1 text-blue-600 font-medium">📍 Módulo actual: {obtenerEstadoItem(item.id).toUpperCase()}</div>
                        <div className="mt-1 text-gray-600">🎯 Empleados disponibles: {obtenerTipoEmpleadoPorItem(item.id).join(", ")}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 mt-4"
        onClick={handleAsignar}
        disabled={loading}
      >
        Asignar empleados
      </button>
      {message && (
        <div className="mt-2 text-green-600 font-semibold">{message}</div>
      )}
      
      {/* Gestor Automático de Empleados */}
      <GestorEmpleadosAutomatico 
        empleados={empleados}
        onEmpleadosChange={(nuevosEmpleados) => {
          // Aquí se pueden aplicar cambios automáticamente
          console.log('🔄 Empleados actualizados automáticamente:', nuevosEmpleados);
        }}
      />
    </div>
  );
};

export default AsignarArticulos;