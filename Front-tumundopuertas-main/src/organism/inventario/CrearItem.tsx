import React, { useState } from "react";
import UpFile from "@/upfile/UpFile";
import ImageDisplay from "@/upfile/ImageDisplay";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useItems } from "@/hooks/useItems";

interface ItemForm {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: string;
  costo: string;
  costoProduccion: string; // Nuevo campo
  cantidad: string;
  activo: boolean;
  imagenes?: string[];
}

const CrearItem: React.FC = () => {
  const [item, setItem] = useState<ItemForm>({
    codigo: "271", // Mostrar 271 por defecto
    nombre: "",
    descripcion: "",
    categoria: "",
    precio: "",
    costo: "",
    costoProduccion: "", // Nuevo campo
    cantidad: "",
    activo: true,
    imagenes: [],
  });
  const [mensaje, setMensaje] = useState<string>("");
  const { loading, error } = useItems();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setItem((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setItem((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUploadSuccess = (objectName: string, idx: number) => {
    setItem((prev) => {
      const nuevas = [...(prev.imagenes ?? [])];
      nuevas[idx] = objectName;
      return { ...prev, imagenes: nuevas };
    });
    setMensaje(`Imagen ${idx + 1} actualizada ✅`);
    setTimeout(() => setMensaje(""), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !item.nombre ||
      !item.precio ||
      !item.costo ||
      !item.costoProduccion ||
      !item.cantidad ||
      !item.categoria
    ) {
      setMensaje("Completa los campos obligatorios.");
      return;
    }
    const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
    
    try {
      // Si el código es solo números (como "271"), enviarlo como vacío para que el backend genere automáticamente
      const codigoEnviar = item.codigo && /^\d+$/.test(item.codigo.trim()) ? "" : (item.codigo || "");
      
      const requestBody = {
        codigo: codigoEnviar, // Si es solo números, enviar vacío para generación automática
        nombre: item.nombre,
        descripcion: item.descripcion,
        categoria: item.categoria,
        precio: parseFloat(item.precio),
        costo: parseFloat(item.costo),
        costoProduccion: parseFloat(item.costoProduccion),
        cantidad: parseInt(item.cantidad, 10),
        activo: item.activo,
        imagenes: item.imagenes ?? [],
      };
      
      console.log("📤 Enviando item al backend:", requestBody);
      
      const res = await fetch(`${apiUrl}/inventario/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log("📥 Respuesta del backend:", res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error del backend:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || "Error desconocido" };
        }
        setMensaje(`Error: ${errorData.detail || "No se pudo crear el item"}`);
        return;
      }
      
      const result = await res.json();
      console.log("✅ Item creado exitosamente:", result);
      
      if (!result || !result.id) {
        console.error("❌ Respuesta del backend no tiene ID:", result);
        setMensaje("Error: No se recibió confirmación del servidor. El item puede no haberse creado.");
        return;
      }
      
      const codigoUsado = result.codigo || item.codigo || "generado automáticamente";
      
      // Si se generó un código automático, mostrarlo en el campo código
      // También si el código era solo números (como "271")
      if (!item.codigo || item.codigo.trim() === "" || /^\d+$/.test(item.codigo.trim())) {
        setMensaje(`Item creado correctamente ✅\nCódigo asignado: ${codigoUsado}`);
        
        // Extraer el número del código generado y calcular el siguiente
        const numeroMatch = codigoUsado.match(/ITEM-(\d+)/);
        const siguienteNumero = numeroMatch ? (parseInt(numeroMatch[1]) + 1).toString() : "272";
        
        // Inmediatamente mostrar el siguiente número en la secuencia
        setItem({
          codigo: siguienteNumero, // Mostrar el siguiente número inmediatamente
          nombre: "",
          descripcion: "",
          categoria: "",
          precio: "",
          costo: "",
          costoProduccion: "",
          cantidad: "",
          activo: true,
          imagenes: [],
        });
        
        // Limpiar el mensaje después de 3 segundos
        setTimeout(() => {
          setMensaje("");
        }, 3000);
      } else {
        setMensaje("Item creado correctamente ✅");
        // Si se usó un código personalizado, mostrar el siguiente número de la secuencia
        const numeroMatch = codigoUsado.match(/ITEM-(\d+)/);
        const siguienteNumero = numeroMatch ? (parseInt(numeroMatch[1]) + 1).toString() : "271";
        
        setItem({
          codigo: siguienteNumero, // Mostrar el siguiente número
          nombre: "",
          descripcion: "",
          categoria: "",
          precio: "",
          costo: "",
          costoProduccion: "",
          cantidad: "",
          activo: true,
          imagenes: [],
        });
      }
    } catch (err: any) {
      setMensaje(`Error: ${err.message || "Error al crear el item"}`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-200 mt-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Crear Item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="codigo">Código (opcional - se generará automáticamente si se deja vacío)</Label>
            <Input
              id="codigo"
              name="codigo"
              value={item.codigo}
              onChange={handleChange}
              placeholder="271, 272, 273..."
              className={`mt-1 ${item.codigo && item.codigo.startsWith('ITEM-') ? 'bg-green-50 border-green-300 font-semibold' : ''}`}
              readOnly={!!(item.codigo && item.codigo.startsWith('ITEM-') && !item.nombre)}
            />
            {item.codigo && item.codigo.startsWith('ITEM-') && !item.nombre && (
              <p className="text-xs text-green-600 mt-1">✓ Código generado automáticamente</p>
            )}
          </div>
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              name="nombre"
              value={item.nombre}
              onChange={handleChange}
              placeholder="Nombre del item"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              name="descripcion"
              value={item.descripcion}
              onChange={handleChange}
              placeholder="Descripción"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="categoria">Categoría</Label>
            <Input
              id="categoria"
              name="categoria"
              value={item.categoria}
              onChange={handleChange}
              placeholder="Categoría"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="precio">Precio</Label>
            <Input
              id="precio"
              name="precio"
              type="number"
              min="0"
              step="0.01"
              value={item.precio}
              onChange={handleChange}
              placeholder="Precio"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="costo">Costo</Label>
            <Input
              id="costo"
              name="costo"
              type="number"
              min="0"
              step="0.01"
              value={item.costo}
              onChange={handleChange}
              placeholder="Costo"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="costoProduccion">Costo Producción</Label>
            <Input
              id="costoProduccion"
              name="costoProduccion"
              type="number"
              min="0"
              step="0.01"
              value={item.costoProduccion}
              onChange={handleChange}
              placeholder="Costo de producción empleado"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              id="cantidad"
              name="cantidad"
              type="number"
              min="0"
              value={item.cantidad}
              onChange={handleChange}
              placeholder="Cantidad"
              className="mt-1"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="activo"
              name="activo"
              type="checkbox"
              checked={item.activo}
              onChange={handleChange}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <Label htmlFor="activo">Activo</Label>
          </div>
          {/* Imágenes */}
          <div>
            <Label>Imágenes del item (máx. 3)</Label>
            <div className="flex gap-4 flex-wrap mt-2">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  {item.imagenes?.[idx] ? (
                    <ImageDisplay
                      imageName={item.imagenes[idx]}
                      alt={`Imagen ${idx + 1}`}
                      style={{
                        maxWidth: 90,
                        maxHeight: 90,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    />
                  ) : (
                    <div className="w-[90px] h-[90px] bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                      Sin imagen
                    </div>
                  )}
                  <UpFile
                    label={item.imagenes?.[idx] ? "Actualizar" : "Subir"}
                    allowedFileTypes={["image/*"]}
                    maxSizeMB={5}
                    initialFileUrl={item.imagenes?.[idx]}
                    objectPath="items/"
                    onUploadSuccess={(objectName) =>
                      handleUploadSuccess(objectName, idx)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <Button
            type="submit"
            className="w-full mt-4 font-bold py-2"
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear Item"}
          </Button>
        </form>
        {mensaje && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-center text-green-700 font-semibold whitespace-pre-line">
              {mensaje}
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center text-red-700 font-semibold">
              {error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CrearItem;
