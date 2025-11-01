import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import ClienteLoginModal from "./ClienteLoginModal";
import ClienteRegisterModal from "./ClienteRegisterModal";

const UsuariosPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  // Verificar si ya está logueado
  React.useEffect(() => {
    const token = localStorage.getItem("cliente_access_token");
    if (token) {
      navigate("/clientes");
    }
  }, [navigate]);

  const handleLoginSuccess = () => {
    navigate("/clientes");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md w-full">
        <div>
          <img src="/puertalogo.PNG" alt="Logo" className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">TU MUNDO PUERTAS</h1>
          <p className="text-gray-300">Accede a tu cuenta de cliente</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => setLoginOpen(true)}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg py-6"
            size="lg"
          >
            Iniciar Sesión
          </Button>
          <Button
            onClick={() => setRegisterOpen(true)}
            variant="outline"
            className="w-full border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-white text-lg py-6"
            size="lg"
          >
            Crear Usuario
          </Button>
        </div>

        <div className="mt-8">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            Volver al inicio
          </Button>
        </div>
      </div>

      <ClienteLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToRegister={() => {
          setLoginOpen(false);
          setRegisterOpen(true);
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      <ClienteRegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSwitchToLogin={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
        onRegisterSuccess={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
      />
    </div>
  );
};

export default UsuariosPage;

