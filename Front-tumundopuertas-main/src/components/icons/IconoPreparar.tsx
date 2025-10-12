import React from 'react';

interface IconoPrepararProps {
  size?: number;
  estado?: 'completado' | 'en_proceso' | 'pendiente';
}

const IconoPreparar: React.FC<IconoPrepararProps> = ({ 
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
      
      {/* Casco de seguridad */}
      <ellipse cx="16" cy="6" rx="3.5" ry="2.5" fill="#fbbf24" />
      <rect x="13" y="4" width="6" height="2" rx="1" fill="#f59e0b" />
      
      {/* Herramientas */}
      {/* Martillo */}
      <rect x="24" y="10" width="4" height="1" rx="0.5" fill="#6b7280" />
      <rect x="27" y="8" width="1" height="4" rx="0.5" fill="#4b5563" />
      
      {/* Llave inglesa */}
      <rect x="24" y="14" width="3" height="1" rx="0.5" fill="#6b7280" />
      <rect x="25" y="12" width="1" height="4" rx="0.5" fill="#4b5563" />
      
      {/* Puerta de fondo */}
      <rect x="2" y="16" width="8" height="12" rx="1" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="1" />
      <rect x="3" y="18" width="2" height="2" rx="0.5" fill="#a78bfa" />
      <rect x="6" y="18" width="2" height="2" rx="0.5" fill="#a78bfa" />
      <rect x="4" y="22" width="2" height="4" rx="0.5" fill="#a78bfa" />
      
      {/* Efectos de reparación */}
      {isAnimated && (
        <g className="animate-ping">
          <circle cx="6" cy="20" r="1" fill="#fbbf24" opacity="0.5" />
          <circle cx="4" cy="24" r="0.8" fill="#fbbf24" opacity="0.3" />
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

export default IconoPreparar;
