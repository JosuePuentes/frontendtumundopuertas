import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const Perfil: React.FC = () => {
  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    direccion: "",
    telefono: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("cliente_access_token");
      const clienteId = localStorage.getItem("cliente_id");
      const res = await fetch(`${apiUrl}/clientes/${clienteId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setForm({
          nombre: data.nombre || "",
          cedula: data.cedula || "",
          direccion: data.direccion || "",
          telefono: data.telefono || "",
        });
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMensaje(null);
    
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("cliente_access_token");
      const clienteId = localStorage.getItem("cliente_id");
      
      if (!clienteId || !token) {
        throw new Error("No se encontró información de sesión");
      }

      const res = await fetch(`${apiUrl}/clientes/${clienteId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: form.nombre,
          cedula: form.cedula,
          direccion: form.direccion,
          telefono: form.telefono,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Actualizar localStorage con el nombre actualizado
        if (data.nombre) {
          localStorage.setItem("cliente_nombre", data.nombre);
        }
        setMensaje({ tipo: "success", texto: "✓ Perfil actualizado correctamente" });
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setMensaje(null), 3000);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error al actualizar el perfil");
      }
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      setMensaje({ tipo: "error", texto: error.message || "Error al actualizar el perfil" });
      setTimeout(() => setMensaje(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12"><p className="text-gray-300">Cargando perfil...</p></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold text-white mb-6">Mi Perfil</h2>
      {mensaje && (
        <div className={`p-4 rounded-lg ${
          mensaje.tipo === "success" 
            ? "bg-green-500/20 border border-green-500/30 text-green-400" 
            : "bg-red-500/20 border border-red-500/30 text-red-400"
        }`}>
          {mensaje.texto}
        </div>
      )}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-200">Nombre Completo</Label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-gray-200">Cédula</Label>
            <Input
              value={form.cedula}
              onChange={(e) => setForm({ ...form, cedula: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-gray-200">Dirección</Label>
            <Input
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-gray-200">Teléfono</Label>
            <Input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Perfil;

