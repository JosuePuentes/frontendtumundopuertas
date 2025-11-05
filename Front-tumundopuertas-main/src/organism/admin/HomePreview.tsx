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

interface HomePreviewProps {
  config: HomeConfig;
  onClose: () => void;
}

const HomePreview: React.FC<HomePreviewProps> = ({ config, onClose }) => {
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
            backgroundColor: config.colors.background,
            color: config.colors.text 
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
                      borderColor: config.colors.primary,
                      backgroundColor: '#374151'
                    }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                      {config.logo.image ? (
                        <img 
                          src={config.logo.image} 
                          alt="Logo" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="relative z-10">
                          <div 
                            className="font-bold text-lg leading-none"
                            style={{ color: config.colors.primary }}
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
                    style={{ borderColor: config.colors.primary }}
                  ></div>
                </div>
                
                <div className="flex flex-col">
                  <span 
                    className="text-3xl font-bold tracking-wide"
                    style={{ color: config.colors.text }}
                  >
                    {config.logo.text}
                  </span>
                  <div 
                    className="w-full h-px mt-2"
                    style={{ 
                      background: `linear-gradient(to right, ${config.colors.primary}, transparent)` 
                    }}
                  ></div>
                  <span 
                    className="text-sm mt-2"
                    style={{ color: config.colors.text }}
                  >
                    {config.logo.slogan}
                  </span>
                </div>
              </div>
              
              <nav className="hidden md:flex space-x-8">
                {['Inicio', 'Productos', 'Proyectos', 'Servicios', 'Contacto'].map((item) => (
                  <a 
                    key={item}
                    href="#" 
                    className="transition-colors duration-300 relative group"
                    style={{ color: config.colors.text }}
                  >
                    {item}
                    <div 
                      className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full"
                      style={{ backgroundColor: config.colors.primary }}
                    ></div>
                  </a>
                ))}
              </nav>
              
              <Button 
                className="font-bold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{ 
                  background: `linear-gradient(to right, ${config.colors.primary}, ${config.colors.secondary})`,
                  color: '#000000'
                }}
              >
                SOLICITAR PRESUPUESTO
              </Button>
            </div>
          </header>

          {/* Banner Section */}
          {config.banner.enabled && (
            <section className="relative z-10 py-12 px-6">
              <div className="max-w-7xl mx-auto">
                <div 
                  className="border-2 rounded-lg p-12 backdrop-blur-sm"
                  style={{ 
                    backgroundColor: 'rgba(55, 65, 81, 0.5)',
                    borderColor: config.colors.primary 
                  }}
                >
                  <div className="text-center">
                    <h2 
                      className="text-4xl font-bold mb-6"
                      style={{ color: config.colors.text }}
                    >
                      {config.banner.title}
                    </h2>
                    <p 
                      className="mb-8 text-lg"
                      style={{ color: config.colors.text }}
                    >
                      {config.banner.subtitle}
                    </p>
                    <div 
                      className="w-full h-48 rounded-lg flex items-center justify-center border-2"
                      style={{ 
                        backgroundColor: '#4B5563',
                        borderColor: config.colors.primary 
                      }}
                    >
                      {config.banner.image ? (
                        <img 
                          src={config.banner.image} 
                          alt="Banner" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span 
                          className="font-semibold text-xl"
                          style={{ color: config.colors.primary }}
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
          {config.values && typeof config.values === 'object' && !Array.isArray(config.values) && (
            <section className="relative z-10 py-20 px-6">
              <div className="max-w-6xl mx-auto">
                <div 
                  className="w-full h-px mb-16"
                  style={{ 
                    background: `linear-gradient(to right, transparent, ${config.colors.primary}, transparent)` 
                  }}
                ></div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {Object.entries(config.values)
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
                              backgroundColor: `${config.colors.primary}20`,
                              borderColor: `${config.colors.primary}30`
                            }}
                          >
                            <IconComponent 
                              className="w-10 h-10" 
                              style={{ color: config.colors.primary }} 
                            />
                          </div>
                          <h3 
                            className="text-2xl font-bold mb-3"
                            style={{ color: config.colors.text }}
                          >
                            {value.title || ''}
                          </h3>
                          <p 
                            className="text-lg"
                            style={{ color: config.colors.text }}
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
          {config.products && typeof config.products === 'object' && !Array.isArray(config.products) && (
            <section className="relative z-10 py-20 px-6">
              <div className="max-w-6xl mx-auto">
                <h2 
                  className="text-4xl font-bold text-center mb-12"
                  style={{ color: config.colors.text }}
                >
                  {config.products.title || 'Productos'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {(Array.isArray(config.products.items) ? config.products.items : []).filter(item => item && item.enabled).map((product) => (
                  <div 
                    key={product.id}
                    className="border-2 rounded-lg p-6 backdrop-blur-sm group hover:border-opacity-100 transition-all duration-300"
                    style={{ 
                      backgroundColor: 'rgba(55, 65, 81, 0.5)',
                      borderColor: `${config.colors.primary}50`
                    }}
                  >
                    <div 
                      className="w-full h-48 rounded-lg mb-4 flex items-center justify-center border-2"
                      style={{ 
                        backgroundColor: '#4B5563',
                        borderColor: config.colors.primary 
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
                          style={{ color: config.colors.primary }}
                        >
                          {product.name}
                        </span>
                      )}
                    </div>
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{ color: config.colors.text }}
                    >
                      {product.name}
                    </h3>
                    <p 
                      className="mb-4"
                      style={{ color: config.colors.text }}
                    >
                      {product.description}
                    </p>
                    <Button 
                      className="w-full font-semibold py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                      style={{ 
                        background: `linear-gradient(to right, ${config.colors.primary}, ${config.colors.secondary})`,
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
          {config.contact.enabled && (
            <section className="relative z-10 py-20 px-6">
              <div className="max-w-4xl mx-auto text-center">
                <h2 
                  className="text-4xl font-bold mb-8"
                  style={{ color: config.colors.text }}
                >
                  {config.contact.title}
                </h2>
                <p 
                  className="text-xl mb-8"
                  style={{ color: config.colors.text }}
                >
                  {config.contact.subtitle}
                </p>
                <Button 
                  className="px-8 py-4 text-lg font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  style={{ 
                    background: `linear-gradient(to right, ${config.colors.primary}, ${config.colors.secondary})`,
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
