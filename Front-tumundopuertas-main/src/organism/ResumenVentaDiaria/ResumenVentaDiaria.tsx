import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api"; // Import the centralized api function

interface Abono {
  pedido_id: string;
  cliente_nombre: string;
  fecha: string;
  monto: number;
  metodo_pago_nombre?: string;
}

interface VentaDiariaResponse {
  total_ingresos: number;
  abonos: Abono[];
  ingresos_por_metodo: { [key: string]: number };
}

const ResumenVentaDiaria: React.FC = () => {
  const [data, setData] = useState<VentaDiariaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const fetchVentaDiaria = async () => {
    if (!fechaInicio || !fechaFin) {
      setError("Por favor, selecciona un rango de fechas.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("fecha_inicio", fechaInicio);
      params.append("fecha_fin", fechaFin);

      const responseData: VentaDiariaResponse = await api(`/pedidos/venta-diaria?${params.toString()}`);
      setData(responseData);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-md rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800">
          Resumen de Venta Diaria
        </CardTitle>
        <p className="text-sm text-gray-500">
          Consulta los ingresos por abonos en un rango de fechas.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="sm:w-1/3"
            placeholder="Fecha inicio"
          />
          <Input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="sm:w-1/3"
            placeholder="Fecha fin"
          />
          <Button onClick={fetchVentaDiaria} className="sm:w-auto w-full">
            Buscar
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8 text-gray-600">
            <Loader2 className="animate-spin w-6 h-6 mr-2" />
            Cargando resumen...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center text-red-600 py-6">
            <AlertCircle className="w-5 h-5 mr-2" />
            Error: {error}
          </div>
        ) : data && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-right font-bold text-2xl mt-6 p-4 bg-green-100 rounded-md text-green-800">
                Total Ingresos: ${(data.total_ingresos || 0).toFixed(2)}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Ingresos por Método de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método de Pago</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(data.ingresos_por_metodo || {}).map(([metodo, total]) => (
                        <TableRow key={metodo}>
                          <TableCell>{metodo}</TableCell>
                          <TableCell>${total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="overflow-x-auto mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.abonos || []).map((abono, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {abono.pedido_id}
                      </TableCell>
                      <TableCell>{abono.cliente_nombre}</TableCell>
                      <TableCell>
                        {new Date(abono.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{abono.metodo_pago_nombre || "N/A"}</TableCell>
                      <TableCell>${(abono.monto || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumenVentaDiaria;