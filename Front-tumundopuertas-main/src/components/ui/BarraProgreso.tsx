import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';

interface ModuloProgreso {
  nombre: string;
  porcentaje: number;
  completado: number;
  total: number;
}

interface ProgresoPedido {
  progreso_general: number;
  modulos: ModuloProgreso[];
}

interface BarraProgresoProps {
  pedidoId: string;
  className?: string;
}

const BarraProgreso: React.FC<BarraProgresoProps> = ({ pedidoId, className = "" }) => {
  const [progreso, setProgreso] = useState<ProgresoPedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const obtenerProgreso = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${getApiUrl()}/pedidos/progreso-pedido/${pedidoId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProgreso(data);
    } catch (error: any) {
      console.error('Error al obtener progreso:', error);
      setError(error.message || 'Error al cargar el progreso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pedidoId) {
      obtenerProgreso();
      // Actualizar cada 30 segundos
      const interval = setInterval(obtenerProgreso, 30000);
      return () => clearInterval(interval);
    }
  }, [pedidoId]);

  if (loading) {
    return (
      <div className={`progreso-pedido ${className}`}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando progreso...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`progreso-pedido ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-2">⚠️</div>
            <div>
              <h4 className="text-red-800 font-medium">Error al cargar progreso</h4>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
          <button 
            onClick={obtenerProgreso}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!progreso) {
    return (
      <div className={`progreso-pedido ${className}`}>
        <div className="text-gray-500 text-center p-4">
          No se pudo cargar el progreso del pedido
        </div>
      </div>
    );
  }

  return (
    <div className={`progreso-pedido bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Progreso del Pedido: {progreso.progreso_general}%
        </h3>
        
        {/* Barra de progreso general */}
        <div className="barra-progreso-general">
          <div 
            className="progreso-fill" 
            style={{ width: `${progreso.progreso_general}%` }}
          ></div>
        </div>
      </div>

      {/* Módulos individuales */}
      <div className="space-y-3">
        {progreso.modulos.map((modulo, index) => (
          <div key={index} className="modulo-progreso">
            <div className="modulo-header">
              <span className="font-medium text-gray-700 capitalize">
                {modulo.nombre.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-600">
                {modulo.porcentaje}% ({modulo.completado}/{modulo.total})
              </span>
            </div>
            <div className="barra-progreso-modulo">
              <div 
                className="progreso-fill-modulo" 
                style={{ width: `${modulo.porcentaje}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Botón de actualización manual */}
      <div className="mt-4 flex justify-end">
        <button 
          onClick={obtenerProgreso}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>
    </div>
  );
};

export default BarraProgreso;
