import React from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Printer, Download } from 'lucide-react';
import type { ConfiguracionFormato } from './FormatosImpresion';

interface VistaPreviaProps {
  configuracion: ConfiguracionFormato;
}

const VistaPrevia: React.FC<VistaPreviaProps> = ({ configuracion }) => {
  // Datos de ejemplo para la vista previa
  const datosEjemplo = {
    cliente: {
      nombre: 'Juan Pérez',
      cedula: 'V-12345678',
      direccion: 'Av. Principal #123, Caracas',
      telefono: '+58 412-123-4567'
    },
    items: [
      { descripcion: 'Puerta Principal de Madera', cantidad: 1, precio: 150000, subtotal: 150000 },
      { descripcion: 'Marco de Aluminio', cantidad: 2, precio: 75000, subtotal: 150000 },
      { descripcion: 'Cerraduras de Seguridad', cantidad: 3, precio: 25000, subtotal: 75000 }
    ],
    totales: {
      subtotal: 375000,
      iva: 56250,
      total: 431250,
      abonado: 100000,
      restante: 331250
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleDescargar = () => {
    // Aquí se implementaría la descarga del documento
    console.log('Descargar documento');
  };

  const renderizarEmpresa = () => {
    if (!configuracion.empresa.mostrar) return null;

    return (
      <div className="text-center mb-6">
        {configuracion.logo.mostrar && (
          <div className={`mb-4 ${configuracion.logo.posicion === 'centro' ? 'text-center' : configuracion.logo.posicion === 'derecha' ? 'text-right' : 'text-left'}`}>
            <img 
              src={configuracion.logo.url} 
              alt="Logo" 
              className={`inline-block ${configuracion.logo.tamaño === 'pequeño' ? 'h-12' : configuracion.logo.tamaño === 'grande' ? 'h-20' : 'h-16'}`}
            />
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-800">{configuracion.empresa.nombre}</h1>
        <p className="text-gray-600">RIF: {configuracion.empresa.rif}</p>
        <p className="text-gray-600">{configuracion.empresa.direccion}</p>
        <p className="text-gray-600">Tel: {configuracion.empresa.telefono}</p>
        <p className="text-gray-600">Email: {configuracion.empresa.email}</p>
      </div>
    );
  };

  const renderizarCliente = () => {
    if (!configuracion.cliente.mostrar) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Información del Cliente</h3>
        <div className="grid grid-cols-2 gap-4">
          {configuracion.cliente.incluirNombre && (
            <div>
              <span className="font-medium">Nombre: </span>
              <span>{datosEjemplo.cliente.nombre}</span>
            </div>
          )}
          {configuracion.cliente.incluirCedula && (
            <div>
              <span className="font-medium">Cédula: </span>
              <span>{datosEjemplo.cliente.cedula}</span>
            </div>
          )}
          {configuracion.cliente.incluirDireccion && (
            <div className="col-span-2">
              <span className="font-medium">Dirección: </span>
              <span>{datosEjemplo.cliente.direccion}</span>
            </div>
          )}
          {configuracion.cliente.incluirTelefono && (
            <div>
              <span className="font-medium">Teléfono: </span>
              <span>{datosEjemplo.cliente.telefono}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderizarDocumento = () => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{configuracion.documento.titulo}</h2>
        <div className="text-right">
          <p><span className="font-medium">Número: </span>{configuracion.documento.numeroDocumento}</p>
          <p><span className="font-medium">Fecha: </span>{configuracion.documento.fecha}</p>
        </div>
      </div>
    </div>
  );

  const renderizarItems = () => {
    if (!configuracion.items.mostrar) return null;

    return (
      <div className="mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              {configuracion.items.columnas.includes('descripcion') && (
                <TableHead>Descripción</TableHead>
              )}
              {configuracion.items.columnas.includes('cantidad') && (
                <TableHead>Cantidad</TableHead>
              )}
              {configuracion.items.columnas.includes('precio') && (
                <TableHead>Precio Unit.</TableHead>
              )}
              {configuracion.items.columnas.includes('subtotal') && (
                <TableHead>Subtotal</TableHead>
              )}
              {configuracion.items.columnas.includes('iva') && (
                <TableHead>IVA</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {datosEjemplo.items.map((item, index) => (
              <TableRow key={index}>
                {configuracion.items.columnas.includes('descripcion') && (
                  <TableCell>{item.descripcion}</TableCell>
                )}
                {configuracion.items.columnas.includes('cantidad') && (
                  <TableCell>{item.cantidad}</TableCell>
                )}
                {configuracion.items.columnas.includes('precio') && (
                  <TableCell>Bs. {item.precio.toLocaleString()}</TableCell>
                )}
                {configuracion.items.columnas.includes('subtotal') && (
                  <TableCell>Bs. {item.subtotal.toLocaleString()}</TableCell>
                )}
                {configuracion.items.columnas.includes('iva') && (
                  <TableCell>Bs. {(item.subtotal * 0.16).toLocaleString()}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderizarTotales = () => {
    if (!configuracion.totales.mostrar) return null;

    return (
      <div className="mb-6">
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            {configuracion.totales.incluirSubtotal && (
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Bs. {datosEjemplo.totales.subtotal.toLocaleString()}</span>
              </div>
            )}
            {configuracion.totales.incluirIva && (
              <div className="flex justify-between">
                <span>IVA (16%):</span>
                <span>Bs. {datosEjemplo.totales.iva.toLocaleString()}</span>
              </div>
            )}
            {configuracion.totales.incluirTotal && (
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>Bs. {datosEjemplo.totales.total.toLocaleString()}</span>
              </div>
            )}
            {configuracion.totales.incluirAbonado && (
              <div className="flex justify-between text-green-600">
                <span>Abonado:</span>
                <span>Bs. {datosEjemplo.totales.abonado.toLocaleString()}</span>
              </div>
            )}
            {configuracion.totales.incluirRestante && (
              <div className="flex justify-between text-red-600 font-bold">
                <span>Restante:</span>
                <span>Bs. {datosEjemplo.totales.restante.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderizarPie = () => {
    if (!configuracion.pie.mostrar) return null;

    return (
      <div className="text-center mt-8 pt-4 border-t">
        <p className="text-gray-600">{configuracion.pie.texto}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Botones de acción */}
      <div className="flex justify-end gap-3 mb-6">
        <Button variant="outline" onClick={handleDescargar}>
          <Download className="h-4 w-4 mr-2" />
          Descargar PDF
        </Button>
        <Button onClick={handleImprimir}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Vista previa del documento */}
      <Card className="print:shadow-none print:border-0 w-full">
        <CardContent className="p-8 print:p-4 min-h-[600px]">
          {renderizarEmpresa()}
          {renderizarDocumento()}
          {renderizarCliente()}
          {renderizarItems()}
          {renderizarTotales()}
          {renderizarPie()}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="text-sm text-gray-500 text-center">
        <p>Esta es una vista previa del formato. Los datos mostrados son de ejemplo.</p>
        <p>Al imprimir o descargar, se usarán los datos reales del pedido.</p>
      </div>
    </div>
  );
};

export default VistaPrevia;
