import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

interface Cliente {
  _id: string;
  nombre: string;
  rif: string;
  direccion: string;
  telefono: string;
}

const ModificarCliente: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    rif: "",
    direccion: "",
    telefono: "",
  });
  const [mensaje, setMensaje] = useState<string>("");

  useEffect(() => {
    const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
    setLoading(true);
    setError("");
    fetch(`${apiUrl}/clientes/all`)
      .then((response) => {
        if (!response.ok) throw new Error("Error al obtener clientes");
        return response.json();
      })
      .then((data: any) => {
        console.log('Datos recibidos del API:', data);
        // Verificar si los datos vienen en un formato diferente
        const clientesArray = Array.isArray(data) ? data : (data.clientes || data.data || []);
        console.log('Clientes procesados:', clientesArray);
        
        // Mapear los datos para asegurar que tengan el formato correcto
        const clientesMapeados: Cliente[] = clientesArray.map((c: any) => ({
          _id: c._id || c.id,
          nombre: c.nombre || "",
          rif: c.rif || "",
          direccion: c.direccion || "",
          telefono: c.telefono || "",
        }));
        
        console.log('Clientes mapeados:', clientesMapeados);
        setClientes(clientesMapeados);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al cargar clientes:', err);
        setError(`No se pudieron cargar los clientes: ${err.message}`);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      console.log('Cliente seleccionado:', clienteSeleccionado);
      setForm({
        nombre: clienteSeleccionado.nombre || "",
        rif: clienteSeleccionado.rif || "",
        direccion: clienteSeleccionado.direccion || "",
        telefono: clienteSeleccionado.telefono || "",
      });
      console.log('Form actualizado:', {
        nombre: clienteSeleccionado.nombre || "",
        rif: clienteSeleccionado.rif || "",
        direccion: clienteSeleccionado.direccion || "",
        telefono: clienteSeleccionado.telefono || "",
      });
    } else {
      // Limpiar el formulario si no hay cliente seleccionado
      setForm({
        nombre: "",
        rif: "",
        direccion: "",
        telefono: "",
      });
    }
  }, [clienteSeleccionado]);

  const handleSelectCliente = (id: string) => {
    console.log('Buscando cliente con ID:', id);
    console.log('Clientes disponibles:', clientes);
    const cliente = clientes.find((c) => {
      const found = String(c._id) === String(id);
      if (found) {
        console.log('Cliente encontrado:', c);
      }
      return found;
    }) || null;
    
    if (!cliente) {
      console.error('Cliente no encontrado con ID:', id);
    }
    
    setClienteSeleccionado(cliente);
    setMensaje("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): string | null => {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (!form.rif.trim()) return "El RIF es obligatorio.";
    if (!form.direccion.trim()) return "La dirección es obligatoria.";
    if (!form.telefono.trim()) return "El teléfono es obligatorio.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const res = await fetch(`${apiUrl}/clientes/id/${clienteSeleccionado?._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error al modificar cliente");
      setMensaje("Cliente modificado correctamente ✅");
      setTimeout(() => {
        setMensaje("");
        navigate("/modificarcliente");
      }, 3000);
    } catch (err: any) {
      setError("No se pudo modificar el cliente");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-200 mt-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Modificar Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="selectCliente">Selecciona un cliente</Label>
          {loading ? (
            <div className="mt-2 text-gray-500">Cargando clientes...</div>
          ) : error ? (
            <div className="mt-2 text-red-500">{error}</div>
          ) : (
            <select
              id="selectCliente"
              className="mt-1 w-full border rounded px-2 py-2"
              value={clienteSeleccionado?._id || ""}
              onChange={(e) => handleSelectCliente(e.target.value)}
            >
              <option value="">-- Selecciona --</option>
              {clientes.map((c) => {
                const nombreMostrar = c.nombre || "Sin nombre";
                const rifMostrar = c.rif || "Sin RIF";
                console.log(`Cliente en select: ${c._id} - nombre: "${c.nombre}", rif: "${c.rif}"`);
                return (
                  <option key={c._id} value={c._id}>
                    {nombreMostrar} ({rifMostrar})
                  </option>
                );
              })}
            </select>
          )}
        </div>
        {clienteSeleccionado && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="nombre">Nombre O Razon Social</Label>
              <Input
                id="nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="rif">RIF</Label>
              <Input
                id="rif"
                name="rif"
                value={form.rif}
                onChange={handleChange}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="mt-1"
                required
              />
            </div>
            <Button type="submit" className="w-full mt-4 font-bold py-2">
              Guardar Cambios
            </Button>
          </form>
        )}
        {mensaje && (
          <div className="mt-4 text-center text-green-600 font-semibold">
            {mensaje}
          </div>
        )}
        {error && (
          <div className="mt-4 text-center text-red-600 font-semibold">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModificarCliente;
