import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Cliente {
  nombre: string;
  rif: string;
  direccion: string;
  telefono: string;
}

interface CrearClienteModalProps {
  open: boolean;
  onClose: () => void;
  onClienteCreated?: (cliente: Cliente & { _id?: string }) => void;
}

const CrearClienteModal: React.FC<CrearClienteModalProps> = ({
  open,
  onClose,
  onClienteCreated,
}) => {
  const [cliente, setCliente] = useState<Cliente>({
    nombre: "",
    rif: "",
    direccion: "",
    telefono: "",
  });
  const [mensaje, setMensaje] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCliente((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.nombre || !cliente.rif || !cliente.direccion || !cliente.telefono) {
      setMensaje("Completa todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    setMensaje("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const secureApiUrl = `https://${apiUrl.replace(/^(http|https):\/\//, '')}`;
      const response = await fetch(`${secureApiUrl}/clientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cliente),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Error al crear el cliente");
      }

      const data = await response.json();
      setMensaje("Cliente creado correctamente ✅");
      
      // Llamar al callback con el cliente creado
      if (onClienteCreated) {
        onClienteCreated({
          ...cliente,
          _id: data._id || data.id,
        });
      }

      // Limpiar el formulario
      setCliente({ nombre: "", rif: "", direccion: "", telefono: "" });

      // Cerrar el modal después de 1.5 segundos
      setTimeout(() => {
        onClose();
        setMensaje("");
      }, 1500);
    } catch (error: any) {
      setMensaje(error.message || "Error al crear el cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCliente({ nombre: "", rif: "", direccion: "", telefono: "" });
      setMensaje("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Crear Cliente</DialogTitle>
          <DialogDescription>
            Completa los datos del nuevo cliente para poder crear el pedido.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="modal-nombre">Nombre O Razon Social</Label>
            <Input
              id="modal-nombre"
              name="nombre"
              value={cliente.nombre}
              onChange={handleChange}
              placeholder="Nombre o Razon Social del cliente"
              className="mt-1"
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="modal-rif">RIF</Label>
            <Input
              id="modal-rif"
              name="rif"
              value={cliente.rif}
              onChange={handleChange}
              placeholder="RIF"
              className="mt-1"
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="modal-direccion">Dirección</Label>
            <Input
              id="modal-direccion"
              name="direccion"
              value={cliente.direccion}
              onChange={handleChange}
              placeholder="Dirección"
              className="mt-1"
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="modal-telefono">Teléfono</Label>
            <Input
              id="modal-telefono"
              name="telefono"
              value={cliente.telefono}
              onChange={handleChange}
              placeholder="Teléfono"
              className="mt-1"
              required
              disabled={loading}
            />
          </div>
          {mensaje && (
            <div className={`text-center text-sm font-semibold ${
              mensaje.includes("✅") ? "text-green-600" : "text-red-600"
            }`}>
              {mensaje}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="font-bold"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CrearClienteModal;

