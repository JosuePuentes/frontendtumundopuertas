import { useState } from "react";
import api from "@/lib/api";

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
};

export function usePedido() {
  const [dataPedidos, setDataPedidos] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const fetchPedido = async (endpoint: string, options?: FetchOptions) => {
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await api(endpoint, options);
      setDataPedidos(result);
      console.log("Resultado de la API:", result);
      return { success: true, data: result };
    } catch (err: any) {
      const errorMessage = err.message || "Error desconocido";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { dataPedidos, loading, error, status, fetchPedido };
}
