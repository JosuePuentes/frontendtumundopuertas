import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import EditorFormato from './EditorFormato';
import VistaPrevia from './VistaPrevia';

export interface FormatoImpresion {
  id: string;
  nombre: string;
  tipo: 'preliminar' | 'nota_entrega';
  activo: boolean;
  configuracion: ConfiguracionFormato;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface ConfiguracionFormato {
  empresa: {
    mostrar: boolean;
    nombre: string;
    rif: string;
    direccion: string;
    telefono: string;
    email: string;
  };
  logo: {
    mostrar: boolean;
    url: string;
    posicion: 'izquierda' | 'centro' | 'derecha';
    tamaño: 'pequeño' | 'mediano' | 'grande';
  };
  cliente: {
    mostrar: boolean;
    incluirNombre: boolean;
    incluirDireccion: boolean;
    incluirCedula: boolean;
    incluirTelefono: boolean;
  };
  documento: {
    titulo: string;
    numeroDocumento: string;
    fecha: string;
  };
  items: {
    mostrar: boolean;
    columnas: string[];
  };
  totales: {
    mostrar: boolean;
    incluirSubtotal: boolean;
    incluirIva: boolean;
    incluirTotal: boolean;
    incluirAbonado: boolean;
    incluirRestante: boolean;
  };
  pie: {
    mostrar: boolean;
    texto: string;
  };
}

const FormatosImpresion: React.FC = () => {
  const [formatos, setFormatos] = useState<FormatoImpresion[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isVistaPreviaOpen, setIsVistaPreviaOpen] = useState(false);
  const [formatoSeleccionado, setFormatoSeleccionado] = useState<FormatoImpresion | null>(null);
  const [modoEdicion, setModoEdicion] = useState<'crear' | 'editar'>('crear');
  const [nuevoFormato, setNuevoFormato] = useState({
    nombre: '',
    tipo: 'preliminar' as 'preliminar' | 'nota_entrega'
  });

  // Configuración por defecto
  const configuracionPorDefecto: ConfiguracionFormato = {
    empresa: {
      mostrar: true,
      nombre: 'Tu Mundo Puertas',
      rif: 'J-12345678-9',
      direccion: 'Dirección de la empresa',
      telefono: '+58 123-456-7890',
      email: 'info@tumundopuertas.com'
    },
    logo: {
      mostrar: true,
      url: '/puertalogo.PNG',
      posicion: 'izquierda',
      tamaño: 'mediano'
    },
    cliente: {
      mostrar: true,
      incluirNombre: true,
      incluirDireccion: true,
      incluirCedula: true,
      incluirTelefono: false
    },
    documento: {
      titulo: 'Preliminar de Pago',
      numeroDocumento: 'PREL-001',
      fecha: new Date().toLocaleDateString('es-ES')
    },
    items: {
      mostrar: true,
      columnas: ['descripcion', 'cantidad', 'precio', 'subtotal']
    },
    totales: {
      mostrar: true,
      incluirSubtotal: true,
      incluirIva: false,
      incluirTotal: true,
      incluirAbonado: true,
      incluirRestante: true
    },
    pie: {
      mostrar: true,
      texto: 'Gracias por su preferencia'
    }
  };

  useEffect(() => {
    cargarFormatos();
  }, []);

  const cargarFormatos = async () => {
    try {
      // Simular carga de formatos (en producción sería una llamada a la API)
      const formatosSimulados: FormatoImpresion[] = [
        {
          id: '1',
          nombre: 'Preliminar Estándar',
          tipo: 'preliminar',
          activo: true,
          configuracion: configuracionPorDefecto,
          fechaCreacion: '2024-01-15',
          fechaModificacion: '2024-01-15'
        },
        {
          id: '2',
          nombre: 'Nota de Entrega Básica',
          tipo: 'nota_entrega',
          activo: true,
          configuracion: {
            ...configuracionPorDefecto,
            documento: {
              ...configuracionPorDefecto.documento,
              titulo: 'Nota de Entrega'
            }
          },
          fechaCreacion: '2024-01-15',
          fechaModificacion: '2024-01-15'
        }
      ];
      setFormatos(formatosSimulados);
    } catch (error) {
      console.error('Error al cargar formatos:', error);
    }
  };

  const handleCrearFormato = () => {
    setModoEdicion('crear');
    setFormatoSeleccionado(null);
    setIsEditorOpen(true);
  };

  const handleEditarFormato = (formato: FormatoImpresion) => {
    setModoEdicion('editar');
    setFormatoSeleccionado(formato);
    setIsEditorOpen(true);
  };

  const handleVistaPrevia = (formato: FormatoImpresion) => {
    setFormatoSeleccionado(formato);
    setIsVistaPreviaOpen(true);
  };

  const handleGuardarFormato = (configuracion: ConfiguracionFormato) => {
    if (modoEdicion === 'crear') {
      const nuevoFormato: FormatoImpresion = {
        id: Date.now().toString(),
        nombre: "Nuevo Formato",
        tipo: "preliminar",
        activo: true,
        configuracion,
        fechaCreacion: new Date().toISOString(),
        fechaModificacion: new Date().toISOString()
      };
      setFormatos([...formatos, nuevoFormato]);
    } else if (formatoSeleccionado) {
      const formatosActualizados = formatos.map(f => 
        f.id === formatoSeleccionado.id 
          ? { ...f, configuracion, fechaModificacion: new Date().toISOString() }
          : f
      );
      setFormatos(formatosActualizados);
    }
    setIsEditorOpen(false);
    setNuevoFormato({ nombre: '', tipo: 'preliminar' });
  };

  const handleEliminarFormato = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este formato?')) {
      setFormatos(formatos.filter(f => f.id !== id));
    }
  };

  const handleToggleActivo = (id: string) => {
    setFormatos(formatos.map(f => 
      f.id === id ? { ...f, activo: !f.activo } : f
    ));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Formatos de Impresión</h1>
          <p className="text-gray-600">Gestiona los formatos de impresión para preliminares y notas de entrega</p>
        </div>
        <Button onClick={handleCrearFormato} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Formato
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formatos.map((formato) => (
          <Card key={formato.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{formato.nombre}</CardTitle>
                  <CardDescription>
                    {formato.tipo === 'preliminar' ? 'Preliminar de Pago' : 'Nota de Entrega'}
                  </CardDescription>
                </div>
                <Badge variant={formato.activo ? 'default' : 'secondary'}>
                  {formato.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>Empresa:</strong> {formato.configuracion.empresa.mostrar ? 'Sí' : 'No'}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Cliente:</strong> {formato.configuracion.cliente.mostrar ? 'Sí' : 'No'}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Items:</strong> {formato.configuracion.items.mostrar ? 'Sí' : 'No'}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Totales:</strong> {formato.configuracion.totales.mostrar ? 'Sí' : 'No'}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVistaPrevia(formato)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Vista Previa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditarFormato(formato)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActivo(formato.id)}
                >
                  {formato.activo ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEliminarFormato(formato.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Creación/Edición */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modoEdicion === 'crear' ? 'Crear Nuevo Formato' : 'Editar Formato'}
            </DialogTitle>
          </DialogHeader>
          
          {modoEdicion === 'crear' && (
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="nombre">Nombre del Formato</Label>
                <Input
                  id="nombre"
                  value={nuevoFormato.nombre}
                  onChange={(e) => setNuevoFormato({ ...nuevoFormato, nombre: e.target.value })}
                  placeholder="Ej: Preliminar Estándar"
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo de Formato</Label>
                <select
                  id="tipo"
                  value={nuevoFormato.tipo}
                  onChange={(e) => setNuevoFormato({ ...nuevoFormato, tipo: e.target.value as 'preliminar' | 'nota_entrega' })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="preliminar">Preliminar de Pago</option>
                  <option value="nota_entrega">Nota de Entrega</option>
                </select>
              </div>
            </div>
          )}

          <EditorFormato
            configuracionInicial={formatoSeleccionado?.configuracion || configuracionPorDefecto}
            onGuardar={handleGuardarFormato}
            onCancelar={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Vista Previa */}
      <Dialog open={isVistaPreviaOpen} onOpenChange={setIsVistaPreviaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa - {formatoSeleccionado?.nombre}</DialogTitle>
          </DialogHeader>
          
          {formatoSeleccionado && (
            <VistaPrevia
              configuracion={formatoSeleccionado.configuracion}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormatosImpresion;
