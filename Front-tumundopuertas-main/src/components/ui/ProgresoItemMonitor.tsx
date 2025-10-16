import React from 'react';
import IconoHerreria from '../icons/IconoHerreria';
import IconoMasillar from '../icons/IconoMasillar';
import IconoPreparar from '../icons/IconoPreparar';
import IconoFacturar from '../icons/IconoFacturar';

interface ProgresoItemMonitorProps {
  estadoActual: string; // 'herreria' | 'masillar' | 'preparar' | 'facturar' | 'completado'
  size?: number;
}

const ProgresoItemMonitor: React.FC<ProgresoItemMonitorProps> = ({ 
  estadoActual, 
  size = 24 
}) => {
  const getIconoPorEstado = () => {
    switch (estadoActual) {
      case 'herreria':
      case 'orden1':
        return IconoHerreria;
      case 'masillar':
      case 'orden2':
        return IconoMasillar;
      case 'preparar':
      case 'orden3':
        return IconoPreparar;
      case 'facturar':
      case 'orden4':
        return IconoFacturar;
      case 'completado':
      case 'orden5':
      case 'orden6':
        return IconoFacturar;
      default:
        return IconoHerreria;
    }
  };

  const getEstadoVisual = () => {
    switch (estadoActual) {
      case 'herreria':
      case 'orden1':
        return 'en_proceso';
      case 'masillar':
      case 'orden2':
        return 'en_proceso';
      case 'preparar':
      case 'orden3':
        return 'en_proceso';
      case 'facturar':
      case 'orden4':
        return 'en_proceso';
      case 'completado':
      case 'orden5':
      case 'orden6':
        return 'completado';
      default:
        return 'pendiente';
    }
  };

  const IconoComponent = getIconoPorEstado();
  const estadoVisual = getEstadoVisual();

  return (
    <div className="progreso-item-monitor">
      <IconoComponent 
        estado={estadoVisual} 
        size={size} 
      />
    </div>
  );
};

export default ProgresoItemMonitor;


