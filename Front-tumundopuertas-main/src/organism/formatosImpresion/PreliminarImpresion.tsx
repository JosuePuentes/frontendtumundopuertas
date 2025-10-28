import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import type { FormatoImpresion, ConfiguracionFormato } from './FormatosImpresion';
import { useFormatos } from '../../context/FormatosContext';

interface PreliminarImpresionProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: any; // Datos del pedido
}

const PreliminarImpresion: React.FC<PreliminarImpresionProps> = ({
  isOpen,
  onClose,
  pedido
}) => {
  const { formatos, obtenerFormatoPorTipo } = useFormatos();
  const [formatoSeleccionado, setFormatoSeleccionado] = useState<FormatoImpresion | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Obtener formato activo para preliminares
      const formatoPreliminar = obtenerFormatoPorTipo('preliminar');
      if (formatoPreliminar) {
        setFormatoSeleccionado(formatoPreliminar);
      } else {
        // Si no hay formato específico, usar el primero disponible
        const formatosPreliminares = formatos.filter(f => f.tipo === 'preliminar' && f.activo);
        if (formatosPreliminares.length > 0) {
          setFormatoSeleccionado(formatosPreliminares[0]);
        }
      }
    }
  }, [isOpen, formatos, obtenerFormatoPorTipo]);

  const handleImprimir = () => {
    if (!formatoSeleccionado || !pedido) return;
    
    // Crear ventana de impresión con el mismo HTML que se muestra en la vista previa
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      const htmlCompleto = generarHTMLImpresion();
      ventanaImpresion.document.write(htmlCompleto);
      ventanaImpresion.document.close();
      ventanaImpresion.focus();
      ventanaImpresion.print();
      ventanaImpresion.close();
    }
  };

  const handleDescargar = () => {
    if (!formatoSeleccionado || !pedido) return;
    
    const doc = new jsPDF();
    let yPosition = 20;
    const config = formatoSeleccionado.configuracion;

    // Configurar fuente
    doc.setFontSize(12);

    // Empresa
    if (config.empresa.mostrar) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(config.empresa.nombre, 105, yPosition, { align: 'center' });
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`RIF: ${config.empresa.rif}`, 105, yPosition, { align: 'center' });
      yPosition += 6;
      doc.text(config.empresa.direccion, 105, yPosition, { align: 'center' });
      yPosition += 15;
    }

    // Documento
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(config.documento.titulo, 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número: ${config.documento.numeroDocumento}`, 20, yPosition);
    doc.text(`Fecha: ${config.documento.fecha}`, 150, yPosition);
    yPosition += 15;

    // Cliente
    if (config.cliente.mostrar) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS DEL CLIENTE:', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${pedido.cliente?.nombre || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Cédula: ${pedido.cliente?.cedula || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Dirección: ${pedido.cliente?.direccion || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Teléfono: ${pedido.cliente?.telefono || 'N/A'}`, 20, yPosition);
      yPosition += 15;
    }

    // Items
    if (config.items.mostrar && pedido.items && pedido.items.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ITEMS:', 20, yPosition);
      yPosition += 8;

      // Headers de la tabla
      let xPosition = 20;
      if (config.items.columnas.includes('descripcion')) {
        doc.text('Descripción', xPosition, yPosition);
        xPosition += 80;
      }
      if (config.items.columnas.includes('cantidad')) {
        doc.text('Cant.', xPosition, yPosition);
        xPosition += 20;
      }
      if (config.items.columnas.includes('precio')) {
        doc.text('Precio Unit.', xPosition, yPosition);
        xPosition += 30;
      }
      if (config.items.columnas.includes('subtotal')) {
        doc.text('Subtotal', xPosition, yPosition);
      }
      yPosition += 8;

      // Línea separadora
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 5;

      // Items
      pedido.items.forEach((item: any) => {
        xPosition = 20;
        if (config.items.columnas.includes('descripcion')) {
          doc.text(item.descripcion || item.nombre || 'N/A', xPosition, yPosition);
          xPosition += 80;
        }
        if (config.items.columnas.includes('cantidad')) {
          doc.text((item.cantidad || 1).toString(), xPosition, yPosition);
          xPosition += 20;
        }
        if (config.items.columnas.includes('precio')) {
          doc.text(`$ ${(item.precio || 0).toLocaleString()}`, xPosition, yPosition);
          xPosition += 30;
        }
        if (config.items.columnas.includes('subtotal')) {
          doc.text(`$ ${((item.precio || 0) * (item.cantidad || 1)).toLocaleString()}`, xPosition, yPosition);
        }
        yPosition += 6;
      });
      yPosition += 10;
      
      // Historial de abonos - Debajo de los items
      if (pedido.historial_pagos && Array.isArray(pedido.historial_pagos) && pedido.historial_pagos.length > 0) {
        yPosition += 5;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Historial de Abonos:', 20, yPosition);
        yPosition += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        // Ordenar por fecha descendente (más reciente primero)
        const historialOrdenado = [...pedido.historial_pagos].sort((a: any, b: any) => {
          const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
          const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
          return fechaB - fechaA; // Descendente
        });
        historialOrdenado.forEach((pago: any) => {
          const fechaPago = pago.fecha ? new Date(pago.fecha).toLocaleDateString() : 'N/A';
          doc.text(`${fechaPago} - $ ${(pago.monto || 0).toLocaleString()} - ${pago.metodo || 'N/A'}`, 20, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }
    }

    // Totales
    if (config.totales.mostrar) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTALES:', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Subtotal - siempre mostrarlo
      doc.text(`Subtotal: $ ${(pedido.subtotal || 0).toLocaleString()}`, 20, yPosition);
      yPosition += 6;
      
      // Total Factura - siempre mostrarlo
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Factura: $ ${(pedido.total || 0).toLocaleString()}`, 20, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      
      // Calcular abonos realizados
      const totalAbonado = pedido.total_abonado || pedido.abonado || 0;
      const restante = (pedido.total || 0) - totalAbonado;
      
      // Mostrar abonos si existen
      if (totalAbonado > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 128, 0); // Verde
        doc.text(`Total Abonado: $ ${totalAbonado.toLocaleString()}`, 20, yPosition);
        yPosition += 6;
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text(`Resta por Pagar: $ ${restante.toLocaleString()}`, 20, yPosition);
        yPosition += 6;
        doc.setTextColor(0, 0, 0); // Negro
        doc.setFont('helvetica', 'normal');
      }
    }

    // Pie de página
    if (config.pie.mostrar) {
      yPosition += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(config.pie.texto, 105, yPosition, { align: 'center' });
    }

    // Descargar el PDF
    doc.save(`preliminar-pedido-${pedido.numero || 'N/A'}.pdf`);
  };

  const generarHTMLImpresion = () => {
    if (!formatoSeleccionado || !pedido) return '';

    const config = formatoSeleccionado.configuracion;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Preliminar de Pago</title>
        <style>
          @page {
            size: letter portrait;
            margin: 0.3in;
          }
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 0;
            font-size: 10px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 8px; 
            padding-bottom: 5px;
          }
          .header h1 {
            margin: 0;
            padding: 0;
            font-size: 14px;
            font-weight: bold;
          }
          .header p {
            margin: 2px 0;
            padding: 0;
            font-size: 9px;
          }
          .logo { 
            max-height: 40px; 
            margin-bottom: 3px;
          }
          .info-section { 
            margin: 8px 0; 
            font-size: 9px;
          }
          .info-section p {
            margin: 3px 0;
          }
          .document-title { 
            font-size: 16px; 
            font-weight: bold; 
            margin: 8px 0; 
            text-align: center;
          }
          .client-info { 
            background: #f5f5f5; 
            padding: 8px; 
            margin: 8px 0; 
            font-size: 9px;
          }
          .client-info h3 {
            margin: 0 0 5px 0;
            font-size: 11px;
          }
          .client-info p {
            margin: 3px 0;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 8px 0; 
            font-size: 9px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 4px 6px; 
            text-align: left; 
            font-size: 9px;
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold;
          }
          .totals { 
            text-align: right; 
            margin: 8px 0; 
          }
          .totals p {
            margin: 2px 0;
            font-size: 10px;
            line-height: 1.2;
          }
          .total-final { 
            font-weight: bold; 
            font-size: 12px; 
            border-top: 2px solid #333; 
            padding-top: 4px; 
            margin-top: 6px;
          }
          .footer { 
            text-align: center; 
            margin-top: 15px; 
            padding-top: 8px; 
            border-top: 1px solid #ddd; 
            font-size: 9px;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${generarContenidoHTML(config)}
      </body>
      </html>
    `;
  };

  const generarContenidoHTML = (config: ConfiguracionFormato) => {
    let html = '';

    // Header con empresa y logo
    if (config.empresa.mostrar) {
      html += '<div class="header">';
      if (config.logo.mostrar) {
        html += `<img src="${config.logo.url}" alt="Logo" class="logo" />`;
      }
      html += `<h1>${config.empresa.nombre}</h1>`;
      html += `<p>RIF: ${config.empresa.rif}</p>`;
      html += `<p>${config.empresa.direccion}</p>`;
      html += `<p>Tel: ${config.empresa.telefono} | Email: ${config.empresa.email}</p>`;
      html += '</div>';
    }

    // Título del documento
    html += `<div class="document-title">${config.documento.titulo}</div>`;
    html += `<div class="info-section">`;
    html += `<strong>Número:</strong> ${config.documento.numeroDocumento}<br>`;
    html += `<strong>Fecha:</strong> ${config.documento.fecha}`;
    html += '</div>';

    // Información del cliente
    if (config.cliente.mostrar) {
      html += '<div class="client-info">';
      html += '<h3>Cliente</h3>';
      if (config.cliente.incluirNombre) {
        html += `<strong>Nombre:</strong> ${pedido.cliente_nombre || 'N/A'}<br>`;
      }
      if (config.cliente.incluirCedula) {
        html += `<strong>Cédula:</strong> ${pedido.cliente_cedula || 'N/A'}<br>`;
      }
      if (config.cliente.incluirDireccion) {
        html += `<strong>Dirección:</strong> ${pedido.cliente_direccion || 'N/A'}<br>`;
      }
      if (config.cliente.incluirTelefono) {
        html += `<strong>Teléfono:</strong> ${pedido.cliente_telefono || 'N/A'}<br>`;
      }
      html += '</div>';
    }

    // Tabla de items
    if (config.items.mostrar && pedido.items) {
      html += '<table>';
      html += '<thead><tr>';
      if (config.items.columnas.includes('descripcion')) {
        html += '<th>Descripción</th>';
      }
      if (config.items.columnas.includes('cantidad')) {
        html += '<th>Cantidad</th>';
      }
      if (config.items.columnas.includes('precio')) {
        html += '<th>Precio Unit.</th>';
      }
      if (config.items.columnas.includes('subtotal')) {
        html += '<th>Subtotal</th>';
      }
      html += '</tr></thead>';
      html += '<tbody>';
      
      pedido.items.forEach((item: any) => {
        html += '<tr>';
        if (config.items.columnas.includes('descripcion')) {
          html += `<td>${item.descripcion || item.nombre}</td>`;
        }
        if (config.items.columnas.includes('cantidad')) {
          html += `<td>${item.cantidad || 1}</td>`;
        }
        if (config.items.columnas.includes('precio')) {
          html += `<td>$ ${(item.precio || 0).toLocaleString()}</td>`;
        }
        if (config.items.columnas.includes('subtotal')) {
          html += `<td>$ ${((item.precio || 0) * (item.cantidad || 1)).toLocaleString()}</td>`;
        }
        html += '</tr>';
      });
      
      html += '</tbody></table>';
      
      // Historial de abonos - Debajo de la tabla de items
      if (pedido.historial_pagos && Array.isArray(pedido.historial_pagos) && pedido.historial_pagos.length > 0) {
        html += '<div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">';
        html += '<p style="font-weight: bold; margin-bottom: 8px;">Historial de Abonos:</p>';
        // Ordenar por fecha descendente (más reciente primero)
        const historialOrdenado = [...pedido.historial_pagos].sort((a: any, b: any) => {
          const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
          const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
          return fechaB - fechaA; // Descendente
        });
        historialOrdenado.forEach((pago: any) => {
          const fechaPago = pago.fecha ? new Date(pago.fecha).toLocaleDateString() : 'N/A';
          html += `<p style="margin: 4px 0; font-size: 10px;">${fechaPago} - $ ${(pago.monto || 0).toLocaleString()} - ${pago.metodo || 'N/A'}</p>`;
        });
        html += '</div>';
      }
    }

    // Totales
    if (config.totales.mostrar) {
      html += '<div class="totals">';
      // Subtotal - siempre mostrarlo
      html += '<p><strong>Subtotal:</strong> $ ' + (pedido.subtotal || 0).toLocaleString() + '</p>';
      
      // Total Factura - siempre mostrarlo
      html += '<p class="total-final"><strong>Total Factura:</strong> $ ' + (pedido.total || 0).toLocaleString() + '</p>';
      
      // Calcular abonos realizados
      const totalAbonado = pedido.total_abonado || pedido.abonado || 0;
      const restante = (pedido.total || 0) - totalAbonado;
      
      // Mostrar abonos si existen
      if (totalAbonado > 0) {
        html += '<p style="color: green; font-weight: bold;"><strong>Total Abonado:</strong> $ ' + totalAbonado.toLocaleString() + '</p>';
        html += '<p style="color: red; font-weight: bold;"><strong>Resta por Pagar:</strong> $ ' + restante.toLocaleString() + '</p>';
      }
      html += '</div>';
    }

    // Pie de página
    if (config.pie.mostrar) {
      html += '<div class="footer">';
      html += `<p>${config.pie.texto}</p>`;
      html += '</div>';
    }

    return html;
  };

  const renderizarVistaPrevia = () => {
    if (!formatoSeleccionado || !pedido) return null;

    const config = formatoSeleccionado.configuracion;

    return (
      <div className="space-y-4">
        {/* Header */}
        {config.empresa.mostrar && (
          <div className="text-center border-b pb-4">
            {config.logo.mostrar && (
              <img 
                src={config.logo.url} 
                alt="Logo" 
                className={`mx-auto mb-2 ${config.logo.tamaño === 'pequeño' ? 'h-12' : config.logo.tamaño === 'grande' ? 'h-20' : 'h-16'}`}
              />
            )}
            <h1 className="text-xl font-bold">{config.empresa.nombre}</h1>
            <p className="text-sm text-gray-600">RIF: {config.empresa.rif}</p>
            <p className="text-sm text-gray-600">{config.empresa.direccion}</p>
          </div>
        )}

        {/* Documento */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{config.documento.titulo}</h2>
          <div className="text-right text-sm">
            <p><strong>Número:</strong> {config.documento.numeroDocumento}</p>
            <p><strong>Fecha:</strong> {config.documento.fecha}</p>
          </div>
        </div>

        {/* Cliente */}
        {config.cliente.mostrar && (
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="font-medium mb-2">Información del Cliente</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {config.cliente.incluirNombre && (
                <div><strong>Nombre:</strong> {pedido.cliente_nombre || 'N/A'}</div>
              )}
              {config.cliente.incluirCedula && (
                <div><strong>Cédula:</strong> {pedido.cliente_cedula || 'N/A'}</div>
              )}
              {config.cliente.incluirDireccion && (
                <div className="col-span-2"><strong>Dirección:</strong> {pedido.cliente_direccion || 'N/A'}</div>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        {config.items.mostrar && pedido.items && (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  {config.items.columnas.includes('descripcion') && <TableHead>Descripción</TableHead>}
                  {config.items.columnas.includes('cantidad') && <TableHead>Cantidad</TableHead>}
                  {config.items.columnas.includes('precio') && <TableHead>Precio Unit.</TableHead>}
                  {config.items.columnas.includes('subtotal') && <TableHead>Subtotal</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedido.items.map((item: any, index: number) => (
                  <TableRow key={index}>
                    {config.items.columnas.includes('descripcion') && (
                      <TableCell>{item.descripcion || item.nombre}</TableCell>
                    )}
                    {config.items.columnas.includes('cantidad') && (
                      <TableCell>{item.cantidad || 1}</TableCell>
                    )}
                    {config.items.columnas.includes('precio') && (
                      <TableCell>$ {(item.precio || 0).toLocaleString()}</TableCell>
                    )}
                    {config.items.columnas.includes('subtotal') && (
                      <TableCell>$ {((item.precio || 0) * (item.cantidad || 1)).toLocaleString()}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Historial de abonos - Debajo de los items */}
            {pedido.historial_pagos && Array.isArray(pedido.historial_pagos) && pedido.historial_pagos.length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <p className="font-bold mb-2 text-sm">Historial de Abonos:</p>
                <div className="space-y-1">
                  {/* Ordenar por fecha descendente (más reciente primero) */}
                  {[...pedido.historial_pagos].sort((a: any, b: any) => {
                    const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
                    const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
                    return fechaB - fechaA; // Descendente
                  }).map((pago: any, index: number) => (
                    <div key={index} className="text-xs text-gray-600">
                      {pago.fecha ? new Date(pago.fecha).toLocaleDateString() : 'N/A'} - $ {(pago.monto || 0).toLocaleString()} - {pago.metodo || 'N/A'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Totales */}
        {config.totales.mostrar && (
          <div className="flex justify-end">
            <div className="w-48 space-y-1 text-sm">
              {/* Subtotal - siempre mostrarlo */}
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>$ {(pedido.subtotal || 0).toLocaleString()}</span>
              </div>
              
              {/* Total Factura - siempre mostrarlo */}
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total Factura:</span>
                <span>$ {(pedido.total || 0).toLocaleString()}</span>
              </div>
              
              {/* Mostrar abonos si existen */}
              {(() => {
                const totalAbonado = pedido.total_abonado || pedido.abonado || 0;
                const restante = (pedido.total || 0) - totalAbonado;
                
                if (totalAbonado > 0) {
                  return (
                    <>
                      <div className="flex justify-between text-green-600 font-bold">
                        <span>Total Abonado:</span>
                        <span>$ {totalAbonado.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-red-600 font-bold">
                        <span>Resta por Pagar:</span>
                        <span>$ {restante.toLocaleString()}</span>
                      </div>
                    </>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        )}

        {/* Pie */}
        {config.pie.mostrar && (
          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p>{config.pie.texto}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-5xl h-[85vh] overflow-hidden bg-white p-0 flex flex-col">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle>Preliminar de Pago</DialogTitle>
        </DialogHeader>

        {/* Área de contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Selector de formato */}
          <div>
            <label className="block text-sm font-medium mb-2">Formato de Impresión</label>
            <Select
              value={formatoSeleccionado?.id || ''}
              onValueChange={(value) => {
                const formato = formatos.find(f => f.id === value);
                setFormatoSeleccionado(formato || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un formato" />
              </SelectTrigger>
              <SelectContent>
                {formatos.filter(f => f.tipo === 'preliminar' && f.activo).map((formato) => (
                  <SelectItem key={formato.id} value={formato.id}>
                    {formato.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vista previa */}
          {formatoSeleccionado && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Vista Previa</h3>
              <div className="overflow-y-auto max-h-[50vh] border rounded-lg">
                <Card className="w-full border-0">
                  <CardContent className="p-6">
                    <div className="max-w-4xl mx-auto">
                      {renderizarVistaPrevia()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción - Fixed footer */}
        <div className="border-t bg-gray-50 p-4 shrink-0">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={handleDescargar} disabled={!formatoSeleccionado}>
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
            <Button onClick={handleImprimir} disabled={!formatoSeleccionado}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreliminarImpresion;
