import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Save, X } from 'lucide-react';
import type { ConfiguracionFormato } from './FormatosImpresion';

interface EditorFormatoProps {
  configuracionInicial: ConfiguracionFormato;
  onGuardar: (configuracion: ConfiguracionFormato) => void;
  onCancelar: () => void;
}

const EditorFormato: React.FC<EditorFormatoProps> = ({
  configuracionInicial,
  onGuardar,
  onCancelar
}) => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionFormato>(configuracionInicial);
  const [seccionActiva, setSeccionActiva] = useState<string>('empresa');

  const actualizarConfiguracion = (seccion: keyof ConfiguracionFormato, campo: string, valor: any) => {
    setConfiguracion(prev => ({
      ...prev,
      [seccion]: {
        ...prev[seccion],
        [campo]: valor
      }
    }));
  };

  const actualizarConfiguracionEmpresa = (campo: string, valor: any) => {
    actualizarConfiguracion('empresa', campo, valor);
  };

  const actualizarConfiguracionLogo = (campo: string, valor: any) => {
    actualizarConfiguracion('logo', campo, valor);
  };

  const actualizarConfiguracionCliente = (campo: string, valor: any) => {
    actualizarConfiguracion('cliente', campo, valor);
  };

  const actualizarConfiguracionDocumento = (campo: string, valor: any) => {
    actualizarConfiguracion('documento', campo, valor);
  };

  const actualizarConfiguracionItems = (campo: string, valor: any) => {
    actualizarConfiguracion('items', campo, valor);
  };

  const actualizarConfiguracionTotales = (campo: string, valor: any) => {
    actualizarConfiguracion('totales', campo, valor);
  };

  const actualizarConfiguracionPie = (campo: string, valor: any) => {
    actualizarConfiguracion('pie', campo, valor);
  };

  const actualizarConfiguracionPapel = (campo: string, valor: any) => {
    actualizarConfiguracion('papel', campo, valor);
  };

  const actualizarConfiguracionMargenes = (campo: string, valor: any) => {
    setConfiguracion(prev => ({
      ...prev,
      papel: {
        ...prev.papel,
        margenes: {
          ...prev.papel.margenes,
          [campo]: valor
        }
      }
    }));
  };

  const secciones = [
    { id: 'empresa', nombre: 'Información de Empresa', icono: '🏢' },
    { id: 'logo', nombre: 'Logo', icono: '🖼️' },
    { id: 'cliente', nombre: 'Información del Cliente', icono: '👤' },
    { id: 'documento', nombre: 'Documento', icono: '📄' },
    { id: 'items', nombre: 'Items', icono: '📦' },
    { id: 'totales', nombre: 'Totales', icono: '💰' },
    { id: 'pie', nombre: 'Pie de Página', icono: '📝' },
    { id: 'papel', nombre: 'Configuración de Papel', icono: '📋' }
  ];

  const renderizarSeccionEmpresa = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="mostrar-empresa"
          checked={configuracion.empresa.mostrar}
          onCheckedChange={(checked) => actualizarConfiguracionEmpresa('mostrar', checked)}
        />
        <Label htmlFor="mostrar-empresa">Mostrar información de empresa</Label>
      </div>

      {configuracion.empresa.mostrar && (
        <div className="space-y-4 pl-6">
          <div>
            <Label htmlFor="nombre-empresa">Nombre de la Empresa</Label>
            <Input
              id="nombre-empresa"
              value={configuracion.empresa.nombre}
              onChange={(e) => actualizarConfiguracionEmpresa('nombre', e.target.value)}
              placeholder="Ej: Tu Mundo Puertas"
            />
          </div>
          <div>
            <Label htmlFor="rif-empresa">RIF</Label>
            <Input
              id="rif-empresa"
              value={configuracion.empresa.rif}
              onChange={(e) => actualizarConfiguracionEmpresa('rif', e.target.value)}
              placeholder="Ej: J-12345678-9"
            />
          </div>
          <div>
            <Label htmlFor="direccion-empresa">Dirección</Label>
            <Input
              id="direccion-empresa"
              value={configuracion.empresa.direccion}
              onChange={(e) => actualizarConfiguracionEmpresa('direccion', e.target.value)}
              placeholder="Dirección completa"
            />
          </div>
          <div>
            <Label htmlFor="telefono-empresa">Teléfono</Label>
            <Input
              id="telefono-empresa"
              value={configuracion.empresa.telefono}
              onChange={(e) => actualizarConfiguracionEmpresa('telefono', e.target.value)}
              placeholder="Ej: +58 123-456-7890"
            />
          </div>
          <div>
            <Label htmlFor="email-empresa">Email</Label>
            <Input
              id="email-empresa"
              value={configuracion.empresa.email}
              onChange={(e) => actualizarConfiguracionEmpresa('email', e.target.value)}
              placeholder="Ej: info@empresa.com"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderizarSeccionLogo = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="mostrar-logo"
          checked={configuracion.logo.mostrar}
          onCheckedChange={(checked) => actualizarConfiguracionLogo('mostrar', checked)}
        />
        <Label htmlFor="mostrar-logo">Mostrar logo</Label>
      </div>

      {configuracion.logo.mostrar && (
        <div className="space-y-4 pl-6">
          <div>
            <Label htmlFor="url-logo">URL del Logo</Label>
            <Input
              id="url-logo"
              value={configuracion.logo.url}
              onChange={(e) => actualizarConfiguracionLogo('url', e.target.value)}
              placeholder="/logo.png"
            />
          </div>
          <div>
            <Label htmlFor="posicion-logo">Posición</Label>
            <Select
              value={configuracion.logo.posicion}
              onValueChange={(value) => actualizarConfiguracionLogo('posicion', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="izquierda">Izquierda</SelectItem>
                <SelectItem value="centro">Centro</SelectItem>
                <SelectItem value="derecha">Derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tamaño-logo">Tamaño</Label>
            <Select
              value={configuracion.logo.tamaño}
              onValueChange={(value) => actualizarConfiguracionLogo('tamaño', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pequeño">Pequeño</SelectItem>
                <SelectItem value="mediano">Mediano</SelectItem>
                <SelectItem value="grande">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );

  const renderizarSeccionCliente = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="mostrar-cliente"
          checked={configuracion.cliente.mostrar}
          onCheckedChange={(checked) => actualizarConfiguracionCliente('mostrar', checked)}
        />
        <Label htmlFor="mostrar-cliente">Mostrar información del cliente</Label>
      </div>

      {configuracion.cliente.mostrar && (
        <div className="space-y-4 pl-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-nombre-cliente"
              checked={configuracion.cliente.incluirNombre}
              onCheckedChange={(checked) => actualizarConfiguracionCliente('incluirNombre', checked)}
            />
            <Label htmlFor="incluir-nombre-cliente">Incluir nombre</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-direccion-cliente"
              checked={configuracion.cliente.incluirDireccion}
              onCheckedChange={(checked) => actualizarConfiguracionCliente('incluirDireccion', checked)}
            />
            <Label htmlFor="incluir-direccion-cliente">Incluir dirección</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-cedula-cliente"
              checked={configuracion.cliente.incluirCedula}
              onCheckedChange={(checked) => actualizarConfiguracionCliente('incluirCedula', checked)}
            />
            <Label htmlFor="incluir-cedula-cliente">Incluir cédula</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-telefono-cliente"
              checked={configuracion.cliente.incluirTelefono}
              onCheckedChange={(checked) => actualizarConfiguracionCliente('incluirTelefono', checked)}
            />
            <Label htmlFor="incluir-telefono-cliente">Incluir teléfono</Label>
          </div>
        </div>
      )}
    </div>
  );

  const renderizarSeccionDocumento = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="titulo-documento">Título del Documento</Label>
        <Input
          id="titulo-documento"
          value={configuracion.documento.titulo}
          onChange={(e) => actualizarConfiguracionDocumento('titulo', e.target.value)}
          placeholder="Ej: Preliminar de Pago"
        />
      </div>
      <div>
        <Label htmlFor="numero-documento">Número de Documento</Label>
        <Input
          id="numero-documento"
          value={configuracion.documento.numeroDocumento}
          onChange={(e) => actualizarConfiguracionDocumento('numeroDocumento', e.target.value)}
          placeholder="Ej: PREL-001"
        />
      </div>
      <div>
        <Label htmlFor="fecha-documento">Fecha</Label>
        <Input
          id="fecha-documento"
          value={configuracion.documento.fecha}
          onChange={(e) => actualizarConfiguracionDocumento('fecha', e.target.value)}
          placeholder="Ej: 15/01/2024"
        />
      </div>
    </div>
  );

  const renderizarSeccionItems = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="mostrar-items"
          checked={configuracion.items.mostrar}
          onCheckedChange={(checked) => actualizarConfiguracionItems('mostrar', checked)}
        />
        <Label htmlFor="mostrar-items">Mostrar tabla de items</Label>
      </div>

      {configuracion.items.mostrar && (
        <div className="pl-6">
          <Label>Columnas a mostrar:</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {['descripcion', 'cantidad', 'precio', 'subtotal', 'iva'].map((columna) => (
              <div key={columna} className="flex items-center space-x-2">
                <Checkbox
                  id={`columna-${columna}`}
                  checked={configuracion.items.columnas.includes(columna)}
                  onCheckedChange={(checked) => {
                    const nuevasColumnas = checked
                      ? [...configuracion.items.columnas, columna]
                      : configuracion.items.columnas.filter(c => c !== columna);
                    actualizarConfiguracionItems('columnas', nuevasColumnas);
                  }}
                />
                <Label htmlFor={`columna-${columna}`} className="capitalize">
                  {columna === 'descripcion' ? 'Descripción' : columna}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderizarSeccionTotales = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="mostrar-totales"
          checked={configuracion.totales.mostrar}
          onCheckedChange={(checked) => actualizarConfiguracionTotales('mostrar', checked)}
        />
        <Label htmlFor="mostrar-totales">Mostrar sección de totales</Label>
      </div>

      {configuracion.totales.mostrar && (
        <div className="space-y-4 pl-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-subtotal"
              checked={configuracion.totales.incluirSubtotal}
              onCheckedChange={(checked) => actualizarConfiguracionTotales('incluirSubtotal', checked)}
            />
            <Label htmlFor="incluir-subtotal">Incluir subtotal</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-iva"
              checked={configuracion.totales.incluirIva}
              onCheckedChange={(checked) => actualizarConfiguracionTotales('incluirIva', checked)}
            />
            <Label htmlFor="incluir-iva">Incluir IVA</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-total"
              checked={configuracion.totales.incluirTotal}
              onCheckedChange={(checked) => actualizarConfiguracionTotales('incluirTotal', checked)}
            />
            <Label htmlFor="incluir-total">Incluir total</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-abonado"
              checked={configuracion.totales.incluirAbonado}
              onCheckedChange={(checked) => actualizarConfiguracionTotales('incluirAbonado', checked)}
            />
            <Label htmlFor="incluir-abonado">Incluir abonado</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-restante"
              checked={configuracion.totales.incluirRestante}
              onCheckedChange={(checked) => actualizarConfiguracionTotales('incluirRestante', checked)}
            />
            <Label htmlFor="incluir-restante">Incluir restante</Label>
          </div>
        </div>
      )}
    </div>
  );

  const renderizarSeccionPie = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="mostrar-pie"
          checked={configuracion.pie.mostrar}
          onCheckedChange={(checked) => actualizarConfiguracionPie('mostrar', checked)}
        />
        <Label htmlFor="mostrar-pie">Mostrar pie de página</Label>
      </div>

      {configuracion.pie.mostrar && (
        <div className="pl-6">
          <Label htmlFor="texto-pie">Texto del pie de página</Label>
          <Input
            id="texto-pie"
            value={configuracion.pie.texto}
            onChange={(e) => actualizarConfiguracionPie('texto', e.target.value)}
            placeholder="Ej: Gracias por su preferencia"
          />
        </div>
      )}
    </div>
  );

  const renderizarSeccionPapel = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="tamaño-papel">Tamaño de Papel</Label>
        <Select
          value={configuracion.papel.tamaño}
          onValueChange={(value) => actualizarConfiguracionPapel('tamaño', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="carta">Carta (8.5" x 11")</SelectItem>
            <SelectItem value="media_carta">Media Carta (8.5" x 5.5")</SelectItem>
            <SelectItem value="oficio">Oficio (8.5" x 13")</SelectItem>
            <SelectItem value="a4">A4 (210mm x 297mm)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="orientacion-papel">Orientación</Label>
        <Select
          value={configuracion.papel.orientacion}
          onValueChange={(value) => actualizarConfiguracionPapel('orientacion', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vertical">Vertical (Portrait)</SelectItem>
            <SelectItem value="horizontal">Horizontal (Landscape)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Márgenes (mm)</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Label htmlFor="margen-superior">Superior</Label>
            <Input
              id="margen-superior"
              type="number"
              value={configuracion.papel.margenes.superior}
              onChange={(e) => actualizarConfiguracionMargenes('superior', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="margen-inferior">Inferior</Label>
            <Input
              id="margen-inferior"
              type="number"
              value={configuracion.papel.margenes.inferior}
              onChange={(e) => actualizarConfiguracionMargenes('inferior', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="margen-izquierdo">Izquierdo</Label>
            <Input
              id="margen-izquierdo"
              type="number"
              value={configuracion.papel.margenes.izquierdo}
              onChange={(e) => actualizarConfiguracionMargenes('izquierdo', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="margen-derecho">Derecho</Label>
            <Input
              id="margen-derecho"
              type="number"
              value={configuracion.papel.margenes.derecho}
              onChange={(e) => actualizarConfiguracionMargenes('derecho', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderizarContenidoSeccion = () => {
    switch (seccionActiva) {
      case 'empresa':
        return renderizarSeccionEmpresa();
      case 'logo':
        return renderizarSeccionLogo();
      case 'cliente':
        return renderizarSeccionCliente();
      case 'documento':
        return renderizarSeccionDocumento();
      case 'items':
        return renderizarSeccionItems();
      case 'totales':
        return renderizarSeccionTotales();
      case 'pie':
        return renderizarSeccionPie();
      case 'papel':
        return renderizarSeccionPapel();
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar de secciones */}
      <div className="w-64 border-r p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Configuración</h3>
        <div className="space-y-2">
          {secciones.map((seccion) => (
            <button
              key={seccion.id}
              onClick={() => setSeccionActiva(seccion.id)}
              className={`w-full text-left p-3 rounded-md transition-colors ${
                seccionActiva === seccion.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{seccion.icono}</span>
                <span className="text-sm">{seccion.nombre}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            {secciones.find(s => s.id === seccionActiva)?.nombre}
          </h2>
          <p className="text-gray-600 text-sm">
            Configura los elementos que aparecerán en el formato de impresión
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {renderizarContenidoSeccion()}
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onCancelar}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={() => onGuardar(configuracion)}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Formato
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorFormato;
