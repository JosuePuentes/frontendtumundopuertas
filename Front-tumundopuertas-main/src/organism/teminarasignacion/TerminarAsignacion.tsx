import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import useTerminarEmpleado from "@/hooks/useTerminarEmpleado";
import ImageDisplay from "@/upfile/ImageDisplay";
import { getApiUrl } from "@/lib/api";
interface Asignacion {
  pedido_id: string;
  item_id: string;
  descripcionitem: string;
  costoproduccion: string;
  estado: string;
  orden?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  nombreempleado?: string;
  estado_subestado?: string;
  detalleitem?: string;
  cliente_id?: string;
  imagenes?: string[];
  cliente: {
    cliente_nombre?: string;
    cliente_direccion?: string;
    cliente_telefono?: string;
    cliente_email?: string;
  };
}

const TerminarAsignacion: React.FC = () => {
  // VERSION ACTUALIZADA - FORZAR DESPLIEGUE
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string>("");
  const [articuloTerminado, setArticuloTerminado] = useState<string | null>(null);
  const identificador = localStorage.getItem("identificador");
  
  // Debug: Verificar que el código actualizado se está ejecutando
  console.log('🚀 CÓDIGO ACTUALIZADO EJECUTÁNDOSE - VERSIÓN CON LOGS DETALLADOS');

  const { terminarEmpleado, loading: terminando } = useTerminarEmpleado({
    onSuccess: (data) => {
      console.log('Asignación terminada exitosamente:', data);
      setMensaje("¡Asignación terminada exitosamente!");
      setTimeout(() => setMensaje(""), 3000);
      
      // Recargar las asignaciones después de terminar exitosamente
      setTimeout(() => {
        const fetchAsignaciones = async () => {
          setLoading(true);
          try {
            console.log('Recargando asignaciones...');
            const res = await fetch(
              `${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?empleado_id=${identificador}`
            );
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            console.log('Asignaciones actualizadas:', data);
            console.log('Cantidad de asignaciones:', data.length);
            
            // Filtrar asignaciones terminadas del backend
            const asignacionesActivas = data.filter((asig: any) => 
              asig.estado_subestado === "en_proceso" && asig.estado !== "terminado"
            );
            console.log('Asignaciones activas después del filtro:', asignacionesActivas.length);
            
            setAsignaciones(asignacionesActivas);
          } catch (err) {
            console.error('Error al recargar asignaciones:', err);
          }
          setLoading(false);
        };
        if (identificador) fetchAsignaciones();
      }, 1000); // Esperar 1 segundo para que el backend procese
    },
    onError: (error) => {
      console.error('Error al terminar asignación:', error);
      setMensaje("Error al terminar la asignación: " + error.message);
      setTimeout(() => setMensaje(""), 5000);
    }
  })

  useEffect(() => {
    const fetchAsignaciones = async () => {
      setLoading(true);
      try {
        // Consulta asignaciones en proceso para el usuario logueado
        const res = await fetch(
          `${getApiUrl()}/pedidos/comisiones/produccion/enproceso/?empleado_id=${identificador}`
        );
        const data = await res.json();
        
        // Filtrar asignaciones terminadas del backend
        const asignacionesActivas = data.filter((asig: any) => 
          asig.estado_subestado === "en_proceso" && asig.estado !== "terminado"
        );
        
        console.log('Asignaciones iniciales:', data.length);
        console.log('Asignaciones activas iniciales:', asignacionesActivas.length);
        
        setAsignaciones(asignacionesActivas);
      } catch (err) {
        console.error('Error al cargar asignaciones:', err);
      }
      setLoading(false);
    };
    if (identificador) fetchAsignaciones();
  }, [identificador]);

  if (loading) return <div>Cargando asignaciones...</div>;
  
  // Debug: Log de asignaciones actuales
  console.log('=== ESTADO ACTUAL ===');
  console.log('Asignaciones en estado:', asignaciones.length);
  console.log('Articulo terminado local:', articuloTerminado);
  asignaciones.forEach((a, index) => {
    console.log(`Asignación ${index}:`, {
      item_id: a.item_id,
      estado_subestado: a.estado_subestado,
      estado: a.estado,
      cliente: a.cliente?.cliente_nombre
    });
  });
  
  document.querySelectorAll('input[type="number"].no-mouse-wheel');
  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Asignaciones en proceso</h2>
      
      {/* Debug: Confirmar que el código actualizado se está ejecutando */}
      <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded border border-blue-300">
        <strong>🔧 VERSIÓN ACTUALIZADA:</strong> Si ves este mensaje, el código con logs detallados se está ejecutando correctamente.
      </div>
      
      {mensaje && (
        <div className={`mb-4 p-3 rounded ${
          mensaje.includes("Error") 
            ? "bg-red-100 text-red-700 border border-red-300" 
            : "bg-green-100 text-green-700 border border-green-300"
        }`}>
          {mensaje}
        </div>
      )}
      
      {asignaciones.length === 0 ? (
        <div className="text-gray-500">No tienes asignaciones en proceso.</div>
      ) : (
        <ul className="space-y-6">
          {asignaciones
            .filter((asig) => {
              // Solo mostrar artículos que no estén terminados localmente
              const isNotTerminadoLocal = articuloTerminado !== asig.item_id;
              
              console.log(`Artículo ${asig.item_id}:`, {
                isNotTerminadoLocal,
                articuloTerminado,
                estado_subestado: asig.estado_subestado,
                estado: asig.estado,
                shouldShow: isNotTerminadoLocal
              });
              
              return isNotTerminadoLocal;
            })
            .map((asig, idx) => (
              <li key={idx}>
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-primary">
                      Pedido #{asig.pedido_id?.slice(-4) || asig.pedido_id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Mostrar imágenes si existen */}
                    {Array.isArray(asig.imagenes) && asig.imagenes.length > 0 && (
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {asig.imagenes.slice(0, 3).map((img, imgIdx) => (
                          <ImageDisplay
                            key={imgIdx}
                            imageName={img}
                            alt={`Imagen ${imgIdx + 1}`}
                            style={{ maxWidth: 70, maxHeight: 70, borderRadius: 8, border: '1px solid #ddd' }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="font-bold text-gray-900">Descripción:</div>
                    <div className="text-gray-700 mb-2">
                      {asig.descripcionitem}
                    </div>
                    {asig.detalleitem && (
                      <div className="text-green-600 mb-2">
                        <span className="font-bold">Detalle:</span>{" "}
                        <span className="font-normal">{asig.detalleitem}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        {asig.cliente.cliente_nombre && (
                          <div>
                            <span className="font-semibold">
                              Cliente:
                            </span>{" "}
                            {asig.cliente.cliente_nombre}
                          </div>
                        )}
                        {asig.cliente_id && (
                          <div>
                            <span className="font-semibold">ID Cliente:</span>{" "}
                            {asig.cliente_id}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-4">
                      <button
                        onClick={async () => {
                          if (confirm(`¿Estás seguro de que quieres marcar como terminado el artículo "${asig.descripcionitem}"?`)) {
                            // Marcar inmediatamente como terminado en la UI
                            console.log('=== INICIANDO TERMINACIÓN ===');
                            console.log('Marcando artículo como terminado:', asig.item_id);
                            console.log('Estado actual del artículo:', {
                              item_id: asig.item_id,
                              estado_subestado: asig.estado_subestado,
                              estado: asig.estado
                            });
                            
                            setArticuloTerminado(asig.item_id);
                            console.log('Estado articuloTerminado actualizado a:', asig.item_id);
                            
                            await terminarEmpleado({
                              orden: asig.orden,
                              pedido_id: asig.pedido_id,
                              item_id: asig.item_id,
                              empleado_id: identificador,
                              estado: "terminado",
                              fecha_fin: new Date().toISOString(),
                            });
                            
                            console.log('=== TERMINACIÓN COMPLETADA ===');
                          }
                        }}
                        disabled={terminando || articuloTerminado === asig.item_id}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {terminando && articuloTerminado === asig.item_id ? "Terminando..." : "Marcar como Terminado"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default TerminarAsignacion;
