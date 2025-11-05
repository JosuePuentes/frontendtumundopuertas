import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ClienteLoginModal from "@/organism/clientes/ClienteLoginModal";
import ClienteRegisterModal from "@/organism/clientes/ClienteRegisterModal";
import ClienteForgotPassword from "@/organism/clientes/ClienteForgotPassword";
import { getApiUrl } from "@/lib/api";
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
    const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
    
    // Función para obtener permisos del usuario
    const getPermisos = (): string[] => {
        try {
            const raw = localStorage.getItem("permisos");
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    };

    const apiUrl = getApiUrl();

    // Cargar configuración desde el backend
    useEffect(() => {
        const loadConfig = async () => {
            try {
                // Intentar cargar desde el backend primero
                const response = await fetch(`${apiUrl}/home/config`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.config) {
                        console.log('Configuración cargada desde el backend:', data.config);
                        setConfig(data.config);
                        // Actualizar localStorage como cache
                        localStorage.setItem('home-config', JSON.stringify(data.config));
                        return;
                    }
                } else if (response.status === 404) {
                    // No hay configuración en el backend, intentar desde localStorage como fallback
                    console.log('No hay configuración en el backend, intentando desde localStorage...');
                }
            } catch (error) {
                console.error('Error al cargar configuración del backend:', error);
                // Continuar con localStorage como fallback
            }

            // Fallback: cargar desde localStorage si el backend no tiene configuración
            const savedConfig = localStorage.getItem('home-config');
            if (savedConfig) {
                try {
                    const parsedConfig = JSON.parse(savedConfig);
                    console.log('Configuración cargada desde localStorage:', parsedConfig);
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
    }, [apiUrl]);

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
            title: "Pedidos Web",
            description: "Gestionar pedidos desde el catálogo de clientes",
            icon: ShoppingCart,
            color: "from-cyan-400 to-blue-500",
            href: "/pedidos-web",
            permiso: "pedidos_web"
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
            <div className="min-h-screen overflow-hidden relative" style={{ backgroundColor: currentConfig.colors.background, color: currentConfig.colors.text }}>
                {/* Futuristic Glitch Background - Crack Lines */}
                <div className="absolute inset-0">
                    {/* Horizontal Crack Lines - Futuristic */}
                    <div className="absolute top-20 left-0 w-full h-px opacity-70" style={{
                        backgroundColor: currentConfig.colors.primary,
                        clipPath: 'polygon(0% 0%, 20% 0%, 25% 100%, 30% 0%, 45% 0%, 50% 100%, 55% 0%, 70% 0%, 75% 100%, 80% 0%, 100% 0%)'
                    }}></div>
                    <div className="absolute top-40 left-0 w-full h-px opacity-50" style={{
                        backgroundColor: currentConfig.colors.primary,
                        clipPath: 'polygon(0% 0%, 15% 0%, 20% 100%, 35% 0%, 40% 100%, 45% 0%, 60% 0%, 65% 100%, 70% 0%, 85% 0%, 100% 0%)'
                    }}></div>
                    <div className="absolute bottom-40 left-0 w-full h-px opacity-60" style={{
                        backgroundColor: currentConfig.colors.primary,
                        clipPath: 'polygon(0% 0%, 10% 0%, 15% 100%, 30% 0%, 35% 100%, 40% 0%, 55% 0%, 60% 100%, 65% 0%, 80% 0%, 85% 100%, 100% 0%)'
                    }}></div>
                    <div className="absolute bottom-20 left-0 w-full h-px opacity-40" style={{
                        backgroundColor: currentConfig.colors.primary,
                        clipPath: 'polygon(0% 0%, 25% 0%, 30% 100%, 35% 0%, 50% 0%, 55% 100%, 60% 0%, 75% 0%, 80% 100%, 100% 0%)'
                    }}></div>
                    
                    {/* Vertical Crack Lines - Futuristic */}
                    <div className="absolute left-20 top-0 w-px h-full opacity-50" style={{
                        backgroundColor: currentConfig.colors.primary,
                        clipPath: 'polygon(0% 0%, 100% 20%, 0% 25%, 100% 40%, 0% 45%, 100% 60%, 0% 65%, 100% 80%, 0% 100%)'
                    }}></div>
                    <div className="absolute right-20 top-0 w-px h-full opacity-40" style={{
                        backgroundColor: currentConfig.colors.primary,
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
                                    <div className="w-20 h-20 rounded-full border-2 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center shadow-lg" style={{ borderColor: currentConfig.colors.primary, boxShadow: `0 0 20px ${currentConfig.colors.primary}30` }}>
                                        <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                                            {/* TM Letters - Portal Style */}
                                            <div className="relative z-10">
                                                <div className="font-bold text-lg leading-none" style={{ color: currentConfig.colors.primary }}>
                                                    <div className="text-sm font-black">T</div>
                                                    <div className="text-sm font-black">M</div>
                                                </div>
                                            </div>
                                            {/* Portal effect lines */}
                                            <div className="absolute inset-0 border rounded-lg" style={{ borderColor: `${currentConfig.colors.primary}30` }}></div>
                                            <div className="absolute top-1 left-1 right-1 h-px" style={{ backgroundColor: `${currentConfig.colors.primary}50` }}></div>
                                            <div className="absolute bottom-1 left-1 right-1 h-px" style={{ backgroundColor: `${currentConfig.colors.primary}50` }}></div>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 rounded-full border animate-pulse opacity-50" style={{ borderColor: currentConfig.colors.primary }}></div>
                            </div>
                            )}
                            
                            <div className="flex flex-col">
                                <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-wide" style={{ color: currentConfig.colors.text }}>
                                    {currentConfig.logo.text}
                                </span>
                                <div className="w-full h-px mt-1 sm:mt-2" style={{ background: `linear-gradient(to right, ${currentConfig.colors.primary}, transparent)` }}></div>
                                <span className="text-xs sm:text-sm mt-1 sm:mt-2" style={{ color: currentConfig.colors.text }}>
                                    {currentConfig.logo.slogan}
                                </span>
                            </div>
                        </div>
                        
                        <nav className="hidden lg:flex space-x-4 md:space-x-8">
                            <a 
                                href="#inicio"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="transition-colors duration-300 relative group"
                                style={{ color: currentConfig.colors.text }}
                                onMouseEnter={(e) => e.currentTarget.style.color = currentConfig.colors.primary}
                                onMouseLeave={(e) => e.currentTarget.style.color = currentConfig.colors.text}
                            >
                                Inicio
                                <div className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full" style={{ backgroundColor: currentConfig.colors.primary }}></div>
                            </a>
                            <a 
                                href="#productos"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="transition-colors duration-300 relative group"
                                style={{ color: currentConfig.colors.text }}
                                onMouseEnter={(e) => e.currentTarget.style.color = currentConfig.colors.primary}
                                onMouseLeave={(e) => e.currentTarget.style.color = currentConfig.colors.text}
                            >
                                Productos
                                <div className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full" style={{ backgroundColor: currentConfig.colors.primary }}></div>
                            </a>
                            <a 
                                href="#nosotros"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('nosotros')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="transition-colors duration-300 relative group"
                                style={{ color: currentConfig.colors.text }}
                                onMouseEnter={(e) => e.currentTarget.style.color = currentConfig.colors.primary}
                                onMouseLeave={(e) => e.currentTarget.style.color = currentConfig.colors.text}
                            >
                                Nosotros
                                <div className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full" style={{ backgroundColor: currentConfig.colors.primary }}></div>
                            </a>
                            <a 
                                href="#servicios"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="transition-colors duration-300 relative group"
                                style={{ color: currentConfig.colors.text }}
                                onMouseEnter={(e) => e.currentTarget.style.color = currentConfig.colors.primary}
                                onMouseLeave={(e) => e.currentTarget.style.color = currentConfig.colors.text}
                            >
                                Servicios
                                <div className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full" style={{ backgroundColor: currentConfig.colors.primary }}></div>
                            </a>
                            <a 
                                href="#contacto"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="transition-colors duration-300 relative group"
                                style={{ color: currentConfig.colors.text }}
                                onMouseEnter={(e) => e.currentTarget.style.color = currentConfig.colors.primary}
                                onMouseLeave={(e) => e.currentTarget.style.color = currentConfig.colors.text}
                            >
                                Contacto
                                <div className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full" style={{ backgroundColor: currentConfig.colors.primary }}></div>
                            </a>
                        </nav>
                        
                        <Button 
                            onClick={() => setLoginModalOpen(true)}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30 hover:shadow-purple-400/50 text-sm sm:text-base w-full sm:w-auto"
                        >
                            <span className="hidden sm:inline">INICIAR SESIÓN</span>
                            <span className="sm:hidden">SESION</span>
                        </Button>
                    </div>
                </header>

                {/* Dynamic Banner Section - Large Banner */}
                {currentConfig.banner.enabled && (
                    <section className="relative z-10 py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 md:p-16 lg:p-20 backdrop-blur-sm min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center justify-center" style={{ borderColor: currentConfig.colors.primary }}>
                                <div className="text-center w-full">
                                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 md:mb-10" style={{ color: currentConfig.colors.text }}>{currentConfig.banner.title}</h2>
                                    <p className="mb-6 sm:mb-8 md:mb-12 text-lg sm:text-xl md:text-2xl" style={{ color: currentConfig.colors.text }}>{currentConfig.banner.subtitle}</p>
                                    {currentConfig.banner.image && (
                                        <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] bg-gradient-to-r from-gray-600 to-gray-700 border-2 rounded-lg flex items-center justify-center overflow-hidden" style={{ borderColor: currentConfig.colors.primary }}>
                                            <img src={currentConfig.banner.image} alt="Banner" className="w-full h-full object-cover rounded-lg" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Product Gallery Section */}
                <section id="productos" className="relative z-10 py-10 sm:py-16 md:py-20 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-12" style={{ color: currentConfig.colors.text }}>{currentConfig.products.title}</h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                            {currentConfig.products.items.filter(item => item.enabled).map((product) => (
                                <div key={product.id} className="bg-gray-700/50 border-2 rounded-lg p-6 backdrop-blur-sm group transition-all duration-300" style={{ borderColor: currentConfig.colors.primary }} onMouseEnter={(e) => e.currentTarget.style.borderColor = currentConfig.colors.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = currentConfig.colors.primary}>
                                    <div className="w-full h-48 bg-gray-600 rounded-lg mb-4 flex items-center justify-center border-2" style={{ borderColor: currentConfig.colors.primary }}>
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <span className="font-semibold text-lg" style={{ color: currentConfig.colors.primary }}>{product.name}</span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2" style={{ color: currentConfig.colors.text }}>{product.name}</h3>
                                    <p className="mb-4" style={{ color: currentConfig.colors.text }}>{product.description}</p>
                                    <Button className="w-full font-semibold py-2 rounded-lg transition-all duration-300" style={{ background: `linear-gradient(to right, ${currentConfig.colors.primary}, ${currentConfig.colors.secondary})`, color: '#000000' }}>
                                        Ver Más
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Nosotros Section - Misión y Visión */}
                <section id="nosotros" className="relative z-10 py-20 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: currentConfig.colors.text }}>Nosotros</h2>
                            <div className="w-24 h-1 mx-auto" style={{ background: `linear-gradient(to right, transparent, ${currentConfig.colors.primary}, transparent)` }}></div>
                        </div>
                        
                        {/* Historia */}
                        <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 md:p-12 mb-8 backdrop-blur-sm" style={{ borderColor: currentConfig.colors.primary }}>
                            <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-center" style={{ color: currentConfig.colors.primary }}>Nuestra Historia</h3>
                            <p className="text-base sm:text-lg leading-relaxed text-center" style={{ color: currentConfig.colors.text }}>
                                Todo comenzó como un sueño, una idea, pero con muchas ganas. Con el paso de los años, hemos logrado consolidarnos 
                                como líderes en el mercado de puertas y ventanas, acumulando más de <strong style={{ color: currentConfig.colors.primary }}>10 años de experiencia</strong> 
                                en el sector. Nos hemos posicionado firmemente en nuestra región y estamos abriendo caminos en todo el territorio nacional.
                            </p>
                        </div>

                        {/* Grid de Misión y Visión */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            {/* Misión */}
                            <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 backdrop-blur-sm transition-all duration-300" style={{ borderColor: currentConfig.colors.primary }} onMouseEnter={(e) => e.currentTarget.style.borderColor = currentConfig.colors.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = currentConfig.colors.primary}>
                                <div className="text-center mb-4">
                                    <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: currentConfig.colors.primary }} />
                                    <h3 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: currentConfig.colors.primary }}>Nuestra Misión</h3>
                                </div>
                                <p className="text-base sm:text-lg leading-relaxed" style={{ color: currentConfig.colors.text }}>
                                    Proporcionar puertas y ventanas de alta calidad a precios competitivos, fabricando productos personalizados 
                                    en tiempo récord. Nos comprometemos a ofrecer el mejor precio del mercado sin comprometer la excelencia en 
                                    calidad, asegurando que cada producto brinde seguridad y satisfacción a nuestros clientes.
                                </p>
                            </div>

                            {/* Visión */}
                            <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 backdrop-blur-sm transition-all duration-300" style={{ borderColor: currentConfig.colors.primary }} onMouseEnter={(e) => e.currentTarget.style.borderColor = currentConfig.colors.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = currentConfig.colors.primary}>
                                <div className="text-center mb-4">
                                    <Star className="w-16 h-16 mx-auto mb-4" style={{ color: currentConfig.colors.primary }} />
                                    <h3 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: currentConfig.colors.primary }}>Nuestra Visión</h3>
                                </div>
                                <p className="text-base sm:text-lg leading-relaxed" style={{ color: currentConfig.colors.text }}>
                                    Ser la empresa líder en fabricación y distribución de puertas y ventanas a nivel nacional, reconocida por 
                                    nuestra capacidad de envío a todo el territorio, tiempos de fabricación récord, precios competitivos y, 
                                    sobre todo, por la calidad excepcional que garantiza la seguridad y confianza de nuestros clientes en 
                                    cada uno de nuestros productos.
                                </p>
                            </div>
                        </div>

                        {/* Valores destacados */}
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            <div className="bg-gray-700/30 border rounded-lg p-4 text-center" style={{ borderColor: `${currentConfig.colors.primary}50` }}>
                                <Zap className="w-10 h-10 mx-auto mb-2" style={{ color: currentConfig.colors.primary }} />
                                <h4 className="text-lg font-bold mb-2" style={{ color: currentConfig.colors.primary }}>Fabricación Rápida</h4>
                                <p className="text-sm" style={{ color: currentConfig.colors.text }}>Tiempo récord en producción</p>
                            </div>
                            <div className="bg-gray-700/30 border rounded-lg p-4 text-center" style={{ borderColor: `${currentConfig.colors.primary}50` }}>
                                <Star className="w-10 h-10 mx-auto mb-2" style={{ color: currentConfig.colors.primary }} />
                                <h4 className="text-lg font-bold mb-2" style={{ color: currentConfig.colors.primary }}>Mejor Precio</h4>
                                <p className="text-sm" style={{ color: currentConfig.colors.text }}>Competitivos en el mercado</p>
                            </div>
                            <div className="bg-gray-700/30 border rounded-lg p-4 text-center" style={{ borderColor: `${currentConfig.colors.primary}50` }}>
                                <Shield className="w-10 h-10 mx-auto mb-2" style={{ color: currentConfig.colors.primary }} />
                                <h4 className="text-lg font-bold mb-2" style={{ color: currentConfig.colors.primary }}>Alta Calidad</h4>
                                <p className="text-sm" style={{ color: currentConfig.colors.text }}>Seguridad garantizada</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Servicios Section */}
                <section id="servicios" className="relative z-10 py-20 px-4 sm:px-6 bg-gray-800/30">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: currentConfig.colors.text }}>Nuestros Servicios</h2>
                            <div className="w-24 h-1 mx-auto" style={{ background: `linear-gradient(to right, transparent, ${currentConfig.colors.primary}, transparent)` }}></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            {/* Servicio 1 */}
                            <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 backdrop-blur-sm transition-all duration-300" style={{ borderColor: currentConfig.colors.primary }} onMouseEnter={(e) => e.currentTarget.style.borderColor = currentConfig.colors.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = currentConfig.colors.primary}>
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        <ShoppingCart className="w-12 h-12" style={{ color: currentConfig.colors.primary }} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: currentConfig.colors.primary }}>Venta de Puertas y Ventanas</h3>
                                        <p className="text-base sm:text-lg leading-relaxed" style={{ color: currentConfig.colors.text }}>
                                            Ofrecemos una amplia variedad de puertas y ventanas a los mejores precios del mercado. 
                                            Todos nuestros productos son seleccionados cuidadosamente para garantizar la mejor relación 
                                            calidad-precio para nuestros clientes.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Servicio 2 */}
                            <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 backdrop-blur-sm transition-all duration-300" style={{ borderColor: currentConfig.colors.primary }} onMouseEnter={(e) => e.currentTarget.style.borderColor = currentConfig.colors.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = currentConfig.colors.primary}>
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        <Package className="w-12 h-12" style={{ color: currentConfig.colors.primary }} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: currentConfig.colors.primary }}>Fabricación a Medida</h3>
                                        <p className="text-base sm:text-lg leading-relaxed" style={{ color: currentConfig.colors.text }}>
                                            Si necesitas medidas especiales, las fabricamos para ti. Trabajamos en tiempo récord sin 
                                            comprometer la calidad. Cada producto personalizado es fabricado con los más altos estándares 
                                            de calidad y seguridad.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Servicio 3 */}
                            <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 backdrop-blur-sm transition-all duration-300" style={{ borderColor: currentConfig.colors.primary }} onMouseEnter={(e) => e.currentTarget.style.borderColor = currentConfig.colors.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = currentConfig.colors.primary}>
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        <Zap className="w-12 h-12" style={{ color: currentConfig.colors.primary }} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: currentConfig.colors.primary }}>Tiempo Récord</h3>
                                        <p className="text-base sm:text-lg leading-relaxed" style={{ color: currentConfig.colors.text }}>
                                            Entendemos la urgencia de nuestros clientes. Por eso, fabricamos tus productos en el menor 
                                            tiempo posible, siempre manteniendo los más altos estándares de calidad y seguridad.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Servicio 4 */}
                            <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 backdrop-blur-sm transition-all duration-300" style={{ borderColor: currentConfig.colors.primary }} onMouseEnter={(e) => e.currentTarget.style.borderColor = currentConfig.colors.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = currentConfig.colors.primary}>
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        <Star className="w-12 h-12" style={{ color: currentConfig.colors.primary }} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: currentConfig.colors.primary }}>Mejor Precio del Mercado</h3>
                                        <p className="text-base sm:text-lg leading-relaxed" style={{ color: currentConfig.colors.text }}>
                                            Ofrecemos los mejores precios sin sacrificar calidad. Nuestro compromiso es brindarte 
                                            productos de alta calidad a precios competitivos que se ajusten a tu presupuesto.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </section>

                {/* Contact Section */}
                <section id="contacto" className="relative z-10 py-20 px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: currentConfig.colors.text }}>{currentConfig.contact.title}</h2>
                            <div className="w-24 h-1 mx-auto mb-6" style={{ background: `linear-gradient(to right, transparent, ${currentConfig.colors.primary}, transparent)` }}></div>
                            <p className="text-lg" style={{ color: currentConfig.colors.text }}>{currentConfig.contact.subtitle}</p>
                        </div>

                        <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 md:p-12 backdrop-blur-sm" style={{ borderColor: currentConfig.colors.primary }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                {/* Información de Contacto */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: currentConfig.colors.primary }}>Información de Contacto</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    <span className="text-xl" style={{ color: currentConfig.colors.primary }}>📍</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold" style={{ color: currentConfig.colors.text }}>Dirección:</p>
                                                    <p style={{ color: currentConfig.colors.text, opacity: 0.8 }}>Av. Principal, Zona Industrial</p>
                                                    <p style={{ color: currentConfig.colors.text, opacity: 0.8 }}>San Francisco, Estado Zulia</p>
                                                    <p style={{ color: currentConfig.colors.text, opacity: 0.8 }}>Venezuela</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    <span className="text-xl" style={{ color: currentConfig.colors.primary }}>📞</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold" style={{ color: currentConfig.colors.text }}>Teléfono:</p>
                                                    <p style={{ color: currentConfig.colors.text, opacity: 0.8 }}>+58 412-123-4567</p>
                                                    <p style={{ color: currentConfig.colors.text, opacity: 0.8 }}>+58 416-987-6543</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    <span className="text-xl" style={{ color: currentConfig.colors.primary }}>✉️</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold" style={{ color: currentConfig.colors.text }}>Email:</p>
                                                    <p style={{ color: currentConfig.colors.text, opacity: 0.8 }}>contacto@tumundopuertas.com</p>
                                                    <p style={{ color: currentConfig.colors.text, opacity: 0.8 }}>ventas@tumundopuertas.com</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    <span className="text-xl" style={{ color: currentConfig.colors.primary }}>🕒</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold" style={{ color: currentConfig.colors.text }}>Horario de Atención:</p>
                                                    <p style={{ color: currentConfig.colors.text, opacity: 0.8 }}>Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                                                    <p style={{ color: currentConfig.colors.text, opacity: 0.8 }}>Sábados: 8:00 AM - 2:00 PM</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Redes Sociales / Información Adicional */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: currentConfig.colors.primary }}>Síguenos</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-xl" style={{ color: currentConfig.colors.primary }}>📱</span>
                                                <p style={{ color: currentConfig.colors.text }}>Instagram: @tumundopuertas</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-xl" style={{ color: currentConfig.colors.primary }}>📘</span>
                                                <p style={{ color: currentConfig.colors.text }}>Facebook: Tu Mundo Puertas</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-xl" style={{ color: currentConfig.colors.primary }}>💼</span>
                                                <p style={{ color: currentConfig.colors.text }}>WhatsApp: +58 412-123-4567</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border rounded-lg p-4" style={{ backgroundColor: `${currentConfig.colors.primary}10`, borderColor: `${currentConfig.colors.primary}30` }}>
                                        <p className="text-sm sm:text-base" style={{ color: currentConfig.colors.text }}>
                                            <strong style={{ color: currentConfig.colors.primary }}>¿Tienes una pregunta?</strong><br />
                                            Estamos aquí para ayudarte. Contáctanos y te responderemos lo antes posible.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

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
                    onForgotPassword={() => {
                        setForgotPasswordModalOpen(true);
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

                <ClienteForgotPassword
                    open={forgotPasswordModalOpen}
                    onClose={() => setForgotPasswordModalOpen(false)}
                    onSwitchToLogin={() => {
                        setForgotPasswordModalOpen(false);
                        setLoginModalOpen(true);
                    }}
                />
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
                onForgotPassword={() => {
                    setForgotPasswordModalOpen(true);
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

            <ClienteForgotPassword
                open={forgotPasswordModalOpen}
                onClose={() => setForgotPasswordModalOpen(false)}
                onSwitchToLogin={() => {
                    setForgotPasswordModalOpen(false);
                    setLoginModalOpen(true);
                }}
            />
        </div>
    );
};

export default HomePage;