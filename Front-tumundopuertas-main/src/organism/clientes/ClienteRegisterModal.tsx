import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClienteRegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
}

const ClienteRegisterModal: React.FC<ClienteRegisterModalProps> = ({
  open,
  onClose,
  onSwitchToLogin,
  onRegisterSuccess,
}) => {
  const [form, setForm] = useState({
    usuario: "",
    password: "",
    nombre: "",
    cedula: "",
    direccion: "",
    telefono: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const res = await fetch(`${apiUrl}/auth/clientes/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al crear usuario");
      }
      onRegisterSuccess();
      onClose();
      // Opcional: auto-login después de registro
      // onSwitchToLogin();
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Crear Cuenta - Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="usuario" className="text-gray-200">Usuario</Label>
            <Input
              id="usuario"
              name="usuario"
              type="text"
              value={form.usuario}
              onChange={handleChange}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="Ingresa tu usuario"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-gray-200">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="nombre" className="text-gray-200">Nombre Completo</Label>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="Ingresa tu nombre completo"
              required
            />
          </div>
          <div>
            <Label htmlFor="cedula" className="text-gray-200">Cédula</Label>
            <Input
              id="cedula"
              name="cedula"
              type="text"
              value={form.cedula}
              onChange={handleChange}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="Ingresa tu cédula"
              required
            />
          </div>
          <div>
            <Label htmlFor="direccion" className="text-gray-200">Dirección</Label>
            <Input
              id="direccion"
              name="direccion"
              type="text"
              value={form.direccion}
              onChange={handleChange}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="Ingresa tu dirección"
              required
            />
          </div>
          <div>
            <Label htmlFor="telefono" className="text-gray-200">Teléfono</Label>
            <Input
              id="telefono"
              name="telefono"
              type="tel"
              value={form.telefono}
              onChange={handleChange}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="Ingresa tu teléfono"
              required
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded p-2">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-cyan-400 hover:text-cyan-300 text-sm underline"
            >
              ¿Ya tienes cuenta? Iniciar sesión
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClienteRegisterModal;

