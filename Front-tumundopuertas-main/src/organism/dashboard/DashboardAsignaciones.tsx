import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Package } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface Asignacion {
  _id: string;
  pedido_id: string;
  item_id: string;
  empleado_id: string;
  empleado_nombre: string;
  modulo: string;
  estado: string;
  fecha_asignacion: string;
  descripcionitem: string;
  detalleitem: string;
  cliente_nombre: string;
  costo_produccion: number;
  imagenes: string[];
}

const DashboardAsignaciones: React.FC = () => {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función simplificada para cargar asignaciones
  const cargarAsignaciones = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando asignaciones...');
      
      // Intentar primero el endpoint optimizado /asignaciones
      const response = await fetch(`${getApiUrl()}/asignaciones`);
      
      if (response.ok) {
        const data = await response.json();
        const asignacionesData = data.asignaciones || [];
        console.log('✅ Asignaciones obtenidas:', asignacionesData.length);
        setAsignaciones(asignacionesData);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
    } catch (err: any) {
      console.error('❌ Error al cargar asignaciones:', err);
      setError(`Error al cargar asignaciones: ${err.message}`);
      setAsignaciones([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos solo al montar el componente
  useEffect(() => {
    cargarAsignaciones();
  }, []);

  // Función para obtener color del módulo
  const obtenerColorModulo = (modulo: string) => {
    const colores: { [key: string]: string } = {
      herreria: "bg-orange-100 text-orange-800",
      masillar: "bg-blue-100 text-blue-800", 
      preparar: "bg-green-100 text-green-800",
      facturar: "bg-purple-100 text-purple-800"
    };
    return colores[modulo] || "bg-gray-100 text-gray-800";
  };

  // Función para obtener icono del estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "en_proceso":
        return "🔄";
      case "terminado":
        return "✅";
      default:
        return "⏳";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Asignaciones</h1>
          <p className="text-gray-600">Gestiona todas las asignaciones de producción</p>
        </div>
        <Button
          onClick={cargarAsignaciones}
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </Button>
      </div>

      {/* Mensaje de estado */}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 border border-red-300">
          {error}
        </div>
      )}

      {/* Estadísticas simples */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Asignaciones</p>
                <p className="text-2xl font-bold text-blue-600">{asignaciones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-orange-600">
                  {asignaciones.filter(a => a.estado === "en_proceso").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {asignaciones.filter(a => a.estado === "terminado").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empleados Activos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(asignaciones.map(a => a.empleado_nombre)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de asignaciones */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-600 font-semibold">Cargando asignaciones...</span>
        </div>
      ) : asignaciones.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay asignaciones</h3>
          <p className="text-gray-500">
            {error 
              ? "Error al cargar las asignaciones. Verifica que el backend esté funcionando."
              : "No se encontraron asignaciones en el sistema."
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {asignaciones.map((asignacion) => (
            <Card key={asignacion._id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {asignacion.descripcionitem}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={obtenerColorModulo(asignacion.modulo)}>
                        {asignacion.modulo.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <span>{getEstadoIcon(asignacion.estado)}</span>
                        <span className="text-sm text-gray-600">
                          {asignacion.estado.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Asignado a:</p>
                    <p className="font-semibold">{asignacion.empleado_nombre}</p>
                    <p className="text-sm text-gray-500">
                      ${asignacion.costo_produccion.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Cliente:</p>
                    <p className="font-medium">{asignacion.cliente_nombre || "Sin cliente"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pedido:</p>
                    <p className="font-medium">#{asignacion.pedido_id.slice(-4)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de asignación:</p>
                    <p className="font-medium">
                      {new Date(asignacion.fecha_asignacion).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Item ID:</p>
                    <p className="font-medium">{asignacion.item_id}</p>
                  </div>
                </div>

                {asignacion.detalleitem && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Detalles:</p>
                    <p className="text-sm bg-gray-50 p-2 rounded border">
                      {asignacion.detalleitem}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardAsignaciones;