import { useState } from "react";

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
};

export function useItems() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async (searchQuery?: string, options?: FetchOptions) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "https://localhost:3000";
      let url = `${apiUrl}/inventario/all`;

      if (searchQuery) {
        url = `${apiUrl}/inventario/search?query=${encodeURIComponent(searchQuery)}`;
      }

      const res = await fetch(url, {
        method: options?.method || "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          ...(options?.headers || {}),
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error en la petición");
      }
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchItems };
}
