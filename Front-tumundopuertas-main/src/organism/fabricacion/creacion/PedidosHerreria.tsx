import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePedido } from "@/hooks/usePedido";
import DetalleHerreria from "./DetalleHerreria";
import { useEmpleado } from "@/hooks/useEmpleado";
import AsignarArticulos from "@/organism/asignar/AsignarArticulos";
import DiagnosticoBackend from "@/components/ui/DiagnosticoBackend";

// Tipos explícitos
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
  costoProduccion: number; // Nuevo campo
  detalleitem?: string;
  imagenes?: string[];
}

interface PedidoSeguimiento {
  orden: number;
  nombre_subestado: string;
  estado: string;
  asignado_a?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  notas?: string;
}

interface Pedido {
  _id: string;
  cliente_id: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  estado_general: string;
  items: PedidoItem[];
  seguimiento: PedidoSeguimiento[];
}

const PedidosHerreria: React.FC = () => {
  const { fetchPedido, dataPedidos } = usePedido();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [mostrarDiagnostico, setMostrarDiagnostico] = useState(false);
  const { dataEmpleados, fetchEmpleado } = useEmpleado();
  // La lógica de asignaciones se delega al hijo

  useEffect(() => {
    setLoading(true);
    fetchPedido("/pedidos/estado/?estado_general=orden1&estado_general=pendiente&/")
      .catch(() => setError("Error al cargar los pedidos"))
      .finally(() => setLoading(false));
    fetchEmpleado(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/empleados/all/`);
    console.log("Pedidos cargados:", dataPedidos);
  }, []);

  // ...

  return (
    <Card className="max-w-3xl mx-auto mt-8 border-gray-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Pedidos Herreria</CardTitle>
          <Button
            onClick={() => setMostrarDiagnostico(true)}
            variant="outline"
            className="flex items-center gap-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          >
            🚨 Diagnosticar Errores 500
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-2"></span>
            <span className="text-blue-600 font-semibold">Cargando pedidos...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 font-semibold py-4">{error}</div>
        ) : !Array.isArray(dataPedidos) || dataPedidos.length === 0 ? (
          <p className="text-gray-500">No hay pedidos pendientes.</p>
        ) : (
          <ul className="space-y-8">
            {(dataPedidos as Pedido[]).map((pedido) => (
              <li key={pedido._id} className="border rounded-xl bg-white shadow p-4 transition-all duration-300 hover:shadow-lg">
                <DetalleHerreria pedido={pedido} />
                <div className="mt-4">
                  <AsignarArticulos
                    estado_general={"orden1"}
                    nuevo_estado_general="orden2"
                    numeroOrden="1"
                    items={pedido.items}
                    empleados={Array.isArray(dataEmpleados) ? dataEmpleados : []}
                    pedidoId={pedido._id}
                    tipoEmpleado={["herreria","ayudante"]}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      
      {/* Modal de diagnóstico del backend */}
      <Dialog open={mostrarDiagnostico} onOpenChange={setMostrarDiagnostico}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔍 Diagnóstico del Backend - Errores 500</DialogTitle>
          </DialogHeader>
          <DiagnosticoBackend />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PedidosHerreria;
