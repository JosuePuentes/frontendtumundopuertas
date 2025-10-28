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
  const [asignaciones, setAsignaciones] = useState<
    Record<string, AsignacionArticulo>
  >({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [asignadosPrevios, setAsignadosPrevios] = useState<Record<string, AsignacionArticulo>>({});
  const [showCambio, setShowCambio] = useState<Record<string, boolean>>({});
  const [empleadosPorItem, setEmpleadosPorItem] = useState<Record<string, any[]>>({});

  // Estado para items ya asignados localmente
  const [itemsAsignadosLocalmente, setItemsAsignadosLocalmente] = useState<Record<string, {empleado_nombre: string, fecha_asignacion: string}>>({});

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

  const handleEmpleadoChange = (
    item: PedidoItem,
    idx: number,
    empleadoId: string,
    nombreempleado: string
  ) => {
    // VALIDACIÓN: Verificar que item e idx sean válidos
    if (!item || !item.id || idx === undefined || idx === null) {
      console.error('❌ ERROR: handleEmpleadoChange recibió datos inválidos:', {
        item: item,
        idx: idx,
        empleadoId: empleadoId,
        nombreempleado: nombreempleado
      });
      return;
    }
    
    const key = `${item.id}-${idx}`;
    console.log('✅ handleEmpleadoChange - Creando asignación:', {
      key: key,
      itemId: item.id,
      idx: idx,
      empleadoId: empleadoId,
      nombreempleado: nombreempleado
    });
    
    setAsignaciones((prev) => ({
      ...prev,
      [key]: {
        key: key,
        empleadoId,
        nombreempleado,
        fecha_inicio: new Date().toISOString(),
        estado: "en_proceso",
        descripcionitem: item.descripcion,
        costoproduccion: String(item.costoProduccion),
      },
    }));
    setShowCambio((prev) => ({ ...prev, [key]: false }));
  };

  const handleAsignarOriginal = async () => {
    console.log('🚀 INICIANDO ASIGNACIÓN...');
    console.log('📋 Items:', items.length);
    console.log('📋 Asignaciones actuales:', Object.keys(asignaciones).length);
    console.log('📋 Asignaciones previas:', Object.keys(asignadosPrevios).length);
    console.log('📋 Estado de asignaciones:', asignaciones);
    
    // Verificar que hay asignaciones para enviar
    const asignacionesValidas = Object.entries(asignaciones).filter(([key, asignacion]) => {
      const isValid = asignacion.empleadoId && 
                     asignacion.empleadoId.trim() !== "" && 
                     key !== "undefined" && 
                     !key.includes("undefined");
      
      if (!isValid) {
        console.warn('⚠️ FILTRANDO asignación inválida:', { key, asignacion });
      }
      
      return isValid;
    });
    
    console.log('✅ Asignaciones válidas:', asignacionesValidas.length);
    console.log('📋 Asignaciones válidas detalle:', asignacionesValidas);
    
    if (asignacionesValidas.length === 0) {
      console.log('⚠️ NO HAY ASIGNACIONES VÁLIDAS - Mostrando mensaje de error');
      setMessage("⚠️ Debes seleccionar al menos un empleado antes de asignar");
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    // CORREGIDO: Enviar cada asignación individualmente con el formato EXACTO requerido
    const asignacionesParaEnviar = asignacionesValidas.map(([key, asignacion]) => {
      const [itemId] = key.split('-');
      
      // Encontrar el item completo para obtener sus propiedades
      const itemCompleto = items.find(item => item.id === itemId);
      
      console.log('🔍 DEBUG FRONTEND - Datos antes de enviar:');
      console.log('itemId:', itemId);
      console.log('itemCompleto:', itemCompleto);
      console.log('asignacion:', asignacion);
      
      // Determinar el módulo basado en el estado del item
      const estadoItem = obtenerEstadoItem(itemId);
      let modulo = "herreria"; // Por defecto
      
      // Mapeo del módulo según el estado del item
      const moduloMap: { [key: string]: string } = {
        "0": "herreria",  // Pendiente -> Herrería
        "1": "herreria",  // Herrería
        "2": "masillar",  // Masillar
        "3": "preparar",  // Preparar
        "4": "facturar"   // Facturar
      };
      
      modulo = moduloMap[estadoItem] || "herreria";
      
      console.log('Estado item:', estadoItem);
      console.log('Módulo mapeado:', modulo);
      
      // Buscar el nombre del empleado desde empleadosPorItem (más confiable)
      const empleadosDisponibles = empleadosPorItem[itemId] || empleados;
      console.log('🔍 DEBUG empleados disponibles:', empleadosDisponibles.length);
      console.log('🔍 DEBUG buscando empleado con ID:', asignacion.empleadoId);
      console.log('🔍 DEBUG empleados:', empleadosDisponibles.map(emp => ({ 
        _id: emp._id, 
        identificador: emp.identificador, 
        nombreCompleto: emp.nombreCompleto 
      })));
      
      // Buscar por _id o identificador según lo que venga en asignacion.empleadoId
      const empleado = empleadosDisponibles.find(emp => 
        emp._id === asignacion.empleadoId || emp.identificador === asignacion.empleadoId
      );
      console.log('🔍 DEBUG empleado encontrado:', empleado);
      
      const nombreEmpleado = empleado?.nombreCompleto || "Empleado asignado";
      console.log('🔍 DEBUG nombre empleado final:', nombreEmpleado);
      
      // FORMATO EXACTO requerido por el endpoint /pedidos/asignar-item/
      const datosParaEnviar = {
        pedido_id: pedidoId,                    // ✅ ID del pedido (string)
        item_id: itemCompleto?.id || itemId,    // ✅ ID del item específico (string)
        empleado_id: asignacion.empleadoId,     // ✅ ID del empleado (string)
        empleado_nombre: nombreEmpleado,        // ✅ Nombre del empleado (string)
        modulo: modulo                          // ✅ Módulo: "herreria", "masillar", "preparar"
      };
      
      console.log('📤 Datos que se enviarán (formato exacto):', datosParaEnviar);
      console.log('🚀 Deploy fix - Forzar actualización');
      console.log('🔄 Vercel deploy test - Build logs fix');
      
      // Verificar que ningún campo sea null/undefined/vacío
      if (!datosParaEnviar.pedido_id || !datosParaEnviar.item_id || 
          !datosParaEnviar.empleado_id || !datosParaEnviar.modulo) {
        console.error('❌ Faltan datos requeridos:', datosParaEnviar);
        console.error('❌ Verificar:');
        console.error('  - pedido_id:', datosParaEnviar.pedido_id);
        console.error('  - item_id:', datosParaEnviar.item_id);
        console.error('  - empleado_id:', datosParaEnviar.empleado_id);
        console.error('  - modulo:', datosParaEnviar.modulo);
        throw new Error(`Datos incompletos para asignación: ${JSON.stringify(datosParaEnviar)}`);
      }
      
      return datosParaEnviar;
    });
    
    console.log('📤 Datos a enviar (formato exacto requerido):', asignacionesParaEnviar);
    
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://crafteo.onrender.com").replace('http://', 'https://');
      console.log('🔄 Enviando asignaciones individuales a:', `${apiUrl}/pedidos/asignar-item/`);
      
      // Función para asignar usando el NUEVO endpoint /pedidos/asignar-item/
      const asignarItemConRetry = async (asignacion: any, maxRetries = 3) => {
        for (let intento = 0; intento < maxRetries; intento++) {
          try {
            console.log(`📤 Intento ${intento + 1}/${maxRetries} - Enviando asignación:`, asignacion);
            
            // Usar el NUEVO endpoint /pedidos/asignar-item/ que devuelve información completa
            const datosAsignacion = {
              pedido_id: asignacion.pedido_id,
              item_id: asignacion.item_id,
              empleado_id: asignacion.empleado_id,
              empleado_nombre: asignacion.empleado_nombre,
              modulo: asignacion.modulo
            };
            
            console.log('📤 Datos para asignación:', datosAsignacion);
            
            const res = await fetch(`${apiUrl}/pedidos/asignar-item/`, {
              method: "PUT",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('access_token')}`
              },
              body: JSON.stringify(datosAsignacion),
            });
            
            console.log('📡 Respuesta del servidor:', res.status, res.statusText);
            
            if (res.ok) {
              const result = await res.json();
              console.log('✅ Asignación exitosa:', result);
              
              // NUEVA: Usar la información completa que devuelve el backend
              console.log('📋 Información básica:', {
                message: result.message,
                estado_item: result.estado_item,
                modulo: result.modulo,
                empleado: result.empleado
              });
              
              console.log('📋 Información completa del item:', result.item_info);
              console.log('📋 Información del pedido:', result.pedido_info);
              
              // Guardar información completa en localStorage para uso posterior
              if (result.item_info) {
                localStorage.setItem(`item_asignado_${asignacion.item_id}`, JSON.stringify(result.item_info));
              }
              if (result.pedido_info) {
                localStorage.setItem(`pedido_info_${asignacion.pedido_id}`, JSON.stringify(result.pedido_info));
              }
              
              return result;
            }

            // Manejar error 429 con retry
            if (res.status === 429 && intento < maxRetries - 1) {
              const delay = Math.pow(2, intento) * 1000; // 1s, 2s, 4s
              console.log(`⚠️ Rate limited (429), esperando ${delay}ms antes del intento ${intento + 2}`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }

            // Otros errores
            const errorText = await res.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${res.status}: ${errorText}`);
            
          } catch (error: any) {
            if (intento === maxRetries - 1) {
              console.error(`❌ Todos los intentos fallaron para asignación:`, asignacion);
              throw error;
            }
            console.log(`⚠️ Intento ${intento + 1} falló, reintentando...`, error.message);
            
            // Delay antes del siguiente intento
            const delay = Math.pow(2, intento) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };
      
      // CORREGIDO: Enviar cada asignación individualmente con retry
      const resultados = [];
      
      for (const asignacion of asignacionesParaEnviar) {
        const result = await asignarItemConRetry(asignacion);
        resultados.push(result);
      }
      
      // Todas las asignaciones fueron exitosas
      setMessage(`✅ ${asignacionesParaEnviar.length} asignación(es) enviada(s) correctamente`);
      
      // ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE - SOLUCIÓN SIMPLE
      const nuevosItemsAsignados: Record<string, {empleado_nombre: string, fecha_asignacion: string, item_info?: any}> = {};
      
      for (let i = 0; i < asignacionesParaEnviar.length; i++) {
        const asignacion = asignacionesParaEnviar[i];
        const resultado = resultados[i];
        
        // Usar información del resultado del backend si está disponible
        const itemInfo = resultado?.item_info;
        const empleadoNombre = itemInfo?.nombre_empleado || asignacion.empleado_nombre || "Empleado asignado";
        
        nuevosItemsAsignados[asignacion.item_id] = {
          empleado_nombre: empleadoNombre,
          fecha_asignacion: itemInfo?.fecha_asignacion || new Date().toISOString(),
          item_info: itemInfo // Incluir información completa del item
        };
      }
      
      setItemsAsignadosLocalmente(prev => ({ ...prev, ...nuevosItemsAsignados }));
      console.log('✅ Items marcados como asignados localmente:', nuevosItemsAsignados);
      
      // NUEVO: Disparar evento personalizado para notificar asignación exitosa
      console.log('🎯 Disparando evento asignacionRealizada con datos:', {
        pedidoId: pedidoId,
        asignaciones: asignacionesParaEnviar,
        resultados: resultados, // Incluir información completa del backend
        timestamp: new Date().toISOString()
      });
      
      window.dispatchEvent(new CustomEvent('asignacionRealizada', { 
        detail: { 
          pedidoId: pedidoId,
          asignaciones: asignacionesParaEnviar,
          resultados: resultados, // NUEVA: Información completa del backend
          timestamp: new Date().toISOString()
        } 
      }));
      
      console.log('✅ Evento asignacionRealizada disparado exitosamente');
      
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
          const asignacion = asignaciones[key] || {};
          const asignadoPrevio = asignadosPrevios[key];
          const cambioActivo = showCambio[key];
          
          // VERIFICAR SI EL ITEM ESTÁ ASIGNADO LOCALMENTE
          const itemAsignadoLocalmente = itemsAsignadosLocalmente[item.id];
          
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
              {/* MOSTRAR SI ESTÁ ASIGNADO LOCALMENTE */}
              {itemAsignadoLocalmente ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <span>✅ Asignado a: {itemAsignadoLocalmente.empleado_nombre}</span>
                    <span className="text-xs text-gray-500">
                      ({new Date(itemAsignadoLocalmente.fecha_asignacion).toLocaleDateString()})
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                    🚫 Este item ya está asignado y no se puede reasignar
                  </div>
                </div>
              ) : asignadoPrevio && !cambioActivo ? (
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
                            // Obtener la lista de empleados disponibles (con fallback)
                            const listaEmpleadosDisponibles = (empleadosPorItem[item.id] && empleadosPorItem[item.id].length > 0) ? empleadosPorItem[item.id] : empleados;
                            
                            console.log('🔍 DEBUG - Empleados disponibles para item:', item.id, listaEmpleadosDisponibles.length);
                            
                            // Primero filtrar por datos válidos
                            const empleadosValidos = listaEmpleadosDisponibles.filter(e => 
                              e && e.identificador && (e.nombre || e.nombreCompleto)
                            );
                            
                            console.log('🔍 DEBUG - Empleados válidos:', empleadosValidos.length);
                            
                            // Intentar filtrar por tipo si es necesario
                            const tipoEmpleadoItem = obtenerTipoEmpleadoPorItem(item.id);
                            console.log('🔍 DEBUG - Tipo empleado requerido:', tipoEmpleadoItem);
                            
                            let empleadosAFiltrar = empleadosValidos;
                            
                            // Si hay tipoEmpleado definido, intentar filtrar
                            if (tipoEmpleadoItem && Array.isArray(tipoEmpleadoItem) && tipoEmpleadoItem.length > 0) {
                              const empleadosFiltrados = empleadosValidos.filter((e) => {
                                let cumpleFiltro = false;
                                
                                // Intentar filtrar por permisos primero
                                if (Array.isArray(e.permisos) && e.permisos.length > 0) {
                                  cumpleFiltro = tipoEmpleadoItem.some((tipo) => 
                                    e.permisos.includes(tipo)
                                  );
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
                                }
                                // Si no tiene ni permisos ni cargo que cumplan el filtro, NO incluir
                                return cumpleFiltro;
                              });
                              
                              console.log('🔍 DEBUG - Empleados después del filtro de tipo:', empleadosFiltrados.length);
                              
                              // FALLBACK: Si después del filtro no hay empleados, usar todos los válidos
                              empleadosAFiltrar = empleadosFiltrados.length > 0 ? empleadosFiltrados : empleadosValidos;
                              
                              console.log('🔍 DEBUG - Empleados finales a mostrar:', empleadosAFiltrar.length);
                            }
                            
                            return empleadosAFiltrar.map((empleado) => {
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
                        <div className="mt-1 text-blue-600 font-medium">
                          📍 Módulo actual: {obtenerEstadoItem(item.id).toUpperCase()}
                        </div>
                        <div className="mt-1 text-gray-600">
                          🎯 Empleados disponibles: {obtenerTipoEmpleadoPorItem(item.id).join(", ")}
                        </div>
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