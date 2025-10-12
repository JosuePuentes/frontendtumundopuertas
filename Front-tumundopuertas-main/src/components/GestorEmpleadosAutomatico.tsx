import React, { useState, useEffect } from 'react';
import { useSincronizacionEmpleados } from '@/hooks/useSincronizacionEmpleados';

interface Empleado {
  id?: string;
  identificador: string;
  nombre?: string;
  cargo?: string;
  pin?: string;
  activo?: boolean;
}

interface GestorEmpleadosAutomaticoProps {
  empleados: Empleado[];
  onEmpleadosChange: (empleados: Empleado[]) => void;
}

const GestorEmpleadosAutomatico: React.FC<GestorEmpleadosAutomaticoProps> = ({
  empleados,
  onEmpleadosChange
}) => {
  const [empleadosOriginales, setEmpleadosOriginales] = useState<Empleado[]>([]);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  
  const {
    detectarCambioEmpleado,
    procesarCambioAutomatico,
    cambiosPendientes,
    sincronizando
  } = useSincronizacionEmpleados();

  // Guardar estado original al cargar
  useEffect(() => {
    if (empleados.length > 0 && empleadosOriginales.length === 0) {
      setEmpleadosOriginales([...empleados]);
    }
  }, [empleados, empleadosOriginales.length]);

  // Detectar cambios automáticamente
  useEffect(() => {
    if (empleadosOriginales.length > 0) {
      empleados.forEach((empleadoModificado, index) => {
        const empleadoOriginal = empleadosOriginales[index];
        if (empleadoOriginal) {
          const cambio = detectarCambioEmpleado(empleadoOriginal, empleadoModificado);
          if (cambio) {
            console.log('🔄 Cambio detectado automáticamente:', cambio);
            procesarCambioAutomatico(cambio);
          }
        }
      });
    }
  }, [empleados, empleadosOriginales, detectarCambioEmpleado, procesarCambioAutomatico]);

  // Función para editar empleado directamente
  const editarEmpleado = (identificador: string, campo: 'nombre' | 'cargo', nuevoValor: string) => {
    const empleadosActualizados = empleados.map(emp => 
      emp.identificador === identificador 
        ? { ...emp, [campo]: nuevoValor }
        : emp
    );
    
    onEmpleadosChange(empleadosActualizados);
  };

  // Función para aplicar formato automático
  const aplicarFormatoAutomatico = () => {
    const empleadosFormateados = empleados.map(emp => {
      // Si tiene cargo pero no está en el nombre, agregarlo
      if (emp.cargo && emp.cargo !== '' && emp.nombre && !emp.nombre.includes('(')) {
        return {
          ...emp,
          nombre: `${emp.nombre} (${emp.cargo})`,
          cargo: null
        };
      }
      return emp;
    });
    
    onEmpleadosChange(empleadosFormateados);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botón flotante */}
      <button
        onClick={() => setMostrarPanel(!mostrarPanel)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300"
        title="Gestión Automática de Empleados"
      >
        {sincronizando ? (
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        )}
      </button>

      {/* Panel de gestión */}
      {mostrarPanel && (
        <div className="absolute bottom-16 right-0 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Gestión Automática</h3>
            <button
              onClick={() => setMostrarPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Estado de sincronización */}
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${sincronizando ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className="text-gray-600">
                {sincronizando ? 'Sincronizando...' : 'Conectado'}
              </span>
            </div>
            {cambiosPendientes.length > 0 && (
              <div className="text-xs text-orange-600 mt-1">
                {cambiosPendientes.length} cambios pendientes
              </div>
            )}
          </div>

          {/* Acciones rápidas */}
          <div className="space-y-2">
            <button
              onClick={aplicarFormatoAutomatico}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm transition-colors"
            >
              🔄 Aplicar Formato Automático
            </button>
            
            <div className="text-xs text-gray-500">
              Convierte empleados con cargo a formato "NOMBRE (ROL)"
            </div>
          </div>

          {/* Lista de cambios pendientes */}
          {cambiosPendientes.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Cambios Pendientes:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {cambiosPendientes.map((cambio, index) => (
                  <div key={index} className="text-xs bg-orange-50 p-2 rounded border">
                    <div className="font-medium">{cambio.identificador}</div>
                    <div className="text-gray-600">
                      {cambio.campo}: "{cambio.valorAnterior}" → "{cambio.valorNuevo}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edición rápida */}
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Edición Rápida:</h4>
            <div className="space-y-2">
              {empleados.slice(0, 3).map((emp) => (
                <div key={emp.identificador} className="text-xs">
                  <div className="font-medium">{emp.identificador}</div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={emp.nombre || ''}
                      onChange={(e) => editarEmpleado(emp.identificador, 'nombre', e.target.value)}
                      className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-xs"
                      placeholder="Nombre"
                    />
                    <input
                      type="text"
                      value={emp.cargo || ''}
                      onChange={(e) => editarEmpleado(emp.identificador, 'cargo', e.target.value)}
                      className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-xs"
                      placeholder="Cargo"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorEmpleadosAutomatico;
