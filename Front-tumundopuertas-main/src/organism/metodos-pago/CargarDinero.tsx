import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { cargarDinero } from "../../lib/api";
import type { MetodoPago } from "../../hooks/useMetodosPago";

interface CargarDineroProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedMetodo: MetodoPago) => void;
  metodo: MetodoPago;
}

const CargarDinero = ({ isOpen, onClose, onSuccess, metodo }: CargarDineroProps) => {
  const [monto, setMonto] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updatedMetodo = await cargarDinero(metodo.id!, monto);
      onSuccess(updatedMetodo);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al cargar dinero");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cargar Dinero a {metodo.nombre}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monto" className="text-right">Monto</Label>
              <Input id="monto" type="number" value={monto} onChange={(e) => setMonto(Number(e.target.value))} className="col-span-3" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? "Cargando..." : "Cargar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CargarDinero;
