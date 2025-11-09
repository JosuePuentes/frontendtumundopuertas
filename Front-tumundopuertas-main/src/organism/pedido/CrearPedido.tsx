import { useRef, useState, useEffect, useMemo } from "react";
import {
  FaPlus,
  FaClipboardList,
  FaSearch,
  FaTrashRestore,
  FaMoneyBillWave,
} from "react-icons/fa";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePedido } from "@/hooks/usePedido";
import { useClientes } from "@/hooks/useClientes";
import { useItems } from "@/hooks/useItems";
import ImageDisplay from "@/upfile/ImageDisplay";
import CrearClienteModal from "@/organism/clientes/CrearClienteModal";

// Tipos locales para el payload
interface PedidoItem {
  id: string;
  _id?: string; // También incluir _id para compatibilidad con backend
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  costo: number;
  costoProduccion: number;
  cantidad: number;
  activo: boolean;
  detalleitem?: string;
  estado_item?: number; // 0 = pendiente, 4 = terminado
  imagenes?: string[]; // Imágenes del item
}

interface PedidoSeguimiento {
  orden: number;
  nombre_subestado: string;
  estado: string;
  asignado_a?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  notas?: string;
}

interface RegistroPago {
  fecha: string;
  monto: number;
  estado: string;
  metodo: string;
}

interface Adicional {
  descripcion?: string;
  precio: number;
  cantidad?: number; // default 1
  metodoPago?: string; // ID del método de pago seleccionado (no se envía al backend)
  metodoPagoNombre?: string; // Nombre del método de pago (no se envía al backend, solo para UI)
}

interface PedidoPayload {
  cliente_id: string;
  cliente_nombre: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  estado_general: string;
  items: PedidoItem[];
  seguimiento: PedidoSeguimiento[];
  pago: string;
  historial_pagos: RegistroPago[];
  total_abonado: number;
  adicionales?: Adicional[];
  sucursal?: string; // Campo de sucursal
}

type SelectedItem = {
  itemId: string;
  cantidad: number;
  search: string;
  precio?: number;
  detalleitem?: string;
  showSuggestions?: boolean;
  confirmed?: boolean;
};

const CrearPedido: React.FC = () => {
  const [clienteId, setClienteId] = useState<number>(0);
  const [clienteSearch, setClienteSearch] = useState<string>("");
  const [showClienteSuggestions, setShowClienteSuggestions] =
    useState<boolean>(false);
  const [fecha, setFecha] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [mensaje, setMensaje] = useState<string>("");
  const [mensajeTipo, setMensajeTipo] = useState<"error" | "success" | "">("");
  const [enviando, setEnviando] = useState(false);
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>("");
  const [abono, setAbono] = useState<number>(0);
  const [pagos, setPagos] = useState<RegistroPago[]>([]);
  const [modalFaltaExistenciaOpen, setModalFaltaExistenciaOpen] = useState(false);
  const [itemsFaltantes, setItemsFaltantes] = useState<Array<{nombre: string, codigo: string, cantidadSolicitada: number, cantidadDisponible: number, cantidadFaltante: number}>>([]);
  const [itemsAjustados, setItemsAjustados] = useState<SelectedItem[]>([]);
  const [adicionales, setAdicionales] = useState<Adicional[]>([]);
  const [nuevoAdicionalDescripcion, setNuevoAdicionalDescripcion] = useState<string>("");
  const [nuevoAdicionalMonto, setNuevoAdicionalMonto] = useState<number>(0);
  const [nuevoAdicionalMetodoPago, setNuevoAdicionalMetodoPago] = useState<string>("");
  const [sucursal, setSucursal] = useState<string>("");
  const [modalSucursalOpen, setModalSucursalOpen] = useState<boolean>(true); // Abrir al entrar
  const [modalCrearClienteOpen, setModalCrearClienteOpen] = useState<boolean>(false);

  const { fetchPedido } = usePedido();
  const {
    data: clientesData,
    loading: clientesLoading,
    error: clientesError,
    fetchClientes,
  } = useClientes();
  const { data: itemsData, loading: itemsLoading, fetchItems } = useItems();
  const [metodosPago, setMetodosPago] = useState<any[]>([]);

  const blurTimeouts = useRef<Record<number, number>>({});
  const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');

  // OPTIMIZACIÓN: Cargar clientes y métodos de pago en paralelo
  useEffect(() => {
    // Cargar clientes y métodos de pago en paralelo para mejor rendimiento
    Promise.all([
      fetchClientes(`${apiUrl}/clientes/all`),
      // Cargar métodos de pago también en paralelo
      fetch(`${apiUrl}/metodos-pago/all/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      }).then(res => res.json()).then(data => {
        setMetodosPago(data || []);
      }).catch(err => {
        console.error('Error cargando métodos de pago:', err);
        setMetodosPago([]);
      })
    ]).catch(err => {
      console.error('Error cargando datos iniciales:', err);
    });
  }, []);

  // Función para manejar cuando se crea un cliente exitosamente
  const handleClienteCreated = (cliente: { nombre: string; rif: string; direccion: string; telefono: string; _id?: string }) => {
    // Recargar la lista de clientes
    fetchClientes(`${apiUrl}/clientes/all`);
    
    // Seleccionar automáticamente el cliente recién creado
    setClienteId(cliente.rif as any);
    setClienteSearch("");
    setShowClienteSuggestions(false);
    
    // Cerrar el modal
    setModalCrearClienteOpen(false);
    
    // Mostrar mensaje de éxito
    setMensaje(`Cliente "${cliente.nombre}" creado y seleccionado correctamente ✅`);
    setMensajeTipo("success");
    setTimeout(() => {
      setMensaje("");
      setMensajeTipo("");
    }, 3000);
  };

  useEffect(() => {
    // Solo cargar inventario si hay sucursal seleccionada
    if (sucursal) {
      fetchItems(`${apiUrl}/inventario/all?sucursal=${sucursal}`);
    }
  }, [sucursal]);

  // Actualización automática del inventario cada 5 minutos
  useEffect(() => {
    if (!sucursal) return; // No hacer nada si no hay sucursal seleccionada

    // Función para actualizar inventario
    const actualizarInventario = () => {
      console.log("🔄 Actualizando inventario automáticamente...");
      fetchItems(`${apiUrl}/inventario/all?sucursal=${sucursal}`);
    };

    // Configurar intervalo de 5 minutos (300000 ms)
    const intervalo = setInterval(actualizarInventario, 5 * 60 * 1000);

    // Limpiar intervalo al desmontar el componente o cambiar de sucursal
    return () => {
      clearInterval(intervalo);
    };
  }, [sucursal, apiUrl, fetchItems]);

  // === Helpers de totales - OPTIMIZADOS con useMemo ===
  const totalItems = useMemo(() => {
    return selectedItems.reduce(
      (acc, item) => acc + (item.confirmed ? item.cantidad : 0),
      0
    );
  }, [selectedItems]);

  const totalMontoItems = useMemo(() => {
    return selectedItems.reduce(
      (acc, item) =>
        acc + (item.confirmed && item.precio ? item.cantidad * item.precio : 0),
      0
    );
  }, [selectedItems]);

  const totalAdicionales = useMemo(() => {
    return adicionales.reduce(
      (acc, adicional) => {
        const cantidad = adicional.cantidad || 1;
        const precio = adicional.precio || 0;
        return acc + (precio * cantidad);
      },
      0
    );
  }, [adicionales]);

  const totalMonto = useMemo(() => {
    return totalMontoItems + totalAdicionales;
  }, [totalMontoItems, totalAdicionales]);

  // === Handlers ===
  // @ts-ignore - Function is used in JSX but TypeScript doesn't detect it
  const handleAddPago = () => {
    console.log("handleAddPago llamado");
    console.log("abono:", abono);
    console.log("selectedMetodoPago:", selectedMetodoPago);
    
    if (abono <= 0) {
      setMensaje("El monto del abono debe ser mayor a cero.");
      setMensajeTipo("error");
      return;
    }
    if (!selectedMetodoPago) {
      setMensaje("Debe seleccionar un método de pago.");
      setMensajeTipo("error");
      return;
    }
    
    // Crear el nuevo pago
    const newPago: RegistroPago = {
      monto: abono,
      metodo: selectedMetodoPago,
      fecha: new Date().toISOString(),
      estado: 'confirmado'
    };
    
    // Calcular el total abonado actual
    const totalAbonadoActual = pagos.reduce((acc, p) => acc + p.monto, 0);
    
    // Verificar que no se exceda el total del pedido (items + adicionales)
    if (totalAbonadoActual + abono > totalMonto) {
      setMensaje(`El total abonado no puede exceder el total del pedido (${totalMonto.toFixed(2)}).`);
      setMensajeTipo("error");
      return;
    }
    
    // Agregar el pago al array
    setPagos([...pagos, newPago]);
    
    console.log("Abono procesado:", { monto: abono, metodo: selectedMetodoPago });
    setMensaje(`✓ Pago de $${abono.toFixed(2)} agregado exitosamente. Total abonado: $${(totalAbonadoActual + abono).toFixed(2)}`);
    setMensajeTipo("success");
    setAbono(0);
    setSelectedMetodoPago("");
  };

  // === Handlers ===
  const handleAddItem = () => {
    if (
      selectedItems.length > 0 &&
      !selectedItems[selectedItems.length - 1].confirmed
    ) {
      setMensaje(
        "Complete la selección del artículo anterior antes de agregar uno nuevo."
      );
      setMensajeTipo("error");
      return;
    }
    setSelectedItems((prev) => [
      ...prev,
      {
        itemId: "",
        cantidad: 1,
        search: "",
        showSuggestions: false,
        confirmed: false,
      },
    ]);
    setMensaje("");
    setMensajeTipo("");
  };

  const handleItemChange = (
    index: number,
    field: "itemId" | "cantidad" | "search" | "precio" | "detalleitem",
    value: number | string
  ) => {
    setSelectedItems((prev) => {
      const copy = [...prev];
      const updated = { ...copy[index], [field]: value } as SelectedItem;
      if (field === "search") {
        updated.confirmed = false;
        updated.showSuggestions = true;
      }
      copy[index] = updated;
      return copy;
    });
  };

  const handleInputBlur = (index: number) => {
    blurTimeouts.current[index] = window.setTimeout(() => {
      setSelectedItems((prev) => {
        const copy = [...prev];
        if (copy[index]) {
          if (!copy[index].confirmed) {
            copy[index].search = "";
            copy[index].itemId = "";
            copy[index].precio = undefined;
          }
          copy[index].showSuggestions = false;
        }
        return copy;
      });
      delete blurTimeouts.current[index];
    }, 120);
  };

  const handleSelectSuggestion = (
    index: number,
    producto: { _id: string; nombre: string; precio: number }
  ) => {
    setSelectedItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        itemId: producto._id,
        search: producto.nombre,
        precio: producto.precio,
        showSuggestions: false,
        confirmed: true,
      };
      return copy;
    });
    if (blurTimeouts.current[index]) {
      clearTimeout(blurTimeouts.current[index]);
      delete blurTimeouts.current[index];
    }
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
    if (blurTimeouts.current[index]) {
      clearTimeout(blurTimeouts.current[index]);
      delete blurTimeouts.current[index];
    }
  };

  const handleAgregarAdicional = () => {
    if (!nuevoAdicionalDescripcion.trim()) {
      setMensaje("Debes ingresar una descripción para el adicional.");
      setMensajeTipo("error");
      return;
    }
    if (nuevoAdicionalMonto <= 0) {
      setMensaje("El monto del adicional debe ser mayor a cero.");
      setMensajeTipo("error");
      return;
    }
    // Método de pago es OPCIONAL para adicionales
    
    const descripcionGuardada = nuevoAdicionalDescripcion.trim();
    const metodoPagoSeleccionado = nuevoAdicionalMetodoPago 
      ? metodosPago.find((m: any) => (m._id || m.id) === nuevoAdicionalMetodoPago)
      : null;
    const metodoPagoNombre = metodoPagoSeleccionado?.nombre || null;
    
    // Guardar adicional con estructura: { descripcion?, precio, cantidad? }
    // cantidad default es 1
    setAdicionales([...adicionales, {
      descripcion: descripcionGuardada,
      precio: nuevoAdicionalMonto, // El monto ingresado se guarda como precio
      cantidad: 1, // Por defecto cantidad es 1
      metodoPago: nuevoAdicionalMetodoPago || undefined, // Opcional: solo para UI y registro de depósito
      metodoPagoNombre: metodoPagoNombre || undefined // Opcional: solo para UI
    }]);
    
    const mensajeExito = metodoPagoNombre 
      ? `✓ Adicional "${descripcionGuardada}" agregado exitosamente. Se registrará en ${metodoPagoNombre}.`
      : `✓ Adicional "${descripcionGuardada}" agregado exitosamente.`;
    setMensaje(mensajeExito);
    setMensajeTipo("success");
    setNuevoAdicionalDescripcion("");
    setNuevoAdicionalMonto(0);
    setNuevoAdicionalMetodoPago("");
    setTimeout(() => {
      setMensaje("");
      setMensajeTipo("");
    }, 3000);
  };

  const handleEliminarAdicional = (index: number) => {
    setAdicionales(adicionales.filter((_, i) => i !== index));
  };


  // Función para validar y ajustar existencias
  const validarExistencias = () => {
    const faltantes: Array<{nombre: string, codigo: string, cantidadSolicitada: number, cantidadDisponible: number, cantidadFaltante: number}> = [];
    const itemsAjustadosTemp: SelectedItem[] = [];
    let todosTienenExistencia = true;

    selectedItems.forEach((item) => {
      const itemData = Array.isArray(itemsData)
        ? (itemsData as any[]).find((it: any) => it._id === item.itemId)
        : undefined;
      
      if (!itemData) return;

      const cantidadSolicitada = item.cantidad || 0;
      // Usar existencia_sucursal si existe, sino usar cantidad
      const cantidadDisponible = itemData.existencia_sucursal ?? itemData.cantidad ?? 0;

      if (cantidadSolicitada > cantidadDisponible) {
        todosTienenExistencia = false;
        const cantidadFaltante = cantidadSolicitada - cantidadDisponible;
        faltantes.push({
          nombre: itemData.nombre || itemData.descripcion || 'Sin nombre',
          codigo: itemData.codigo || '',
          cantidadSolicitada,
          cantidadDisponible,
          cantidadFaltante,
        });
        // Ajustar la cantidad al disponible
        itemsAjustadosTemp.push({
          ...item,
          cantidad: cantidadDisponible,
        });
      } else {
        itemsAjustadosTemp.push(item);
      }
    });

    return { faltantes, itemsAjustados: itemsAjustadosTemp, todosTienenExistencia };
  };

  const handleConfirmarConFaltaExistencia = async () => {
    setModalFaltaExistenciaOpen(false);
    await crearPedido(itemsAjustados, false); // false = no todos tienen existencia completa
  };

  const crearPedido = async (itemsParaUsar: SelectedItem[], todosTienenExistencia: boolean) => {
    setEnviando(true);

    const now = new Date();
    const fechaISO = now.toISOString();

    const subestados = [
      "Herreria / soldadura",
      "Masillar / Pintura",
      "Preparacion / Verificacion",
      "Facturacion",
      "Despacho",
      "sin definir 1",
      "sin definir 2",
    ];

    // Detectar cliente para forzar producción (RIF específico)
    const clienteObj = Array.isArray(clientesData)
      ? clientesData.find((c: any) => String(c.rif) === String(clienteId))
      : null;
    const rifNormalizado = (clienteObj?.rif || String(clienteId) || "").toUpperCase().replace(/\s+/g, "");
    const forzarProduccion = rifNormalizado === "J-507172554";

    // Si todos tienen existencia y NO es cliente forzado a producción, marcar estados como completados
    const seguimiento: PedidoSeguimiento[] = subestados.map((nombre, idx) => ({
      orden: idx + 1,
      nombre_subestado: nombre,
      estado: todosTienenExistencia && !forzarProduccion ? "completado" : "pendiente",
      asignado_a: null,
      fecha_inicio: todosTienenExistencia && !forzarProduccion ? fechaISO : null,
      fecha_fin: todosTienenExistencia && !forzarProduccion ? fechaISO : null,
    }));

    // Construir lista de items para el pedido
    const itemsPedido: PedidoItem[] = [];

    // Agregar los items al pedido
    itemsParaUsar.forEach((item) => {
      const itemData = Array.isArray(itemsData)
        ? (itemsData as any[]).find((it: any) => it._id === item.itemId)
        : undefined;
      if (!itemData) return;

      const itemIdFinal = itemData._id ?? item.itemId;
      const codigoFinal = itemData.codigo || itemIdFinal;

      if (forzarProduccion) {
        // Regla especial: todo va a producción (estado_item = 0) con la cantidad solicitada
        itemsPedido.push({
          id: itemIdFinal,
          _id: itemIdFinal,
          codigo: codigoFinal,
          nombre: itemData.nombre ?? "",
          descripcion: itemData.descripcion ?? "",
          categoria: itemData.categoria ?? "",
          precio: item.precio ?? itemData.precio ?? 0,
          costo: itemData.costo ?? 0,
          costoProduccion: itemData.costoProduccion ?? 0,
          cantidad: item.cantidad,
          activo: itemData.activo ?? true,
          detalleitem: item.detalleitem || "",
          imagenes: itemData.imagenes ?? [],
          estado_item: 0,
        });
        return;
      }

      // Comportamiento normal: dividir entre inventario disponible (estado 4) y faltante (estado 0)
      if (item.cantidad > 0) {
        itemsPedido.push({
          id: itemIdFinal,
          _id: itemIdFinal,
          codigo: codigoFinal,
          nombre: itemData.nombre ?? "",
          descripcion: itemData.descripcion ?? "",
          categoria: itemData.categoria ?? "",
          precio: item.precio ?? itemData.precio ?? 0,
          costo: itemData.costo ?? 0,
          costoProduccion: itemData.costoProduccion ?? 0,
          cantidad: item.cantidad,
          activo: itemData.activo ?? true,
          detalleitem: item.detalleitem || "",
          imagenes: itemData.imagenes ?? [],
          estado_item: 4,
        });
      }

      const itemOriginal = selectedItems.find((it) => it.itemId === item.itemId);
      if (itemOriginal && itemOriginal.cantidad > item.cantidad) {
        const cantidadFaltante = itemOriginal.cantidad - item.cantidad;
        itemsPedido.push({
          id: itemIdFinal,
          _id: itemIdFinal,
          codigo: codigoFinal,
          nombre: itemData.nombre ?? "",
          descripcion: itemData.descripcion ?? "",
          categoria: itemData.categoria ?? "",
          precio: item.precio ?? itemData.precio ?? 0,
          costo: itemData.costo ?? 0,
          costoProduccion: itemData.costoProduccion ?? 0,
          cantidad: cantidadFaltante,
          activo: itemData.activo ?? true,
          detalleitem: item.detalleitem || "",
          imagenes: itemData.imagenes ?? [],
          estado_item: 0,
        });
      }
    });

    const pedidoPayload: PedidoPayload & { todos_items_disponibles?: boolean } = {
      cliente_id: String(clienteId),
      cliente_nombre: clienteObj?.nombre || "",
      fecha_creacion: fechaISO,
      fecha_actualizacion: fechaISO,
      estado_general: todosTienenExistencia && !forzarProduccion ? "orden4" : "pendiente", // evitar marcar como listo si es cliente forzado
      items: itemsPedido,
      seguimiento,
      pago: pagos.length > 0 ? "abonado" : "sin pago",
      historial_pagos: pagos.length > 0 ? pagos : [],
      total_abonado: pagos.reduce((acc, p) => acc + p.monto, 0),
      todos_items_disponibles: todosTienenExistencia && !forzarProduccion, // Flag para el backend
      sucursal: sucursal, // Agregar sucursal al payload
      // Enviar adicionales al backend con estructura: { descripcion?, precio, cantidad? }
      // NO incluir metodoPago ni metodoPagoNombre (son solo para UI)
      // Siempre incluir el campo adicionales, aunque sea un array vacío
      adicionales: adicionales.length > 0 ? adicionales.map(ad => ({
        descripcion: ad.descripcion,
        precio: ad.precio,
        cantidad: ad.cantidad || 1
      })) : [],
    };

    // Debug: Log del payload completo
    console.log("🔍 DEBUG CREAR PEDIDO: Payload completo -", {
      total_items: itemsPedido.length,
      items_con_estado_4: itemsPedido.filter(i => i.estado_item === 4).length,
      adicionales_count: adicionales.length,
      adicionales_originales: adicionales, // Ver los adicionales originales
      adicionales_en_payload: pedidoPayload.adicionales, // Ver qué se envía
      items_con_estado_0: itemsPedido.filter(i => i.estado_item === 0).length,
      items: itemsPedido.map(i => ({
        nombre: i.nombre,
        codigo: i.codigo,
        id: i.id,
        _id: i._id,
        cantidad: i.cantidad,
        estado_item: i.estado_item
      })),
      todos_items_disponibles: todosTienenExistencia
    });

    // Debug: Log del JSON serializado para ver exactamente qué se envía
    const payloadSerializado = JSON.stringify(pedidoPayload, null, 2);
    console.log("🔍 DEBUG CREAR PEDIDO: Payload serializado (JSON) -", payloadSerializado);
    
    // Debug específico para adicionales
    if (adicionales.length > 0) {
      console.log("💰 DEBUG CREAR PEDIDO: Adicionales detallados -", {
        cantidad_adicionales: adicionales.length,
        adicionales_originales: adicionales.map(ad => ({
          descripcion: ad.descripcion,
          precio: ad.precio,
          cantidad: ad.cantidad || 1,
          metodoPago: ad.metodoPago,
          metodoPagoNombre: ad.metodoPagoNombre
        })),
        adicionales_para_enviar: pedidoPayload.adicionales?.map((ad: any) => ({
          descripcion: ad.descripcion,
          precio: ad.precio,
          cantidad: ad.cantidad
        })),
        payload_tiene_adicionales: pedidoPayload.adicionales !== undefined,
        payload_adicionales_count: pedidoPayload.adicionales?.length || 0
      });
    } else {
      console.log("⚠️ DEBUG CREAR PEDIDO: No hay adicionales para enviar");
    }
    console.log("DEBUG CREAR PEDIDO: Items con estado_item = 4 (deben restarse del inventario):", 
      itemsPedido.filter(i => i.estado_item === 4).map(i => ({
        nombre: i.nombre,
        codigo: i.codigo,
        _id: i._id,
        id: i.id,
        cantidad: i.cantidad,
        estado_item: i.estado_item
      }))
    );

    try {
      const resultado = await fetchPedido(`/pedidos/`, {
        method: "POST",
        body: pedidoPayload,
      });

      if (resultado?.success) {
        // Obtener el ID del pedido creado (declarar una sola vez)
        const pedidoData = resultado?.data || resultado;
        const pedidoId = pedidoData?._id || pedidoData?.id || pedidoData?.pedido?._id || pedidoData?.pedido?.id;
        
        // Debug: Verificar qué devolvió el backend
        console.log("✅ DEBUG CREAR PEDIDO: Respuesta del backend -", {
          success: resultado?.success,
          pedidoId: pedidoId,
          pedidoData_completo: pedidoData,
          adicionales_en_respuesta: pedidoData?.adicionales,
          tipo_adicionales_respuesta: typeof pedidoData?.adicionales,
          es_array_adicionales: Array.isArray(pedidoData?.adicionales),
          cantidad_adicionales_respuesta: Array.isArray(pedidoData?.adicionales) ? pedidoData.adicionales.length : 'N/A'
        });
        
        // Registrar depósitos en métodos de pago para cada adicional
        if (adicionales.length > 0 && pedidoId) {
          const depositosPromesas = adicionales.map(async (adicional) => {
            // Calcular monto del adicional: precio * cantidad
            const cantidad = adicional.cantidad || 1;
            const montoAdicional = adicional.precio * cantidad;
            
            if (adicional.metodoPago && montoAdicional > 0) {
              try {
                // Concepto mejorado con ID del pedido para identificación en historial
                const concepto = `Pedido ${pedidoId?.slice(-8) || 'N/A'} - Adicional: ${adicional.descripcion || 'Sin descripción'}`;
                
                console.log(`📝 Registrando depósito: $${montoAdicional.toFixed(2)} (precio: $${adicional.precio.toFixed(2)} x cantidad: ${cantidad}) en método ${adicional.metodoPago} (${adicional.metodoPagoNombre})`);
                console.log(`📝 Concepto: ${concepto}`);
                console.log(`📝 Pedido ID: ${pedidoId}`);
                
                const depositoRes = await fetch(`${apiUrl}/metodos-pago/${adicional.metodoPago}/deposito`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                  },
                  body: JSON.stringify({
                    monto: montoAdicional,
                    concepto: concepto
                  }),
                });
                
                if (depositoRes.ok) {
                  const depositoData = await depositoRes.json();
                  console.log(`✓ Adicional "${adicional.descripcion || 'Sin descripción'}" ($${montoAdicional.toFixed(2)}) registrado en método de pago ${adicional.metodoPagoNombre}`);
                  console.log(`✓ Respuesta del backend:`, depositoData);
                  return { success: true, adicional: adicional.descripcion || 'Sin descripción', monto: montoAdicional };
                } else {
                  const errorText = await depositoRes.text();
                  console.error(`✗ Error al registrar adicional "${adicional.descripcion || 'Sin descripción'}" en método de pago:`, depositoRes.status, errorText);
                  return { success: false, adicional: adicional.descripcion || 'Sin descripción', error: errorText };
                }
              } catch (error: any) {
                console.error(`✗ Error al registrar adicional "${adicional.descripcion || 'Sin descripción'}" en método de pago:`, error.message || error);
                return { success: false, adicional: adicional.descripcion || 'Sin descripción', error: error.message || error };
              }
            } else {
              console.warn(`⚠ Adicional "${adicional.descripcion || 'Sin descripción'}" no tiene método de pago o monto válido`);
              return null;
            }
          });
          
          const resultadosDepositos = await Promise.all(depositosPromesas);
          const exitosos = resultadosDepositos.filter(r => r !== null && r.success).length;
          const fallidos = resultadosDepositos.filter(r => r !== null && !r.success).length;
          const totalDepositado = resultadosDepositos
            .filter(r => r !== null && r.success)
            .reduce((acc, r) => acc + ((r?.monto || 0) || 0), 0);
          
          if (fallidos > 0) {
            console.warn(`⚠ ${fallidos} adicional(es) no pudo(eron) registrarse en métodos de pago`);
          } else if (exitosos > 0) {
            console.log(`✓ ${exitosos} adicional(es) registrado(s) en métodos de pago (Total: $${totalDepositado.toFixed(2)})`);
          }
        }
        
        // Variable para acumular mensajes
        const mensajesPartes: string[] = [];
        
        // Nota: El backend ahora registra automáticamente los pagos iniciales en el historial
        // cuando se crea el pedido, por lo que no es necesario hacerlo manualmente aquí
        if (pagos.length > 0) {
          console.log(`✓ ${pagos.length} pago(s) inicial(es) procesado(s) por el backend`);
        }
        
        // Construir mensaje final consolidado
        let mensajeFinal = "✅ Pedido creado correctamente.";
        if (mensajesPartes.length > 0) {
          mensajeFinal = `✅ Pedido creado. ${mensajesPartes.join(', ')}.`;
        }
        setMensaje(mensajeFinal);
        setMensajeTipo("success");
        setClienteId(0);
        setClienteSearch("");
        setSelectedItems([]);
        setFecha(new Date().toISOString().slice(0, 10));
        setAbono(0);
        setPagos([]);
        setItemsFaltantes([]);
        setItemsAjustados([]);
        setAdicionales([]);
        setNuevoAdicionalDescripcion("");
        setNuevoAdicionalMonto(0);
        setNuevoAdicionalMetodoPago("");
        // Refrescar la lista de items para mostrar las existencias actualizadas
        if (sucursal) {
          fetchItems(`${apiUrl}/inventario/all?sucursal=${sucursal}`);
        }
        
        // Disparar evento personalizado para notificar que se creó un pedido (reutilizar variables ya declaradas)
        window.dispatchEvent(new CustomEvent('pedidoCreado', {
          detail: {
            pedidoId: pedidoId,
            timestamp: new Date().toISOString(),
          }
        }));
      } else {
        setMensaje(resultado?.error || "Ocurrió un error al crear el pedido.");
        setMensajeTipo("error");
      }
    } catch (err: any) {
      setMensaje("No se pudo comunicar con el servidor.");
      setMensajeTipo("error");
    } finally {
      setEnviando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setMensajeTipo("");

    if (!sucursal) {
      setMensaje("Debes seleccionar una sucursal antes de crear el pedido.");
      setMensajeTipo("error");
      setModalSucursalOpen(true);
      return;
    }

    if (!clienteId || selectedItems.length === 0) {
      setMensaje("Seleccione un cliente y al menos un item.");
      setMensajeTipo("error");
      return;
    }

    if (selectedItems.some((item) => !item.confirmed)) {
      setMensaje("Hay artículos pendientes por seleccionar.");
      setMensajeTipo("error");
      return;
    }

    // Regla: Cliente RIF J-507172554 => todo va a producción, sin validar existencias ni métodos de pago
    const clienteObj = Array.isArray(clientesData)
      ? (clientesData as any[]).find((c: any) => String(c.rif) === String(clienteId))
      : null;
    const rifNormalizado = (clienteObj?.rif || String(clienteId) || "").toUpperCase().replace(/\s+/g, "");
    const forzarProduccion = rifNormalizado === "J-507172554";
    const esTumundoPuerta = rifNormalizado === "J-507172554";

    // Validar método de pago y monto (EXCEPTO para TU MUNDO PUERTA)
    if (!esTumundoPuerta) {
      // Verificar si hay pagos agregados O si hay un método y monto seleccionado
      const hayPagosAgregados = pagos.length > 0;
      const hayMetodoYMonto = selectedMetodoPago && abono > 0;
      
      if (!hayPagosAgregados && !hayMetodoYMonto) {
        if (!selectedMetodoPago) {
          setMensaje("Debes seleccionar un método de pago antes de crear el pedido.");
          setMensajeTipo("error");
          return;
        }
        if (!abono || abono <= 0) {
          setMensaje("Debes ingresar un monto de pago antes de crear el pedido.");
          setMensajeTipo("error");
          return;
        }
      }
    }

    if (forzarProduccion) {
      await crearPedido(selectedItems, false);
      return;
    }

    // Validar existencias
    const validacion = validarExistencias();

    // Si hay items faltantes, mostrar modal
    if (validacion.faltantes.length > 0) {
      setItemsFaltantes(validacion.faltantes);
      setItemsAjustados(validacion.itemsAjustados);
      setModalFaltaExistenciaOpen(true);
      return;
    }

    // Si todos tienen existencia, crear pedido directamente al 100%
    await crearPedido(selectedItems, validacion.todosTienenExistencia);
  };

  // Función para ordenar items por existencia_sucursal de la sucursal seleccionada (mayor a menor)
  const ordenarItemsPorExistencia = (items: any[]) => {
    if (!sucursal) return items; // Si no hay sucursal, no ordenar
    
    return [...items].sort((a, b) => {
      // Obtener existencia de la sucursal seleccionada
      // Si existe existencia_sucursal, usarlo (es el valor correcto para la sucursal seleccionada)
      // Si no, usar cantidad para sucursal1 o existencia2 para sucursal2
      const existenciaA = a.existencia_sucursal !== undefined 
        ? a.existencia_sucursal 
        : (sucursal === "sucursal1" ? (a.cantidad ?? 0) : (a.existencia2 ?? 0));
      const existenciaB = b.existencia_sucursal !== undefined 
        ? b.existencia_sucursal 
        : (sucursal === "sucursal1" ? (b.cantidad ?? 0) : (b.existencia2 ?? 0));
      return existenciaB - existenciaA; // Orden descendente (mayor primero)
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4">
      {/* Modal de selección de sucursal */}
      <Dialog open={modalSucursalOpen} onOpenChange={(open) => {
        if (!sucursal && !open) {
          // No permitir cerrar si no hay sucursal seleccionada
          return;
        }
        setModalSucursalOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Sucursal</DialogTitle>
            <DialogDescription>
              Selecciona la sucursal para crear el pedido. Los items se mostrarán ordenados por disponibilidad en esta sucursal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              value={sucursal}
              onValueChange={(value) => {
                // Si hay items seleccionados, limpiarlos al cambiar de sucursal
                if (selectedItems.length > 0) {
                  setSelectedItems([]);
                  setMensaje("Se han limpiado los items seleccionados al cambiar de sucursal.");
                  setMensajeTipo("success");
                  setTimeout(() => {
                    setMensaje("");
                    setMensajeTipo("");
                  }, 3000);
                }
                setSucursal(value);
                setModalSucursalOpen(false);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sucursal1">Sucursal 1</SelectItem>
                <SelectItem value="sucursal2">Sucursal 2</SelectItem>
              </SelectContent>
            </Select>
            {sucursal && (
              <p className="text-sm text-gray-600">
                ✓ Los items se mostrarán ordenados por disponibilidad en {sucursal === "sucursal1" ? "Sucursal 1" : "Sucursal 2"}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (sucursal) {
                  setModalSucursalOpen(false);
                }
              }}
              disabled={!sucursal}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-xl border border-gray-100 rounded-2xl overflow-hidden">
        {/* Header */}
        <CardHeader className="flex items-center justify-between gap-2 sm:gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <FaClipboardList className="text-xl sm:text-2xl" />
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold">
              Sistema de Ventas
              {sucursal && (
                <Badge className="ml-3 bg-white text-blue-600">
                  {sucursal === "sucursal1" ? "Sucursal 1" : "Sucursal 2"}
                </Badge>
              )}
            </CardTitle>
          </div>
          {sucursal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalSucursalOpen(true)}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Cambiar Sucursal
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-3 sm:p-4 md:p-6">
          <form onSubmit={handleSubmit}>
          <div className="space-y-6">
          {/* Layout principal: Cliente/Fecha arriba */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cliente */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Cliente
              </Label>
              <div className="relative flex items-center gap-2">
                <div className="relative w-full">
                  <Input
                    type="text"
                    value={
                      clienteId && Array.isArray(clientesData)
                        ? `${clienteId} - ${
                            (clientesData as any[]).find(
                              (c: any) => c.rif === clienteId
                            )?.nombre || ""
                          }`
                        : clienteSearch || ""
                    }
                    onChange={(e) => {
                      setClienteSearch(e.target.value);
                      setShowClienteSuggestions(true);
                    }}
                    onFocus={() => setShowClienteSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowClienteSuggestions(false), 120)
                    }
                    placeholder={
                      clientesLoading
                        ? "Cargando..."
                        : clientesError
                        ? "Error al cargar"
                        : "Buscar cliente por nombre o RIF..."
                    }
                    className="focus:ring-2 focus:ring-blue-400"
                    disabled={clientesLoading || !!clientesError}
                    autoComplete="off"
                  />

                  {showClienteSuggestions &&
                    clienteSearch.trim().length > 0 && (
                      <ScrollArea className="absolute left-0 right-0 top-full mt-2 z-30 border rounded-xl bg-white shadow-lg max-h-64 overflow-y-auto">
                        {clientesLoading && (
                          <div className="px-3 py-2 text-gray-500 text-sm">
                            Cargando...
                          </div>
                        )}
                        {clientesError && (
                          <div className="px-3 py-2 text-red-500 text-sm">
                            Error al cargar clientes
                          </div>
                        )}
                        {Array.isArray(clientesData) &&
                        (clientesData as any[]).length > 0 ? (
                          (clientesData as any[])
                            .filter((cliente: any) => {
                              const search = clienteSearch.toLowerCase();
                              return (
                                cliente.nombre.toLowerCase().includes(search) ||
                                String(cliente.rif)
                                  .toLowerCase()
                                  .includes(search)
                              );
                            })
                            .map((cliente: any, idx: number) => (
                              <div
                                key={`${cliente.rif}-${idx}`}
                                onMouseDown={(ev) => {
                                  ev.preventDefault();
                                  setClienteId(cliente.rif);
                                  setClienteSearch("");
                                  setShowClienteSuggestions(false);
                                }}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                              >
                                <p className="font-medium text-gray-800">
                                  {cliente.nombre}{" "}
                                  <span className="text-xs text-gray-500">
                                    ({cliente.rif})
                                  </span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  {cliente.direccion}
                                </p>
                                {cliente.telefono && (
                                  <p className="text-xs text-gray-500">
                                    Tel: {cliente.telefono}
                                  </p>
                                )}
                              </div>
                            ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-sm">
                            No hay clientes disponibles
                          </div>
                        )}
                      </ScrollArea>
                    )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setModalCrearClienteOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white border-green-500"
                  >
                    <FaPlus className="w-3 h-3 mr-1" />
                    Crear
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!clienteId}
                    onClick={() => {
                      setClienteId(0);
                      setClienteSearch("");
                    }}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Fecha
              </Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div> {/* Cierre del grid de Cliente/Fecha */}

          <Separator />

          {/* Items y Resumen en layout de columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Items - Ocupa 3 columnas como hoja Excel */}
            <div className="lg:col-span-3 space-y-4">
          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold text-gray-800">
                Items
              </Label>
              <Button type="button" onClick={handleAddItem} size="sm">
                <FaPlus /> Agregar Item
              </Button>
            </div>

            <div className="space-y-4">
              {selectedItems.map((item, idx) => {
                const filtered: any[] = Array.isArray(itemsData) 
                  ? ordenarItemsPorExistencia(
                      (itemsData as any[]).filter((it) =>
                        it?.nombre?.toLowerCase().includes(item.search?.toLowerCase() || '')
                      )
                    )
                  : [];

                // Buscar el itemData para mostrar imágenes
                const itemData = Array.isArray(itemsData)
                  ? (itemsData as any[]).find((it: any) => it._id === item.itemId)
                  : undefined;
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border p-4 rounded-xl bg-gray-50 shadow-sm hover:shadow-md transition"
                  >
                    {/* Buscador */}
                    <div className="col-span-1 md:col-span-7 relative">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <Input
                          className="pl-9 focus:ring-2 focus:ring-blue-400"
                          value={item.search}
                          onChange={(e) =>
                            handleItemChange(idx, "search", e.target.value)
                          }
                          onBlur={() => handleInputBlur(idx)}
                          onFocus={() =>
                            setSelectedItems((prev) => {
                              const copy = [...prev];
                              copy[idx].showSuggestions = true;
                              return copy;
                            })
                          }
                          placeholder="Buscar producto..."
                          autoComplete="off"
                          />
                      </div>
                      {item.showSuggestions &&
                        item.search.trim().length > 0 && (
                          <ScrollArea className="absolute left-0 right-0 z-30 mt-2 overflow-auto border-2 border-gray-300 rounded-xl bg-white max-h-80 shadow-2xl">
                            {filtered.length > 0 ? (
                              filtered.map((f: any, fidx: number) => (
                                <div
                                  key={`item-${f._id}-${fidx}`}
                                  onMouseDown={(ev) => {
                                    ev.preventDefault();
                                    handleSelectSuggestion(idx, f);
                                  }}
                                  className="px-4 py-4 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-200 bg-white"
                                >
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                      <p className="font-bold text-gray-900 text-lg mb-1">{f.nombre}</p>
                                      <p className="text-sm text-gray-600 mb-2">{f.descripcion}</p>
                                      <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">
                                          Cód: {f.codigo}
                                        </span>
                                        {f.modelo && (
                                          <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">
                                            Modelo: {f.modelo}
                                          </span>
                                        )}
                                        {f.categoria && (
                                          <span className="bg-blue-100 px-2 py-1 rounded text-blue-700 font-medium">
                                            {f.categoria}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-span-1 text-right">
                                      <div className="space-y-2 mb-2">
                                        {/* Mostrar ambas existencias, destacando la sucursal seleccionada */}
                                        {(() => {
                                          // El backend devuelve existencia_sucursal para la sucursal seleccionada
                                          // cantidad es la existencia de sucursal 1, existencia2 es sucursal 2
                                          const existenciaSuc1 = f.cantidad ?? 0;
                                          const existenciaSuc2 = f.existencia2 ?? 0;
                                          
                                          // Si hay existencia_sucursal, actualizar la de la sucursal correspondiente
                                          let existenciaSuc1Mostrar = existenciaSuc1;
                                          let existenciaSuc2Mostrar = existenciaSuc2;
                                          
                                          if (f.existencia_sucursal !== undefined) {
                                            if (sucursal === "sucursal1") {
                                              existenciaSuc1Mostrar = f.existencia_sucursal;
                                            } else if (sucursal === "sucursal2") {
                                              existenciaSuc2Mostrar = f.existencia_sucursal;
                                            }
                                          }
                                          
                                          return (
                                            <>
                                              {/* Sucursal 1 - destacada si está seleccionada */}
                                              <div className={`inline-block px-3 py-1 rounded-lg ${
                                                sucursal === "sucursal1" 
                                                  ? 'border-2 border-blue-500 bg-blue-50 text-blue-800' 
                                                  : existenciaSuc1Mostrar > 0 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-gray-100 text-gray-600'
                                              }`}>
                                                <p className="text-xs font-semibold">Sucursal 1</p>
                                                <p className="text-lg font-bold">{existenciaSuc1Mostrar}</p>
                                              </div>
                                              
                                              {/* Sucursal 2 - destacada si está seleccionada */}
                                              <div className={`inline-block px-3 py-1 rounded-lg ${
                                                sucursal === "sucursal2" 
                                                  ? 'border-2 border-purple-500 bg-purple-50 text-purple-800' 
                                                  : existenciaSuc2Mostrar > 0 
                                                    ? 'bg-purple-100 text-purple-700' 
                                                    : 'bg-gray-100 text-gray-600'
                                              }`}>
                                                <p className="text-xs font-semibold">Sucursal 2</p>
                                                <p className="text-lg font-bold">{existenciaSuc2Mostrar}</p>
                                              </div>
                                            </>
                                          );
                                        })()}
                                      </div>
                                      <p className="text-xl font-bold text-blue-600">${f.precio}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500 text-sm">
                                No encontrado
                              </div>
                            )}
                          </ScrollArea>
                        )}
                    </div>

                    {/* Cantidad */}
                    <div className="col-span-1 md:col-span-2">
                      <Label className="block text-xs text-gray-600 mb-1">
                        Cantidad
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "cantidad",
                            Number(e.target.value)
                          )
                        }
                        disabled={!item.confirmed}
                        className="w-24 focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    {/* Precio */}
                    <div className="col-span-1 md:col-span-2">
                      <Label className="block text-xs text-gray-600 mb-1">
                        Precio
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.precio ?? ""}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "precio",
                            Number(e.target.value)
                          )
                        }
                        disabled={!item.confirmed}
                        className="w-28 focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    {/* Quitar */}
                    <div className="col-span-1 md:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        variant="destructive"
                        size="icon"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <FaTrashRestore />
                      </Button>
                    </div>

                    {/* Detalle */}
                    <div className="col-span-1 md:col-span-12">
                      <Label className="block text-xs text-gray-600 mb-1">
                        Detalle del artículo
                      </Label>
                      <Input
                        type="text"
                        onChange={(e) =>
                          handleItemChange(idx, "detalleitem", e.target.value)
                        }
                        placeholder="Escribe un detalle..."
                        className="w-full focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                    {/* Imágenes del item seleccionado */}
                    {itemData && Array.isArray(itemData.imagenes) && itemData.imagenes.length > 0 && (
                      <div className="col-span-1 md:col-span-2 flex flex-col gap-2 items-center justify-center">
                        <Label className="block text-xs text-gray-600 mb-1">Imágenes</Label>
                        <div className="flex gap-2 flex-row">
                          {itemData.imagenes.slice(0, 3).map((img: string, imgIdx: number) => (
                            <ImageDisplay
                              key={imgIdx}
                              imageName={img}
                              alt={`Imagen ${imgIdx + 1}`}
                              style={{ maxWidth: 60, maxHeight: 60, borderRadius: 6, border: '1px solid #ddd' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {selectedItems.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
                  No hay items seleccionados.
                </p>
              )}
            </div>
            </div>
            </div> {/* Cierre de items (col-span-3) */}

            {/* Resumen del pedido - Ocupa 1 columna */}
            <div className="lg:col-span-1">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-800">Resumen del Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sección de Pagos */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-gray-700">
                        Agregar Pagos
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        Múltiples métodos
                      </Badge>
                    </div>

                    {/* Método de Pago */}
                    <Select onValueChange={(value) => {
                      console.log("Método seleccionado:", value);
                      setSelectedMetodoPago(value);
                    }} value={selectedMetodoPago || ""}>
                      <SelectTrigger className="w-full bg-white border-2">
                        <SelectValue placeholder="Seleccionar método de pago" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-gray-200 shadow-lg max-h-60">
                        {metodosPago.length === 0 ? (
                          <SelectItem value="no-methods" disabled className="text-gray-500 bg-gray-50">
                            No hay métodos disponibles
                          </SelectItem>
                        ) : (
                          metodosPago.map((metodo: any, index: number) => {
                            const metodoId = metodo._id || metodo.id || metodo.nombre || `metodo-${index}`;
                            return (
                              <SelectItem 
                                key={metodoId} 
                                value={metodoId}
                                className="bg-white hover:bg-blue-50 focus:bg-blue-50 text-gray-800 font-medium cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                {metodo.nombre || 'Sin nombre'}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>

                    {/* Monto */}
                    <div className="space-y-2">
                      <Label htmlFor="montoAbonar" className="text-sm font-semibold text-gray-700">
                        Monto
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="montoAbonar"
                          type="number"
                          min={0}
                          step="0.01"
                          value={abono}
                          onChange={(e) => setAbono(Number(e.target.value))}
                          placeholder="0.00"
                          className="flex-1 focus:ring-2 focus:ring-blue-400 border-2"
                          disabled={!selectedMetodoPago}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAbono(totalMonto);
                          }}
                          disabled={totalMonto === 0 || !selectedMetodoPago}
                          className="whitespace-nowrap bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          Total
                        </Button>
                      </div>
                    </div>

                    {/* Botón Agregar Pago */}
                    <Button
                      type="button"
                      onClick={handleAddPago}
                      disabled={abono <= 0 || !selectedMetodoPago}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      <FaMoneyBillWave className="mr-2" />
                      Agregar este Pago
                    </Button>
                  </div>

                  {pagos.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Pagos Registrados ({pagos.length})
                        </Label>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          ${pagos.reduce((acc, p) => acc + p.monto, 0).toFixed(2)}
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {pagos.map((pago, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 shadow-sm border-2 border-gray-200 hover:border-blue-300 transition">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <p className="text-sm font-bold text-blue-700">${pago.monto.toFixed(2)}</p>
                                <p className="text-xs text-gray-600">{metodosPago.find(m => (m._id || m.id) === pago.metodo)?.nombre}</p>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => {
                                  const newPagos = [...pagos];
                                  newPagos.splice(idx, 1);
                                  setPagos(newPagos);
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sección de Adicionales */}
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-gray-700">
                        Adicionales
                      </Label>
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                        Opcional
                      </Badge>
                    </div>
                    
                    {/* Formulario para agregar adicional */}
                    <div className="space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="space-y-2">
                        <Label htmlFor="adicionalDescripcion" className="text-xs font-medium text-gray-600">
                          Descripción
                        </Label>
                        <Input
                          id="adicionalDescripcion"
                          type="text"
                          value={nuevoAdicionalDescripcion}
                          onChange={(e) => setNuevoAdicionalDescripcion(e.target.value)}
                          placeholder="Ej: Transporte, Instalación..."
                          className="text-sm focus:ring-2 focus:ring-yellow-400 border-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adicionalMonto" className="text-xs font-medium text-gray-600">
                          Monto ($)
                        </Label>
                        <Input
                          id="adicionalMonto"
                          type="number"
                          min={0}
                          step="0.01"
                          value={nuevoAdicionalMonto || ""}
                          onChange={(e) => setNuevoAdicionalMonto(Number(e.target.value))}
                          placeholder="0.00"
                          className="text-sm focus:ring-2 focus:ring-yellow-400 border-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adicionalMetodoPago" className="text-xs font-medium text-gray-600">
                          Método de Pago <span className="text-gray-400 text-xs">(Opcional)</span>
                        </Label>
                        <Select 
                          value={nuevoAdicionalMetodoPago} 
                          onValueChange={setNuevoAdicionalMetodoPago}
                        >
                          <SelectTrigger className="text-sm focus:ring-2 focus:ring-yellow-400 border-2 bg-white">
                            <SelectValue placeholder="Seleccionar método de pago (opcional)" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-2 border-gray-200 shadow-lg max-h-60">
                            {metodosPago.length === 0 ? (
                              <SelectItem value="no-methods" disabled className="text-gray-500 bg-gray-50">
                                No hay métodos disponibles
                              </SelectItem>
                            ) : (
                              metodosPago.map((metodo: any, index: number) => {
                                const metodoId = metodo._id || metodo.id || metodo.nombre || `metodo-${index}`;
                                return (
                                  <SelectItem 
                                    key={metodoId} 
                                    value={metodoId}
                                    className="bg-white hover:bg-yellow-50 focus:bg-yellow-50 text-gray-800 font-medium cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    {metodo.nombre || 'Sin nombre'}
                                  </SelectItem>
                                );
                              })
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        onClick={handleAgregarAdicional}
                        disabled={!nuevoAdicionalDescripcion.trim() || nuevoAdicionalMonto <= 0}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold text-sm"
                      >
                        <FaPlus className="mr-2" />
                        Agregar Adicional
                      </Button>
                    </div>

                    {/* Lista de adicionales agregados */}
                    {adicionales.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {adicionales.map((adicional, idx) => {
                          const cantidad = adicional.cantidad || 1;
                          const precio = adicional.precio || 0;
                          const montoAdicional = precio * cantidad;
                          
                          return (
                          <div key={idx} className="bg-yellow-50 rounded-lg p-3 shadow-sm border-2 border-yellow-200 hover:border-yellow-300 transition">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">{adicional.descripcion}</p>
                                {adicional.metodoPagoNombre && (
                                  <p className="text-xs text-gray-600 mt-1">Método: {adicional.metodoPagoNombre}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-yellow-700">
                                  ${montoAdicional.toFixed(2)}
                                  {cantidad > 1 && <span className="text-xs text-yellow-600 ml-1">(x{cantidad})</span>}
                                </p>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600 text-white h-6 w-6 p-0"
                                  onClick={() => handleEliminarAdicional(idx)}
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Totales */}
                  {selectedItems.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <p className="text-gray-600 text-sm font-medium mb-2">Total de Artículos</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {totalItems}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <p className="text-gray-600 text-sm font-medium mb-2">Total Items</p>
                        <p className="text-2xl font-bold text-gray-700">
                          ${totalMontoItems.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      {totalAdicionales > 0 && (
                        <div className="bg-yellow-50 rounded-lg p-4 shadow-sm border-2 border-yellow-200">
                          <p className="text-gray-600 text-sm font-medium mb-2">Adicionales</p>
                          <p className="text-2xl font-bold text-yellow-700">
                            +${totalAdicionales.toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      )}
                      <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-blue-300">
                        <p className="text-gray-600 text-sm font-medium mb-2">Total del Pedido</p>
                        <p className="text-3xl font-bold text-blue-700">
                          ${totalMonto.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      {pagos.length > 0 && (
                        <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-green-200">
                          <p className="text-gray-600 text-sm font-medium mb-2">Total Abonado</p>
                          <p className="text-3xl font-bold text-green-700">
                            ${pagos.reduce((acc, p) => acc + p.monto, 0).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <div className="mt-2">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${Math.min((pagos.reduce((acc, p) => acc + p.monto, 0) / totalMonto) * 100, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {((pagos.reduce((acc, p) => acc + p.monto, 0) / totalMonto) * 100).toFixed(0)}% pagado
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Lista de items agregados */}
                  {selectedItems.filter(item => item.confirmed).length > 0 && (
                    <div className="space-y-2 mt-4">
                      <Label className="text-sm font-semibold text-gray-700">
                        Items Agregados
                      </Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedItems.filter(item => item.confirmed).map((item, idx) => {
                          const itemData = Array.isArray(itemsData)
                            ? (itemsData as any[]).find((it: any) => it._id === item.itemId)
                            : undefined;
                          return (
                            <div key={idx} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-800">{itemData?.nombre || item.search}</p>
                                  <p className="text-xs text-gray-600">Cód: {itemData?.codigo}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-blue-700">${((item.precio || 0) * item.cantidad).toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">x{item.cantidad}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Estado y Submit */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Estado:</p>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                    </div>
                    <Button
                      type="submit"
                      className="w-full mt-4 text-base font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition bg-blue-600 hover:bg-blue-700"
                      disabled={itemsLoading || clientesLoading || enviando || !clienteId || selectedItems.filter(i => i.confirmed).length === 0}
                    >
                      {enviando
                        ? "Enviando..."
                        : itemsLoading || clientesLoading
                        ? "Procesando..."
                        : "Crear Pedido"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
          </div> {/* Cierre de resumen */}
          </div> {/* Cierre del grid principal */}
          </div> {/* Cierre de space-y-6 del formulario */}
        </form>
      </CardContent>
      </Card>

      {/* Alertas */}
      {mensaje && (
        <div className="mt-6">
          <Alert
            variant={mensajeTipo === "error" ? "destructive" : "default"}
            className="rounded-xl"
          >
            <AlertTitle>
              {mensajeTipo === "error" ? "Error" : "Éxito"}
            </AlertTitle>
            <AlertDescription>{mensaje}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Modal de Falta de Existencia */}
      <Dialog open={modalFaltaExistenciaOpen} onOpenChange={setModalFaltaExistenciaOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-orange-600">
              ⚠️ Items sin Existencia Suficiente
            </DialogTitle>
            <DialogDescription>
              Los siguientes items no tienen suficiente existencia disponible. El pedido se creará con las cantidades disponibles y los items faltantes irán a producción.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <p className="font-semibold text-yellow-800 mb-3">
                {itemsFaltantes.length} item{itemsFaltantes.length !== 1 ? 's' : ''} {itemsFaltantes.length === 1 ? 'irá' : 'irán'} a producción por no disponer existencia suficiente:
              </p>
              
              <div className="space-y-3">
                {itemsFaltantes.map((item, index) => (
                  <div key={index} className="bg-white border border-yellow-300 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-lg text-gray-800">{item.nombre}</p>
                        <p className="text-sm text-gray-600">Código: {item.codigo}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Solicitado:</span>
                        <p className="text-lg font-bold text-blue-600">{item.cantidadSolicitada}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Disponible:</span>
                        <p className="text-lg font-bold text-green-600">{item.cantidadDisponible}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Faltante:</span>
                        <p className="text-lg font-bold text-red-600">{item.cantidadFaltante}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600">
                        ✓ Se entregará {item.cantidadDisponible} unidad{item.cantidadDisponible !== 1 ? 'es' : ''} ahora
                      </p>
                      <p className="text-xs text-orange-600 font-semibold">
                        → Se producirán {item.cantidadFaltante} unidad{item.cantidadFaltante !== 1 ? 'es' : ''} adicional{item.cantidadFaltante !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalFaltaExistenciaOpen(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarConFaltaExistencia}
              disabled={enviando}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {enviando ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                  Creando pedido...
                </>
              ) : (
                "Confirmar y Crear Pedido"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Crear Cliente */}
      <CrearClienteModal
        open={modalCrearClienteOpen}
        onClose={() => setModalCrearClienteOpen(false)}
        onClienteCreated={handleClienteCreated}
      />
    </div>
  );
};

export default CrearPedido;