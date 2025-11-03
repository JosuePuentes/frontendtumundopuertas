import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { getApiUrl } from "@/lib/api";
import { 
  guardarFacturaConfirmada as apiGuardarFactura,
  getFacturasConfirmadas as apiGetFacturas,
  guardarPedidoCargadoInventario as apiGuardarPedidoInventario,
  getPedidosCargadosInventario as apiGetPedidosInventario
} from "@/lib/api";
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
  adicionales?: Array<{
    descripcion?: string;
    precio: number;
    cantidad?: number; // default 1
  }>;
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

const FacturacionPage: React.FC = () => {
  const [facturacion, setFacturacion] = useState<any[]>([]);
  const [facturasConfirmadas, setFacturasConfirmadas] = useState<FacturaConfirmada[]>([]);
  const [pedidosCargadosInventario, setPedidosCargadosInventario] = useState<PedidoCargadoInventario[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalAccion, setModalAccion] = useState<'facturar' | 'cargar_inventario'>('facturar');
  const [modalPreliminarOpen, setModalPreliminarOpen] = useState<boolean>(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [selectedFactura, setSelectedFactura] = useState<FacturaConfirmada | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [busquedaCliente, setBusquedaCliente] = useState<string>("");
  const [busquedaFacturas, setBusquedaFacturas] = useState<string>("");

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
        try {
        const res = await fetch(`${getApiUrl()}/pedidos/all/`);
        if (!res.ok) throw new Error("Error al obtener pedidos");
        pedidos = await res.json();
          console.log(`📊 Pedidos obtenidos de /pedidos/all/: ${pedidos.length}`);
          // Debug: Verificar adicionales en TODOS los pedidos
          console.log(`🔍 DEBUG PEDIDO ALL - Verificando adicionales en ${pedidos.length} pedidos:`);
          pedidos.forEach((pedido: any, idx: number) => {
            if (pedido.adicionales !== null && pedido.adicionales !== undefined) {
              console.log(`  📦 Pedido ${idx + 1} (${pedido._id?.slice(-8)}):`, {
                tieneAdicionales: 'adicionales' in pedido,
                adicionales: pedido.adicionales,
                tipoAdicionales: typeof pedido.adicionales,
                esArray: Array.isArray(pedido.adicionales),
                esNull: pedido.adicionales === null,
                esUndefined: pedido.adicionales === undefined,
                cantidad: Array.isArray(pedido.adicionales) ? pedido.adicionales.length : 'N/A'
              });
            }
          });
          // También verificar el primer pedido en detalle
          if (pedidos.length > 0) {
            const primerPedido = pedidos[0];
            console.log(`🔍 DEBUG PEDIDO ALL - Primer pedido detallado:`, {
              pedidoId: primerPedido._id?.slice(-8),
              tieneAdicionales: 'adicionales' in primerPedido,
              adicionales: primerPedido.adicionales,
              tipoAdicionales: typeof primerPedido.adicionales,
              esArray: Array.isArray(primerPedido.adicionales),
              keysPedido: Object.keys(primerPedido), // Ver todas las keys del pedido
              pedidoCompleto: primerPedido
            });
          }
          // IMPORTANTE: Verificar si el pedido específico está en esta lista
          const pedidoEspecificoEnAll = pedidos.find((p: any) => p._id === '69042b91a9a8ebdaf861c3f0');
          if (pedidoEspecificoEnAll) {
            console.log(`✅ Pedido específico encontrado en /pedidos/all/`);
          } else {
            console.warn(`⚠️ Pedido específico NO encontrado en /pedidos/all/ (puede estar limitado a 100 pedidos)`);
          }
        } catch (err: any) {
          console.error(`❌ Error al obtener todos los pedidos:`, err.message || err);
          throw err;
        }
      }
      
      // CRÍTICO: Buscar específicamente el pedido 69042b91a9a8ebdaf861c3f0 si no está en la lista
      const pedidoIdEspecifico = '69042b91a9a8ebdaf861c3f0';
      const pedidoEspecificoYaEsta = pedidos.find((p: any) => p._id === pedidoIdEspecifico);
      
      if (!pedidoEspecificoYaEsta) {
        try {
          console.log(`🔍 Buscando pedido específico ${pedidoIdEspecifico} que no está en la lista inicial...`);
          // CRÍTICO: Usar el endpoint correcto del backend /pedidos/id/{pedido_id}/
          const resEspecifico = await fetch(`${getApiUrl()}/pedidos/id/${pedidoIdEspecifico}/`);
          if (resEspecifico.ok) {
            const pedidoEspecifico = await resEspecifico.json();
            pedidos.push(pedidoEspecifico);
            console.log(`✅ Pedido específico ${pedidoIdEspecifico} encontrado y agregado a la lista`, {
              _id: pedidoEspecifico._id,
              cliente_id: pedidoEspecifico.cliente_id,
              estado_general: pedidoEspecifico.estado_general,
              fecha_creacion: pedidoEspecifico.fecha_creacion
            });
          } else {
            const errorText = await resEspecifico.text();
            console.warn(`⚠️ No se pudo obtener el pedido específico ${pedidoIdEspecifico}: ${resEspecifico.status} - ${errorText}`);
          }
        } catch (err: any) {
          console.error(`❌ Error al buscar pedido específico ${pedidoIdEspecifico}:`, err.message || err);
        }
      }
      
      // IMPORTANTE: Buscar pedidos que tengan todos los items con estado_item = 4 (terminados)
      // Para cliente especial "Tu Mundo Puerta": también incluir si todos los items están en estado_item >= 3 (preparar/terminado)
      // CRÍTICO: Para pedidos del cliente especial creados desde 2025-10-31 en adelante, SIEMPRE incluirlos si todos los items están en estado_item >= 0 (cualquier progreso)
      // Estos pedidos deben aparecer en facturación aunque no tengan estado_general = "orden4"
      const pedidosConItemsCompletados: any[] = [];
      const fechaCorte = new Date('2025-10-31T00:00:00.000Z'); // Fecha de corte: 31 de octubre de 2025
      
      for (const pedido of pedidos) {
        // Verificar si es el cliente especial "Tu Mundo Puerta"
        const rifCliente = String(pedido?.cliente_id || '').toUpperCase().replace(/\s+/g, '');
        const esClienteEspecial = rifCliente === 'J-507172554';
        const fechaCreacionPedido = pedido.fecha_creacion ? new Date(pedido.fecha_creacion) : null;
        const esPedidoNuevo = fechaCreacionPedido && fechaCreacionPedido >= fechaCorte;
        
        // Verificar si todos los items tienen estado_item = 4 (completados)
        const todosItemsTerminados = pedido.items?.every((item: any) => 
          item.estado_item === 4 || item.estado_item >= 4
        ) || false;
        
        // Para cliente especial, también incluir si todos los items están en preparar (3) o terminado (4)
        const todosItemsPrepararOCompletados = esClienteEspecial && 
          pedido.items?.every((item: any) => item.estado_item === 3 || item.estado_item === 4 || item.estado_item >= 3) || false;
        
        // CRÍTICO: Para pedidos del cliente especial desde 2025-10-31, incluir SIEMPRE si tienen items (incluso si están en estado_item >= 0)
        // Esto asegura que todos los pedidos de este cliente lleguen a facturación sin excepción
        const esPedidoClienteEspecialNuevo = esClienteEspecial && esPedidoNuevo;
        const tieneItems = pedido.items && pedido.items.length > 0;
        const todosItemsEnProgreso = esPedidoClienteEspecialNuevo && tieneItems && 
          pedido.items.every((item: any) => item.estado_item !== undefined && item.estado_item !== null);
        
        // Pedido específico que debe aparecer siempre: 69042b91a9a8ebdaf861c3f0
        const esPedidoEspecifico = pedido._id === pedidoIdEspecifico || pedido._id.includes('69042b91a9a8ebdaf861c3f0');
        
        // CRÍTICO: Para el pedido específico o pedidos del cliente especial nuevos, incluirlos SIEMPRE
        // sin importar su estado_item o estado_general
        const debeIncluirse = todosItemsTerminados || todosItemsPrepararOCompletados || todosItemsEnProgreso || esPedidoEspecifico || esPedidoClienteEspecialNuevo;
        
        if (debeIncluirse && !pedidosOrden4.find((p: any) => p._id === pedido._id)) {
          pedidosConItemsCompletados.push(pedido);
          if (esPedidoEspecifico) {
            console.log(`✅ Pedido ${pedido._id.slice(-4)} (PEDIDO ESPECÍFICO ${pedidoIdEspecifico.slice(-6)}): incluido para facturación sin excepción`, {
              _id: pedido._id,
              cliente_id: pedido.cliente_id,
              estado_general: pedido.estado_general,
              fecha_creacion: pedido.fecha_creacion,
              items: pedido.items?.map((i: any) => ({ estado_item: i.estado_item }))
            });
          } else if (esPedidoClienteEspecialNuevo) {
            console.log(`✅ Pedido ${pedido._id.slice(-4)} (CLIENTE ESPECIAL - NUEVO): incluido para facturación sin excepción`, {
              _id: pedido._id,
              cliente_id: pedido.cliente_id,
              estado_general: pedido.estado_general,
              fecha_creacion: pedido.fecha_creacion,
              items: pedido.items?.map((i: any) => ({ estado_item: i.estado_item }))
            });
          } else if (esClienteEspecial) {
            console.log(`✅ Pedido ${pedido._id.slice(-4)} (CLIENTE ESPECIAL): todos los items en preparar/terminado (estado_item >= 3)`);
          } else {
            console.log(`✅ Pedido ${pedido._id.slice(-4)}: todos los items terminados (estado_item = 4)`);
          }
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
            
            // Verificar si es el cliente especial "Tu Mundo Puerta"
            const rifCliente = String(pedido?.cliente_id || '').toUpperCase().replace(/\s+/g, '');
            const esClienteEspecial = rifCliente === 'J-507172554';
            const fechaCreacionPedido = pedido.fecha_creacion ? new Date(pedido.fecha_creacion) : null;
            const fechaCorte = new Date('2025-10-31T00:00:00.000Z'); // Fecha de corte: 31 de octubre de 2025
            const esPedidoNuevo = fechaCreacionPedido && fechaCreacionPedido >= fechaCorte;
            
            // Pedido específico que debe aparecer siempre
            const esPedidoEspecifico = pedido._id === pedidoIdEspecifico || pedido._id.includes('69042b91a9a8ebdaf861c3f0');
            
            // Incluir el pedido si:
            // 1. Tiene progreso >= 99.5% (considerado 100%), O
            // 2. Tiene estado_general = "orden4" (listo para facturación), O
            // 3. Todos los items tienen estado_item = 4 (completados), O
            // 4. Para cliente especial: si todos los items están en estado_item >= 3 (preparar/terminado), O
            // 5. Para pedidos del cliente especial desde 2025-10-31: incluir SIEMPRE, O
            // 6. Es el pedido específico 69042b91a9a8ebdaf861c3f0 (incluir SIEMPRE sin importar estado)
            const todosItemsCompletados = pedido.items?.every((item: any) => item.estado_item === 4 || item.estado_item >= 4) || false;
            
            // Para cliente especial, también incluir si todos los items están en preparar (3) o terminado (4)
            const todosItemsPrepararOCompletados = esClienteEspecial && 
              pedido.items?.every((item: any) => item.estado_item === 3 || item.estado_item === 4 || item.estado_item >= 3) || false;
            
            // CRÍTICO: Para pedidos del cliente especial desde 2025-10-31, incluir SIEMPRE
            const esPedidoClienteEspecialNuevo = esClienteEspecial && esPedidoNuevo;
            const tieneItems = pedido.items && pedido.items.length > 0;
            const todosItemsEnProgreso = esPedidoClienteEspecialNuevo && tieneItems && 
              pedido.items.every((item: any) => item.estado_item !== undefined && item.estado_item !== null);
            
            // CRÍTICO: El pedido específico o pedidos del cliente especial nuevos deben incluirse SIEMPRE
            // sin importar su progreso, estado_general o estado_item
            if (!progresoEs100 && pedido.estado_general !== "orden4" && !todosItemsCompletados && !todosItemsPrepararOCompletados && !todosItemsEnProgreso && !esPedidoEspecifico && !esPedidoClienteEspecialNuevo) {
              if (pedido._id.includes('61c3f0') || pedidoIdShort === '3f0' || esClienteEspecial) {
                console.log(`❌ PEDIDO ${pedidoIdShort} ${esClienteEspecial ? '(CLIENTE ESPECIAL)' : ''} EXCLUIDO:`, {
                  progresoEs100,
                  estado_general: pedido.estado_general,
                  todosItemsCompletados,
                  todosItemsPrepararOCompletados,
                  esClienteEspecial,
                  rifCliente,
                  items: pedido.items?.map((i: any) => ({ id: i.id?.slice(-4), estado_item: i.estado_item }))
                });
              }
              return null;
            }
            
            // Log especial para cliente "Tu Mundo Puerta" o pedido específico
            if (esClienteEspecial || esPedidoEspecifico) {
              console.log(`✅ PEDIDO ${esPedidoEspecifico ? 'ESPECÍFICO' : 'CLIENTE ESPECIAL'} ${pedidoIdShort} INCLUIDO:`, {
                progresoEs100,
                estado_general: pedido.estado_general,
                todosItemsCompletados,
                todosItemsPrepararOCompletados,
                todosItemsEnProgreso,
                esPedidoEspecifico,
                esPedidoClienteEspecialNuevo,
                items: pedido.items?.map((i: any) => ({ id: i.id?.slice(-4), estado_item: i.estado_item }))
              });
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
      
      // Filtrar pedidos que ya fueron facturados usando el ESTADO actualizado (no solo localStorage)
      // Combinar datos del estado con localStorage como fallback
      const facturasConfirmadasIds: string[] = [];
      
      // Función auxiliar para normalizar IDs (convertir a string y hacer trim)
      const normalizarId = (id: any): string => {
        if (!id) return '';
        return String(id).trim();
      };
      
      // Usar estado primero (más actualizado)
      if (facturasConfirmadas.length > 0) {
        facturasConfirmadasIds.push(...facturasConfirmadas.map(f => normalizarId(f.pedidoId)));
        console.log('✅ DEBUG FILTRADO: Facturas confirmadas desde estado:', facturasConfirmadas.length);
      }
      
      // SIEMPRE también revisar localStorage como respaldo
      const storedFacturas = localStorage.getItem('facturas_confirmadas');
      if (storedFacturas) {
        try {
          const facturas: FacturaConfirmada[] = JSON.parse(storedFacturas);
          facturas.forEach(f => {
            const idNormalizado = normalizarId(f.pedidoId);
            if (!facturasConfirmadasIds.includes(idNormalizado)) {
              facturasConfirmadasIds.push(idNormalizado);
            }
          });
          console.log('✅ DEBUG FILTRADO: Facturas confirmadas desde localStorage:', facturas.length);
        } catch (e) {
          console.error('Error al leer facturas confirmadas:', e);
        }
      }
      
      // Crear mapa de pedidos cargados al inventario usando el ESTADO actualizado
      const pedidosCargadosInventarioMap = new Map<string, PedidoCargadoInventario>();
      
      // Usar estado primero (más actualizado)
      if (pedidosCargadosInventario.length > 0) {
        pedidosCargadosInventario.forEach(p => {
          const idNormalizado = normalizarId(p.pedidoId);
          pedidosCargadosInventarioMap.set(idNormalizado, p);
        });
        console.log('✅ DEBUG FILTRADO: Pedidos cargados al inventario desde estado:', pedidosCargadosInventario.length);
      }
      
      // SIEMPRE también revisar localStorage como respaldo
      const storedPedidosInventario = localStorage.getItem('pedidos_cargados_inventario');
      if (storedPedidosInventario) {
        try {
          const pedidos: PedidoCargadoInventario[] = JSON.parse(storedPedidosInventario);
          pedidos.forEach(p => {
            const idNormalizado = normalizarId(p.pedidoId);
            if (!pedidosCargadosInventarioMap.has(idNormalizado)) {
              pedidosCargadosInventarioMap.set(idNormalizado, p);
            }
          });
          console.log('✅ DEBUG FILTRADO: Pedidos cargados al inventario desde localStorage:', pedidos.length);
        } catch (e) {
          console.error('Error al leer pedidos cargados al inventario:', e);
        }
      }
      
      // NO filtrar los pedidos cargados al inventario - mantenerlos en la lista pero marcarlos
      // Solo filtrar los que ya fueron facturados
      console.log('🔍 DEBUG FILTRADO: Facturas confirmadas IDs normalizados:', facturasConfirmadasIds);
      console.log('🔍 DEBUG FILTRADO: Total pedidos antes de filtrar:', pedidosParaFacturar.length);
      const pedidosPendientes = pedidosParaFacturar
        .filter(p => {
          const pedidoIdNormalizado = normalizarId(p._id);
          const yaFacturado = facturasConfirmadasIds.includes(pedidoIdNormalizado);
          if (yaFacturado) {
            console.log(`🚫 DEBUG FILTRADO: Pedido ${pedidoIdNormalizado} ya fue facturado, se excluye de pendientes`);
          }
          return !yaFacturado;
        })
        .map(p => {
          // Si el pedido fue cargado al inventario, agregar las propiedades
          const pedidoIdNormalizado = normalizarId(p._id);
          const pedidoCargado = pedidosCargadosInventarioMap.get(pedidoIdNormalizado);
          if (pedidoCargado) {
            return {
              ...p,
              yaCargadoInventario: true,
              fechaCargaInventario: pedidoCargado.fechaCargaInventario
            };
          }
          return p;
        });
      
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

  // Cargar facturas confirmadas y pedidos cargados al inventario (localStorage primero para carga inmediata, luego backend)
  useEffect(() => {
    const cargarDatos = async () => {
      // 1. Cargar PRIMERO desde localStorage para mostrar datos inmediatamente
      const storedFacturas = localStorage.getItem('facturas_confirmadas');
      if (storedFacturas) {
        try {
          const facturasLocal = JSON.parse(storedFacturas);
          if (Array.isArray(facturasLocal) && facturasLocal.length > 0) {
            // Normalizar también las facturas del localStorage
            // Nota: En esta carga inicial no tenemos los pedidos completos aún, 
            // pero los normalizaremos cuando llegue la respuesta del backend
            const facturasLocalNormalizadas = facturasLocal.map((f: any) => ({
              id: f.id || f._id || `factura-${Date.now()}-${Math.random()}`,
              numeroFactura: f.numeroFactura || f.numero_factura || 'Sin número',
              pedidoId: f.pedidoId || f.pedido_id || f._id || '',
              clienteNombre: f.clienteNombre || f.cliente_nombre || 'Sin nombre',
              clienteId: f.clienteId || f.cliente_id || '',
              montoTotal: typeof f.montoTotal === 'number' && f.montoTotal > 0 ? f.montoTotal : 
                         (typeof f.monto_total === 'number' && f.monto_total > 0 ? f.monto_total : 0),
              fechaCreacion: f.fechaCreacion || f.fecha_creacion || new Date().toISOString(),
              fechaFacturacion: f.fechaFacturacion || f.fecha_facturacion || f.createdAt || new Date().toISOString(),
              items: f.items || []
            }));
            setFacturasConfirmadas(facturasLocalNormalizadas);
            console.log('📦 Facturas confirmadas cargadas desde localStorage (inicial):', facturasLocalNormalizadas.length);
          }
        } catch (e) {
          console.error('Error parseando facturas de localStorage:', e);
        }
      }
      
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
        const facturasBackend = await apiGetFacturas();
        if (facturasBackend && Array.isArray(facturasBackend)) {
          // SIEMPRE usar datos del backend si están disponibles (aunque esté vacío)
          // Esto asegura que los datos en la UI coincidan con lo que está en la BD
          console.log('📥 Facturas recibidas del backend:', facturasBackend.length);
          console.log('📥 Ejemplo de factura cruda del backend:', facturasBackend[0]);
          
          // Intentar obtener los pedidos completos para completar datos faltantes
          let pedidosCompletos: any[] = [];
          try {
            const res = await fetch(`${getApiUrl()}/pedidos/all/`);
            if (res.ok) {
              pedidosCompletos = await res.json();
              console.log('📦 Pedidos completos obtenidos para complementar facturas:', pedidosCompletos.length);
            }
          } catch (e) {
            console.warn('⚠️ No se pudieron obtener pedidos completos:', e);
          }
          
          // Normalizar las facturas del backend para asegurar que tengan todos los campos necesarios
          const facturasNormalizadas = facturasBackend.map((f: any) => {
            // Buscar el pedido completo correspondiente si falta información
            const pedidoCompleto = pedidosCompletos.find((p: any) => 
              (f.pedidoId && p._id === f.pedidoId) || 
              (f.pedido_id && p._id === f.pedido_id) ||
              (f._id && p._id === f._id)
            );
            
            // Extraer datos del pedido completo si existe
            const clienteNombrePedido = pedidoCompleto?.cliente_nombre || pedidoCompleto?.clienteNombre;
            const clienteIdPedido = pedidoCompleto?.cliente_id || pedidoCompleto?.clienteId;
            const montoTotalPedido = pedidoCompleto?.montoTotal || 
              (pedidoCompleto?.items?.reduce((acc: number, item: any) => 
                acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0);
            
            return {
              id: f.id || f._id || `factura-${Date.now()}-${Math.random()}`,
              numeroFactura: f.numeroFactura || f.numero_factura || 'Sin número',
              pedidoId: f.pedidoId || f.pedido_id || f._id || pedidoCompleto?._id || '',
              clienteNombre: f.clienteNombre || f.cliente_nombre || clienteNombrePedido || 'Sin nombre',
              clienteId: f.clienteId || f.cliente_id || clienteIdPedido || '',
              montoTotal: typeof f.montoTotal === 'number' && f.montoTotal > 0 ? f.montoTotal : 
                         (typeof f.monto_total === 'number' && f.monto_total > 0 ? f.monto_total : 
                         (montoTotalPedido > 0 ? montoTotalPedido : 0)),
              fechaCreacion: f.fechaCreacion || f.fecha_creacion || pedidoCompleto?.fecha_creacion || new Date().toISOString(),
              fechaFacturacion: f.fechaFacturacion || f.fecha_facturacion || f.createdAt || new Date().toISOString(),
              items: f.items || pedidoCompleto?.items || []
            };
          });
          
          console.log('📥 Detalle de facturas normalizadas:', facturasNormalizadas.map((f: any) => ({
            id: f.id,
            pedidoId: f.pedidoId,
            numeroFactura: f.numeroFactura,
            clienteNombre: f.clienteNombre,
            fechaFacturacion: f.fechaFacturacion,
            montoTotal: f.montoTotal
          })));
          
          setFacturasConfirmadas(facturasNormalizadas);
          localStorage.setItem('facturas_confirmadas', JSON.stringify(facturasNormalizadas));
          
          if (facturasBackend.length > 0) {
            console.log('✅ Facturas confirmadas sincronizadas desde BD:', facturasBackend.length);
          } else {
            console.log('📭 BD está vacía para facturas (se sincronizó correctamente)');
          }
        } else {
          console.warn('⚠️ Respuesta del backend no es un array válido:', facturasBackend);
        }
      } catch (error) {
        console.error('❌ Error al cargar facturas desde BD:', error);
        console.warn('⚠️ Usando datos de localStorage como fallback');
        // Si falla el backend, mantener datos de localStorage
      }
      
      try {
        const pedidosBackend = await apiGetPedidosInventario();
        if (pedidosBackend && Array.isArray(pedidosBackend)) {
          // SIEMPRE usar datos del backend si están disponibles (aunque esté vacío)
          // Esto asegura que los datos en la UI coincidan con lo que está en la BD
          console.log('📥 Pedidos recibidos del backend:', pedidosBackend.length);
          console.log('📥 Detalle de pedidos:', pedidosBackend.map((p: any) => ({
            id: p.id || p._id,
            pedidoId: p.pedidoId,
            fechaCargaInventario: p.fechaCargaInventario
          })));
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
        // Si falla el backend, mantener datos de localStorage
      }
    };
    
    cargarDatos();
  }, []);

  // Refetch pedidos cuando cambien las facturas confirmadas o pedidos cargados
  // para asegurar que el filtrado esté actualizado
  useEffect(() => {
    fetchPedidosFacturacion();
  }, [facturasConfirmadas, pedidosCargadosInventario]);

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

  // Filtrar facturas procesadas por búsqueda
  const facturasFiltradas = useMemo(() => {
    if (!busquedaFacturas.trim()) {
      return facturasConfirmadas;
    }
    const busquedaLower = busquedaFacturas.toLowerCase().trim();
    return facturasConfirmadas.filter((factura) => {
      const nombreCliente = (factura.clienteNombre || '').toLowerCase();
      const clienteId = (factura.clienteId || '').toLowerCase();
      const numeroFactura = (factura.numeroFactura || '').toLowerCase();
      const pedidoId = (factura.pedidoId || '').toLowerCase();
      return nombreCliente.includes(busquedaLower) || 
             clienteId.includes(busquedaLower) || 
             numeroFactura.includes(busquedaLower) ||
             pedidoId.includes(busquedaLower);
    });
  }, [facturasConfirmadas, busquedaFacturas]);

  // Generar número de factura único
  const generarNumeroFactura = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `F-${year}${month}${day}-${timestamp}`;
  };

  // Guardar factura confirmada (backend PRIMERO para persistencia, luego localStorage como backup)
  const guardarFacturaConfirmada = async (factura: FacturaConfirmada) => {
    // IMPORTANTE: Intentar guardar en el backend PRIMERO para asegurar persistencia en BD
    try {
      await apiGuardarFactura(factura);
      console.log('✅ Factura guardada en BD (backend):', factura.numeroFactura);
    } catch (error) {
      console.error('❌ Error al guardar factura en BD:', error);
      // Continuar con localStorage como backup, pero alertar al usuario
      alert('⚠️ No se pudo guardar la factura en la base de datos. Se guardó localmente. Por favor, verifica la conexión.');
    }
    
    // Actualizar estado y localStorage (siempre se hace, incluso si falla el backend)
    const nuevasFacturas = [...facturasConfirmadas];
    
    // Verificar si ya existe para evitar duplicados
    const existe = nuevasFacturas.some((f: FacturaConfirmada) => f.pedidoId === factura.pedidoId);
    if (!existe) {
      nuevasFacturas.push(factura);
    } else {
      // Si existe, actualizar en lugar de agregar
      const index = nuevasFacturas.findIndex((f: FacturaConfirmada) => f.pedidoId === factura.pedidoId);
      if (index !== -1) {
        nuevasFacturas[index] = factura;
      }
    }
    
    setFacturasConfirmadas(nuevasFacturas);
    localStorage.setItem('facturas_confirmadas', JSON.stringify(nuevasFacturas));
  };

  // Guardar pedido cargado al inventario (backend PRIMERO para persistencia, luego localStorage como backup)
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

  const handleFacturar = async (pedido: any) => {
    // Asegurar que montoTotal siempre tenga un valor válido antes de establecerlo
    if (!pedido.montoTotal && pedido.montoTotal !== 0) {
      pedido.montoTotal = pedido.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0;
    }
    setSelectedPedido(pedido);
    setModalAccion('facturar');
    setModalOpen(true);
  };

  const esClienteCargaInventario = (pedido: any) => {
    const rif = String(pedido?.cliente_id || '').toUpperCase().replace(/\s+/g, '');
    return rif === 'J-507172554';
  };

  const handleCargarInventario = async (pedido: any) => {
    // Si el pedido viene en formato PedidoCargadoInventario, convertirlo al formato esperado
    let pedidoFormateado = pedido;
    if (pedido.pedidoId && !pedido._id) {
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
        console.log('📦 DEBUG CARGAR EXISTENCIAS: Items del pedido:', selectedPedido.items.map((item: any, index: number) => ({
          index,
          codigo: item.codigo,
          codigoNormalizado: item.codigo ? String(item.codigo).trim() : null,
          nombre: item.nombre || item.descripcion,
          cantidad: item.cantidad,
          precio: item.precio
        })));
        
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
        console.log('📤 DEBUG CARGAR EXISTENCIAS: URL:', `${getApiUrl()}/inventario/cargar-existencias-desde-pedido`);
        console.log('📤 DEBUG CARGAR EXISTENCIAS: Headers:', {
          'Content-Type': headers['Content-Type'],
          'Authorization': headers['Authorization'] ? 'Bearer [TOKEN_PRESENTE]' : '[NO_TOKEN]'
        });
        
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
        
        // Log detallado de las cantidades que se están agregando
        console.log('📊 Cantidades que se agregaron al inventario por item:');
        selectedPedido.items.forEach((item: any) => {
          console.log(`  - ${item.codigo || 'Sin código'}: ${item.cantidad || 0} unidades`);
        });
        
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
        // para que el componente se re-renderice inmediatamente con el botón actualizado
        
        // 1. Actualizar el estado de pedidosCargadosInventario PRIMERO (usando función para evitar problemas de closure)
        setPedidosCargadosInventario(prev => {
          // Verificar si ya existe para evitar duplicados
          const existe = prev.some((p: PedidoCargadoInventario) => p.pedidoId === pedidoCargado.pedidoId);
          const nuevoEstado = existe
            ? prev.map((p: PedidoCargadoInventario) => {
                if (p.pedidoId === pedidoCargado.pedidoId) {
                  // Actualizar el pedido existente con la nueva información de carga
                  return {
                    ...p,
                    fechaCargaInventario: pedidoCargado.fechaCargaInventario,
                    // Preservar otros campos del pedido original
                  };
                }
                return p;
              })
            : [...prev, pedidoCargado];
          
          const pedidoActualizado = nuevoEstado.find(p => p.pedidoId === pedidoCargado.pedidoId);
          console.log('📦 DEBUG CARGAR EXISTENCIAS: Estado pedidosCargadosInventario actualizado. Total:', nuevoEstado.length);
          console.log('📦 DEBUG CARGAR EXISTENCIAS: Pedido guardado en nuevo estado:', pedidoActualizado ? 'SÍ' : 'NO');
          console.log('📦 DEBUG CARGAR EXISTENCIAS: Pedido actualizado - fechaCargaInventario:', pedidoActualizado?.fechaCargaInventario);
          return nuevoEstado;
        });
        
        // 2. Marcar el pedido como cargado en el estado facturacion (si está en la lista)
        const fechaCargaISO = new Date().toISOString();
        setFacturacion(prev => {
          const pedidoEncontrado = prev.find(p => p._id === selectedPedido._id);
          console.log('🔍 DEBUG CARGAR EXISTENCIAS: Buscando pedido en facturacion:', selectedPedido._id, 'Encontrado:', !!pedidoEncontrado);
          
          if (pedidoEncontrado) {
            const actualizado = prev.map(p => 
              p._id === selectedPedido._id 
                ? { ...p, yaCargadoInventario: true, fechaCargaInventario: fechaCargaISO }
                : p
            );
            console.log('🔄 DEBUG CARGAR EXISTENCIAS: Estado facturacion actualizado. Pedido marcado como cargado:', 
              actualizado.find(p => p._id === selectedPedido._id)?.yaCargadoInventario);
            return actualizado;
          } else {
            console.log('⚠️ DEBUG CARGAR EXISTENCIAS: Pedido no encontrado en estado facturacion. Puede estar en otra lista.');
            // El pedido puede estar en pedidosTuMundoPuerta, no en facturacion
            return prev;
          }
        });
        
        // 3. Forzar un delay para asegurar que React procese los cambios de estado ANTES de cerrar el modal
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // 4. Cerrar el modal y resetear el estado DESPUÉS de que React procese los cambios
        setModalOpen(false);
        setConfirming(false);
        setSelectedPedido(null); // Limpiar el pedido seleccionado para forzar re-render
        
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
        
        // Verificar que el estado se actualizó correctamente después de un breve delay
        setTimeout(() => {
          console.log('✅ DEBUG CARGAR EXISTENCIAS: Verificación final del estado (después de delay)');
          // Leer desde localStorage para verificar
          const storedPedidos = localStorage.getItem('pedidos_cargados_inventario');
          if (storedPedidos) {
            const pedidos: PedidoCargadoInventario[] = JSON.parse(storedPedidos);
            const pedidoEnStorage = pedidos.find((p: PedidoCargadoInventario) => p.pedidoId === selectedPedido._id);
            console.log('✅ DEBUG CARGAR EXISTENCIAS: Pedido en localStorage:', pedidoEnStorage ? 'ENCONTRADO' : 'NO ENCONTRADO');
            if (pedidoEnStorage) {
              console.log('✅ DEBUG CARGAR EXISTENCIAS: Detalles del pedido guardado:', {
                pedidoId: pedidoEnStorage.pedidoId,
                fechaCargaInventario: pedidoEnStorage.fechaCargaInventario
              });
            }
          }
        }, 500);
      } else {
        // Flujo normal de facturación
        const numeroFactura = generarNumeroFactura();
        // IMPORTANTE: El backend envía adicionales con estructura: { descripcion?, precio, cantidad? }
        // El montoTotal del backend YA incluye los adicionales
        // Normalizar adicionales: puede ser null, undefined, o array vacío desde el backend
        const adicionalesNormalizados = (selectedPedido.adicionales && Array.isArray(selectedPedido.adicionales)) ? selectedPedido.adicionales : [];
        
        // Calcular monto de items (solo para mostrar, no para el total)
        const montoItems = selectedPedido.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0;
        // Calcular monto de adicionales (precio * cantidad, default cantidad = 1)
        const montoAdicionales = adicionalesNormalizados.reduce((acc: number, ad: any) => {
          const cantidad = ad.cantidad || 1;
          const precio = ad.precio || 0;
          return acc + (precio * cantidad);
        }, 0);
        
        // CRÍTICO: Usar montoTotal del backend (ya incluye adicionales)
        // Si no existe, calcular como fallback
        const montoTotalCalculado = selectedPedido.montoTotal || (montoItems + montoAdicionales);
        
        console.log('💰 DEBUG FACTURACIÓN - Cálculo de total:', {
          pedidoId: selectedPedido._id,
          montoItems,
          montoAdicionales,
          adicionalesCount: adicionalesNormalizados.length,
          adicionalesRaw: selectedPedido.adicionales, // Para debug: ver qué viene del backend
          montoTotalBackend: selectedPedido.montoTotal,
          montoTotalCalculado,
          diferencia: selectedPedido.montoTotal ? (montoTotalCalculado - selectedPedido.montoTotal) : 0
        });
        const facturaConfirmada: FacturaConfirmada = {
          id: selectedPedido._id + '-' + Date.now(),
          numeroFactura: numeroFactura,
          pedidoId: selectedPedido._id,
          clienteNombre: selectedPedido.cliente_nombre || selectedPedido.cliente_id || 'N/A',
          clienteId: selectedPedido.cliente_id || '',
          montoTotal: montoTotalCalculado,
          fechaCreacion: selectedPedido.fecha_creacion || new Date().toISOString(),
          fechaFacturacion: new Date().toISOString(),
          items: selectedPedido.items || [],
          adicionales: adicionalesNormalizados.length > 0 ? adicionalesNormalizados : undefined
        };
        
        // IMPORTANTE: Actualizar TODOS los estados ANTES de cerrar el modal
        // para que la factura aparezca inmediatamente en "Facturas Procesadas"
        
        // 1. Guardar la factura confirmada (actualiza estado, backend y localStorage)
        await guardarFacturaConfirmada(facturaConfirmada);
        console.log('💾 DEBUG FACTURACIÓN: Factura guardada:', facturaConfirmada.numeroFactura);
        
        // 2. Remover el pedido de la lista de pendientes inmediatamente
        setFacturacion(prev => {
          const actualizado = prev.filter(p => p._id !== selectedPedido._id);
          console.log('🔄 DEBUG FACTURACIÓN: Pedido removido de facturacion. Total restante:', actualizado.length);
          return actualizado;
        });
        
        // 3. Cerrar el modal y resetear el estado DESPUÉS de actualizar los estados
        setModalOpen(false);
        setConfirming(false);
        setSelectedPedido(null); // Limpiar el pedido seleccionado para forzar re-render
        
        // 4. Forzar un pequeño delay para asegurar que React procese los cambios de estado
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 5. Mostrar mensaje de éxito
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
                    ${Array.isArray(selectedFactura.adicionales) && selectedFactura.adicionales.length > 0 ? `
                      <tr style="background: #fef3c7;">
                        <td colspan="4" style="text-align:right; font-weight: bold;">Subtotal Items:</td>
                        <td style="text-align:right;">$${(selectedFactura.items.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0)).toFixed(2)}</td>
                      </tr>
                      ${selectedFactura.adicionales.map((ad: any) => {
                        const cantidad = ad.cantidad || 1;
                        const precio = ad.precio || 0;
                        const montoAdicional = precio * cantidad;
                        return `
                        <tr style="background: #fef3c7;">
                          <td colspan="4" style="text-align:right;">+ ${ad.descripcion || 'Adicional'}:</td>
                          <td style="text-align:right;">${cantidad > 1 ? `(x${cantidad}) ` : ''}$${montoAdicional.toFixed(2)}</td>
                        </tr>
                      `;
                      }).join('')}
                    ` : ''}
                    <tr class="totales-row">
                      <td colspan="3" style="text-align:right;">Total:</td>
                      <td style="text-align:center;">${selectedFactura.items.reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0)}</td>
                      <td style="text-align:right;">$${(selectedFactura.montoTotal || 0).toFixed(2)}</td>
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
                    ${Array.isArray(selectedPedido.adicionales) && selectedPedido.adicionales.length > 0 ? `
                      <tr style="background: #fef3c7;">
                        <td colspan="4" style="text-align:right; font-weight: bold;">Subtotal Items:</td>
                        <td style="text-align:right;">$${(selectedPedido.items.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0)).toFixed(2)}</td>
                      </tr>
                      ${selectedPedido.adicionales.map((ad: any) => {
                        const cantidad = ad.cantidad || 1;
                        const precio = ad.precio || 0;
                        const montoAdicional = precio * cantidad;
                        return `
                        <tr style="background: #fef3c7;">
                          <td colspan="4" style="text-align:right;">+ ${ad.descripcion || 'Adicional'}:</td>
                          <td style="text-align:right;">${cantidad > 1 ? `(x${cantidad}) ` : ''}$${montoAdicional.toFixed(2)}</td>
                        </tr>
                      `;
                      }).join('')}
                    ` : ''}
                    <tr class="totales-row">
                      <td colspan="3" style="text-align:right;">Total:</td>
                      <td style="text-align:center;">${selectedPedido.items.reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0)}</td>
                      <td style="text-align:right;">$${(selectedPedido.montoTotal || 0).toFixed(2)}</td>
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
    <div className="w-full max-w-[2000px] mx-auto mt-4 md:mt-8 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6 items-start">
      {/* Sección: Pendientes de Facturar */}
      <Card className="flex flex-col h-full max-h-[90vh]">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="whitespace-nowrap">Pendientes de Facturar</span>
            </CardTitle>
            <Button
              onClick={() => fetchPedidosFacturacion()}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 w-full sm:w-auto shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-xs">Actualizar</span>
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
        <CardContent className="flex-1 overflow-auto">
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
          <ul className="space-y-3">
            {facturacionFiltrada.map((pedido: any) => (
              <li key={pedido._id} className="border-2 border-blue-300 rounded-xl bg-gradient-to-br from-white to-blue-50 shadow-lg p-3 sm:p-4 transition-all duration-300 hover:shadow-xl">
                <div className="flex flex-wrap items-center justify-between mb-3 pb-3 border-b-2 border-blue-200">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Badge className="bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 text-sm sm:text-base font-bold">
                      #{pedido._id.slice(-6)}
                    </Badge>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 line-clamp-1">{pedido.cliente_nombre || pedido.cliente_id}</h3>
                      <p className="text-xs text-gray-600">Cliente</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-green-600 mb-1" />
                    <Badge className="bg-green-500 text-white px-2 py-0.5 text-xs sm:text-sm rounded-full">✓ 100%</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
                  <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600 font-semibold">📅 Fecha</p>
                    <p className="text-sm sm:text-base font-bold text-blue-700">
                      {pedido.fecha_creacion ? new Date(pedido.fecha_creacion).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600 font-semibold">✓ Completado</p>
                    <p className="text-sm sm:text-base font-bold text-green-700">
                      {pedido.fecha100Porciento ? new Date(pedido.fecha100Porciento).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {(() => {
                  // IMPORTANTE: El backend envía adicionales con estructura: { descripcion?, precio, cantidad? }
                  // Normalizar adicionales: puede ser null, undefined, o array vacío desde el backend
                  const adicionalesRaw = pedido.adicionales;
                  const adicionalesNormalizados = (adicionalesRaw && Array.isArray(adicionalesRaw)) ? adicionalesRaw : [];
                  
                  // Calcular monto de items
                  const montoItems = pedido.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0;
                  // Calcular monto de adicionales (precio * cantidad, default cantidad = 1)
                  const montoAdicionales = adicionalesNormalizados.reduce((acc: number, ad: any) => {
                    const cantidad = ad.cantidad || 1;
                    const precio = ad.precio || 0;
                    return acc + (precio * cantidad);
                  }, 0);
                  
                  // CRÍTICO: Calcular total como Items + Adicionales (suma manual)
                  const totalConAdicionales = montoItems + montoAdicionales;
                  
                  // Debug: Log para verificar estructura de adicionales y el pedido completo
                  console.log(`🔍 DEBUG TARJETA PEDIDO ${pedido._id?.slice(-8)}:`, {
                    adicionalesRaw,
                    tipoAdicionalesRaw: typeof adicionalesRaw,
                    esNull: adicionalesRaw === null,
                    esUndefined: adicionalesRaw === undefined,
                    esArray: Array.isArray(adicionalesRaw),
                    adicionalesNormalizados,
                    cantidadNormalizados: adicionalesNormalizados.length,
                    montoItems,
                    montoAdicionales,
                    totalConAdicionales,
                    montoTotalBackend: pedido.montoTotal,
                    // Incluir el pedido completo para debug completo
                    pedidoCompletoKeys: Object.keys(pedido),
                    tieneAdicionalesEnPedido: 'adicionales' in pedido,
                    pedidoCompleto: pedido
                  });
                  
                  return (
                    <>
                      {/* Mostrar desglose: Subtotal Items, Adicional, Total */}
                      <div className="mb-3 space-y-2">
                        {/* Subtotal Items - SIEMPRE visible */}
                        <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200">
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-600 font-semibold">Subtotal:</p>
                            <p className="text-sm sm:text-base font-bold text-blue-700">${montoItems.toFixed(2)}</p>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">Total $ de los items</p>
                        </div>
                        
                        {/* Adicionales - Mostrar SIEMPRE, incluso si está vacío para que el usuario vea que no hay */}
                        {adicionalesNormalizados.length > 0 ? (
                          adicionalesNormalizados.map((adicional: any, idx: number) => {
                            const cantidad = adicional.cantidad || 1;
                            const precio = adicional.precio || 0;
                            const montoAdicional = precio * cantidad;
                            
                            return (
                              <div key={idx} className="bg-yellow-50 p-2 sm:p-3 rounded-lg border-2 border-yellow-200">
                                <div className="flex justify-between items-center">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-600 font-semibold">Adicional:</p>
                                    <p className="text-xs sm:text-sm text-yellow-800 font-medium mt-1">
                                      {adicional.descripcion || 'Sin descripción'}
                                      {cantidad > 1 && <span className="text-yellow-600 ml-1">(x{cantidad})</span>}
                                    </p>
                                  </div>
                                  <div className="text-right ml-2">
                                    <p className="text-sm sm:text-base font-bold text-yellow-700">+${montoAdicional.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="bg-gray-100 p-2 sm:p-3 rounded-lg border border-gray-300">
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-500 font-medium">Adicional:</p>
                              <p className="text-xs text-gray-500">$0.00</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Total - SIEMPRE visible */}
                        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-2 border-gray-300">
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" /> Total
                            </p>
                            <p className="text-lg sm:text-xl font-bold text-gray-800">${totalConAdicionales.toFixed(2)}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Total items + adicional</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div className="bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200">
                          <p className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" /> Abonado
                          </p>
                          <p className="text-lg sm:text-xl font-bold text-green-700">${(pedido.montoAbonado || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200">
                          <p className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" /> Saldo Pendiente
                          </p>
                          <p className="text-lg sm:text-xl font-bold text-blue-700">${(totalConAdicionales - (pedido.montoAbonado || 0)).toFixed(2)}</p>
                        </div>
                      </div>

                      {pedido.items && pedido.items.length > 0 && (
                        <div className="mb-3">
                          <h4 className="font-bold text-sm sm:text-base text-gray-800 mb-2">📦 Items</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {pedido.items.map((item: any, idx: number) => (
                              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 hover:border-blue-400 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm sm:text-base text-gray-800 line-clamp-2">{item.nombre || item.descripcion}</p>
                                    <p className="text-xs text-gray-600">Cant: {item.cantidad}</p>
                                    {item.detalleitem && (
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.detalleitem}</p>
                                    )}
                                  </div>
                                  <span className="text-base sm:text-lg font-bold text-green-700 whitespace-nowrap ml-2">
                                    ${((item.precio || 0) * (item.cantidad || 0)).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className="mt-3 pt-3 border-t-2 border-gray-200">
                  {esClienteCargaInventario(pedido) ? (
                    (() => {
                      // Función auxiliar para normalizar IDs (misma que en fetchPedidosFacturacion)
                      const normalizarId = (id: any): string => {
                        if (!id) return '';
                        return String(id).trim();
                      };
                      
                      // Verificar si el pedido ya fue cargado al inventario
                      // Verificar en localStorage primero, luego en el estado del pedido
                      const pedidoIdNormalizado = normalizarId(pedido._id);
                      const yaCargadoEnEstado = pedido.yaCargadoInventario || false;
                      const yaCargadoEnStorage = pedidosCargadosInventario.some((p: PedidoCargadoInventario) => 
                        normalizarId(p.pedidoId) === pedidoIdNormalizado
                      );
                      const yaCargado = yaCargadoEnEstado || yaCargadoEnStorage;
                      
                      // Debug log para verificar el estado del botón
                      if (pedido._id === '690468cb6b45aa49d857a0e6' || pedido._id?.includes('690468cb6b45aa49d857a0e6')) {
                        console.log('🔍 DEBUG BOTÓN - Pedido:', pedido._id, {
                          pedidoIdNormalizado,
                          yaCargadoEnEstado,
                          yaCargadoEnStorage,
                          yaCargado,
                          pedidosCargadosInventarioLength: pedidosCargadosInventario.length,
                          pedidoEnLista: pedidosCargadosInventario.find(p => normalizarId(p.pedidoId) === pedidoIdNormalizado)
                        });
                      }
                      
                      const fechaCarga = pedido.fechaCargaInventario 
                        || (yaCargadoEnStorage 
                          ? pedidosCargadosInventario.find((p: PedidoCargadoInventario) => normalizarId(p.pedidoId) === pedidoIdNormalizado)?.fechaCargaInventario 
                          : null);
                      
                      if (yaCargado) {
                        return (
                          <Button
                            disabled={true}
                            className="w-full py-3 text-xs sm:text-sm font-bold whitespace-normal break-words bg-green-500 text-white cursor-not-allowed"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            <span className="text-center leading-tight">
                              ✓ CANTIDADES CARGADAS AL INVENTARIO
                              {fechaCarga && (
                                <span className="block text-xs mt-1 opacity-90">
                                  {new Date(fechaCarga).toLocaleDateString()}
                                </span>
                              )}
                            </span>
                            </div>
                          </Button>
                        );
                      }
                      
                      return (
                        <Button
                          onClick={() => handleCargarInventario(pedido)}
                          disabled={!pedido.puedeFacturar}
                          className={`w-full py-3 text-xs sm:text-sm font-bold whitespace-normal break-words ${
                            pedido.puedeFacturar
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Receipt className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            <span className="text-center leading-tight">
                              {(() => {
                                // Calcular el total incluyendo adicionales (mismo cálculo que Saldo Pendiente)
                                const adicionalesRawBtn = pedido.adicionales;
                                const adicionalesNormalizadosBtn = (adicionalesRawBtn && Array.isArray(adicionalesRawBtn)) ? adicionalesRawBtn : [];
                                const montoItemsBtn = pedido.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0;
                                const montoAdicionalesBtn = adicionalesNormalizadosBtn.reduce((acc: number, ad: any) => {
                                  const cantidad = ad.cantidad || 1;
                                  const precio = ad.precio || 0;
                                  return acc + (precio * cantidad);
                                }, 0);
                                const totalConAdicionalesBtn = montoItemsBtn + montoAdicionalesBtn;
                                const saldoPendienteBtn = totalConAdicionalesBtn - (pedido.montoAbonado || 0);
                                return pedido.puedeFacturar ? '✓ LISTO PARA CARGAR EXISTENCIAS AL INVENTARIO' : `⚠️ Pendiente pago ($${saldoPendienteBtn.toFixed(2)})`;
                              })()}
                            </span>
                          </div>
                        </Button>
                      );
                    })()
                  ) : (
                  <Button
                    onClick={() => handleFacturar(pedido)}
                    disabled={!pedido.puedeFacturar}
                    className={`w-full py-3 text-xs sm:text-sm font-bold whitespace-normal break-words ${
                      pedido.puedeFacturar
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Receipt className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="text-center leading-tight">
                        {(() => {
                          // Calcular el total incluyendo adicionales (mismo cálculo que Saldo Pendiente)
                          const adicionalesRawBtn = pedido.adicionales;
                          const adicionalesNormalizadosBtn = (adicionalesRawBtn && Array.isArray(adicionalesRawBtn)) ? adicionalesRawBtn : [];
                          const montoItemsBtn = pedido.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0;
                          const montoAdicionalesBtn = adicionalesNormalizadosBtn.reduce((acc: number, ad: any) => {
                            const cantidad = ad.cantidad || 1;
                            const precio = ad.precio || 0;
                            return acc + (precio * cantidad);
                          }, 0);
                          const totalConAdicionalesBtn = montoItemsBtn + montoAdicionalesBtn;
                          const saldoPendienteBtn = totalConAdicionalesBtn - (pedido.montoAbonado || 0);
                          return pedido.puedeFacturar ? '✓ LISTO PARA FACTURAR' : `⚠️ Pendiente pago ($${saldoPendienteBtn.toFixed(2)})`;
                        })()}
                      </span>
                    </div>
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
      <Card className="flex flex-col h-full max-h-[90vh]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 mb-3 text-base sm:text-lg lg:text-xl">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
            <span className="whitespace-nowrap">Facturas Procesadas</span>
          </CardTitle>
          {/* Buscador en tiempo real por nombre de cliente, factura o pedido */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por cliente, factura o pedido..."
              value={busquedaFacturas}
              onChange={(e) => setBusquedaFacturas(e.target.value)}
              className="pl-10 w-full"
            />
            {busquedaFacturas && (
              <div className="mt-2 text-sm text-gray-600">
                Mostrando {facturasFiltradas.length} de {facturasConfirmadas.length} facturas
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {facturasFiltradas.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg font-medium">
                {busquedaFacturas ? 'No se encontraron facturas con esa búsqueda' : 'No hay facturas procesadas'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {busquedaFacturas ? 'Intenta con otro término o limpia la búsqueda' : 'Las facturas confirmadas aparecerán aquí'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {facturasFiltradas.map((factura) => {
                // Validar y formatear fecha
                let fechaFormateada = 'N/A';
                if (factura.fechaFacturacion) {
                  try {
                    const fecha = new Date(factura.fechaFacturacion);
                    if (!isNaN(fecha.getTime())) {
                      fechaFormateada = fecha.toLocaleDateString('es-VE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      });
                    }
                  } catch (e) {
                    console.warn('Error al formatear fecha:', e);
                  }
                }

                // Validar pedidoId
                const pedidoIdDisplay = factura.pedidoId 
                  ? `#${factura.pedidoId.length >= 6 ? factura.pedidoId.slice(-6) : factura.pedidoId}`
                  : 'N/A';

                // Validar clienteNombre
                const clienteNombre = factura.clienteNombre || factura.clienteId || 'Sin nombre';

                // Validar montoTotal
                const montoTotal = factura.montoTotal || 0;

                // Validar numeroFactura
                const numeroFactura = factura.numeroFactura || 'Sin número';

                return (
                  <li key={factura.id || factura.pedidoId || Math.random()} className="border-2 border-green-300 rounded-xl bg-gradient-to-br from-white to-green-50 shadow-lg p-3 sm:p-4 transition-all duration-300 hover:shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-green-600 text-white px-3 py-1 text-sm font-bold">
                        {numeroFactura}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {fechaFormateada}
                      </span>
                    </div>
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-gray-800">{clienteNombre}</h3>
                      <p className="text-sm text-gray-600">ID Pedido: {pedidoIdDisplay}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-green-700">${montoTotal.toFixed(2)}</p>
                    </div>
                    <Button 
                      onClick={() => handleVerPreliminar(factura)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>Ver Preliminar</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
    
    {/* Modal de Confirmación y Nota de Entrega */}
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto w-[95vw]">
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
                    {selectedPedido.items.map((item: any, idx: number) => (
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
                      // IMPORTANTE: El backend envía adicionales con estructura: { descripcion?, precio, cantidad? }
                      // El montoTotal del backend YA incluye los adicionales
                      // Normalizar adicionales: puede ser null, undefined, o array vacío desde el backend
                      const adicionalesModalNormalizados = (selectedPedido.adicionales && Array.isArray(selectedPedido.adicionales)) ? selectedPedido.adicionales : [];
                      // Calcular monto de items (solo para mostrar, no para el total)
                      const montoItems = selectedPedido.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0;
                      // Calcular monto de adicionales (precio * cantidad, default cantidad = 1)
                      const montoAdicionales = adicionalesModalNormalizados.reduce((acc: number, ad: any) => {
                        const cantidad = ad.cantidad || 1;
                        const precio = ad.precio || 0;
                        return acc + (precio * cantidad);
                      }, 0);
                      // CRÍTICO: Usar montoTotal del backend (ya incluye adicionales)
                      // Si no existe, calcular como fallback
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
                            <td className="p-2 text-center text-green-900">{selectedPedido.items.reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0)}</td>
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
          <Button onClick={handlePrintNotaEntrega} className="bg-blue-600 hover:bg-blue-700" disabled={confirming}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Nota de Entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de Preliminar para Facturas Confirmadas */}
    <Dialog open={modalPreliminarOpen} onOpenChange={setModalPreliminarOpen}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto w-[95vw]">
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
                      <th className="p-2 text-left">Código</th>
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
                    {(selectedFactura.adicionales && Array.isArray(selectedFactura.adicionales) && selectedFactura.adicionales.length > 0) && (
                      <>
                        <tr className="bg-yellow-50">
                          <td colSpan={5} className="p-2 text-right">Subtotal Items:</td>
                          <td className="p-2 text-right text-yellow-700">
                            ${(selectedFactura.items?.reduce((acc: number, item: any) => acc + ((item.precio || 0) * (item.cantidad || 0)), 0) || 0).toFixed(2)}
                          </td>
                        </tr>
                        {selectedFactura.adicionales.map((adicional: any, idx: number) => (
                          <tr key={idx} className="bg-yellow-50">
                            <td colSpan={5} className="p-2 text-right">+ {adicional.descripcion}:</td>
                            <td className="p-2 text-right text-yellow-700">${(adicional.monto || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </>
                    )}
                    <tr>
                      <td colSpan={4} className="p-2 text-right">Total de la Factura:</td>
                      <td className="p-2 text-center">{selectedFactura.items.reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0)}</td>
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
