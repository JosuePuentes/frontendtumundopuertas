import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import PedidoConProgreso from "@/components/ui/PedidoConProgreso";

interface Pedido {
  _id: string;
  cliente_nombre: string;
  estado_general: string;
  fecha_creacion?: string;
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
  const [shouldSearch, setShouldSearch] = useState(false);
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
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<Record<string, string>>({});
  const [actualizando, setActualizando] = useState<string>("");

  useEffect(() => {
    if (!shouldSearch) return;
    const fetchPedidos = async () => {
      setLoading(true);
      try {
        let url = `${apiUrl}/pedidos/filtrar/por-fecha/?`;
        if (fechaInicio && fechaFin) {
          url += `fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setPedidos(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
      setShouldSearch(false);
    };
    fetchPedidos();
  }, [shouldSearch, apiUrl, fechaInicio, fechaFin]);

  const handleActualizarEstado = async (pedidoId: string) => {
    if (!estadoSeleccionado[pedidoId]) return;
    setActualizando(pedidoId);
    try {
      const res = await fetch(`${apiUrl}/pedidos/actualizar-estado-general/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedidoId, nuevo_estado_general: estadoSeleccionado[pedidoId] }),
      });
      if (!res.ok) throw new Error("Error actualizando estado");
      // Actualizar localmente el estado
      setPedidos((prev) => prev.map((p) => p._id === pedidoId ? { ...p, estado_general: estadoSeleccionado[pedidoId] } : p));
    } catch {}
    setActualizando("");
  };

  const pedidosFiltrados = pedidos.filter(
    (p) =>
      (ordenFilter === "" || p.estado_general === ordenFilter) &&
      ((p.cliente_nombre?.toLowerCase?.().includes(search.toLowerCase()) || "") ||
        (p.estado_general?.toLowerCase?.().includes(search.toLowerCase()) || "") ||
        (p._id?.includes(search) || ""))
  );

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
        <select
          className="border rounded px-2 py-1 w-1/3 mb-4"
          value={ordenFilter}
          onChange={(e) => setOrdenFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ordenMap).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      {loading ? (
        <div>Cargando pedidos...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="text-gray-500">No hay pedidos para mostrar.</div>
      ) : (
        <ul className="space-y-4">
          {pedidosFiltrados.map((pedido) => (
            <PedidoConProgreso
              key={pedido._id}
              pedido={pedido}
              ordenMap={ordenMap}
              estadoSeleccionado={estadoSeleccionado}
              setEstadoSeleccionado={setEstadoSeleccionado}
              actualizando={actualizando}
              onActualizarEstado={handleActualizarEstado}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default MonitorPedidos;
