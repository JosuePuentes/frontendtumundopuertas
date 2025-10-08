import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMetodoPago } from "@/lib/api";
import type { MetodoPago } from "@/hooks/useMetodosPago";

interface CrearMetodoPagoProps {
  onCreated: () => void;
}

const CrearMetodoPago = ({ onCreated }: CrearMetodoPagoProps) => {
  const [newMetodo, setNewMetodo] = useState<Omit<MetodoPago, '_id'>>({
    nombre: "",
    banco: "",
    titular: "",
    numero_cuenta: "",
    moneda: "dolar",
    saldo: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMetodo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: "dolar" | "bs") => {
    setNewMetodo((prev) => ({ ...prev, moneda: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createMetodoPago(newMetodo);
      onCreated();
    } catch (err: any) {
      setError(err.message || "Error al crear el método de pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Método de Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">Nombre</Label>
              <Input id="nombre" name="nombre" value={newMetodo.nombre} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banco" className="text-right">Banco</Label>
              <Input id="banco" name="banco" value={newMetodo.banco} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="titular" className="text-right">Titular</Label>
              <Input id="titular" name="titular" value={newMetodo.titular} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numero_cuenta" className="text-right">Nro. Cuenta</Label>
              <Input id="numero_cuenta" name="numero_cuenta" value={newMetodo.numero_cuenta} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="moneda" className="text-right">Moneda</Label>
                <Select onValueChange={handleSelectChange} defaultValue={newMetodo.moneda}>
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
            <Button type="submit" disabled={loading}>{loading ? "Creando..." : "Crear"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CrearMetodoPago;