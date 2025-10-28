import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { getApiUrl } from "@/lib/api";
import { CheckCircle2, DollarSign, Receipt, Printer } from "lucide-react";

const FacturacionPage: React.FC = () => {
  const [facturacion, setFacturacion] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);

  const fetchPedidosFacturacion = async () => {
    setLoading(true);
    setError("");
    try {
      // Obtener todos los pedidos y filtrar los que están al 100%
      const res = await fetch(`${getApiUrl()}/pedidos/all/`);
      if (!res.ok) throw new Error("Error al obtener pedidos");
      const pedidos = await res.json();
      
      // FILTRO: Solo pedidos de hoy en adelante
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Inicio del día
      
      const pedidosRecientes = pedidos.filter((pedido: any) => {
        const fechaCreacion = new Date(pedido.fecha_creacion);
        return fechaCreacion >= hoy;
      });
      
      console.log(`📅 Pedidos de hoy en adelante: ${pedidosRecientes.length} de ${pedidos.length}`);
      
      // OPTIMIZACIÓN: Ordenar pedidos por fecha (más recientes primero)
      const pedidosOrdenados = [...pedidosRecientes].sort((a: any, b: any) => {
        const fechaA = new Date(a.fecha_creacion || 0).getTime();
        const fechaB = new Date(b.fecha_creacion || 0).getTime();
        return fechaB - fechaA; // Más reciente primero
      });
      
      // OPTIMIZACIÓN: Limitar cantidad de pedidos para evitar timeout
      const pedidosLimitados = pedidosOrdenados.slice(0, 50); // Solo primeros 50 pedidos más recientes
      
      // OPTIMIZACIÓN: Cargar todos los pedidos en paralelo con timeout
      const pedidosConProgreso = await Promise.all(
        pedidosLimitados.map(async (pedido: any) => {
          try {
            // Verificar progreso del pedido con timeout
            const progresoRes = await fetch(`${getApiUrl()}/pedidos/progreso-pedido/${pedido._id}`, {
              signal: AbortSignal.timeout(5000) // 5 segundos timeout
            });
            if (!progresoRes.ok) return null;
            
            const progresoData = await progresoRes.json();
            console.log(`📊 Pedido ${pedido._id.slice(-4)}: progreso=${progresoData.progreso_general}%`);
            // Solo incluir pedidos al 100% - Backend ya calcula bien
            if (progresoData.progreso_general !== 100) {
              return null;
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
            // Ignorar errores de timeout o red
            if (err.name !== 'AbortError' && err.name !== 'TimeoutError') {
              // console.error(`Error al obtener progreso del pedido ${pedido._id}:`, err);
            }
            return null;
          }
        })
      );
      
      // Filtrar nulos (ya están ordenados por fecha)
      const pedidosParaFacturar = pedidosConProgreso.filter((p) => p !== null);
      
      console.log('📊 Total pedidos obtenidos:', pedidos.length);
      console.log('📊 Pedidos limitados:', pedidosLimitados.length);
      console.log('📊 Pedidos al 100%:', pedidosParaFacturar.length);
      
      setFacturacion(pedidosParaFacturar);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidosFacturacion();
  }, []);

  const handleFacturar = async (pedido: any) => {
    setSelectedPedido(pedido);
    setModalOpen(true);
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
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                  <img src="/logo.jpeg" alt="Logo" style="height: 60px; width: auto; object-fit: contain; margin-right: 1rem;" />
                  <div>
                    <div class="titulo">NOTA DE ENTREGA</div>
                  </div>
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
    <Card className="max-w-5xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-6 h-6" />
          Facturación
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-2"></span>
            <span className="text-blue-600 font-semibold">Cargando pedidos...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 font-semibold py-4">{error}</div>
        ) : facturacion.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <CheckCircle2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg font-medium">No hay pedidos listos para facturar</p>
            <p className="text-gray-500 text-sm mt-2">Los pedidos aparecerán aquí cuando estén al 100%</p>
          </div>
        ) : (
          <ul className="space-y-6">
            {facturacion.map((pedido: any) => (
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
    
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
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePrintNotaEntrega} className="bg-blue-600 hover:bg-blue-700">
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
