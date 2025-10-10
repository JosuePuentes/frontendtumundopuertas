import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { getHistorialMetodo } from "../../lib/api";
import type { MetodoPago } from "../../hooks/useMetodosPago";

interface Transaccion {
  id: string;
  metodo_pago_id: string;
  tipo: "deposito" | "transferir";
  monto: number;
  concepto: string;
  fecha: string;
}

interface HistorialTransaccionesProps {
  isOpen: boolean;
  onClose: () => void;
  metodo: MetodoPago;
}

const HistorialTransacciones = ({ isOpen, onClose, metodo }: HistorialTransaccionesProps) => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && metodo.id) {
      fetchHistorial();
    }
  }, [isOpen, metodo.id]);

  const fetchHistorial = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHistorialMetodo(metodo.id!);
      setTransacciones(data);
    } catch (err: any) {
      setError(err.message || "Error al obtener historial");
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonto = (monto: number, tipo: string) => {
    const signo = tipo === "deposito" ? "+" : "-";
    return `${signo}${monto.toFixed(2)}`;
  };

  const getTipoColor = (tipo: string) => {
    return tipo === "deposito" ? "text-green-600" : "text-red-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Historial de Transacciones - {metodo.nombre}</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-auto max-h-[60vh]">
          {loading && <p className="text-center py-4">Cargando historial...</p>}
          {error && <p className="text-red-500 text-center py-4">{error}</p>}
          
          {!loading && !error && (
            <>
              {transacciones.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No hay transacciones registradas</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Concepto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacciones.map((transaccion) => (
                      <TableRow key={transaccion.id}>
                        <TableCell>{formatFecha(transaccion.fecha)}</TableCell>
                        <TableCell>
                          <span className={`capitalize ${getTipoColor(transaccion.tipo)}`}>
                            {transaccion.tipo}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${getTipoColor(transaccion.tipo)}`}>
                            {formatMonto(transaccion.monto, transaccion.tipo)}
                          </span>
                        </TableCell>
                        <TableCell>{transaccion.concepto}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistorialTransacciones;