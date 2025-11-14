import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Package, CheckCircle } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import ImageDisplay from "@/upfile/ImageDisplay";

interface Asignacion {
  _id: string;
  pedido_id: string;
  orden: number;
  modulo: string;
  estado: string;
  item_id: string;
  empleado_id: string;
  empleado_nombre: string;
  fecha_asignacion: string;
  fecha_fin?: string;
  descripcionitem: string;
  detalleitem: string;
  cliente_nombre: string;
  costo_produccion: number;
  imagenes: string[];
  cantidad: number;
  unidad_index?: number; // NUEVO: Para identificar unidades individuales
}

const DashboardAsignaciones: React.FC = () => {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empleados, setEmpleados] = useState<any[]>([]);
  // Ref para mantener referencia actualizada de empleados sin causar re-renders
  const empleadosRef = useRef<any[]>([]);
  // Ref para controlar si es la carga inicial (mostrar loading) o actualización silenciosa
  const isInitialLoad = useRef(true);
  
  // Estados para el modal de PIN
  const [pinModal, setPinModal] = useState<{
    isOpen: boolean;
    asignacion: Asignacion | null;
  }>({ isOpen: false, asignacion: null });
  const [pin, setPin] = useState("");
  const [verificandoPin, setVerificandoPin] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<'success' | 'error' | 'manillar'>('success');

  // OPTIMIZACIÓN: Función memoizada para cargar empleados
  const cargarEmpleados = useCallback(async () => {
    try {
      const response = await fetch(`${getApiUrl()}/empleados/all/`);
      
      if (response.ok) {
        const data = await response.json();
        
        // ARREGLADO: El backend puede devolver {empleados: Array} o Array directo
        const empleadosArray = data.empleados || data;
        
        if (Array.isArray(empleadosArray)) {
          const empleadosActivos = empleadosArray.filter(emp => emp.activo !== false);
          setEmpleados(empleadosActivos);
          empleadosRef.current = empleadosActivos; // Actualizar ref
        } else {
          setEmpleados([]);
          empleadosRef.current = [];
        }
    } else {
        setEmpleados([]);
        empleadosRef.current = [];
      }
    } catch (error) {
      setEmpleados([]);
      empleadosRef.current = [];
    }
  }, []);

  // OPTIMIZACIÓN: Función memoizada para cargar asignaciones usando endpoint /pedidos/all/
  const cargarAsignaciones = useCallback(async (silent = false) => {
    // Solo mostrar loading en la carga inicial, no en actualizaciones silenciosas
    if (!silent && isInitialLoad.current) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // OPTIMIZACIÓN: Usar endpoint con límite para evitar cargar demasiados pedidos
      // Obtener pedidos con límite para mejor rendimiento
      const response = await fetch(`${getApiUrl()}/pedidos/all/?limite=200&ordenar=fecha_desc`);
      
      if (response.ok) {
        const pedidos = await response.json();
        
        // OPTIMIZACIÓN: Limitar procesamiento a los primeros 200 pedidos para mejor rendimiento
        const pedidosLimitados = Array.isArray(pedidos) ? pedidos.slice(0, 200) : [];
        
        // Extraer todas las asignaciones en proceso de todos los pedidos
        // OPTIMIZACIÓN: Usar Map para búsqueda rápida de items
        const itemsMap = new Map<string, any>();
        for (const pedido of pedidosLimitados) {
          if (Array.isArray(pedido.items)) {
            for (const item of pedido.items) {
              if (item.id) {
                itemsMap.set(item.id, item);
              }
            }
          }
        }
        
        const asignacionesRaw: any[] = [];
        
        for (const pedido of pedidosLimitados) {
          const pedido_id = pedido._id;
          const seguimiento = pedido.seguimiento || [];
          
            for (const sub of seguimiento) {
            if (sub.asignaciones_articulos && Array.isArray(sub.asignaciones_articulos)) {
              for (const asignacion of sub.asignaciones_articulos) {
                // OPTIMIZACIÓN: Usar Map para búsqueda O(1) en lugar de find O(n)
                const item = itemsMap.get(asignacion.itemId);
                
                // Verificar múltiples condiciones para determinar si está terminada
                // SI tiene fecha_fin, está terminada (sin importar el estado o estado_item)
                const estaTerminada = 
                  asignacion.fecha_fin ||  // Tiene fecha_fin - SIEMPRE significa que está terminada
                  asignacion.estado === "terminado" ||  // Estado es "terminado"
                  asignacion.estado_subestado === "terminado" ||  // Estado subestado es "terminado" (backend lo establece)
                  item?.estado_item === 4;  // Item está completamente terminado (estado_item 4)
                
                // IMPORTANTE: Verificar que el estado_item del item coincida con el orden del módulo
                // Si el item está en estado_item 3 (preparar) y la asignación es del orden 2 (masillar), NO mostrar
                const ordenDelModulo = sub.orden;  // El orden del proceso actual (1=herreria, 2=masillar, 3=preparar)
                const estadoItemActual = item?.estado_item || 1;  // El estado actual del item (1,2,3 o 4)
                const moduloCoincide = ordenDelModulo === estadoItemActual;  // Solo mostrar si el orden coincide con el estado_item
                
                // CRÍTICO: Filtrar estrictamente - solo mostrar si NO está terminada, tiene empleado asignado Y el módulo coincide
                if (asignacion.estado === "en_proceso" && !estaTerminada && asignacion.empleadoId && moduloCoincide) {
                  
                  // OPTIMIZACIÓN: Usar ref para acceder a empleados sin causar re-renders
                  // Esto evita loops infinitos de actualización
                  const empleado = empleadosRef.current.find(emp => 
                    emp._id === asignacion.empleadoId || 
                    emp.identificador === asignacion.empleadoId ||
                    String(emp.identificador) === String(asignacion.empleadoId)
                  );
                  
                  // Usar múltiples fuentes para el nombre del empleado
                  let nombreEmpleado = "Sin asignar";
                  if (empleado?.nombreCompleto) {
                    nombreEmpleado = empleado.nombreCompleto;
                  } else if (asignacion.nombreempleado) {
                    nombreEmpleado = asignacion.nombreempleado;
                  } else if (asignacion.nombreEmpleado) {
                    nombreEmpleado = asignacion.nombreEmpleado;
                  }
                  
                  // Obtener orden BASADO EN ESTADO_ITEM ACTUAL, no en el orden del subestado
                  // esto asegura que enviemos orden 3 cuando el item está en Preparar (estado_item 3)
                  const ordenActual = obtenerOrdenPorEstadoItem(item?.estado_item || 1);
                  
                  asignacionesRaw.push({
                    pedido_id,
                    item_id: asignacion.itemId,
                    empleado_id: asignacion.empleadoId,
                    empleado_nombre: nombreEmpleado,
                    orden: ordenActual,
                    modulo: obtenerModuloPorEstadoItem(item?.estado_item || 1),
                    estado: asignacion.estado || "en_proceso",
                    fecha_asignacion: asignacion.fecha_inicio || new Date().toISOString(),
                    fecha_fin: asignacion.fecha_fin,
                    descripcionitem: asignacion.descripcionitem || item?.nombre || "",
                    detalleitem: item?.detalleitem || "",
                    cliente_nombre: pedido.cliente_nombre || "",
                    costo_produccion: asignacion.costoproduccion || item?.costoProduccion || 0,
                    imagenes: item?.imagenes || [],
                    unidad_index: asignacion.unidad_index,
                    item: item
                  });
                }
              }
            }
          }
        }
        
          // Agrupar asignaciones por pedido_id + item_id + empleado_id + módulo + unidad_index para contar unidades
        // Si unidad_index está disponible, usar una clave única por unidad
        const asignacionesAgrupadas = new Map<string, any>();
        
        for (const asignacionRaw of asignacionesRaw) {
          // Si tiene unidad_index, usar una clave única por unidad para que no se agrupen
          const key = asignacionRaw.unidad_index !== undefined
            ? `${asignacionRaw.pedido_id}_${asignacionRaw.item_id}_${asignacionRaw.empleado_id}_${asignacionRaw.modulo}_${asignacionRaw.unidad_index}`
            : `${asignacionRaw.pedido_id}_${asignacionRaw.item_id}_${asignacionRaw.empleado_id}_${asignacionRaw.modulo}`;
          
          if (asignacionesAgrupadas.has(key)) {
            const existente = asignacionesAgrupadas.get(key);
            // Incrementar la cantidad siempre (cada asignación cuenta como 1 unidad)
            existente.cantidad = (existente.cantidad || 1) + 1;
          } else {
            // Primera asignación para esta combinación - cada asignación cuenta como 1
            const cantidad = 1;
            asignacionesAgrupadas.set(key, {
              ...asignacionRaw,
              cantidad: cantidad
            });
          }
        }
        
        // Convertir el Map a array de Asignacion
        const asignaciones: Asignacion[] = Array.from(asignacionesAgrupadas.values()).map(agrupada => ({
          _id: agrupada.unidad_index !== undefined
            ? `${agrupada.pedido_id}_${agrupada.item_id}_${agrupada.empleado_id}_${agrupada.modulo}_${agrupada.unidad_index}`
            : `${agrupada.pedido_id}_${agrupada.item_id}_${agrupada.empleado_id}_${agrupada.modulo}`,
          pedido_id: agrupada.pedido_id,
          orden: agrupada.orden,
          item_id: agrupada.item_id,
          empleado_id: agrupada.empleado_id,
          empleado_nombre: agrupada.empleado_nombre,
          modulo: agrupada.modulo,
          estado: agrupada.estado,
          fecha_asignacion: agrupada.fecha_asignacion,
          fecha_fin: agrupada.fecha_fin,
          descripcionitem: agrupada.descripcionitem,
          detalleitem: agrupada.detalleitem,
          cliente_nombre: agrupada.cliente_nombre,
          costo_produccion: agrupada.costo_produccion,
          imagenes: agrupada.imagenes,
          cantidad: agrupada.cantidad,
          unidad_index: agrupada.unidad_index // Incluir unidad_index si está disponible
        }));
        
        // Ordenar por fecha de asignación (más recientes primero)
        asignaciones.sort((a, b) => {
          const fechaA = new Date(a.fecha_asignacion).getTime();
          const fechaB = new Date(b.fecha_asignacion).getTime();
          return fechaB - fechaA; // Descendente (más recientes primero)
        });
        
        setAsignaciones(asignaciones);
        // Marcar que la carga inicial ya terminó
        isInitialLoad.current = false;
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
    } catch (err: any) {
      setError(`Error al cargar asignaciones: ${err.message}`);
      setAsignaciones([]);
      isInitialLoad.current = false;
    } finally {
      // Solo ocultar loading si no es una actualización silenciosa
      if (!silent) {
        setLoading(false);
      }
    }
  }, []); // Sin dependencias para evitar loops infinitos

  // Función helper para obtener módulo por estado_item
  const obtenerModuloPorEstadoItem = (estadoItem: number): string => {
    switch (estadoItem) {
      case 0: return 'pendiente';
      case 1: return 'herreria';
      case 2: return 'masillar';
      case 3: return 'preparar';
      case 4: return 'terminado';
      default: return 'herreria';
    }
  };

  // Función helper para obtener orden por estado_item
  const obtenerOrdenPorEstadoItem = (estadoItem: number): number => {
    // Mapeo directo: estado_item == orden del módulo
    // estado_item 1 → orden 1 (Herrería)
    // estado_item 2 → orden 2 (Masillar)
    // estado_item 3 → orden 3 (Preparar/Manillar)
    // estado_item 4 → orden 4 (Terminado)
    return estadoItem;
  };

  // OPTIMIZACIÓN: Cargar datos en paralelo al montar el componente
  useEffect(() => {
    // Cargar empleados primero, luego asignaciones (carga inicial con loading)
    cargarEmpleados().then(() => {
      // Después de cargar empleados, cargar asignaciones (mostrar loading solo en inicial)
      cargarAsignaciones(false).catch(() => {
        // Error silenciado para mejor rendimiento
      });
    }).catch(() => {
      // Si falla cargar empleados, intentar cargar asignaciones de todas formas
      cargarAsignaciones(false).catch(() => {
        // Error silenciado para mejor rendimiento
      });
    });
  }, []); // Solo ejecutar una vez al montar

  // Actualización automática cada 10 minutos (reducido para mejor rendimiento)
  // ACTUALIZACIÓN SILENCIOSA - sin mostrar loading
  useEffect(() => {
    const interval = setInterval(() => {
      cargarEmpleados().then(() => {
        cargarAsignaciones(true); // Actualización silenciosa
      }).catch(() => {
        cargarAsignaciones(true); // Actualización silenciosa aunque falle empleados
      });
    }, 10 * 60 * 1000); // 10 minutos en milisegundos

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, []); // Sin dependencias para evitar recrear el intervalo

  // NUEVO: Escuchar eventos de asignación realizada
  // ACTUALIZACIÓN SILENCIOSA - sin mostrar loading
  useEffect(() => {
    const handleAsignacionRealizada = () => {
      // Recargar asignaciones silenciosamente para mostrar la nueva asignación
      cargarAsignaciones(true); // Actualización silenciosa
    };

    window.addEventListener('asignacionRealizada', handleAsignacionRealizada);
    
    return () => {
      window.removeEventListener('asignacionRealizada', handleAsignacionRealizada);
    };
  }, []); // Sin dependencias - cargarAsignaciones es estable (sin dependencias)

  // Función para obtener color del módulo
  const obtenerColorModulo = (modulo: string) => {
    const colores: { [key: string]: string } = {
      pendiente: "bg-gray-100 text-gray-800",
      herreria: "bg-orange-100 text-orange-800",
      masillar: "bg-blue-100 text-blue-800", 
      preparar: "bg-green-100 text-green-800",
      terminado: "bg-purple-100 text-purple-800"
    };
    return colores[modulo] || "bg-gray-100 text-gray-800";
  };

  // Función para obtener icono del estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "en_proceso":
        return "🔄";
      case "terminado":
        return "✅";
      default:
        return "⏳";
    }
  };

  // OPTIMIZACIÓN: Memoizar contadores para evitar recalcular en cada render
  const estadisticas = useMemo(() => {
    const enProceso = asignaciones.filter(a => a.estado === "en_proceso").length;
    const terminadas = asignaciones.filter(a => a.estado === "terminado").length;
    return { enProceso, terminadas };
  }, [asignaciones]);


  // Función para manejar la terminación con PIN
  const handleConfirmarPin = async () => {
    if (!pinModal.asignacion || pin.length !== 4) {
      setMensaje("Por favor ingresa un PIN válido de 4 dígitos");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setVerificandoPin(true);
    try {
      const asig = pinModal.asignacion;
      
      // Buscar el empleado en la lista de empleados cargada para obtener su identificador
      // El backend necesita el identificador, no el _id
      const empleadoEncontrado = empleados.find(emp => 
        emp._id === asig.empleado_id || 
        emp.id === asig.empleado_id ||
        emp.identificador === asig.empleado_id
      );
      
      // Usar identificador si existe, si no usar _id como fallback
      const empleadoIdParaBackend = empleadoEncontrado?.identificador || asig.empleado_id;
      
      // Convertir orden a número
      const ordenNumero = typeof asig.orden === 'string' ? parseInt(asig.orden) : asig.orden;
      
      const payload: any = {
        pedido_id: asig.pedido_id,
        item_id: asig.item_id,
        empleado_id: empleadoIdParaBackend, // Usar identificador en lugar de _id
        estado: "terminado",
        fecha_fin: new Date().toISOString(),
        orden: ordenNumero,
        pin: pin
      };
      
      // CRÍTICO: Enviar unidad_index si está disponible para terminar la unidad correcta
      if (asig.unidad_index !== undefined) {
        payload.unidad_index = asig.unidad_index;
      }
      
      // Usar el endpoint correcto para terminar asignaciones
      const response = await fetch(`${getApiUrl()}/pedidos/asignacion/terminar`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 404) {
          const errorDetail = `El endpoint /pedidos/asignacion/terminar no está disponible en el servidor.
          
Posibles causas:
- El endpoint no está registrado en FastAPI
- Hay un conflicto con otros endpoints similares
- El router no está correctamente montado en main.py
- El código del backend no está desplegado en producción

Verifica en el backend:
1. Que el endpoint @router.put("/asignacion/terminar") esté en pedidos.py
2. Que el router esté montado en main.py: app.include_router(pedido_router, prefix="/pedidos")
3. Que no haya rutas duplicadas o conflictos`;
          throw new Error(errorDetail);
        }
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      
      // Disparar evento de asignación terminada para que PedidosHerreria recargue datos
      window.dispatchEvent(new CustomEvent('asignacionTerminada', {
        detail: {
          pedidoId: asig.pedido_id,
          itemId: asig.item_id,
          unidadIndex: asig.unidad_index, // Incluir unidad_index si está disponible
          timestamp: new Date().toISOString()
        }
      }));
      
      // Detectar si es Manillar (orden == 3)
      const ordenNum = typeof asig.orden === 'string' ? parseInt(asig.orden) : asig.orden;
      if (ordenNum === 3) {
        // Mostrar mensaje especial para Manillar
        setTipoMensaje('manillar');
        setMensaje("🎉 ¡Excelente! Tu artículo ha sido terminado y está disponible en tu inventario. ¡Puedes venderlo cuando sea necesario!");
        setTimeout(() => setMensaje(""), 8000); // Mensaje más largo para Manillar
        setTimeout(() => setTipoMensaje('success'), 8000);
      } else if (result.comision) {
        // Mensaje normal con información de comisión
        setTipoMensaje('success');
        setMensaje(`✅ Asignación terminada exitosamente. Costo de producción: $${result.comision.costo_produccion}`);
        setTimeout(() => setMensaje(""), 3000);
      } else {
        // Mensaje normal
        setTipoMensaje('success');
        setMensaje("✅ Asignación terminada exitosamente");
        setTimeout(() => setMensaje(""), 3000);
      }
      
      // Cerrar modal y limpiar
      setPinModal({ isOpen: false, asignacion: null });
      setPin("");
      
      // Recargar asignaciones silenciosamente para actualizar la lista
      await cargarAsignaciones(true);
      
    } catch (error: any) {
      setMensaje("❌ Error al terminar la asignación: " + error.message);
    } finally {
      setVerificandoPin(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Asignaciones</h1>
          <p className="text-gray-600">Gestiona todas las asignaciones de producción (ordenadas por fecha)</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => cargarAsignaciones(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refrescar
          </Button>
        </div>
        </div>
        
      {/* Mensaje de estado */}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 border border-red-300">
          {error}
      </div>
      )}


      {/* Mensaje de éxito/error */}
      {mensaje && (
        <div className={`mb-4 p-4 rounded-lg border-2 shadow-lg ${
          mensaje.includes("Error") || mensaje.includes("❌")
            ? "bg-red-100 text-red-700 border-red-300" 
            : tipoMensaje === 'manillar'
            ? "bg-blue-100 text-blue-800 border-blue-400 font-semibold"
            : "bg-green-100 text-green-700 border-green-300"
        }`}>
          <div className="flex items-center gap-2">
            {tipoMensaje === 'manillar' && <span className="text-2xl">🎉</span>}
            <span>{mensaje}</span>
          </div>
                  </div>
                )}

      {/* Estadísticas simples */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Asignaciones</p>
                <p className="text-2xl font-bold text-blue-600">{asignaciones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-orange-600">
                  {estadisticas.enProceso}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {estadisticas.terminadas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empleados Activos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {empleados.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de asignaciones */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-600 font-semibold">Cargando asignaciones...</span>
              </div>
      ) : asignaciones.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay asignaciones</h3>
            <p className="text-gray-500">
            {error 
              ? "Error al cargar las asignaciones. Verifica que el backend esté funcionando."
              : "No se encontraron asignaciones en el sistema."
              }
            </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {asignaciones.map((asignacion) => (
            <Card key={asignacion._id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">
                        {asignacion.descripcionitem}
                      </CardTitle>
                      <Badge className="bg-blue-600 text-white font-bold text-base px-3 py-1">
                        Cantidad: {asignacion.cantidad}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={obtenerColorModulo(asignacion.modulo)}>
                        {asignacion.modulo.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <span>{getEstadoIcon(asignacion.estado)}</span>
                        <span className="text-sm text-gray-600">
                          {asignacion.estado.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Asignado a:</p>
                    <p className="font-semibold">{asignacion.empleado_nombre}</p>
                    <p className="text-sm text-gray-500">
                      ${Number(asignacion.costo_produccion || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Cliente:</p>
                    <p className="font-medium">{asignacion.cliente_nombre || "Sin cliente"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pedido:</p>
                    <p className="font-medium">#{asignacion.pedido_id ? asignacion.pedido_id.slice(-4) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de asignación:</p>
                    <p className="font-medium">
                      {asignacion.fecha_asignacion ? new Date(asignacion.fecha_asignacion).toLocaleDateString() : 'Sin fecha'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Item ID:</p>
                    <p className="font-medium">{asignacion.item_id}</p>
                  </div>
                </div>
                
                {asignacion.detalleitem && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Detalles:</p>
                    <p className="text-sm bg-gray-50 p-2 rounded border">
                      {asignacion.detalleitem}
                    </p>
                  </div>
                )}

                {/* Mostrar imágenes del item */}
                {asignacion.imagenes && asignacion.imagenes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Imágenes del item:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {asignacion.imagenes.map((imagen: string, index: number) => (
                        <div key={index} className="relative">
                          <div className="w-full h-24 object-cover rounded border overflow-hidden">
                            <ImageDisplay
                              imageName={imagen}
                              alt={`Imagen ${index + 1} del item`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {asignacion.estado === "en_proceso" && (
                    <Button
                      size="sm"
                      onClick={() => setPinModal({ isOpen: true, asignacion })}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Terminar Asignación
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de verificación PIN */}
      <Dialog open={pinModal.isOpen} onOpenChange={(open) => {
        if (!open) {
          setPinModal({ isOpen: false, asignacion: null });
          setPin("");
        }
      }}>
        <DialogContent className="sm:max-w-md bg-white border-2 border-gray-200 shadow-xl">
          <DialogHeader className="bg-blue-50 p-4 rounded-t-lg">
            <DialogTitle className="text-xl font-bold text-blue-900">Terminar Asignación</DialogTitle>
          </DialogHeader>
          
          {pinModal.asignacion && (
            <div className="space-y-4 p-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-blue-900">{pinModal.asignacion.descripcionitem}</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Empleado:</span> 
                    <span className="text-gray-900 font-semibold">{pinModal.asignacion.empleado_nombre || "Sin asignar"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Módulo:</span> 
                    <span className="text-gray-900">{pinModal.asignacion.modulo || "N/A"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Cliente:</span> 
                    <span className="text-gray-900">{pinModal.asignacion.cliente_nombre || "Sin cliente"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Pedido:</span> 
                    <span className="text-gray-900">#{pinModal.asignacion.pedido_id ? pinModal.asignacion.pedido_id.slice(-4) : 'N/A'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Fecha:</span> 
                    <span className="text-gray-900">
                      {pinModal.asignacion.fecha_asignacion ? new Date(pinModal.asignacion.fecha_asignacion).toLocaleDateString() : 'Sin fecha'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Costo:</span> 
                    <span className="text-gray-900 font-semibold">${(pinModal.asignacion.costo_produccion || 0).toFixed(2)}</span>
                  </p>
                </div>
                
                {pinModal.asignacion.detalleitem && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="font-medium text-gray-700 mb-1">Detalles del Item:</p>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      {pinModal.asignacion.detalleitem}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label htmlFor="pin" className="text-sm font-medium text-gray-700 block mb-2">
                  Ingresa tu PIN de 4 dígitos
                </Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="0000"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  className="text-center text-xl tracking-widest font-mono border-2 border-gray-300 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPinModal({ isOpen: false, asignacion: null });
                    setPin("");
                  }}
                  disabled={verificandoPin}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmarPin}
                  disabled={pin.length !== 4 || verificandoPin}
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                >
                  {verificandoPin ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verificando...
                    </div>
                  ) : (
                    "Confirmar Terminación"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardAsignaciones;