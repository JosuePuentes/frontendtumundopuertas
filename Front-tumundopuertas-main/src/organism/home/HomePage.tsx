import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ClienteLoginModal from "@/organism/clientes/ClienteLoginModal";
import ClienteRegisterModal from "@/organism/clientes/ClienteRegisterModal";
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
  Receipt
} from "lucide-react";

interface HomeConfig {
  banner: {
    title: string;
    subtitle: string;
    image: string;
    enabled: boolean;
  };
  logo: {
    text: string;
    slogan: string;
    image: string;
    enabled: boolean;
  };
  values: {
    diseño: {
      title: string;
      description: string;
      icon: string;
    };
    calidad: {
      title: string;
      description: string;
      icon: string;
    };
    proteccion: {
      title: string;
      description: string;
      icon: string;
    };
  };
  products: {
    title: string;
    items: Array<{
      id: string;
      name: string;
      description: string;
      image: string;
      enabled: boolean;
    }>;
  };
  contact: {
    title: string;
    subtitle: string;
    enabled: boolean;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem("usuario");
    const [config, setConfig] = useState<HomeConfig | null>(null);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    
    // Función para obtener permisos del usuario
    const getPermisos = (): string[] => {
        try {
            const raw = localStorage.getItem("permisos");
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    };

    // Cargar configuración desde localStorage
    useEffect(() => {
        const loadConfig = () => {
            const savedConfig = localStorage.getItem('home-config');
            if (savedConfig) {
                try {
                    const parsedConfig = JSON.parse(savedConfig);
                    console.log('Configuración cargada:', parsedConfig);
                    console.log('Banner habilitado:', parsedConfig.banner?.enabled);
                    setConfig(parsedConfig);
                } catch (error) {
                    console.error('Error parsing home config:', error);
                }
            } else {
                console.log('No hay configuración guardada, usando configuración por defecto');
            }
        };

        // Cargar configuración inicial
        loadConfig();

        // Escuchar cambios en localStorage (entre pestañas)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'home-config') {
                console.log('Cambio detectado en localStorage (entre pestañas)');
                loadConfig();
            }
        };

        // Escuchar cambios en localStorage (misma pestaña)
        const handleCustomStorageChange = (e: CustomEvent) => {
            if (e.detail?.key === 'home-config') {
                console.log('Cambio detectado en localStorage (misma pestaña)');
                loadConfig();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('customStorageChange', handleCustomStorageChange as EventListener);

        // Cleanup
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('customStorageChange', handleCustomStorageChange as EventListener);
        };
    }, []);

    // Configuración por defecto
    const defaultConfig: HomeConfig = {
        banner: {
            title: "TU MUNDO PUERTAS",
            subtitle: "Diseño, Calidad y Protección",
            image: "",
            enabled: true
        },
        logo: {
            text: "TU MUNDO PUERTAS",
            slogan: "Diseño, Calidad y Protección",
            image: "",
            enabled: true
        },
        values: {
            diseño: {
                title: "Diseño",
                description: "Soluciones arquitectónicas innovadoras",
                icon: "Star"
            },
            calidad: {
                title: "Calidad",
                description: "Materiales de primera calidad",
                icon: "Shield"
            },
            proteccion: {
                title: "Protección",
                description: "Seguridad y durabilidad garantizada",
                icon: "Zap"
            }
        },
        products: {
            title: "Innovación y Tradición en Cada Apertura",
            items: [
                {
                    id: "1",
                    name: "Boccion",
                    description: "Puertas de alta calidad",
                    image: "",
                    enabled: true
                },
                {
                    id: "2",
                    name: "Aluminium",
                    description: "Ventanas modernas",
                    image: "",
                    enabled: true
                },
                {
                    id: "3",
                    name: "Yar Mes",
                    description: "Soluciones personalizadas",
                    image: "",
                    enabled: true
                }
            ]
        },
        contact: {
            title: "Contáctanos",
            subtitle: "Para más información sobre nuestros productos",
            enabled: true
        },
        colors: {
            primary: "#06b6d4",
            secondary: "#0891b2",
            accent: "#22d3ee",
            background: "#000000",
            text: "#e5e7eb"
        }
    };

    // Usar configuración guardada o por defecto
    const currentConfig = config || defaultConfig;

    const modules: Array<{
        title: string;
        description: string;
        icon: any;
        color: string;
        href: string;
        permiso?: string;
    }> = [
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
            title: "Bancos",
            description: "Administrar métodos de pago",
            icon: CreditCard,
            color: "from-cyan-400 to-blue-500",
            href: "/metodos-pago"
        },
        {
            title: "Cuentas por Pagar",
            description: "Gestionar cuentas por pagar a proveedores",
            icon: Receipt,
            color: "from-cyan-400 to-blue-500",
            href: "/cuentas-por-pagar",
            permiso: "cuentas_por_pagar"
        },
        {
            title: "Formatos de Impresión",
            description: "Personalizar formatos de documentos",
            icon: Printer,
            color: "from-cyan-400 to-blue-500",
            href: "/formatos-impresion"
        },
        {
            title: "Administrar Home",
            description: "Personalizar página principal",
            icon: Settings,
            color: "from-cyan-400 to-blue-500",
            href: "/admin-home"
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
        },
        {
            title: "Área de Clientes",
            description: "Acceso para clientes",
            icon: Users,
            color: "from-purple-400 to-pink-500",
            href: "/usuarios"
        }
    ];


    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-gray-300 overflow-hidden relative">
                {/* Futuristic Glitch Background - Crack Lines */}
                <div className="absolute inset-0">
                    {/* Horizontal Crack Lines - Futuristic */}
                    <div className="absolute top-20 left-0 w-full h-px bg-cyan-400 opacity-70" style={{
                        clipPath: 'polygon(0% 0%, 20% 0%, 25% 100%, 30% 0%, 45% 0%, 50% 100%, 55% 0%, 70% 0%, 75% 100%, 80% 0%, 100% 0%)'
                    }}></div>
                    <div className="absolute top-40 left-0 w-full h-px bg-cyan-400 opacity-50" style={{
                        clipPath: 'polygon(0% 0%, 15% 0%, 20% 100%, 35% 0%, 40% 100%, 45% 0%, 60% 0%, 65% 100%, 70% 0%, 85% 0%, 100% 0%)'
                    }}></div>
                    <div className="absolute bottom-40 left-0 w-full h-px bg-cyan-400 opacity-60" style={{
                        clipPath: 'polygon(0% 0%, 10% 0%, 15% 100%, 30% 0%, 35% 100%, 40% 0%, 55% 0%, 60% 100%, 65% 0%, 80% 0%, 85% 100%, 100% 0%)'
                    }}></div>
                    <div className="absolute bottom-20 left-0 w-full h-px bg-cyan-400 opacity-40" style={{
                        clipPath: 'polygon(0% 0%, 25% 0%, 30% 100%, 35% 0%, 50% 0%, 55% 100%, 60% 0%, 75% 0%, 80% 100%, 100% 0%)'
                    }}></div>
                    
                    {/* Vertical Crack Lines - Futuristic */}
                    <div className="absolute left-20 top-0 w-px h-full bg-cyan-400 opacity-50" style={{
                        clipPath: 'polygon(0% 0%, 100% 20%, 0% 25%, 100% 40%, 0% 45%, 100% 60%, 0% 65%, 100% 80%, 0% 100%)'
                    }}></div>
                    <div className="absolute right-20 top-0 w-px h-full bg-cyan-400 opacity-40" style={{
                        clipPath: 'polygon(0% 0%, 100% 15%, 0% 20%, 100% 35%, 0% 40%, 100% 55%, 0% 60%, 100% 75%, 0% 80%, 100% 100%)'
                    }}></div>
                    
                    {/* Futuristic Grid Pattern - Minimal */}
                    <div className="absolute inset-0 opacity-8" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2306b6d4' fill-opacity='0.1'%3E%3Cpath d='M0 0h1v1H0z'/%3E%3Cpath d='M20 20h1v1h-1z'/%3E%3Cpath d='M40 40h1v1h-1z'/%3E%3Cpath d='M60 60h1v1h-1z'/%3E%3Cpath d='M79 79h1v1h-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '80px 80px'
                    }}></div>
                    
                    {/* Subtle Glitch Noise */}
                    <div className="absolute inset-0 opacity-3" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2306b6d4' fill-opacity='0.05'%3E%3Cpath d='M0 0h1v1H0z'/%3E%3Cpath d='M50 25h1v1h-1z'/%3E%3Cpath d='M100 75h1v1h-1z'/%3E%3Cpath d='M150 125h1v1h-1z'/%3E%3Cpath d='M199 199h1v1h-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '200px 200px'
                    }}></div>
                </div>
                
                {/* Header with Logo and Company Name */}
                <header className="relative z-10 p-4 sm:p-6">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-3 sm:space-x-6 w-full sm:w-auto justify-center sm:justify-start">
                            {/* Dynamic Logo */}
                            {currentConfig.logo.enabled && (
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-2 border-cyan-400 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center shadow-lg shadow-cyan-400/30">
                                        <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                                            {/* World/Globe pattern background */}
                                            <div className="absolute inset-0 opacity-40" style={{
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2306b6d4' fill-opacity='0.4'%3E%3Cpath d='M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z'/%3E%3Cpath d='M8 2c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                                backgroundSize: '16px 16px'
                                            }}></div>
                                            {/* TM Letters - Portal Style */}
                                            <div className="relative z-10">
                                                <div className="text-cyan-400 font-bold text-lg leading-none">
                                                    <div className="text-sm font-black">T</div>
                                                    <div className="text-sm font-black">M</div>
                                                </div>
                                            </div>
                                            {/* Portal effect lines */}
                                            <div className="absolute inset-0 border border-cyan-400/30 rounded-lg"></div>
                                        <div className="absolute top-1 left-1 right-1 h-px bg-cyan-400/50"></div>
                                        <div className="absolute bottom-1 left-1 right-1 h-px bg-cyan-400/50">                                        </div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 rounded-full border border-cyan-400 animate-pulse opacity-50"></div>
                            </div>
                            )}
                            
                            <div className="flex flex-col">
                                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-200 tracking-wide">
                                    {currentConfig.logo.text}
                                </span>
                                <div className="w-full h-px bg-gradient-to-r from-cyan-400 to-transparent mt-1 sm:mt-2"></div>
                                <span className="text-xs sm:text-sm text-gray-200 mt-1 sm:mt-2">
                                    {currentConfig.logo.slogan}
                                </span>
                            </div>
                        </div>
                        
                        <nav className="hidden lg:flex space-x-4 md:space-x-8">
                            <a href="#" className="text-gray-200 hover:text-cyan-400 transition-colors duration-300 relative group">
                                Inicio
                                <div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
                            </a>
                            <a href="#" className="text-gray-200 hover:text-cyan-400 transition-colors duration-300 relative group">
                                Productos
                                <div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
                            </a>
                            <a href="#" className="text-gray-200 hover:text-cyan-400 transition-colors duration-300 relative group">
                                Proyectos
                                <div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
                            </a>
                            <a href="#" className="text-gray-200 hover:text-cyan-400 transition-colors duration-300 relative group">
                                Servicios
                                <div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
                            </a>
                            <a href="#" className="text-gray-200 hover:text-cyan-400 transition-colors duration-300 relative group">
                                Contacto
                                <div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
                            </a>
                        </nav>
                        
                        <Button 
                            onClick={() => navigate('/login')}
                            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-bold px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 text-sm sm:text-base w-full sm:w-auto"
                        >
                            <span className="hidden sm:inline">SOLICITAR PRESUPUESTO</span>
                            <span className="sm:hidden">PRESUPUESTO</span>
                        </Button>
                    </div>
                </header>

                {/* Dynamic Banner Section */}
                {currentConfig.banner.enabled && (
                    <section className="relative z-10 py-6 sm:py-8 md:py-12 px-4 sm:px-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-gray-700/50 border-2 border-cyan-400 rounded-lg p-4 sm:p-6 md:p-12 backdrop-blur-sm">
                                <div className="text-center">
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-200 mb-4 sm:mb-6">{currentConfig.banner.title}</h2>
                                    <p className="text-gray-200 mb-4 sm:mb-6 md:mb-8 text-base sm:text-lg">{currentConfig.banner.subtitle}</p>
                                    {currentConfig.banner.image && (
                                        <div className="w-full h-48 bg-gradient-to-r from-gray-600 to-gray-700 border-2 border-cyan-400 rounded-lg flex items-center justify-center">
                                            <img src={currentConfig.banner.image} alt="Banner" className="w-full h-full object-cover rounded-lg" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Dynamic Values Section */}
                <section className="relative z-10 py-20 px-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Separator */}
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent mb-16"></div>
                        
                        {/* Values Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="text-center group">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400/60 transition-all duration-300">
                                    {currentConfig.values.diseño.icon === 'Star' && <Star className="w-10 h-10 text-cyan-400" />}
                                    {currentConfig.values.diseño.icon === 'Shield' && <Shield className="w-10 h-10 text-cyan-400" />}
                                    {currentConfig.values.diseño.icon === 'Zap' && <Zap className="w-10 h-10 text-cyan-400" />}
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-200 mb-2 sm:mb-3">{currentConfig.values.diseño.title}</h3>
                                <p className="text-gray-200 text-base sm:text-lg">{currentConfig.values.diseño.description}</p>
                            </div>
                            
                            <div className="text-center group">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400/60 transition-all duration-300">
                                    {currentConfig.values.calidad.icon === 'Star' && <Star className="w-10 h-10 text-cyan-400" />}
                                    {currentConfig.values.calidad.icon === 'Shield' && <Shield className="w-10 h-10 text-cyan-400" />}
                                    {currentConfig.values.calidad.icon === 'Zap' && <Zap className="w-10 h-10 text-cyan-400" />}
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-200 mb-2 sm:mb-3">{currentConfig.values.calidad.title}</h3>
                                <p className="text-gray-200 text-base sm:text-lg">{currentConfig.values.calidad.description}</p>
                            </div>
                            
                            <div className="text-center group">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400/60 transition-all duration-300">
                                    {currentConfig.values.proteccion.icon === 'Star' && <Star className="w-10 h-10 text-cyan-400" />}
                                    {currentConfig.values.proteccion.icon === 'Shield' && <Shield className="w-10 h-10 text-cyan-400" />}
                                    {currentConfig.values.proteccion.icon === 'Zap' && <Zap className="w-10 h-10 text-cyan-400" />}
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-200 mb-2 sm:mb-3">{currentConfig.values.proteccion.title}</h3>
                                <p className="text-gray-200 text-base sm:text-lg">{currentConfig.values.proteccion.description}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Product Gallery Section */}
                <section className="relative z-10 py-10 sm:py-16 md:py-20 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-200 text-center mb-6 sm:mb-8 md:mb-12">{currentConfig.products.title}</h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                            {currentConfig.products.items.filter(item => item.enabled).map((product) => (
                                <div key={product.id} className="bg-gray-700/50 border-2 border-cyan-400 rounded-lg p-6 backdrop-blur-sm group hover:border-cyan-400 transition-all duration-300">
                                    <div className="w-full h-48 bg-gray-600 rounded-lg mb-4 flex items-center justify-center border-2 border-cyan-400">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <span className="text-cyan-400 font-semibold text-lg">{product.name}</span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-200 mb-2">{product.name}</h3>
                                    <p className="text-gray-200 mb-4">{product.description}</p>
                                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-semibold py-2 rounded-lg transition-all duration-300">
                                        Ver Más
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Dynamic Contact Section */}
                {currentConfig.contact.enabled && (
                    <section className="relative z-10 py-20 px-6">
                        <div className="max-w-4xl mx-auto text-center">
                            <h2 className="text-4xl font-bold text-gray-200 mb-6">{currentConfig.contact.title}</h2>
                            <p className="text-gray-200 text-lg mb-8">{currentConfig.contact.subtitle}</p>
                        </div>
                    </section>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-gray-200 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                }}></div>
            </div>
            
            {/* Header */}
            <header className="relative z-10 p-4 sm:p-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <img src="/puertalogo.PNG" alt="Logo Tu Mundo Puertas" className="w-10 h-10 sm:w-12 sm:h-12" />
                        <span className="text-lg sm:text-xl font-bold text-gray-200">
                            TU MUNDO PUERTAS
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={() => setLoginModalOpen(true)}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 text-sm sm:text-base"
                        >
                            Iniciar Sesión
                        </Button>
                        <Button 
                            onClick={() => navigate('/dashboard')}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 text-sm sm:text-base w-full sm:w-auto"
                        >
                            Panel de Control
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-6 sm:mb-8 md:mb-12">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 text-gray-200">
                            Panel de Control
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-200">Selecciona el módulo que deseas utilizar</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                        {modules
                            .filter(module => {
                                // Si el módulo no tiene permiso requerido, se muestra a todos
                                if (!module.permiso) return true;
                                // Si tiene permiso, verificar que el usuario lo tenga
                                return getPermisos().includes(module.permiso);
                            })
                            .map((module, index) => {
                            const IconComponent = module.icon;
                            return (
                                <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group backdrop-blur-sm">
                                    <CardHeader className="text-center">
                                        <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${module.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-cyan-500/25`}>
                                            <IconComponent className="w-10 h-10 text-white" />
                                        </div>
                                        <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-gray-200 group-hover:text-cyan-400 transition-colors duration-300">
                                            {module.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center">
                                        <p className="text-gray-200 mb-4 sm:mb-6 text-sm sm:text-base md:text-lg">{module.description}</p>
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

            {/* Modales de Cliente */}
            <ClienteLoginModal
                open={loginModalOpen}
                onClose={() => setLoginModalOpen(false)}
                onSwitchToRegister={() => {
                    setLoginModalOpen(false);
                    setRegisterModalOpen(true);
                }}
                onLoginSuccess={() => {
                    navigate('/clientes');
                }}
            />

            <ClienteRegisterModal
                open={registerModalOpen}
                onClose={() => setRegisterModalOpen(false)}
                onSwitchToLogin={() => {
                    setRegisterModalOpen(false);
                    setLoginModalOpen(true);
                }}
                onRegisterSuccess={() => {
                    setRegisterModalOpen(false);
                    setLoginModalOpen(true);
                }}
            />
        </div>
    );
};

export default HomePage;