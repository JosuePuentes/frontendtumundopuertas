import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { updateMetodoPago } from "../../lib/api";
import type { MetodoPago } from "../../hooks/useMetodosPago";

interface ModificarMetodoPagoProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  metodo: MetodoPago;
}

const ModificarMetodoPago = ({ isOpen, onClose, onUpdated, metodo }: ModificarMetodoPagoProps) => {
  const [updatedMetodo, setUpdatedMetodo] = useState<MetodoPago>(metodo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUpdatedMetodo(metodo);
  }, [metodo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdatedMetodo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: "dolar" | "bs") => {
    setUpdatedMetodo((prev) => ({ ...prev, moneda: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateMetodoPago(updatedMetodo.id!, updatedMetodo);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al modificar el método de pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modificar Método de Pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">Nombre</Label>
              <Input id="nombre" name="nombre" value={updatedMetodo.nombre} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banco" className="text-right">Banco</Label>
              <Input id="banco" name="banco" value={updatedMetodo.banco} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="titular" className="text-right">Titular</Label>
              <Input id="titular" name="titular" value={updatedMetodo.titular} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numero_cuenta" className="text-right">Nro. Cuenta</Label>
              <Input id="numero_cuenta" name="numero_cuenta" value={updatedMetodo.numero_cuenta} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="moneda" className="text-right">Moneda</Label>
                <Select onValueChange={handleSelectChange} value={updatedMetodo.moneda}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Seleccione una moneda" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="dolar">Dólar</SelectItem>
                        <SelectItem value="bs">Bolívares</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar Cambios"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModificarMetodoPago;
