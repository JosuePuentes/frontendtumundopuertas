import React, { useState, useEffect } from "react";
import { useEmpleadosPorModulo } from "@/hooks/useEmpleadosPorModulo";
import { useEstadoItems } from "@/hooks/useEstadoItems";
import ImageDisplay from "@/upfile/ImageDisplay"; // Added this import
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

  // Función para obtener el tipo de empleado según el estado real del item (INDEPENDIENTE)
  const obtenerTipoEmpleadoPorItem = (itemId: string): string[] => {
    const estadoItem = obtenerEstadoItem(itemId); // Usar el estado real del item
    
    console.log(`🎯 Obteniendo tipo empleado para item ${itemId}, estado INDIVIDUAL: ${estadoItem}`);
    
    switch (estadoItem) {
      case "1":
      case "herreria":
        return ["herreria", "ayudante"];
      case "2":
      case "masillar":
        return ["masillar", "pintar", "ayudante"];
      case "3":
      case "preparar":
        return ["mantenimiento", "ayudante"];
      case "4":
      case "facturar":
        return ["facturacion", "ayudante"];
      default:
        return ["herreria", "ayudante"]; // Por defecto estado 1 (herreria)
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

  // Debug: Log de empleados cuando cambien
  useEffect(() => {
    console.log('🔍 DEBUG EMPLEADOS:', {
      empleadosLength: empleados.length,
      empleados: empleados.slice(0, 3), // Primeros 3 empleados
      tipoEmpleado: tipoEmpleado,
      pedidoId: pedidoId
    });
  }, [empleados, tipoEmpleado, pedidoId]);

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
    
    // Determinar el nuevo estado general del pedido
    let nuevoEstadoGeneral = estado_general;
    if (!esCambio && estado_general === "pendiente") {
      // Si es la primera asignación y está pendiente, cambiar a orden1
      nuevoEstadoGeneral = "orden1";
      console.log("🔄 Cambiando estado del pedido de 'pendiente' a 'orden1'");
    }
    
    const consulta: any = {
      pedido_id: pedidoId,
      asignaciones: asignacionPorItem,
      numero_orden: numeroOrden,
      estado: "en_proceso",
      estado_general: nuevoEstadoGeneral, // Usar el nuevo estado
    };
    
    if (!esCambio) {
      consulta.tipo_fecha = "inicio";
    } else {
      consulta.tipo_fecha = "";
    }
    
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      console.log('🔄 Asignando', Object.keys(asignaciones).length, 'items al pedido', pedidoId);
      
      const res = await fetch(`${apiUrl}/pedidos/subestados/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consulta),
      });
      
      setMessage("Asignación enviada correctamente");
      await res.json();
      console.log("✅ Asignación exitosa");
      
      // Si el estado cambió, mostrar mensaje adicional
      if (nuevoEstadoGeneral !== estado_general) {
        setMessage(`Asignación enviada correctamente. Estado cambiado a ${nuevoEstadoGeneral}`);
      }
      
    } catch (err) {
      setMessage("Error al enviar la asignación");
      console.error("❌ Error al enviar asignación:", err);
    } finally {
      setLoading(false);
    }
  };

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
                              empleado?.nombre || empleadoId
                      );
                    }}
                  >
                          <option value="" className="text-gray-500">
                            👤 Seleccionar empleado...
                          </option>
                          {(() => {
                            console.log('🔍 DEBUG FILTRO INICIO:', {
                              itemId: item.id,
                              empleadosDisponibles: (empleadosPorItem[item.id] || empleados).length,
                              tipoEmpleado: obtenerTipoEmpleadoPorItem(item.id),
                              empleadosGenerales: empleados.length,
                              primerEmpleado: empleados[0] ? {
                                identificador: empleados[0].identificador,
                                nombre: empleados[0].nombre,
                                nombreCompleto: empleados[0].nombreCompleto,
                                cargo: empleados[0].cargo,
                                permisos: empleados[0].permisos,
                                activo: empleados[0].activo,
                                todasLasPropiedades: Object.keys(empleados[0]),
                                estructuraCompleta: empleados[0]
                              } : null,
                              todosLosEmpleados: empleados.slice(0, 3).map(emp => ({
                                identificador: emp.identificador,
                                nombre: emp.nombre,
                                nombreCompleto: emp.nombreCompleto,
                                cargo: emp.cargo,
                                permisos: emp.permisos,
                                propiedades: Object.keys(emp)
                              }))
                            });

                            const empleadosFiltrados = (empleadosPorItem[item.id] || empleados)
                              .filter((e) => {
                                console.log('🔍 DEBUG EMPLEADO INDIVIDUAL:', {
                                  identificador: e?.identificador,
                                  nombre: e?.nombre,
                                  nombreCompleto: e?.nombreCompleto,
                                  permisos: e?.permisos,
                                  tienePermisos: Array.isArray(e?.permisos),
                                  tipoEmpleado: obtenerTipoEmpleadoPorItem(item.id)
                                });

                                // Verificar que el empleado tenga datos válidos
                                if (!e || !e.identificador || (!e.nombre && !e.nombreCompleto)) {
                                  console.log('❌ Empleado inválido:', e);
                                  return false;
                                }
                                
                                // Si hay tipoEmpleado definido, filtrar por permisos o cargo
                                const tipoEmpleadoItem = obtenerTipoEmpleadoPorItem(item.id);
                                if (tipoEmpleadoItem && Array.isArray(tipoEmpleadoItem) && tipoEmpleadoItem.length > 0) {
                                  let cumpleFiltro = false;
                                  
                                  // Intentar filtrar por permisos primero
                                  if (Array.isArray(e.permisos) && e.permisos.length > 0) {
                                    cumpleFiltro = tipoEmpleadoItem.some((tipo) => 
                                      e.permisos.includes(tipo)
                                    );
                                    console.log('🎯 FILTRO POR PERMISOS:', {
                                      empleado: e.identificador,
                                      permisos: e.permisos,
                                      tipoEmpleado: tipoEmpleadoItem,
                                      cumpleFiltro: cumpleFiltro
                                    });
                                  }
                                  // Si no tiene permisos, intentar filtrar por cargo
                                  else if (e.cargo) {
                                    const cargo = e.cargo.toLowerCase();
                                    cumpleFiltro = tipoEmpleadoItem.some((tipo) => {
                                      const tipoNormalizado = tipo.toLowerCase();
                                      
                                      // Mapear tipos a variaciones comunes
                                      const variacionesTipo: Record<string, string[]> = {
                                        'herreria': ['herrero', 'herreria'],
                                        'masillar': ['masillador', 'masillar'],
                                        'pintar': ['pintor', 'pintar'],
                                        'mantenimiento': ['manillar', 'mantenimiento', 'preparador'],
                                        'facturacion': ['facturador', 'facturacion', 'administrativo'],
                                        'ayudante': ['ayudante']
                                      };
                                      
                                      // Verificar coincidencia directa
                                      if (cargo.includes(tipoNormalizado)) {
                                        return true;
                                      }
                                      
                                      // Verificar variaciones del tipo
                                      const variaciones = variacionesTipo[tipoNormalizado] || [];
                                      return variaciones.some(variacion => 
                                        cargo.includes(variacion)
                                      );
                                    });
                                    console.log('🎯 FILTRO POR CARGO:', {
                                      empleado: e.identificador,
                                      cargo: e.cargo,
                                      tipoEmpleado: tipoEmpleadoItem,
                                      cumpleFiltro: cumpleFiltro
                                    });
                                  }
                                  // Si no tiene ni permisos ni cargo, mostrar todos
                                  else {
                                    console.log('⚠️ Empleado sin permisos ni cargo, mostrando:', e.identificador);
                                    cumpleFiltro = true;
                                  }
                                  
                                  return cumpleFiltro;
                                }
                                
                                // Si no hay filtro específico, mostrar todos los empleados válidos
                                console.log('✅ Sin filtro específico, mostrando empleado:', e.identificador);
                                return true;
                              });
                            
                            console.log('🎯 Debug select renderizado:', {
                              itemId: item.id,
                              empleadosDisponibles: empleadosFiltrados.length,
                              empleadosPorItem: empleadosPorItem[item.id]?.length || 0,
                              empleadosGenerales: empleados.length,
                              tipoEmpleado: tipoEmpleado
                            });
                            
                            return empleadosFiltrados.map((empleado, index) => {
                              if (index === 0) {
                                console.log('🎯 Debug mapeo empleados:', {
                                  totalEmpleadosFiltrados: empleadosFiltrados.length,
                                  primerEmpleado: empleado.identificador,
                                  nombre: empleado.nombre,
                                  nombreCompleto: empleado.nombreCompleto,
                                  permisos: empleado.permisos
                                });
                              }
                              
                              return (
                        <option
                          key={empleado.identificador}
                          value={empleado.identificador}
                                  className="py-2"
                        >
                                  {empleado.nombreCompleto || empleado.nombre || empleado.identificador}
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
                            <div>Tipo empleado: {Array.isArray(obtenerTipoEmpleadoPorItem(item.id)) ? obtenerTipoEmpleadoPorItem(item.id).join(', ') : obtenerTipoEmpleadoPorItem(item.id)}</div>
                            <div>Estado real del item: {obtenerEstadoItem(item.id)}</div>
                            <div>Estado del pedido: {estado_general}</div>
                            <div>Item ID: {item.id}</div>
                            <div className="mt-2">
                              <strong>Primeros 3 empleados:</strong>
                              {empleados.slice(0, 3).map((emp, idx) => (
                                <div key={idx} className="ml-2">
                                  {emp?.identificador || 'Sin ID'}: {emp?.nombreCompleto || emp?.nombre || 'Sin nombre'}
                                </div>
                              ))}
                            </div>
                            <div className="mt-2">
                              <strong>Empleados filtrados:</strong>
                              {(empleadosPorItem[item.id] || empleados)
                                .filter((e) => {
                                  if (!e || !e.identificador || !e.nombre) return false;
                                  const tipoEmpleadoItem = obtenerTipoEmpleadoPorItem(item.id);
                                  console.log(`🔍 Filtrando empleado ${e.identificador} (${e.nombre}) para tipos:`, tipoEmpleadoItem);
                                  
                                  if (tipoEmpleadoItem && Array.isArray(tipoEmpleadoItem) && tipoEmpleadoItem.length > 0) {
                                    const cargo = e.cargo || '';
                                    const nombre = e.nombre || '';
                                    
                                    // Función helper para normalizar texto
                                    const normalizarTexto = (texto: string): string => {
                                      return texto.toLowerCase()
                                        .replace(/[()]/g, '')
                                        .replace(/\s+/g, ' ')
                                        .trim();
                                    };
                                    
                                    // Función helper para extraer rol del nombre (texto entre paréntesis)
                                    const extraerRolDelNombre = (nombreCompleto: string): string => {
                                      const match = nombreCompleto.match(/\(([^)]+)\)/);
                                      return match ? match[1].toLowerCase().trim() : '';
                                    };
                                    
                                    const resultado = tipoEmpleadoItem.some((tipo) => {
                                      const cargoNormalizado = normalizarTexto(cargo);
                                      const nombreNormalizado = normalizarTexto(nombre);
                                      const tipoNormalizado = normalizarTexto(tipo);
                                      const rolExtraido = extraerRolDelNombre(nombre);
                                      
                                      // Mapear tipos a variaciones comunes
                                      const variacionesTipo: Record<string, string[]> = {
                                        'herreria': ['herrero', 'herreria'],
                                        'masillar': ['masillador', 'masillar'],
                                        'pintar': ['pintor', 'pintar'],
                                        'mantenimiento': ['manillar', 'mantenimiento', 'preparador'],
                                        'facturacion': ['facturador', 'facturacion', 'administrativo'],
                                        'ayudante': ['ayudante']
                                      };
                                      
                                      // Verificar cargo
                                      if (cargoNormalizado.includes(tipoNormalizado)) {
                                        console.log(`✅ Coincidencia por cargo: ${cargoNormalizado} incluye ${tipoNormalizado}`);
                                        return true;
                                      }
                                      
                                      // Verificar nombre con coincidencia directa
                                      if (nombreNormalizado.includes(tipoNormalizado)) {
                                        console.log(`✅ Coincidencia por nombre: ${nombreNormalizado} incluye ${tipoNormalizado}`);
                                        return true;
                                      }
                                      
                                      // Verificar rol extraído del nombre
                                      if (rolExtraido.includes(tipoNormalizado)) {
                                        console.log(`✅ Coincidencia por rol extraído: ${rolExtraido} incluye ${tipoNormalizado}`);
                                        return true;
                                      }
                                      
                                      // Verificar variaciones del tipo
                                      const variaciones = variacionesTipo[tipoNormalizado] || [];
                                      const variacionMatch = variaciones.some(variacion => 
                                        nombreNormalizado.includes(normalizarTexto(variacion)) ||
                                        rolExtraido.includes(normalizarTexto(variacion))
                                      );
                                      
                                      if (variacionMatch) {
                                        console.log(`✅ Coincidencia por variación: ${nombreNormalizado} o ${rolExtraido} incluye variación de ${tipoNormalizado}`);
                                      }
                                      
                                      return variacionMatch;
                                    });
                                    
                                    console.log(`🎯 Resultado final para ${e.identificador}: ${resultado}`);
                                    return resultado;
                                  }
                                  return true;
                                })
                                .slice(0, 3)
                                .map((emp, idx) => (
                                  <div key={idx} className="ml-2">
                                    {emp?.identificador || 'Sin ID'}: {emp?.cargo || 'Sin cargo'} - {emp?.nombre || 'Sin nombre'}
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