import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClienteLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
}

const ClienteLoginModal: React.FC<ClienteLoginModalProps> = ({
  open,
  onClose,
  onSwitchToRegister,
  onLoginSuccess,
  onForgotPassword,
}) => {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const res = await fetch(`${apiUrl}/auth/clientes/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error de autenticación");
      }
      const data = await res.json();
      localStorage.setItem("cliente_access_token", data.access_token);
      localStorage.setItem("cliente_usuario", data.usuario);
      localStorage.setItem("cliente_id", data.cliente_id || "");
      localStorage.setItem("cliente_nombre", data.nombre || "");
      
      // Cargar datos del dashboard después del login
      const clienteId = data.cliente_id || "";
      if (clienteId) {
        try {
          const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
          const resDashboard = await fetch(`${apiUrl}/clientes/${clienteId}/datos-dashboard`, {
            headers: { "Authorization": `Bearer ${data.access_token}` },
          });
          
          if (resDashboard.ok) {
            const dashboardData = await resDashboard.json();
            // Guardar carrito en localStorage si existe en BD
            if (dashboardData.carrito && dashboardData.carrito.items && Array.isArray(dashboardData.carrito.items)) {
              localStorage.setItem(`cliente_carrito_${clienteId}`, JSON.stringify(dashboardData.carrito.items));
            }
            // Las preferencias se cargarán automáticamente cuando se monte ClienteDashboard
          }
        } catch (error) {
          console.error("Error al cargar datos del dashboard después del login:", error);
          // No bloquear el login si falla la carga de datos
        }
      }
      
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Iniciar Sesión - Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="cliente-usuario" className="text-gray-200">Usuario</Label>
            <Input
              id="cliente-usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="Ingresa tu usuario"
              required
            />
          </div>
          <div>
            <Label htmlFor="cliente-password" className="text-gray-200">Contraseña</Label>
            <Input
              id="cliente-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="Ingresa tu contraseña"
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
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </Button>
          <div className="text-center mt-4 space-y-2">
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-cyan-400 hover:text-cyan-300 text-sm underline block"
            >
              ¿No tienes cuenta? Crear usuario
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onForgotPassword();
              }}
              className="text-cyan-400 hover:text-cyan-300 text-sm underline block"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClienteLoginModal;

