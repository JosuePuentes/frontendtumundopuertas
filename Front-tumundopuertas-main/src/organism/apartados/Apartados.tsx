import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiUrl } from "@/lib/api";
import { Package, Eye, Receipt, Trash2, RefreshCw } from "lucide-react";

interface ItemApartado {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  cliente: string;
  cliente_nombre?: string;
  fecha_terminado?: string;
  cantidad: number;
}

const Apartados: React.FC = () => {
  const [apartados, setApartados] = useState<ItemApartado[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<ItemApartado | null>(null);

  const fetchApartados = async () => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = getApiUrl().replace('http://', 'https://');
      const res = await fetch(`${apiUrl}/pedidos/apartados/`);
      if (!res.ok) throw new Error("Error al obtener apartados");
      const data = await res.json();
      
      // Validar que la respuesta sea un array
      if (Array.isArray(data)) {
        setApartados(data);
      } else if (data && Array.isArray(data.apartados)) {
        setApartados(data.apartados);
      } else if (data && Array.isArray(data.items)) {
        setApartados(data.items);
      } else {
        console.error("Respuesta del API no es un array:", data);
        setApartados([]);
        setError("Formato de datos inválido del servidor");
      }
    } catch (err: any) {
      console.error("Error al obtener apartados:", err);
      setError(err.message || "Error desconocido al cargar apartados");
      setApartados([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartados();
  }, []);

  const handleVerDetalles = (item: ItemApartado) => {
    setSelectedItem(item);
  };

  const handleMarcarFacturado = async (item: ItemApartado) => {
    try {
      const apiUrl = getApiUrl().replace('http://', 'https://');
      const res = await fetch(`${apiUrl}/pedidos/apartados/${item._id}/marcar-facturado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error("Error al marcar como facturado");
      alert("Apartado marcado como facturado exitosamente");
      fetchApartados();
      setSelectedItem(null);
    } catch (err: any) {
      alert(`Error al marcar como facturado: ${err.message}`);
    }
  };

  const handleEliminar = async (item: ItemApartado) => {
    if (!confirm("¿Está seguro de que desea eliminar este apartado?")) return;
    
    try {
      const apiUrl = getApiUrl().replace('http://', 'https://');
      const res = await fetch(`${apiUrl}/pedidos/apartados/${item._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("Error al eliminar apartado");
      alert("Apartado eliminado exitosamente");
      fetchApartados();
      setSelectedItem(null);
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="w-full max-w-7xl mx-auto my-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-6 h-6" />
              Apartados
            </CardTitle>
            <Button
              onClick={fetchApartados}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-2"></span>
              <span className="text-blue-600 font-semibold">Cargando apartados...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 font-semibold py-4">{error}</div>
          ) : apartados.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg font-medium">No hay apartados registrados</p>
              <p className="text-gray-500 text-sm mt-2">Los apartados aparecerán aquí cuando sean registrados</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha Terminado</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apartados.map((item) => (
                      <TableRow key={item._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{item.codigo}</TableCell>
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.descripcion}</TableCell>
                        <TableCell>{item.cliente_nombre || item.cliente}</TableCell>
                        <TableCell>{formatDate(item.fecha_terminado)}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleVerDetalles(item)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </Button>
                            <Button
                              onClick={() => handleMarcarFacturado(item)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 bg-green-50 hover:bg-green-100"
                            >
                              <Receipt className="w-4 h-4" />
                              Facturado
                            </Button>
                            <Button
                              onClick={() => handleEliminar(item)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 bg-red-50 hover:bg-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      {selectedItem && (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detalles del Apartado</CardTitle>
              <Button
                onClick={() => setSelectedItem(null)}
                variant="ghost"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Código:</p>
                  <p className="font-semibold">{selectedItem.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cantidad:</p>
                  <p className="font-semibold">{selectedItem.cantidad}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nombre:</p>
                <p className="font-semibold">{selectedItem.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Descripción:</p>
                <p className="font-semibold">{selectedItem.descripcion}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Cliente:</p>
                  <p className="font-semibold">{selectedItem.cliente_nombre || selectedItem.cliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha Terminado:</p>
                  <p className="font-semibold">{formatDate(selectedItem.fecha_terminado)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => handleMarcarFacturado(selectedItem)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Receipt className="w-4 h-4" />
                  Marcar como Facturado
                </Button>
                <Button
                  onClick={() => handleEliminar(selectedItem)}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Apartados;

