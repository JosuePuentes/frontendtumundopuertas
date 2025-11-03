import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

interface EnviarPedidoModalProps {
  open: boolean;
  onClose: () => void;
  items: Array<{
    itemId: string;
    item: any;
    cantidad: number;
  }>;
  total: number;
  onPedidoEnviado: () => void;
}

const EnviarPedidoModal: React.FC<EnviarPedidoModalProps> = ({
  open,
  onClose,
  items,
  total,
  onPedidoEnviado,
}) => {
  const [metodoPago, setMetodoPago] = useState("");
  const [numeroReferencia, setNumeroReferencia] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previewArchivo, setPreviewArchivo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea PNG o imagen
      if (file.type === "image/png" || file.type.startsWith("image/")) {
        setArchivo(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewArchivo(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError("Solo se permiten archivos PNG o imágenes");
      }
    }
  };

  const eliminarArchivo = () => {
    setArchivo(null);
    setPreviewArchivo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!metodoPago) {
      setError("Debes seleccionar un método de pago");
      return;
    }
    if (!numeroReferencia) {
      setError("Debes ingresar el número de referencia");
      return;
    }
    if (!archivo) {
      setError("Debes adjuntar el comprobante de pago");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("cliente_access_token");
      const clienteId = localStorage.getItem("cliente_id");

      // Preparar items del pedido
      const itemsPedido = items.map(carritoItem => ({
        itemId: carritoItem.itemId,
        cantidad: carritoItem.cantidad,
        precio: carritoItem.item.precio,
      }));

      // Subir el archivo usando Cloudflare R2 con presigned URLs
      let archivoUrl = "";
      if (archivo) {
        try {
          // 1. Obtener presigned URL para PUT (subir el archivo)
          const objectName = `comprobantes_pago/${Date.now()}_${archivo.name}`;
          const presignedUrlPut = await fetch(`${apiUrl}/files/presigned-url`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              object_name: objectName,
              operation: "put_object",
              content_type: archivo.type,
            }),
          });

          if (!presignedUrlPut.ok) {
            throw new Error("Error al obtener URL para subir archivo");
          }

          const presignedData = await presignedUrlPut.json();
          const putUrl = presignedData.presigned_url;

          // 2. Subir el archivo directamente a Cloudflare R2
          const uploadRes = await fetch(putUrl, {
            method: "PUT",
            headers: {
              "Content-Type": archivo.type,
            },
            body: archivo,
          });

          if (!uploadRes.ok) {
            throw new Error("Error al subir el archivo");
          }

          // 3. Registrar el archivo en el backend
          const fileName = archivo.name;
          const registerRes = await fetch(`${apiUrl}/files/upload`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              file_url: objectName, // El object name en R2
              file_name: fileName,
              pedido_id: "", // Se asignará después al crear el pedido
            }),
          });

          if (registerRes.ok) {
            const registerData = await registerRes.json();
            archivoUrl = registerData.file_url || objectName;
          } else {
            // Si falla el registro, usar el object name directamente
            archivoUrl = objectName;
          }
        } catch (uploadError: any) {
          console.error("Error al subir archivo:", uploadError);
          throw new Error(`Error al subir el comprobante: ${uploadError.message}`);
        }
      }

      // Crear el pedido
      const pedidoData = {
        cliente_id: clienteId,
        items: itemsPedido,
        metodo_pago: metodoPago,
        numero_referencia: numeroReferencia,
        comprobante_url: archivoUrl,
        total: total,
        estado: "pendiente",
        adicionales: [], // Campo requerido según nuevas especificaciones
      };

      const res = await fetch(`${apiUrl}/pedidos/cliente`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(pedidoData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Error al enviar el pedido" }));
        console.error("❌ Error del backend (422):", errorData);
        // Mostrar detalles específicos del error 422
        if (res.status === 422 && errorData.detail) {
          const errorMessage = Array.isArray(errorData.detail)
            ? errorData.detail.map((e: any) => {
                if (typeof e === 'string') return e;
                const loc = e.loc ? e.loc.join('.') : '';
                const msg = e.msg || e.message || JSON.stringify(e);
                return loc ? `${loc}: ${msg}` : msg;
              }).join(', ')
            : errorData.detail;
          throw new Error(errorMessage);
        }
        throw new Error(errorData.detail || "Error al enviar el pedido");
      }

      onPedidoEnviado();
    } catch (err: any) {
      setError(err.message || "Error al enviar el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Enviar Pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Resumen del pedido */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Resumen del Pedido</h3>
            <div className="space-y-2 text-sm">
              {items.map((carritoItem) => (
                <div key={carritoItem.itemId} className="flex justify-between">
                  <span>{carritoItem.item.nombre} x{carritoItem.cantidad}</span>
                  <span>${((carritoItem.item.precio || 0) * carritoItem.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-600 pt-2 mt-2 flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-cyan-400">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <Label htmlFor="metodo-pago" className="text-gray-200">
              Método de Pago <span className="text-red-400">*</span>
            </Label>
            <select
              id="metodo-pago"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full mt-1 bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:border-cyan-400 focus:outline-none"
              required
            >
              <option value="">Selecciona un método de pago</option>
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="pago_movil">Pago Móvil</option>
              <option value="efectivo">Efectivo</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* Número de referencia */}
          <div>
            <Label htmlFor="numero-referencia" className="text-gray-200">
              Número de Referencia <span className="text-red-400">*</span>
            </Label>
            <Input
              id="numero-referencia"
              type="text"
              value={numeroReferencia}
              onChange={(e) => setNumeroReferencia(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="Ingresa el número de referencia del pago"
              required
            />
          </div>

          {/* Adjuntar comprobante */}
          <div>
            <Label htmlFor="comprobante" className="text-gray-200">
              Comprobante de Pago (PNG/Imagen) <span className="text-red-400">*</span>
            </Label>
            <div className="mt-2">
              {!archivo ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">Click para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG (MAX. 10MB)</p>
                  </div>
                  <input
                    id="comprobante"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="relative">
                  <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {previewArchivo && (
                        <img
                          src={previewArchivo}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="text-white font-semibold">{archivo.name}</p>
                        <p className="text-gray-400 text-sm">
                          {(archivo.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={eliminarArchivo}
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded p-2">
              {error}
            </div>
          )}

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-white hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar Pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnviarPedidoModal;

