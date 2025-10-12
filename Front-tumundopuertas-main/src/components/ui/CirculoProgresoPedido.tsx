import React from 'react';

interface CirculoProgresoPedidoProps {
  porcentaje: number;
  size?: number;
  strokeWidth?: number;
}

const CirculoProgresoPedido: React.FC<CirculoProgresoPedidoProps> = ({ 
  porcentaje, 
  size = 120, 
  strokeWidth = 8 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (porcentaje / 100) * circumference;

  const getColor = () => {
    if (porcentaje >= 100) return '#10b981'; // verde (completado)
    if (porcentaje >= 80) return '#3b82f6'; // azul (preparar)
    if (porcentaje >= 55) return '#f59e0b'; // amarillo (masillar)
    if (porcentaje >= 20) return '#f97316'; // naranja (herreria)
    return '#ef4444'; // rojo (pendiente)
  };

  const getTextColor = () => {
    if (porcentaje >= 100) return '#065f46'; // verde oscuro
    if (porcentaje >= 80) return '#1e40af'; // azul oscuro
    if (porcentaje >= 55) return '#92400e'; // amarillo oscuro
    if (porcentaje >= 20) return '#9a3412'; // naranja oscuro
    return '#991b1b'; // rojo oscuro
  };

  return (
    <div className="circulo-progreso-pedido-mejorado">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Círculo de fondo con gradiente */}
        <defs>
          <linearGradient id={`gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3f4f6" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
          <linearGradient id={`progress-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={getColor()} stopOpacity="0.8" />
            <stop offset="100%" stopColor={getColor()} stopOpacity="1" />
          </linearGradient>
        </defs>
        
        {/* Círculo de fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient-80)"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="drop-shadow-sm"
        />
        
        {/* Círculo de progreso con gradiente */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#progress-gradient-${size})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out drop-shadow-md"
          style={{
            filter: `drop-shadow(0 0 8px ${getColor()}40)`
          }}
        />
        
        {/* Efecto de brillo */}
        {porcentaje > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={strokeWidth * 0.3}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>
      
      {/* Texto del porcentaje mejorado */}
      <div className="circulo-progreso-texto-mejorado">
        <span 
          className="circulo-progreso-porcentaje-mejorado"
          style={{ 
            color: getTextColor(),
            textShadow: `0 0 10px ${getColor()}40`
          }}
        >
          {Math.round(porcentaje)}%
        </span>
        <span className="circulo-progreso-label-mejorado">Progreso</span>
      </div>
      
      {/* Indicador de estado visual */}
      <div className="circulo-progreso-indicador">
        <div 
          className="circulo-progreso-punto"
          style={{ 
            backgroundColor: getColor(),
            boxShadow: `0 0 12px ${getColor()}60`
          }}
        />
      </div>
    </div>
  );
};

export default CirculoProgresoPedido;
