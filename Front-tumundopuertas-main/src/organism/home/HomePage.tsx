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
  ArrowRight
} from "lucide-react";

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem("usuario");

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
            <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 text-white overflow-hidden relative">
                {/* Background Effects - Circuit Lines */}
                <div className="absolute inset-0">
                    {/* Horizontal Circuit Lines */}
                    <div className="absolute top-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"></div>
                    <div className="absolute top-40 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-40"></div>
                    <div className="absolute bottom-40 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
                    <div className="absolute bottom-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-30"></div>
                    
                    {/* Vertical Circuit Lines */}
                    <div className="absolute left-20 top-0 w-px h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-40"></div>
                    <div className="absolute right-20 top-0 w-px h-full bg-gradient-to-b from-transparent via-cyan-300 to-transparent opacity-30"></div>
                    
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-5" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v40H0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>
                
                {/* Header with Logo and Company Name */}
                <header className="relative z-10 p-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            {/* Correct Logo */}
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-2 border-cyan-400 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg shadow-cyan-400/30">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center relative">
                                        {/* Circuit pattern background */}
                                        <div className="absolute inset-0 opacity-30" style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2306b6d4' fill-opacity='0.3'%3E%3Cpath d='M0 0h20v20H0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                            backgroundSize: '20px 20px'
                                        }}></div>
                                        {/* TM Letters */}
                                        <div className="relative z-10">
                                            <div className="text-cyan-400 font-bold text-sm leading-none">
                                                <div className="text-xs">T</div>
                                                <div className="text-xs">M</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 rounded-full border border-cyan-400 animate-pulse opacity-50"></div>
                            </div>
                            
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-white tracking-wide">
                                    TU MUNDO PUERTAS
                                </span>
                                <div className="w-full h-px bg-gradient-to-r from-cyan-400 to-transparent mt-2"></div>
                                <span className="text-sm text-gray-300 mt-2">
                                    DISEÑO, CALIDAD Y PROTECCIÓN
                                </span>
                            </div>
                        </div>
                        
                        <nav className="hidden md:flex space-x-8">
                            <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 relative group">
                                Inicio
                                <div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
                            </a>
                            <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 relative group">
                                Productos
                                <div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
                            </a>
                            <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 relative group">
                                Proyectos
                                <div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
                            </a>
                            <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 relative group">
                                Servicios
                                <div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
                            </a>
                            <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 relative group">
                                Contacto
                                <div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
                            </a>
                        </nav>
                        
                        <Button 
                            onClick={() => navigate('/login')}
                            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-bold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50"
                        >
                            SOLICITAR PRESUPUESTO
                        </Button>
                    </div>
                </header>

                {/* Banner Section */}
                <section className="relative z-10 py-8 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 border border-cyan-400/30 rounded-lg p-8 backdrop-blur-sm">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-white mb-4">Banner Promocional</h2>
                                <p className="text-gray-300 mb-6">Espacio reservado para contenido promocional o anuncios</p>
                                <div className="w-full h-32 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-400/30 rounded-lg flex items-center justify-center">
                                    <span className="text-cyan-400 font-semibold">Contenido del Banner</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="relative z-10 py-20 px-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Separator */}
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent mb-16"></div>
                        
                        {/* Values Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="text-center group">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400/60 transition-all duration-300">
                                    <Star className="w-10 h-10 text-cyan-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Diseño</h3>
                                <p className="text-gray-300 text-lg">Soluciones arquitectónicas innovadoras</p>
                            </div>
                            
                            <div className="text-center group">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400/60 transition-all duration-300">
                                    <Shield className="w-10 h-10 text-cyan-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Calidad</h3>
                                <p className="text-gray-300 text-lg">Materiales de primera calidad</p>
                            </div>
                            
                            <div className="text-center group">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400/60 transition-all duration-300">
                                    <Zap className="w-10 h-10 text-cyan-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Protección</h3>
                                <p className="text-gray-300 text-lg">Seguridad y durabilidad garantizada</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Product Gallery Section */}
                <section className="relative z-10 py-20 px-6">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-white text-center mb-12">Innovación y Tradición en Cada Apertura</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Product 1 */}
                            <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-cyan-400/30 rounded-lg p-6 backdrop-blur-sm group hover:border-cyan-400/60 transition-all duration-300">
                                <div className="w-full h-48 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg mb-4 flex items-center justify-center border border-cyan-400/20">
                                    <span className="text-cyan-400 font-semibold">Boccion</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Boccion</h3>
                                <p className="text-gray-300 mb-4">Puerta de seguridad robusta</p>
                                <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-semibold py-2 rounded-lg transition-all duration-300">
                                    Ver Más
                                </Button>
                            </div>
                            
                            {/* Product 2 */}
                            <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-cyan-400/30 rounded-lg p-6 backdrop-blur-sm group hover:border-cyan-400/60 transition-all duration-300">
                                <div className="w-full h-48 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg mb-4 flex items-center justify-center border border-cyan-400/20">
                                    <span className="text-cyan-400 font-semibold">Aluminium</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Aluminium</h3>
                                <p className="text-gray-300 mb-4">Puerta de aluminio moderna</p>
                                <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-semibold py-2 rounded-lg transition-all duration-300">
                                    Ver Más
                                </Button>
                            </div>
                            
                            {/* Product 3 */}
                            <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-cyan-400/30 rounded-lg p-6 backdrop-blur-sm group hover:border-cyan-400/60 transition-all duration-300">
                                <div className="w-full h-48 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg mb-4 flex items-center justify-center border border-cyan-400/20">
                                    <span className="text-cyan-400 font-semibold">Yar Mes</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Yar Mes</h3>
                                <p className="text-gray-300 mb-4">Puerta de madera elegante</p>
                                <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-semibold py-2 rounded-lg transition-all duration-300">
                                    Ver Más
                                </Button>
                            </div>
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
                            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black px-8 py-4 text-lg font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50"
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
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                }}></div>
            </div>
            
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