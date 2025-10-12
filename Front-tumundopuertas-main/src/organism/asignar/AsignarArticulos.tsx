import React, { useState, useEffect } from "react";
import { useEmpleadosPorModulo } from "@/hooks/useEmpleadosPorModulo";
import ImageDisplay from "@/upfile/ImageDisplay"; // Added this import
import BarraProgresoItem from "@/components/ui/BarraProgresoItem";

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
  identificador: string;
  nombreCompleto?: string;
  cargo?: string;
  permisos?: string[];
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

const AsignarArticulos: React.FC<AsignarArticulosProps> = ({
  items,
  empleados,
  pedidoId,
  numeroOrden,
  estado_general,
  tipoEmpleado,
}) => {
  const [asignaciones, setAsignaciones] = useState<
    Record<string, AsignacionArticulo>
  >({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [asignadosPrevios, setAsignadosPrevios] = useState<Record<string, AsignacionArticulo>>({});
  const [showCambio, setShowCambio] = useState<Record<string, boolean>>({});
  const [empleadosPorItem, setEmpleadosPorItem] = useState<Record<string, any[]>>({});

  // Hook para obtener empleados por módulo
  const { obtenerEmpleadosPorModulo, loading: loadingEmpleados } = useEmpleadosPorModulo();

  // Función helper para determinar módulo actual según el orden
  const determinarModuloActual = (orden: string): string => {
    switch(orden) {
      case "1": return "herreria";
      case "2": return "masillar";
      case "3": return "preparar";
      case "4": return "facturar";
      default: return "herreria";
    }
  };

  // Cargar empleados filtrados para cada item
  const cargarEmpleadosPorItem = async () => {
    const empleadosPorItemData: Record<string, any[]> = {};
    
    for (const item of items) {
      try {
        const empleadosFiltrados = await obtenerEmpleadosPorModulo(pedidoId, item.id);
        if (empleadosFiltrados && empleadosFiltrados.length > 0) {
          empleadosPorItemData[item.id] = empleadosFiltrados;
          console.log(`✅ Empleados filtrados para item ${item.id}:`, empleadosFiltrados.length);
        } else {
          // Si no hay empleados filtrados, usar empleados generales
          empleadosPorItemData[item.id] = empleados;
          console.log(`⚠️ Sin empleados filtrados para item ${item.id}, usando empleados generales`);
        }
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

  // Buscar asignaciones previas al montar
  React.useEffect(() => {
    const fetchPedido = async () => {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
        const res = await fetch(`${apiUrl}/pedidos/id/${pedidoId}/`);
        if (!res.ok) return;
        const pedido = await res.json();
        // Buscar subestado actual
        const sub = Array.isArray(pedido.seguimiento)
          ? pedido.seguimiento.find((s: any) => s.estado === "en_proceso" && String(s.orden) === numeroOrden)
          : null;
        if (sub && Array.isArray(sub.asignaciones_articulos)) {
          // Mapear asignaciones previas por key
          const prev: Record<string, AsignacionArticulo> = {};
          sub.asignaciones_articulos.forEach((a: AsignacionArticulo) => {
            prev[a.key] = a;
          });
          setAsignadosPrevios(prev);
        }
      } catch {}
    };
    fetchPedido();
  }, [pedidoId, numeroOrden]);

  // Cargar empleados filtrados cuando cambien los items
  useEffect(() => {
    if (items.length > 0) {
      cargarEmpleadosPorItem();
    }
  }, [items, pedidoId]);

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

  const handleEmpleadoChange = (
    item: PedidoItem,
    idx: number,
    empleadoId: string,
    nombreempleado: string
  ) => {
    setAsignaciones((prev) => ({
      ...prev,
      [`${item.id}-${idx}`]: {
        key: `${item.id}-${idx}`,
        empleadoId,
        nombreempleado,
        fecha_inicio: new Date().toISOString(),
        estado: "en_proceso",
        descripcionitem: item.descripcion,
        costoproduccion: String(item.costoProduccion),
      },
    }));
    setShowCambio((prev) => ({ ...prev, [`${item.id}-${idx}`]: false }));
  };

  const handleAsignar = async () => {
    setLoading(true);
    setMessage("");
    const asignacionPorItem = items.map((item, idx) => ({
      itemId: item.id,
      ...asignaciones[`${item.id}-${idx}`],
    }));
    // Detectar si es cambio (ya existe asignación previa)
    const esCambio = Object.keys(asignadosPrevios).length > 0;
    const consulta: any = {
      pedido_id: pedidoId,
      asignaciones: asignacionPorItem,
      numero_orden: numeroOrden,
      estado: "en_proceso",
      estado_general: estado_general,
    };
    if (!esCambio) {
      consulta.tipo_fecha = "inicio";
    } else {
      consulta.tipo_fecha = "";
    }
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const res = await fetch(`${apiUrl}/pedidos/subestados/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consulta),
      });
      console.log("Respuesta de /pruebaapi1:", res);
      setMessage("Asignación enviada correctamente");
      const result = await res.json();
      console.log("Respuesta de /pruebaapi1:", result);
    } catch (err) {
      setMessage("Error al enviar la asignación");
      console.error("Error al enviar a /pruebaapi1:", err);
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
          const asignacion = asignaciones[key] || {};
          const asignadoPrevio = asignadosPrevios[key];
          const cambioActivo = showCambio[key];
          return (
            <li key={key} className="flex flex-col gap-2 border rounded p-3">
              <span className="font-medium">{item.nombre}</span>
              
              {/* Barra de progreso del item */}
              <BarraProgresoItem 
                pedidoId={pedidoId}
                itemId={item.id}
                moduloActual={determinarModuloActual(numeroOrden)}
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
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 items-center">
                  {loadingEmpleados ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Cargando empleados...
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="relative">
                        <select
                          className="w-full min-w-[200px] border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-700 font-medium shadow-sm hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
                          value={asignacion.empleadoId || ""}
                          onChange={(e) => {
                            const empleadoId = e.target.value;
                            const empleadosDisponibles = empleadosPorItem[item.id] || empleados;
                            const empleado = empleadosDisponibles.find(
                              (emp) => emp.identificador === empleadoId
                            );
                            handleEmpleadoChange(
                              item,
                              idx,
                              empleadoId,
                              empleado?.nombreCompleto || empleadoId
                            );
                          }}
                        >
                          <option value="" className="text-gray-500">
                            👤 Seleccionar empleado...
                          </option>
                          {(() => {
                            const empleadosFiltrados = (empleadosPorItem[item.id] || empleados)
                              .filter((e) => {
                                // Verificar que el empleado tenga datos válidos
                                if (!e || !e.identificador || !e.nombreCompleto) return false;
                                
                                // Si hay tipoEmpleado definido, filtrar por cargo
                                if (tipoEmpleado && Array.isArray(tipoEmpleado) && tipoEmpleado.length > 0) {
                                  const cargo = e.cargo || '';
                                  return tipoEmpleado.some((tipo) => 
                                    cargo.toLowerCase().includes(tipo.toLowerCase()) ||
                                    tipo.toLowerCase().includes(cargo.toLowerCase())
                                  );
                                }
                                
                                // Si no hay filtro específico, mostrar todos los empleados válidos
                                return true;
                              });
                            
                            console.log('🎯 Debug select renderizado:', {
                              itemId: item.id,
                              empleadosDisponibles: empleadosFiltrados.length,
                              empleadosPorItem: empleadosPorItem[item.id]?.length || 0,
                              empleadosGenerales: empleados.length
                            });
                            
                            return empleadosFiltrados.map((empleado, index) => {
                              if (index === 0) {
                                console.log('🎯 Debug mapeo empleados:', {
                                  totalEmpleadosFiltrados: empleadosFiltrados.length,
                                  primerEmpleado: empleado.identificador,
                                  nombreCompleto: empleado.nombreCompleto
                                });
                              }
                              
                              return (
                                <option
                                  key={empleado.identificador}
                                  value={empleado.identificador}
                                  className="py-2"
                                >
                                  {empleado.nombreCompleto || empleado.identificador}
                                </option>
                              );
                            });
                          })()}
                        </select>
                        
                        {/* Flecha del dropdown */}
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Información de empleados disponibles */}
                      <div className="text-xs">
                        {empleadosPorItem[item.id] && empleadosPorItem[item.id].length > 0 ? (
                          <span className="text-green-600 font-medium">
                            ✅ {empleadosPorItem[item.id].length} empleados filtrados por módulo
                          </span>
                        ) : (
                          <span className="text-orange-600 font-medium">
                            ⚠️ {empleados.length} empleados generales (filtrado no disponible)
                          </span>
                        )}
                      </div>
                      
                      {/* Debug info */}
                      <div className="text-xs text-gray-500">
                        <details>
                          <summary className="cursor-pointer">🔍 Debug info</summary>
                          <div className="mt-1 p-2 bg-gray-100 rounded text-xs">
                            <div>Empleados totales: {empleados.length}</div>
                            <div>Empleados por item: {empleadosPorItem[item.id]?.length || 0}</div>
                            <div>Tipo empleado: {Array.isArray(tipoEmpleado) ? tipoEmpleado.join(', ') : tipoEmpleado}</div>
                            <div>Item ID: {item.id}</div>
                            <div className="mt-2">
                              <strong>Primeros 3 empleados:</strong>
                              {empleados.slice(0, 3).map((emp, idx) => (
                                <div key={idx} className="ml-2">
                                  {emp?.identificador || 'Sin ID'}: {emp?.cargo || 'Sin cargo'}
                                </div>
                              ))}
                            </div>
                            <div className="mt-2">
                              <strong>Empleados filtrados:</strong>
                              {(empleadosPorItem[item.id] || empleados)
                                .filter((e) => {
                                  if (!e || !e.identificador || !e.nombreCompleto) return false;
                                  if (tipoEmpleado && Array.isArray(tipoEmpleado) && tipoEmpleado.length > 0) {
                                    const cargo = e.cargo || '';
                                    return tipoEmpleado.some((tipo) => 
                                      cargo.toLowerCase().includes(tipo.toLowerCase()) ||
                                      tipo.toLowerCase().includes(cargo.toLowerCase())
                                    );
                                  }
                                  return true;
                                })
                                .slice(0, 3)
                                .map((emp, idx) => (
                                  <div key={idx} className="ml-2">
                                    {emp?.identificador || 'Sin ID'}: {emp?.cargo || 'Sin cargo'}
                                  </div>
                                ))}
                            </div>
                          </div>
                        </details>
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
    </div>
  );
};

export default AsignarArticulos;