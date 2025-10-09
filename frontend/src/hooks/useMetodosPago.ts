import { useState, useEffect } from 'react';

interface MetodoPago {
  _id: string;
  nombre: string;
  banco: string;
  numero_cuenta: string;
  titular: string;
  cedula?: string;
  moneda: string;
  saldo: number;
}

export function useMetodosPago() {
  const [data, setData] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetodosPago = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      console.error('Error fetching métodos de pago:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    fetchMetodosPago,
  };
}
