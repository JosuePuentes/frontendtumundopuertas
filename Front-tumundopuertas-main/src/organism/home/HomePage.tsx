import React from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  FileText, 
  BarChart3,
  Settings,
  Printer
} from "lucide-react";

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem("usuario");

    const modules = [
        {
            title: "Clientes",
            description: "Gestionar información de clientes",
            icon: Users,
            color: "bg-blue-500",
            href: "/crearcliente"
        },
        {
            title: "Inventario",
            description: "Administrar productos e inventario",
            icon: Package,
            color: "bg-green-500",
            href: "/crearitem"
        },
        {
            title: "Pedidos",
            description: "Crear y monitorear pedidos",
            icon: ShoppingCart,
            color: "bg-purple-500",
            href: "/crearpedido"
        },
        {
            title: "Pagos",
            description: "Gestionar pagos y facturación",
            icon: CreditCard,
            color: "bg-yellow-500",
            href: "/pagos"
        },
        {
            title: "Mis Pagos",
            description: "Consultar pagos registrados",
            icon: FileText,
            color: "bg-orange-500",
            href: "/mispagos"
        },
        {
            title: "Métodos de Pago",
            description: "Administrar métodos de pago",
            icon: CreditCard,
            color: "bg-indigo-500",
            href: "/metodos-pago"
        },
        {
            title: "Formatos de Impresión",
            description: "Personalizar formatos de documentos",
            icon: Printer,
            color: "bg-pink-500",
            href: "/formatos-impresion"
        },
        {
            title: "Reportes",
            description: "Ver resúmenes y estadísticas",
            icon: BarChart3,
            color: "bg-teal-500",
            href: "/resumen-venta-diaria"
        },
        {
            title: "Configuración",
            description: "Ajustes del sistema",
            icon: Settings,
            color: "bg-gray-500",
            href: "/dashboard"
        }
    ];

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8">
                <img src="/puertalogo.PNG" alt="Logo Tu Mundo Puerta" className="w-48 h-auto mb-6" />
                <h1 className="text-3xl font-bold mb-2">Bienvenido a Crafteo</h1>
                <p className="text-lg mb-4">Esta es la página principal de tu aplicación.</p>
                <button className="bg-blue-600 text-white py-2 px-4 rounded m-8" onClick={() => navigate('/login')}>
                    Iniciar Sesion
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <img src="/puertalogo.PNG" alt="Logo Tu Mundo Puerta" className="w-32 h-auto mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Bienvenido a Crafteo</h1>
                    <p className="text-lg text-gray-600">Selecciona el módulo que deseas utilizar</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module, index) => {
                        const IconComponent = module.icon;
                        return (
                            <Card key={index} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                                <CardHeader className="text-center">
                                    <div className={`w-16 h-16 mx-auto rounded-full ${module.color} flex items-center justify-center mb-4`}>
                                        <IconComponent className="w-8 h-8 text-white" />
                                    </div>
                                    <CardTitle className="text-xl font-semibold text-gray-800">
                                        {module.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p className="text-gray-600 mb-4">{module.description}</p>
                                    <Button 
                                        onClick={() => navigate(module.href)}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        Acceder
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default HomePage;