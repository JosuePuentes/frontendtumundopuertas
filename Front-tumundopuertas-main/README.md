# Frontend Tu Mundo Puertas

Aplicación frontend para el sistema de gestión de pedidos de Tu Mundo Puertas.

## 🚀 Características

- **Gestión de Pedidos**: Creación, seguimiento y cancelación de pedidos
- **Dashboard de Asignaciones**: Visualización de tareas asignadas a empleados
- **Pedidos Herrería**: Gestión de items en proceso de herrería
- **Monitor de Pedidos**: Seguimiento en tiempo real del progreso
- **Autenticación**: Sistema de login seguro
- **Responsive Design**: Interfaz adaptable a diferentes dispositivos

## 🛠️ Tecnologías

- **React 19** con TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **Radix UI** para componentes
- **React Router** para navegación
- **React Hook Form** para formularios

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🔧 Configuración

La aplicación se conecta al backend en `https://crafteo.onrender.com` por defecto.

## 📱 Funcionalidades Principales

### Dashboard de Asignaciones
- Visualización de tareas asignadas
- Filtrado por módulo y empleado
- Terminación de tareas con PIN

### Pedidos Herrería
- Lista de items pendientes de asignación
- Asignación de empleados por módulo
- Actualización automática cada 5 minutos

### Monitor de Pedidos
- Seguimiento del progreso general
- Visualización de estados por item
- Cancelación de pedidos

## 🎯 Estados de Items

- **0**: Pendiente → Aparecen en PedidosHerreria
- **1**: Herrería → Asignado a empleado
- **2**: Masillar → En proceso
- **3**: Preparar → En proceso
- **4**: Terminado → Desaparecen de PedidosHerreria

## 🔄 Sincronización

La aplicación incluye múltiples mecanismos de sincronización:

- **Eventos personalizados**: Para comunicación entre componentes
- **Actualización automática**: Cada 5 minutos en PedidosHerreria
- **Recarga manual**: Botones de refresh en cada sección
- **Manejo de errores**: Reintentos automáticos con backoff exponencial

## 🚀 Deploy

El proyecto está configurado para deploy automático en Vercel.

## 📝 Notas de Desarrollo

- Todos los cambios están implementados y probados
- Manejo robusto de errores de conectividad
- Optimización de rendimiento con debounce
- Interfaz de usuario mejorada con mejor UX

---

**Última actualización**: Octubre 2025