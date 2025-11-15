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
  pedidoData?: any; // Datos completos del pedido para el preliminar
}

const PagoManager: React.FC<PagoManagerProps> = ({ pedidoId }) => {
  const [monto, setMonto] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [metodosPago, setMetodosPago] = useState<any[]>([]);
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [nombreQuienEnvía, setNombreQuienEnvía] = useState<string>("");

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
    if (monto <= 0) return alert("Ingresa un monto válido");
    if (!selectedMetodoPago) return alert("Selecciona un método de pago");
    if (!nombreQuienEnvía.trim()) return alert("Debe ingresar el nombre del titular");

    setLoading(true);
    try {
      // Registrar el abono con descripción y nombre de quien envía
      const res = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/${pedidoId}/pago`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ 
          monto, 
          metodo: selectedMetodoPago,
          descripcion: descripcion || undefined,
          nombre_quien_envia: nombreQuienEnvía || undefined
        }),
      });

      if (!res.ok) throw new Error("Error registrando pago");

      // Nota: El backend ahora registra automáticamente la transacción en el historial
      // y calcula el estado automáticamente basado en totalPedido vs montoAbonado
      
      setMonto(0); // reset campo monto
      setSelectedMetodoPago(""); // reset metodo de pago
      setDescripcion(""); // reset descripción
      setNombreQuienEnvía(""); // reset nombre quien envía
      
      // Refrescar métodos de pago para actualizar saldos
      const refreshResponse = await api("/metodos-pago");
      setMetodosPago(refreshResponse);
      
      alert("✓ Pago registrado exitosamente");
    } catch (err: any) {
      console.error(err);
      alert("No se pudo registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-80 border p-3 rounded-xl shadow-sm">
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

      <Input
        type="text"
        placeholder="Descripción (opcional)"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        disabled={loading}
      />

      <Input
        type="text"
        placeholder="Nombre del titular *"
        value={nombreQuienEnvía}
        onChange={(e) => setNombreQuienEnvía(e.target.value)}
        disabled={loading}
        required
      />

      <Button onClick={actualizarPago} disabled={loading || !nombreQuienEnvía.trim()}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar Pago"}
      </Button>
    </div>
  );
};

export default PagoManager;
