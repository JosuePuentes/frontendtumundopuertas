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
  pedidoData?: any; // Datos completos del pedido para el preliminar
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
      // Primero actualizar el estado del pago en el pedido
      const res = await fetch(`${import.meta.env.VITE_API_URL.replace('http://', 'https://')}/pedidos/${pedidoId}/pago`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ pago, monto, metodo: selectedMetodoPago }),
      });

      if (!res.ok) throw new Error("Error actualizando pago");

      const data = await res.json();
      setPago(data.pago);
      
      // CRÍTICO: Registrar el depósito en el método de pago para que aparezca en el historial
      try {
        const apiUrl = import.meta.env.VITE_API_URL.replace('http://', 'https://');
        const metodoSeleccionado = metodosPago.find((m: any) => (m._id || m.id) === selectedMetodoPago);
        const metodoNombre = metodoSeleccionado?.nombre || 'Método de pago';
        
        // Obtener información del pedido para el concepto
        const pedidoRes = await fetch(`${apiUrl}/pedidos/id/${pedidoId}/`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem('access_token')}` }
        });
        const pedidoData = pedidoRes.ok ? await pedidoRes.json() : null;
        const clienteNombre = pedidoData?.cliente_nombre || pedidoData?.cliente_id || 'Cliente';
        
        // Concepto descriptivo para el historial
        const concepto = `Pedido ${pedidoId.slice(-8)} - Cliente: ${clienteNombre} - Abono desde /pagos`;
        
        console.log(`💰 Registrando depósito en método de pago: ${monto} en ${metodoNombre}`);
        console.log(`💰 Concepto: ${concepto}`);
        
        const depositoRes = await fetch(`${apiUrl}/metodos-pago/${selectedMetodoPago}/deposito`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            monto: monto,
            concepto: concepto
          }),
        });
        
        if (depositoRes.ok) {
          console.log(`✓ Depósito registrado exitosamente en método de pago ${metodoNombre}`);
        } else {
          const errorText = await depositoRes.text();
          console.error(`⚠️ No se pudo registrar el depósito en método de pago:`, depositoRes.status, errorText);
          // No fallar el proceso si el depósito no se registra, pero advertir
          alert(`⚠️ Pago actualizado, pero no se pudo registrar en el historial del método de pago. Por favor verifica manualmente.`);
        }
      } catch (depositoError: any) {
        console.error(`⚠️ Error al registrar depósito en método de pago:`, depositoError);
        // No fallar el proceso si el depósito no se registra, pero advertir
        alert(`⚠️ Pago actualizado, pero hubo un error al registrar en el historial del método de pago. Por favor verifica manualmente.`);
      }
      
      setMonto(0); // reset campo monto
      setSelectedMetodoPago(""); // reset metodo de pago
      
      // Refrescar métodos de pago para actualizar saldos
      const refreshResponse = await api("/metodos-pago");
      setMetodosPago(refreshResponse);
      
      alert("✓ Pago registrado exitosamente");
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
