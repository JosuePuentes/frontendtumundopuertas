import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Printer, Download } from 'lucide-react';
import type { FormatoImpresion, ConfiguracionFormato } from './FormatosImpresion';
import { useFormatos } from '../../context/FormatosContext';

interface NotaEntregaImpresionProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: any; // Datos del pedido
}

const NotaEntregaImpresion: React.FC<NotaEntregaImpresionProps> = ({
  isOpen,
  onClose,
  pedido
}) => {
  const { formatos, obtenerFormatoPorTipo } = useFormatos();
  const [formatoSeleccionado, setFormatoSeleccionado] = useState<FormatoImpresion | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Obtener formato activo para notas de entrega
      const formatoNotaEntrega = obtenerFormatoPorTipo('nota_entrega');
      if (formatoNotaEntrega) {
        setFormatoSeleccionado(formatoNotaEntrega);
      } else {
        // Si no hay formato específico, usar el primero disponible
        const formatosNotaEntrega = formatos.filter(f => f.tipo === 'nota_entrega' && f.activo);
        if (formatosNotaEntrega.length > 0) {
          setFormatoSeleccionado(formatosNotaEntrega[0]);
        }
      }
    }
  }, [isOpen, formatos, obtenerFormatoPorTipo]);

  const handleImprimir = () => {
    if (!formatoSeleccionado) return;
    
    // Crear ventana de impresión
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(generarHTMLImpresion());
      ventanaImpresion.document.close();
      ventanaImpresion.focus();
      ventanaImpresion.print();
      ventanaImpresion.close();
    }
  };

  const handleDescargar = () => {
    if (!formatoSeleccionado) return;
    
    // Aquí se implementaría la descarga del PDF
    console.log('Descargar PDF de la nota de entrega');
  };

  const generarHTMLImpresion = () => {
    if (!formatoSeleccionado || !pedido) return '';

    const config = formatoSeleccionado.configuracion;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nota de Entrega</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { max-height: 80px; }
          .info-section { margin-bottom: 20px; }
          .document-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .client-info { background: #f5f5f5; padding: 15px; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature-box { width: 45%; text-align: center; }
          .signature-line { border-bottom: 1px solid #333; margin-bottom: 5px; height: 40px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
          @media print { body { margin: 0; } }
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
    html += `<p><strong>Número:</strong> ${config.documento.numeroDocumento}</p>`;
    html += `<p><strong>Fecha:</strong> ${config.documento.fecha}</p>`;
    html += '</div>';

    // Información del cliente
    if (config.cliente.mostrar) {
      html += '<div class="client-info">';
      html += '<h3>Información del Cliente</h3>';
      if (config.cliente.incluirNombre) {
        html += `<p><strong>Nombre:</strong> ${pedido.cliente_nombre || 'N/A'}</p>`;
      }
      if (config.cliente.incluirCedula) {
        html += `<p><strong>Cédula:</strong> ${pedido.cliente_cedula || 'N/A'}</p>`;
      }
      if (config.cliente.incluirDireccion) {
        html += `<p><strong>Dirección:</strong> ${pedido.cliente_direccion || 'N/A'}</p>`;
      }
      if (config.cliente.incluirTelefono) {
        html += `<p><strong>Teléfono:</strong> ${pedido.cliente_telefono || 'N/A'}</p>`;
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
      if (config.items.columnas.includes('estado')) {
        html += '<th>Estado</th>';
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
        if (config.items.columnas.includes('estado')) {
          html += `<td>Entregado</td>`;
        }
        html += '</tr>';
      });
      
      html += '</tbody></table>';
    }

    // Sección de firmas
    html += '<div class="signature-section">';
    html += '<div class="signature-box">';
    html += '<div class="signature-line"></div>';
    html += '<p><strong>Firma del Cliente</strong></p>';
    html += '</div>';
    html += '<div class="signature-box">';
    html += '<div class="signature-line"></div>';
    html += '<p><strong>Firma del Representante</strong></p>';
    html += '</div>';
    html += '</div>';

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
              {config.cliente.incluirTelefono && (
                <div><strong>Teléfono:</strong> {pedido.cliente_telefono || 'N/A'}</div>
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
                  {config.items.columnas.includes('estado') && <TableHead>Estado</TableHead>}
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
                    {config.items.columnas.includes('estado') && (
                      <TableCell>
                        <Badge variant="default">Entregado</Badge>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Firmas */}
        <div className="flex justify-between mt-8">
          <div className="w-48 text-center">
            <div className="border-b border-gray-400 h-12 mb-2"></div>
            <p className="text-sm font-medium">Firma del Cliente</p>
          </div>
          <div className="w-48 text-center">
            <div className="border-b border-gray-400 h-12 mb-2"></div>
            <p className="text-sm font-medium">Firma del Representante</p>
          </div>
        </div>

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Nota de Entrega</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                {formatos.filter(f => f.tipo === 'nota_entrega' && f.activo).map((formato) => (
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
              <Card>
                <CardContent className="p-6">
                  {renderizarVistaPrevia()}
                </CardContent>
              </Card>
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
      </DialogContent>
    </Dialog>
  );
};

export default NotaEntregaImpresion;
