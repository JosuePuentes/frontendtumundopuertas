import { useState } from "react";

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
};

export function useClientes() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientes = async (endpoint: string, options?: FetchOptions) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(endpoint, {
        method: options?.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers || {}),
          Authorization: `Bearer ${token}`,
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });
      if (!res.ok) throw new Error("Error en la petición");
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchClientes };
}
