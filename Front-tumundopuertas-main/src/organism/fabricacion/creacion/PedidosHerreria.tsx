import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  
  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroAsignacion, setFiltroAsignacion] = useState<string>("todos");
  const [filtroFecha, setFiltroFecha] = useState<string>("todos"); // NUEVO: Filtro por fecha
  const [filtrosAplicados, setFiltrosAplicados] = useState<{estado: string, asignacion: string, fecha: string}>({estado: "todos", asignacion: "todos", fecha: "todos"});
  
  // Estado para barra de progreso por item
  const [progresoItems, setProgresoItems] = useState<Record<string, number>>({});
  
  // Función para obtener progreso de un item
  const obtenerProgresoItem = async (pedidoId: string, itemId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/item-estado/${pedidoId}/${itemId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Agregar timeout y manejo de errores de conectividad
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Error ${response.status} al obtener progreso del item ${itemId}`);
        return { progreso: 0 };
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('⏰ Timeout al obtener progreso del item:', itemId);
      } else if (error.message?.includes('ERR_CERT_VERIFIER_CHANGED')) {
        console.warn('🔒 Error de certificado SSL - backend puede estar reiniciando');
      } else if (error.message?.includes('Failed to fetch')) {
        console.warn('🌐 Error de conectividad con el backend');
      } else {
        console.error('❌ Error al obtener progreso del item:', error);
      }
      return { progreso: 0 };
    }
  };

  // Función de prueba para verificar la conexión con el backend
  const testBackendConnection = async () => {
    try {
      console.log('🔍 Probando conexión con el backend...');
      
      const response = await fetch('https://crafteo.onrender.com/pedidos/herreria/?ordenar=fecha_desc&limite=5', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Status:', response.status);
      console.log('📡 Headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        console.log('✅ Total items:', data.total_items);
        console.log('✅ Items mostrados:', data.items_mostrados);
      } else {
        console.error('❌ Error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
    }
  };

  // Función temporal para inicializar items existentes (SOLO PARA PRUEBAS)
  const inicializarItemsExistentes = async () => {
    try {
      console.log('🔄 Inicializando estado_item en items existentes...');
      console.log('📡 URL:', `${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/inicializar-estado-items/`);
      
      // Crear un AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
      
      const response = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/inicializar-estado-items/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        console.error('❌ Error en response:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
        return;
      }
      
      const result = await response.json();
      console.log('✅ Resultado:', result);
      
      if (result.items_actualizados > 0) {
        console.log(`✅ Se inicializaron ${result.items_actualizados} items`);
        // Recargar los datos después de la inicialización
        await recargarDatos();
      } else {
        console.log('ℹ️ No había items para inicializar');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error inicializando items:', error);
    }
  };

  
  // Función para construir URL de filtrado dinámico - OPTIMIZADA para herrería
  const construirUrlFiltro = () => {
    // NUEVO: Usar el endpoint optimizado específico para herrería
    const params = new URLSearchParams();
    
    // Agregar parámetro de asignación si es necesario
    if (filtrosAplicados.asignacion === "sin_asignar") {
      params.append("sin_asignar", "true");
    }
    
    // Agregar ordenamiento por fecha (más recientes primero)
    params.append("ordenar", "fecha_desc");
    
    // SOLUCIÓN: Siempre agregar un límite para evitar problemas de CORS
    params.append("limite", "100");
    
    return `/pedidos/herreria/?${params.toString()}`;
  };

  // Función para aplicar filtros con debounce
  const aplicarFiltros = () => {
    setFiltrosAplicados({
      estado: filtroEstado,
      asignacion: filtroAsignacion,
      fecha: filtroFecha
    });
    console.log('🔍 Filtros aplicados:', { estado: filtroEstado, asignacion: filtroAsignacion, fecha: filtroFecha });
  };

  // Función para recargar datos - NUEVA ESTRUCTURA: Items individuales
  const recargarDatos = async () => {
    console.log('🔄 Recargando items individuales de PedidosHerreria usando endpoint optimizado /pedidos/herreria/...');
    console.log('🎯 Filtros aplicados:', { filtroEstado, filtroAsignacion, filtroFecha });
    
    setLoading(true);
    try {
      const urlFiltro = construirUrlFiltro();
      console.log('📡 URL de filtro optimizada:', urlFiltro);
      
      // NUEVA ESTRUCTURA: Obtener items individuales directamente
      const response = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}${urlFiltro}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        signal: AbortSignal.timeout(25000) // 25 segundos timeout para carga principal
      });
      
      if (!response.ok) {
        console.error(`❌ Error ${response.status} al cargar items de herrería`);
        setError(`Error del servidor: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      console.log('📋 Respuesta del backend:', data);
      console.log('🔍 Tipo de respuesta:', typeof data);
      console.log('🔍 Es array?', Array.isArray(data));
      console.log('🔍 Tiene propiedad items?', 'items' in data);
      
      // Debug simplificado de fechas
      if (data.items && Array.isArray(data.items)) {
        console.log('📋 Items cargados:', data.items.length);
        
        // Solo mostrar un resumen de fechas
        const itemsConFechas = data.items.filter((item: any) => 
          item.pedido_fecha_creacion || item.fecha_creacion || item.created_at
        );
        
        console.log('📅 Items con fechas:', itemsConFechas.length);
        
        if (itemsConFechas.length > 0) {
          const primerItem = itemsConFechas[0];
          console.log('📅 Ejemplo de fecha (primer item):', {
            pedido_fecha_creacion: primerItem.pedido_fecha_creacion,
            fecha_creacion: primerItem.fecha_creacion,
            created_at: primerItem.created_at
          });
        }
      }
      
      // El backend ahora devuelve {items: Array} o Array directo
      const itemsArray = data.items || data;
      console.log('📋 Items extraídos:', itemsArray);
      console.log('📊 Cantidad de items:', Array.isArray(itemsArray) ? itemsArray.length : 'No es array');
      
        // Debug específico para los pedidos que estamos buscando
        if (Array.isArray(itemsArray)) {
          const itemsDelPedidoAntiguo = itemsArray.filter((item: any) => item.pedido_id === "68f2bc424dbb7f6039f6ec09");
          const itemsDelPedidoNuevo = itemsArray.filter((item: any) => item.pedido_id === "68f446c8b2b5fb8a533eff63");
          
          console.log('🎯 ITEMS DEL PEDIDO ANTIGUO 68f2bc424dbb7f6039f6ec09:', itemsDelPedidoAntiguo);
          console.log('📊 Cantidad encontrada (antiguo):', itemsDelPedidoAntiguo.length);
          
          console.log('🎯 ITEMS DEL PEDIDO NUEVO 68f446c8b2b5fb8a533eff63:', itemsDelPedidoNuevo);
          console.log('📊 Cantidad encontrada (nuevo):', itemsDelPedidoNuevo.length);
          
          // Debug específico del pedido de hoy (19/10/2025)
          if (itemsDelPedidoNuevo.length > 0) {
            console.log('🎯 ¡ENCONTRADO! Pedido de hoy:', {
              pedido_id: itemsDelPedidoNuevo[0].pedido_id,
              fecha_creacion: itemsDelPedidoNuevo[0].fecha_creacion,
              pedido_fecha_creacion: itemsDelPedidoNuevo[0].pedido_fecha_creacion,
              estado_item: itemsDelPedidoNuevo[0].estado_item,
              nombre: itemsDelPedidoNuevo[0].nombre
            });
          } else {
            console.log('❌ NO ENCONTRADO: El pedido de hoy no está en la respuesta del backend');
          }
        
        // Debug de fechas de todos los items
        console.log('📅 DEBUG DE FECHAS - Primeros 10 items:');
        itemsArray.slice(0, 10).forEach((item: any, index: number) => {
          console.log(`📅 Item ${index + 1}:`, {
            id: item.id,
            pedido_id: item.pedido_id,
            nombre: item.nombre,
            fecha_creacion: item.fecha_creacion,
            pedido_fecha_creacion: item.pedido_fecha_creacion,
            fecha_usada: item.pedido_fecha_creacion || item.fecha_creacion,
            fecha_formateada: item.pedido_fecha_creacion || item.fecha_creacion ? new Date(item.pedido_fecha_creacion || item.fecha_creacion).toLocaleDateString() : 'N/A'
          });
        });
        
        // Verificar si hay items del 18/10/2025
        const items18Oct = itemsArray.filter((item: any) => {
          const fechaCreacion = item.pedido_fecha_creacion || item.fecha_creacion;
          if (fechaCreacion) {
            const fecha = new Date(fechaCreacion);
            const es18Oct = fecha.getDate() === 18 && fecha.getMonth() === 9; // Octubre es mes 9 (0-indexado)
            if (es18Oct) {
              console.log('🎯 ITEM DEL 18/10/2025 ENCONTRADO:', item);
            }
            return es18Oct;
          }
          return false;
        });
        
        console.log('📅 Items del 18/10/2025 encontrados:', items18Oct.length);
        console.log('📅 Items del 18/10/2025:', items18Oct);
        
        // Verificar estados de items
        const estadosCount = itemsArray.reduce((acc: any, item: any) => {
          const estado = item.estado_item || 0;
          acc[estado] = (acc[estado] || 0) + 1;
          return acc;
        }, {});
        
        console.log('📊 Conteo de estados_item:', estadosCount);
        
        // Verificar pedidos únicos
        const pedidosUnicos = [...new Set(itemsArray.map((item: any) => item.pedido_id))];
        console.log('📋 Pedidos únicos encontrados:', pedidosUnicos.length);
        console.log('📋 Primeros 5 pedidos:', pedidosUnicos.slice(0, 5));
        
        if (itemsDelPedidoAntiguo.length === 0 && itemsDelPedidoNuevo.length === 0) {
          console.log('❌ NO SE ENCONTRARON ITEMS DE LOS PEDIDOS BUSCADOS');
          console.log('🔍 Todos los pedido_ids disponibles:', itemsArray.map((item: any) => item.pedido_id));
          console.log('💡 SOLUCIÓN: Haz clic en "🔧 Inicializar Items Existentes" para inicializar items sin estado_item');
        } else {
          if (itemsDelPedidoAntiguo.length > 0) {
            console.log('✅ ITEMS DEL PEDIDO ANTIGUO ENCONTRADOS - Estados:', itemsDelPedidoAntiguo.map((item: any) => ({
              id: item.id,
              nombre: item.nombre,
              estado_item: item.estado_item
            })));
          }
          if (itemsDelPedidoNuevo.length > 0) {
            console.log('✅ ITEMS DEL PEDIDO NUEVO ENCONTRADOS - Estados:', itemsDelPedidoNuevo.map((item: any) => ({
              id: item.id,
              nombre: item.nombre,
              estado_item: item.estado_item
            })));
          }
        }
      }
      
      if (Array.isArray(itemsArray)) {
        setItemsIndividuales(itemsArray);
        setUltimaActualizacion(new Date()); // Actualizar timestamp
        console.log('✅ Items individuales cargados:', itemsArray.length);
        
        // Cargar progreso de todos los items
        const cargarProgresoItems = async () => {
          const progresoData: Record<string, number> = {};
          for (const item of itemsArray) {
            const progresoItem = await obtenerProgresoItem(item.pedido_id, item.id);
            progresoData[item.id] = progresoItem.progreso || 0;
          }
          setProgresoItems(progresoData);
        };
        
        cargarProgresoItems();
      } else {
        console.log('⚠️ No hay items - itemsArray no es array:', itemsArray);
        setItemsIndividuales([]);
      }
      
      await fetchEmpleado(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/empleados/all/`);
      console.log('✅ Datos recargados exitosamente usando nueva estructura');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('⏰ Timeout al cargar datos de herrería');
        setError('La carga está tardando demasiado. Por favor, intenta nuevamente.');
      } else if (error.message?.includes('ERR_CERT_VERIFIER_CHANGED')) {
        console.warn('🔒 Error de certificado SSL - backend puede estar reiniciando');
        setError('El servidor está reiniciando. Por favor, espera unos minutos e intenta nuevamente.');
      } else if (error.message?.includes('Failed to fetch')) {
        console.warn('🌐 Error de conectividad con el backend');
        setError('Error de conectividad. Verifica tu conexión a internet e intenta nuevamente.');
      } else {
      console.error('❌ Error al recargar datos:', error);
        setError('Error al cargar los datos. Por favor, intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    // Ejecutar prueba de conexión al cargar
    testBackendConnection();
    recargarDatos();
  }, []);

  // Recargar datos cuando cambien los filtros aplicados
  useEffect(() => {
    recargarDatos();
  }, [filtrosAplicados]);

  // Actualización automática cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Actualización automática cada 5 minutos...');
      recargarDatos();
    }, 5 * 60 * 1000); // 5 minutos en milisegundos

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, []);

  // NUEVO: Escuchar asignaciones realizadas
  useEffect(() => {
    const handleAsignacionRealizada = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { pedidoId, asignaciones, timestamp } = customEvent.detail;
      console.log(`🎯 PedidosHerreria: Asignación realizada detectada:`, { pedidoId, asignaciones, timestamp });
      
      // Recargar datos para mostrar el empleado asignado
      await recargarDatos();
      
      console.log(`✅ PedidosHerreria: Datos actualizados después de asignación`);
    };

    window.addEventListener('asignacionRealizada', handleAsignacionRealizada);
    
    return () => {
      window.removeEventListener('asignacionRealizada', handleAsignacionRealizada);
    };
  }, []);

  // Debug: Log todos los items cuando cambien
  useEffect(() => {
    if (Array.isArray(itemsIndividuales) && itemsIndividuales.length > 0) {
      console.log('📋 Todos los items individuales recibidos:', itemsIndividuales.map((item: ItemIndividual) => ({
        id: item.id,
        pedido_id: item.pedido_id,
        nombre: item.nombre,
        estado_item: item.estado_item,
        empleado_asignado: item.empleado_asignado,
        cliente_nombre: item.cliente_nombre
      })));
      
      // Buscar específicamente el pedido que estamos buscando
      const itemsDelPedido = itemsIndividuales.filter((item: ItemIndividual) => item.pedido_id === "68f2bc424dbb7f6039f6ec09");
      
      if (itemsDelPedido.length > 0) {
        console.log('🎯 ITEMS DEL PEDIDO NUEVO ENCONTRADOS:', itemsDelPedido);
        console.log('📊 Cantidad de items:', itemsDelPedido.length);
        console.log('📊 Estados de los items:', itemsDelPedido.map(i => ({
          id: i.id,
          nombre: i.nombre,
          estado_item: i.estado_item
      })));
      } else {
        console.log('❌ NO SE ENCONTRARON ITEMS DEL PEDIDO NUEVO');
      }
    } else {
      console.log('⚠️ No hay items o itemsIndividuales no es un array:', itemsIndividuales);
    }
  }, [itemsIndividuales]);

  // Sincronización: Escuchar cambios de estado usando evento personalizado
  useEffect(() => {
    const handleCambioEstado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const evento = customEvent.detail;
      console.log(`🔄 PedidosHerreria: Cambio de estado detectado:`, evento);
      
      // Verificar si el cambio es relevante para los items actuales
      const esRelevante = itemsIndividuales.some(item => 
        item.pedido_id === evento.pedidoId && 
        item.id === evento.itemId
      );
      
      if (esRelevante) {
        console.log(`🎯 Cambio relevante detectado, recargando datos...`);
        
        // Recargar datos cuando hay un cambio de estado relevante
        await recargarDatos();
        
        console.log(`✅ PedidosHerreria: Datos actualizados después del cambio de estado`);
      }
    };

    // NUEVO: Escuchar cancelación de pedidos
    const handlePedidoCancelado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { pedidoId } = customEvent.detail;
      console.log(`🚫 PedidosHerreria: Pedido cancelado detectado:`, pedidoId);
      console.log(`🔍 Items actuales en PedidosHerreria:`, itemsIndividuales.length);
      console.log(`📋 IDs de pedidos en items actuales:`, itemsIndividuales.map(item => item.pedido_id));
      
      // Verificar si hay items de este pedido en la lista actual
      const itemsDelPedido = itemsIndividuales.filter(item => item.pedido_id === pedidoId);
      console.log(`🎯 Items encontrados del pedido ${pedidoId}:`, itemsDelPedido.length);
      
      if (itemsDelPedido.length > 0) {
        console.log(`🎯 Pedido cancelado tiene ${itemsDelPedido.length} items en PedidosHerreria, recargando datos...`);
        
        // Recargar datos para que los items del pedido cancelado desaparezcan
        await recargarDatos();
        
        console.log(`✅ PedidosHerreria: Items del pedido cancelado removidos`);
      } else {
        console.log(`ℹ️ No hay items del pedido ${pedidoId} en PedidosHerreria actualmente`);
      }
    };

    // NUEVO: Escuchar eliminación de pedidos (evento más genérico)
    const handlePedidoEliminado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { pedidoId } = customEvent.detail;
      console.log(`🗑️ PedidosHerreria: Pedido eliminado detectado:`, pedidoId);
      
      // Verificar si hay items de este pedido en la lista actual
      const itemsDelPedido = itemsIndividuales.filter(item => item.pedido_id === pedidoId);
      
      if (itemsDelPedido.length > 0) {
        console.log(`🎯 Pedido eliminado tiene ${itemsDelPedido.length} items en PedidosHerreria, recargando datos...`);
        
        // Recargar datos para que los items del pedido eliminado desaparezcan
        await recargarDatos();
        
        console.log(`✅ PedidosHerreria: Items del pedido eliminado removidos`);
      }
    };

    // NUEVO: Escuchar asignaciones realizadas
    const handleAsignacionRealizada = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { pedidoId, asignaciones } = customEvent.detail;
      console.log(`🎯 PedidosHerreria: Asignación realizada detectada:`, { pedidoId, asignaciones });
      
      // Verificar si hay items de este pedido en la lista actual
      const itemsDelPedido = itemsIndividuales.filter(item => item.pedido_id === pedidoId);
      
      if (itemsDelPedido.length > 0) {
        console.log(`🎯 Asignación realizada en pedido con ${itemsDelPedido.length} items en PedidosHerreria, recargando datos...`);
        
        // Recargar datos para actualizar el estado de asignación
        await recargarDatos();
        
        console.log(`✅ PedidosHerreria: Estado de asignación actualizado`);
      }
    };

    // Suscribirse a los eventos personalizados
    window.addEventListener('cambioEstadoItem', handleCambioEstado);
    window.addEventListener('pedidoCancelado', handlePedidoCancelado);
    window.addEventListener('pedidoEliminado', handlePedidoEliminado);
    window.addEventListener('asignacionRealizada', handleAsignacionRealizada);

    // Cleanup: remover los listeners cuando el componente se desmonte
    return () => {
      window.removeEventListener('cambioEstadoItem', handleCambioEstado);
      window.removeEventListener('pedidoCancelado', handlePedidoCancelado);
      window.removeEventListener('pedidoEliminado', handlePedidoEliminado);
      window.removeEventListener('asignacionRealizada', handleAsignacionRealizada);
    };
  }, [itemsIndividuales]);

  // ...

  return (
    <Card className="max-w-4xl mx-auto mt-8 border-gray-200">
      <CardHeader>
        <CardTitle>Gestión de Items Individuales - PedidosHerreria</CardTitle>
        
        {/* Indicador de última actualización */}
        <div className="text-sm text-gray-600 mt-2">
          <span className="inline-flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Última actualización: {ultimaActualizacion.toLocaleTimeString()}
            <span className="text-gray-400">(Se actualiza cada 5 minutos)</span>
          </span>
        </div>
        
        {/* Controles de Filtro Mejorados */}
        <div className="flex gap-4 mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
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
          
          <div className="flex items-end gap-2">
            <Button 
              onClick={aplicarFiltros}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              Aplicar Filtros
            </Button>
            <Button 
              onClick={async () => {
                console.log('🔍 DEBUG: Consultando endpoint directamente...');
                try {
                  const response = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/herreria/`);
                  const data = await response.json();
                  console.log('🔍 DEBUG - Respuesta directa:', data);
                  console.log('🔍 DEBUG - Status:', response.status);
                  console.log('🔍 DEBUG - Headers:', Object.fromEntries(response.headers.entries()));
                  
                  // Debug detallado de los items
                  if (data.items && Array.isArray(data.items)) {
                    console.log('🔍 DEBUG - Items encontrados:', data.items.length);
                    console.log('🔍 DEBUG - Detalles de cada item:');
                    data.items.forEach((item: any, index: number) => {
                      console.log(`🔍 DEBUG - Item ${index + 1}:`, {
                        id: item.id,
                        pedido_id: item.pedido_id,
                        nombre: item.nombre,
                        estado_item: item.estado_item,
                        cliente_nombre: item.cliente_nombre,
                        fecha_creacion: item.fecha_creacion
                      });
                    });
                    
                    // Buscar específicamente nuestro pedido
                    const nuestroPedido = data.items.filter((item: any) => item.pedido_id === "68f2bc424dbb7f6039f6ec09");
                    console.log('🔍 DEBUG - Items del pedido 68f2bc424dbb7f6039f6ec09:', nuestroPedido);
                    
                    if (nuestroPedido.length === 0) {
                      console.log('❌ DEBUG - NO SE ENCONTRÓ EL PEDIDO');
                      console.log('🔍 DEBUG - Todos los pedido_ids disponibles:', data.items.map((item: any) => item.pedido_id));
                    }
                    
                    // Debug: Mostrar todos los estados de items
                    console.log('🔍 DEBUG - Estados de todos los items:', data.items.map((item: any) => ({
                      pedido_id: item.pedido_id,
                      nombre: item.nombre,
                      estado_item: item.estado_item,
                      fecha_creacion: item.fecha_creacion
                    })));
                    
                    // Debug: Contar items por estado
                    const estadosCount = data.items.reduce((acc: any, item: any) => {
                      const estado = item.estado_item || 'sin_estado';
                      acc[estado] = (acc[estado] || 0) + 1;
                      return acc;
                    }, {});
                    console.log('🔍 DEBUG - Conteo por estado:', estadosCount);
                  }
                } catch (error) {
                  console.error('🔍 DEBUG - Error:', error);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
            >
              Debug API
            </Button>
            <Button 
              onClick={() => {
                console.log('🔄 Recargando datos manualmente...');
                recargarDatos();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2"
            >
              🔄 Recargar Datos
            </Button>
            <Button 
              onClick={() => {
                console.clear(); // Limpiar consola primero
                console.log('🔍 DEBUG FECHAS SIMPLIFICADO');
                console.log('================================');
                
                const hoy = new Date();
                const hace7Dias = new Date(hoy);
                hace7Dias.setDate(hoy.getDate() - 7);
                
                console.log(`📅 Hoy: ${hoy.toLocaleDateString()}`);
                console.log(`📅 Hace 7 días: ${hace7Dias.toLocaleDateString()}`);
                console.log('');
                
                // Solo mostrar los primeros 3 items con información detallada
                console.log('🔍 PRIMEROS 3 ITEMS:');
                itemsIndividuales.slice(0, 3).forEach((item, index) => {
                  // Usar fecha_creacion como campo principal (que es el que tiene datos)
                  const fechaItem = new Date(item.fecha_creacion || 0);
                  
                  const esValido = !isNaN(fechaItem.getTime());
                  const esReciente = esValido && fechaItem >= hace7Dias;
                  
                  console.log(`Item ${index + 1}:`, {
                    nombre: item.nombre.substring(0, 30) + '...',
                    fechaItem: fechaItem.toLocaleDateString(),
                    fechaItemISO: fechaItem.toISOString(),
                    esValido,
                    esReciente,
                    campos_fecha: {
                      pedido_fecha_creacion: item.pedido_fecha_creacion,
                      fecha_creacion: item.fecha_creacion,
                      created_at: item.created_at,
                      fecha_asignacion: item.fecha_asignacion
                    }
                  });
                });
                
                // Contar items por rango de fechas
                const itemsRecientes = itemsIndividuales.filter(item => {
                  const fechaItem = new Date(item.fecha_creacion || 0);
                  return !isNaN(fechaItem.getTime()) && fechaItem >= hace7Dias;
                });
                
                const itemsHoy = itemsIndividuales.filter(item => {
                  const fechaItem = new Date(item.fecha_creacion || 0);
                  return !isNaN(fechaItem.getTime()) && fechaItem.toDateString() === hoy.toDateString();
                });
                
                const itemsEsteMes = itemsIndividuales.filter(item => {
                  const fechaItem = new Date(item.fecha_creacion || 0);
                  return !isNaN(fechaItem.getTime()) && 
                         fechaItem.getMonth() === hoy.getMonth() && 
                         fechaItem.getFullYear() === hoy.getFullYear();
                });
                
                console.log('');
                console.log('📊 RESUMEN:');
                console.log(`Total items: ${itemsIndividuales.length}`);
                console.log(`Items de hoy: ${itemsHoy.length}`);
                console.log(`Items últimos 7 días: ${itemsRecientes.length}`);
                console.log(`Items este mes (octubre 2025): ${itemsEsteMes.length}`);
                console.log(`Filtro actual: ${filtroFecha}`);
                
                if (itemsRecientes.length === 0) {
                  console.log('');
                  console.log('⚠️ PROBLEMA: No hay items recientes');
                  console.log('Posibles causas:');
                  console.log('1. Las fechas están en formato incorrecto');
                  console.log('2. Las fechas son muy antiguas');
                  console.log('3. El campo de fecha es diferente al esperado');
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2"
            >
              🔍 Debug Fechas
            </Button>
            <Button 
              onClick={inicializarItemsExistentes}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2"
            >
              🔧 Inicializar Items Existentes
            </Button>
            
            <Button 
              onClick={testBackendConnection}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 ml-2"
            >
              🔍 Probar Conexión Backend
            </Button>
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
          <div className="text-red-600 font-semibold py-4">{error}</div>
        ) : !Array.isArray(itemsIndividuales) || itemsIndividuales.length === 0 ? (
          <p className="text-gray-500">No hay items para gestionar.</p>
        ) : (
          <ul className="space-y-6">
            {itemsIndividuales
              .filter((item) => {
                // Mostrar items pendientes (0) y en proceso (1, 2, 3)
                const estadoValido = item.estado_item >= 0 && item.estado_item <= 3;
                
                // Filtro por fecha
                if (filtroFecha !== "todos") {
                  // Usar fecha_creacion como campo principal (que es el que tiene datos)
                  const fechaItem = new Date(item.fecha_creacion || 0);
                  const hoy = new Date();
                  
                  // Debug de fechas solo para los primeros 3 items para no saturar la consola
                  if (item.id === itemsIndividuales[0]?.id || item.id === itemsIndividuales[1]?.id || item.id === itemsIndividuales[2]?.id) {
                    console.log('🔍 Debug filtro fecha:', {
                      filtro: filtroFecha,
                      itemId: item.id,
                      pedidoId: item.pedido_id,
                      fechaItem: fechaItem.toLocaleDateString(),
                      fechaItemISO: fechaItem.toISOString(),
                      hoy: hoy.toLocaleDateString(),
                      hoyISO: hoy.toISOString(),
                      fechaValida: !isNaN(fechaItem.getTime()),
                      campo_usado: 'fecha_creacion',
                      valor_campo: item.fecha_creacion
                    });
                  }
                  
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
              .sort((a, b) => {
                // Ordenar por fecha de creación del pedido (más recientes primero)
                // Usar pedido_fecha_creacion si está disponible, sino fecha_creacion
                const fechaA = new Date(a.pedido_fecha_creacion || a.fecha_creacion || 0).getTime();
                const fechaB = new Date(b.pedido_fecha_creacion || b.fecha_creacion || 0).getTime();
                
                // Debug del ordenamiento
                console.log('🔄 Ordenando items:', {
                  itemA: { id: a.id, pedido_id: a.pedido_id, fecha: a.pedido_fecha_creacion || a.fecha_creacion },
                  itemB: { id: b.id, pedido_id: b.pedido_id, fecha: b.pedido_fecha_creacion || b.fecha_creacion },
                  fechaA: new Date(fechaA).toLocaleDateString(),
                  fechaB: new Date(fechaB).toLocaleDateString()
                });
                
                return fechaB - fechaA; // Descendente (más recientes primero)
              })
              .map((item) => {
                const progreso = progresoItems[item.id] || 0;
                return (
                  <li key={item.id} className="border rounded-xl bg-white shadow p-6 transition-all duration-300 hover:shadow-lg">
                    {/* Información del item individual */}
                    <div className="space-y-4">
                      {/* Header del item */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.nombre}</h3>
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
                          <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
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
                
                      
                      {/* Información de asignación */}
                      {item.empleado_asignado && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-800"><strong>Asignado a:</strong> {item.empleado_asignado}</p>
                          <p className="text-sm text-blue-600">Fecha asignación: {item.fecha_asignacion ? new Date(item.fecha_asignacion).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      )}
                      
                      {/* Componente de asignación - Solo mostrar si no hay empleado asignado */}
                      {!item.empleado_asignado ? (
                <div className="mt-4">
                  <AsignarArticulos
                            estado_general="independiente"
                    numeroOrden="independiente"
                            items={[item]} // Pasar solo este item individual
                    empleados={Array.isArray(dataEmpleados) ? dataEmpleados : []}
                            pedidoId={item.pedido_id}
                            tipoEmpleado={[]}
                          />
                        </div>
                      ) : (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">
                            ✅ Item asignado - No se puede reasignar hasta que se termine la asignación
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Ve al Dashboard de Asignaciones para terminar esta asignación
                          </p>
                        </div>
                      )}
                </div>
              </li>
                );
              })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default PedidosHerreria;
