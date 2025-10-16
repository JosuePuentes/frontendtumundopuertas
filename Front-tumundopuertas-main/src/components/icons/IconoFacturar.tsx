import React from 'react';

interface IconoFacturarProps {
  size?: number;
  estado?: 'completado' | 'en_proceso' | 'pendiente';
}

const IconoFacturar: React.FC<IconoFacturarProps> = ({ 
  size = 32, 
  estado = 'pendiente' 
}) => {
  const getColor = () => {
    switch (estado) {
      case 'completado':
        return '#10b981'; // verde
      case 'en_proceso':
        return '#3b82f6'; // azul
      case 'pendiente':
      default:
        return '#9ca3af'; // gris
    }
  };

  const isAnimated = estado === 'en_proceso';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={isAnimated ? 'animate-pulse' : ''}
    >
      {/* Cabeza del muñequito */}
      <circle cx="16" cy="8" r="4" fill={getColor()} />
      
      {/* Cuerpo */}
      <rect x="12" y="12" width="8" height="10" rx="2" fill={getColor()} />
      
      {/* Brazos */}
      <rect x="8" y="14" width="4" height="2" rx="1" fill={getColor()} />
      <rect x="20" y="14" width="4" height="2" rx="1" fill={getColor()} />
      
      {/* Piernas */}
      <rect x="13" y="22" width="2" height="6" rx="1" fill={getColor()} />
      <rect x="17" y="22" width="2" height="6" rx="1" fill={getColor()} />
      
      {/* Lentes */}
      <circle cx="14" cy="8" r="1.5" fill="#1f2937" />
      <circle cx="18" cy="8" r="1.5" fill="#1f2937" />
      <rect x="14" y="7.5" width="4" height="1" fill="#1f2937" />
      
      {/* Computadora */}
      <rect x="22" y="10" width="8" height="6" rx="1" fill="#374151" />
      <rect x="23" y="11" width="6" height="4" rx="0.5" fill="#1f2937" />
      <rect x="24" y="12" width="4" height="2" rx="0.25" fill="#10b981" />
      <rect x="25" y="13" width="2" height="0.5" rx="0.25" fill="#ffffff" />
      
      {/* Teclado */}
      <rect x="23" y="16" width="6" height="2" rx="0.5" fill="#6b7280" />
      <rect x="24" y="16.5" width="0.5" height="0.5" rx="0.1" fill="#1f2937" />
      <rect x="25" y="16.5" width="0.5" height="0.5" rx="0.1" fill="#1f2937" />
      <rect x="26" y="16.5" width="0.5" height="0.5" rx="0.1" fill="#1f2937" />
      <rect x="27" y="16.5" width="0.5" height="0.5" rx="0.1" fill="#1f2937" />
      
      {/* Documento/Factura */}
      <rect x="2" y="12" width="6" height="8" rx="0.5" fill="#ffffff" stroke="#d1d5db" strokeWidth="1" />
      <rect x="3" y="13" width="4" height="0.5" rx="0.25" fill="#6b7280" />
      <rect x="3" y="14" width="3" height="0.5" rx="0.25" fill="#6b7280" />
      <rect x="3" y="15" width="4" height="0.5" rx="0.25" fill="#6b7280" />
      <rect x="3" y="16" width="2" height="0.5" rx="0.25" fill="#6b7280" />
      <rect x="3" y="17" width="4" height="0.5" rx="0.25" fill="#6b7280" />
      <rect x="3" y="18" width="3" height="0.5" rx="0.25" fill="#6b7280" />
      
      {/* Efectos de trabajo */}
      {isAnimated && (
        <g className="animate-pulse">
          <circle cx="25" cy="13" r="0.5" fill="#fbbf24" />
          <circle cx="3" cy="15" r="0.3" fill="#3b82f6" />
          <circle cx="5" cy="17" r="0.3" fill="#3b82f6" />
        </g>
      )}
      
      {/* Checkmark para completado */}
      {estado === 'completado' && (
        <path
          d="M12 16 L14 18 L20 12"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};

export default IconoFacturar;


