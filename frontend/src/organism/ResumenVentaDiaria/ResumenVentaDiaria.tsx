import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VentaDiaria {
  fecha: string;
  total_venta: number;
}

const ResumenVentaDiaria = () => {
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().slice(0, 10));
  const [ventas, setVentas] = useState<VentaDiaria[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVentasDiarias = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/pedidos/venta-diaria/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
      );
      if (!response.ok) {
        throw new Error("Error al obtener los datos de venta diaria");
      }
      const data: VentaDiaria[] = await response.json();
      setVentas(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Venta Diaria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <Input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          <Button onClick={fetchVentasDiarias} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Total Venta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.map((venta) => (
              <TableRow key={venta.fecha}>
                <TableCell>{venta.fecha}</TableCell>
                <TableCell className="text-right">
                  {typeof venta.total_venta === 'number' ? `$${venta.total_venta.toFixed(2)}` : '$0.00'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ResumenVentaDiaria;