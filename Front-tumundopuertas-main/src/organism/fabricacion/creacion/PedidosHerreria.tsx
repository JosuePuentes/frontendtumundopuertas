import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
// Importaciones removidas: usePedido y DetalleHerreria ya no se usan con la nueva estructura
import { useEmpleado } from "@/hooks/useEmpleado";
import AsignarArticulos from "@/organism/asignar/AsignarArticulos";
import IndicadorEstadosItem from "@/components/IndicadorEstadosItem";

// Tipos explícitos - NUEVA ESTRUCTURA: Items individuales
interface ItemIndividual {
  id: string;
  pedido_id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  costo: number;
  cantidad: number;
  activo: boolean;
  costoProduccion: number;
  detalleitem?: string;
  imagenes?: string[];
  estado_item: number; // NUEVO: Estado del item (1, 2, 3, 4)
  empleado_asignado?: string; // NUEVO: Empleado asignado
  fecha_asignacion?: string; // NUEVO: Fecha de asignación
  fecha_terminacion?: string; // NUEVO: Fecha de terminación
  cliente_nombre?: string; // NUEVO: Nombre del cliente
  fecha_creacion?: string; // NUEVO: Fecha de creación del pedido
  pedido_fecha_creacion?: string; // NUEVO: Fecha de creación del pedido (alternativa)
  created_at?: string; // NUEVO: Campo adicional de fecha para debug
}

// Interfaces PedidoItem y PedidoSeguimiento removidas - ya no se usan con la nueva estructura de items individuales

const PedidosHerreria: React.FC = () => {
  // NUEVA ESTRUCTURA: Manejar items individuales en lugar de pedidos completos
  const [itemsIndividuales, setItemsIndividuales] = useState<ItemIndividual[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const { dataEmpleados, fetchEmpleado } = useEmpleado();
  
  // Estado para mostrar notificaciones de asignación
  const [notificacionAsignacion, setNotificacionAsignacion] = useState<{
    mostrar: boolean;
    mensaje: string;
    tipo: 'success' | 'error' | 'info';
  }>({ mostrar: false, mensaje: '', tipo: 'info' });
  
  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroAsignacion, setFiltroAsignacion] = useState<string>("todos");
  const [filtroFecha, setFiltroFecha] = useState<string>("todos"); // NUEVO: Filtro por fecha
  const [searchTerm, setSearchTerm] = useState<string>(""); // NUEVO: Buscador por nombre de cliente
  
  // Estado para barra de progreso por item
  const [progresoItems, setProgresoItems] = useState<Record<string, number>>({});
  
  // Función para obtener progreso de un item - OPTIMIZADA
  const obtenerProgresoItem = async (pedidoId: string, itemId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/item-estado/${pedidoId}/${itemId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // Aumentado a 10 segundos timeout
      });
      
      if (!response.ok) {
        return { progreso: 0 };
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return { progreso: 0 };
    }
  };

  // Función para cargar progreso de todos los items en PARALELO - OPTIMIZADA
  const cargarProgresoItemsParalelo = async (items: ItemIndividual[]) => {
    try {
      // OPTIMIZACIÓN: Limitar a solo los primeros 10 items a la vez para evitar sobrecarga
      const itemsACargar = items.slice(0, 10);
      
      const promesasProgreso = itemsACargar.map(item => 
        obtenerProgresoItem(item.pedido_id, item.id)
      );
      
      // Ejecutar todas las peticiones en paralelo con timeout individual
      const resultados = await Promise.allSettled(promesasProgreso);
      
      const progresoData: Record<string, number> = {};
      resultados.forEach((resultado, index) => {
        const item = itemsACargar[index];
        if (resultado.status === 'fulfilled') {
          progresoData[item.id] = resultado.value?.progreso || 0;
        } else {
          progresoData[item.id] = 0;
        }
      });
      
      // Para los items restantes, establecer progreso en 0
      items.slice(10).forEach(item => {
        progresoData[item.id] = 0;
      });
      
      setProgresoItems(progresoData);
    } catch (error) {
      console.warn('⚠️ Error al cargar progreso de items:', error);
      // Si falla, establecer progreso en 0 para todos
      const progresoData: Record<string, number> = {};
      items.forEach(item => {
        progresoData[item.id] = 0;
      });
      setProgresoItems(progresoData);
    }
  };

  
  // Función para construir URL de filtrado dinámico - OPTIMIZADA para herrería
  const construirUrlFiltro = () => {
    // NUEVO: Usar el endpoint optimizado específico para herrería
    const params = new URLSearchParams();
    
    // Agregar parámetro de asignación si es necesario
    if (filtroAsignacion === "sin_asignar") {
      params.append("sin_asignar", "true");
    }
    
    // Agregar ordenamiento por fecha (más recientes primero)
    params.append("ordenar", "fecha_desc");
    
    // SOLUCIÓN: Siempre agregar un límite para evitar problemas de CORS
    params.append("limite", "100");
    
    return `/pedidos/herreria/?${params.toString()}`;
  };

  // Función para recargar datos - NUEVA ESTRUCTURA: Items individuales
  const recargarDatos = async () => {
    setLoading(true);
    try {
      const urlFiltro = construirUrlFiltro();
      
      // NUEVA ESTRUCTURA: Obtener items individuales directamente
      const response = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}${urlFiltro}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        signal: AbortSignal.timeout(30000) // Aumentado a 30 segundos timeout para carga principal
      });
      
      if (!response.ok) {
        setError(`Error del servidor: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      // Logs comentados para mejorar rendimiento
      // console.log('📋 Respuesta del backend:', data);
      // console.log('🔍 Tipo de respuesta:', typeof data);
      // console.log('🔍 Es array?', Array.isArray(data));
      // console.log('🔍 Tiene propiedad items?', 'items' in data);
      
      // Debug simplificado de fechas comentado
      // if (data.items && Array.isArray(data.items)) {
      //   console.log('📋 Items cargados:', data.items.length);
      //   
      //   // Solo mostrar un resumen de fechas
      //   const itemsConFechas = data.items.filter((item: any) => 
      //     item.pedido_fecha_creacion || item.fecha_creacion || item.created_at
      //   );
      //   
      //   console.log('📅 Items con fechas:', itemsConFechas.length);
      //   
      //   if (itemsConFechas.length > 0) {
      //     const primerItem = itemsConFechas[0];
      //     console.log('📅 Ejemplo de fecha (primer item):', {
      //       pedido_fecha_creacion: primerItem.pedido_fecha_creacion,
      //       fecha_creacion: primerItem.fecha_creacion,
      //       created_at: primerItem.created_at
      //     });
      //   }
      // }
      
      // El backend ahora devuelve {items: Array} o Array directo
      const itemsArray = data.items || data;
      
      if (Array.isArray(itemsArray)) {
        // Ordenar items por fecha DESCENDENTE (más recientes primero) antes de guardar
        const itemsOrdenados = [...itemsArray].sort((a, b) => {
          const fechaA = new Date(a.fecha_creacion || 0).getTime();
          const fechaB = new Date(b.fecha_creacion || 0).getTime();
          return fechaB - fechaA; // Descendente
        });
        
        setItemsIndividuales(itemsOrdenados);
        setUltimaActualizacion(new Date()); // Actualizar timestamp
        
        // Cargar progreso de todos los items en PARALELO para mejorar rendimiento (sin bloquear la UI)
        cargarProgresoItemsParalelo(itemsOrdenados).catch(err => {
          console.warn('⚠️ Error al cargar progreso (no crítico):', err);
        });
      } else {
        // console.log('⚠️ No hay items - itemsArray no es array:', itemsArray);
        setItemsIndividuales([]);
      }
      
      // Cargar empleados en segundo plano (no crítico para mostrar los items)
      fetchEmpleado(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/empleados/all/`)
        .catch(err => {
          console.warn('⚠️ Error al cargar empleados (no crítico):', err);
        });
      // console.log('✅ Datos recargados exitosamente usando nueva estructura');
      
      // Limpiar cualquier error previo
      setError(null);
    } catch (error: any) {
      console.error('❌ Error al cargar datos:', error);
      if (error.name === 'AbortError') {
        setError('La carga está tardando demasiado. Por favor, intenta nuevamente.');
      } else if (error.message?.includes('ERR_CERT_VERIFIER_CHANGED')) {
        setError('El servidor está reiniciando. Por favor, espera unos minutos e intenta nuevamente.');
      } else if (error.message?.includes('Failed to fetch')) {
        setError('Error de conectividad. Verifica tu conexión a internet e intenta nuevamente.');
      } else {
        setError('Error al cargar los datos. Por favor, intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    recargarDatos();
    
    // Cargar empleados al montar el componente
    const apiUrl = import.meta.env.VITE_API_URL?.replace('http://', 'https://') || 'https://crafteo.onrender.com';
    fetchEmpleado(`${apiUrl}/empleados/all/`)
      .catch(err => {
        console.error('❌ Error al cargar empleados:', err);
      });
  }, []);
  
  // NUEVO: Actualizar nombres de empleados cuando tanto itemsIndividuales como dataEmpleados estén disponibles
  useEffect(() => {
    if (itemsIndividuales.length > 0 && dataEmpleados && Array.isArray(dataEmpleados) && dataEmpleados.length > 0) {
      const itemsActualizados = itemsIndividuales.map(item => {
        // Si el item tiene empleado_asignado, buscar el nombre del empleado
        if (item.empleado_asignado) {
          const empleado = dataEmpleados.find(emp => 
            emp.identificador === item.empleado_asignado || 
            emp._id === item.empleado_asignado ||
            emp.identificador?.toString() === item.empleado_asignado?.toString()
          );
          
          // Si se encuentra el empleado, usar su nombre completo
          if (empleado) {
            const nombreCompleto = empleado.nombreCompleto || empleado.nombre || item.empleado_asignado;
            // Solo actualizar si es diferente para evitar re-renders infinitos
            if (nombreCompleto !== item.empleado_asignado) {
              return {
                ...item,
                empleado_asignado: nombreCompleto
              };
            }
          }
        }
        return item;
      });
      
      // Solo actualizar si hay cambios
      const hayCambios = itemsActualizados.some((item, index) => 
        item.empleado_asignado !== itemsIndividuales[index]?.empleado_asignado
      );
      
      if (hayCambios) {
        setItemsIndividuales(itemsActualizados);
      }
    }
  }, [dataEmpleados]);

  // Actualización automática cada 10 minutos (reducido para mejor rendimiento)
  useEffect(() => {
    const interval = setInterval(() => {
      recargarDatos();
    }, 10 * 60 * 1000); // 10 minutos en milisegundos

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, []);

  // NUEVO: Escuchar asignaciones realizadas
  useEffect(() => {
    const handleAsignacionRealizada = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { asignaciones, resultados } = customEvent.detail;
      
      // Validar que asignaciones exista y sea un array
      if (!asignaciones || !Array.isArray(asignaciones)) {
        return;
      }
      
      // ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE usando información completa del backend
      setItemsIndividuales(prevItems => {
        const nuevosItems = prevItems.map(item => {
          // Buscar si este item fue asignado
          const asignacion = asignaciones.find((a: any) => a.item_id === item.id);
          const resultado = resultados?.find((r: any) => r.item_info?.id === item.id);
          
          if (asignacion && resultado?.item_info) {
            return {
              ...item,
              empleado_asignado: resultado.item_info.nombre_empleado || asignacion.empleado_nombre || "Empleado asignado",
              fecha_asignacion: resultado.item_info.fecha_asignacion || new Date().toISOString(),
              // Actualizar información del item con datos del backend
              descripcion: resultado.item_info.descripcion || item.descripcion,
              costoProduccion: resultado.item_info.costoProduccion || item.costoProduccion,
              imagenes: resultado.item_info.imagenes || item.imagenes
            };
          } else if (asignacion) {
            return {
              ...item,
              empleado_asignado: asignacion.empleado_nombre || "Empleado asignado",
              fecha_asignacion: new Date().toISOString()
            };
          }
          
          return item;
        });
        
        return nuevosItems;
      });
      
      // También recargar datos del backend para sincronizar
      await recargarDatos();
    };

    // NUEVO: Escuchar terminación de asignaciones
    const handleAsignacionTerminada = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { itemId, unidadIndex } = customEvent.detail;
      
      console.log('🔄 Asignación terminada detectada:', { itemId, unidadIndex });
      
      // NO limpiar estado de asignación porque ahora usamos asignación por unidades
      // El componente AsignarArticulos maneja las unidades individuales
      
      // Esperar un momento antes de recargar para que el backend procese la terminación
      setTimeout(async () => {
        console.log('🔄 Recargando datos después de terminar asignación...');
        await recargarDatos();
      }, 1500); // 1.5 segundos para dar tiempo al backend
    };

    window.addEventListener('asignacionRealizada', handleAsignacionRealizada);
    window.addEventListener('asignacionTerminada', handleAsignacionTerminada);
    
    return () => {
      window.removeEventListener('asignacionRealizada', handleAsignacionRealizada);
      window.removeEventListener('asignacionTerminada', handleAsignacionTerminada);
    };
  }, []);

  // Debug comentado para mejorar rendimiento
  // useEffect(() => {
  //   if (Array.isArray(itemsIndividuales) && itemsIndividuales.length > 0) {
  //     console.log('📋 Todos los items individuales recibidos:', itemsIndividuales.map((item: ItemIndividual) => ({
  //       id: item.id,
  //       pedido_id: item.pedido_id,
  //       nombre: item.nombre,
  //       estado_item: item.estado_item,
  //       empleado_asignado: item.empleado_asignado,
  //       cliente_nombre: item.cliente_nombre
  //     })));
  //     
  //     // Buscar específicamente el pedido que estamos buscando
  //     const itemsDelPedido = itemsIndividuales.filter((item: ItemIndividual) => item.pedido_id === "68f2bc424dbb7f6039f6ec09");
  //     
  //     if (itemsDelPedido.length > 0) {
  //       console.log('🎯 ITEMS DEL PEDIDO NUEVO ENCONTRADOS:', itemsDelPedido);
  //       console.log('📊 Cantidad de items:', itemsDelPedido.length);
  //       console.log('📊 Estados de los items:', itemsDelPedido.map(i => ({
  //         id: i.id,
  //         nombre: i.nombre,
  //         estado_item: i.estado_item
  //     })));
  //     } else {
  //       console.log('❌ NO SE ENCONTRARON ITEMS DEL PEDIDO NUEVO');
  //     }
  //   } else {
  //     console.log('⚠️ No hay items o itemsIndividuales no es un array:', itemsIndividuales);
  //   }
  // }, [itemsIndividuales]);

  // Sincronización: Escuchar cambios de estado usando evento personalizado
  useEffect(() => {
    const handleCambioEstado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const evento = customEvent.detail;
      
      // Verificar si el cambio es relevante para los items actuales
      const esRelevante = itemsIndividuales.some(item => 
        item.pedido_id === evento.pedidoId && 
        item.id === evento.itemId
      );
      
      if (esRelevante) {
        // Recargar datos cuando hay un cambio de estado relevante
        await recargarDatos();
      }
    };

    // NUEVO: Escuchar cancelación de pedidos
    const handlePedidoCancelado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { pedidoId } = customEvent.detail;
      
      // Verificar si hay items de este pedido en la lista actual
      const itemsDelPedido = itemsIndividuales.filter(item => item.pedido_id === pedidoId);
      
      if (itemsDelPedido.length > 0) {
        // Recargar datos para que los items del pedido cancelado desaparezcan
        await recargarDatos();
      }
    };

    // NUEVO: Escuchar eliminación de pedidos (evento más genérico)
    const handlePedidoEliminado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { pedidoId } = customEvent.detail;
      
      // Verificar si hay items de este pedido en la lista actual
      const itemsDelPedido = itemsIndividuales.filter(item => item.pedido_id === pedidoId);
      
      if (itemsDelPedido.length > 0) {
        // Recargar datos para que los items del pedido eliminado desaparezcan
        await recargarDatos();
      }
    };

    // NUEVO: Escuchar creación de pedidos para recargar datos inmediatamente
    const handlePedidoCreado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { pedidoId } = customEvent.detail;
      
      console.log('🆕 Pedido creado detectado:', pedidoId);
      
      // Esperar un momento para que el backend procese el pedido completamente
      setTimeout(async () => {
        await recargarDatos();
        console.log('✅ Datos recargados después de crear pedido');
      }, 1500); // 1.5 segundos para dar tiempo al backend
    };

    // NUEVO: Escuchar asignaciones realizadas
    const handleAsignacionRealizada = async () => {
      // NO actualizar empleado_asignado aquí porque ahora usamos asignación por unidades
      // El componente AsignarArticulos maneja las unidades individuales
      // Solo mostrar notificación si es necesario
      
      // NO recargar datos del backend - solo actualización optimista para mayor velocidad
      // La recarga se hará cuando el usuario refresque manualmente o después de un tiempo
    };

    // Suscribirse a los eventos personalizados
    window.addEventListener('cambioEstadoItem', handleCambioEstado);
    window.addEventListener('pedidoCancelado', handlePedidoCancelado);
    window.addEventListener('pedidoEliminado', handlePedidoEliminado);
    window.addEventListener('pedidoCreado', handlePedidoCreado);
    window.addEventListener('asignacionRealizada', handleAsignacionRealizada);

    // Cleanup: remover los listeners cuando el componente se desmonte
    return () => {
      window.removeEventListener('cambioEstadoItem', handleCambioEstado);
      window.removeEventListener('pedidoCancelado', handlePedidoCancelado);
      window.removeEventListener('pedidoEliminado', handlePedidoEliminado);
      window.removeEventListener('pedidoCreado', handlePedidoCreado);
      window.removeEventListener('asignacionRealizada', handleAsignacionRealizada);
    };
  }, [itemsIndividuales]);

  // Memoizar items filtrados para evitar recalcular en cada render
  const itemsFiltrados = useMemo(() => {
    console.log('🔍 FILTRO - Aplicando filtros con searchTerm:', searchTerm);
    const filtrados = itemsIndividuales
      .filter((item) => {
        // Mostrar items pendientes (0) y en proceso (1, 2, 3)
        // No mostrar items con estado_item = 4 (terminados completamente)
        const estadoValido = item.estado_item >= 0 && item.estado_item < 4;

        // Filtro por fecha - Usar filtroFecha directamente para tiempo real
        if (filtroFecha !== "todos") {
          // Usar fecha_creacion como campo principal (que es el que tiene datos)
          const fechaItem = new Date(item.fecha_creacion || 0);
          const hoy = new Date();

          switch (filtroFecha) {
            case "hoy":
              return estadoValido && fechaItem.toDateString() === hoy.toDateString();
            case "ayer":
              const ayer = new Date(hoy);
              ayer.setDate(hoy.getDate() - 1);
              return estadoValido && fechaItem.toDateString() === ayer.toDateString();
            case "esta_semana":
              const inicioSemana = new Date(hoy);
              inicioSemana.setDate(hoy.getDate() - hoy.getDay());
              return estadoValido && fechaItem >= inicioSemana;
            case "ultima_semana":
              const inicioUltimaSemana = new Date(hoy);
              inicioUltimaSemana.setDate(hoy.getDate() - hoy.getDay() - 7);
              const finUltimaSemana = new Date(hoy);
              finUltimaSemana.setDate(hoy.getDate() - hoy.getDay());
              return estadoValido && fechaItem >= inicioUltimaSemana && fechaItem < finUltimaSemana;
            case "este_mes":
              return estadoValido && fechaItem.getMonth() === hoy.getMonth() && fechaItem.getFullYear() === hoy.getFullYear();
            case "octubre_2025":
              return estadoValido && fechaItem.getMonth() === 9 && fechaItem.getFullYear() === 2025; // Octubre es mes 9
            case "ultimos_7_dias":
              const hace7Dias = new Date(hoy);
              hace7Dias.setDate(hoy.getDate() - 7);
              return estadoValido && fechaItem >= hace7Dias;
            default:
              return estadoValido;
          }
        }

        return estadoValido;
      })
      .filter((item) => {
        // Filtro por búsqueda SOLO por nombre del cliente - BUSQUEDA EN TIEMPO REAL
        if (searchTerm && searchTerm.trim() !== "") {
          const searchLower = searchTerm.toLowerCase().trim();
          
          // Intentar múltiples campos posibles para el cliente
          const clienteNombre = (
            item.cliente_nombre?.toLowerCase() || 
            (item as any).cliente?.toLowerCase() || 
            (item as any).nombre_cliente?.toLowerCase() || 
            (item as any).cliente_nombre_completo?.toLowerCase() ||
            ''
          );
          
          console.log('🔍 FILTRO BUSQUEDA - item:', item.id, 'cliente:', clienteNombre, 'search:', searchLower, 'match:', clienteNombre.includes(searchLower));
          
          // Buscar SOLO en el nombre del cliente
          return clienteNombre.includes(searchLower);
        }
        return true;
      })
      .filter((item) => {
        // Filtro por estado del item
        if (filtroEstado === "todos") {
          return true;
        }
        const estadoNumerico = {
          "pendiente": 0,
          "herreria": 1,
          "masillar": 2,
          "preparar": 3,
        }[filtroEstado];
        return item.estado_item === estadoNumerico;
      })
      .filter((item) => {
        // Filtro por asignación
        if (filtroAsignacion === "todos") {
          return true;
        }
        if (filtroAsignacion === "sin_asignar") {
          return !item.empleado_asignado;
        }
        if (filtroAsignacion === "asignados") {
          return !!item.empleado_asignado;
        }
        return true;
      })
      .sort((a, b) => {
        // Ordenar por fecha de creación del pedido (más recientes primero)
        // Usar pedido_fecha_creacion si está disponible, sino fecha_creacion
        const fechaA = new Date(a.pedido_fecha_creacion || a.fecha_creacion || 0).getTime();
        const fechaB = new Date(b.pedido_fecha_creacion || b.fecha_creacion || 0).getTime();
        return fechaB - fechaA; // Descendente (más recientes primero)
      });
    
    return filtrados;
  }, [itemsIndividuales, filtroEstado, filtroAsignacion, filtroFecha, searchTerm]);

  // ...

  return (
    <div className="max-w-4xl mx-auto mt-8">
      {/* Notificación de asignación */}
      {notificacionAsignacion.mostrar && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          notificacionAsignacion.tipo === 'success' ? 'bg-green-100 border-green-500 text-green-800' :
          notificacionAsignacion.tipo === 'error' ? 'bg-red-100 border-red-500 text-red-800' :
          'bg-blue-100 border-blue-500 text-blue-800'
        } border-2`}>
          <div className="flex items-center justify-between">
            <p className="font-medium">{notificacionAsignacion.mensaje}</p>
            <button 
              onClick={() => setNotificacionAsignacion(prev => ({ ...prev, mostrar: false }))}
              className="ml-2 text-lg font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Gestión de Items Individuales - PedidosHerreria</CardTitle>
        
        {/* Indicador de última actualización */}
        <div className="text-sm text-gray-600 mt-2">
          <span className="inline-flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Última actualización: {ultimaActualizacion.toLocaleTimeString()}
            <span className="text-gray-400">(Actualización automática cada 10 minutos)</span>
          </span>
        </div>
        
        {/* Controles de Filtro Mejorados */}
        <div className="flex flex-col gap-4 mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Buscador de cliente - Mejorado */}
          <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
            <Label htmlFor="buscar-cliente" className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar por Nombre del Cliente
            </Label>
            <Input
              id="buscar-cliente"
              type="text"
              placeholder="🔍 Escribe el nombre del cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              autoComplete="off"
            />
            {searchTerm && (
              <p className="text-xs text-gray-600 mt-1">
                Búsqueda activa: "{searchTerm}"
              </p>
            )}
          </div>
          
          <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="filtro-estado" className="text-sm font-medium text-gray-700 mb-2 block">
              Estado del Item:
            </Label>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full bg-white border-gray-300">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="todos" className="hover:bg-gray-100">Todos los Estados Activos</SelectItem>
                <SelectItem value="pendiente" className="hover:bg-gray-100">Pendientes (0)</SelectItem>
                <SelectItem value="herreria" className="hover:bg-gray-100">Herrería (1)</SelectItem>
                <SelectItem value="masillar" className="hover:bg-gray-100">Masillar (2)</SelectItem>
                <SelectItem value="preparar" className="hover:bg-gray-100">Preparar (3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <Label htmlFor="filtro-asignacion" className="text-sm font-medium text-gray-700 mb-2 block">
              Asignación:
            </Label>
            <Select value={filtroAsignacion} onValueChange={setFiltroAsignacion}>
              <SelectTrigger className="w-full bg-white border-gray-300">
                <SelectValue placeholder="Seleccionar asignación" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="todos" className="hover:bg-gray-100">Todos</SelectItem>
                <SelectItem value="sin_asignar" className="hover:bg-gray-100">Sin Asignar</SelectItem>
                <SelectItem value="asignados" className="hover:bg-gray-100">Asignados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <Label htmlFor="filtro-fecha" className="text-sm font-medium text-gray-700 mb-2 block">
              Fecha:
            </Label>
            <Select value={filtroFecha} onValueChange={setFiltroFecha}>
              <SelectTrigger className="w-full bg-white border-gray-300">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="todos" className="hover:bg-gray-100">Todos</SelectItem>
                <SelectItem value="hoy" className="hover:bg-gray-100">Hoy</SelectItem>
                <SelectItem value="ayer" className="hover:bg-gray-100">Ayer</SelectItem>
                <SelectItem value="ultimos_7_dias" className="hover:bg-gray-100">Últimos 7 Días</SelectItem>
                <SelectItem value="esta_semana" className="hover:bg-gray-100">Esta Semana</SelectItem>
                <SelectItem value="ultima_semana" className="hover:bg-gray-100">Última Semana</SelectItem>
                <SelectItem value="este_mes" className="hover:bg-gray-100">Este Mes</SelectItem>
                <SelectItem value="octubre_2025" className="hover:bg-gray-100">Octubre 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-2"></span>
            <span className="text-blue-600 font-semibold">Cargando items...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="font-semibold">Error al cargar datos:</p>
            <p>{error}</p>
          </div>
        ) : !Array.isArray(itemsIndividuales) || itemsIndividuales.length === 0 ? (
          <p className="text-gray-500">No hay items para gestionar.</p>
        ) : (
          <ul className="space-y-6">
            {(() => {
              // Si no hay items filtrados, mostrar mensaje
              if (itemsFiltrados.length === 0) {
                return (
                  <div className="text-center py-12 px-4">
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">No se encontraron resultados</h3>
                      {searchTerm && (
                        <p className="mt-2 text-sm text-gray-600">
                          No hay items que coincidan con "<span className="font-semibold text-gray-900">{searchTerm}</span>"
                        </p>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        Intenta ajustar los filtros o el término de búsqueda
                      </p>
                    </div>
                  </div>
                );
              }
              
              return itemsFiltrados.map((item, idxRender) => {
                const progreso = progresoItems[item.id] || 0;
                return (
                  <li key={`${item.id}-${(item as any).unidad_index ?? idxRender}`} className="border rounded-xl bg-white shadow p-6 transition-all duration-300 hover:shadow-lg">
                    {/* Información del item individual */}
                    <div className="space-y-4">
                      {/* Header del item */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{item.nombre}</h3>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-600 text-white">
                              Cantidad: {item.cantidad}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Pedido: {item.pedido_id.slice(-6)}</p>
                          <p className="text-sm text-gray-600">Cliente: {item.cliente_nombre || 'Sin cliente'}</p>
                          <p className="text-sm text-gray-600">
                            📅 Fecha: {item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString() : 'N/A'}
                            {item.fecha_creacion && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {new Date(item.fecha_creacion).toLocaleTimeString()}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">Costo: ${item.costoProduccion?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                      
                      {/* Detalles del item */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700"><strong>Descripción:</strong> {item.descripcion}</p>
                        <p className="text-sm text-gray-700"><strong>Detalles:</strong> {item.detalleitem || 'Sin detalles adicionales'}</p>
                        <p className="text-sm text-gray-700"><strong>Categoría:</strong> {item.categoria}</p>
                      </div>
                      
                      {/* Estado del item */}
                      <div className="space-y-2">
                    <IndicadorEstadosItem
                          estadoItem={item.estado_item}
                      itemNombre={item.nombre}
                    />
                        
                        {/* Barra de progreso del item */}
                        <div className="progreso-bar bg-gray-200 rounded-full h-4 relative">
                          <div 
                            className="progreso bg-blue-500 h-4 rounded-full transition-all duration-300"
                            style={{width: `${progreso}%`}}
                          ></div>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                            {progreso}%
                          </span>
                        </div>
                </div>
                
                      
                      {/* Información de asignación (solo para mostrar, no bloquea la asignación) */}
                      {item.empleado_asignado && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-blue-800"><strong>Nota:</strong> Este item puede tener múltiples unidades asignadas a diferentes empleados. Ver detalles abajo.</p>
                        </div>
                      )}
                      
                      {/* Componente de asignación - SIEMPRE mostrar para permitir asignación por unidades */}
                      {/* Pasar el estado_item actual como numeroOrden para determinar el módulo correcto */}
                      <div className="mt-4">
                        <AsignarArticulos
                          estado_general="independiente"
                          numeroOrden={item.estado_item.toString()} // Usar estado_item para determinar el módulo (1=herreria, 2=masillar, 3=preparar)
                          items={[item]} // Pasar solo este item individual
                          empleados={(() => {
                            console.log('🔍 DEBUG - dataEmpleados:', dataEmpleados);
                            console.log('🔍 DEBUG - es array?', Array.isArray(dataEmpleados));
                            console.log('🔍 DEBUG - cantidad:', dataEmpleados ? (Array.isArray(dataEmpleados) ? dataEmpleados.length : Object.keys(dataEmpleados).length) : 0);
                            if (Array.isArray(dataEmpleados)) {
                              return dataEmpleados;
                            }
                            // Si dataEmpleados es un objeto con una propiedad array (como {empleados: [...]})
                            if (dataEmpleados && typeof dataEmpleados === 'object' && 'empleados' in dataEmpleados && Array.isArray((dataEmpleados as any).empleados)) {
                              return (dataEmpleados as any).empleados;
                            }
                            return [];
                          })()}
                          pedidoId={item.pedido_id}
                          tipoEmpleado={[]}
                        />
                      </div>
                </div>
              </li>
                );
              });
            })()}
          </ul>
        )}
      </CardContent>
    </Card>
    </div>
  );
};

export default PedidosHerreria;
