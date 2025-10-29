import { useRef, useState, useEffect } from "react";
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
import api from "@/lib/api";
import ImageDisplay from "@/upfile/ImageDisplay";

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

  useEffect(() => {
    fetchClientes(`${apiUrl}/clientes/all`);
  }, []);

  useEffect(() => {
    fetchItems(`${apiUrl}/inventario/all`);
  }, []);

  useEffect(() => {
    const fetchMetodosPago = async () => {
      try {
        const response = await api("/metodos-pago");
        console.log("Métodos de pago cargados:", response);
        setMetodosPago(response);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    };
    fetchMetodosPago();
  }, []);

  // === Helpers de totales ===
  const totalItems = selectedItems.reduce(
    (acc, item) => acc + (item.confirmed ? item.cantidad : 0),
    0
  );
  const totalMonto = selectedItems.reduce(
    (acc, item) =>
      acc + (item.confirmed && item.precio ? item.cantidad * item.precio : 0),
    0
  );

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
    
    // Verificar que no se exceda el total del pedido
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
      const cantidadDisponible = itemData.cantidad || 0;

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

    // Si todos tienen existencia, marcar todos los estados como completados
    const seguimiento: PedidoSeguimiento[] = subestados.map((nombre, idx) => ({
      orden: idx + 1,
      nombre_subestado: nombre,
      estado: todosTienenExistencia ? "completado" : "pendiente",
      asignado_a: null,
      fecha_inicio: todosTienenExistencia ? fechaISO : null,
      fecha_fin: todosTienenExistencia ? fechaISO : null,
    }));

    const clienteObj = Array.isArray(clientesData)
      ? clientesData.find((c: any) => String(c.rif) === String(clienteId))
      : null;

    // Construir lista de items para el pedido
    const itemsPedido: PedidoItem[] = [];

    // Agregar los items al pedido
    itemsParaUsar.forEach((item) => {
      const itemData = Array.isArray(itemsData)
        ? (itemsData as any[]).find((it: any) => it._id === item.itemId)
        : undefined;
      
      if (!itemData) return;

      // Item con la cantidad disponible (esta se resta del inventario)
      // Si tiene cantidad disponible, estado_item = 4 (ya está listo, se resta del inventario)
      if (item.cantidad > 0) {
        // Asegurar que tenemos el código y el _id correctos
        const itemIdFinal = itemData._id ?? item.itemId;
        const codigoFinal = itemData.codigo || itemIdFinal;
        
        console.log("DEBUG CREAR PEDIDO: Item con existencia -", {
          nombre: itemData.nombre,
          codigo: codigoFinal,
          _id: itemIdFinal,
          cantidad: item.cantidad,
          estado_item: 4
        });
        
        itemsPedido.push({
          id: itemIdFinal,
          _id: itemIdFinal, // También enviar _id por si el backend lo necesita
          codigo: codigoFinal,
          nombre: itemData.nombre ?? "",
          descripcion: itemData.descripcion ?? "",
          categoria: itemData.categoria ?? "",
          precio: item.precio ?? itemData.precio ?? 0,
          costo: itemData.costo ?? 0,
          costoProduccion: itemData.costoProduccion ?? 0,
          cantidad: item.cantidad, // Cantidad disponible que se resta del inventario
          activo: itemData.activo ?? true,
          detalleitem: item.detalleitem || "",
          imagenes: itemData.imagenes ?? [],
          estado_item: 4, // Siempre 4 porque esta parte está disponible en inventario
        });
      }

      // Si hay cantidad faltante, agregar un item adicional con la cantidad faltante para producción
      const itemOriginal = selectedItems.find((it) => it.itemId === item.itemId);
      if (itemOriginal && itemOriginal.cantidad > item.cantidad) {
        const cantidadFaltante = itemOriginal.cantidad - item.cantidad;
        const itemIdFinal = itemData._id ?? item.itemId;
        const codigoFinal = itemData.codigo || itemIdFinal;
        
        itemsPedido.push({
          id: itemIdFinal,
          _id: itemIdFinal, // También enviar _id por si el backend lo necesita
          codigo: codigoFinal,
          nombre: itemData.nombre ?? "",
          descripcion: itemData.descripcion ?? "",
          categoria: itemData.categoria ?? "",
          precio: item.precio ?? itemData.precio ?? 0,
          costo: itemData.costo ?? 0,
          costoProduccion: itemData.costoProduccion ?? 0,
          cantidad: cantidadFaltante, // Cantidad faltante que va a producción
          activo: itemData.activo ?? true,
          detalleitem: item.detalleitem || "",
          imagenes: itemData.imagenes ?? [],
          estado_item: 0, // Siempre 0 (pendiente) para items que van a producción (pedidosherreria)
        });
      }
    });

    const pedidoPayload: PedidoPayload & { todos_items_disponibles?: boolean } = {
      cliente_id: String(clienteId),
      cliente_nombre: clienteObj?.nombre || "",
      fecha_creacion: fechaISO,
      fecha_actualizacion: fechaISO,
      estado_general: todosTienenExistencia ? "orden4" : "pendiente", // orden4 = listo para facturación
      items: itemsPedido,
      seguimiento,
      pago: pagos.length > 0 ? "abonado" : "sin pago",
      historial_pagos: pagos.length > 0 ? pagos : [],
      total_abonado: pagos.reduce((acc, p) => acc + p.monto, 0),
      todos_items_disponibles: todosTienenExistencia, // Flag para el backend
    };

    // Debug: Log del payload completo
    console.log("DEBUG CREAR PEDIDO: Payload completo -", {
      total_items: itemsPedido.length,
      items_con_estado_4: itemsPedido.filter(i => i.estado_item === 4).length,
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

    try {
      const resultado = await fetchPedido(`/pedidos/`, {
        method: "POST",
        body: pedidoPayload,
      });

      if (resultado?.success) {
        setMensaje("✅ Pedido creado correctamente.");
        setMensajeTipo("success");
        setClienteId(0);
        setClienteSearch("");
        setSelectedItems([]);
        setFecha(new Date().toISOString().slice(0, 10));
        setAbono(0);
        setPagos([]);
        setItemsFaltantes([]);
        setItemsAjustados([]);
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

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <Card className="shadow-xl border border-gray-100 rounded-2xl overflow-hidden">
        {/* Header */}
        <CardHeader className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <FaClipboardList className="text-2xl" />
          <CardTitle className="text-2xl font-bold">
            Sistema de Ventas
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
          <div className="space-y-6">
          {/* Layout principal: Cliente/Fecha arriba, Items y Resumen abajo */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

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
                const filtered: any[] = (itemsData as any[])?.filter((it) =>
                  it.nombre.toLowerCase().includes(item.search.toLowerCase())
                );

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
                                      <div className={`inline-block px-3 py-1 rounded-lg mb-2 ${f.cantidad > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        <p className="text-xs font-semibold">DISPONIBLE</p>
                                        <p className="text-lg font-bold">{f.cantidad || 0}</p>
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
                  {selectedItems.length > 0 && (
                    <>
                    {/* Totales */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <p className="text-gray-600 text-sm font-medium mb-2">Total de Artículos</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {totalItems}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
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
            </div> {/* Cierre de resumen (col-span-1) */}
          </div> {/* Cierre del grid de items y resumen */}
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
    </div>
  );
};

export default CrearPedido;