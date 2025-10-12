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
    if (porcentaje >= 100) return '#10b981'; // verde
    if (porcentaje >= 75) return '#3b82f6'; // azul
    if (porcentaje >= 50) return '#f59e0b'; // amarillo
    if (porcentaje >= 25) return '#f97316'; // naranja
    return '#ef4444'; // rojo
  };

  const getTextColor = () => {
    if (porcentaje >= 100) return '#065f46';
    if (porcentaje >= 75) return '#1e40af';
    if (porcentaje >= 50) return '#92400e';
    if (porcentaje >= 25) return '#9a3412';
    return '#991b1b';
  };

  return (
    <div className="circulo-progreso-pedido">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Círculo de fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Círculo de progreso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      
      {/* Texto del porcentaje */}
      <div className="circulo-progreso-texto">
        <span 
          className="circulo-progreso-porcentaje"
          style={{ color: getTextColor() }}
        >
          {Math.round(porcentaje)}%
        </span>
        <span className="circulo-progreso-label">Completado</span>
      </div>
    </div>
  );
};

export default CirculoProgresoPedido;
