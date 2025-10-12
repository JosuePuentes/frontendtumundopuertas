import React from 'react';

interface IconoMasillarProps {
  size?: number;
  estado?: 'completado' | 'en_proceso' | 'pendiente';
}

const IconoMasillar: React.FC<IconoMasillarProps> = ({ 
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
      
      {/* Gorro de pintor */}
      <rect x="13" y="4" width="6" height="4" rx="2" fill="#1f2937" />
      <rect x="14" y="6" width="4" height="2" rx="1" fill="#ffffff" />
      
      {/* Rodillo de pintura */}
      <rect x="24" y="12" width="4" height="3" rx="1.5" fill="#6b7280" />
      <rect x="25" y="10" width="2" height="4" rx="1" fill="#4b5563" />
      
      {/* Pintura en el rodillo */}
      <rect x="24" y="12" width="4" height="1.5" rx="0.75" fill="#3b82f6" />
      
      {/* Gotas de pintura */}
      {isAnimated && (
        <g className="animate-bounce">
          <circle cx="26" cy="16" r="1" fill="#3b82f6" />
          <circle cx="25" cy="18" r="0.8" fill="#3b82f6" />
          <circle cx="27" cy="19" r="0.6" fill="#3b82f6" />
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

export default IconoMasillar;
