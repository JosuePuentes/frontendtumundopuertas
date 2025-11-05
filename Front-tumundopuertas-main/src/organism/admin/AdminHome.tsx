import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  };
  
  // Logo
  logo: {
    text: string;
    slogan: string;
    image: string;
    enabled: boolean;
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
}

const AdminHome: React.FC = () => {
  const [config, setConfig] = useState<HomeConfig>({
    banner: {
      title: "Banner Promocional",
      subtitle: "Espacio reservado para contenido promocional o anuncios",
      image: "",
      enabled: true
    },
    logo: {
      text: "TU MUNDO PUERTAS",
      slogan: "DISEÑO, CALIDAD Y PROTECCIÓN",
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
                    enabled: data.config.banner.enabled !== undefined ? data.config.banner.enabled : config.banner.enabled
                  }
                : config.banner,
              logo: data.config.logo && typeof data.config.logo === 'object' && !Array.isArray(data.config.logo)
                ? {
                    text: data.config.logo.text ?? config.logo.text,
                    slogan: data.config.logo.slogan ?? config.logo.slogan,
                    image: data.config.logo.image ?? config.logo.image,
                    enabled: data.config.logo.enabled !== undefined ? data.config.logo.enabled : config.logo.enabled
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
                : config.colors
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
      console.log('Guardando configuración en el backend:', config);
      
      const response = await fetch(`${apiUrl}/home/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ config })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Error al guardar la configuración');
      }

      const data = await response.json();
      console.log('Configuración guardada exitosamente:', data);
      
      // También guardar en localStorage como respaldo/cache
      localStorage.setItem('home-config', JSON.stringify(config));
      
      // Disparar evento personalizado para notificar cambios (misma pestaña)
      window.dispatchEvent(new CustomEvent('customStorageChange', {
        detail: { key: 'home-config', value: config }
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
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof HomeConfig],
        [field]: value
      }
    }));
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
          <TabsList className="grid w-full grid-cols-6 bg-gray-800 border-gray-700">
            <TabsTrigger value="banner" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              <ImageIcon className="w-4 h-4 mr-2" />
              Banner
            </TabsTrigger>
            <TabsTrigger value="logo" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              <Settings className="w-4 h-4 mr-2" />
              Logo
            </TabsTrigger>
            <TabsTrigger value="values" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              <Type className="w-4 h-4 mr-2" />
              Valores
            </TabsTrigger>
            <TabsTrigger value="products" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              <ImageIcon className="w-4 h-4 mr-2" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              <Type className="w-4 h-4 mr-2" />
              Contacto
            </TabsTrigger>
            <TabsTrigger value="colors" className="text-gray-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              <Palette className="w-4 h-4 mr-2" />
              Colores
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
                              className="max-w-full h-32 object-cover rounded-lg mx-auto"
                            />
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
                              className="max-w-full h-24 object-contain rounded-lg mx-auto"
                            />
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
                                    const newItems = [...config.products.items];
                                    newItems[index] = { ...product, image: '' };
                                    setConfig(prev => ({
                                      ...prev,
                                      products: {
                                        ...prev.products,
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
