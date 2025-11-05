# Instrucciones Backend - Actualización HomeConfig (Campos Nuevos)

## 📋 Resumen

Actualización del modelo `HomeConfig` para incluir:
- Campos de tamaño (width, height) en Banner y Logo
- Nueva sección "Nosotros" con campos de tipografía
- Nueva sección "Servicios" con items y campos de tipografía
- Nueva sección "Tipografía" global

## 🔄 Cambios Requeridos

### 1. Actualizar BannerConfig

**Ubicación**: `api/src/models/authmodels.py`

```python
class BannerConfig(BaseModel):
    title: str
    subtitle: str
    image: str = ""
    enabled: bool = True
    width: Optional[str] = "100%"  # Nuevo campo
    height: Optional[str] = "400px"  # Nuevo campo
```

### 2. Actualizar LogoConfig

**Ubicación**: `api/src/models/authmodels.py`

```python
class LogoConfig(BaseModel):
    text: str
    slogan: str
    image: str = ""
    enabled: bool = True
    width: Optional[str] = "200px"  # Nuevo campo
    height: Optional[str] = "auto"  # Nuevo campo
```

### 3. Agregar NosotrosConfig

**Ubicación**: `api/src/models/authmodels.py`

```python
class NosotrosConfig(BaseModel):
    historia: str = ""
    mision: str = ""
    vision: str = ""
    enabled: bool = True
    titleFontSize: Optional[str] = "2rem"
    titleFontFamily: Optional[str] = "Arial, sans-serif"
    titleFontWeight: Optional[str] = "bold"
    textFontSize: Optional[str] = "1rem"
    textFontFamily: Optional[str] = "Arial, sans-serif"
    textFontWeight: Optional[str] = "normal"
```

### 4. Agregar ServiciosConfig

**Ubicación**: `api/src/models/authmodels.py`

```python
class ServicioItem(BaseModel):
    id: str
    title: str
    description: str
    enabled: bool = True

class ServiciosConfig(BaseModel):
    items: List[ServicioItem] = []
    enabled: bool = True
    titleFontSize: Optional[str] = "1.5rem"
    titleFontFamily: Optional[str] = "Arial, sans-serif"
    titleFontWeight: Optional[str] = "bold"
    textFontSize: Optional[str] = "1rem"
    textFontFamily: Optional[str] = "Arial, sans-serif"
    textFontWeight: Optional[str] = "normal"
```

### 5. Agregar TypographyConfig

**Ubicación**: `api/src/models/authmodels.py`

```python
class TypographyConfig(BaseModel):
    defaultFontFamily: Optional[str] = "Arial, sans-serif"
    defaultFontSize: Optional[str] = "1rem"
    headingFontFamily: Optional[str] = "Arial, sans-serif"
    headingFontSize: Optional[str] = "2rem"
    headingFontWeight: Optional[str] = "bold"
```

### 6. Actualizar HomeConfig

**Ubicación**: `api/src/models/authmodels.py`

```python
class HomeConfig(BaseModel):
    banner: BannerConfig
    logo: LogoConfig
    values: ValuesConfig
    products: ProductsConfig
    contact: ContactConfig
    colors: ColorsConfig
    nosotros: Optional[NosotrosConfig] = None  # Nuevo campo
    servicios: Optional[ServiciosConfig] = None  # Nuevo campo
    typography: Optional[TypographyConfig] = None  # Nuevo campo
```

## 📝 Código Completo Actualizado

**Ubicación**: `api/src/models/authmodels.py`

```python
from pydantic import BaseModel
from typing import List, Optional

class BannerConfig(BaseModel):
    title: str
    subtitle: str
    image: str = ""
    enabled: bool = True
    width: Optional[str] = "100%"
    height: Optional[str] = "400px"

class LogoConfig(BaseModel):
    text: str
    slogan: str
    image: str = ""
    enabled: bool = True
    width: Optional[str] = "200px"
    height: Optional[str] = "auto"

class ValueConfig(BaseModel):
    title: str
    description: str
    icon: str

class ValuesConfig(BaseModel):
    diseño: ValueConfig
    calidad: ValueConfig
    proteccion: ValueConfig

class ProductItem(BaseModel):
    id: str
    name: str
    description: str
    image: str = ""
    enabled: bool = True

class ProductsConfig(BaseModel):
    title: str
    items: List[ProductItem]

class ContactConfig(BaseModel):
    title: str
    subtitle: str
    enabled: bool = True

class ColorsConfig(BaseModel):
    primary: str = "#06b6d4"
    secondary: str = "#0891b2"
    accent: str = "#0ea5e9"
    background: str = "#000000"
    text: str = "#e5e7eb"

class NosotrosConfig(BaseModel):
    historia: str = ""
    mision: str = ""
    vision: str = ""
    enabled: bool = True
    titleFontSize: Optional[str] = "2rem"
    titleFontFamily: Optional[str] = "Arial, sans-serif"
    titleFontWeight: Optional[str] = "bold"
    textFontSize: Optional[str] = "1rem"
    textFontFamily: Optional[str] = "Arial, sans-serif"
    textFontWeight: Optional[str] = "normal"

class ServicioItem(BaseModel):
    id: str
    title: str
    description: str
    enabled: bool = True

class ServiciosConfig(BaseModel):
    items: List[ServicioItem] = []
    enabled: bool = True
    titleFontSize: Optional[str] = "1.5rem"
    titleFontFamily: Optional[str] = "Arial, sans-serif"
    titleFontWeight: Optional[str] = "bold"
    textFontSize: Optional[str] = "1rem"
    textFontFamily: Optional[str] = "Arial, sans-serif"
    textFontWeight: Optional[str] = "normal"

class TypographyConfig(BaseModel):
    defaultFontFamily: Optional[str] = "Arial, sans-serif"
    defaultFontSize: Optional[str] = "1rem"
    headingFontFamily: Optional[str] = "Arial, sans-serif"
    headingFontSize: Optional[str] = "2rem"
    headingFontWeight: Optional[str] = "bold"

class HomeConfig(BaseModel):
    banner: BannerConfig
    logo: LogoConfig
    values: ValuesConfig
    products: ProductsConfig
    contact: ContactConfig
    colors: ColorsConfig
    nosotros: Optional[NosotrosConfig] = None
    servicios: Optional[ServiciosConfig] = None
    typography: Optional[TypographyConfig] = None

class HomeConfigRequest(BaseModel):
    config: HomeConfig
```

## 🔧 Actualizar Función get_default_config() (si existe)

Si tienes una función `get_default_config()` en `api/src/routes/home.py`, actualízala para incluir valores por defecto:

```python
def get_default_config():
    return {
        "banner": {
            "title": "Banner Promocional",
            "subtitle": "Espacio reservado para contenido promocional o anuncios",
            "image": "",
            "enabled": True,
            "width": "100%",
            "height": "400px"
        },
        "logo": {
            "text": "TU MUNDO PUERTAS",
            "slogan": "DISEÑO, CALIDAD Y PROTECCIÓN",
            "image": "",
            "enabled": True,
            "width": "200px",
            "height": "auto"
        },
        "nosotros": {
            "historia": "Todo comenzó como un sueño, una idea, pero con muchas ganas...",
            "mision": "Proporcionar puertas y ventanas de alta calidad...",
            "vision": "Ser la empresa líder en fabricación y distribución...",
            "enabled": True,
            "titleFontSize": "2rem",
            "titleFontFamily": "Arial, sans-serif",
            "titleFontWeight": "bold",
            "textFontSize": "1rem",
            "textFontFamily": "Arial, sans-serif",
            "textFontWeight": "normal"
        },
        "servicios": {
            "items": [
                {
                    "id": "1",
                    "title": "Venta de Puertas y Ventanas",
                    "description": "Ofrecemos una amplia variedad...",
                    "enabled": True
                }
                # ... más servicios
            ],
            "enabled": True,
            "titleFontSize": "1.5rem",
            "titleFontFamily": "Arial, sans-serif",
            "titleFontWeight": "bold",
            "textFontSize": "1rem",
            "textFontFamily": "Arial, sans-serif",
            "textFontWeight": "normal"
        },
        "typography": {
            "defaultFontFamily": "Arial, sans-serif",
            "defaultFontSize": "1rem",
            "headingFontFamily": "Arial, sans-serif",
            "headingFontSize": "2rem",
            "headingFontWeight": "bold"
        }
        # ... resto de campos existentes
    }
```

## ⚠️ Importante

1. **Todos los campos nuevos son opcionales** (`Optional[...]`) para mantener compatibilidad con configuraciones existentes.
2. **Los valores por defecto** aseguran que si no se envían estos campos, se usen valores razonables.
3. **No es necesario migrar datos existentes** - MongoDB aceptará documentos con o sin estos campos.
4. **El endpoint PUT `/home/config`** debe aceptar estos campos nuevos sin validación estricta (gracias a `Optional`).

## ✅ Checklist

- [ ] Actualizar `BannerConfig` con `width` y `height`
- [ ] Actualizar `LogoConfig` con `width` y `height`
- [ ] Agregar `NosotrosConfig` con todos sus campos
- [ ] Agregar `ServicioItem` y `ServiciosConfig`
- [ ] Agregar `TypographyConfig`
- [ ] Actualizar `HomeConfig` para incluir los nuevos campos opcionales
- [ ] Actualizar `get_default_config()` si existe
- [ ] Probar que el endpoint acepta configuraciones con los nuevos campos
- [ ] Probar que el endpoint acepta configuraciones sin los nuevos campos (compatibilidad hacia atrás)

## 🧪 Pruebas

Después de actualizar, prueba enviar esta configuración:

```json
{
  "config": {
    "banner": {
      "title": "Test",
      "subtitle": "Test",
      "image": "",
      "enabled": true,
      "width": "100%",
      "height": "500px"
    },
    "logo": {
      "text": "Test",
      "slogan": "Test",
      "image": "",
      "enabled": true,
      "width": "300px",
      "height": "auto"
    },
    "nosotros": {
      "historia": "Test historia",
      "mision": "Test misión",
      "vision": "Test visión",
      "enabled": true,
      "titleFontSize": "2.5rem",
      "titleFontFamily": "Georgia, serif",
      "titleFontWeight": "bold"
    },
    "servicios": {
      "items": [],
      "enabled": true,
      "titleFontSize": "1.8rem"
    },
    "typography": {
      "defaultFontFamily": "Verdana, sans-serif",
      "defaultFontSize": "1.2rem"
    }
    // ... resto de campos requeridos
  }
}
```

Si el backend acepta esta configuración sin errores, está listo. ✅

