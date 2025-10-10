import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { FormatoImpresion, ConfiguracionFormato } from '../organism/formatosImpresion/FormatosImpresion';

interface FormatosContextType {
  formatos: FormatoImpresion[];
  guardarFormato: (formato: FormatoImpresion) => void;
  actualizarFormato: (id: string, formato: FormatoImpresion) => void;
  eliminarFormato: (id: string) => void;
  obtenerFormatoPorTipo: (tipo: 'preliminar' | 'nota_entrega') => FormatoImpresion | null;
  obtenerFormatoPorId: (id: string) => FormatoImpresion | null;
  cargarFormatos: () => void;
}

const FormatosContext = createContext<FormatosContextType | undefined>(undefined);

interface FormatosProviderProps {
  children: ReactNode;
}

export const FormatosProvider: React.FC<FormatosProviderProps> = ({ children }) => {
  const [formatos, setFormatos] = useState<FormatoImpresion[]>([]);

  // Configuración por defecto
  const configuracionPorDefecto: ConfiguracionFormato = {
    empresa: {
      mostrar: true,
      nombre: 'Tu Mundo Puertas',
      rif: 'J-12345678-9',
      direccion: 'Dirección de la empresa',
      telefono: '+58 123-456-7890',
      email: 'info@tumundopuertas.com'
    },
    logo: {
      mostrar: true,
      url: '/puertalogo.PNG',
      posicion: 'izquierda',
      tamaño: 'mediano'
    },
    cliente: {
      mostrar: true,
      incluirNombre: true,
      incluirDireccion: true,
      incluirCedula: true,
      incluirTelefono: false
    },
    documento: {
      titulo: 'Preliminar de Pago',
      numeroDocumento: 'PREL-001',
      fecha: new Date().toLocaleDateString('es-ES')
    },
    items: {
      mostrar: true,
      columnas: ['descripcion', 'cantidad', 'precio', 'subtotal']
    },
    totales: {
      mostrar: true,
      incluirSubtotal: true,
      incluirIva: false,
      incluirTotal: true,
      incluirAbonado: true,
      incluirRestante: true
    },
    pie: {
      mostrar: true,
      texto: 'Gracias por su preferencia'
    },
    papel: {
      tamaño: 'carta',
      orientacion: 'vertical',
      margenes: {
        superior: 20,
        inferior: 20,
        izquierdo: 20,
        derecho: 20
      }
    }
  };

  // Cargar formatos desde localStorage
  const cargarFormatos = () => {
    try {
      const formatosGuardados = localStorage.getItem('formatos-impresion');
      if (formatosGuardados) {
        setFormatos(JSON.parse(formatosGuardados));
      } else {
        // Crear formatos por defecto si no existen
        const formatosPorDefecto: FormatoImpresion[] = [
          {
            id: 'preliminar-default',
            nombre: 'Preliminar Estándar',
            tipo: 'preliminar',
            activo: true,
            configuracion: configuracionPorDefecto,
            fechaCreacion: new Date().toISOString(),
            fechaModificacion: new Date().toISOString()
          },
          {
            id: 'nota-entrega-default',
            nombre: 'Nota de Entrega Estándar',
            tipo: 'nota_entrega',
            activo: true,
            configuracion: {
              ...configuracionPorDefecto,
              documento: {
                ...configuracionPorDefecto.documento,
                titulo: 'Nota de Entrega'
              }
            },
            fechaCreacion: new Date().toISOString(),
            fechaModificacion: new Date().toISOString()
          }
        ];
        setFormatos(formatosPorDefecto);
        localStorage.setItem('formatos-impresion', JSON.stringify(formatosPorDefecto));
      }
    } catch (error) {
      console.error('Error al cargar formatos:', error);
      setFormatos([]);
    }
  };

  // Guardar formatos en localStorage
  const guardarFormatosEnStorage = (nuevosFormatos: FormatoImpresion[]) => {
    try {
      localStorage.setItem('formatos-impresion', JSON.stringify(nuevosFormatos));
    } catch (error) {
      console.error('Error al guardar formatos:', error);
    }
  };

  // Guardar nuevo formato
  const guardarFormato = (formato: FormatoImpresion) => {
    const nuevosFormatos = [...formatos, formato];
    setFormatos(nuevosFormatos);
    guardarFormatosEnStorage(nuevosFormatos);
  };

  // Actualizar formato existente
  const actualizarFormato = (id: string, formatoActualizado: FormatoImpresion) => {
    const nuevosFormatos = formatos.map(f => 
      f.id === id ? { ...formatoActualizado, fechaModificacion: new Date().toISOString() } : f
    );
    setFormatos(nuevosFormatos);
    guardarFormatosEnStorage(nuevosFormatos);
  };

  // Eliminar formato
  const eliminarFormato = (id: string) => {
    const nuevosFormatos = formatos.filter(f => f.id !== id);
    setFormatos(nuevosFormatos);
    guardarFormatosEnStorage(nuevosFormatos);
  };

  // Obtener formato por tipo
  const obtenerFormatoPorTipo = (tipo: 'preliminar' | 'nota_entrega'): FormatoImpresion | null => {
    const formato = formatos.find(f => f.tipo === tipo && f.activo);
    return formato || null;
  };

  // Obtener formato por ID
  const obtenerFormatoPorId = (id: string): FormatoImpresion | null => {
    const formato = formatos.find(f => f.id === id);
    return formato || null;
  };

  // Cargar formatos al inicializar
  useEffect(() => {
    cargarFormatos();
  }, []);

  const value: FormatosContextType = {
    formatos,
    guardarFormato,
    actualizarFormato,
    eliminarFormato,
    obtenerFormatoPorTipo,
    obtenerFormatoPorId,
    cargarFormatos
  };

  return (
    <FormatosContext.Provider value={value}>
      {children}
    </FormatosContext.Provider>
  );
};

// Hook para usar el contexto
export const useFormatos = (): FormatosContextType => {
  const context = useContext(FormatosContext);
  if (context === undefined) {
    throw new Error('useFormatos debe ser usado dentro de un FormatosProvider');
  }
  return context;
};
