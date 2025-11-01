import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClienteForgotPasswordProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const ClienteForgotPassword: React.FC<ClienteForgotPasswordProps> = ({
  open,
  onClose,
  onSwitchToLogin,
}) => {
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [paso, setPaso] = useState<"email" | "codigo" | "nuevaPassword">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const handleEnviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const res = await fetch(`${apiUrl}/auth/clientes/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al enviar código");
      }
      setMensaje("Código de recuperación enviado a tu correo electrónico");
      setPaso("codigo");
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const res = await fetch(`${apiUrl}/auth/clientes/verify-code/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Código inválido");
      }
      setPaso("nuevaPassword");
      setMensaje("Código verificado correctamente");
    } catch (err: any) {
      setError(err.message || "Error al verificar código");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);

    if (nuevaPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const res = await fetch(`${apiUrl}/auth/clientes/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo, nueva_password: nuevaPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al restablecer contraseña");
      }
      setMensaje("Contraseña restablecida exitosamente. Puedes iniciar sesión ahora.");
      setTimeout(() => {
        onClose();
        onSwitchToLogin();
        // Resetear formulario
        setEmail("");
        setCodigo("");
        setNuevaPassword("");
        setConfirmarPassword("");
        setPaso("email");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error al restablecer contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setCodigo("");
    setNuevaPassword("");
    setConfirmarPassword("");
    setPaso("email");
    setError(null);
    setMensaje(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {paso === "email" && "Recuperar Contraseña"}
            {paso === "codigo" && "Verificar Código"}
            {paso === "nuevaPassword" && "Nueva Contraseña"}
          </DialogTitle>
        </DialogHeader>

        {paso === "email" && (
          <form onSubmit={handleEnviarCodigo} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="email-forgot" className="text-gray-200">
                Correo Electrónico
              </Label>
              <Input
                id="email-forgot"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="Ingresa tu correo electrónico"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Te enviaremos un código de recuperación a tu correo
              </p>
            </div>
            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded p-2">
                {error}
              </div>
            )}
            {mensaje && (
              <div className="text-green-400 text-sm bg-green-900/20 border border-green-500/30 rounded p-2">
                {mensaje}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar Código"}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-cyan-400 hover:text-cyan-300 text-sm underline"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </form>
        )}

        {paso === "codigo" && (
          <form onSubmit={handleVerificarCodigo} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="codigo" className="text-gray-200">
                Código de Recuperación
              </Label>
              <Input
                id="codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="Ingresa el código recibido por email"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Código enviado a: {email}
              </p>
            </div>
            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded p-2">
                {error}
              </div>
            )}
            {mensaje && (
              <div className="text-green-400 text-sm bg-green-900/20 border border-green-500/30 rounded p-2">
                {mensaje}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              disabled={loading}
            >
              {loading ? "Verificando..." : "Verificar Código"}
            </Button>
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setPaso("email")}
                className="text-cyan-400 hover:text-cyan-300 text-sm underline block"
              >
                Reenviar código
              </button>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-cyan-400 hover:text-cyan-300 text-sm underline block"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </form>
        )}

        {paso === "nuevaPassword" && (
          <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="nueva-password" className="text-gray-200">
                Nueva Contraseña
              </Label>
              <Input
                id="nueva-password"
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="confirmar-password" className="text-gray-200">
                Confirmar Nueva Contraseña
              </Label>
              <Input
                id="confirmar-password"
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="Repite la contraseña"
                required
                minLength={6}
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded p-2">
                {error}
              </div>
            )}
            {mensaje && (
              <div className="text-green-400 text-sm bg-green-900/20 border border-green-500/30 rounded p-2">
                {mensaje}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              disabled={loading}
            >
              {loading ? "Restableciendo..." : "Restablecer Contraseña"}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-cyan-400 hover:text-cyan-300 text-sm underline"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClienteForgotPassword;

