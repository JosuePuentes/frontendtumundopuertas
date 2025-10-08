import { useHistorial } from "../../hooks/useHistorial";
import type { MetodoPago } from "../../hooks/useMetodosPago";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

interface HistorialTransaccionesProps {
  isOpen: boolean;
  onClose: () => void;
  metodo: MetodoPago;
}

const HistorialTransacciones = ({ isOpen, onClose, metodo }: HistorialTransaccionesProps) => {
  const { transacciones, loading, error } = useHistorial(isOpen ? metodo.id! : null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historial de Transacciones para {metodo.nombre}</DialogTitle>
        </DialogHeader>
        <div>
          {loading && <p>Cargando historial...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transacciones.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.fecha).toLocaleString()}</TableCell>
                  <TableCell>{t.tipo}</TableCell>
                  <TableCell>{t.monto.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistorialTransacciones;
