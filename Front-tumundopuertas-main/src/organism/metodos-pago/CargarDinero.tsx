import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { depositarDinero } from "../../lib/api";
import type { MetodoPago } from "../../hooks/useMetodosPago";

interface CargarDineroProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedMetodo: MetodoPago) => void;
  metodo: MetodoPago;
}

const CargarDinero = ({ isOpen, onClose, onSuccess, metodo }: CargarDineroProps) => {
  const [monto, setMonto] = useState(0);
  const [concepto, setConcepto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que el método tenga ID
    if (!metodo.id || metodo.id === 'undefined') {
      setError("Error: Método de pago no válido. Por favor, recarga la página.");
      return;
    }
    
    // Validar monto
    if (monto <= 0) {
      setError("El monto debe ser mayor a cero.");
      return;
    }
    
    // Validar concepto
    if (!concepto.trim()) {
      setError("El concepto es obligatorio.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log("Depositando:", { metodoId: metodo.id, monto, concepto });
      const updatedMetodo = await depositarDinero(metodo.id, monto, concepto);
      onSuccess(updatedMetodo);
      setMonto(0);
      setConcepto("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al depositar dinero");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Depositar Dinero a {metodo.nombre}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monto" className="text-right">Monto</Label>
              <Input 
                id="monto" 
                type="number" 
                value={monto} 
                onChange={(e) => setMonto(Number(e.target.value))} 
                className="col-span-3" 
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="concepto" className="text-right">Concepto</Label>
              <Input 
                id="concepto" 
                type="text" 
                value={concepto} 
                onChange={(e) => setConcepto(e.target.value)} 
                className="col-span-3" 
                placeholder="Ej: Depósito inicial"
                required
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Depositando..." : "Depositar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CargarDinero;
