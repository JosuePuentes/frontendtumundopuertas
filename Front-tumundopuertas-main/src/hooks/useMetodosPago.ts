import { useState, useEffect } from "react";
import { getMetodosPago, deleteMetodoPago } from "../lib/api";

export interface MetodoPago {
  id?: string;
  nombre: string;
  banco: string;
  titular: string;
  numero_cuenta: string;
  moneda: "dolar" | "bs";
  saldo: number;
}

export function useMetodosPago() {
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetodosPago = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMetodosPago();
      const metodosConSaldo = data.map((metodo: MetodoPago) => ({
        ...metodo,
        saldo: metodo.saldo || 0,
      }));
      setMetodos(metodosConSaldo);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const removeMetodoPago = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteMetodoPago(id);
      setMetodos(metodos.filter((m) => m.id !== id));
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const updateMetodoSaldo = (id: string, updatedMetodo: MetodoPago) => {
    setMetodos(metodos.map((m) => (m.id === id ? updatedMetodo : m)));
  };

  useEffect(() => {
    fetchMetodosPago();
  }, []);

  return { metodos, loading, error, fetchMetodosPago, removeMetodoPago, updateMetodoSaldo };
}
