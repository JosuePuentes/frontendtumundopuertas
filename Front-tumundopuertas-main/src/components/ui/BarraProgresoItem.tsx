import React from 'react';
import IconoHerreria from '../icons/IconoHerreria';
import IconoMasillar from '../icons/IconoMasillar';
import IconoPreparar from '../icons/IconoPreparar';
import IconoFacturar from '../icons/IconoFacturar';

interface BarraProgresoItemProps {
  pedidoId: string;
  itemId: string;
  moduloActual: string; // 'herreria' | 'masillar' | 'preparar' | 'facturar'
}

const BarraProgresoItem: React.FC<BarraProgresoItemProps> = ({ 
  pedidoId: _pedidoId, 
  itemId: _itemId, 
  moduloActual 
}) => {
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
  
  return (
    <div className="barra-progreso-item">
      {modulos.map((modulo, index) => {
        const estado = obtenerEstado(modulo.id);
        const IconoComponent = modulo.Icono;
        
        return (
          <div key={modulo.id} className="modulo-step-container">
            <div className={`modulo-step modulo-step-${estado}`}>
              <div className="modulo-icono">
                <IconoComponent estado={estado} size={28} />
              </div>
              <span className="modulo-nombre">{modulo.nombre}</span>
            </div>
            
            {/* Conector entre módulos */}
            {index < modulos.length - 1 && (
              <div className={`conector conector-${estado === 'completado' ? 'activo' : 'inactivo'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BarraProgresoItem;
