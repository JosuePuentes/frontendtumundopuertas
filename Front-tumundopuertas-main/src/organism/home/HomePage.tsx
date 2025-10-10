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
  Printer,
  Shield,
  Zap,
  Star,
  ArrowRight,
  Menu,
  X
} from "lucide-react";
import { useState } from 'react';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem("usuario");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const modules = [
        {
            title: "Clientes",
            description: "Gestionar información de clientes",
            icon: Users,
            color: "from-cyan-400 to-blue-500",
            href: "/crearcliente"
        },
        {
            title: "Inventario",
            description: "Administrar productos e inventario",
            icon: Package,
            color: "from-cyan-400 to-blue-500",
            href: "/crearitem"
        },
        {
            title: "Pedidos",
            description: "Crear y monitorear pedidos",
            icon: ShoppingCart,
            color: "from-cyan-400 to-blue-500",
            href: "/crearpedido"
        },
        {
            title: "Pagos",
            description: "Gestionar pagos y facturación",
            icon: CreditCard,
            color: "from-cyan-400 to-blue-500",
            href: "/pagos"
        },
        {
            title: "Mis Pagos",
            description: "Consultar pagos registrados",
            icon: FileText,
            color: "from-cyan-400 to-blue-500",
            href: "/mispagos"
        },
        {
            title: "Métodos de Pago",
            description: "Administrar métodos de pago",
            icon: CreditCard,
            color: "from-cyan-400 to-blue-500",
            href: "/metodos-pago"
        },
        {
            title: "Formatos de Impresión",
            description: "Personalizar formatos de documentos",
            icon: Printer,
            color: "from-cyan-400 to-blue-500",
            href: "/formatos-impresion"
        },
        {
            title: "Reportes",
            description: "Ver resúmenes y estadísticas",
            icon: BarChart3,
            color: "from-cyan-400 to-blue-500",
            href: "/resumen-venta-diaria"
        },
        {
            title: "Configuración",
            description: "Ajustes del sistema",
            icon: Settings,
            color: "from-cyan-400 to-blue-500",
            href: "/dashboard"
        }
    ];

    const values = [
        {
            icon: Star,
            title: "Diseño",
            description: "Soluciones arquitectónicas innovadoras"
        },
        {
            icon: Shield,
            title: "Calidad",
            description: "Materiales de primera calidad"
        },
        {
            icon: Zap,
            title: "Protección",
            description: "Seguridad y durabilidad garantizada"
        }
    ];

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
                
                {/* Header */}
                <header className="relative z-10 p-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <img src="/puertalogo.PNG" alt="Logo Tu Mundo Puertas" className="w-12 h-12" />
                            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                TU MUNDO PUERTAS
                            </span>
                        </div>
                        
                        <nav className="hidden md:flex space-x-8">
                            <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Inicio</a>
                            <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Productos</a>
                            <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Proyectos</a>
                            <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Servicios</a>
                            <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Contacto</a>
                        </nav>
                        
                        <Button 
                            onClick={() => navigate('/login')}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
                        >
                            Solicitar Presupuesto
                        </Button>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Main Title */}
                        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-tight">
                            TU MUNDO<br />
                            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                PUERTAS
                            </span>
                        </h1>
                        
                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-gray-300 mb-8 font-light">
                            Diseño, Calidad y Protección
                        </p>
                        
                        {/* CTA Button */}
                        <Button 
                            onClick={() => navigate('/login')}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 flex items-center space-x-2 mx-auto"
                        >
                            <span>Explora Nuestros Productos</span>
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>
                    
                    {/* Circuit Lines */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-10 w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"></div>
                        <div className="absolute top-1/3 right-10 w-24 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"></div>
                        <div className="absolute bottom-1/4 left-20 w-40 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"></div>
                        <div className="absolute bottom-1/3 right-20 w-28 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"></div>
                    </div>
                </main>

                {/* Values Section */}
                <section className="relative z-10 py-20 px-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Separator */}
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent mb-16"></div>
                        
                        {/* Values Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {values.map((value, index) => {
                                const IconComponent = value.icon;
                                return (
                                    <div key={index} className="text-center group">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400/60 transition-all duration-300">
                                            <IconComponent className="w-10 h-10 text-cyan-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-3">{value.title}</h3>
                                        <p className="text-gray-400 text-lg">{value.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="relative z-10 py-20 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl font-bold text-white mb-8">¿Listo para tu próximo proyecto?</h2>
                        <p className="text-xl text-gray-300 mb-8">Contáctanos y descubre cómo podemos transformar tu espacio</p>
                        <Button 
                            onClick={() => navigate('/login')}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
                        >
                            Contáctanos
                        </Button>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
            
            {/* Header */}
            <header className="relative z-10 p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img src="/puertalogo.PNG" alt="Logo Tu Mundo Puertas" className="w-12 h-12" />
                        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            TU MUNDO PUERTAS
                        </span>
                    </div>
                    
                    <Button 
                        onClick={() => navigate('/dashboard')}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
                    >
                        Panel de Control
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                            Panel de Control
                        </h1>
                        <p className="text-xl text-gray-300">Selecciona el módulo que deseas utilizar</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {modules.map((module, index) => {
                            const IconComponent = module.icon;
                            return (
                                <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group backdrop-blur-sm">
                                    <CardHeader className="text-center">
                                        <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${module.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-cyan-500/25`}>
                                            <IconComponent className="w-10 h-10 text-white" />
                                        </div>
                                        <CardTitle className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">
                                            {module.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center">
                                        <p className="text-gray-300 mb-6 text-lg">{module.description}</p>
                                        <Button 
                                            onClick={() => navigate(module.href)}
                                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
                                        >
                                            Acceder
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HomePage;