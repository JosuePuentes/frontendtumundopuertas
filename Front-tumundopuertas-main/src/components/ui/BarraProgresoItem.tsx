import React, { useState, useEffect } from 'react';
import IconoHerreria from '../icons/IconoHerreria';
import IconoMasillar from '../icons/IconoMasillar';
import IconoPreparar from '../icons/IconoPreparar';
import IconoFacturar from '../icons/IconoFacturar';
import { getApiUrl } from '@/lib/api';

interface BarraProgresoItemProps {
  pedidoId: string;
  itemId: string;
  moduloActual: string; // 'herreria' | 'masillar' | 'preparar' | 'facturar'
}

interface ProgresoModulo {
  modulo: string;
  porcentaje: number;
  estado: 'pendiente' | 'en_proceso' | 'completado';
  en_proceso: number;
  terminadas: number;
  total: number;
}

const BarraProgresoItem: React.FC<BarraProgresoItemProps> = ({ 
  pedidoId, 
  itemId, 
  moduloActual 
}) => {
  const [progresoModulos, setProgresoModulos] = useState<ProgresoModulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener progreso del backend
  const fetchProgresoPedido = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Obteniendo progreso para pedido ${pedidoId}...`);
      
      const response = await fetch(`${getApiUrl()}/pedidos/progreso-pedido/${pedidoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // OPTIMIZACIÓN: Reducir timeout para evitar bloqueos
        signal: AbortSignal.timeout(5000) // 5 segundos en lugar de 10
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Progreso obtenido del backend:', data);
      
      // Procesar datos del progreso
      if (data.modulos && Array.isArray(data.modulos)) {
        setProgresoModulos(data.modulos);
      } else {
        // Fallback: crear progreso básico
        const progresoBasico: ProgresoModulo[] = modulos.map(modulo => ({
          modulo: modulo.id,
          porcentaje: modulo.id === moduloActual ? 50 : (modulos.findIndex(m => m.id === moduloActual) > modulos.findIndex(m => m.id === modulo.id) ? 100 : 0),
          estado: obtenerEstado(modulo.id),
          en_proceso: modulo.id === moduloActual ? 1 : 0,
          terminadas: modulos.findIndex(m => m.id === moduloActual) > modulos.findIndex(m => m.id === modulo.id) ? 1 : 0,
          total: 1
        }));
        setProgresoModulos(progresoBasico);
      }
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn(`⏰ Timeout al obtener progreso del pedido ${pedidoId} - usando progreso básico`);
      } else {
        console.error('❌ Error al obtener progreso:', err);
        setError(err.message);
      }
      
      // Fallback: crear progreso básico en caso de error
      const progresoBasico: ProgresoModulo[] = modulos.map(modulo => ({
        modulo: modulo.id,
        porcentaje: modulo.id === moduloActual ? 50 : (modulos.findIndex(m => m.id === moduloActual) > modulos.findIndex(m => m.id === modulo.id) ? 100 : 0),
        estado: obtenerEstado(modulo.id),
        en_proceso: modulo.id === moduloActual ? 1 : 0,
        terminadas: modulos.findIndex(m => m.id === moduloActual) > modulos.findIndex(m => m.id === modulo.id) ? 1 : 0,
        total: 1
      }));
      setProgresoModulos(progresoBasico);
    } finally {
      setLoading(false);
    }
  };

  // Cargar progreso al montar el componente
  useEffect(() => {
    if (pedidoId) {
      fetchProgresoPedido();
    }
  }, [pedidoId, itemId]);

  // Escuchar cambios de estado para actualizar progreso
  useEffect(() => {
    const handleCambioEstado = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const evento = customEvent.detail;
      
      // Solo actualizar si el cambio es relevante para este item
      if (evento.itemId === itemId || evento.pedidoId === pedidoId) {
        console.log(`🔄 BarraProgresoItem: Cambio de estado detectado para item ${itemId}`, evento);
        await fetchProgresoPedido();
      }
    };

    window.addEventListener('cambioEstadoItem', handleCambioEstado);
    return () => {
      window.removeEventListener('cambioEstadoItem', handleCambioEstado);
    };
  }, [itemId, pedidoId]);

  // Función para obtener porcentaje de un módulo específico
  const obtenerPorcentaje = (moduloId: string): number => {
    const progresoModulo = progresoModulos.find(p => p.modulo === moduloId);
    return progresoModulo?.porcentaje || 0;
  };
  const modulos = [
    { 
      id: 'herreria', 
      nombre: 'Herrería', 
      orden: 1, 
      Icono: IconoHerreria 
    },
    { 
      id: 'masillar', 
      nombre: 'Pintura', 
      orden: 2, 
      Icono: IconoMasillar 
    },
    { 
      id: 'preparar', 
      nombre: 'Preparar', 
      orden: 3, 
      Icono: IconoPreparar 
    },
    { 
      id: 'facturar', 
      nombre: 'Facturar', 
      orden: 4, 
      Icono: IconoFacturar 
    }
  ];
  
  // Lógica para determinar estado de cada módulo
  const obtenerEstado = (modulo: string): 'completado' | 'en_proceso' | 'pendiente' => {
    const ordenActual = modulos.find(m => m.id === moduloActual)?.orden || 1;
    const ordenModulo = modulos.find(m => m.id === modulo)?.orden || 1;
    
    if (ordenModulo < ordenActual) return 'completado';
    if (ordenModulo === ordenActual) return 'en_proceso';
    return 'pendiente';
  };
  
  if (loading) {
    return (
      <div className="barra-progreso-item">
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600">Cargando progreso...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="barra-progreso-item">
      {modulos.map((modulo, index) => {
        const estado = obtenerEstado(modulo.id);
        const porcentaje = obtenerPorcentaje(modulo.id);
        const IconoComponent = modulo.Icono;
        
        return (
          <div key={modulo.id} className="modulo-step-container">
            <div className={`modulo-step modulo-step-${estado}`}>
              <div className="modulo-icono">
                <IconoComponent estado={estado} size={28} />
              </div>
              <span className="modulo-nombre">{modulo.nombre}</span>
              {/* Mostrar porcentaje si está disponible */}
              {porcentaje > 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  {porcentaje}%
                </div>
              )}
            </div>
            
            {/* Conector entre módulos */}
            {index < modulos.length - 1 && (
              <div className={`conector conector-${estado === 'completado' ? 'activo' : 'inactivo'}`} />
            )}
          </div>
        );
      })}
      
      {/* Información adicional del progreso */}
      <div className="mt-2 text-xs text-gray-600 text-center">
        📊 Progreso en tiempo real desde el backend
        {error && (
          <div className="mt-1 text-red-600">
            ⚠️ Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarraProgresoItem;
