import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  DollarSign, 
  FileText, 
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
  Trash2
} from "lucide-react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  getCuentasPorPagar, 
  createCuentaPorPagar, 
  abonarCuentaPorPagar,
  getApiUrl 
} from "@/lib/api";
import { getMetodosPago } from "@/lib/api";
import { useItems } from "@/hooks/useItems";

// Tipos
interface Proveedor {
  nombre: string;
  rif: string;
  telefono: string;
}

interface ItemCuentaPorPagar {
  itemId: string;
  codigo: string;
  nombre: string;
  costo: number;
  cantidad: number;
  subtotal: number;
}

interface CuentaPorPagar {
  _id: string;
  proveedor: Proveedor;
  items?: ItemCuentaPorPagar[];
  descripcion?: string;
  monto?: number;
  total: number;
  montoAbonado: number;
  saldoPendiente: number;
  estado: "pendiente" | "pagada";
  fechaCreacion: string;
  historialAbonos?: Array<{
    fecha: string;
    monto: number;
    metodoPago: string;
    metodoPagoNombre?: string;
  }>;
}

interface MetodoPago {
  _id: string;
  id?: string;
  nombre: string;
  banco: string;
  saldo: number;
}

const CuentasPorPagar: React.FC = () => {
  const [cuentas, setCuentas] = useState<CuentaPorPagar[]>([]);
  const [loading, setLoading] = useState(false);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  
  // Estados para gestión de proveedores
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorSeleccionadoId, setProveedorSeleccionadoId] = useState<string>("");
  const [busquedaProveedor, setBusquedaProveedor] = useState("");
  const [mostrarSugerenciasProveedor, setMostrarSugerenciasProveedor] = useState(false);
  const [mostrarFormularioNuevoProveedor, setMostrarFormularioNuevoProveedor] = useState(false);
  
  // Estados para modal de creación
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [proveedor, setProveedor] = useState<Proveedor>({
    nombre: "",
    rif: "",
    telefono: ""
  });
  const [itemsSeleccionados, setItemsSeleccionados] = useState<ItemCuentaPorPagar[]>([]);
  const [itemBusqueda, setItemBusqueda] = useState<string>("");
  const [mostrarItems, setMostrarItems] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState<number>(0);
  
  // Estados para modal de abonar
  const [modalAbonarOpen, setModalAbonarOpen] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaPorPagar | null>(null);
  const [montoAbono, setMontoAbono] = useState<number>(0);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<string>("");
  
  // Estados para modal de preliminar
  const [modalPreliminarOpen, setModalPreliminarOpen] = useState(false);
  const [cuentaPreliminar, setCuentaPreliminar] = useState<CuentaPorPagar | null>(null);
  
  // Búsqueda
  const [busqueda, setBusqueda] = useState("");
  
  const { data: itemsData, fetchItems } = useItems();
  const apiUrl = getApiUrl();

  useEffect(() => {
    fetchCuentasData();
    fetchMetodosPagoData();
    fetchItems(`${apiUrl}/inventario/all`);
    cargarProveedores();
  }, []);

  // Cargar proveedores desde localStorage
  const cargarProveedores = () => {
    try {
      const proveedoresGuardados = localStorage.getItem('proveedores_cuentas_por_pagar');
      if (proveedoresGuardados) {
        const parsed = JSON.parse(proveedoresGuardados);
        setProveedores(parsed);
      }
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    }
  };

  // Guardar proveedores en localStorage
  const guardarProveedores = (nuevosProveedores: Proveedor[]) => {
    try {
      localStorage.setItem('proveedores_cuentas_por_pagar', JSON.stringify(nuevosProveedores));
      setProveedores(nuevosProveedores);
    } catch (error) {
      console.error("Error al guardar proveedores:", error);
    }
  };

  // Agregar nuevo proveedor
  const agregarNuevoProveedor = () => {
    if (!proveedor.nombre || !proveedor.rif) {
      alert("Debe completar al menos el nombre y RIF del proveedor");
      return;
    }

    // Verificar si ya existe un proveedor con el mismo RIF
    const existe = proveedores.some(p => p.rif.toLowerCase() === proveedor.rif.toLowerCase());
    if (existe) {
      alert("Ya existe un proveedor con este RIF");
      return;
    }

    const nuevoProveedor: Proveedor = { ...proveedor };
    const nuevosProveedores = [...proveedores, nuevoProveedor];
    guardarProveedores(nuevosProveedores);
    
    // Seleccionar el nuevo proveedor
    setProveedorSeleccionadoId(nuevoProveedor.rif);
    setProveedor(nuevoProveedor);
    setMostrarFormularioNuevoProveedor(false);
    setBusquedaProveedor(nuevoProveedor.nombre);
    alert("✓ Proveedor agregado exitosamente");
  };

  // Filtrar proveedores por búsqueda
  const proveedoresFiltrados = useMemo(() => {
    if (!busquedaProveedor.trim()) return proveedores;
    const busquedaLower = busquedaProveedor.toLowerCase();
    return proveedores.filter(p =>
      p.nombre.toLowerCase().includes(busquedaLower) ||
      p.rif.toLowerCase().includes(busquedaLower) ||
      p.telefono.toLowerCase().includes(busquedaLower)
    );
  }, [proveedores, busquedaProveedor]);

  const fetchCuentasData = async () => {
    setLoading(true);
    try {
      const data = await getCuentasPorPagar();
      // Normalizar _id a id para consistencia
      const cuentasNormalizadas = data.map((cuenta: any) => ({
        ...cuenta,
        _id: cuenta._id || cuenta.id
      }));
      setCuentas(cuentasNormalizadas);
    } catch (error) {
      console.error("Error al cargar cuentas por pagar:", error);
      alert("Error al cargar las cuentas por pagar");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetodosPagoData = async () => {
    try {
      const data = await getMetodosPago();
      setMetodosPago(data);
    } catch (error) {
      console.error("Error al cargar métodos de pago:", error);
    }
  };

  // Filtrar cuentas
  const cuentasPendientes = useMemo(() => {
    const filtradas = cuentas.filter(c => c.estado === "pendiente");
    if (!busqueda.trim()) return filtradas;
    const busquedaLower = busqueda.toLowerCase();
    return filtradas.filter(c => 
      c.proveedor.nombre.toLowerCase().includes(busquedaLower) ||
      c.proveedor.rif.toLowerCase().includes(busquedaLower) ||
      c._id.toLowerCase().includes(busquedaLower)
    );
  }, [cuentas, busqueda]);

  const cuentasPagadas = useMemo(() => {
    const filtradas = cuentas.filter(c => c.estado === "pagada");
    if (!busqueda.trim()) return filtradas;
    const busquedaLower = busqueda.toLowerCase();
    return filtradas.filter(c => 
      c.proveedor.nombre.toLowerCase().includes(busquedaLower) ||
      c.proveedor.rif.toLowerCase().includes(busquedaLower) ||
      c._id.toLowerCase().includes(busquedaLower)
    );
  }, [cuentas, busqueda]);

  // Manejo de items del inventario
  const itemsDisponibles = useMemo(() => {
    if (!itemsData || !Array.isArray(itemsData)) return [];
    const busquedaLower = itemBusqueda.toLowerCase();
    return itemsData.filter((item: any) => 
      (item.nombre?.toLowerCase().includes(busquedaLower) ||
       item.codigo?.toLowerCase().includes(busquedaLower) ||
       item.descripcion?.toLowerCase().includes(busquedaLower)) &&
      !itemsSeleccionados.some(sel => sel.itemId === item._id)
    ).slice(0, 10);
  }, [itemsData, itemBusqueda, itemsSeleccionados]);

  const agregarItem = (item: any) => {
    const nuevoItem: ItemCuentaPorPagar = {
      itemId: item._id,
      codigo: item.codigo || "",
      nombre: item.nombre || item.descripcion || "",
      costo: item.costo || 0,
      cantidad: 1,
      subtotal: (item.costo || 0) * 1
    };
    setItemsSeleccionados([...itemsSeleccionados, nuevoItem]);
    setItemBusqueda("");
    // Mantener el dropdown visible pero limpiar la búsqueda
    setTimeout(() => {
      // Scroll automático hacia el nuevo item agregado después de un breve delay
      const itemsContainer = document.querySelector('[data-items-container]');
      if (itemsContainer) {
        itemsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const eliminarItem = (index: number) => {
    const item = itemsSeleccionados[index];
    if (window.confirm(`¿Estás seguro de que deseas eliminar el item "${item.nombre}"?`)) {
      setItemsSeleccionados(itemsSeleccionados.filter((_, i) => i !== index));
    }
  };

  const actualizarItem = (index: number, campo: keyof ItemCuentaPorPagar, valor: any) => {
    const nuevosItems = [...itemsSeleccionados];
    nuevosItems[index] = {
      ...nuevosItems[index],
      [campo]: valor
    };
    if (campo === "cantidad" || campo === "costo") {
      nuevosItems[index].subtotal = nuevosItems[index].costo * nuevosItems[index].cantidad;
    }
    setItemsSeleccionados(nuevosItems);
  };

  const totalItems = useMemo(() => {
    return itemsSeleccionados.reduce((sum, item) => sum + item.subtotal, 0);
  }, [itemsSeleccionados]);

  const calcularTotal = useMemo(() => {
    if (mostrarItems && itemsSeleccionados.length > 0) {
      return totalItems;
    } else {
      return monto || 0;
    }
  }, [mostrarItems, itemsSeleccionados, totalItems, monto]);

  // Crear cuenta por pagar
  const handleCrearCuenta = async () => {
    if (!proveedor.nombre || !proveedor.rif || !proveedorSeleccionadoId) {
      alert("Debe seleccionar o agregar un proveedor");
      return;
    }

    if (mostrarItems && itemsSeleccionados.length === 0) {
      alert("Debe agregar al menos un item o usar descripción con monto");
      return;
    }

    if (!mostrarItems && (!descripcion || !monto || monto <= 0)) {
      alert("Debe completar la descripción y el monto");
      return;
    }

    setLoading(true);
    try {
      const nuevaCuenta = {
        proveedor,
        items: mostrarItems && itemsSeleccionados.length > 0 ? itemsSeleccionados.map(item => ({
          itemId: item.itemId,
          codigo: item.codigo,
          nombre: item.nombre,
          costo: item.costo,
          cantidad: item.cantidad
        })) : undefined,
        descripcion: !mostrarItems ? descripcion : undefined,
        monto: !mostrarItems ? monto : undefined,
        total: calcularTotal,
        montoAbonado: 0,
        saldoPendiente: calcularTotal,
        estado: "pendiente"
      };

      console.log("📤 Enviando cuenta por pagar:", nuevaCuenta);

      const respuesta = await createCuentaPorPagar(nuevaCuenta);
      console.log("✅ Cuenta por pagar creada:", respuesta);

      // Si hay items, actualizar inventario SUMANDO las cantidades
      if (mostrarItems && itemsSeleccionados.length > 0) {
        console.log("🔄 Actualizando inventario - sumando cantidades...");
        for (const item of itemsSeleccionados) {
          try {
            const token = localStorage.getItem('access_token');
            // Primero obtener el item actual
            const response = await fetch(`${apiUrl}/inventario/id/${item.itemId}/`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.ok) {
              throw new Error(`Error al obtener item: ${response.statusText}`);
            }
            
            const itemActual = await response.json();
            console.log(`📦 Item actual ${item.codigo || item.nombre}: cantidad actual = ${itemActual.cantidad || 0}`);
            
            // Actualizar con la nueva cantidad (SUMAR)
            const nuevaCantidad = (itemActual.cantidad || 0) + item.cantidad;
            console.log(`➕ Sumando ${item.cantidad} a ${itemActual.cantidad || 0} = ${nuevaCantidad}`);
            
            const updateResponse = await fetch(`${apiUrl}/inventario/id/${item.itemId}/`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                cantidad: nuevaCantidad
              })
            });
            
            if (!updateResponse.ok) {
              const errorData = await updateResponse.json().catch(() => ({ message: updateResponse.statusText }));
              throw new Error(`Error al actualizar: ${errorData.message || updateResponse.statusText}`);
            }
            
            console.log(`✅ Item ${item.codigo || item.nombre} actualizado correctamente a ${nuevaCantidad}`);
          } catch (error: any) {
            console.error(`❌ Error al actualizar item ${item.itemId} (${item.nombre}):`, error);
            alert(`Error al actualizar inventario del item "${item.nombre}": ${error.message}`);
          }
        }
        console.log("✅ Inventario actualizado correctamente");
      }

      alert("✓ Cuenta por pagar creada exitosamente\n✓ Inventario actualizado (cantidades sumadas)");
      resetearFormulario();
      setModalCrearOpen(false);
      fetchCuentasData();
      fetchItems(`${apiUrl}/inventario/all`);
    } catch (error: any) {
      console.error("❌ Error al crear cuenta:", error);
      let mensajeError = "Error desconocido";
      
      // Intentar obtener el mensaje de error del backend
      if (error.message) {
        mensajeError = error.message;
      } else if (error.response) {
        const errorData = await error.response.json().catch(() => null);
        if (errorData?.detail) {
          mensajeError = Array.isArray(errorData.detail) 
            ? errorData.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ')
            : errorData.detail;
        }
      }
      
      alert(`❌ Error al crear la cuenta por pagar:\n${mensajeError}\n\nPor favor verifica los datos e intenta nuevamente.`);
    } finally {
      setLoading(false);
    }
  };

  const resetearFormulario = () => {
    setProveedor({ nombre: "", rif: "", telefono: "" });
    setProveedorSeleccionadoId("");
    setBusquedaProveedor("");
    setMostrarFormularioNuevoProveedor(false);
    setItemsSeleccionados([]);
    setDescripcion("");
    setMonto(0);
    setMostrarItems(false);
    setItemBusqueda("");
  };

  // Manejar selección de proveedor existente
  const handleSeleccionarProveedor = (proveedorSeleccionado: Proveedor) => {
    setProveedor(proveedorSeleccionado);
    setProveedorSeleccionadoId(proveedorSeleccionado.rif);
    setBusquedaProveedor(`${proveedorSeleccionado.nombre} - ${proveedorSeleccionado.rif}`);
    setMostrarSugerenciasProveedor(false);
    setMostrarFormularioNuevoProveedor(false);
  };

  // Imprimir cuenta por pagar
  const handleImprimirCuenta = () => {
    if (!proveedor.nombre || !proveedorSeleccionadoId) {
      alert("Debe seleccionar un proveedor primero");
      return;
    }

    const contenidoHTML = generarHTMLImpresion();
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(contenidoHTML);
      ventanaImpresion.document.close();
      ventanaImpresion.focus();
      setTimeout(() => {
        ventanaImpresion.print();
      }, 250);
    }
  };

  // Exportar a PDF
  const handleExportarPDF = () => {
    if (!proveedor.nombre || !proveedorSeleccionadoId) {
      alert("Debe seleccionar un proveedor primero");
      return;
    }

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Cuenta por Pagar', 14, 22);
    
    // Información del proveedor
    doc.setFontSize(12);
    doc.text(`Proveedor: ${proveedor.nombre}`, 14, 32);
    doc.text(`RIF: ${proveedor.rif}`, 14, 38);
    if (proveedor.telefono) {
      doc.text(`Teléfono: ${proveedor.telefono}`, 14, 44);
    }
    
    // Fecha
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 50);
    
    let startY = 60;

    if (mostrarItems && itemsSeleccionados.length > 0) {
      // Tabla de items
      const itemsData = itemsSeleccionados.map(item => [
        item.codigo || "Sin código",
        item.nombre,
        `$${item.costo.toFixed(2)}`,
        item.cantidad.toString(),
        `$${item.subtotal.toFixed(2)}`
      ]);

      (doc as any).autoTable({
        startY: startY,
        head: [['Código', 'Nombre', 'Costo', 'Cantidad', 'Subtotal']],
        body: itemsData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 9 },
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
      
      // Total
      doc.setFontSize(14);
      doc.text(`Total: $${totalItems.toFixed(2)}`, 150, startY, { align: 'right' });
    } else if (descripcion) {
      // Descripción
      doc.setFontSize(12);
      doc.text('Descripción:', 14, startY);
      startY += 8;
      
      const descripcionLines = doc.splitTextToSize(descripcion, 180);
      doc.setFontSize(10);
      descripcionLines.forEach((line: string) => {
        doc.text(line, 14, startY);
        startY += 6;
      });
      
      startY += 5;
      
      // Monto
      doc.setFontSize(14);
      doc.text(`Monto: $${monto.toFixed(2)}`, 150, startY, { align: 'right' });
    }

    // Guardar PDF
    const nombreArchivo = `cuenta-por-pagar-${proveedor.rif}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);
  };

  // Generar HTML para impresión
  const generarHTMLImpresion = () => {
    const fecha = new Date().toLocaleDateString('es-ES');

    let itemsHTML = '';
    if (mostrarItems && itemsSeleccionados.length > 0) {
      itemsHTML = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Código</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nombre</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Costo</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Cantidad</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsSeleccionados.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.codigo || "Sin código"}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.nombre}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${item.costo.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.cantidad}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">Total:</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">$${totalItems.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    const descripcionHTML = !mostrarItems && descripcion ? `
      <div style="margin: 20px 0;">
        <h3 style="margin-bottom: 10px;">Descripción:</h3>
        <p style="white-space: pre-wrap;">${descripcion}</p>
        <p style="text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold;">Monto: $${monto.toFixed(2)}</p>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cuenta por Pagar - ${proveedor.nombre}</title>
        <style>
          @media print {
            @page { margin: 20mm; }
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .info-section { margin: 20px 0; }
          .info-row { margin: 5px 0; }
          .label { font-weight: bold; display: inline-block; width: 120px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">CUENTA POR PAGAR</h1>
          <p>Fecha: ${fecha}</p>
        </div>
        
        <div class="info-section">
          <h2 style="border-bottom: 2px solid #333; padding-bottom: 5px;">Información del Proveedor</h2>
          <div class="info-row"><span class="label">Nombre:</span> ${proveedor.nombre}</div>
          <div class="info-row"><span class="label">RIF:</span> ${proveedor.rif}</div>
          ${proveedor.telefono ? `<div class="info-row"><span class="label">Teléfono:</span> ${proveedor.telefono}</div>` : ''}
        </div>

        ${itemsHTML}
        ${descripcionHTML}

        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleString('es-ES')}</p>
        </div>
      </body>
      </html>
    `;
  };

  // Abonar cuenta
  const handleAbrirModalAbonar = (cuenta: CuentaPorPagar) => {
    setCuentaSeleccionada(cuenta);
    setMontoAbono(0);
    setMetodoPagoSeleccionado("");
    setModalAbonarOpen(true);
  };

  const handleAbonar = async () => {
    if (!cuentaSeleccionada) return;
    if (montoAbono <= 0) {
      alert("El monto debe ser mayor a 0");
      return;
    }
    if (montoAbono > cuentaSeleccionada.saldoPendiente) {
      alert(`El monto no puede ser mayor al saldo pendiente (${cuentaSeleccionada.saldoPendiente.toFixed(2)})`);
      return;
    }
    if (!metodoPagoSeleccionado) {
      alert("Debe seleccionar un método de pago");
      return;
    }

    const metodoSeleccionado = metodosPago.find(m => m._id === metodoPagoSeleccionado || m.id === metodoPagoSeleccionado);
    if (metodoSeleccionado && metodoSeleccionado.saldo < montoAbono) {
      alert(`El saldo del método de pago (${metodoSeleccionado.saldo.toFixed(2)}) es insuficiente`);
      return;
    }

    setLoading(true);
    try {
      await abonarCuentaPorPagar(cuentaSeleccionada._id, montoAbono, metodoPagoSeleccionado);
      alert("✓ Abono registrado exitosamente");
      setModalAbonarOpen(false);
      fetchCuentasData();
      fetchMetodosPagoData(); // Actualizar saldos
    } catch (error: any) {
      console.error("Error al abonar:", error);
      alert(`Error al registrar el abono: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ver preliminar
  const handleVerPreliminar = (cuenta: CuentaPorPagar) => {
    setCuentaPreliminar(cuenta);
    setModalPreliminarOpen(true);
  };

  return (
    <div className="w-full max-w-[2000px] mx-auto mt-4 md:mt-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Cuentas por Pagar</h1>
          <p className="text-gray-600 mt-1">Gestiona las cuentas por pagar a proveedores</p>
        </div>
        <Button
          onClick={() => setModalCrearOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Cuenta por Pagar
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar por proveedor, RIF o ID..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Cuentas Pendientes */}
        <Card className="flex flex-col h-full max-h-[90vh]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span>Cuentas Pendientes</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCuentasData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {loading && cuentas.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600 mr-2"></span>
                <span>Cargando...</span>
              </div>
            ) : cuentasPendientes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay cuentas pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cuentasPendientes.map((cuenta) => (
                  <div
                    key={cuenta._id}
                    className="border-2 border-red-300 rounded-xl bg-gradient-to-br from-white to-red-50 shadow-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-red-600 text-white">
                        #{cuenta._id.slice(-6)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(cuenta.fechaCreacion).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-gray-800">{cuenta.proveedor.nombre}</h3>
                      <p className="text-sm text-gray-600">RIF: {cuenta.proveedor.rif}</p>
                      {cuenta.proveedor.telefono && (
                        <p className="text-sm text-gray-600">Tel: {cuenta.proveedor.telefono}</p>
                      )}
                    </div>
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-red-700">${cuenta.total.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        Abonado: ${cuenta.montoAbonado.toFixed(2)} | 
                        Saldo: ${cuenta.saldoPendiente.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleAbrirModalAbonar(cuenta)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Abonar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cuentas Pagadas */}
        <Card className="flex flex-col h-full max-h-[90vh]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Cuentas Pagadas</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {cuentasPagadas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay cuentas pagadas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cuentasPagadas.map((cuenta) => (
                  <div
                    key={cuenta._id}
                    className="border-2 border-green-300 rounded-xl bg-gradient-to-br from-white to-green-50 shadow-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-green-600 text-white">
                        #{cuenta._id.slice(-6)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(cuenta.fechaCreacion).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-gray-800">{cuenta.proveedor.nombre}</h3>
                      <p className="text-sm text-gray-600">RIF: {cuenta.proveedor.rif}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-green-700">${cuenta.total.toFixed(2)}</p>
                    </div>
                    <Button
                      onClick={() => handleVerPreliminar(cuenta)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Preliminar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Crear Cuenta */}
      <Dialog open={modalCrearOpen} onOpenChange={setModalCrearOpen}>
        <DialogContent className="max-w-[95vh] w-[95vh] max-h-[95vh] h-[95vh] overflow-hidden flex flex-col p-0 m-0" style={{ width: '95vh', maxWidth: '95vh' }}>
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">Agregar Cuenta por Pagar</DialogTitle>
                <DialogDescription className="mt-1">
                  Complete la información del proveedor y los items o descripción
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImprimirCuenta}
                  disabled={!proveedorSeleccionadoId || (!mostrarItems && !descripcion) || (mostrarItems && itemsSeleccionados.length === 0)}
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportarPDF}
                  disabled={!proveedorSeleccionadoId || (!mostrarItems && !descripcion) || (mostrarItems && itemsSeleccionados.length === 0)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar PDF
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 px-6 py-4">
            {/* Selector de Proveedor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Proveedor *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMostrarFormularioNuevoProveedor(!mostrarFormularioNuevoProveedor);
                    if (!mostrarFormularioNuevoProveedor) {
                      setProveedor({ nombre: "", rif: "", telefono: "" });
                      setProveedorSeleccionadoId("");
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {mostrarFormularioNuevoProveedor ? "Cancelar" : "Nuevo Proveedor"}
                </Button>
              </div>
              
              {!mostrarFormularioNuevoProveedor ? (
                <div className="relative">
                  <Input
                    value={busquedaProveedor}
                    onChange={(e) => {
                      setBusquedaProveedor(e.target.value);
                      setMostrarSugerenciasProveedor(true);
                    }}
                    onFocus={() => setMostrarSugerenciasProveedor(true)}
                    onBlur={() => setTimeout(() => setMostrarSugerenciasProveedor(false), 200)}
                    placeholder="Buscar proveedor por nombre, RIF o teléfono..."
                    className="focus:ring-2 focus:ring-blue-400"
                  />
                  
                  {mostrarSugerenciasProveedor && proveedoresFiltrados.length > 0 && busquedaProveedor.trim() && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                      {proveedoresFiltrados.map((prov, index) => (
                        <div
                          key={index}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                          onClick={() => handleSeleccionarProveedor(prov)}
                        >
                          <div className="font-semibold">{prov.nombre}</div>
                          <div className="text-sm text-gray-600">
                            RIF: {prov.rif}
                            {prov.telefono && ` | Tel: ${prov.telefono}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {mostrarSugerenciasProveedor && proveedoresFiltrados.length === 0 && busquedaProveedor.trim() && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-3">
                      <p className="text-gray-500 text-sm">No se encontraron proveedores</p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="mt-2 p-0 h-auto"
                        onClick={() => setMostrarFormularioNuevoProveedor(true)}
                      >
                        Agregar nuevo proveedor
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  <h4 className="font-semibold text-sm">Nuevo Proveedor</h4>
                  <div className="space-y-2">
                    <Label>Nombre del Proveedor *</Label>
                    <Input
                      value={proveedor.nombre}
                      onChange={(e) => setProveedor({ ...proveedor, nombre: e.target.value })}
                      placeholder="Nombre del proveedor"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>RIF *</Label>
                      <Input
                        value={proveedor.rif}
                        onChange={(e) => setProveedor({ ...proveedor, rif: e.target.value })}
                        placeholder="J-123456789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        value={proveedor.telefono}
                        onChange={(e) => setProveedor({ ...proveedor, telefono: e.target.value })}
                        placeholder="0414-1234567"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={agregarNuevoProveedor}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Proveedor
                  </Button>
                </div>
              )}
              
              {/* Mostrar proveedor seleccionado */}
              {proveedorSeleccionadoId && proveedor.nombre && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-semibold text-blue-800">Proveedor seleccionado:</p>
                  <p className="text-sm text-blue-700">{proveedor.nombre} - {proveedor.rif}</p>
                </div>
              )}
            </div>

            {/* Toggle entre Items y Descripción */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mostrarItems ? "default" : "outline"}
                onClick={() => {
                  setMostrarItems(true);
                  setDescripcion("");
                  setMonto(0);
                }}
              >
                Agregar Items del Inventario
              </Button>
              <Button
                type="button"
                variant={!mostrarItems ? "default" : "outline"}
                onClick={() => {
                  setMostrarItems(false);
                  setItemsSeleccionados([]);
                }}
              >
                Usar Descripción
              </Button>
            </div>

            {mostrarItems ? (
              <div className="space-y-4">
                {/* Búsqueda de items */}
                <div className="space-y-2">
                  <Label>Buscar Item del Inventario</Label>
                  <div className="relative">
                    <Input
                      value={itemBusqueda}
                      onChange={(e) => {
                        setItemBusqueda(e.target.value);
                        setMostrarItems(true);
                      }}
                      placeholder="Buscar por nombre, código o descripción..."
                      onFocus={() => setMostrarItems(true)}
                    />
                    {itemsDisponibles.length > 0 && itemBusqueda && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                        {itemsDisponibles.map((item: any) => (
                          <div
                            key={item._id}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                            onClick={() => agregarItem(item)}
                          >
                            <div className="font-semibold">{item.nombre || item.descripcion}</div>
                            <div className="text-sm text-gray-600">
                              Código: {item.codigo || "Sin código"} | 
                              Costo: ${(item.costo || 0).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items seleccionados - Siempre visible cuando hay items */}
                <div data-items-container className="space-y-3 border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                  <Label className="text-lg font-bold text-blue-800">
                    Items Seleccionados ({itemsSeleccionados.length})
                  </Label>
                  {itemsSeleccionados.length > 0 ? (
                    <>
                      <div className="max-h-[500px] overflow-y-auto border rounded-md bg-white">
                        <Table>
                          <TableHeader className="sticky top-0 bg-gray-100 z-10">
                            <TableRow>
                              <TableHead className="font-bold min-w-[80px]">Código</TableHead>
                              <TableHead className="font-bold min-w-[180px]">Nombre</TableHead>
                              <TableHead className="font-bold min-w-[100px]">Costo</TableHead>
                              <TableHead className="font-bold min-w-[80px]">Cantidad</TableHead>
                              <TableHead className="font-bold min-w-[100px]">Subtotal</TableHead>
                              <TableHead className="font-bold min-w-[80px] text-center">Eliminar</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {itemsSeleccionados.map((item, index) => (
                              <TableRow key={index} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{item.codigo || "Sin código"}</TableCell>
                                <TableCell className="font-medium max-w-[200px] truncate" title={item.nombre}>{item.nombre}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.costo}
                                    onChange={(e) => actualizarItem(index, "costo", parseFloat(e.target.value) || 0)}
                                    className="w-full min-w-[100px]"
                                    step="0.01"
                                    min="0"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.cantidad}
                                    onChange={(e) => actualizarItem(index, "cantidad", parseInt(e.target.value) || 0)}
                                    className="w-full min-w-[80px]"
                                    min="1"
                                  />
                                </TableCell>
                                <TableCell className="font-bold text-blue-700">${item.subtotal.toFixed(2)}</TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    onClick={() => eliminarItem(index)}
                                    className="gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white border border-red-700 hover:scale-105 transition-transform shadow-md"
                                    title={`Eliminar ${item.nombre}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-xs font-semibold">Eliminar</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-end items-center gap-4 pt-2 border-t-2 border-blue-300">
                        <span className="text-lg font-semibold text-gray-700">Total de Items:</span>
                        <span className="text-2xl font-bold text-blue-700">${totalItems.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="border rounded-md bg-white p-8 text-center text-gray-500">
                      <p>No hay items agregados. Busca y selecciona items del inventario arriba.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full p-2 border rounded-md min-h-[100px]"
                    placeholder="Descripción de la cuenta por pagar..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monto *</Label>
                  <Input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            )}

          </div>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0 px-6 pb-6 bg-gray-50">
            <Button variant="outline" onClick={() => {
              setModalCrearOpen(false);
              resetearFormulario();
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleCrearCuenta}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Guardando..." : "Guardar Cuenta por Pagar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Abonar */}
      <Dialog open={modalAbonarOpen} onOpenChange={setModalAbonarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abonar a Cuenta por Pagar</DialogTitle>
            <DialogDescription>
              Cuenta: #{cuentaSeleccionada?._id.slice(-6)} - {cuentaSeleccionada?.proveedor.nombre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total: ${cuentaSeleccionada?.total.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Abonado: ${cuentaSeleccionada?.montoAbonado.toFixed(2)}</p>
              <p className="text-sm font-bold text-red-600">
                Saldo Pendiente: ${cuentaSeleccionada?.saldoPendiente.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Monto a Abonar *</Label>
              <Input
                type="number"
                value={montoAbono}
                onChange={(e) => setMontoAbono(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
                max={cuentaSeleccionada?.saldoPendiente}
              />
            </div>

            <div className="space-y-2">
              <Label>Método de Pago *</Label>
              <Select value={metodoPagoSeleccionado} onValueChange={setMetodoPagoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un método de pago" />
                </SelectTrigger>
                <SelectContent>
                  {metodosPago.map((metodo) => (
                    <SelectItem key={metodo._id || metodo.id} value={metodo._id || metodo.id || ""}>
                      {metodo.nombre} - Saldo: ${metodo.saldo.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalAbonarOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAbonar}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Procesando..." : "Abonar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Preliminar */}
      <Dialog open={modalPreliminarOpen} onOpenChange={setModalPreliminarOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preliminar - Cuenta por Pagar #{cuentaPreliminar?._id.slice(-6)}</DialogTitle>
          </DialogHeader>

          {cuentaPreliminar && (
            <div className="space-y-4">
              {/* Información del Proveedor */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">Proveedor</h3>
                <p><strong>Nombre:</strong> {cuentaPreliminar.proveedor.nombre}</p>
                <p><strong>RIF:</strong> {cuentaPreliminar.proveedor.rif}</p>
                {cuentaPreliminar.proveedor.telefono && (
                  <p><strong>Teléfono:</strong> {cuentaPreliminar.proveedor.telefono}</p>
                )}
              </div>

              {/* Items o Descripción */}
              {cuentaPreliminar.items && cuentaPreliminar.items.length > 0 ? (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cuentaPreliminar.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.codigo}</TableCell>
                          <TableCell>{item.nombre}</TableCell>
                          <TableCell>${item.costo.toFixed(2)}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">Descripción</h3>
                  <p>{cuentaPreliminar.descripcion}</p>
                </div>
              )}

              {/* Resumen */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-xl">${cuentaPreliminar.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Historial de Abonos */}
              {cuentaPreliminar.historialAbonos && cuentaPreliminar.historialAbonos.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">Historial de Abonos</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método de Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cuentaPreliminar.historialAbonos.map((abono, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(abono.fecha).toLocaleDateString()}
                          </TableCell>
                          <TableCell>${abono.monto.toFixed(2)}</TableCell>
                          <TableCell>{abono.metodoPagoNombre || abono.metodoPago}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between">
                      <span>Total Abonado:</span>
                      <span className="font-bold">${cuentaPreliminar.montoAbonado.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setModalPreliminarOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CuentasPorPagar;
