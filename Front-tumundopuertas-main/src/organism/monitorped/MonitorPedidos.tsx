import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import PedidoConProgreso from "@/components/ui/PedidoConProgreso";

interface Pedido {
  _id: string;
  cliente_nombre: string;
  estado_general: string;
  fecha_creacion?: string;
  puede_cancelar?: boolean;
  items?: Array<{
    nombre: string;
    descripcion: string;
    cantidad: number;
    costoProduccion?: string;
  }>;
  adicionales?: Array<{
    descripcion?: string;
    precio: number;
    cantidad?: number; // default 1
  }>;
}

const MonitorPedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [shouldSearch, setShouldSearch] = useState(true); // Cargar automáticamente al inicio
  const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:8002").replace('http://', 'https://');
  const isInitialLoad = useRef(true);

  const ordenMap: Record<string, string> = {
    orden1: "Herreria",
    orden2: "Masillar/Pintar",
    orden3: "Manillar",
    orden4: "Facturación",
    orden5: "Envío",
    orden6: "Completados",
    cancelado: "Cancelado",
  };

  const [ordenFilter, setOrdenFilter] = useState<string>("");
  const [mostrarCompletados, setMostrarCompletados] = useState<boolean>(true); // Mostrar completados por defecto
  const [mostrarCancelados, setMostrarCancelados] = useState<boolean>(true); // Mostrar cancelados por defecto

  // OPTIMIZACIÓN: fetchPedidos con useCallback para evitar recreaciones
  const fetchPedidos = useCallback(async (silent = false) => {
    // Solo mostrar loading en la carga inicial, no en actualizaciones silenciosas
    if (!silent && isInitialLoad.current) {
      setLoading(true);
    }
    try {
      // Usar el endpoint optimizado para todos los pedidos
      // Si no hay fechas, cargar TODOS los pedidos sin filtro
      const params = new URLSearchParams();
      
      // Solo agregar fechas si ambas están presentes
      if (fechaInicio && fechaFin) {
        params.append('fecha_inicio', fechaInicio);
        params.append('fecha_fin', fechaFin);
      }
      
      // Agregar ordenamiento
      params.append('ordenar', 'fecha_desc');
      
      // Construir URL con parámetros
      const queryString = params.toString();
      const url = `${apiUrl}/pedidos/all/${queryString ? `?${queryString}` : ''}`;
      
      console.log('🔍 Cargando pedidos desde:', url);
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('✅ Pedidos recibidos:', Array.isArray(data) ? data.length : 0);
      
      setPedidos(Array.isArray(data) ? data : []);
      isInitialLoad.current = false;
    } catch (error) {
      console.error('❌ Error al cargar pedidos:', error);
      setPedidos([]);
      isInitialLoad.current = false;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
    setShouldSearch(false);
  }, [apiUrl, fechaInicio, fechaFin]);

  useEffect(() => {
    if (!shouldSearch) return;
    const isFirstLoad = isInitialLoad.current;
    fetchPedidos(!isFirstLoad); // Silenciosa después de carga inicial
  }, [shouldSearch, fetchPedidos]);

  // Escuchar eventos de cancelación para actualizar la lista
  useEffect(() => {
    const handlePedidoCancelado = () => {
      fetchPedidos(true); // Actualización silenciosa
    };

    const handleActualizarPedido = (event: CustomEvent) => {
      const { pedidoId, nuevoEstado } = event.detail;
      
      // Actualizar el estado local del pedido inmediatamente
      setPedidos(prevPedidos => 
        prevPedidos.map(pedido => 
          pedido._id === pedidoId 
            ? { ...pedido, estado_general: nuevoEstado }
            : pedido
        )
      );
      
      // También recargar la lista completa después de un breve delay (silenciosa)
      setTimeout(() => {
        fetchPedidos(true); // Actualización silenciosa
      }, 500); // Reducido de 1000ms a 500ms
    };

    window.addEventListener('pedidoCancelado', handlePedidoCancelado);
    window.addEventListener('actualizarPedido', handleActualizarPedido as EventListener);
    
    return () => {
      window.removeEventListener('pedidoCancelado', handlePedidoCancelado);
      window.removeEventListener('actualizarPedido', handleActualizarPedido as EventListener);
    };
  }, [fetchPedidos]);

  // OPTIMIZACIÓN: Memoizar contadores para evitar recalcular en cada render
  const contadores = useMemo(() => {
    const completados = pedidos.filter(p => p.estado_general === "orden6" || p.estado_general === "completado").length;
    const cancelados = pedidos.filter(p => p.estado_general === "cancelado").length;
    const activos = pedidos.filter(p => p.estado_general !== "orden6" && p.estado_general !== "completado" && p.estado_general !== "cancelado").length;
    return { completados, cancelados, activos };
  }, [pedidos]);


  // OPTIMIZACIÓN: Memoizar pedidos filtrados para evitar recalcular en cada render
  const pedidosFiltrados = useMemo(() => {
    return pedidos
      .filter((p) => {
        // Filtro por búsqueda de texto (incluye nombre de items, descripción y código)
        const searchLower = search.toLowerCase();
        const coincideBusqueda = 
          (p.cliente_nombre?.toLowerCase?.().includes(searchLower) || false) ||
          (p.estado_general?.toLowerCase?.().includes(searchLower) || false) ||
          (p._id?.includes(search) || false) ||
          // Buscar en nombres, descripciones y códigos de items
          (p.items?.some(item => {
            const itemNombre = item.nombre?.toLowerCase?.() || '';
            const itemDescripcion = item.descripcion?.toLowerCase?.() || '';
            const itemCodigo = (item as any).codigo?.toLowerCase?.() || '';
            return itemNombre.includes(searchLower) || 
                   itemDescripcion.includes(searchLower) ||
                   itemCodigo.includes(searchLower);
          }) || false);

        // Filtro por estado específico si está seleccionado
        const coincideEstado = ordenFilter === "" || p.estado_general === ordenFilter;

        // Filtro automático: excluir completados y cancelados por defecto
        const esCompletado = p.estado_general === "orden6" || p.estado_general === "completado";
        const esCancelado = p.estado_general === "cancelado";
        
        // Si no se quiere mostrar completados/cancelados, excluirlos
        const mostrarEstePedido = 
          (!esCompletado || mostrarCompletados) && 
          (!esCancelado || mostrarCancelados);

        return coincideBusqueda && coincideEstado && mostrarEstePedido;
      })
      .sort((a, b) => {
        // Ordenar por fecha más reciente primero
        const fechaA = new Date(a.fecha_creacion || 0).getTime();
        const fechaB = new Date(b.fecha_creacion || 0).getTime();
        return fechaB - fechaA; // Más reciente primero
      });
  }, [pedidos, search, ordenFilter, mostrarCompletados, mostrarCancelados]);

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Monitor de Pedidos</h2>
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="🔍 Buscar por cliente, estado, ID, nombre de item, descripción o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/3"
        />
        <Input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="w-1/6"
        />
        <Input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="w-1/6"
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          onClick={() => setShouldSearch(true)}
        >
          Buscar
        </button>
      </div>
        <div className="flex flex-col gap-4 mb-4">
          <select
            className="border rounded px-2 py-1 w-1/3"
            value={ordenFilter}
            onChange={(e) => setOrdenFilter(e.target.value)}
          >
            <option value="">Todos los estados activos</option>
            {Object.entries(ordenMap).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          {/* Controles para mostrar pedidos completados y cancelados */}
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mostrarCompletados}
                onChange={(e) => setMostrarCompletados(e.target.checked)}
                className="rounded"
              />
              <span className="text-green-700 font-medium">Mostrar pedidos completados</span>
            </label>
            
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mostrarCancelados}
                onChange={(e) => setMostrarCancelados(e.target.checked)}
                className="rounded"
              />
              <span className="text-red-700 font-medium">Mostrar pedidos cancelados</span>
            </label>
          </div>
          
          {/* Información de filtros activos */}
          <div className="text-sm text-gray-600">
            {!mostrarCompletados && !mostrarCancelados && (
              <span>✅ Mostrando solo pedidos activos (completados y cancelados ocultos)</span>
            )}
            {mostrarCompletados && !mostrarCancelados && (
              <span>✅ Mostrando pedidos activos y completados</span>
            )}
            {!mostrarCompletados && mostrarCancelados && (
              <span>✅ Mostrando pedidos activos y cancelados</span>
            )}
            {mostrarCompletados && mostrarCancelados && (
              <span>✅ Mostrando todos los pedidos</span>
            )}
          </div>
        </div>
      {/* Contador de pedidos */}
      {!loading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-800">
                📊 Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos
              </span>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                📅 Ordenados por fecha (más recientes primero)
              </span>
            </div>
            <div className="text-xs text-blue-600">
              {contadores.completados} completados • {contadores.cancelados} cancelados • {contadores.activos} activos
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div>Cargando pedidos...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="text-gray-500 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">No hay pedidos para mostrar</p>
            <p className="text-sm">
              {pedidos.length === 0
                ? "No se encontraron pedidos en la base de datos. Verifica la conexión con el servidor."
                : "Intenta ajustar los filtros de búsqueda o fechas para encontrar pedidos."
              }
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {pedidosFiltrados.map((pedido) => (
            <PedidoConProgreso
              key={pedido._id}
              pedido={pedido}
              ordenMap={ordenMap}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default MonitorPedidos;
