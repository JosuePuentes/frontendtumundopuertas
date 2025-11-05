import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Eye, 
  RefreshCw, 
  Save, 
  Image as ImageIcon, 
  Settings, 
  Type, 
  Palette, 
  Trash2, 
  Upload, 
  Plus 
} from "lucide-react";
import HomePreview from './HomePreview';
import { getApiUrl } from "@/lib/api";

interface HomeConfig {
  // Banner
  banner: {
    title: string;
    subtitle: string;
    image: string;
    enabled: boolean;
    width?: string;
    height?: string;
  };
  
  // Logo
  logo: {
    text: string;
    slogan: string;
    image: string;
    enabled: boolean;
    width?: string;
    height?: string;
  };
  
  // Valores
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
  
  // Productos
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
  
  // Contacto
  contact: {
    title: string;
    subtitle: string;
    enabled: boolean;
  };
  
  // Colores
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  
  // Nosotros
  nosotros: {
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
  
  // Servicios
  servicios: {
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
  
  // Tipografía Global
  typography?: {
    defaultFontFamily?: string;
    defaultFontSize?: string;
    headingFontFamily?: string;
    headingFontSize?: string;
    headingFontWeight?: string;
  };
}

const AdminHome: React.FC = () => {
  const [config, setConfig] = useState<HomeConfig>({
    banner: {
      title: "Banner Promocional",
      subtitle: "Espacio reservado para contenido promocional o anuncios",
      image: "",
      enabled: true,
      width: "100%",
      height: "400px"
    },
    logo: {
      text: "TU MUNDO PUERTAS",
      slogan: "DISEÑO, CALIDAD Y PROTECCIÓN",
      image: "",
      enabled: true,
      width: "200px",
      height: "auto"
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
          description: "Puerta de seguridad robusta",
          image: "",
          enabled: true
        },
        {
          id: "2",
          name: "Aluminium",
          description: "Puerta de aluminio moderna",
          image: "",
          enabled: true
        },
        {
          id: "3",
          name: "Yar Mes",
          description: "Puerta de madera elegante",
          image: "",
          enabled: true
        }
      ]
    },
    contact: {
      title: "¿Listo para tu próximo proyecto?",
      subtitle: "Contáctanos y descubre cómo podemos transformar tu espacio",
      enabled: true
    },
    colors: {
      primary: "#06b6d4",
      secondary: "#0891b2",
      accent: "#0ea5e9",
      background: "#000000",
      text: "#e5e7eb"
    },
    nosotros: {
      historia: "Todo comenzó como un sueño, una idea, pero con muchas ganas. Con el paso de los años, hemos logrado consolidarnos como líderes en el mercado de puertas y ventanas, acumulando más de 10 años de experiencia en el sector. Nos hemos posicionado firmemente en nuestra región y estamos abriendo caminos en todo el territorio nacional.",
      mision: "Proporcionar puertas y ventanas de alta calidad a precios competitivos, fabricando productos personalizados en tiempo récord. Nos comprometemos a ofrecer el mejor precio del mercado sin comprometer la excelencia en calidad, asegurando que cada producto brinde seguridad y satisfacción a nuestros clientes.",
      vision: "Ser la empresa líder en fabricación y distribución de puertas y ventanas a nivel nacional, reconocida por nuestra capacidad de envío a todo el territorio, tiempos de fabricación récord, precios competitivos y, sobre todo, por la calidad excepcional que garantiza la seguridad y confianza de nuestros clientes en cada uno de nuestros productos.",
      enabled: true,
      titleFontSize: "2rem",
      titleFontFamily: "Arial, sans-serif",
      titleFontWeight: "bold",
      textFontSize: "1rem",
      textFontFamily: "Arial, sans-serif",
      textFontWeight: "normal"
    },
    servicios: {
      items: [
        {
          id: "1",
          title: "Venta de Puertas y Ventanas",
          description: "Ofrecemos una amplia variedad de puertas y ventanas a los mejores precios del mercado. Todos nuestros productos son seleccionados cuidadosamente para garantizar la mejor relación calidad-precio para nuestros clientes.",
          enabled: true
        },
        {
          id: "2",
          title: "Fabricación a Medida",
          description: "Si necesitas medidas especiales, las fabricamos para ti. Trabajamos en tiempo récord sin comprometer la calidad. Cada producto personalizado es fabricado con los más altos estándares de calidad y seguridad.",
          enabled: true
        },
        {
          id: "3",
          title: "Tiempo Récord",
          description: "Entendemos la urgencia de nuestros clientes. Por eso, fabricamos tus productos en el menor tiempo posible, siempre manteniendo los más altos estándares de calidad y seguridad.",
          enabled: true
        },
        {
          id: "4",
          title: "Mejor Precio del Mercado",
          description: "Ofrecemos los mejores precios sin sacrificar calidad. Nuestro compromiso es brindarte productos de alta calidad a precios competitivos que se ajusten a tu presupuesto.",
          enabled: true
        }
      ],
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
  });

  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const apiUrl = getApiUrl();
  const token = localStorage.getItem('access_token');

  // Cargar configuración desde el backend
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoadingConfig(true);
        const response = await fetch(`${apiUrl}/home/config`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.config) {
            // Normalizar la configuración para asegurar que todos los campos existan
            const normalizedConfig: HomeConfig = {
              banner: data.config.banner && typeof data.config.banner === 'object' && !Array.isArray(data.config.banner)
                ? {
                    title: data.config.banner.title ?? config.banner.title,
                    subtitle: data.config.banner.subtitle ?? config.banner.subtitle,
                    image: data.config.banner.image ?? config.banner.image,
                    enabled: data.config.banner.enabled !== undefined ? data.config.banner.enabled : config.banner.enabled,
                    width: data.config.banner.width ?? config.banner.width ?? "100%",
                    height: data.config.banner.height ?? config.banner.height ?? "400px"
                  }
                : config.banner,
              logo: data.config.logo && typeof data.config.logo === 'object' && !Array.isArray(data.config.logo)
                ? {
                    text: data.config.logo.text ?? config.logo.text,
                    slogan: data.config.logo.slogan ?? config.logo.slogan,
                    image: data.config.logo.image ?? config.logo.image,
                    enabled: data.config.logo.enabled !== undefined ? data.config.logo.enabled : config.logo.enabled,
                    width: data.config.logo.width ?? config.logo.width ?? "200px",
                    height: data.config.logo.height ?? config.logo.height ?? "auto"
                  }
                : config.logo,
              values: data.config.values && typeof data.config.values === 'object' && !Array.isArray(data.config.values)
                ? {
                    diseño: (data.config.values.diseño && typeof data.config.values.diseño === 'object' && !Array.isArray(data.config.values.diseño))
                      ? data.config.values.diseño
                      : config.values.diseño,
                    calidad: (data.config.values.calidad && typeof data.config.values.calidad === 'object' && !Array.isArray(data.config.values.calidad))
                      ? data.config.values.calidad
                      : config.values.calidad,
                    proteccion: (data.config.values.proteccion && typeof data.config.values.proteccion === 'object' && !Array.isArray(data.config.values.proteccion))
                      ? data.config.values.proteccion
                      : config.values.proteccion
                  }
                : config.values,
              products: data.config.products && typeof data.config.products === 'object' && !Array.isArray(data.config.products)
                ? {
                    title: data.config.products.title ?? config.products.title,
                    items: Array.isArray(data.config.products.items) ? data.config.products.items : config.products.items
                  }
                : config.products,
              contact: data.config.contact && typeof data.config.contact === 'object' && !Array.isArray(data.config.contact)
                ? {
                    title: data.config.contact.title ?? config.contact.title,
                    subtitle: data.config.contact.subtitle ?? config.contact.subtitle,
                    enabled: data.config.contact.enabled !== undefined ? data.config.contact.enabled : config.contact.enabled
                  }
                : config.contact,
              colors: data.config.colors && typeof data.config.colors === 'object' && !Array.isArray(data.config.colors)
                ? {
                    primary: data.config.colors.primary ?? config.colors.primary,
                    secondary: data.config.colors.secondary ?? config.colors.secondary,
                    accent: data.config.colors.accent ?? config.colors.accent,
                    background: data.config.colors.background ?? config.colors.background,
                    text: data.config.colors.text ?? config.colors.text
                  }
                : config.colors,
              nosotros: data.config.nosotros && typeof data.config.nosotros === 'object' && !Array.isArray(data.config.nosotros)
                ? {
                    historia: data.config.nosotros.historia ?? config.nosotros.historia,
                    mision: data.config.nosotros.mision ?? config.nosotros.mision,
                    vision: data.config.nosotros.vision ?? config.nosotros.vision,
                    enabled: data.config.nosotros.enabled !== undefined ? data.config.nosotros.enabled : config.nosotros.enabled,
                    titleFontSize: data.config.nosotros.titleFontSize ?? config.nosotros.titleFontSize ?? "2rem",
                    titleFontFamily: data.config.nosotros.titleFontFamily ?? config.nosotros.titleFontFamily ?? "Arial, sans-serif",
                    titleFontWeight: data.config.nosotros.titleFontWeight ?? config.nosotros.titleFontWeight ?? "bold",
                    textFontSize: data.config.nosotros.textFontSize ?? config.nosotros.textFontSize ?? "1rem",
                    textFontFamily: data.config.nosotros.textFontFamily ?? config.nosotros.textFontFamily ?? "Arial, sans-serif",
                    textFontWeight: data.config.nosotros.textFontWeight ?? config.nosotros.textFontWeight ?? "normal"
                  }
                : config.nosotros,
              servicios: data.config.servicios && typeof data.config.servicios === 'object' && !Array.isArray(data.config.servicios)
                ? {
                    items: Array.isArray(data.config.servicios.items) ? data.config.servicios.items : config.servicios.items,
                    enabled: data.config.servicios.enabled !== undefined ? data.config.servicios.enabled : config.servicios.enabled,
                    titleFontSize: data.config.servicios.titleFontSize ?? config.servicios.titleFontSize ?? "1.5rem",
                    titleFontFamily: data.config.servicios.titleFontFamily ?? config.servicios.titleFontFamily ?? "Arial, sans-serif",
                    titleFontWeight: data.config.servicios.titleFontWeight ?? config.servicios.titleFontWeight ?? "bold",
                    textFontSize: data.config.servicios.textFontSize ?? config.servicios.textFontSize ?? "1rem",
                    textFontFamily: data.config.servicios.textFontFamily ?? config.servicios.textFontFamily ?? "Arial, sans-serif",
                    textFontWeight: data.config.servicios.textFontWeight ?? config.servicios.textFontWeight ?? "normal"
                  }
                : config.servicios,
              typography: data.config.typography && typeof data.config.typography === 'object' && !Array.isArray(data.config.typography)
                ? {
                    defaultFontFamily: data.config.typography.defaultFontFamily ?? config.typography?.defaultFontFamily ?? "Arial, sans-serif",
                    defaultFontSize: data.config.typography.defaultFontSize ?? config.typography?.defaultFontSize ?? "1rem",
                    headingFontFamily: data.config.typography.headingFontFamily ?? config.typography?.headingFontFamily ?? "Arial, sans-serif",
                    headingFontSize: data.config.typography.headingFontSize ?? config.typography?.headingFontSize ?? "2rem",
                    headingFontWeight: data.config.typography.headingFontWeight ?? config.typography?.headingFontWeight ?? "bold"
                  }
                : (config.typography || {
                    defaultFontFamily: "Arial, sans-serif",
                    defaultFontSize: "1rem",
                    headingFontFamily: "Arial, sans-serif",
                    headingFontSize: "2rem",
                    headingFontWeight: "bold"
                  })
            };
            setConfig(normalizedConfig);
          }
        } else if (response.status === 404) {
          // No hay configuración guardada, usar la por defecto
          console.log('No hay configuración guardada, usando valores por defecto');
        } else {
          console.error('Error al cargar configuración:', response.statusText);
          // En caso de error, usar configuración por defecto
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
        // En caso de error, usar configuración por defecto
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, [apiUrl, token]);

  // Guardar configuración en el backend
  const saveConfig = async () => {
    setLoading(true);
    try {
      // Asegurar que todos los campos estén presentes antes de guardar
      const configToSave: HomeConfig = {
        ...config,
        banner: {
          ...config.banner,
          width: config.banner.width || "100%",
          height: config.banner.height || "400px"
        },
        logo: {
          ...config.logo,
          width: config.logo.width || "200px",
          height: config.logo.height || "auto"
        },
        nosotros: config.nosotros || {
          historia: "",
          mision: "",
          vision: "",
          enabled: true,
          titleFontSize: "2rem",
          titleFontFamily: "Arial, sans-serif",
          titleFontWeight: "bold",
          textFontSize: "1rem",
          textFontFamily: "Arial, sans-serif",
          textFontWeight: "normal"
        },
        servicios: config.servicios || {
          items: [],
          enabled: true,
          titleFontSize: "1.5rem",
          titleFontFamily: "Arial, sans-serif",
          titleFontWeight: "bold",
          textFontSize: "1rem",
          textFontFamily: "Arial, sans-serif",
          textFontWeight: "normal"
        },
        typography: config.typography || {
          defaultFontFamily: "Arial, sans-serif",
          defaultFontSize: "1rem",
          headingFontFamily: "Arial, sans-serif",
          headingFontSize: "2rem",
          headingFontWeight: "bold"
        }
      };

      console.log('Guardando configuración en el backend:', JSON.stringify(configToSave, null, 2));
      console.log('Banner image:', configToSave.banner.image ? 'Presente' : 'Vacio');
      console.log('Logo image:', configToSave.logo.image ? 'Presente' : 'Vacio');
      
      const response = await fetch(`${apiUrl}/home/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ config: configToSave })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error del servidor:', errorData);
        throw new Error(errorData.detail || errorData.message || 'Error al guardar la configuración');
      }

      const data = await response.json();
      console.log('Configuración guardada exitosamente:', data);
      
      // Actualizar el estado local con la configuración guardada
      setConfig(configToSave);
      
      // También guardar en localStorage como respaldo/cache
      localStorage.setItem('home-config', JSON.stringify(configToSave));
      
      // Disparar evento personalizado para notificar cambios (misma pestaña)
      window.dispatchEvent(new CustomEvent('customStorageChange', {
        detail: { key: 'home-config', value: configToSave }
      }));
      
      alert('✅ Configuración guardada exitosamente!');
    } catch (error: any) {
      console.error('Error al guardar configuración:', error);
      alert(`❌ Error al guardar: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar configuración
  const updateConfig = (section: string, field: string, value: any) => {
    setConfig(prev => {
      const currentSection = prev[section as keyof HomeConfig] as any;
      return {
        ...prev,
        [section]: {
          ...currentSection,
          [field]: value
        }
      };
    });
  };

  // Actualizar configuración anidada
  const updateNestedConfig = (section: string, subsection: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof HomeConfig],
        [subsection]: {
          ...(prev[section as keyof HomeConfig] as any)[subsection],
          [field]: value
        }
      }
    }));
  };

  // Manejar subida de imágenes
  const handleImageUpload = (section: string, field: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      updateConfig(section, field, imageData);
    };
    reader.readAsDataURL(file);
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-black text-gray-200 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-gray-200">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-200 mb-2">
              Administrar Home
            </h1>
            <p className="text-gray-200">
              Personaliza completamente el contenido de tu página principal
            </p>
          </div>
          
          <div className="flex space-x-4">
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black"
            >
              <Eye className="w-4 h-4 mr-2" />
              Vista Previa
            </Button>
            
            <Button
              onClick={saveConfig}
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-semibold"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </div>

        {/* Tabs de Administración */}
        <Tabs defaultValue="banner" className="w-full">
          <TabsList className="grid w-full grid-cols-9 bg-gray-800 border-gray-700">
            <TabsTrigger value="banner" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-xs">
              <ImageIcon className="w-4 h-4 mr-1" />
              Banner
            </TabsTrigger>
            <TabsTrigger value="logo" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-xs">
              <Settings className="w-4 h-4 mr-1" />
              Logo
            </TabsTrigger>
            <TabsTrigger value="values" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-xs">
              <Type className="w-4 h-4 mr-1" />
              Valores
            </TabsTrigger>
            <TabsTrigger value="products" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-xs">
              <ImageIcon className="w-4 h-4 mr-1" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="nosotros" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-xs">
              <Type className="w-4 h-4 mr-1" />
              Nosotros
            </TabsTrigger>
            <TabsTrigger value="servicios" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-xs">
              <Type className="w-4 h-4 mr-1" />
              Servicios
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-xs">
              <Type className="w-4 h-4 mr-1" />
              Contacto
            </TabsTrigger>
            <TabsTrigger value="colors" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-xs">
              <Palette className="w-4 h-4 mr-1" />
              Colores
            </TabsTrigger>
            <TabsTrigger value="typography" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-xs">
              <Type className="w-4 h-4 mr-1" />
              Tipografía
            </TabsTrigger>
          </TabsList>

          {/* Tab Banner */}
          <TabsContent value="banner" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Configuración del Banner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="banner-title" className="text-gray-200">Título del Banner</Label>
                      <Input
                        id="banner-title"
                        value={config.banner.title}
                        onChange={(e) => updateConfig('banner', 'title', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-gray-200"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="banner-subtitle" className="text-gray-200">Subtítulo del Banner</Label>
                      <Textarea
                        id="banner-subtitle"
                        value={config.banner.subtitle}
                        onChange={(e) => updateConfig('banner', 'subtitle', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-gray-200"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="banner-enabled"
                        checked={config.banner.enabled}
                        onChange={(e) => updateConfig('banner', 'enabled', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="banner-enabled" className="text-gray-200">Mostrar Banner</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-200">Imagen del Banner</Label>
                      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                        {config.banner.image ? (
                          <div className="space-y-4">
                            <img 
                              src={config.banner.image} 
                              alt="Banner" 
                              className="max-w-full rounded-lg mx-auto"
                              style={{
                                width: config.banner.width || "100%",
                                height: config.banner.height || "400px",
                                objectFit: "cover"
                              }}
                            />
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div>
                                <Label htmlFor="banner-width" className="text-gray-200 text-sm">Ancho</Label>
                                <Input
                                  id="banner-width"
                                  type="text"
                                  value={config.banner.width || "100%"}
                                  onChange={(e) => updateConfig('banner', 'width', e.target.value)}
                                  placeholder="Ej: 100%, 800px"
                                  className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="banner-height" className="text-gray-200 text-sm">Alto</Label>
                                <Input
                                  id="banner-height"
                                  type="text"
                                  value={config.banner.height || "400px"}
                                  onChange={(e) => updateConfig('banner', 'height', e.target.value)}
                                  placeholder="Ej: 400px, auto"
                                  className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                                />
                              </div>
                            </div>
                            <Button
                              onClick={() => updateConfig('banner', 'image', '')}
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                            <div>
                              <Label htmlFor="banner-image-upload" className="text-gray-200 cursor-pointer">
                                Subir Imagen
                              </Label>
                              <input
                                id="banner-image-upload"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload('banner', 'image', file);
                                }}
                                className="hidden"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Logo */}
          <TabsContent value="logo" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Configuración del Logo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="logo-text" className="text-gray-200">Texto del Logo</Label>
                      <Input
                        id="logo-text"
                        value={config.logo.text}
                        onChange={(e) => updateConfig('logo', 'text', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-gray-200"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="logo-slogan" className="text-gray-200">Slogan</Label>
                      <Input
                        id="logo-slogan"
                        value={config.logo.slogan}
                        onChange={(e) => updateConfig('logo', 'slogan', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-gray-200"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="logo-enabled"
                        checked={config.logo.enabled}
                        onChange={(e) => updateConfig('logo', 'enabled', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="logo-enabled" className="text-gray-200">Mostrar Logo</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-200">Imagen del Logo</Label>
                      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                        {config.logo.image ? (
                          <div className="space-y-4">
                            <img 
                              src={config.logo.image} 
                              alt="Logo" 
                              className="rounded-lg mx-auto"
                              style={{
                                width: config.logo.width || "200px",
                                height: config.logo.height || "auto",
                                objectFit: "contain"
                              }}
                            />
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div>
                                <Label htmlFor="logo-width" className="text-gray-200 text-sm">Ancho</Label>
                                <Input
                                  id="logo-width"
                                  type="text"
                                  value={config.logo.width || "200px"}
                                  onChange={(e) => updateConfig('logo', 'width', e.target.value)}
                                  placeholder="Ej: 200px, 50%"
                                  className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="logo-height" className="text-gray-200 text-sm">Alto</Label>
                                <Input
                                  id="logo-height"
                                  type="text"
                                  value={config.logo.height || "auto"}
                                  onChange={(e) => updateConfig('logo', 'height', e.target.value)}
                                  placeholder="Ej: auto, 100px"
                                  className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                                />
                              </div>
                            </div>
                            <Button
                              onClick={() => updateConfig('logo', 'image', '')}
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                            <div>
                              <Label htmlFor="logo-image-upload" className="text-gray-200 cursor-pointer">
                                Subir Logo
                              </Label>
                              <input
                                id="logo-image-upload"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload('logo', 'image', file);
                                }}
                                className="hidden"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Valores */}
          <TabsContent value="values" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center">
                  <Type className="w-5 h-5 mr-2" />
                  Configuración de Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Diseño */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-gray-200 text-lg">Diseño</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="diseño-title" className="text-gray-200">Título</Label>
                        <Input
                          id="diseño-title"
                          value={config.values.diseño.title}
                          onChange={(e) => updateNestedConfig('values', 'diseño', 'title', e.target.value)}
                          className="bg-gray-600 border-gray-500 text-gray-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="diseño-description" className="text-gray-200">Descripción</Label>
                        <Textarea
                          id="diseño-description"
                          value={config.values.diseño.description}
                          onChange={(e) => updateNestedConfig('values', 'diseño', 'description', e.target.value)}
                          className="bg-gray-600 border-gray-500 text-gray-200"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Calidad */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-gray-200 text-lg">Calidad</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="calidad-title" className="text-gray-200">Título</Label>
                        <Input
                          id="calidad-title"
                          value={config.values.calidad.title}
                          onChange={(e) => updateNestedConfig('values', 'calidad', 'title', e.target.value)}
                          className="bg-gray-600 border-gray-500 text-gray-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="calidad-description" className="text-gray-200">Descripción</Label>
                        <Textarea
                          id="calidad-description"
                          value={config.values.calidad.description}
                          onChange={(e) => updateNestedConfig('values', 'calidad', 'description', e.target.value)}
                          className="bg-gray-600 border-gray-500 text-gray-200"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Protección */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-gray-200 text-lg">Protección</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="proteccion-title" className="text-gray-200">Título</Label>
                        <Input
                          id="proteccion-title"
                          value={config.values.proteccion.title}
                          onChange={(e) => updateNestedConfig('values', 'proteccion', 'title', e.target.value)}
                          className="bg-gray-600 border-gray-500 text-gray-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="proteccion-description" className="text-gray-200">Descripción</Label>
                        <Textarea
                          id="proteccion-description"
                          value={config.values.proteccion.description}
                          onChange={(e) => updateNestedConfig('values', 'proteccion', 'description', e.target.value)}
                          className="bg-gray-600 border-gray-500 text-gray-200"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Productos */}
          <TabsContent value="products" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Configuración de Productos
                  </div>
                  <Button
                    onClick={() => {
                      const newProduct = {
                        id: Date.now().toString(),
                        name: "Nuevo Producto",
                        description: "Descripción del producto",
                        image: "",
                        enabled: true
                      };
                      setConfig(prev => ({
                        ...prev,
                        products: {
                          ...prev.products || { title: '', items: [] },
                          items: [...(prev.products?.items || []), newProduct]
                        }
                      }));
                    }}
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-600 text-black"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="products-title" className="text-gray-200">Título de la Sección</Label>
                  <Input
                    id="products-title"
                    value={config.products?.title || ''}
                    onChange={(e) => updateConfig('products', 'title', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-gray-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(config.products?.items || []).map((product, index) => (
                    <Card key={product.id} className="bg-gray-700 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-gray-200 text-lg flex items-center justify-between">
                          {product.name}
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => {
                                const currentItems = config.products?.items || [];
                                const newItems = currentItems.filter((_, i) => i !== index);
                                setConfig(prev => ({
                                  ...prev,
                                  products: {
                                    ...prev.products || { title: '', items: [] },
                                    items: newItems
                                  }
                                }));
                              }}
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-gray-200">Nombre</Label>
                          <Input
                            value={product.name}
                            onChange={(e) => {
                              const currentItems = config.products?.items || [];
                              const newItems = [...currentItems];
                              newItems[index] = { ...product, name: e.target.value };
                              setConfig(prev => ({
                                ...prev,
                                products: {
                                  ...prev.products || { title: '', items: [] },
                                  items: newItems
                                }
                              }));
                            }}
                            className="bg-gray-600 border-gray-500 text-gray-200"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-gray-200">Descripción</Label>
                          <Textarea
                            value={product.description}
                            onChange={(e) => {
                              const currentItems = config.products?.items || [];
                              const newItems = [...currentItems];
                              newItems[index] = { ...product, description: e.target.value };
                              setConfig(prev => ({
                                ...prev,
                                products: {
                                  ...prev.products || { title: '', items: [] },
                                  items: newItems
                                }
                              }));
                            }}
                            className="bg-gray-600 border-gray-500 text-gray-200"
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label className="text-gray-200">Imagen</Label>
                          <div className="border-2 border-dashed border-gray-500 rounded-lg p-4 text-center">
                            {product.image ? (
                              <div className="space-y-2">
                                <img 
                                  src={product.image} 
                                  alt={product.name} 
                                  className="max-w-full h-20 object-cover rounded-lg mx-auto"
                                />
                                <Button
                                  onClick={() => {
                                    const currentItems = config.products?.items || [];
                                    const newItems = [...currentItems];
                                    newItems[index] = { ...product, image: '' };
                                    setConfig(prev => ({
                                      ...prev,
                                      products: {
                                        ...prev.products || { title: '', items: [] },
                                        items: newItems
                                      }
                                    }));
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                                <div>
                                  <Label htmlFor={`product-image-${index}`} className="text-gray-200 cursor-pointer text-sm">
                                    Subir Imagen
                                  </Label>
                                  <input
                                    id={`product-image-${index}`}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                          const imageData = e.target?.result as string;
                                          const currentItems = config.products?.items || [];
                                          const newItems = [...currentItems];
                                          newItems[index] = { ...product, image: imageData };
                                          setConfig(prev => ({
                                            ...prev,
                                            products: {
                                              ...prev.products || { title: '', items: [] },
                                              items: newItems
                                            }
                                          }));
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={product.enabled}
                            onChange={(e) => {
                              const currentItems = config.products?.items || [];
                              const newItems = [...currentItems];
                              newItems[index] = { ...product, enabled: e.target.checked };
                              setConfig(prev => ({
                                ...prev,
                                products: {
                                  ...prev.products || { title: '', items: [] },
                                  items: newItems
                                }
                              }));
                            }}
                            className="rounded"
                          />
                          <Label className="text-gray-200">Mostrar Producto</Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Contacto */}
          <TabsContent value="contact" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center">
                  <Type className="w-5 h-5 mr-2" />
                  Configuración de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="contact-title" className="text-gray-200">Título</Label>
                      <Input
                        id="contact-title"
                        value={config.contact.title}
                        onChange={(e) => updateConfig('contact', 'title', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-gray-200"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contact-subtitle" className="text-gray-200">Subtítulo</Label>
                      <Textarea
                        id="contact-subtitle"
                        value={config.contact.subtitle}
                        onChange={(e) => updateConfig('contact', 'subtitle', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-gray-200"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="contact-enabled"
                        checked={config.contact.enabled}
                        onChange={(e) => updateConfig('contact', 'enabled', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="contact-enabled" className="text-gray-200">Mostrar Sección de Contacto</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Nosotros */}
          <TabsContent value="nosotros" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center">
                  <Type className="w-5 h-5 mr-2" />
                  Configuración de Nosotros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2 mb-6">
                  <input
                    type="checkbox"
                    id="nosotros-enabled"
                    checked={config.nosotros?.enabled ?? true}
                    onChange={(e) => updateConfig('nosotros', 'enabled', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="nosotros-enabled" className="text-gray-200">Mostrar Sección Nosotros</Label>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="nosotros-historia" className="text-gray-200">Historia</Label>
                    <Textarea
                      id="nosotros-historia"
                      value={config.nosotros?.historia || ''}
                      onChange={(e) => updateConfig('nosotros', 'historia', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="nosotros-mision" className="text-gray-200">Misión</Label>
                    <Textarea
                      id="nosotros-mision"
                      value={config.nosotros?.mision || ''}
                      onChange={(e) => updateConfig('nosotros', 'mision', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="nosotros-vision" className="text-gray-200">Visión</Label>
                    <Textarea
                      id="nosotros-vision"
                      value={config.nosotros?.vision || ''}
                      onChange={(e) => updateConfig('nosotros', 'vision', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                      rows={4}
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-gray-200 font-semibold">Tipografía de Títulos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="nosotros-title-font-size" className="text-gray-200 text-sm">Tamaño</Label>
                      <Input
                        id="nosotros-title-font-size"
                        type="text"
                        value={config.nosotros?.titleFontSize || '2rem'}
                        onChange={(e) => updateConfig('nosotros', 'titleFontSize', e.target.value)}
                        placeholder="Ej: 2rem, 32px"
                        className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nosotros-title-font-family" className="text-gray-200 text-sm">Fuente</Label>
                      <Select
                        value={config.nosotros?.titleFontFamily || 'Arial, sans-serif'}
                        onValueChange={(value) => updateConfig('nosotros', 'titleFontFamily', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                          <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                          <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                          <SelectItem value="'Helvetica Neue', sans-serif">Helvetica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="nosotros-title-font-weight" className="text-gray-200 text-sm">Peso</Label>
                      <Select
                        value={config.nosotros?.titleFontWeight || 'bold'}
                        onValueChange={(value) => updateConfig('nosotros', 'titleFontWeight', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="600">Semi-bold</SelectItem>
                          <SelectItem value="700">Extra-bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-gray-200 font-semibold">Tipografía de Texto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="nosotros-text-font-size" className="text-gray-200 text-sm">Tamaño</Label>
                      <Input
                        id="nosotros-text-font-size"
                        type="text"
                        value={config.nosotros?.textFontSize || '1rem'}
                        onChange={(e) => updateConfig('nosotros', 'textFontSize', e.target.value)}
                        placeholder="Ej: 1rem, 16px"
                        className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nosotros-text-font-family" className="text-gray-200 text-sm">Fuente</Label>
                      <Select
                        value={config.nosotros?.textFontFamily || 'Arial, sans-serif'}
                        onValueChange={(value) => updateConfig('nosotros', 'textFontFamily', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                          <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                          <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                          <SelectItem value="'Helvetica Neue', sans-serif">Helvetica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="nosotros-text-font-weight" className="text-gray-200 text-sm">Peso</Label>
                      <Select
                        value={config.nosotros?.textFontWeight || 'normal'}
                        onValueChange={(value) => updateConfig('nosotros', 'textFontWeight', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="600">Semi-bold</SelectItem>
                          <SelectItem value="700">Extra-bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Servicios */}
          <TabsContent value="servicios" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <Type className="w-5 h-5 mr-2" />
                    Configuración de Servicios
                  </div>
                  <Button
                    onClick={() => {
                      const newService = {
                        id: Date.now().toString(),
                        title: "Nuevo Servicio",
                        description: "Descripción del servicio",
                        enabled: true
                      };
                      setConfig(prev => ({
                        ...prev,
                        servicios: {
                          ...prev.servicios || { items: [], enabled: true },
                          items: [...(prev.servicios?.items || []), newService]
                        }
                      }));
                    }}
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-600 text-black"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Servicio
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2 mb-6">
                  <input
                    type="checkbox"
                    id="servicios-enabled"
                    checked={config.servicios?.enabled ?? true}
                    onChange={(e) => updateConfig('servicios', 'enabled', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="servicios-enabled" className="text-gray-200">Mostrar Sección Servicios</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(config.servicios?.items || []).map((service, index) => (
                    <Card key={service.id} className="bg-gray-700 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-gray-200 text-lg flex items-center justify-between">
                          {service.title}
                          <Button
                            onClick={() => {
                              const currentItems = config.servicios?.items || [];
                              const newItems = currentItems.filter((_, i) => i !== index);
                              setConfig(prev => ({
                                ...prev,
                                servicios: {
                                  ...prev.servicios || { items: [], enabled: true },
                                  items: newItems
                                }
                              }));
                            }}
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-gray-200">Título</Label>
                          <Input
                            value={service.title}
                            onChange={(e) => {
                              const currentItems = config.servicios?.items || [];
                              const newItems = [...currentItems];
                              newItems[index] = { ...service, title: e.target.value };
                              setConfig(prev => ({
                                ...prev,
                                servicios: {
                                  ...prev.servicios || { items: [], enabled: true },
                                  items: newItems
                                }
                              }));
                            }}
                            className="bg-gray-600 border-gray-500 text-gray-200"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-200">Descripción</Label>
                          <Textarea
                            value={service.description}
                            onChange={(e) => {
                              const currentItems = config.servicios?.items || [];
                              const newItems = [...currentItems];
                              newItems[index] = { ...service, description: e.target.value };
                              setConfig(prev => ({
                                ...prev,
                                servicios: {
                                  ...prev.servicios || { items: [], enabled: true },
                                  items: newItems
                                }
                              }));
                            }}
                            className="bg-gray-600 border-gray-500 text-gray-200"
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={service.enabled}
                            onChange={(e) => {
                              const currentItems = config.servicios?.items || [];
                              const newItems = [...currentItems];
                              newItems[index] = { ...service, enabled: e.target.checked };
                              setConfig(prev => ({
                                ...prev,
                                servicios: {
                                  ...prev.servicios || { items: [], enabled: true },
                                  items: newItems
                                }
                              }));
                            }}
                            className="rounded"
                          />
                          <Label className="text-gray-200">Mostrar Servicio</Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-gray-200 font-semibold">Tipografía de Títulos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="servicios-title-font-size" className="text-gray-200 text-sm">Tamaño</Label>
                      <Input
                        id="servicios-title-font-size"
                        type="text"
                        value={config.servicios?.titleFontSize || '1.5rem'}
                        onChange={(e) => updateConfig('servicios', 'titleFontSize', e.target.value)}
                        placeholder="Ej: 1.5rem, 24px"
                        className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="servicios-title-font-family" className="text-gray-200 text-sm">Fuente</Label>
                      <Select
                        value={config.servicios?.titleFontFamily || 'Arial, sans-serif'}
                        onValueChange={(value) => updateConfig('servicios', 'titleFontFamily', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                          <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                          <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                          <SelectItem value="'Helvetica Neue', sans-serif">Helvetica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="servicios-title-font-weight" className="text-gray-200 text-sm">Peso</Label>
                      <Select
                        value={config.servicios?.titleFontWeight || 'bold'}
                        onValueChange={(value) => updateConfig('servicios', 'titleFontWeight', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="600">Semi-bold</SelectItem>
                          <SelectItem value="700">Extra-bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-gray-200 font-semibold">Tipografía de Texto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="servicios-text-font-size" className="text-gray-200 text-sm">Tamaño</Label>
                      <Input
                        id="servicios-text-font-size"
                        type="text"
                        value={config.servicios?.textFontSize || '1rem'}
                        onChange={(e) => updateConfig('servicios', 'textFontSize', e.target.value)}
                        placeholder="Ej: 1rem, 16px"
                        className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="servicios-text-font-family" className="text-gray-200 text-sm">Fuente</Label>
                      <Select
                        value={config.servicios?.textFontFamily || 'Arial, sans-serif'}
                        onValueChange={(value) => updateConfig('servicios', 'textFontFamily', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                          <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                          <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                          <SelectItem value="'Helvetica Neue', sans-serif">Helvetica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="servicios-text-font-weight" className="text-gray-200 text-sm">Peso</Label>
                      <Select
                        value={config.servicios?.textFontWeight || 'normal'}
                        onValueChange={(value) => updateConfig('servicios', 'textFontWeight', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="600">Semi-bold</SelectItem>
                          <SelectItem value="700">Extra-bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Tipografía Global */}
          <TabsContent value="typography" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center">
                  <Type className="w-5 h-5 mr-2" />
                  Tipografía Global
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-gray-200 font-semibold">Fuente por Defecto (Texto General)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="typography-default-font-family" className="text-gray-200">Familia de Fuente</Label>
                      <Select
                        value={config.typography?.defaultFontFamily || 'Arial, sans-serif'}
                        onValueChange={(value) => setConfig(prev => ({
                          ...prev,
                          typography: {
                            ...prev.typography,
                            defaultFontFamily: value
                          }
                        }))}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                          <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                          <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                          <SelectItem value="'Helvetica Neue', sans-serif">Helvetica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="typography-default-font-size" className="text-gray-200">Tamaño</Label>
                      <Input
                        id="typography-default-font-size"
                        type="text"
                        value={config.typography?.defaultFontSize || '1rem'}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          typography: {
                            ...prev.typography,
                            defaultFontSize: e.target.value
                          }
                        }))}
                        placeholder="Ej: 1rem, 16px"
                        className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-gray-200 font-semibold">Fuente de Títulos (Headings)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="typography-heading-font-family" className="text-gray-200">Familia de Fuente</Label>
                      <Select
                        value={config.typography?.headingFontFamily || 'Arial, sans-serif'}
                        onValueChange={(value) => setConfig(prev => ({
                          ...prev,
                          typography: {
                            ...prev.typography,
                            headingFontFamily: value
                          }
                        }))}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                          <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                          <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                          <SelectItem value="'Helvetica Neue', sans-serif">Helvetica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="typography-heading-font-size" className="text-gray-200">Tamaño</Label>
                      <Input
                        id="typography-heading-font-size"
                        type="text"
                        value={config.typography?.headingFontSize || '2rem'}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          typography: {
                            ...prev.typography,
                            headingFontSize: e.target.value
                          }
                        }))}
                        placeholder="Ej: 2rem, 32px"
                        className="bg-gray-700 border-gray-600 text-gray-200 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="typography-heading-font-weight" className="text-gray-200">Peso</Label>
                      <Select
                        value={config.typography?.headingFontWeight || 'bold'}
                        onValueChange={(value) => setConfig(prev => ({
                          ...prev,
                          typography: {
                            ...prev.typography,
                            headingFontWeight: value
                          }
                        }))}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="600">Semi-bold</SelectItem>
                          <SelectItem value="700">Extra-bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Colores */}
          <TabsContent value="colors" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Configuración de Colores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="primary-color" className="text-gray-200">Color Primario</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={config.colors.primary}
                        onChange={(e) => updateConfig('colors', 'primary', e.target.value)}
                        className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                      />
                      <Input
                        value={config.colors.primary}
                        onChange={(e) => updateConfig('colors', 'primary', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-gray-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary-color" className="text-gray-200">Color Secundario</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={config.colors.secondary}
                        onChange={(e) => updateConfig('colors', 'secondary', e.target.value)}
                        className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                      />
                      <Input
                        value={config.colors.secondary}
                        onChange={(e) => updateConfig('colors', 'secondary', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-gray-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accent-color" className="text-gray-200">Color de Acento</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="accent-color"
                        type="color"
                        value={config.colors.accent}
                        onChange={(e) => updateConfig('colors', 'accent', e.target.value)}
                        className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                      />
                      <Input
                        value={config.colors.accent}
                        onChange={(e) => updateConfig('colors', 'accent', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-gray-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="background-color" className="text-gray-200">Color de Fondo</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="background-color"
                        type="color"
                        value={config.colors.background}
                        onChange={(e) => updateConfig('colors', 'background', e.target.value)}
                        className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                      />
                      <Input
                        value={config.colors.background}
                        onChange={(e) => updateConfig('colors', 'background', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-gray-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="text-color" className="text-gray-200">Color de Texto</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="text-color"
                        type="color"
                        value={config.colors.text}
                        onChange={(e) => updateConfig('colors', 'text', e.target.value)}
                        className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                      />
                      <Input
                        value={config.colors.text}
                        onChange={(e) => updateConfig('colors', 'text', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-gray-200"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Vista Previa */}
      {showPreview && (
        <HomePreview 
          config={config} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
};

export default AdminHome;
