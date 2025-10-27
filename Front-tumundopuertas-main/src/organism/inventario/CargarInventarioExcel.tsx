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
  apartado?: boolean;
}

const CargarInventarioExcel: React.FC = () => {
  // Estados para Inventario Normal
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [fileName, setFileName] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Estados para Apartados
  const [itemsApartados, setItemsApartados] = useState<InventarioItem[]>([]);
  const [fileNameApartados, setFileNameApartados] = useState('');
  const [mensajeApartados, setMensajeApartados] = useState('');

  const [showInventoryPreview, setShowInventoryPreview] = useState(false);
  const [showApartadosPreview, setShowApartadosPreview] = useState(false);
  const { data: currentInventory, fetchItems } = useItems();

  // Estados para búsqueda
  const [searchTermInventario, setSearchTermInventario] = useState('');
  const [searchTermApartados, setSearchTermApartados] = useState('');

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

  // Función para cargar archivo Excel para Apartados
  const handleFileUploadApartados = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileNameApartados(file.name);
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
            cantidad: 0, // Sin existencia para apartados
            precio: Number(row.precio || 0),
            activo: true,
            imagenes: [],
            apartado: true,
          }));

          setItemsApartados(mappedItems);
          setMensajeApartados(`Se cargaron ${mappedItems.length} items del archivo para apartados.`);
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          setMensajeApartados('Error al leer el archivo de Excel. Asegúrate de que el formato es correcto.');
          setItemsApartados([]);
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

  const handleGuardarApartados = async () => {
    if (itemsApartados.length === 0) {
      setMensajeApartados('No hay items para guardar como apartados.');
      return;
    }

    setMensajeApartados('Guardando inventario como apartados...');
    console.log('Datos a enviar al backend para guardar como apartados:', itemsApartados);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const response = await fetch(`${apiUrl}/inventario/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemsApartados),
      });
      if (!response.ok) {
        throw new Error('Error al guardar como apartados.');
      }
      setMensajeApartados('Inventario guardado como apartados correctamente.');
      setItemsApartados([]);
      setFileNameApartados('');
      fetchItems(`${apiUrl}/inventario/all`);
    } catch (error: any) {
      console.error(error);
      setMensajeApartados(`Error al guardar como apartados: ${error.message}`);
    }
  };

  const handleActualizarApartados = async () => {
    if (itemsApartados.length === 0) {
      setMensajeApartados('No hay items para actualizar como apartados.');
      return;
    }

    setMensajeApartados('Actualizando apartados...');
    console.log('Datos a enviar al backend para actualizar apartados:', itemsApartados);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const response = await fetch(`${apiUrl}/inventario/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemsApartados),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar apartados.');
      }
      setMensajeApartados('Apartados actualizados correctamente.');
      setItemsApartados([]);
      setFileNameApartados('');
      fetchItems(`${apiUrl}/inventario/all`);
    } catch (error: any) {
      console.error(error);
      setMensajeApartados(`Error al actualizar apartados: ${error.message}`);
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

  const handleCancelUploadApartados = () => {
    setItemsApartados([]);
    setFileNameApartados('');
    setMensajeApartados('');
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    if (fileInputs[1]) {
      fileInputs[1].value = '';
    }
  };

  const handleShowInventoryPreview = () => {
    fetchItems(`${apiUrl}/inventario/all`);
    setShowInventoryPreview(true);
  };

  const handleShowApartadosPreview = () => {
    fetchItems(`${apiUrl}/inventario/all`);
    setShowApartadosPreview(true);
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

  // Filtrar apartados por término de búsqueda
  const filteredApartados = useMemo(() => {
    if (!currentInventory) return [];
    if (!searchTermApartados) return currentInventory;
    
    const searchLower = searchTermApartados.toLowerCase();
    return currentInventory.filter((item: any) => 
      item.nombre?.toLowerCase().includes(searchLower) ||
      item.descripcion?.toLowerCase().includes(searchLower) ||
      item.codigo?.toLowerCase().includes(searchLower) ||
      item.modelo?.toLowerCase().includes(searchLower)
    );
  }, [currentInventory, searchTermApartados]);

  return (
    <div className="w-full max-w-6xl mx-auto my-8 space-y-8">
      {/* Card de Inventario Normal */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
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

      {/* Card de Apartados */}
      <Card>
        <CardHeader>
          <CardTitle>Apartados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <p>
              Selecciona un archivo de Excel (.xlsx) con las columnas: `codigo`, `descripcion`, `modelo`, `costo`, `existencia`, `precio`.
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUploadApartados}
                className="max-w-sm"
              />
              {fileNameApartados && <p className="text-sm text-gray-600">{fileNameApartados}</p>}
              {fileNameApartados && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelUploadApartados}
                >
                  Cancelar
                </Button>
              )}
            </div>

            {mensajeApartados && <p className="text-sm font-medium">{mensajeApartados}</p>}

            {itemsApartados.length > 0 && (
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
                      {itemsApartados.map((item, index) => (
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
                  <Button onClick={handleGuardarApartados}>
                    Guardar Apartados
                  </Button>
                  <Button onClick={handleActualizarApartados} variant="outline">
                    Actualizar Apartados
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
                          <TableCell>{item.cantidad}</TableCell>
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

      {/* Preview de Apartados */}
      <Card>
        <CardHeader>
          <CardTitle>Ver Preliminar de Apartados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button onClick={handleShowApartadosPreview} className="w-full">
              Ver Preliminar de mis Apartados
            </Button>

            {showApartadosPreview && currentInventory && currentInventory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Apartados Actuales (Todos los items del inventario sin existencia)</h3>
                
                {/* Buscador */}
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, descripción, código o modelo..."
                    value={searchTermApartados}
                    onChange={(e) => setSearchTermApartados(e.target.value)}
                    className="w-full"
                  />
                  {searchTermApartados && (
                    <p className="text-sm text-gray-600 mt-2">
                      Mostrando {filteredApartados.length} de {currentInventory.length} items
                    </p>
                  )}
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
                      {filteredApartados.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.codigo}</TableCell>
                          <TableCell>{item.descripcion}</TableCell>
                          <TableCell>{item.modelo}</TableCell>
                          <TableCell>{item.costo}</TableCell>
                          <TableCell>0</TableCell>
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
    </div>
  );
};

export default CargarInventarioExcel;