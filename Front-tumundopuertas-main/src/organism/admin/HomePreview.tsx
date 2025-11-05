import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Star,
  Shield,
  Zap,
  X
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
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

interface HomePreviewProps {
  config: HomeConfig;
  onClose: () => void;
}

const HomePreview: React.FC<HomePreviewProps> = ({ config, onClose }) => {
  // Validación defensiva: asegurar que config existe y es un objeto
  const validConfig: HomeConfig = (!config || typeof config !== 'object' || Array.isArray(config))
    ? {
        banner: { title: '', subtitle: '', image: '', enabled: true, width: "100%", height: "400px" },
        logo: { text: '', slogan: '', image: '', enabled: true, width: "200px", height: "auto" },
        values: {
          diseño: { title: '', description: '', icon: 'Star' },
          calidad: { title: '', description: '', icon: 'Shield' },
          proteccion: { title: '', description: '', icon: 'Zap' }
        },
        products: { title: 'Productos', items: [] },
        contact: { title: '', subtitle: '', enabled: true },
        colors: {
          primary: '#06b6d4',
          secondary: '#0891b2',
          accent: '#0ea5e9',
          background: '#000000',
          text: '#e5e7eb'
        }
      }
    : config;
  
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    console.warn('⚠️ HomePreview recibió config inválido, usando valores por defecto');
  }
  
  // Validación defensiva de la configuración
  const safeConfig: HomeConfig = {
    banner: validConfig.banner && typeof validConfig.banner === 'object' && !Array.isArray(validConfig.banner)
      ? {
          title: validConfig.banner.title || '',
          subtitle: validConfig.banner.subtitle || '',
          image: validConfig.banner.image || '',
          enabled: validConfig.banner.enabled !== undefined ? validConfig.banner.enabled : true,
          width: validConfig.banner.width || "100%",
          height: validConfig.banner.height || "400px"
        }
      : { title: '', subtitle: '', image: '', enabled: true, width: "100%", height: "400px" },
    logo: validConfig.logo && typeof validConfig.logo === 'object' && !Array.isArray(validConfig.logo)
      ? {
          text: validConfig.logo.text || '',
          slogan: validConfig.logo.slogan || '',
          image: validConfig.logo.image || '',
          enabled: validConfig.logo.enabled !== undefined ? validConfig.logo.enabled : true,
          width: validConfig.logo.width || "200px",
          height: validConfig.logo.height || "auto"
        }
      : { text: '', slogan: '', image: '', enabled: true, width: "200px", height: "auto" },
    values: validConfig.values && typeof validConfig.values === 'object' && !Array.isArray(validConfig.values)
      ? {
          diseño: (validConfig.values.diseño && typeof validConfig.values.diseño === 'object' && !Array.isArray(validConfig.values.diseño))
            ? validConfig.values.diseño
            : { title: '', description: '', icon: 'Star' },
          calidad: (validConfig.values.calidad && typeof validConfig.values.calidad === 'object' && !Array.isArray(validConfig.values.calidad))
            ? validConfig.values.calidad
            : { title: '', description: '', icon: 'Shield' },
          proteccion: (validConfig.values.proteccion && typeof validConfig.values.proteccion === 'object' && !Array.isArray(validConfig.values.proteccion))
            ? validConfig.values.proteccion
            : { title: '', description: '', icon: 'Zap' }
        }
      : {
          diseño: { title: '', description: '', icon: 'Star' },
          calidad: { title: '', description: '', icon: 'Shield' },
          proteccion: { title: '', description: '', icon: 'Zap' }
        },
    products: validConfig.products && typeof validConfig.products === 'object' && !Array.isArray(validConfig.products)
      ? {
          title: validConfig.products.title || 'Productos',
          items: Array.isArray(validConfig.products.items) ? validConfig.products.items : []
        }
      : { title: 'Productos', items: [] },
    contact: validConfig.contact && typeof validConfig.contact === 'object' && !Array.isArray(validConfig.contact)
      ? {
          title: validConfig.contact.title || '',
          subtitle: validConfig.contact.subtitle || '',
          enabled: validConfig.contact.enabled !== undefined ? validConfig.contact.enabled : true
        }
      : { title: '', subtitle: '', enabled: true },
    colors: validConfig.colors && typeof validConfig.colors === 'object' && !Array.isArray(validConfig.colors)
      ? {
          primary: validConfig.colors.primary || '#06b6d4',
          secondary: validConfig.colors.secondary || '#0891b2',
          accent: validConfig.colors.accent || '#0ea5e9',
          background: validConfig.colors.background || '#000000',
          text: validConfig.colors.text || '#e5e7eb'
        }
      : {
          primary: '#06b6d4',
          secondary: '#0891b2',
          accent: '#0ea5e9',
          background: '#000000',
          text: '#e5e7eb'
        }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Star': return Star;
      case 'Shield': return Shield;
      case 'Zap': return Zap;
      default: return Star;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header del Preview */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Vista Previa del Home</h2>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </div>

        {/* Contenido del Preview */}
        <div 
          className="min-h-screen overflow-hidden relative"
          style={{ 
            backgroundColor: safeConfig.colors.background,
            color: safeConfig.colors.text 
          }}
        >
          {/* Efectos de fondo futuristas */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>

          {/* Header con Logo */}
          <header className="relative z-10 p-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Logo */}
                <div className="relative">
                  <div 
                    className="w-20 h-20 rounded-full border-2 flex items-center justify-center shadow-lg"
                    style={{ 
                      borderColor: safeConfig.colors.primary,
                      backgroundColor: '#374151'
                    }}
                  >
                    <div 
                      className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden"
                      style={{
                        width: safeConfig.logo.width || "200px",
                        height: safeConfig.logo.height === "auto" ? "auto" : (safeConfig.logo.height || "auto"),
                        minHeight: safeConfig.logo.height === "auto" ? "64px" : undefined
                      }}
                    >
                      {safeConfig.logo.image ? (
                        <img 
                          src={safeConfig.logo.image} 
                          alt="Logo" 
                          className="object-contain"
                          style={{
                            width: safeConfig.logo.width || "200px",
                            height: safeConfig.logo.height === "auto" ? "auto" : (safeConfig.logo.height || "auto"),
                            maxHeight: "100%"
                          }}
                        />
                      ) : (
                        <div className="relative z-10">
                          <div 
                            className="font-bold text-lg leading-none"
                            style={{ color: safeConfig.colors.primary }}
                          >
                            <div className="text-sm font-black">T</div>
                            <div className="text-sm font-black">M</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div 
                    className="absolute inset-0 rounded-full border animate-pulse opacity-50"
                    style={{ borderColor: safeConfig.colors.primary }}
                  ></div>
                </div>
                
                <div className="flex flex-col">
                  <span 
                    className="text-3xl font-bold tracking-wide"
                    style={{ color: safeConfig.colors.text }}
                  >
                    {safeConfig.logo.text}
                  </span>
                  <div 
                    className="w-full h-px mt-2"
                    style={{ 
                      background: `linear-gradient(to right, ${safeConfig.colors.primary}, transparent)` 
                    }}
                  ></div>
                  <span 
                    className="text-sm mt-2"
                    style={{ color: safeConfig.colors.text }}
                  >
                    {safeConfig.logo.slogan}
                  </span>
                </div>
              </div>
              
              <nav className="hidden md:flex space-x-8">
                {['Inicio', 'Productos', 'Proyectos', 'Servicios', 'Contacto'].map((item) => (
                  <a 
                    key={item}
                    href="#" 
                    className="transition-colors duration-300 relative group"
                    style={{ color: safeConfig.colors.text }}
                  >
                    {item}
                    <div 
                      className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full"
                      style={{ backgroundColor: safeConfig.colors.primary }}
                    ></div>
                  </a>
                ))}
              </nav>
              
              <Button 
                className="font-bold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{ 
                  background: `linear-gradient(to right, ${safeConfig.colors.primary}, ${safeConfig.colors.secondary})`,
                  color: '#000000'
                }}
              >
                SOLICITAR PRESUPUESTO
              </Button>
            </div>
          </header>

          {/* Banner Section */}
          {safeConfig.banner.enabled && (
            <section className="relative z-10 py-12 px-6">
              <div className="max-w-7xl mx-auto">
                <div 
                  className="border-2 rounded-lg p-12 backdrop-blur-sm"
                  style={{ 
                    backgroundColor: 'rgba(55, 65, 81, 0.5)',
                    borderColor: safeConfig.colors.primary 
                  }}
                >
                  <div className="text-center">
                    <h2 
                      className="text-4xl font-bold mb-6"
                      style={{ color: safeConfig.colors.text }}
                    >
                      {safeConfig.banner.title}
                    </h2>
                    <p 
                      className="mb-8 text-lg"
                      style={{ color: safeConfig.colors.text }}
                    >
                      {safeConfig.banner.subtitle}
                    </p>
                    <div 
                      className="rounded-lg flex items-center justify-center border-2"
                      style={{ 
                        backgroundColor: '#4B5563',
                        borderColor: safeConfig.colors.primary,
                        width: safeConfig.banner.width || "100%",
                        height: safeConfig.banner.height || "400px"
                      }}
                    >
                      {safeConfig.banner.image ? (
                        <img 
                          src={safeConfig.banner.image} 
                          alt="Banner" 
                          className="object-cover rounded-lg"
                          style={{
                            width: safeConfig.banner.width || "100%",
                            height: safeConfig.banner.height || "400px"
                          }}
                        />
                      ) : (
                        <span 
                          className="font-semibold text-xl"
                          style={{ color: safeConfig.colors.primary }}
                        >
                          Contenido del Banner
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Values Section */}
          {safeConfig.values && typeof safeConfig.values === 'object' && !Array.isArray(safeConfig.values) && (
            <section className="relative z-10 py-20 px-6">
              <div className="max-w-6xl mx-auto">
                <div 
                  className="w-full h-px mb-16"
                  style={{ 
                    background: `linear-gradient(to right, transparent, ${safeConfig.colors.primary}, transparent)` 
                  }}
                ></div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {Object.entries(safeConfig.values)
                    .filter(([, value]) => 
                      value && 
                      typeof value === 'object' && 
                      !Array.isArray(value) &&
                      'title' in value &&
                      'description' in value &&
                      'icon' in value
                    )
                    .map(([key, value]: [string, any]) => {
                      const IconComponent = getIconComponent(value.icon);
                      return (
                        <div key={key} className="text-center group">
                          <div 
                            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center border group-hover:border-opacity-60 transition-all duration-300"
                            style={{ 
                              backgroundColor: `${safeConfig.colors.primary}20`,
                              borderColor: `${safeConfig.colors.primary}30`
                            }}
                          >
                            <IconComponent 
                              className="w-10 h-10" 
                              style={{ color: safeConfig.colors.primary }} 
                            />
                          </div>
                          <h3 
                            className="text-2xl font-bold mb-3"
                            style={{ color: safeConfig.colors.text }}
                          >
                            {value.title || ''}
                          </h3>
                          <p 
                            className="text-lg"
                            style={{ color: safeConfig.colors.text }}
                          >
                            {value.description || ''}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </section>
          )}

          {/* Product Gallery Section */}
          {safeConfig.products && typeof safeConfig.products === 'object' && !Array.isArray(safeConfig.products) && (
            <section className="relative z-10 py-20 px-6">
              <div className="max-w-6xl mx-auto">
                <h2 
                  className="text-4xl font-bold text-center mb-12"
                  style={{ color: safeConfig.colors.text }}
                >
                  {safeConfig.products.title || 'Productos'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {(Array.isArray(safeConfig.products.items) ? safeConfig.products.items : []).filter(item => item && item.enabled).map((product) => (
                  <div 
                    key={product.id}
                    className="border-2 rounded-lg p-6 backdrop-blur-sm group hover:border-opacity-100 transition-all duration-300"
                    style={{ 
                      backgroundColor: 'rgba(55, 65, 81, 0.5)',
                      borderColor: `${safeConfig.colors.primary}50`
                    }}
                  >
                    <div 
                      className="w-full h-48 rounded-lg mb-4 flex items-center justify-center border-2"
                      style={{ 
                        backgroundColor: '#4B5563',
                        borderColor: safeConfig.colors.primary 
                      }}
                    >
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span 
                          className="font-semibold text-lg"
                          style={{ color: safeConfig.colors.primary }}
                        >
                          {product.name}
                        </span>
                      )}
                    </div>
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{ color: safeConfig.colors.text }}
                    >
                      {product.name}
                    </h3>
                    <p 
                      className="mb-4"
                      style={{ color: safeConfig.colors.text }}
                    >
                      {product.description}
                    </p>
                    <Button 
                      className="w-full font-semibold py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                      style={{ 
                        background: `linear-gradient(to right, ${safeConfig.colors.primary}, ${safeConfig.colors.secondary})`,
                        color: '#000000'
                      }}
                    >
                      Ver Más
                    </Button>
                  </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Contact Section */}
          {safeConfig.contact.enabled && (
            <section className="relative z-10 py-20 px-6">
              <div className="max-w-4xl mx-auto text-center">
                <h2 
                  className="text-4xl font-bold mb-8"
                  style={{ color: safeConfig.colors.text }}
                >
                  {safeConfig.contact.title}
                </h2>
                <p 
                  className="text-xl mb-8"
                  style={{ color: safeConfig.colors.text }}
                >
                  {safeConfig.contact.subtitle}
                </p>
                <Button 
                  className="px-8 py-4 text-lg font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  style={{ 
                    background: `linear-gradient(to right, ${safeConfig.colors.primary}, ${safeConfig.colors.secondary})`,
                    color: '#000000'
                  }}
                >
                  Contáctanos
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePreview;
