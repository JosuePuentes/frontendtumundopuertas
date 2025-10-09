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
import api from "@/lib/api";

interface PagoManagerProps {
  pedidoId: string;
  pagoInicial?: string; // "sin pago" | "abonado" | "pagado"
}

const PagoManager: React.FC<PagoManagerProps> = ({ pedidoId, pagoInicial }) => {
  const [pago, setPago] = useState<string>(pagoInicial || "sin pago");
  const [monto, setMonto] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [metodosPago, setMetodosPago] = useState<any[]>([]);
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>("");

  useEffect(() => {
    const fetchMetodosPago = async () => {
      try {
        const response = await api("/metodos-pago");
        console.log("PagoManager - Métodos de pago cargados:", response);
        setMetodosPago(response);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    };
    fetchMetodosPago();
  }, []);

  const actualizarPago = async () => {
    if (!pago) return alert("Selecciona un estado de pago");
    if (monto <= 0) return alert("Ingresa un monto válido");
    if (!selectedMetodoPago) return alert("Selecciona un método de pago");

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/${pedidoId}/pago`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pago, monto, metodo: selectedMetodoPago }),
      });

      if (!res.ok) throw new Error("Error actualizando pago");

      const data = await res.json();
      setPago(data.pago);
      setMonto(0); // reset campo monto
      setSelectedMetodoPago(""); // reset metodo de pago
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

      <Select onValueChange={setSelectedMetodoPago} value={selectedMetodoPago || ""} disabled={loading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Método de pago" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {(() => {
            console.log("PagoManager - Renderizando SelectContent, metodosPago:", metodosPago);
            console.log("PagoManager - Primer método estructura:", metodosPago[0]);
            return metodosPago.map((metodo: any, index: number) => {
              console.log("PagoManager - Mapeando método:", metodo);
              const metodoId = metodo._id || metodo.id || metodo.nombre || `metodo-${index}`;
              console.log("PagoManager - ID del método:", metodoId);
              return (
                <SelectItem key={metodoId} value={metodoId}>
                  {metodo.nombre || 'Sin nombre'}
                </SelectItem>
              );
            });
          })()}
        </SelectContent>
      </Select>

      <Button onClick={actualizarPago} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar Pago"}
      </Button>
    </div>
  );
};

export default PagoManager;
