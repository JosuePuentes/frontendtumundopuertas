import React, { useEffect, useState } from "react";
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
}

const MonitorPedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [shouldSearch, setShouldSearch] = useState(true); // Cargar automáticamente al inicio
  const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:8002").replace('http://', 'https://');

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
  const [mostrarCompletados, setMostrarCompletados] = useState<boolean>(false);
  const [mostrarCancelados, setMostrarCancelados] = useState<boolean>(false);

  useEffect(() => {
    if (!shouldSearch) return;
    const fetchPedidos = async () => {
      setLoading(true);
      try {
        console.log('🔄 Cargando pedidos usando endpoint optimizado /pedidos/cancelables/...');
        
        // NUEVO: Usar el endpoint optimizado para pedidos cancelables
        let url = `${apiUrl}/pedidos/cancelables/?`;
        if (fechaInicio && fechaFin) {
          url += `fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&`;
        }
        url += `ordenar=fecha_desc&`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        console.log('✅ Pedidos obtenidos del endpoint optimizado:', Array.isArray(data) ? data.length : 0);
        setPedidos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('❌ Error al cargar pedidos:', error);
        setPedidos([]);
      }
      setLoading(false);
      setShouldSearch(false);
    };
    fetchPedidos();
  }, [shouldSearch, apiUrl, fechaInicio, fechaFin]);

  // Escuchar eventos de cancelación para actualizar la lista
  useEffect(() => {
    const handlePedidoCancelado = () => {
      console.log('🔄 Pedido cancelado detectado, recargando lista...');
      setShouldSearch(true);
    };

    window.addEventListener('pedidoCancelado', handlePedidoCancelado);
    return () => {
      window.removeEventListener('pedidoCancelado', handlePedidoCancelado);
    };
  }, []);


  const pedidosFiltrados = pedidos
    .filter((p) => {
      // Filtro por búsqueda de texto
      const coincideBusqueda = 
        (p.cliente_nombre?.toLowerCase?.().includes(search.toLowerCase()) || "") ||
        (p.estado_general?.toLowerCase?.().includes(search.toLowerCase()) || "") ||
        (p._id?.includes(search) || "");

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

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Monitor de Pedidos</h2>
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Buscar por cliente, estado o ID..."
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
              {pedidos.filter(p => p.estado_general === "orden6" || p.estado_general === "completado").length} completados • 
              {pedidos.filter(p => p.estado_general === "cancelado").length} cancelados • 
              {pedidos.filter(p => p.estado_general !== "orden6" && p.estado_general !== "completado" && p.estado_general !== "cancelado").length} activos
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
              {mostrarCompletados || mostrarCancelados 
                ? "Intenta ajustar los filtros de búsqueda o fechas"
                : "Los pedidos completados y cancelados están ocultos por defecto. Usa las casillas de arriba para mostrarlos."
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
