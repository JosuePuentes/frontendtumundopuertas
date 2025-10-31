import React from 'react';

interface IndicadorEstadosItemProps {
  estadoItem: number;
  itemNombre: string;
}

const IndicadorEstadosItem: React.FC<IndicadorEstadosItemProps> = ({ 
  estadoItem, 
  itemNombre 
}) => {
  const estados = [
    { numero: 0, nombre: "Pendiente", modulo: "pendiente" },
    { numero: 1, nombre: "Herrería", modulo: "herreria" },
    { numero: 2, nombre: "Masillar/Pintar", modulo: "masillar" },
    { numero: 3, nombre: "Manillar", modulo: "manillar" },
    { numero: 4, nombre: "Terminado", modulo: "terminado" }
  ];

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
      <h4 className="font-semibold text-sm text-gray-700 mb-2">{itemNombre}</h4>
      <div className="flex items-center space-x-2">
        {estados.map((estado, index) => {
          const isCompleted = estadoItem > estado.numero;
          const isCurrent = estadoItem === estado.numero;

          return (
            <div key={estado.numero} className="flex items-center">
              {/* Estado */}
              <div className={`
                px-3 py-1 rounded-full text-xs font-medium border-2
                ${isCompleted 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : isCurrent 
                    ? 'bg-blue-100 text-blue-800 border-blue-300' 
                    : 'bg-gray-100 text-gray-500 border-gray-300'
                }
              `}>
                {estado.numero}. {estado.nombre}
              </div>
              
              {/* Flecha */}
              {index < estados.length - 1 && (
                <div className={`
                  mx-2 text-lg
                  ${isCompleted ? 'text-green-500' : 'text-gray-300'}
                `}>
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Estado actual */}
      <div className="mt-2 text-xs text-gray-600">
        Estado actual: <span className="font-semibold">
          {(() => {
            // Mostrar mensajes descriptivos según el estado
            if (estadoItem === 2) {
              return "Terminada Herrería"; // Pasó de herrería (1) a masillar (2)
            } else if (estadoItem === 3) {
              return "Terminada Masillar"; // Pasó de masillar (2) a preparar (3)
            } else if (estadoItem === 4) {
              return "Terminado"; // Completado todo el proceso
            } else {
              // Estados normales: Pendiente (0) o Herrería (1)
              return estados.find(e => e.numero === estadoItem)?.nombre || 'Desconocido';
            }
          })()}
        </span>
      </div>
    </div>
  );
};

export default IndicadorEstadosItem;
