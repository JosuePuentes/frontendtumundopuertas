import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useMetodosPago } from "@/hooks/useMetodosPago";

interface PagoManagerProps {
  pedidoId: string;
  pagoInicial?: string; // "sin pago" | "abonado" | "pagado"
}

const PagoManager: React.FC<PagoManagerProps> = ({ pedidoId, pagoInicial }) => {
  const [pago, setPago] = useState<string>(pagoInicial || "sin pago");
  const [monto, setMonto] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { data: metodosPago, loading: metodosLoading, fetchMetodosPago } = useMetodosPago();

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "https://localhost:3000";
    fetchMetodosPago(`${apiUrl}/metodos-pago/all`);
  }, []);

  const actualizarPago = async () => {
    if (!pago) return alert("Selecciona un estado de pago");
    if (monto <= 0) return alert("Ingresa un monto válido");
    if (!metodoPago) return alert("Selecciona un método de pago");

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/pedidos/${pedidoId}/pago`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pago, monto, metodo: metodoPago }),
      });

      if (!res.ok) throw new Error("Error actualizando pago");

      const data = await res.json();
      setPago(data.pago);
      setMonto(0); // reset campo monto
      setMetodoPago(""); // reset método de pago
    } catch (err: any) {
      console.error(err);
      alert("No se pudo actualizar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-64 border p-3 rounded-xl shadow-sm">
      <div className="flex items-center gap-2">
        <Select value={pago} onValueChange={setPago} disabled={loading}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar pago" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="sin pago">Sin Pago</SelectItem>
            <SelectItem value="abonado">Abonado</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Input
        type="number"
        placeholder="Monto"
        value={monto}
        onChange={(e) => setMonto(Number(e.target.value))}
        disabled={loading}
      />

      <Select value={metodoPago} onValueChange={setMetodoPago} disabled={loading || metodosLoading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar método de pago" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {metodosPago.map((metodo) => (
            <SelectItem key={metodo._id} value={metodo.nombre}>
              {metodo.nombre} - {metodo.banco}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={actualizarPago} disabled={loading || metodosLoading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar Pago"}
      </Button>
    </div>
  );
};

export default PagoManager;
