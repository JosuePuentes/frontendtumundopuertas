import { useState, useEffect } from "react";
import { getMetodosPago, deleteMetodoPago } from "../lib/api";

export interface MetodoPago {
  _id?: string;
  nombre: string;
  banco: string;
  titular: string;
  numero_cuenta: string;
  moneda: "dolar" | "bs";
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
      setMetodos(data);
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
      setMetodos(metodos.filter((m) => m._id !== id));
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetodosPago();
  }, []);

  return { metodos, loading, error, fetchMetodosPago, removeMetodoPago };
}
