import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useItems } from '@/hooks/useItems';
import { CheckCircle2, Receipt, FileText, RefreshCw, Search } from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import { 
  guardarPedidoCargadoInventario as apiGuardarPedidoInventario,
  getPedidosCargadosInventario as apiGetPedidosInventario
} from '@/lib/api';

interface InventarioItem {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  modelo: string;
  costo: number;
  costoProduccion: number;
  cantidad: number;
  precio: number;
  activo: boolean;
  imagenes: string[];
}

interface PedidoCargadoInventario {
  id: string;
  pedidoId: string;
  clienteNombre: string;
  clienteId: string;
  montoTotal: number;
  fechaCreacion: string;
  fechaCargaInventario: string;
  items: any[];
}

interface FacturaConfirmada {
  id: string;
  numeroFactura: string;
  pedidoId: string;
  clienteNombre: string;
  clienteId: string;
  montoTotal: number;
  fechaCreacion: string;
  fechaFacturacion: string;
  items: any[];
}

const CargarInventarioExcel: React.FC = () => {
  // Estados para Inventario Normal
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [fileName, setFileName] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [excelData, setExcelData] = useState<any[]>([]); // Guardar datos del Excel original

  const [showInventoryPreview, setShowInventoryPreview] = useState(false);
  const { data: currentInventory, fetchItems } = useItems();

  // Estados para búsqueda
  const [searchTermInventario, setSearchTermInventario] = useState('');
  
  // Estados para cargar/descargar existencias
  const [modalBuscarOpen, setModalBuscarOpen] = useState(false);
  const [modalConfirmarOpen, setModalConfirmarOpen] = useState(false);
  const [tipoOperacion, setTipoOperacion] = useState<'cargar' | 'descargar' | 'transferir' | null>(null);
  const [busquedaItem, setBusquedaItem] = useState('');
  const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
  const [cantidadOperacion, setCantidadOperacion] = useState<string>('');
  const [procesando, setProcesando] = useState(false);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<'sucursal1' | 'sucursal2'>('sucursal1');
  const [sucursalOrigen, setSucursalOrigen] = useState<'sucursal1' | 'sucursal2'>('sucursal1');
  const [sucursalDestino, setSucursalDestino] = useState<'sucursal1' | 'sucursal2'>('sucursal2');

  // Estados para módulos de Tu Mundo Puerta
  const [pedidosCargadosInventario, setPedidosCargadosInventario] = useState<PedidoCargadoInventario[]>([]);
  const [loadingTuMundoPuerta, setLoadingTuMundoPuerta] = useState<boolean>(false);
  const [busquedaTuMundoPuerta, setBusquedaTuMundoPuerta] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalAccion, setModalAccion] = useState<'cargar_inventario' | 'facturar'>('cargar_inventario');
  const [modalPreliminarOpen, setModalPreliminarOpen] = useState<boolean>(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [selectedFactura, setSelectedFactura] = useState<FacturaConfirmada | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);

  const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');

  // Función para cargar archivo Excel para Inventario Normal
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<any>(worksheet);

          // Guardar datos originales del Excel
          setExcelData(json);

          const mappedItems: InventarioItem[] = json.map((row) => ({
            codigo: String(row.codigo || ''),
            nombre: String(row.nombre || row.descripcion || 'Sin Nombre'),
            descripcion: String(row.descripcion || ''),
            categoria: String(row.categoria || 'General'),
            modelo: String(row.modelo || ''),
            costo: Number(row.costo || 0),
            costoProduccion: Number(row.costoProduccion || row.costo || 0),
            cantidad: Number(row.existencia || row['Sucursal 1'] || 0),
            precio: Number(row.precio || 0),
            activo: true,
            imagenes: [],
          }));

          setItems(mappedItems);
          setMensaje(`Se cargaron ${mappedItems.length} items del archivo.`);
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          setMensaje('Error al leer el archivo de Excel. Asegúrate de que el formato es correcto.');
          setItems([]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleGuardarInventario = async () => {
    if (items.length === 0) {
      setMensaje('No hay items para guardar.');
      return;
    }

    setMensaje('Guardando nuevo inventario...');
    console.log('Datos a enviar al backend para guardar:', items);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const response = await fetch(`${apiUrl}/inventario/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (!response.ok) {
        throw new Error('Error al guardar el nuevo inventario.');
      }
      setMensaje('Nuevo inventario guardado correctamente.');
      setItems([]);
      setFileName('');
      fetchItems(`${apiUrl}/inventario/all`);
    } catch (error: any) {
      console.error(error);
      setMensaje(`Error al guardar el nuevo inventario: ${error.message}`);
    }
  };

  const handleActualizarInventario = async () => {
    if (items.length === 0) {
      setMensaje('No hay items para actualizar.');
      return;
    }

    setMensaje('Actualizando inventario existente...');
    console.log('Datos a enviar al backend para actualizar:', items);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const response = await fetch(`${apiUrl}/inventario/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar el inventario.');
      }
      setMensaje('Inventario actualizado correctamente.');
      setItems([]);
      setFileName('');
      fetchItems(`${apiUrl}/inventario/all`);
    } catch (error: any) {
      console.error(error);
      setMensaje(`Error al actualizar el inventario: ${error.message}`);
    }
  };

  const handleCancelUpload = () => {
    setItems([]);
    setFileName('');
    setMensaje('');
    setExcelData([]);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleShowInventoryPreview = () => {
    fetchItems(`${apiUrl}/inventario/all`);
    setShowInventoryPreview(true);
  };

  const handleExportPdf = () => {
    setMensaje('Exportando a PDF... (funcionalidad no implementada)');
  };

  const handleExportExcel = () => {
    setMensaje('Exportando a Excel... (funcionalidad no implementada)');
  };

  // Filtrar inventario normal por término de búsqueda
  const filteredInventory = useMemo(() => {
    if (!currentInventory) return [];
    if (!searchTermInventario) return currentInventory;
    
    const searchLower = searchTermInventario.toLowerCase();
    return currentInventory.filter((item: any) => 
      item.nombre?.toLowerCase().includes(searchLower) ||
      item.descripcion?.toLowerCase().includes(searchLower) ||
      item.codigo?.toLowerCase().includes(searchLower) ||
      item.modelo?.toLowerCase().includes(searchLower)
    );
  }, [currentInventory, searchTermInventario]);

  // Filtrar items para el modal de búsqueda
  const itemsFiltrados = useMemo(() => {
    if (!currentInventory) return [];
    if (!busquedaItem) return currentInventory.slice(0, 20); // Limitar a 20 sin búsqueda
    
    const searchLower = busquedaItem.toLowerCase();
    return currentInventory.filter((item: any) => 
      item.nombre?.toLowerCase().includes(searchLower) ||
      item.descripcion?.toLowerCase().includes(searchLower) ||
      item.codigo?.toLowerCase().includes(searchLower) ||
      item.modelo?.toLowerCase().includes(searchLower)
    ).slice(0, 20);
  }, [currentInventory, busquedaItem]);

  // Funciones para cargar/descargar existencias
  const handleAbrirModalBuscar = (tipo: 'cargar' | 'descargar' | 'transferir') => {
    setTipoOperacion(tipo);
    setBusquedaItem('');
    setItemSeleccionado(null);
    setCantidadOperacion('');
    if (tipo === 'transferir') {
      setSucursalOrigen('sucursal1');
      setSucursalDestino('sucursal2');
    }
    fetchItems(`${apiUrl}/inventario/all`);
    setModalBuscarOpen(true);
  };

  const handleSeleccionarItem = (item: any) => {
    setItemSeleccionado(item);
    setModalBuscarOpen(false);
    setModalConfirmarOpen(true);
    // Reset cantidad al seleccionar nuevo item
    setCantidadOperacion('');
  };

  const handleConfirmarOperacion = async () => {
    if (!itemSeleccionado || !cantidadOperacion) {
      setMensaje('Por favor ingresa una cantidad válida.');
      return;
    }

    const cantidad = parseFloat(cantidadOperacion);
    if (isNaN(cantidad) || cantidad <= 0) {
      setMensaje('La cantidad debe ser un número mayor a 0.');
      return;
    }

    // Validación para transferencias
    if (tipoOperacion === 'transferir') {
      if (sucursalOrigen === sucursalDestino) {
        setMensaje('Las sucursales de origen y destino deben ser diferentes.');
        return;
      }
      
      const existenciaOrigen = sucursalOrigen === 'sucursal1' 
        ? (itemSeleccionado.cantidad !== undefined ? itemSeleccionado.cantidad : (itemSeleccionado.existencia || 0))
        : (itemSeleccionado.existencia2 !== undefined ? itemSeleccionado.existencia2 : 0);
      
      if (cantidad > existenciaOrigen) {
        setMensaje(`No puedes transferir más de lo disponible. ${sucursalOrigen === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'} actual: ${existenciaOrigen}`);
        return;
      }
    } else {
      const campoExistencia = sucursalSeleccionada === 'sucursal1' ? 'existencia' : 'existencia2';
      const existenciaActual = itemSeleccionado[sucursalSeleccionada === 'sucursal1' ? 'cantidad' : 'existencia2'] !== undefined 
        ? itemSeleccionado[sucursalSeleccionada === 'sucursal1' ? 'cantidad' : 'existencia2'] 
        : (itemSeleccionado[campoExistencia] || itemSeleccionado.existencia || 0);
      
      if (tipoOperacion === 'descargar' && cantidad > existenciaActual) {
        setMensaje(`No puedes descargar más de lo disponible. ${sucursalSeleccionada === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'} actual: ${existenciaActual}`);
        return;
      }
    }

    setProcesando(true);
    try {
      if (tipoOperacion === 'transferir') {
        // Transferencia: descargar de origen y cargar en destino
        // Primero descargar de la sucursal origen
        const urlDescarga = `${apiUrl}/inventario/${itemSeleccionado._id}/existencia`;
        const responseDescarga = await fetch(urlDescarga, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cantidad: cantidad,
            tipo: 'descargar',
            sucursal: sucursalOrigen,
          }),
        });

        if (!responseDescarga.ok) {
          const errorData = await responseDescarga.json().catch(() => ({ detail: 'Error al descargar de la sucursal origen' }));
          throw new Error(errorData.detail || 'Error al descargar de la sucursal origen');
        }

        // Luego cargar en la sucursal destino
        const responseCarga = await fetch(urlDescarga, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cantidad: cantidad,
            tipo: 'cargar',
            sucursal: sucursalDestino,
          }),
        });

        if (!responseCarga.ok) {
          const errorData = await responseCarga.json().catch(() => ({ detail: 'Error al cargar en la sucursal destino' }));
          // Intentar revertir la descarga si la carga falla
          await fetch(urlDescarga, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cantidad: cantidad,
              tipo: 'cargar',
              sucursal: sucursalOrigen,
            }),
          }).catch(() => {});
          throw new Error(errorData.detail || 'Error al cargar en la sucursal destino');
        }

        const result = await responseCarga.json();
        const existenciaOrigen = sucursalOrigen === 'sucursal1' ? result.cantidad : result.existencia2;
        const existenciaDestino = sucursalDestino === 'sucursal1' ? result.cantidad : result.existencia2;
        
        setMensaje(`✅ Transferencia realizada exitosamente. ${sucursalOrigen === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}: ${existenciaOrigen}, ${sucursalDestino === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}: ${existenciaDestino}`);
      } else {
        const url = `${apiUrl}/inventario/${itemSeleccionado._id}/existencia`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cantidad: cantidad,
            tipo: tipoOperacion, // 'cargar' o 'descargar'
            sucursal: sucursalSeleccionada, // 'sucursal1' o 'sucursal2'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Error en la operación' }));
          throw new Error(errorData.detail || 'Error en la operación');
        }

        const result = await response.json();
        const campoRespuesta = sucursalSeleccionada === 'sucursal1' ? 'cantidad' : 'existencia2';
        const nuevaExistencia = result[campoRespuesta] !== undefined ? result[campoRespuesta] : (result.existencia || result.existencia2 || 0);
        setMensaje(`✅ ${tipoOperacion === 'cargar' ? 'Carga' : 'Descarga'} realizada exitosamente en ${sucursalSeleccionada === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}. Nueva existencia: ${nuevaExistencia}`);
      }
      
      // Recargar inventario
      await fetchItems(`${apiUrl}/inventario/all`);
      
      // Cerrar modales y limpiar
      setModalConfirmarOpen(false);
      setItemSeleccionado(null);
      setCantidadOperacion('');
      setTipoOperacion(null);
      setBusquedaItem('');
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelarOperacion = () => {
    setModalConfirmarOpen(false);
    setModalBuscarOpen(false);
    setItemSeleccionado(null);
    setCantidadOperacion('');
    setTipoOperacion(null);
    setBusquedaItem('');
    setSucursalSeleccionada('sucursal1'); // Reset a sucursal 1
    setSucursalOrigen('sucursal1');
    setSucursalDestino('sucursal2');
  };

  // ============ FUNCIONES PARA MÓDULOS DE TU MUNDO PUERTA ============

  // Función para obtener todos los pedidos de TU MUNDO PUERTA
  const fetchPedidosTuMundoPuerta = async () => {
    setLoadingTuMundoPuerta(true);
    try {
      // Cargar primero desde localStorage para preservar los pedidos ya cargados
      const storedPedidos = localStorage.getItem('pedidos_cargados_inventario');
      const pedidosDesdeStorage: PedidoCargadoInventario[] = storedPedidos ? JSON.parse(storedPedidos) : [];
      
      // Obtener todos los pedidos del backend
      const res = await fetch(`${getApiUrl()}/pedidos/all/`);
      if (!res.ok) {
        console.warn('No se pudieron obtener pedidos del backend para TU MUNDO PUERTA');
        // Cargar solo desde localStorage
        if (pedidosDesdeStorage.length > 0) {
          setPedidosCargadosInventario(pedidosDesdeStorage);
        }
        return;
      }
      
      const todosPedidos = await res.json();
      const rifClienteEspecial = 'J-507172554';
      
      // Filtrar solo los pedidos del cliente especial TU MUNDO PUERTA
      const pedidosTuMundoPuerta = todosPedidos.filter((pedido: any) => {
        const rifPedido = String(pedido?.cliente_id || '').toUpperCase().replace(/\s+/g, '');
        return rifPedido === rifClienteEspecial;
      });
      
      // Convertir a formato PedidoCargadoInventario y ordenar por fecha más reciente
      const pedidosFormateados: PedidoCargadoInventario[] = pedidosTuMundoPuerta.map((pedido: any) => {
        // Calcular monto total si no está disponible
        let montoTotal = 0;
        if (pedido.montoTotal !== undefined) {
          montoTotal = pedido.montoTotal;
        } else if (pedido.items && Array.isArray(pedido.items)) {
          montoTotal = pedido.items.reduce((acc: number, item: any) => {
            return acc + ((item.precio || 0) * (item.cantidad || 0));
          }, 0);
        }
        
        // Buscar si este pedido ya está en localStorage con información de carga
        const pedidoEnStorage = pedidosDesdeStorage.find((p: PedidoCargadoInventario) => p.pedidoId === pedido._id);
        
        return {
          id: pedido._id,
          pedidoId: pedido._id,
          clienteNombre: pedido.cliente_nombre || 'TU MUNDO PUERTA',
          clienteId: pedido.cliente_id || rifClienteEspecial,
          montoTotal: montoTotal,
          fechaCreacion: pedido.fecha_creacion || new Date().toISOString(),
          // Preservar fechaCargaInventario si existe en localStorage, sino usar fecha_creacion
          fechaCargaInventario: pedidoEnStorage?.fechaCargaInventario || pedido.fecha_creacion || new Date().toISOString(),
          items: pedido.items || []
        };
      }).sort((a: PedidoCargadoInventario, b: PedidoCargadoInventario) => {
        // Ordenar por fecha más reciente primero
        const fechaA = new Date(a.fechaCreacion).getTime();
        const fechaB = new Date(b.fechaCreacion).getTime();
        return fechaB - fechaA;
      });
      
      // Combinar con los pedidos del localStorage que no están en el backend (por si acaso)
      const pedidosIdsDelBackend = new Set(pedidosFormateados.map((p: PedidoCargadoInventario) => p.pedidoId));
      const pedidosSoloEnStorage = pedidosDesdeStorage.filter(
        (p: PedidoCargadoInventario) => !pedidosIdsDelBackend.has(p.pedidoId)
      );
      
      const pedidosCombinados = [...pedidosFormateados, ...pedidosSoloEnStorage].sort((a: PedidoCargadoInventario, b: PedidoCargadoInventario) => {
        const fechaA = new Date(a.fechaCreacion).getTime();
        const fechaB = new Date(b.fechaCreacion).getTime();
        return fechaB - fechaA;
      });
      
      setPedidosCargadosInventario(pedidosCombinados);
      console.log(`✅ Pedidos de TU MUNDO PUERTA cargados: ${pedidosCombinados.length}`);
    } catch (error) {
      console.error('Error al obtener pedidos de TU MUNDO PUERTA:', error);
      // Cargar desde localStorage como fallback
      const storedPedidos = localStorage.getItem('pedidos_cargados_inventario');
      if (storedPedidos) {
        setPedidosCargadosInventario(JSON.parse(storedPedidos));
      }
    } finally {
      setLoadingTuMundoPuerta(false);
    }
  };

  // Cargar pedidos de TU MUNDO PUERTA al iniciar
  useEffect(() => {
    fetchPedidosTuMundoPuerta();
  }, []);

  // Cargar pedidos cargados al inventario desde backend y localStorage
  useEffect(() => {
    const cargarDatos = async () => {
      // 1. Cargar PRIMERO desde localStorage para mostrar datos inmediatamente
      const storedPedidosInventario = localStorage.getItem('pedidos_cargados_inventario');
      if (storedPedidosInventario) {
        try {
          const pedidosLocal = JSON.parse(storedPedidosInventario);
          if (Array.isArray(pedidosLocal) && pedidosLocal.length > 0) {
            setPedidosCargadosInventario(pedidosLocal);
            console.log('📦 Pedidos cargados al inventario cargados desde localStorage (inicial):', pedidosLocal.length);
          }
        } catch (e) {
          console.error('Error parseando pedidos de localStorage:', e);
        }
      }
      
      // 2. Intentar actualizar desde backend (priorizar BD sobre localStorage)
      try {
        const pedidosBackend = await apiGetPedidosInventario();
        if (pedidosBackend && Array.isArray(pedidosBackend)) {
          setPedidosCargadosInventario(pedidosBackend);
          localStorage.setItem('pedidos_cargados_inventario', JSON.stringify(pedidosBackend));
          
          if (pedidosBackend.length > 0) {
            console.log('✅ Pedidos cargados al inventario sincronizados desde BD:', pedidosBackend.length);
          } else {
            console.log('📭 BD está vacía para pedidos (se sincronizó correctamente)');
          }
        } else {
          console.warn('⚠️ Respuesta del backend no es un array válido:', pedidosBackend);
        }
      } catch (error) {
        console.error('❌ Error al cargar pedidos desde BD:', error);
        console.warn('⚠️ Usando datos de localStorage como fallback');
      }
    };
    
    cargarDatos();
  }, []);

  // Separar pedidos de TU MUNDO PUERTA en dos listas: pendientes y cargados
  const pedidosPendientesCarga = useMemo(() => {
    return pedidosCargadosInventario.filter((pedido) => {
      // Un pedido está pendiente si NO tiene fechaCargaInventario o si es igual a fechaCreacion
      const tieneFechaCarga = pedido.fechaCargaInventario && 
                             pedido.fechaCargaInventario !== pedido.fechaCreacion;
      return !tieneFechaCarga;
    });
  }, [pedidosCargadosInventario]);

  const pedidosConExistenciasCargadas = useMemo(() => {
    return pedidosCargadosInventario.filter((pedido) => {
      // Un pedido está cargado si tiene fechaCargaInventario diferente de fechaCreacion
      const tieneFechaCarga = pedido.fechaCargaInventario && 
                             pedido.fechaCargaInventario !== pedido.fechaCreacion;
      return tieneFechaCarga;
    });
  }, [pedidosCargadosInventario]);

  // Filtrar pedidos pendientes por búsqueda
  const pedidosPendientesFiltrados = useMemo(() => {
    if (!busquedaTuMundoPuerta.trim()) {
      return pedidosPendientesCarga;
    }
    const busquedaLower = busquedaTuMundoPuerta.toLowerCase().trim();
    return pedidosPendientesCarga.filter((pedido) => {
      const nombreCliente = (pedido.clienteNombre || '').toLowerCase();
      const clienteId = (pedido.clienteId || '').toLowerCase();
      const pedidoId = (pedido.pedidoId || '').toLowerCase();
      const itemsTexto = pedido.items?.map((item: any) => 
        (item.nombre || item.descripcion || '').toLowerCase()
      ).join(' ') || '';
      return nombreCliente.includes(busquedaLower) || 
             clienteId.includes(busquedaLower) || 
             pedidoId.includes(busquedaLower) ||
             itemsTexto.includes(busquedaLower);
    });
  }, [pedidosPendientesCarga, busquedaTuMundoPuerta]);

  // Filtrar pedidos cargados por búsqueda
  const pedidosCargadosFiltrados = useMemo(() => {
    if (!busquedaTuMundoPuerta.trim()) {
      return pedidosConExistenciasCargadas;
    }
    const busquedaLower = busquedaTuMundoPuerta.toLowerCase().trim();
    return pedidosConExistenciasCargadas.filter((pedido) => {
      const nombreCliente = (pedido.clienteNombre || '').toLowerCase();
      const clienteId = (pedido.clienteId || '').toLowerCase();
      const pedidoId = (pedido.pedidoId || '').toLowerCase();
      const itemsTexto = pedido.items?.map((item: any) => 
        (item.nombre || item.descripcion || '').toLowerCase()
      ).join(' ') || '';
      return nombreCliente.includes(busquedaLower) || 
             clienteId.includes(busquedaLower) || 
             pedidoId.includes(busquedaLower) ||
             itemsTexto.includes(busquedaLower);
    });
  }, [pedidosConExistenciasCargadas, busquedaTuMundoPuerta]);

  // Función auxiliar para guardar pedido cargado al inventario
  const guardarPedidoCargadoInventario = async (pedidoCargado: PedidoCargadoInventario) => {
    // IMPORTANTE: Intentar guardar en el backend PRIMERO para asegurar persistencia en BD
    try {
      await apiGuardarPedidoInventario(pedidoCargado);
      console.log('✅ Pedido cargado guardado en BD (backend):', pedidoCargado.pedidoId);
    } catch (error) {
      console.error('❌ Error al guardar pedido en BD:', error);
      // Continuar con localStorage como backup, pero alertar al usuario
      alert('⚠️ No se pudo guardar el pedido en la base de datos. Se guardó localmente. Por favor, verifica la conexión.');
    }
    
    // Actualizar estado y localStorage (siempre se hace, incluso si falla el backend)
    const nuevosPedidos = [...pedidosCargadosInventario];
    
    // Verificar si ya existe para evitar duplicados
    const existe = nuevosPedidos.some((p: PedidoCargadoInventario) => p.pedidoId === pedidoCargado.pedidoId);
    if (!existe) {
      nuevosPedidos.push(pedidoCargado);
    } else {
      // Si existe, actualizar en lugar de agregar
      const index = nuevosPedidos.findIndex((p: PedidoCargadoInventario) => p.pedidoId === pedidoCargado.pedidoId);
      if (index !== -1) {
        nuevosPedidos[index] = pedidoCargado;
      }
    }
    
    setPedidosCargadosInventario(nuevosPedidos);
    localStorage.setItem('pedidos_cargados_inventario', JSON.stringify(nuevosPedidos));
  };

  const handleCargarInventario = async (pedido: PedidoCargadoInventario) => {
    // Si el pedido viene en formato PedidoCargadoInventario, convertirlo al formato esperado
    let pedidoFormateado: any = pedido;
    if (pedido.pedidoId && !(pedido as any)._id) {
      // Es un PedidoCargadoInventario, necesitamos buscar el pedido original del backend
      try {
        const res = await fetch(`${getApiUrl()}/pedidos/id/${pedido.pedidoId}/`);
        if (res.ok) {
          pedidoFormateado = await res.json();
          // Asegurar que montoTotal tenga un valor válido
          if (!pedidoFormateado.montoTotal) {
            pedidoFormateado.montoTotal = pedidoFormateado.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0;
          }
        } else {
          // Si no se encuentra, crear un objeto compatible con los datos disponibles
          const montoTotalCalculado = pedido.montoTotal || (pedido.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0);
          pedidoFormateado = {
            _id: pedido.pedidoId,
            cliente_id: pedido.clienteId,
            cliente_nombre: pedido.clienteNombre,
            montoTotal: montoTotalCalculado,
            items: pedido.items,
            fecha_creacion: pedido.fechaCreacion,
            puedeFacturar: true
          };
        }
      } catch (error) {
        console.error('Error al buscar pedido:', error);
        // Crear objeto compatible con los datos disponibles
        const montoTotalCalculado = pedido.montoTotal || (pedido.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0);
        pedidoFormateado = {
          _id: pedido.pedidoId,
          cliente_id: pedido.clienteId,
          cliente_nombre: pedido.clienteNombre,
          montoTotal: montoTotalCalculado,
          items: pedido.items,
          fecha_creacion: pedido.fechaCreacion,
          puedeFacturar: true
        };
      }
    }
    // Asegurar que montoTotal siempre tenga un valor válido antes de establecerlo
    if (!pedidoFormateado.montoTotal && pedidoFormateado.montoTotal !== 0) {
      pedidoFormateado.montoTotal = pedidoFormateado.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0;
    }
    setSelectedPedido(pedidoFormateado);
    setModalAccion('cargar_inventario');
    setModalOpen(true);
  };

  const handleVerPreliminarPedidoCargado = (pedido: PedidoCargadoInventario) => {
    // Convertir PedidoCargadoInventario a formato FacturaConfirmada para mostrar el preliminar
    const facturaPreview: FacturaConfirmada = {
      id: pedido.id,
      numeroFactura: `PED-${pedido.pedidoId.slice(-6)}`,
      pedidoId: pedido.pedidoId,
      clienteNombre: pedido.clienteNombre,
      clienteId: pedido.clienteId,
      montoTotal: pedido.montoTotal,
      fechaCreacion: pedido.fechaCreacion,
      fechaFacturacion: pedido.fechaCargaInventario || pedido.fechaCreacion,
      items: pedido.items || []
    };
    setSelectedFactura(facturaPreview);
    setModalPreliminarOpen(true);
  };

  const handleConfirmarFacturacion = async () => {
    if (!selectedPedido) return;
    
    setConfirming(true);
    try {
      if (modalAccion === 'cargar_inventario') {
        // Verificar que el pedido tiene items
        if (!selectedPedido.items || selectedPedido.items.length === 0) {
          alert('⚠️ El pedido no tiene items para cargar al inventario');
          setConfirming(false);
          return;
        }
        
        // Validar que los items tengan código antes de enviar
        const itemsSinCodigo = selectedPedido.items.filter((item: any) => !item.codigo || item.codigo.trim() === '');
        if (itemsSinCodigo.length > 0) {
          const nombresSinCodigo = itemsSinCodigo.map((item: any) => item.nombre || item.descripcion || 'Sin nombre').join(', ');
          alert(`⚠️ Los siguientes items no tienen código y no se pueden cargar al inventario:\n${nombresSinCodigo}\n\nPor favor, asegúrate de que todos los items tengan un código válido.`);
          setConfirming(false);
          return;
        }
        
        // Cargar existencias al inventario (solo para el cliente especial)
        console.log('🔄 DEBUG CARGAR EXISTENCIAS: Procesando pedido', selectedPedido._id);
        
        // Validar que el pedido_id es un ObjectId válido (24 caracteres hexadecimales)
        if (!selectedPedido._id || !/^[0-9a-fA-F]{24}$/.test(selectedPedido._id)) {
          alert('⚠️ Error: El ID del pedido no es válido. Debe ser un ObjectId de MongoDB (24 caracteres hexadecimales).');
          setConfirming(false);
          return;
        }
        
        // Obtener token de autorización
        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('✅ DEBUG CARGAR EXISTENCIAS: Token de autorización incluido en el request');
        } else {
          console.warn('⚠️ DEBUG CARGAR EXISTENCIAS: No se encontró token de autorización');
        }
        
        const requestBody = { pedido_id: selectedPedido._id };
        console.log('📤 DEBUG CARGAR EXISTENCIAS: Request body:', JSON.stringify(requestBody, null, 2));
        
        const res = await fetch(`${getApiUrl()}/inventario/cargar-existencias-desde-pedido`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody)
        });
        
        console.log('📥 DEBUG CARGAR EXISTENCIAS: Status de respuesta:', res.status, res.statusText);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ DEBUG CARGAR EXISTENCIAS: Error del backend:', errorText);
          try {
            const errorJson = JSON.parse(errorText);
            console.error('❌ DEBUG CARGAR EXISTENCIAS: Error parseado:', errorJson);
            throw new Error(`Error al cargar existencias al inventario: ${errorJson.detail || errorText}`);
          } catch (e) {
            throw new Error(`Error al cargar existencias al inventario: ${errorText}`);
          }
        }
        
        // Leer respuesta del backend para mostrar detalles
        const respuestaBackend = await res.json();
        console.log('✅ DEBUG CARGAR EXISTENCIAS: Respuesta del backend:', JSON.stringify(respuestaBackend, null, 2));
        
        const itemsActualizados = respuestaBackend.items_actualizados || 0;
        const itemsCreados = respuestaBackend.items_creados || 0;
        const itemsConError = respuestaBackend.items_con_error || [];
        const totalProcesado = itemsActualizados + itemsCreados;
        
        // Verificar si hubo algún procesamiento real
        if (totalProcesado === 0 && itemsConError.length === 0) {
          alert('⚠️ No se procesó ningún item. Verifica que los items del pedido tengan código y cantidad válida.');
          setConfirming(false);
          return;
        }
        
        // Guardar el pedido cargado al inventario
        const montoTotalCalculado = selectedPedido.montoTotal || 
          (selectedPedido.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0);
        const pedidoCargado: PedidoCargadoInventario = {
          id: selectedPedido._id + '-' + Date.now(),
          pedidoId: selectedPedido._id,
          clienteNombre: selectedPedido.cliente_nombre || selectedPedido.cliente_id || 'N/A',
          clienteId: selectedPedido.cliente_id || '',
          montoTotal: montoTotalCalculado,
          fechaCreacion: selectedPedido.fecha_creacion || new Date().toISOString(),
          fechaCargaInventario: new Date().toISOString(),
          items: selectedPedido.items || []
        };
        // Guardar el pedido cargado al inventario (backend + localStorage)
        await guardarPedidoCargadoInventario(pedidoCargado);
        console.log('💾 DEBUG CARGAR EXISTENCIAS: Pedido guardado:', pedidoCargado.pedidoId);
        
        // IMPORTANTE: Actualizar TODOS los estados ANTES de cerrar el modal
        // 1. Actualizar el estado de pedidosCargadosInventario PRIMERO
        setPedidosCargadosInventario(prev => {
          const existe = prev.some((p: PedidoCargadoInventario) => p.pedidoId === pedidoCargado.pedidoId);
          const nuevoEstado = existe
            ? prev.map((p: PedidoCargadoInventario) => {
                if (p.pedidoId === pedidoCargado.pedidoId) {
                  return {
                    ...p,
                    fechaCargaInventario: pedidoCargado.fechaCargaInventario,
                  };
                }
                return p;
              })
            : [...prev, pedidoCargado];
          
          console.log('📦 DEBUG CARGAR EXISTENCIAS: Estado pedidosCargadosInventario actualizado. Total:', nuevoEstado.length);
          return nuevoEstado;
        });
        
        // 2. Forzar un delay para asegurar que React procese los cambios de estado ANTES de cerrar el modal
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // 3. Cerrar el modal y resetear el estado DESPUÉS de que React procese los cambios
        setModalOpen(false);
        setConfirming(false);
        setSelectedPedido(null);
        
        // Mostrar mensaje detallado con información de la operación
        let mensajeDetalle = `✓ Existencias cargadas al inventario\n\n` +
          `Items actualizados: ${itemsActualizados}\n` +
          `Items creados: ${itemsCreados}\n` +
          `Total procesado: ${totalProcesado} items\n\n` +
          `📦 Cantidades agregadas:\n`;
        
        // Agregar detalles de cada item con su cantidad
        selectedPedido.items.forEach((item: any) => {
          const codigo = item.codigo || 'Sin código';
          const cantidad = item.cantidad || 0;
          mensajeDetalle += `• ${codigo}: +${cantidad} unidades\n`;
        });
        
        if (itemsConError.length > 0) {
          const erroresTexto = itemsConError.map((err: any) => `• ${err.item}: ${err.error}`).join('\n');
          mensajeDetalle += `\n\n⚠️ Items con error (${itemsConError.length}):\n${erroresTexto}`;
        }
        
        // Agregar nota sobre verificación en inventario
        mensajeDetalle += `\n\n💡 Verifica en /inventario/cargar-excel que la existencia se haya incrementado correctamente.`;
        
        alert(mensajeDetalle);
      }
    } catch (error) {
      console.error('Error al confirmar acción:', error);
      alert('Error al cargar existencias');
    } finally {
      setConfirming(false);
      setSelectedPedido(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-8 space-y-8">
      {/* Card de Inventario Normal */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Selector de Sucursal y Botones de Cargar/Descargar */}
            <div className="flex gap-4 mb-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Sucursal:</label>
                <Select
                  value={sucursalSeleccionada}
                  onValueChange={(value: 'sucursal1' | 'sucursal2') => setSucursalSeleccionada(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sucursal1">Sucursal 1</SelectItem>
                    <SelectItem value="sucursal2">Sucursal 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleAbrirModalBuscar('cargar')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                ➕ Cargar {sucursalSeleccionada === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}
              </Button>
              <Button
                onClick={() => handleAbrirModalBuscar('descargar')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                ➖ Descargar {sucursalSeleccionada === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}
              </Button>
              <Button
                onClick={() => handleAbrirModalBuscar('transferir')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                🔄 Transferencia
              </Button>
            </div>
            
            <p>
              Selecciona un archivo de Excel (.xlsx) con las columnas: `codigo`, `descripcion`, `modelo`, `costo`, `Sucursal 1`, `Sucursal 2`, `precio`.
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="max-w-sm"
              />
              {fileName && <p className="text-sm text-gray-600">{fileName}</p>}
              {fileName && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelUpload}
                >
                  Cancelar
                </Button>
              )}
            </div>

            {mensaje && <p className="text-sm font-medium">{mensaje}</p>}

            {items.length > 0 && (
              <>
                <div className="max-h-96 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Sucursal 1</TableHead>
                        <TableHead>Sucursal 2</TableHead>
                        <TableHead>Precio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => {
                        // Obtener sucursal 2 si existe en el Excel original
                        const rowData = excelData[index];
                        const sucursal2 = rowData ? (Number(rowData['Sucursal 2'] || rowData.sucursal2 || 0)) : 0;
                        return (
                          <TableRow key={index}>
                            <TableCell>{item.codigo}</TableCell>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell>{item.modelo}</TableCell>
                            <TableCell>{item.costo}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>{sucursal2}</TableCell>
                            <TableCell>{item.precio}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end gap-4 mt-4">
                  <Button onClick={handleGuardarInventario}>
                    Guardar Nuevo Inventario
                  </Button>
                  <Button onClick={handleActualizarInventario} variant="outline">
                    Actualizar Inventario Existente
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview de Inventario */}
      <Card>
        <CardHeader>
          <CardTitle>Ver Preliminar de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button onClick={handleShowInventoryPreview} className="w-full">
              Ver Preliminar de mi Inventario
            </Button>

            {showInventoryPreview && currentInventory && currentInventory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Inventario Actual</h3>
                
                {/* Buscador */}
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, descripción, código o modelo..."
                    value={searchTermInventario}
                    onChange={(e) => setSearchTermInventario(e.target.value)}
                    className="w-full"
                  />
                  {searchTermInventario && (
                    <p className="text-sm text-gray-600 mt-2">
                      Mostrando {filteredInventory.length} de {currentInventory.length} items
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  <Button onClick={handleExportPdf} variant="outline">Exportar a PDF</Button>
                  <Button onClick={handleExportExcel} variant="outline">Exportar a Excel</Button>
                </div>
                <div className="max-h-96 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Sucursal 1</TableHead>
                        <TableHead>Sucursal 2</TableHead>
                        <TableHead>Precio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.codigo}</TableCell>
                          <TableCell>{item.descripcion}</TableCell>
                          <TableCell>{item.modelo}</TableCell>
                          <TableCell>{item.costo}</TableCell>
                          <TableCell>{item.cantidad !== undefined ? item.cantidad : (item.existencia || 0)}</TableCell>
                          <TableCell>{item.existencia2 !== undefined ? item.existencia2 : 0}</TableCell>
                          <TableCell>{item.precio}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sección: Pedidos de TU MUNDO PUERTA */}
      <Card className="flex flex-col h-full max-h-[90vh]">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0" />
              <span className="whitespace-nowrap">Pedidos TU MUNDO PUERTA</span>
            </CardTitle>
            <Button
              onClick={() => fetchPedidosTuMundoPuerta()}
              disabled={loadingTuMundoPuerta}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 w-full sm:w-auto shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loadingTuMundoPuerta ? 'animate-spin' : ''}`} />
              <span className="text-xs">Actualizar</span>
            </Button>
          </div>
          {/* Buscador en tiempo real por pedido, cliente o items */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por pedido, cliente o items..."
              value={busquedaTuMundoPuerta}
              onChange={(e) => setBusquedaTuMundoPuerta(e.target.value)}
              className="pl-10 w-full"
            />
            {busquedaTuMundoPuerta && (
              <div className="mt-2 text-sm text-gray-600">
                Mostrando {pedidosPendientesFiltrados.length} de {pedidosPendientesCarga.length} pedidos pendientes
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {loadingTuMundoPuerta && pedidosCargadosInventario.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mr-2"></span>
              <span className="text-indigo-600 font-semibold">Cargando pedidos...</span>
            </div>
          ) : pedidosPendientesCarga.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <CheckCircle2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg font-medium">No hay pedidos pendientes de carga</p>
              <p className="text-gray-500 text-sm mt-2">Los pedidos listos para cargar existencias aparecerán aquí</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pedidosPendientesFiltrados.map((pedido) => (
                <li key={pedido.id} className="border-2 border-indigo-300 rounded-xl bg-gradient-to-br from-white to-indigo-50 shadow-lg p-3 sm:p-4 transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-indigo-600 text-white px-3 py-1 text-sm font-bold">
                      #{pedido.pedidoId.slice(-6)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(pedido.fechaCreacion).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mb-3">
                    <h3 className="font-bold text-lg text-gray-800">{pedido.clienteNombre}</h3>
                    <p className="text-sm text-gray-600">RIF: {pedido.clienteId}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Items:</p>
                    <div className="text-sm text-gray-700 space-y-1 max-h-20 overflow-y-auto">
                      {pedido.items && pedido.items.length > 0 ? (
                        pedido.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {item.codigo ? (
                                  <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                    {item.codigo}
                                  </span>
                                ) : (
                                  <span className="font-mono text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded italic">
                                    Sin código
                                  </span>
                                )}
                                <span className="truncate">{item.nombre || item.descripcion || 'N/A'}</span>
                              </div>
                            </div>
                            <span className="font-bold ml-2 flex-shrink-0">x{item.cantidad || 1}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-xs">Sin items</p>
                      )}
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-2xl font-bold text-indigo-700">${(pedido.montoTotal || 0).toFixed(2)}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t-2 border-gray-200">
                    <Button
                      onClick={() => handleCargarInventario(pedido)}
                      className="w-full py-3 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white whitespace-normal break-words"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Receipt className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="text-center leading-tight">✓ LISTO PARA CARGAR EXISTENCIAS AL INVENTARIO</span>
                      </div>
                    </Button>
                  </div>
                  <Badge className="w-full bg-indigo-500 text-white text-center py-2 mt-3 text-xs sm:text-sm">
                    TU MUNDO PUERTA
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Sección: Pedidos con Existencias Cargadas */}
      <Card className="flex flex-col h-full max-h-[90vh]">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
              <span className="whitespace-nowrap">Pedidos con Existencias Cargadas</span>
            </CardTitle>
          </div>
          {/* Buscador en tiempo real por pedido, cliente o items */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por pedido, cliente o items..."
              value={busquedaTuMundoPuerta}
              onChange={(e) => setBusquedaTuMundoPuerta(e.target.value)}
              className="pl-10 w-full"
            />
            {busquedaTuMundoPuerta && (
              <div className="mt-2 text-sm text-gray-600">
                Mostrando {pedidosCargadosFiltrados.length} de {pedidosConExistenciasCargadas.length} pedidos cargados
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {pedidosConExistenciasCargadas.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <CheckCircle2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg font-medium">No hay pedidos con existencias cargadas</p>
              <p className="text-gray-500 text-sm mt-2">Los pedidos con existencias cargadas aparecerán aquí</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pedidosCargadosFiltrados.map((pedido) => (
                <li key={pedido.id} className="border-2 border-green-300 rounded-xl bg-gradient-to-br from-white to-green-50 shadow-lg p-3 sm:p-4 transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-green-600 text-white px-3 py-1 text-sm font-bold">
                      #{pedido.pedidoId.slice(-6)}
                    </Badge>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-500">
                        {new Date(pedido.fechaCreacion).toLocaleDateString()}
                      </span>
                      {pedido.fechaCargaInventario && pedido.fechaCargaInventario !== pedido.fechaCreacion && (
                        <span className="text-xs text-green-600 font-semibold">
                          Cargado: {new Date(pedido.fechaCargaInventario).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mb-3">
                    <h3 className="font-bold text-lg text-gray-800">{pedido.clienteNombre}</h3>
                    <p className="text-sm text-gray-600">RIF: {pedido.clienteId}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Items:</p>
                    <div className="text-sm text-gray-700 space-y-1 max-h-20 overflow-y-auto">
                      {pedido.items && pedido.items.length > 0 ? (
                        pedido.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {item.codigo ? (
                                  <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                    {item.codigo}
                                  </span>
                                ) : (
                                  <span className="font-mono text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded italic">
                                    Sin código
                                  </span>
                                )}
                                <span className="truncate">{item.nombre || item.descripcion || 'N/A'}</span>
                              </div>
                            </div>
                            <span className="font-bold ml-2 flex-shrink-0">x{item.cantidad || 1}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-xs">Sin items</p>
                      )}
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-2xl font-bold text-green-700">${(pedido.montoTotal || 0).toFixed(2)}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t-2 border-gray-200">
                    <Button
                      onClick={() => handleVerPreliminarPedidoCargado(pedido)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white whitespace-normal break-words"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="text-center leading-tight">Ver Preliminar</span>
                      </div>
                    </Button>
                  </div>
                  <Badge className="w-full bg-green-500 text-white text-center py-2 mt-3 text-xs sm:text-sm">
                    ✓ EXISTENCIAS CARGADAS
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Modal de Búsqueda de Item */}
      <Dialog open={modalBuscarOpen} onOpenChange={setModalBuscarOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Buscar Item para {tipoOperacion === 'cargar' ? 'Cargar' : 'Descargar'} {sucursalSeleccionada === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}
            </DialogTitle>
            <DialogDescription>
              Busca el item en tu inventario y selecciónalo para {tipoOperacion === 'cargar' ? 'cargar' : 'descargar'} en {sucursalSeleccionada === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Buscar por código, nombre, descripción o modelo..."
              value={busquedaItem}
              onChange={(e) => setBusquedaItem(e.target.value)}
              className="w-full"
            />
            
            <ScrollArea className="h-[400px] border rounded-md">
              <div className="p-4">
                {itemsFiltrados.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No se encontraron items
                  </p>
                ) : (
                  <div className="space-y-2">
                    {itemsFiltrados.map((item: any) => (
                      <div
                        key={item._id}
                        onClick={() => handleSeleccionarItem(item)}
                        className="p-4 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">{item.nombre || item.descripcion}</p>
                            <p className="text-sm text-gray-600">Código: {item.codigo}</p>
                            {item.modelo && <p className="text-sm text-gray-600">Modelo: {item.modelo}</p>}
                            {item.descripcion && <p className="text-sm text-gray-600">{item.descripcion}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-700">Sucursal 1:</p>
                            <p className="text-xl font-bold text-blue-600">{item.cantidad !== undefined ? item.cantidad : (item.existencia || 0)}</p>
                            <p className="text-sm font-semibold text-gray-700 mt-2">Sucursal 2:</p>
                            <p className="text-xl font-bold text-purple-600">{item.existencia2 !== undefined ? item.existencia2 : 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalBuscarOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación */}
      <Dialog open={modalConfirmarOpen} onOpenChange={setModalConfirmarOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {tipoOperacion === 'transferir' 
                ? `Transferir de ${sucursalOrigen === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'} a ${sucursalDestino === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}`
                : `Confirmar ${tipoOperacion === 'cargar' ? 'Carga' : 'Descarga'} en ${sucursalSeleccionada === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}`
              }
            </DialogTitle>
            <DialogDescription>
              {tipoOperacion === 'transferir'
                ? `Revisa los detalles antes de transferir de ${sucursalOrigen === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'} a ${sucursalDestino === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}`
                : `Revisa los detalles antes de ${tipoOperacion === 'cargar' ? 'cargar' : 'descargar'} en ${sucursalSeleccionada === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}`
              }
            </DialogDescription>
          </DialogHeader>
          
          {itemSeleccionado && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2">{itemSeleccionado.nombre || itemSeleccionado.descripcion}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Código:</span> {itemSeleccionado.codigo}
                  </div>
                  {itemSeleccionado.modelo && (
                    <div>
                      <span className="font-semibold">Modelo:</span> {itemSeleccionado.modelo}
                    </div>
                  )}
                  
                  {tipoOperacion === 'transferir' ? (
                    <>
                      <div>
                        <span className="font-semibold">{sucursalOrigen === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'} Actual:</span>{' '}
                        <span className="text-blue-600 font-bold text-lg">
                          {sucursalOrigen === 'sucursal1' 
                            ? (itemSeleccionado.cantidad !== undefined ? itemSeleccionado.cantidad : (itemSeleccionado.existencia || 0))
                            : (itemSeleccionado.existencia2 !== undefined ? itemSeleccionado.existencia2 : 0)
                          }
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">{sucursalDestino === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'} Actual:</span>{' '}
                        <span className="text-purple-600 font-bold text-lg">
                          {sucursalDestino === 'sucursal1' 
                            ? (itemSeleccionado.cantidad !== undefined ? itemSeleccionado.cantidad : (itemSeleccionado.existencia || 0))
                            : (itemSeleccionado.existencia2 !== undefined ? itemSeleccionado.existencia2 : 0)
                          }
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Nueva {sucursalOrigen === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}:</span>{' '}
                        <span className="text-red-600 font-bold text-lg">
                          {(sucursalOrigen === 'sucursal1'
                            ? (itemSeleccionado.cantidad !== undefined ? itemSeleccionado.cantidad : (itemSeleccionado.existencia || 0))
                            : (itemSeleccionado.existencia2 !== undefined ? itemSeleccionado.existencia2 : 0)
                          ) - (parseFloat(cantidadOperacion) || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Nueva {sucursalDestino === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}:</span>{' '}
                        <span className="text-green-600 font-bold text-lg">
                          {(sucursalDestino === 'sucursal1'
                            ? (itemSeleccionado.cantidad !== undefined ? itemSeleccionado.cantidad : (itemSeleccionado.existencia || 0))
                            : (itemSeleccionado.existencia2 !== undefined ? itemSeleccionado.existencia2 : 0)
                          ) + (parseFloat(cantidadOperacion) || 0)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="font-semibold">{sucursalSeleccionada === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'} Actual:</span>{' '}
                        <span className="text-blue-600 font-bold text-lg">
                          {sucursalSeleccionada === 'sucursal1' 
                            ? (itemSeleccionado.cantidad !== undefined ? itemSeleccionado.cantidad : (itemSeleccionado.existencia || 0))
                            : (itemSeleccionado.existencia2 !== undefined ? itemSeleccionado.existencia2 : 0)
                          }
                        </span>
                      </div>
                      {tipoOperacion === 'cargar' ? (
                        <div>
                          <span className="font-semibold">Nueva {sucursalSeleccionada === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}:</span>{' '}
                          <span className="text-green-600 font-bold text-lg">
                            {(sucursalSeleccionada === 'sucursal1'
                              ? (itemSeleccionado.cantidad !== undefined ? itemSeleccionado.cantidad : (itemSeleccionado.existencia || 0))
                              : (itemSeleccionado.existencia2 !== undefined ? itemSeleccionado.existencia2 : 0)
                            ) + (parseFloat(cantidadOperacion) || 0)}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold">Nueva {sucursalSeleccionada === 'sucursal1' ? 'Sucursal 1' : 'Sucursal 2'}:</span>{' '}
                          <span className="text-red-600 font-bold text-lg">
                            {(sucursalSeleccionada === 'sucursal1'
                              ? (itemSeleccionado.cantidad !== undefined ? itemSeleccionado.cantidad : (itemSeleccionado.existencia || 0))
                              : (itemSeleccionado.existencia2 !== undefined ? itemSeleccionado.existencia2 : 0)
                            ) - (parseFloat(cantidadOperacion) || 0)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {tipoOperacion === 'transferir' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Sucursal Origen:
                    </label>
                    <Select
                      value={sucursalOrigen}
                      onValueChange={(value: 'sucursal1' | 'sucursal2') => {
                        setSucursalOrigen(value);
                        // Cambiar automáticamente el destino al opuesto
                        setSucursalDestino(value === 'sucursal1' ? 'sucursal2' : 'sucursal1');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sucursal1">Sucursal 1</SelectItem>
                        <SelectItem value="sucursal2">Sucursal 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Sucursal Destino:
                    </label>
                    <Select
                      value={sucursalDestino}
                      onValueChange={(value: 'sucursal1' | 'sucursal2') => {
                        setSucursalDestino(value);
                        // Cambiar automáticamente el origen al opuesto
                        setSucursalOrigen(value === 'sucursal1' ? 'sucursal2' : 'sucursal1');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sucursal1">Sucursal 1</SelectItem>
                        <SelectItem value="sucursal2">Sucursal 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Cantidad a {tipoOperacion === 'transferir' ? 'Transferir' : tipoOperacion === 'cargar' ? 'Cargar' : 'Descargar'}:
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cantidadOperacion}
                  onChange={(e) => setCantidadOperacion(e.target.value)}
                  placeholder="Ingresa la cantidad"
                  className="w-full"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelarOperacion} disabled={procesando}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarOperacion}
              disabled={procesando || !cantidadOperacion || (tipoOperacion === 'transferir' && sucursalOrigen === sucursalDestino)}
              className={
                tipoOperacion === 'transferir'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : tipoOperacion === 'cargar'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {procesando ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                  Procesando...
                </>
              ) : (
                `Confirmar ${tipoOperacion === 'transferir' ? 'Transferencia' : tipoOperacion === 'cargar' ? 'Carga' : 'Descarga'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación y Nota de Entrega */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalAccion === 'cargar_inventario' 
                ? 'Cargar Existencias al Inventario' 
                : 'Confirmar Facturación'}
            </DialogTitle>
            <DialogDescription>
              {modalAccion === 'cargar_inventario'
                ? 'Revisa los detalles del pedido antes de cargar las cantidades al inventario'
                : 'Revisa los detalles del pedido antes de facturar'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPedido && (
            <div className="space-y-4">
              {/* Información del Cliente */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-blue-900">Información del Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Cédula/RIF:</p>
                    <p className="font-bold text-lg">{selectedPedido.cliente_id || selectedPedido.cliente_nombre || 'N/A'}</p>
                  </div>
                  {selectedPedido.cliente_nombre && (
                    <div>
                      <p className="text-sm text-gray-600">Nombre o Razón Social:</p>
                      <p className="font-bold text-lg">{selectedPedido.cliente_nombre}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items del Pedido */}
              <div>
                <h3 className="font-bold text-lg mb-3">Artículos del Pedido</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Código</th>
                        <th className="p-2 text-left">Nombre</th>
                        <th className="p-2 text-left">Descripción</th>
                        <th className="p-2 text-center">Cantidad</th>
                        <th className="p-2 text-right">Precio Unit.</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPedido.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2 font-mono text-sm font-semibold text-blue-700">
                            {item.codigo || <span className="text-red-600 italic">Sin código</span>}
                          </td>
                          <td className="p-2">{item.nombre || item.descripcion || 'N/A'}</td>
                          <td className="p-2 text-sm text-gray-600">{item.descripcion || item.detalleitem || '-'}</td>
                          <td className="p-2 text-center">{item.cantidad || 1}</td>
                          <td className="p-2 text-right">${(item.precio || 0).toFixed(2)}</td>
                          <td className="p-2 text-right font-bold">${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      {(() => {
                        const adicionalesModalNormalizados = (selectedPedido.adicionales && Array.isArray(selectedPedido.adicionales)) ? selectedPedido.adicionales : [];
                        const montoItems = selectedPedido.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0;
                        const montoAdicionales = adicionalesModalNormalizados.reduce((acc: number, ad: any) => {
                          const cantidad = ad.cantidad || 1;
                          const precio = ad.precio || 0;
                          return acc + (precio * cantidad);
                        }, 0);
                        const totalConAdicionales = selectedPedido.montoTotal || (montoItems + montoAdicionales);
                        
                        return (
                          <>
                            {adicionalesModalNormalizados.length > 0 && (
                              <>
                                <tr className="bg-yellow-50">
                                  <td colSpan={5} className="p-2 text-right font-semibold">Subtotal Items:</td>
                                  <td className="p-2 text-right text-yellow-800 font-bold">
                                    ${montoItems.toFixed(2)}
                                  </td>
                                </tr>
                                {adicionalesModalNormalizados.map((adicional: any, idx: number) => {
                                  const cantidad = adicional.cantidad || 1;
                                  const precio = adicional.precio || 0;
                                  const montoAdicional = precio * cantidad;
                                  
                                  return (
                                    <tr key={idx} className="bg-yellow-50 border-t border-yellow-200">
                                      <td colSpan={4} className="p-2 text-right text-sm">
                                        <span className="font-semibold text-yellow-900">+ Adicional:</span>
                                      </td>
                                      <td colSpan={1} className="p-2 text-left text-sm">
                                        <span className="text-yellow-800 italic">{adicional.descripcion || 'Sin descripción'}</span>
                                        {cantidad > 1 && <span className="text-xs text-yellow-600 ml-2">(x{cantidad})</span>}
                                      </td>
                                      <td className="p-2 text-right text-yellow-800 font-bold">
                                        ${montoAdicional.toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                                <tr className="bg-yellow-100 border-t-2 border-yellow-300">
                                  <td colSpan={5} className="p-2 text-right font-semibold text-yellow-900">Total Adicionales:</td>
                                  <td className="p-2 text-right text-yellow-900 font-bold">
                                    ${montoAdicionales.toFixed(2)}
                                  </td>
                                </tr>
                              </>
                            )}
                            <tr className="bg-green-50 border-t-2 border-green-300">
                              <td colSpan={4} className="p-2 text-right font-bold text-green-900">Total del Pedido:</td>
                              <td className="p-2 text-center text-green-900">{selectedPedido.items?.reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0) || 0}</td>
                              <td className="p-2 text-right text-lg text-green-700 font-bold">${totalConAdicionales.toFixed(2)}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={confirming}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmarFacturacion} 
              disabled={confirming}
              className={modalAccion === 'cargar_inventario' 
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-green-600 hover:bg-green-700'}
            >
              {confirming ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2 inline-block"></span>
                  {modalAccion === 'cargar_inventario' ? 'Cargando...' : 'Confirmando...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {modalAccion === 'cargar_inventario' 
                    ? 'Cargar Existencias al Inventario' 
                    : 'Confirmar Facturación'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Preliminar para Pedidos Cargados */}
      <Dialog open={modalPreliminarOpen} onOpenChange={setModalPreliminarOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preliminar de Nota de Entrega</DialogTitle>
            <DialogDescription>
              Revisa los detalles del pedido con existencias cargadas
            </DialogDescription>
          </DialogHeader>
          
          {selectedFactura && (
            <div className="space-y-4">
              {/* Información de la Factura */}
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <h3 className="font-bold text-lg mb-3 text-green-900">Información del Pedido</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Número de Pedido:</p>
                    <p className="font-bold text-lg text-green-700">{selectedFactura.numeroFactura}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Carga:</p>
                    <p className="font-bold text-lg">{new Date(selectedFactura.fechaFacturacion).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-blue-900">Información del Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Cédula/RIF:</p>
                    <p className="font-bold text-lg">{selectedFactura.clienteId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nombre o Razón Social:</p>
                    <p className="font-bold text-lg">{selectedFactura.clienteNombre}</p>
                  </div>
                </div>
              </div>

              {/* Items de la Factura */}
              <div>
                <h3 className="font-bold text-lg mb-3">Artículos del Pedido</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Código</th>
                        <th className="p-2 text-left">Nombre</th>
                        <th className="p-2 text-left">Descripción</th>
                        <th className="p-2 text-center">Cantidad</th>
                        <th className="p-2 text-right">Precio Unit.</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFactura.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2 font-mono text-sm font-semibold text-blue-700">
                            {item.codigo || <span className="text-red-600 italic">Sin código</span>}
                          </td>
                          <td className="p-2">{item.nombre || item.descripcion || 'N/A'}</td>
                          <td className="p-2 text-sm text-gray-600">{item.descripcion || item.detalleitem || '-'}</td>
                          <td className="p-2 text-center">{item.cantidad || 1}</td>
                          <td className="p-2 text-right">${(item.precio || 0).toFixed(2)}</td>
                          <td className="p-2 text-right font-bold">${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan={4} className="p-2 text-right">Total del Pedido:</td>
                        <td className="p-2 text-center">{selectedFactura.items?.reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0) || 0}</td>
                        <td className="p-2 text-right text-lg text-green-700">${(selectedFactura.montoTotal || 0).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setModalPreliminarOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CargarInventarioExcel;