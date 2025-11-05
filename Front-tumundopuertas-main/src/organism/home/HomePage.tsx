import React, { useState, useEffect, useMemo } from 'react';
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
  Star,
  Receipt
} from "lucide-react";

interface HomeConfig {
  banner: {
    title: string;
    subtitle: string;
    image: string;
    enabled: boolean;
    width?: string;
    height?: string;
  };
  logo: {
    text: string;
    slogan: string;
    image: string;
    enabled: boolean;
    width?: string;
    height?: string;
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
    direccion?: string;
    ciudad?: string;
    estado?: string;
    pais?: string;
    telefono1?: string;
    telefono2?: string;
    email1?: string;
    email2?: string;
    horarioLunesViernes?: string;
    horarioSabados?: string;
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    mensajeAdicional?: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  nosotros?: {
    historia: string;
    mision: string;
    vision: string;
    enabled: boolean;
    titleFontSize?: string;
    titleFontFamily?: string;
    titleFontWeight?: string;
    textFontSize?: string;
    textFontFamily?: string;
    textFontWeight?: string;
  };
  servicios?: {
    items: Array<{
      id: string;
      title: string;
      description: string;
      enabled: boolean;
    }>;
    enabled: boolean;
    titleFontSize?: string;
    titleFontFamily?: string;
    titleFontWeight?: string;
    textFontSize?: string;
    textFontFamily?: string;
    textFontWeight?: string;
  };
  typography?: {
    defaultFontFamily?: string;
    defaultFontSize?: string;
    headingFontFamily?: string;
    headingFontSize?: string;
    headingFontWeight?: string;
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
            enabled: true,
            direccion: "Av. Principal, Zona Industrial",
            ciudad: "San Francisco",
            estado: "Estado Zulia",
            pais: "Venezuela",
            telefono1: "+58 412-123-4567",
            telefono2: "+58 416-987-6543",
            email1: "contacto@tumundopuertas.com",
            email2: "ventas@tumundopuertas.com",
            horarioLunesViernes: "Lunes a Viernes: 8:00 AM - 6:00 PM",
            horarioSabados: "Sábados: 8:00 AM - 2:00 PM",
            instagram: "@tumundopuertas",
            facebook: "Tu Mundo Puertas",
            whatsapp: "+58 412-123-4567",
            mensajeAdicional: "¿Tienes una pregunta? Estamos aquí para ayudarte. Contáctanos y te responderemos lo antes posible."
        },
        colors: {
            primary: "#06b6d4",
            secondary: "#0891b2",
            accent: "#22d3ee",
            background: "#000000",
            text: "#e5e7eb"
        },
        nosotros: {
            historia: "Todo comenzó como un sueño, una idea, pero con muchas ganas...",
            mision: "Proporcionar puertas y ventanas de alta calidad a precios competitivos...",
            vision: "Ser la empresa líder en fabricación y distribución...",
            enabled: true,
            titleFontSize: "2rem",
            titleFontFamily: "Arial, sans-serif",
            titleFontWeight: "bold",
            textFontSize: "1rem",
            textFontFamily: "Arial, sans-serif",
            textFontWeight: "normal"
        },
        servicios: {
            items: [],
            enabled: true,
            titleFontSize: "1.5rem",
            titleFontFamily: "Arial, sans-serif",
            titleFontWeight: "bold",
            textFontSize: "1rem",
            textFontFamily: "Arial, sans-serif",
            textFontWeight: "normal"
        },
        typography: {
            defaultFontFamily: "Arial, sans-serif",
            defaultFontSize: "1rem",
            headingFontFamily: "Arial, sans-serif",
            headingFontSize: "2rem",
            headingFontWeight: "bold"
        }
    };

    // Validar y asegurar que todos los campos requeridos existan con validación profunda
    // Usar useMemo para evitar recalcular en cada render
    const safeConfig: HomeConfig = useMemo(() => {
        // Si no hay config, usar directamente defaultConfig
        if (!config) {
            return defaultConfig;
        }

        // Validar cada propiedad con fallback a defaultConfig
        return {
            banner: config.banner && typeof config.banner === 'object' && !Array.isArray(config.banner)
                ? {
                    title: config.banner.title ?? defaultConfig.banner.title,
                    subtitle: config.banner.subtitle ?? defaultConfig.banner.subtitle,
                    // El backend puede usar 'url' o 'image', normalizamos a 'image'
                    image: (config.banner as any).url || config.banner.image || defaultConfig.banner.image,
                    enabled: config.banner.enabled !== undefined ? config.banner.enabled : defaultConfig.banner.enabled,
                    width: config.banner.width ?? defaultConfig.banner.width ?? "100%",
                    height: config.banner.height ?? defaultConfig.banner.height ?? "400px"
                }
                : defaultConfig.banner,
            logo: config.logo && typeof config.logo === 'object' && !Array.isArray(config.logo)
                ? {
                    text: config.logo.text ?? defaultConfig.logo.text,
                    slogan: config.logo.slogan ?? defaultConfig.logo.slogan,
                    // El backend puede usar 'url' o 'image', normalizamos a 'image'
                    image: (config.logo as any).url || config.logo.image || defaultConfig.logo.image,
                    enabled: config.logo.enabled !== undefined ? config.logo.enabled : defaultConfig.logo.enabled,
                    width: config.logo.width ?? defaultConfig.logo.width ?? "200px",
                    height: config.logo.height ?? defaultConfig.logo.height ?? "auto"
                }
                : defaultConfig.logo,
            values: config.values && typeof config.values === 'object' && !Array.isArray(config.values)
                ? {
                    diseño: (config.values.diseño && typeof config.values.diseño === 'object' && !Array.isArray(config.values.diseño))
                        ? config.values.diseño
                        : defaultConfig.values.diseño,
                    calidad: (config.values.calidad && typeof config.values.calidad === 'object' && !Array.isArray(config.values.calidad))
                        ? config.values.calidad
                        : defaultConfig.values.calidad,
                    proteccion: (config.values.proteccion && typeof config.values.proteccion === 'object' && !Array.isArray(config.values.proteccion))
                        ? config.values.proteccion
                        : defaultConfig.values.proteccion
                }
                : defaultConfig.values,
            products: config.products && typeof config.products === 'object' && !Array.isArray(config.products)
                ? {
                    title: (config.products.title !== undefined && config.products.title !== null) 
                        ? config.products.title 
                        : defaultConfig.products.title,
                    items: Array.isArray(config.products.items) 
                        ? config.products.items.map((item: any) => {
                            // El backend puede usar 'url' o 'image', normalizamos a 'image'
                            const normalizedImage = item.url || item.image || '';
                            if (item.url && !item.image) {
                                console.log(`🔄 Producto "${item.name}": normalizando url a image (${normalizedImage.length} chars)`);
                            }
                            return {
                                ...item,
                                image: normalizedImage
                            };
                        })
                        : (defaultConfig.products.items || [])
                }
                : defaultConfig.products,
            contact: config.contact && typeof config.contact === 'object' && !Array.isArray(config.contact)
                ? {
                    title: config.contact.title ?? defaultConfig.contact.title,
                    subtitle: config.contact.subtitle ?? defaultConfig.contact.subtitle,
                    enabled: config.contact.enabled !== undefined ? config.contact.enabled : defaultConfig.contact.enabled,
                    direccion: config.contact.direccion ?? defaultConfig.contact.direccion ?? "",
                    ciudad: config.contact.ciudad ?? defaultConfig.contact.ciudad ?? "",
                    estado: config.contact.estado ?? defaultConfig.contact.estado ?? "",
                    pais: config.contact.pais ?? defaultConfig.contact.pais ?? "",
                    telefono1: config.contact.telefono1 ?? defaultConfig.contact.telefono1 ?? "",
                    telefono2: config.contact.telefono2 ?? defaultConfig.contact.telefono2 ?? "",
                    email1: config.contact.email1 ?? defaultConfig.contact.email1 ?? "",
                    email2: config.contact.email2 ?? defaultConfig.contact.email2 ?? "",
                    horarioLunesViernes: config.contact.horarioLunesViernes ?? defaultConfig.contact.horarioLunesViernes ?? "",
                    horarioSabados: config.contact.horarioSabados ?? defaultConfig.contact.horarioSabados ?? "",
                    instagram: config.contact.instagram ?? defaultConfig.contact.instagram ?? "",
                    facebook: config.contact.facebook ?? defaultConfig.contact.facebook ?? "",
                    whatsapp: config.contact.whatsapp ?? defaultConfig.contact.whatsapp ?? "",
                    mensajeAdicional: config.contact.mensajeAdicional ?? defaultConfig.contact.mensajeAdicional ?? ""
                }
                : defaultConfig.contact,
            colors: config.colors && typeof config.colors === 'object' && !Array.isArray(config.colors)
                ? {
                    primary: config.colors.primary ?? defaultConfig.colors.primary,
                    secondary: config.colors.secondary ?? defaultConfig.colors.secondary,
                    accent: config.colors.accent ?? defaultConfig.colors.accent,
                    background: config.colors.background ?? defaultConfig.colors.background,
                    text: config.colors.text ?? defaultConfig.colors.text
                }
                : defaultConfig.colors,
            nosotros: config.nosotros && typeof config.nosotros === 'object' && !Array.isArray(config.nosotros)
                ? {
                    historia: config.nosotros.historia ?? defaultConfig.nosotros!.historia,
                    mision: config.nosotros.mision ?? defaultConfig.nosotros!.mision,
                    vision: config.nosotros.vision ?? defaultConfig.nosotros!.vision,
                    enabled: config.nosotros.enabled !== undefined ? config.nosotros.enabled : defaultConfig.nosotros!.enabled,
                    titleFontSize: config.nosotros.titleFontSize ?? defaultConfig.nosotros!.titleFontSize,
                    titleFontFamily: config.nosotros.titleFontFamily ?? defaultConfig.nosotros!.titleFontFamily,
                    titleFontWeight: config.nosotros.titleFontWeight ?? defaultConfig.nosotros!.titleFontWeight,
                    textFontSize: config.nosotros.textFontSize ?? defaultConfig.nosotros!.textFontSize,
                    textFontFamily: config.nosotros.textFontFamily ?? defaultConfig.nosotros!.textFontFamily,
                    textFontWeight: config.nosotros.textFontWeight ?? defaultConfig.nosotros!.textFontWeight
                }
                : defaultConfig.nosotros!,
            servicios: config.servicios && typeof config.servicios === 'object' && !Array.isArray(config.servicios)
                ? {
                    items: Array.isArray(config.servicios.items) ? config.servicios.items : defaultConfig.servicios!.items,
                    enabled: config.servicios.enabled !== undefined ? config.servicios.enabled : defaultConfig.servicios!.enabled,
                    titleFontSize: config.servicios.titleFontSize ?? defaultConfig.servicios!.titleFontSize,
                    titleFontFamily: config.servicios.titleFontFamily ?? defaultConfig.servicios!.titleFontFamily,
                    titleFontWeight: config.servicios.titleFontWeight ?? defaultConfig.servicios!.titleFontWeight,
                    textFontSize: config.servicios.textFontSize ?? defaultConfig.servicios!.textFontSize,
                    textFontFamily: config.servicios.textFontFamily ?? defaultConfig.servicios!.textFontFamily,
                    textFontWeight: config.servicios.textFontWeight ?? defaultConfig.servicios!.textFontWeight
                }
                : defaultConfig.servicios!,
            typography: config.typography && typeof config.typography === 'object' && !Array.isArray(config.typography)
                ? {
                    defaultFontFamily: config.typography.defaultFontFamily ?? defaultConfig.typography!.defaultFontFamily,
                    defaultFontSize: config.typography.defaultFontSize ?? defaultConfig.typography!.defaultFontSize,
                    headingFontFamily: config.typography.headingFontFamily ?? defaultConfig.typography!.headingFontFamily,
                    headingFontSize: config.typography.headingFontSize ?? defaultConfig.typography!.headingFontSize,
                    headingFontWeight: config.typography.headingFontWeight ?? defaultConfig.typography!.headingFontWeight
                }
                : defaultConfig.typography!
        };
    }, [config]);

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


    // No renderizar hasta que safeConfig esté listo
    if (!safeConfig || !safeConfig.colors || !safeConfig.products) {
        return (
            <div className="min-h-screen bg-black text-gray-300 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen overflow-hidden relative" style={{ backgroundColor: safeConfig.colors.background, color: safeConfig.colors.text }}>
                {/* Futuristic Glitch Background - Crack Lines */}
                <div className="absolute inset-0">
                    {/* Horizontal Crack Lines - Futuristic */}
                    <div className="absolute top-20 left-0 w-full h-px opacity-70" style={{
                        backgroundColor: safeConfig.colors.primary,
                        clipPath: 'polygon(0% 0%, 20% 0%, 25% 100%, 30% 0%, 45% 0%, 50% 100%, 55% 0%, 70% 0%, 75% 100%, 80% 0%, 100% 0%)'
                    }}></div>
                    <div className="absolute top-40 left-0 w-full h-px opacity-50" style={{
                        backgroundColor: safeConfig.colors.primary,
                        clipPath: 'polygon(0% 0%, 15% 0%, 20% 100%, 35% 0%, 40% 100%, 45% 0%, 60% 0%, 65% 100%, 70% 0%, 85% 0%, 100% 0%)'
                    }}></div>
                    <div className="absolute bottom-40 left-0 w-full h-px opacity-60" style={{
                        backgroundColor: safeConfig.colors.primary,
                        clipPath: 'polygon(0% 0%, 10% 0%, 15% 100%, 30% 0%, 35% 100%, 40% 0%, 55% 0%, 60% 100%, 65% 0%, 80% 0%, 85% 100%, 100% 0%)'
                    }}></div>
                    <div className="absolute bottom-20 left-0 w-full h-px opacity-40" style={{
                        backgroundColor: safeConfig.colors.primary,
                        clipPath: 'polygon(0% 0%, 25% 0%, 30% 100%, 35% 0%, 50% 0%, 55% 100%, 60% 0%, 75% 0%, 80% 100%, 100% 0%)'
                    }}></div>
                    
                    {/* Vertical Crack Lines - Futuristic */}
                    <div className="absolute left-20 top-0 w-px h-full opacity-50" style={{
                        backgroundColor: safeConfig.colors.primary,
                        clipPath: 'polygon(0% 0%, 100% 20%, 0% 25%, 100% 40%, 0% 45%, 100% 60%, 0% 65%, 100% 80%, 0% 100%)'
                    }}></div>
                    <div className="absolute right-20 top-0 w-px h-full opacity-40" style={{
                        backgroundColor: safeConfig.colors.primary,
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
                            {safeConfig.logo.enabled && (
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-2 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center shadow-lg" style={{ borderColor: safeConfig.colors.primary, boxShadow: `0 0 20px ${safeConfig.colors.primary}30` }}>
                                        <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                                            {/* TM Letters - Portal Style */}
                                            <div className="relative z-10">
                                                <div className="font-bold text-lg leading-none" style={{ color: safeConfig.colors.primary }}>
                                                    <div className="text-sm font-black">T</div>
                                                    <div className="text-sm font-black">M</div>
                                                </div>
                                            </div>
                                            {/* Portal effect lines */}
                                            <div className="absolute inset-0 border rounded-lg" style={{ borderColor: `${safeConfig.colors.primary}30` }}></div>
                                            <div className="absolute top-1 left-1 right-1 h-px" style={{ backgroundColor: `${safeConfig.colors.primary}50` }}></div>
                                            <div className="absolute bottom-1 left-1 right-1 h-px" style={{ backgroundColor: `${safeConfig.colors.primary}50` }}></div>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 rounded-full border animate-pulse opacity-50" style={{ borderColor: safeConfig.colors.primary }}></div>
                            </div>
                            )}
                            
                            <div className="flex flex-col">
                                <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-wide" style={{ color: safeConfig.colors.text }}>
                                    {safeConfig.logo.text}
                                </span>
                                <div className="w-full h-px mt-1 sm:mt-2" style={{ background: `linear-gradient(to right, ${safeConfig.colors.primary}, transparent)` }}></div>
                                <span className="text-xs sm:text-sm mt-1 sm:mt-2" style={{ color: safeConfig.colors.text }}>
                                    {safeConfig.logo.slogan}
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
                                style={{ color: safeConfig.colors.text }}
                                onMouseEnter={(e) => e.currentTarget.style.color = safeConfig.colors.primary}
                                onMouseLeave={(e) => e.currentTarget.style.color = safeConfig.colors.text}
                            >
                                Inicio
                                <div className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full" style={{ backgroundColor: safeConfig.colors.primary }}></div>
                            </a>
                            <a 
                                href="#productos"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="transition-colors duration-300 relative group"
                                style={{ color: safeConfig.colors.text }}
                                onMouseEnter={(e) => e.currentTarget.style.color = safeConfig.colors.primary}
                                onMouseLeave={(e) => e.currentTarget.style.color = safeConfig.colors.text}
                            >
                                Productos
                                <div className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full" style={{ backgroundColor: safeConfig.colors.primary }}></div>
                            </a>
                            <a 
                                href="#nosotros"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('nosotros')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="transition-colors duration-300 relative group"
                                style={{ color: safeConfig.colors.text }}
                                onMouseEnter={(e) => e.currentTarget.style.color = safeConfig.colors.primary}
                                onMouseLeave={(e) => e.currentTarget.style.color = safeConfig.colors.text}
                            >
                                Nosotros
                                <div className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full" style={{ backgroundColor: safeConfig.colors.primary }}></div>
                            </a>
                            <a 
                                href="#servicios"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="transition-colors duration-300 relative group"
                                style={{ color: safeConfig.colors.text }}
                                onMouseEnter={(e) => e.currentTarget.style.color = safeConfig.colors.primary}
                                onMouseLeave={(e) => e.currentTarget.style.color = safeConfig.colors.text}
                            >
                                Servicios
                                <div className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full" style={{ backgroundColor: safeConfig.colors.primary }}></div>
                            </a>
                            <a 
                                href="#contacto"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="transition-colors duration-300 relative group"
                                style={{ color: safeConfig.colors.text }}
                                onMouseEnter={(e) => e.currentTarget.style.color = safeConfig.colors.primary}
                                onMouseLeave={(e) => e.currentTarget.style.color = safeConfig.colors.text}
                            >
                                Contacto
                                <div className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full" style={{ backgroundColor: safeConfig.colors.primary }}></div>
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
                {safeConfig.banner.enabled && (
                    <section className="relative z-10 py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 md:p-16 lg:p-20 backdrop-blur-sm min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center justify-center" style={{ borderColor: safeConfig.colors.primary }}>
                                <div className="text-center w-full">
                                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 md:mb-10" style={{ color: safeConfig.colors.text }}>{safeConfig.banner.title}</h2>
                                    <p className="mb-6 sm:mb-8 md:mb-12 text-lg sm:text-xl md:text-2xl" style={{ color: safeConfig.colors.text }}>{safeConfig.banner.subtitle}</p>
                                    {safeConfig.banner.image && (
                                        <div className="w-full bg-gradient-to-r from-gray-600 to-gray-700 border-2 rounded-lg flex items-center justify-center overflow-hidden mx-auto" style={{ borderColor: safeConfig.colors.primary, width: safeConfig.banner.width || "100%", height: safeConfig.banner.height || "400px" }}>
                                            <img src={safeConfig.banner.image} alt="Banner" className="w-full h-full object-cover rounded-lg" style={{ width: safeConfig.banner.width || "100%", height: safeConfig.banner.height || "400px" }} />
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
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-12" style={{ color: safeConfig.colors.text }}>{safeConfig.products.title}</h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                            {(safeConfig.products.items || []).filter(item => item && item.enabled).map((product) => (
                                <div key={product.id} className="bg-gray-700/50 border-2 rounded-lg p-6 backdrop-blur-sm group transition-all duration-300" style={{ borderColor: safeConfig.colors.primary }} onMouseEnter={(e) => e.currentTarget.style.borderColor = safeConfig.colors.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = safeConfig.colors.primary}>
                                    <div className="w-full h-48 bg-gray-600 rounded-lg mb-4 flex items-center justify-center border-2" style={{ borderColor: safeConfig.colors.primary }}>
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <span className="font-semibold text-lg" style={{ color: safeConfig.colors.primary }}>{product.name}</span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2" style={{ color: safeConfig.colors.text }}>{product.name}</h3>
                                    <p className="mb-4" style={{ color: safeConfig.colors.text }}>{product.description}</p>
                                    <Button className="w-full font-semibold py-2 rounded-lg transition-all duration-300" style={{ background: `linear-gradient(to right, ${safeConfig.colors.primary}, ${safeConfig.colors.secondary})`, color: '#000000' }}>
                                        Ver Más
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Nosotros Section - Misión y Visión */}
                {safeConfig.nosotros && safeConfig.nosotros.enabled && (
                    <section id="nosotros" className="relative z-10 py-20 px-4 sm:px-6" style={{ fontFamily: safeConfig.typography?.defaultFontFamily }}>
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ 
                                    color: safeConfig.colors.text,
                                    fontFamily: safeConfig.typography?.headingFontFamily || safeConfig.nosotros.titleFontFamily,
                                    fontSize: safeConfig.typography?.headingFontSize || safeConfig.nosotros.titleFontSize,
                                    fontWeight: safeConfig.typography?.headingFontWeight || safeConfig.nosotros.titleFontWeight
                                }}>Nosotros</h2>
                                <div className="w-24 h-1 mx-auto" style={{ background: `linear-gradient(to right, transparent, ${safeConfig.colors.primary}, transparent)` }}></div>
                            </div>
                            
                            {/* Historia */}
                            <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 md:p-12 mb-8 backdrop-blur-sm" style={{ borderColor: safeConfig.colors.primary }}>
                                <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-center" style={{ 
                                    color: safeConfig.colors.primary,
                                    fontFamily: safeConfig.nosotros.titleFontFamily,
                                    fontSize: safeConfig.nosotros.titleFontSize,
                                    fontWeight: safeConfig.nosotros.titleFontWeight
                                }}>Nuestra Historia</h3>
                                <p className="text-base sm:text-lg leading-relaxed text-center" style={{ 
                                    color: safeConfig.colors.text,
                                    fontFamily: safeConfig.nosotros.textFontFamily,
                                    fontSize: safeConfig.nosotros.textFontSize,
                                    fontWeight: safeConfig.nosotros.textFontWeight
                                }}>
                                    {safeConfig.nosotros.historia || "Todo comenzó como un sueño, una idea, pero con muchas ganas..."}
                                </p>
                            </div>

                            {/* Grid de Misión y Visión */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                {/* Misión */}
                                <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 backdrop-blur-sm transition-all duration-300" style={{ borderColor: safeConfig.colors.primary }} onMouseEnter={(e) => e.currentTarget.style.borderColor = safeConfig.colors.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = safeConfig.colors.primary}>
                                    <div className="text-center mb-4">
                                        <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: safeConfig.colors.primary }} />
                                        <h3 className="text-2xl sm:text-3xl font-bold mb-4" style={{ 
                                            color: safeConfig.colors.primary,
                                            fontFamily: safeConfig.nosotros.titleFontFamily,
                                            fontSize: safeConfig.nosotros.titleFontSize,
                                            fontWeight: safeConfig.nosotros.titleFontWeight
                                        }}>Nuestra Misión</h3>
                                    </div>
                                    <p className="text-base sm:text-lg leading-relaxed" style={{ 
                                        color: safeConfig.colors.text,
                                        fontFamily: safeConfig.nosotros.textFontFamily,
                                        fontSize: safeConfig.nosotros.textFontSize,
                                        fontWeight: safeConfig.nosotros.textFontWeight
                                    }}>
                                        {safeConfig.nosotros.mision || "Proporcionar puertas y ventanas de alta calidad a precios competitivos..."}
                                    </p>
                                </div>

                                {/* Visión */}
                                <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 backdrop-blur-sm transition-all duration-300" style={{ borderColor: safeConfig.colors.primary }} onMouseEnter={(e) => e.currentTarget.style.borderColor = safeConfig.colors.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = safeConfig.colors.primary}>
                                    <div className="text-center mb-4">
                                        <Star className="w-16 h-16 mx-auto mb-4" style={{ color: safeConfig.colors.primary }} />
                                        <h3 className="text-2xl sm:text-3xl font-bold mb-4" style={{ 
                                            color: safeConfig.colors.primary,
                                            fontFamily: safeConfig.nosotros.titleFontFamily,
                                            fontSize: safeConfig.nosotros.titleFontSize,
                                            fontWeight: safeConfig.nosotros.titleFontWeight
                                        }}>Nuestra Visión</h3>
                                    </div>
                                    <p className="text-base sm:text-lg leading-relaxed" style={{ 
                                        color: safeConfig.colors.text,
                                        fontFamily: safeConfig.nosotros.textFontFamily,
                                        fontSize: safeConfig.nosotros.textFontSize,
                                        fontWeight: safeConfig.nosotros.textFontWeight
                                    }}>
                                        {safeConfig.nosotros.vision || "Ser la empresa líder en fabricación y distribución..."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Servicios Section */}
                {safeConfig.servicios && safeConfig.servicios.enabled && (
                    <section id="servicios" className="relative z-10 py-20 px-4 sm:px-6 bg-gray-800/30" style={{ fontFamily: safeConfig.typography?.defaultFontFamily }}>
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ 
                                    color: safeConfig.colors.text,
                                    fontFamily: safeConfig.typography?.headingFontFamily || safeConfig.servicios.titleFontFamily,
                                    fontSize: safeConfig.typography?.headingFontSize || safeConfig.servicios.titleFontSize,
                                    fontWeight: safeConfig.typography?.headingFontWeight || safeConfig.servicios.titleFontWeight
                                }}>Nuestros Servicios</h2>
                                <div className="w-24 h-1 mx-auto" style={{ background: `linear-gradient(to right, transparent, ${safeConfig.colors.primary}, transparent)` }}></div>
                            </div>

                            {safeConfig.servicios.items && safeConfig.servicios.items.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                    {safeConfig.servicios.items.filter(item => item && item.enabled).map((servicio) => (
                                        <div key={servicio.id} className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 backdrop-blur-sm transition-all duration-300" style={{ borderColor: safeConfig.colors.primary }} onMouseEnter={(e) => e.currentTarget.style.borderColor = safeConfig.colors.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = safeConfig.colors.primary}>
                                            <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ 
                                                color: safeConfig.colors.primary,
                                                fontFamily: safeConfig.servicios?.titleFontFamily,
                                                fontSize: safeConfig.servicios?.titleFontSize,
                                                fontWeight: safeConfig.servicios?.titleFontWeight
                                            }}>{servicio.title}</h3>
                                            <p className="text-base sm:text-lg leading-relaxed" style={{ 
                                                color: safeConfig.colors.text,
                                                fontFamily: safeConfig.servicios?.textFontFamily,
                                                fontSize: safeConfig.servicios?.textFontSize,
                                                fontWeight: safeConfig.servicios?.textFontWeight
                                            }}>
                                                {servicio.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p style={{ color: safeConfig.colors.text }}>No hay servicios disponibles.</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Contact Section */}
                {safeConfig.contact && safeConfig.contact.enabled && (
                    <section id="contacto" className="relative z-10 py-20 px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: safeConfig.colors.text }}>{safeConfig.contact.title}</h2>
                            <div className="w-24 h-1 mx-auto mb-6" style={{ background: `linear-gradient(to right, transparent, ${safeConfig.colors.primary}, transparent)` }}></div>
                            <p className="text-lg" style={{ color: safeConfig.colors.text }}>{safeConfig.contact.subtitle}</p>
                        </div>

                        <div className="bg-gray-700/50 border-2 rounded-lg p-6 sm:p-8 md:p-12 backdrop-blur-sm" style={{ borderColor: safeConfig.colors.primary }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                {/* Información de Contacto */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: safeConfig.colors.primary }}>Información de Contacto</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    <span className="text-xl" style={{ color: safeConfig.colors.primary }}>📍</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold" style={{ color: safeConfig.colors.text }}>Dirección:</p>
                                                    {safeConfig.contact.direccion && (
                                                        <p style={{ color: safeConfig.colors.text, opacity: 0.8 }}>{safeConfig.contact.direccion}</p>
                                                    )}
                                                    {(safeConfig.contact.ciudad || safeConfig.contact.estado || safeConfig.contact.pais) && (
                                                        <p style={{ color: safeConfig.colors.text, opacity: 0.8 }}>
                                                            {[safeConfig.contact.ciudad, safeConfig.contact.estado, safeConfig.contact.pais].filter(Boolean).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {(safeConfig.contact.telefono1 || safeConfig.contact.telefono2) && (
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        <span className="text-xl" style={{ color: safeConfig.colors.primary }}>📞</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold" style={{ color: safeConfig.colors.text }}>Teléfono:</p>
                                                        {safeConfig.contact.telefono1 && (
                                                            <p style={{ color: safeConfig.colors.text, opacity: 0.8 }}>{safeConfig.contact.telefono1}</p>
                                                        )}
                                                        {safeConfig.contact.telefono2 && (
                                                            <p style={{ color: safeConfig.colors.text, opacity: 0.8 }}>{safeConfig.contact.telefono2}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {(safeConfig.contact.email1 || safeConfig.contact.email2) && (
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        <span className="text-xl" style={{ color: safeConfig.colors.primary }}>✉️</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold" style={{ color: safeConfig.colors.text }}>Email:</p>
                                                        {safeConfig.contact.email1 && (
                                                            <p style={{ color: safeConfig.colors.text, opacity: 0.8 }}>{safeConfig.contact.email1}</p>
                                                        )}
                                                        {safeConfig.contact.email2 && (
                                                            <p style={{ color: safeConfig.colors.text, opacity: 0.8 }}>{safeConfig.contact.email2}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {(safeConfig.contact.horarioLunesViernes || safeConfig.contact.horarioSabados) && (
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        <span className="text-xl" style={{ color: safeConfig.colors.primary }}>🕒</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold" style={{ color: safeConfig.colors.text }}>Horario de Atención:</p>
                                                        {safeConfig.contact.horarioLunesViernes && (
                                                            <p style={{ color: safeConfig.colors.text, opacity: 0.8 }}>{safeConfig.contact.horarioLunesViernes}</p>
                                                        )}
                                                        {safeConfig.contact.horarioSabados && (
                                                            <p style={{ color: safeConfig.colors.text, opacity: 0.8 }}>{safeConfig.contact.horarioSabados}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Redes Sociales / Información Adicional */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: safeConfig.colors.primary }}>Síguenos</h3>
                                        <div className="space-y-3">
                                            {safeConfig.contact.instagram && (
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-xl" style={{ color: safeConfig.colors.primary }}>📱</span>
                                                    <p style={{ color: safeConfig.colors.text }}>Instagram: {safeConfig.contact.instagram}</p>
                                                </div>
                                            )}
                                            {safeConfig.contact.facebook && (
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-xl" style={{ color: safeConfig.colors.primary }}>📘</span>
                                                    <p style={{ color: safeConfig.colors.text }}>Facebook: {safeConfig.contact.facebook}</p>
                                                </div>
                                            )}
                                            {safeConfig.contact.whatsapp && (
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-xl" style={{ color: safeConfig.colors.primary }}>💼</span>
                                                    <p style={{ color: safeConfig.colors.text }}>WhatsApp: {safeConfig.contact.whatsapp}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {safeConfig.contact.mensajeAdicional && (
                                        <div className="border rounded-lg p-4" style={{ backgroundColor: `${safeConfig.colors.primary}10`, borderColor: `${safeConfig.colors.primary}30` }}>
                                            <p className="text-sm sm:text-base" style={{ color: safeConfig.colors.text }}>
                                                {safeConfig.contact.mensajeAdicional}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                )}

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