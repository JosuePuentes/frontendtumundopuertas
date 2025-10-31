import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { getApiUrl } from "@/lib/api";
import { CheckCircle2, DollarSign, Receipt, Printer, FileText, RefreshCw, Search } from "lucide-react";

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

const FacturacionPage: React.FC = () => {
  const [facturacion, setFacturacion] = useState<any[]>([]);
  const [facturasConfirmadas, setFacturasConfirmadas] = useState<FacturaConfirmada[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalAccion, setModalAccion] = useState<'facturar' | 'cargar_inventario'>('facturar');
  const [modalPreliminarOpen, setModalPreliminarOpen] = useState<boolean>(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [selectedFactura, setSelectedFactura] = useState<FacturaConfirmada | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [busquedaCliente, setBusquedaCliente] = useState<string>("");

  const fetchPedidosFacturacion = async () => {
    setLoading(true);
    setError("");
    try {
      // Primero intentar buscar pedidos con estado_general = "orden4" (listos para facturación)
      // También buscar pedidos que tengan todos los items terminados (estado_item = 4)
      let pedidos: any[] = [];
      let pedidosOrden4: any[] = [];
      
      try {
        // Intentar obtener pedidos con estado_general = "orden4"
        const resOrden4 = await fetch(`${getApiUrl()}/pedidos/estado/?estado_general=orden4`);
        if (resOrden4.ok) {
          pedidosOrden4 = await resOrden4.json();
          pedidos = [...pedidosOrden4];
          console.log(`✅ Pedidos con estado_general=orden4: ${pedidosOrden4.length}`);
        }
      } catch (e) {
        console.warn('No se pudo obtener pedidos por estado, usando /all/');
      }
      
      // Si no hay pedidos con orden4, obtener todos los pedidos para buscar los que tengan items completados
      if (pedidos.length === 0) {
        const res = await fetch(`${getApiUrl()}/pedidos/all/`);
        if (!res.ok) throw new Error("Error al obtener pedidos");
        pedidos = await res.json();
      }
      
      // IMPORTANTE: Buscar pedidos que tengan todos los items con estado_item = 4 (terminados)
      // Estos pedidos deben aparecer en facturación aunque no tengan estado_general = "orden4"
      const pedidosConItemsCompletados: any[] = [];
      for (const pedido of pedidos) {
        // Verificar si todos los items tienen estado_item = 4
        const todosItemsTerminados = pedido.items?.every((item: any) => 
          item.estado_item === 4 || item.estado_item >= 4
        ) || false;
        
        if (todosItemsTerminados && !pedidosOrden4.find((p: any) => p._id === pedido._id)) {
          pedidosConItemsCompletados.push(pedido);
          console.log(`✅ Pedido ${pedido._id.slice(-4)}: todos los items terminados (estado_item = 4)`);
        }
      }
      
      // Combinar pedidos con orden4 y pedidos con items completados
      const pedidosIdsExistentes = new Set(pedidos.map((p: any) => p._id));
      for (const pedido of pedidosConItemsCompletados) {
        if (!pedidosIdsExistentes.has(pedido._id)) {
          pedidos.push(pedido);
        }
      }
      
      console.log(`📊 Pedidos con items completados encontrados: ${pedidosConItemsCompletados.length}`);
      
      // Eliminar el filtro restrictivo de fecha - mostrar pedidos al 100% independientemente de la fecha
      // Pero ordenar por fecha para mostrar los más recientes primero
      const pedidosOrdenados = [...pedidos].sort((a: any, b: any) => {
        const fechaA = new Date(a.fecha_creacion || 0).getTime();
        const fechaB = new Date(b.fecha_creacion || 0).getTime();
        return fechaB - fechaA; // Más reciente primero
      });
      
      // Aumentar el límite a 1000 pedidos para asegurar que no se pierdan pedidos al 100%
      // Pero priorizar pedidos con items completados o orden4
      const pedidosPrioritarios = pedidosOrdenados.filter((p: any) => 
        p.estado_general === "orden4" || 
        pedidosConItemsCompletados.find((pc: any) => pc._id === p._id)
      );
      
      const pedidosRestantes = pedidosOrdenados.filter((p: any) => 
        !pedidosPrioritarios.find((pp: any) => pp._id === p._id)
      ).slice(0, 500);
      
      const pedidosLimitados = [...pedidosPrioritarios, ...pedidosRestantes];
      
      console.log(`📅 Total pedidos para verificar: ${pedidosLimitados.length} de ${pedidos.length}`);
      console.log(`📅 Pedidos prioritarios (orden4 o items completados): ${pedidosPrioritarios.length}`);
      
      // OPTIMIZACIÓN: Cargar todos los pedidos en paralelo con timeout
      // Si un pedido ya tiene estado_general = "orden4", asumimos que está al 100%
      const pedidosConProgreso = await Promise.all(
        pedidosLimitados.map(async (pedido: any) => {
          try {
            // Si el pedido ya tiene estado_general = "orden4", asumimos que está listo
            if (pedido.estado_general === "orden4") {
              console.log(`✅ Pedido ${pedido._id.slice(-4)}: ya tiene estado_general=orden4, verificando progreso...`);
            }
            
            // Verificar progreso del pedido con timeout
            let progresoData: any = null;
            let progresoEs100 = false;
            const pedidoIdShort = pedido._id.slice(-4);
            
            try {
              const progresoRes = await fetch(`${getApiUrl()}/pedidos/progreso-pedido/${pedido._id}`, {
                signal: AbortSignal.timeout(5000) // 5 segundos timeout
              });
              
              if (progresoRes.ok) {
                progresoData = await progresoRes.json();
                // Usar >= 99.5 para permitir pequeños errores de redondeo (99.5% se considera 100%)
                progresoEs100 = (progresoData.progreso_general || 0) >= 99.5;
                console.log(`📊 Pedido ${pedidoIdShort}: progreso=${progresoData.progreso_general}%, es100=${progresoEs100}`);
                
                // Log especial para pedidos específicos que buscamos
                if (pedido._id.includes('61c3f0') || pedidoIdShort === '3f0') {
                  console.log(`🔍 PEDIDO ESPECIAL ENCONTRADO ${pedidoIdShort}:`, {
                    id: pedido._id,
                    estado_general: pedido.estado_general,
                    progreso_general: progresoData.progreso_general,
                    progresoEs100,
                    fecha_creacion: pedido.fecha_creacion
                  });
                }
              } else {
                console.warn(`⚠️ No se pudo obtener progreso del pedido ${pedidoIdShort} (status: ${progresoRes.status})`);
              }
            } catch (progresoErr: any) {
              console.warn(`⚠️ Error al verificar progreso del pedido ${pedidoIdShort}:`, progresoErr.message);
            }
            
            // Incluir el pedido si:
            // 1. Tiene progreso >= 99.5% (considerado 100%), O
            // 2. Tiene estado_general = "orden4" (listo para facturación), O
            // 3. Todos los items tienen estado_item = 4 (completados)
            const todosItemsCompletados = pedido.items?.every((item: any) => item.estado_item === 4 || item.estado_item >= 4) || false;
            
            if (!progresoEs100 && pedido.estado_general !== "orden4" && !todosItemsCompletados) {
              if (pedido._id.includes('61c3f0') || pedidoIdShort === '3f0') {
                console.log(`❌ PEDIDO ${pedidoIdShort} EXCLUIDO:`, {
                  progresoEs100,
                  estado_general: pedido.estado_general,
                  todosItemsCompletados,
                  items: pedido.items?.map((i: any) => ({ id: i.id?.slice(-4), estado_item: i.estado_item }))
                });
              }
              return null;
            }
            
            // Log si se incluye el pedido especial
            if (pedido._id.includes('61c3f0') || pedidoIdShort === '3f0') {
              console.log(`✅ PEDIDO ${pedidoIdShort} INCLUIDO EN FACTURACIÓN:`, {
                progresoEs100,
                estado_general: pedido.estado_general,
                todosItemsCompletados
              });
            }
            
            // Si tiene estado_general = "orden4" pero no se pudo verificar progreso, incluirlo de todas formas
            if (pedido.estado_general === "orden4" && !progresoData) {
              console.log(`✅ Incluyendo pedido ${pedido._id.slice(-4)} con estado_general=orden4 aunque no se pudo verificar progreso`);
            }
            
            // Obtener información de pagos del pedido (NUEVO ENDPOINT) con timeout
            const pagosRes = await fetch(`${getApiUrl()}/pedidos/${pedido._id}/pagos`, {
              signal: AbortSignal.timeout(5000) // 5 segundos timeout
            });
            let montoTotal = pedido.items?.reduce((acc: number, item: any) => acc + (item.precio || 0) * (item.cantidad || 0), 0) || 0;
            let montoAbonado = 0;
            let historialPagos: any[] = [];
            
            if (pagosRes.ok) {
              const pagosData = await pagosRes.json();
              // Usar datos del backend que ya traen los totales calculados
              montoTotal = pagosData.total_pedido || montoTotal;
              montoAbonado = pagosData.total_abonado || 0;
              historialPagos = pagosData.historial_pagos || [];
            }
            
            // Buscar fecha de finalización (último seguimiento con fecha_fin)
            let fecha100Porciento = null;
            if (pedido.seguimiento && Array.isArray(pedido.seguimiento)) {
              for (const seguimiento of pedido.seguimiento.reverse()) {
                if (seguimiento.fecha_fin) {
                  fecha100Porciento = seguimiento.fecha_fin;
                  break;
                }
              }
            }
            
            return {
              ...pedido,
              montoTotal,
              montoAbonado,
              fecha100Porciento,
              historialPagos,
              puedeFacturar: montoAbonado >= montoTotal
            };
          } catch (err: any) {
            // Si el pedido tiene estado_general = "orden4", incluirlo aunque haya errores
            if (pedido.estado_general === "orden4") {
              console.warn(`⚠️ Error al procesar pedido ${pedido._id.slice(-4)}, pero tiene estado_general=orden4, incluyéndolo con datos básicos:`, err.message);
              // Retornar el pedido con datos básicos
              let montoTotal = pedido.items?.reduce((acc: number, item: any) => acc + (item.precio || 0) * (item.cantidad || 0), 0) || 0;
              return {
                ...pedido,
                montoTotal,
                montoAbonado: pedido.total_abonado || 0,
                fecha100Porciento: null,
                historialPagos: pedido.historial_pagos || [],
                puedeFacturar: (pedido.total_abonado || 0) >= montoTotal
              };
            }
            // Para otros errores, ignorar silenciosamente solo si son timeout
            if (err.name !== 'AbortError' && err.name !== 'TimeoutError') {
              console.error(`❌ Error al obtener progreso del pedido ${pedido._id.slice(-4)}:`, err);
            }
            return null;
          }
        })
      );
      
      // Filtrar nulos
      const pedidosParaFacturar = pedidosConProgreso.filter((p) => p !== null);
      
      // Filtrar pedidos que ya fueron facturados (están en localStorage)
      const storedFacturas = localStorage.getItem('facturas_confirmadas');
      const facturasConfirmadasIds: string[] = [];
      if (storedFacturas) {
        try {
          const facturas: FacturaConfirmada[] = JSON.parse(storedFacturas);
          facturasConfirmadasIds.push(...facturas.map(f => f.pedidoId));
        } catch (e) {
          console.error('Error al leer facturas confirmadas:', e);
        }
      }
      
      const pedidosPendientes = pedidosParaFacturar.filter(p => !facturasConfirmadasIds.includes(p._id));
      
      // CRÍTICO: Ordenar por fecha (más reciente primero) después de filtrar
      // Usar fecha100Porciento si está disponible, sino fecha_creacion
      const pedidosOrdenadosPorFecha = pedidosPendientes.sort((a: any, b: any) => {
        // Priorizar fecha100Porciento (cuándo alcanzó el 100%)
        const fechaA = a.fecha100Porciento 
          ? new Date(a.fecha100Porciento).getTime()
          : new Date(a.fecha_creacion || 0).getTime();
        const fechaB = b.fecha100Porciento 
          ? new Date(b.fecha100Porciento).getTime()
          : new Date(b.fecha_creacion || 0).getTime();
        return fechaB - fechaA; // Más reciente primero
      });
      
      console.log('📊 Total pedidos obtenidos:', pedidos.length);
      console.log('📊 Pedidos limitados:', pedidosLimitados.length);
      console.log('📊 Pedidos al 100%:', pedidosParaFacturar.length);
      console.log('📊 Pedidos pendientes (sin confirmar):', pedidosPendientes.length);
      console.log('📊 Pedidos ordenados por fecha (más reciente primero):', pedidosOrdenadosPorFecha.length);
      
      setFacturacion(pedidosOrdenadosPorFecha);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Cargar facturas confirmadas desde localStorage
  useEffect(() => {
    const storedFacturas = localStorage.getItem('facturas_confirmadas');
    if (storedFacturas) {
      setFacturasConfirmadas(JSON.parse(storedFacturas));
    }
  }, []);

  useEffect(() => {
    fetchPedidosFacturacion();
  }, []);

  // Filtrar pedidos por nombre de cliente en tiempo real y mantener orden por fecha más reciente
  const facturacionFiltrada = useMemo(() => {
    let pedidos = facturacion;
    
    // Filtrar por búsqueda si hay texto
    if (busquedaCliente.trim()) {
      const busquedaLower = busquedaCliente.toLowerCase().trim();
      pedidos = facturacion.filter((pedido: any) => {
        const nombreCliente = (pedido.cliente_nombre || pedido.cliente_id || '').toLowerCase();
        const clienteId = (pedido.cliente_id || '').toLowerCase();
        return nombreCliente.includes(busquedaLower) || clienteId.includes(busquedaLower);
      });
    }
    
    // Asegurar que siempre estén ordenados por fecha más reciente primero
    return [...pedidos].sort((a: any, b: any) => {
      const fechaA = a.fecha100Porciento 
        ? new Date(a.fecha100Porciento).getTime()
        : new Date(a.fecha_creacion || 0).getTime();
      const fechaB = b.fecha100Porciento 
        ? new Date(b.fecha100Porciento).getTime()
        : new Date(b.fecha_creacion || 0).getTime();
      return fechaB - fechaA; // Más reciente primero
    });
  }, [facturacion, busquedaCliente]);

  // Generar número de factura único
  const generarNumeroFactura = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `F-${year}${month}${day}-${timestamp}`;
  };

  // Guardar factura confirmada en localStorage
  const guardarFacturaConfirmada = (factura: FacturaConfirmada) => {
    const nuevasFacturas = [...facturasConfirmadas, factura];
    setFacturasConfirmadas(nuevasFacturas);
    localStorage.setItem('facturas_confirmadas', JSON.stringify(nuevasFacturas));
  };

  const handleFacturar = async (pedido: any) => {
    setSelectedPedido(pedido);
    setModalAccion('facturar');
    setModalOpen(true);
  };

  const esClienteCargaInventario = (pedido: any) => {
    const rif = String(pedido?.cliente_id || '').toUpperCase().replace(/\s+/g, '');
    return rif === 'J-507172554';
  };

  const handleCargarInventario = async (pedido: any) => {
    setSelectedPedido(pedido);
    setModalAccion('cargar_inventario');
    setModalOpen(true);
  };

  const handleConfirmarFacturacion = async () => {
    if (!selectedPedido) return;
    
    setConfirming(true);
    try {
      if (modalAccion === 'cargar_inventario') {
        // Cargar existencias al inventario (solo para el cliente especial)
        const res = await fetch(`${getApiUrl()}/inventario/cargar-existencias-desde-pedido`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pedido_id: selectedPedido._id })
        });
        if (!res.ok) throw new Error('Error al cargar existencias al inventario');
        setFacturacion(prev => prev.filter(p => p._id !== selectedPedido._id));
        setModalOpen(false);
        alert('✓ Existencias cargadas al inventario correctamente');
      } else {
        // Flujo normal de facturación
        const numeroFactura = generarNumeroFactura();
        const facturaConfirmada: FacturaConfirmada = {
          id: selectedPedido._id + '-' + Date.now(),
          numeroFactura: numeroFactura,
          pedidoId: selectedPedido._id,
          clienteNombre: selectedPedido.cliente_nombre || selectedPedido.cliente_id || 'N/A',
          clienteId: selectedPedido.cliente_id || '',
          montoTotal: selectedPedido.montoTotal,
          fechaCreacion: selectedPedido.fecha_creacion || new Date().toISOString(),
          fechaFacturacion: new Date().toISOString(),
          items: selectedPedido.items || []
        };
        // TODO backend: marcar pedido como facturado si aplica
        guardarFacturaConfirmada(facturaConfirmada);
        setFacturacion(prev => prev.filter(p => p._id !== selectedPedido._id));
        setModalOpen(false);
        alert(`✓ Pedido facturado exitosamente\nNúmero de Factura: ${numeroFactura}`);
      }
    } catch (error) {
      console.error('Error al confirmar acción:', error);
      alert(modalAccion === 'cargar_inventario' ? 'Error al cargar existencias' : 'Error al confirmar la facturación');
    } finally {
      setConfirming(false);
      setSelectedPedido(null);
    }
  };

  const handleVerPreliminar = (factura: FacturaConfirmada) => {
    setSelectedFactura(factura);
    setModalPreliminarOpen(true);
  };

  const handlePrintFacturaConfirmada = () => {
    if (!selectedFactura) return;
    
    const now = new Date().toLocaleDateString("es-VE", {
      timeZone: "America/Caracas",
    });
    
    const notaHtml = `
      <html>
        <head>
          <title>Nota de Entrega ${selectedFactura.numeroFactura}</title>
          <style>
            @media print {
              @page { size: letter; margin: 1in; }
              body { margin: 0; }
              .center-container { display: flex; justify-content: center; align-items: flex-start; }
              .nota-carta { width: 100%; max-width: 100%; margin: 0 auto; box-sizing: border-box; min-height: unset; border-radius: 0; box-shadow: none; }
            }
            body { background: #f9f9f9; }
            .center-container { display: flex; justify-content: center; align-items: flex-start; }
            .nota-carta { background: #fff; border-radius: 0; box-shadow: none; padding: 2rem; width: 100%; max-width: 100%; margin: 2rem auto; font-family: 'Inter', sans-serif; min-height: unset; }
            .nota-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
            .titulo { font-size: 2rem; color: #1e3a8a; font-weight: bold; margin-bottom: 0.5rem; text-align: left; }
            .badge { background: #2563eb; color: #fff; border-radius: 999px; padding: 4px 16px; font-weight: bold; font-size: 1rem; }
            .nota-info { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
            .nota-info div { font-size: 15px; }
            .nota-label { font-weight: 600; color: #374151; margin-bottom: 2px; }
            .nota-value { font-size: 18px; font-weight: bold; color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 14px; }
            th { background: #f3f4f6; }
            .totales-row { background: #f3f4f6; font-weight: bold; }
            .nota-footer { margin-top: 2rem; color: #64748b; font-size: 13px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="center-container">
            <div class="nota-carta">
              <div class="nota-header">
                <div>
                  <div class="titulo">NOTA DE ENTREGA ${selectedFactura.numeroFactura}</div>
                </div>
              </div>
              <div class="nota-info">
                <div>
                  <div class="nota-label">Cédula/RIF:</div>
                  <div class="nota-value">${selectedFactura.clienteId || 'N/A'}</div>
                  <div class='nota-label'>Nombre o Razón Social: <span style='font-weight:600;'>${selectedFactura.clienteNombre}</span></div>
                </div>
                <div>
                  <div class="nota-label">Fecha de Emisión:</div>
                  <div style="color: #059669; font-size: 16px;">${now}</div>
                  <div class="nota-label">Número de Factura:</div>
                  <div style="color: #1e3a8a; font-size: 20px; font-weight: bold;">${selectedFactura.numeroFactura}</div>
                </div>
              </div>
              <div style="margin-bottom: 1.5rem;">
                <div style="font-weight:600;font-size:17px;margin-bottom:8px;">Artículos del Pedido</div>
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Precio Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${selectedFactura.items.map((item: any) => `
                      <tr>
                        <td>${item.nombre || item.descripcion || 'N/A'}</td>
                        <td>${item.descripcion || item.detalleitem || ''}</td>
                        <td style="text-align:center;">${item.cantidad || 1}</td>
                        <td style="text-align:right;">$${(item.precio || 0).toFixed(2)}</td>
                        <td style="text-align:right;">$${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                  <tfoot>
                    <tr class="totales-row">
                      <td colspan="3" style="text-align:right;">Total:</td>
                      <td style="text-align:center;">${selectedFactura.items.reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0)}</td>
                      <td style="text-align:right;">$${selectedFactura.montoTotal.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;
    
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    win.document.write(notaHtml);
    win.document.close();
  };

  const handlePrintNotaEntrega = () => {
    if (!selectedPedido) return;
    
    const now = new Date().toLocaleDateString("es-VE", {
      timeZone: "America/Caracas",
    });
    
    const notaHtml = `
      <html>
        <head>
          <title>Nota de Entrega</title>
          <style>
            @media print {
              @page { size: letter; margin: 1in; }
              body { margin: 0; }
              .center-container { display: flex; justify-content: center; align-items: flex-start; }
              .nota-carta { width: 100%; max-width: 100%; margin: 0 auto; box-sizing: border-box; min-height: unset; border-radius: 0; box-shadow: none; }
            }
            body { background: #f9f9f9; }
            .center-container { display: flex; justify-content: center; align-items: flex-start; }
            .nota-carta { background: #fff; border-radius: 0; box-shadow: none; padding: 2rem; width: 100%; max-width: 100%; margin: 2rem auto; font-family: 'Inter', sans-serif; min-height: unset; }
            .nota-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
            .titulo { font-size: 2rem; color: #1e3a8a; font-weight: bold; margin-bottom: 0.5rem; text-align: left; }
            .badge { background: #2563eb; color: #fff; border-radius: 999px; padding: 4px 16px; font-weight: bold; font-size: 1rem; }
            .nota-info { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
            .nota-info div { font-size: 15px; }
            .nota-label { font-weight: 600; color: #374151; margin-bottom: 2px; }
            .nota-value { font-size: 18px; font-weight: bold; color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 14px; }
            th { background: #f3f4f6; }
            .totales-row { background: #f3f4f6; font-weight: bold; }
            .nota-footer { margin-top: 2rem; color: #64748b; font-size: 13px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="center-container">
            <div class="nota-carta">
              <div class="nota-header">
                <div>
                  <div class="titulo">NOTA DE ENTREGA</div>
                </div>
              </div>
              <div class="nota-info">
                <div>
                  <div class="nota-label">Cédula/RIF:</div>
                  <div class="nota-value">${selectedPedido.cliente_id || selectedPedido.cliente_nombre || 'N/A'}</div>
                  ${selectedPedido.cliente_nombre ? `<div class='nota-label'>Nombre o Razón Social: <span style='font-weight:600;'>${selectedPedido.cliente_nombre}</span></div>` : ''}
                </div>
                <div>
                  <div class="nota-label">Fecha de Emisión:</div>
                  <div style="color: #059669; font-size: 16px;">${now}</div>
                </div>
              </div>
              <div style="margin-bottom: 1.5rem;">
                <div style="font-weight:600;font-size:17px;margin-bottom:8px;">Artículos del Pedido</div>
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Precio Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${selectedPedido.items.map((item: any) => `
                      <tr>
                        <td>${item.nombre || item.descripcion || 'N/A'}</td>
                        <td>${item.descripcion || item.detalleitem || ''}</td>
                        <td style="text-align:center;">${item.cantidad || 1}</td>
                        <td style="text-align:right;">$${(item.precio || 0).toFixed(2)}</td>
                        <td style="text-align:right;">$${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                  <tfoot>
                    <tr class="totales-row">
                      <td colspan="3" style="text-align:right;">Total:</td>
                      <td style="text-align:center;">${selectedPedido.items.reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0)}</td>
                      <td style="text-align:right;">$${selectedPedido.montoTotal.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;
    
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    win.document.write(notaHtml);
    win.document.close();
  };

  return (
    <>
    <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sección: Pendientes de Facturar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              Pendientes de Facturar
            </CardTitle>
            <Button
              onClick={() => fetchPedidosFacturacion()}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
          {/* Buscador en tiempo real por nombre de cliente */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por nombre de cliente o RIF..."
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              className="pl-10 w-full"
            />
            {busquedaCliente && (
              <div className="mt-2 text-sm text-gray-600">
                Mostrando {facturacionFiltrada.length} de {facturacion.length} pedidos
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-2"></span>
            <span className="text-blue-600 font-semibold">Cargando pedidos...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 font-semibold py-4">{error}</div>
        ) : facturacionFiltrada.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <CheckCircle2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg font-medium">
              {busquedaCliente ? 'No se encontraron pedidos con ese cliente' : 'No hay pedidos listos para facturar'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {busquedaCliente ? 'Intenta con otro nombre o limpia la búsqueda' : 'Los pedidos aparecerán aquí cuando estén al 100%'}
            </p>
          </div>
        ) : (
          <ul className="space-y-6">
            {facturacionFiltrada.map((pedido: any) => (
              <li key={pedido._id} className="border-2 border-blue-300 rounded-xl bg-gradient-to-br from-white to-blue-50 shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
                <div className="flex flex-wrap items-center justify-between mb-4 pb-4 border-b-2 border-blue-200">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-600 text-white px-4 py-2 text-lg font-bold">
                      #{pedido._id.slice(-6)}
                    </Badge>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{pedido.cliente_nombre || pedido.cliente_id}</h3>
                      <p className="text-sm text-gray-600">Cliente</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-green-600 mb-1" />
                    <Badge className="bg-green-500 text-white px-3 py-1 rounded-full">✓ 100% Completado</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600 font-semibold">📅 Fecha de Creación</p>
                    <p className="text-lg font-bold text-blue-700">
                      {pedido.fecha_creacion ? new Date(pedido.fecha_creacion).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600 font-semibold">✓ Completado al 100%</p>
                    <p className="text-lg font-bold text-green-700">
                      {pedido.fecha100Porciento ? new Date(pedido.fecha100Porciento).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                      <DollarSign className="w-4 h-4" /> Monto Total del Pedido
                    </p>
                    <p className="text-2xl font-bold text-gray-800">${pedido.montoTotal.toFixed(2)}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                      <DollarSign className="w-4 h-4" /> Monto Abonado
                    </p>
                    <p className="text-2xl font-bold text-green-700">${pedido.montoAbonado.toFixed(2)}</p>
                  </div>
                </div>

                {pedido.items && pedido.items.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-bold text-lg text-gray-800 mb-3">📦 Items del Pedido</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pedido.items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-blue-400 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-bold text-gray-800">{item.nombre || item.descripcion}</p>
                              <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
                            </div>
                            <span className="text-lg font-bold text-green-700">
                              ${((item.precio || 0) * (item.cantidad || 0)).toFixed(2)}
                            </span>
                          </div>
                          {/* Imágenes removidas por solicitud del usuario */}
                          {item.detalleitem && (
                            <p className="text-xs text-gray-600 mt-2">{item.detalleitem}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t-2 border-gray-200">
                  {esClienteCargaInventario(pedido) ? (
                    <Button
                      onClick={() => handleCargarInventario(pedido)}
                      disabled={!pedido.puedeFacturar}
                      className={`w-full py-6 text-lg font-bold ${
                        pedido.puedeFacturar
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {pedido.puedeFacturar ? (
                        <>
                          <Receipt className="w-6 h-6 mr-2" />✓ LISTO PARA CARGAR EXISTENCIAS AL INVENTARIO
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-6 h-6 mr-2" />
                          ⚠️ Pendiente pago completo (${(pedido.montoTotal - pedido.montoAbonado).toFixed(2)})
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleFacturar(pedido)}
                      disabled={!pedido.puedeFacturar}
                      className={`w-full py-6 text-lg font-bold ${
                        pedido.puedeFacturar
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {pedido.puedeFacturar ? (
                        <>
                          <Receipt className="w-6 h-6 mr-2" />✓ LISTO PARA FACTURAR
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-6 h-6 mr-2" />
                          ⚠️ Pendiente pago completo (${(pedido.montoTotal - pedido.montoAbonado).toFixed(2)})
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>

      {/* Sección: Facturas Procesadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-600" />
            Facturas Procesadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facturasConfirmadas.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg font-medium">No hay facturas procesadas</p>
              <p className="text-gray-500 text-sm mt-2">Las facturas confirmadas aparecerán aquí</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {facturasConfirmadas.map((factura) => (
                <li key={factura.id} className="border-2 border-green-300 rounded-xl bg-gradient-to-br from-white to-green-50 shadow-lg p-4 transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-green-600 text-white px-3 py-1 text-sm font-bold">
                      {factura.numeroFactura}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(factura.fechaFacturacion).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mb-3">
                    <h3 className="font-bold text-lg text-gray-800">{factura.clienteNombre}</h3>
                    <p className="text-sm text-gray-600">ID Pedido: #{factura.pedidoId.slice(-6)}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-2xl font-bold text-green-700">${factura.montoTotal.toFixed(2)}</p>
                  </div>
                  <Button 
                    onClick={() => handleVerPreliminar(factura)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Preliminar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
    
    {/* Modal de Confirmación y Nota de Entrega */}
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar Facturación</DialogTitle>
          <DialogDescription>
            Revisa los detalles del pedido antes de facturar
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
                      <th className="p-2 text-left">Nombre</th>
                      <th className="p-2 text-left">Descripción</th>
                      <th className="p-2 text-center">Cantidad</th>
                      <th className="p-2 text-right">Precio Unit.</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPedido.items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-t">
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
                      <td colSpan={3} className="p-2 text-right">Total del Pedido:</td>
                      <td className="p-2 text-center">{selectedPedido.items.reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0)}</td>
                      <td className="p-2 text-right text-lg text-green-700">${selectedPedido.montoTotal.toFixed(2)}</td>
                    </tr>
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
            className="bg-green-600 hover:bg-green-700"
          >
            {confirming ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2 inline-block"></span>
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirmar Facturación
              </>
            )}
          </Button>
          <Button onClick={handlePrintNotaEntrega} className="bg-blue-600 hover:bg-blue-700" disabled={confirming}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Nota de Entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de Preliminar para Facturas Confirmadas */}
    <Dialog open={modalPreliminarOpen} onOpenChange={setModalPreliminarOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preliminar de Nota de Entrega</DialogTitle>
          <DialogDescription>
            Revisa los detalles de la nota de entrega confirmada
          </DialogDescription>
        </DialogHeader>
        
        {selectedFactura && (
          <div className="space-y-4">
            {/* Información de la Factura */}
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h3 className="font-bold text-lg mb-3 text-green-900">Información de la Factura</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Factura:</p>
                  <p className="font-bold text-lg text-green-700">{selectedFactura.numeroFactura}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Facturación:</p>
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
              <h3 className="font-bold text-lg mb-3">Artículos de la Factura</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Nombre</th>
                      <th className="p-2 text-left">Descripción</th>
                      <th className="p-2 text-center">Cantidad</th>
                      <th className="p-2 text-right">Precio Unit.</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFactura.items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-t">
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
                      <td colSpan={3} className="p-2 text-right">Total de la Factura:</td>
                      <td className="p-2 text-center">{selectedFactura.items.reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0)}</td>
                      <td className="p-2 text-right text-lg text-green-700">${selectedFactura.montoTotal.toFixed(2)}</td>
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
          <Button onClick={handlePrintFacturaConfirmada} className="bg-green-600 hover:bg-green-700">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Nota de Entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default FacturacionPage;
