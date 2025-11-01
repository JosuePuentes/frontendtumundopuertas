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
    // TODO: Implementar actualización de perfil
    alert("Perfil actualizado");
  };

  if (loading) {
    return <div className="text-center py-12"><p className="text-gray-300">Cargando perfil...</p></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold text-white mb-6">Mi Perfil</h2>
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
          <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600">
            Guardar Cambios
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Perfil;

