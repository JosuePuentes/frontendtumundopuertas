import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useItems } from '@/hooks/useItems';

interface InventarioItem {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  modelo: string;
  costo: number;
  costoProduccion: number;
  cantidad: number;
  precio: number;
  activo: boolean;
  imagenes: string[];
}

const CargarInventarioExcel: React.FC = () => {
  // Estados para Inventario Normal
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [fileName, setFileName] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [showInventoryPreview, setShowInventoryPreview] = useState(false);
  const { data: currentInventory, fetchItems } = useItems();

  // Estados para búsqueda
  const [searchTermInventario, setSearchTermInventario] = useState('');
  
  // Estados para cargar/descargar existencias
  const [modalBuscarOpen, setModalBuscarOpen] = useState(false);
  const [modalConfirmarOpen, setModalConfirmarOpen] = useState(false);
  const [tipoOperacion, setTipoOperacion] = useState<'cargar' | 'descargar' | null>(null);
  const [busquedaItem, setBusquedaItem] = useState('');
  const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
  const [cantidadOperacion, setCantidadOperacion] = useState<string>('');
  const [procesando, setProcesando] = useState(false);

  const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');

  // Función para cargar archivo Excel para Inventario Normal
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<any>(worksheet);

          const mappedItems: InventarioItem[] = json.map((row) => ({
            codigo: String(row.codigo || ''),
            nombre: String(row.nombre || row.descripcion || 'Sin Nombre'),
            descripcion: String(row.descripcion || ''),
            categoria: String(row.categoria || 'General'),
            modelo: String(row.modelo || ''),
            costo: Number(row.costo || 0),
            costoProduccion: Number(row.costoProduccion || row.costo || 0),
            cantidad: Number(row.existencia || 0),
            precio: Number(row.precio || 0),
            activo: true,
            imagenes: [],
          }));

          setItems(mappedItems);
          setMensaje(`Se cargaron ${mappedItems.length} items del archivo.`);
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          setMensaje('Error al leer el archivo de Excel. Asegúrate de que el formato es correcto.');
          setItems([]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleGuardarInventario = async () => {
    if (items.length === 0) {
      setMensaje('No hay items para guardar.');
      return;
    }

    setMensaje('Guardando nuevo inventario...');
    console.log('Datos a enviar al backend para guardar:', items);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const response = await fetch(`${apiUrl}/inventario/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (!response.ok) {
        throw new Error('Error al guardar el nuevo inventario.');
      }
      setMensaje('Nuevo inventario guardado correctamente.');
      setItems([]);
      setFileName('');
      fetchItems(`${apiUrl}/inventario/all`);
    } catch (error: any) {
      console.error(error);
      setMensaje(`Error al guardar el nuevo inventario: ${error.message}`);
    }
  };

  const handleActualizarInventario = async () => {
    if (items.length === 0) {
      setMensaje('No hay items para actualizar.');
      return;
    }

    setMensaje('Actualizando inventario existente...');
    console.log('Datos a enviar al backend para actualizar:', items);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const response = await fetch(`${apiUrl}/inventario/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar el inventario.');
      }
      setMensaje('Inventario actualizado correctamente.');
      setItems([]);
      setFileName('');
      fetchItems(`${apiUrl}/inventario/all`);
    } catch (error: any) {
      console.error(error);
      setMensaje(`Error al actualizar el inventario: ${error.message}`);
    }
  };

  const handleCancelUpload = () => {
    setItems([]);
    setFileName('');
    setMensaje('');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleShowInventoryPreview = () => {
    fetchItems(`${apiUrl}/inventario/all`);
    setShowInventoryPreview(true);
  };

  const handleExportPdf = () => {
    setMensaje('Exportando a PDF... (funcionalidad no implementada)');
  };

  const handleExportExcel = () => {
    setMensaje('Exportando a Excel... (funcionalidad no implementada)');
  };

  // Filtrar inventario normal por término de búsqueda
  const filteredInventory = useMemo(() => {
    if (!currentInventory) return [];
    if (!searchTermInventario) return currentInventory;
    
    const searchLower = searchTermInventario.toLowerCase();
    return currentInventory.filter((item: any) => 
      item.nombre?.toLowerCase().includes(searchLower) ||
      item.descripcion?.toLowerCase().includes(searchLower) ||
      item.codigo?.toLowerCase().includes(searchLower) ||
      item.modelo?.toLowerCase().includes(searchLower)
    );
  }, [currentInventory, searchTermInventario]);

  // Filtrar items para el modal de búsqueda
  const itemsFiltrados = useMemo(() => {
    if (!currentInventory) return [];
    if (!busquedaItem) return currentInventory.slice(0, 20); // Limitar a 20 sin búsqueda
    
    const searchLower = busquedaItem.toLowerCase();
    return currentInventory.filter((item: any) => 
      item.nombre?.toLowerCase().includes(searchLower) ||
      item.descripcion?.toLowerCase().includes(searchLower) ||
      item.codigo?.toLowerCase().includes(searchLower) ||
      item.modelo?.toLowerCase().includes(searchLower)
    ).slice(0, 20);
  }, [currentInventory, busquedaItem]);

  // Funciones para cargar/descargar existencias
  const handleAbrirModalBuscar = (tipo: 'cargar' | 'descargar') => {
    setTipoOperacion(tipo);
    setBusquedaItem('');
    setItemSeleccionado(null);
    setCantidadOperacion('');
    fetchItems(`${apiUrl}/inventario/all`);
    setModalBuscarOpen(true);
  };

  const handleSeleccionarItem = (item: any) => {
    setItemSeleccionado(item);
    setModalBuscarOpen(false);
    setModalConfirmarOpen(true);
  };

  const handleConfirmarOperacion = async () => {
    if (!itemSeleccionado || !cantidadOperacion) {
      setMensaje('Por favor ingresa una cantidad válida.');
      return;
    }

    const cantidad = parseFloat(cantidadOperacion);
    if (isNaN(cantidad) || cantidad <= 0) {
      setMensaje('La cantidad debe ser un número mayor a 0.');
      return;
    }

    const existenciaActual = itemSeleccionado.cantidad !== undefined ? itemSeleccionado.cantidad : (itemSeleccionado.existencia || 0);
    if (tipoOperacion === 'descargar' && cantidad > existenciaActual) {
      setMensaje(`No puedes descargar más de lo disponible. Existencia actual: ${existenciaActual}`);
      return;
    }

    setProcesando(true);
    try {
      const url = `${apiUrl}/inventario/${itemSeleccionado._id}/existencia`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cantidad: cantidad,
          tipo: tipoOperacion, // 'cargar' o 'descargar'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error en la operación' }));
        throw new Error(errorData.detail || 'Error en la operación');
      }

      const result = await response.json();
      const nuevaExistencia = result.cantidad !== undefined ? result.cantidad : (result.existencia || 0);
      setMensaje(`✅ ${tipoOperacion === 'cargar' ? 'Carga' : 'Descarga'} realizada exitosamente. Nueva existencia: ${nuevaExistencia}`);
      
      // Recargar inventario
      await fetchItems(`${apiUrl}/inventario/all`);
      
      // Cerrar modales y limpiar
      setModalConfirmarOpen(false);
      setItemSeleccionado(null);
      setCantidadOperacion('');
      setTipoOperacion(null);
      setBusquedaItem('');
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelarOperacion = () => {
    setModalConfirmarOpen(false);
    setModalBuscarOpen(false);
    setItemSeleccionado(null);
    setCantidadOperacion('');
    setTipoOperacion(null);
    setBusquedaItem('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-8 space-y-8">
      {/* Card de Inventario Normal */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Botones de Cargar/Descargar Existencia */}
            <div className="flex gap-4 mb-4">
              <Button
                onClick={() => handleAbrirModalBuscar('cargar')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                ➕ Cargar Existencia
              </Button>
              <Button
                onClick={() => handleAbrirModalBuscar('descargar')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                ➖ Descargar Existencia
              </Button>
            </div>
            
            <p>
              Selecciona un archivo de Excel (.xlsx) con las columnas: `codigo`, `descripcion`, `modelo`, `costo`, `existencia`, `precio`.
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="max-w-sm"
              />
              {fileName && <p className="text-sm text-gray-600">{fileName}</p>}
              {fileName && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelUpload}
                >
                  Cancelar
                </Button>
              )}
            </div>

            {mensaje && <p className="text-sm font-medium">{mensaje}</p>}

            {items.length > 0 && (
              <>
                <div className="max-h-96 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Existencia</TableHead>
                        <TableHead>Precio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.codigo}</TableCell>
                          <TableCell>{item.descripcion}</TableCell>
                          <TableCell>{item.modelo}</TableCell>
                          <TableCell>{item.costo}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>{item.precio}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end gap-4 mt-4">
                  <Button onClick={handleGuardarInventario}>
                    Guardar Nuevo Inventario
                  </Button>
                  <Button onClick={handleActualizarInventario} variant="outline">
                    Actualizar Inventario Existente
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview de Inventario */}
      <Card>
        <CardHeader>
          <CardTitle>Ver Preliminar de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button onClick={handleShowInventoryPreview} className="w-full">
              Ver Preliminar de mi Inventario
            </Button>

            {showInventoryPreview && currentInventory && currentInventory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Inventario Actual</h3>
                
                {/* Buscador */}
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, descripción, código o modelo..."
                    value={searchTermInventario}
                    onChange={(e) => setSearchTermInventario(e.target.value)}
                    className="w-full"
                  />
                  {searchTermInventario && (
                    <p className="text-sm text-gray-600 mt-2">
                      Mostrando {filteredInventory.length} de {currentInventory.length} items
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  <Button onClick={handleExportPdf} variant="outline">Exportar a PDF</Button>
                  <Button onClick={handleExportExcel} variant="outline">Exportar a Excel</Button>
                </div>
                <div className="max-h-96 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Existencia</TableHead>
                        <TableHead>Precio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.codigo}</TableCell>
                          <TableCell>{item.descripcion}</TableCell>
                          <TableCell>{item.modelo}</TableCell>
                          <TableCell>{item.costo}</TableCell>
                          <TableCell>{item.cantidad !== undefined ? item.cantidad : (item.existencia || 0)}</TableCell>
                          <TableCell>{item.precio}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Búsqueda de Item */}
      <Dialog open={modalBuscarOpen} onOpenChange={setModalBuscarOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Buscar Item para {tipoOperacion === 'cargar' ? 'Cargar' : 'Descargar'} Existencia
            </DialogTitle>
            <DialogDescription>
              Busca el item en tu inventario y selecciónalo para {tipoOperacion === 'cargar' ? 'cargar' : 'descargar'} existencia
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Buscar por código, nombre, descripción o modelo..."
              value={busquedaItem}
              onChange={(e) => setBusquedaItem(e.target.value)}
              className="w-full"
            />
            
            <ScrollArea className="h-[400px] border rounded-md">
              <div className="p-4">
                {itemsFiltrados.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No se encontraron items
                  </p>
                ) : (
                  <div className="space-y-2">
                    {itemsFiltrados.map((item: any) => (
                      <div
                        key={item._id}
                        onClick={() => handleSeleccionarItem(item)}
                        className="p-4 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">{item.nombre || item.descripcion}</p>
                            <p className="text-sm text-gray-600">Código: {item.codigo}</p>
                            {item.modelo && <p className="text-sm text-gray-600">Modelo: {item.modelo}</p>}
                            {item.descripcion && <p className="text-sm text-gray-600">{item.descripcion}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-700">Existencia Actual:</p>
                            <p className="text-xl font-bold text-blue-600">{item.cantidad !== undefined ? item.cantidad : (item.existencia || 0)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalBuscarOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación */}
      <Dialog open={modalConfirmarOpen} onOpenChange={setModalConfirmarOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Confirmar {tipoOperacion === 'cargar' ? 'Carga' : 'Descarga'} de Existencia
            </DialogTitle>
            <DialogDescription>
              Revisa los detalles antes de {tipoOperacion === 'cargar' ? 'cargar' : 'descargar'} la existencia
            </DialogDescription>
          </DialogHeader>
          
          {itemSeleccionado && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2">{itemSeleccionado.nombre || itemSeleccionado.descripcion}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Código:</span> {itemSeleccionado.codigo}
                  </div>
                  {itemSeleccionado.modelo && (
                    <div>
                      <span className="font-semibold">Modelo:</span> {itemSeleccionado.modelo}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Existencia Actual:</span>{' '}
                    <span className="text-blue-600 font-bold text-lg">
                      {itemSeleccionado.cantidad !== undefined ? itemSeleccionado.cantidad : (itemSeleccionado.existencia || 0)}
                    </span>
                  </div>
                  {tipoOperacion === 'cargar' ? (
                    <div>
                      <span className="font-semibold">Nueva Existencia:</span>{' '}
                      <span className="text-green-600 font-bold text-lg">
                        {(itemSeleccionado.cantidad !== undefined ? itemSeleccionado.cantidad : (itemSeleccionado.existencia || 0)) + (parseFloat(cantidadOperacion) || 0)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-semibold">Nueva Existencia:</span>{' '}
                      <span className="text-red-600 font-bold text-lg">
                        {(itemSeleccionado.cantidad !== undefined ? itemSeleccionado.cantidad : (itemSeleccionado.existencia || 0)) - (parseFloat(cantidadOperacion) || 0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Cantidad a {tipoOperacion === 'cargar' ? 'Cargar' : 'Descargar'}:
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cantidadOperacion}
                  onChange={(e) => setCantidadOperacion(e.target.value)}
                  placeholder="Ingresa la cantidad"
                  className="w-full"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelarOperacion} disabled={procesando}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarOperacion}
              disabled={procesando || !cantidadOperacion}
              className={
                tipoOperacion === 'cargar'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {procesando ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                  Procesando...
                </>
              ) : (
                `Confirmar ${tipoOperacion === 'cargar' ? 'Carga' : 'Descarga'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CargarInventarioExcel;