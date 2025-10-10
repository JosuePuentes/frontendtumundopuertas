import { useState, useEffect } from 'react';
import { getHistorialMetodo } from '../lib/api';

export interface Transaccion {
  id?: string;
  metodo_pago_id: string;
  tipo: 'deposito' | 'transferir';
  monto: number;
  concepto: string;
  fecha: string;
}

export function useHistorial(metodoId: string | null) {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!metodoId) return;

    const fetchHistorial = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getHistorialMetodo(metodoId);
        setTransacciones(data);
      } catch (err: any) {
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, [metodoId]);

  return { transacciones, loading, error };
}
