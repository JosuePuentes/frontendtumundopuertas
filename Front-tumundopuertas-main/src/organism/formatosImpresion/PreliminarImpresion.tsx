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
    if (!formatoSeleccionado) return;
    
    // Aplicar estilos CSS según configuración de papel
    const config = formatoSeleccionado.configuracion;
    const papel = config.papel;
    
    // Crear estilos CSS dinámicos
    const estilosPapel = `
      @page {
        size: ${papel.tamaño === 'carta' ? 'letter' : 
                papel.tamaño === 'media_carta' ? '5.5in 8.5in' :
                papel.tamaño === 'oficio' ? '8.5in 13in' : 'A4'};
        margin: ${papel.margenes.superior}mm ${papel.margenes.derecho}mm ${papel.margenes.inferior}mm ${papel.margenes.izquierdo}mm;
      }
      
      @media print {
        body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }
        
        .print-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: ${papel.orientacion === 'horizontal' ? 'row' : 'column'};
        }
      }
    `;
    
    // Crear ventana de impresión
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      const htmlCompleto = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preliminar de Pago</title>
          <style>
            ${estilosPapel}
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { max-height: 80px; }
            .document-title { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
            .info-section { margin: 20px 0; }
            .client-info { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .totals { text-align: right; margin-top: 20px; }
            .footer { text-align: center; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${generarHTMLImpresion()}
          </div>
        </body>
        </html>
      `;
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
          doc.text(`Bs. ${(item.precio || 0).toLocaleString()}`, xPosition, yPosition);
          xPosition += 30;
        }
        if (config.items.columnas.includes('subtotal')) {
          doc.text(`Bs. ${((item.precio || 0) * (item.cantidad || 1)).toLocaleString()}`, xPosition, yPosition);
        }
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Totales
    if (config.totales.mostrar) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTALES:', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (config.totales.incluirSubtotal) {
        doc.text(`Subtotal: Bs. ${(pedido.subtotal || 0).toLocaleString()}`, 20, yPosition);
        yPosition += 6;
      }
      if (config.totales.incluirIva) {
        doc.text(`IVA (16%): Bs. ${(pedido.iva || 0).toLocaleString()}`, 20, yPosition);
        yPosition += 6;
      }
      if (config.totales.incluirTotal) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: Bs. ${(pedido.total || 0).toLocaleString()}`, 20, yPosition);
        yPosition += 6;
        doc.setFont('helvetica', 'normal');
      }
      if (config.totales.incluirAbonado) {
        doc.text(`Abonado: Bs. ${(pedido.abonado || 0).toLocaleString()}`, 20, yPosition);
        yPosition += 6;
      }
      if (config.totales.incluirRestante) {
        doc.text(`Restante: Bs. ${((pedido.total || 0) - (pedido.abonado || 0)).toLocaleString()}`, 20, yPosition);
        yPosition += 6;
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
          html += `<td>Bs. ${(item.precio || 0).toLocaleString()}</td>`;
        }
        if (config.items.columnas.includes('subtotal')) {
          html += `<td>Bs. ${((item.precio || 0) * (item.cantidad || 1)).toLocaleString()}</td>`;
        }
        html += '</tr>';
      });
      
      html += '</tbody></table>';
    }

    // Totales
    if (config.totales.mostrar) {
      html += '<div class="totals">';
      if (config.totales.incluirSubtotal) {
        html += '<p><strong>Subtotal:</strong> Bs. ' + (pedido.subtotal || 0).toLocaleString() + '</p>';
      }
      if (config.totales.incluirIva) {
        html += '<p><strong>IVA (16%):</strong> Bs. ' + (pedido.iva || 0).toLocaleString() + '</p>';
      }
      if (config.totales.incluirTotal) {
        html += '<p class="total-final"><strong>Total:</strong> Bs. ' + (pedido.total || 0).toLocaleString() + '</p>';
      }
      if (config.totales.incluirAbonado) {
        html += '<p><strong>Abonado:</strong> Bs. ' + (pedido.abonado || 0).toLocaleString() + '</p>';
      }
      if (config.totales.incluirRestante) {
        html += '<p><strong>Restante:</strong> Bs. ' + ((pedido.total || 0) - (pedido.abonado || 0)).toLocaleString() + '</p>';
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
                      <TableCell>Bs. {(item.precio || 0).toLocaleString()}</TableCell>
                    )}
                    {config.items.columnas.includes('subtotal') && (
                      <TableCell>Bs. {((item.precio || 0) * (item.cantidad || 1)).toLocaleString()}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Totales */}
        {config.totales.mostrar && (
          <div className="flex justify-end">
            <div className="w-48 space-y-1 text-sm">
              {config.totales.incluirSubtotal && (
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Bs. {(pedido.subtotal || 0).toLocaleString()}</span>
                </div>
              )}
              {config.totales.incluirTotal && (
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>Total:</span>
                  <span>Bs. {(pedido.total || 0).toLocaleString()}</span>
                </div>
              )}
              {config.totales.incluirAbonado && (
                <div className="flex justify-between text-green-600">
                  <span>Abonado:</span>
                  <span>Bs. {(pedido.abonado || 0).toLocaleString()}</span>
                </div>
              )}
              {config.totales.incluirRestante && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Restante:</span>
                  <span>Bs. {((pedido.total || 0) - (pedido.abonado || 0)).toLocaleString()}</span>
                </div>
              )}
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
      <DialogContent className="w-[98vw] h-[98vh] max-w-none max-h-none overflow-hidden bg-white p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 border-b">
            <DialogTitle>Preliminar de Pago</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6 h-full flex flex-col">
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
                <div className="flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-3">Vista Previa</h3>
                  <div className="flex-1 overflow-y-auto">
                    <Card className="w-full h-full">
                      <CardContent className="p-6 min-h-full">
                        <div className="max-w-4xl mx-auto">
                          {renderizarVistaPrevia()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreliminarImpresion;
