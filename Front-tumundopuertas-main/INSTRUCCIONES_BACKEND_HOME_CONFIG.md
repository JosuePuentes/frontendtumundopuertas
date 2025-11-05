# Instrucciones Backend - Configuración del Homepage

## 📋 Resumen

Este documento contiene las instrucciones para implementar los endpoints del backend que permiten guardar y cargar la configuración del homepage de forma permanente en la base de datos.

## 🎯 Objetivo

Permitir que la configuración del homepage (textos, colores, imágenes, banner, logo, productos, etc.) se guarde en la base de datos MongoDB y persista entre actualizaciones de página, en lugar de usar solo `localStorage`.

## 📦 Estructura de Datos

### Modelo de Configuración (HomeConfig)

```python
from pydantic import BaseModel
from typing import List, Optional

class BannerConfig(BaseModel):
    title: str
    subtitle: str
    image: str  # URL de la imagen o base64
    enabled: bool

class LogoConfig(BaseModel):
    text: str
    slogan: str
    image: str  # URL de la imagen o base64
    enabled: bool

class ValueConfig(BaseModel):
    title: str
    description: str
    icon: str  # "Star", "Shield", "Zap"

class ValuesConfig(BaseModel):
    diseño: ValueConfig
    calidad: ValueConfig
    proteccion: ValueConfig

class ProductItem(BaseModel):
    id: str
    name: str
    description: str
    image: str  # URL de la imagen o base64
    enabled: bool

class ProductsConfig(BaseModel):
    title: str
    items: List[ProductItem]

class ContactConfig(BaseModel):
    title: str
    subtitle: str
    enabled: bool

class ColorsConfig(BaseModel):
    primary: str  # Código hexadecimal, ej: "#06b6d4"
    secondary: str
    accent: str
    background: str
    text: str

class HomeConfig(BaseModel):
    banner: BannerConfig
    logo: LogoConfig
    values: ValuesConfig
    products: ProductsConfig
    contact: ContactConfig
    colors: ColorsConfig

class HomeConfigRequest(BaseModel):
    config: HomeConfig
```

### Configuración por Defecto

```python
DEFAULT_CONFIG = {
    "banner": {
        "title": "TU MUNDO PUERTAS",
        "subtitle": "Diseño, Calidad y Protección",
        "image": "",
        "enabled": True
    },
    "logo": {
        "text": "TU MUNDO PUERTAS",
        "slogan": "Diseño, Calidad y Protección",
        "image": "",
        "enabled": True
    },
    "values": {
        "diseño": {
            "title": "Diseño",
            "description": "Soluciones arquitectónicas innovadoras",
            "icon": "Star"
        },
        "calidad": {
            "title": "Calidad",
            "description": "Materiales de primera calidad",
            "icon": "Shield"
        },
        "proteccion": {
            "title": "Protección",
            "description": "Seguridad y durabilidad garantizada",
            "icon": "Zap"
        }
    },
    "products": {
        "title": "Innovación y Tradición en Cada Apertura",
        "items": [
            {
                "id": "1",
                "name": "Boccion",
                "description": "Puerta de seguridad robusta",
                "image": "",
                "enabled": True
            },
            {
                "id": "2",
                "name": "Aluminium",
                "description": "Puerta de aluminio moderna",
                "image": "",
                "enabled": True
            },
            {
                "id": "3",
                "name": "Yar Mes",
                "description": "Puerta de madera elegante",
                "image": "",
                "enabled": True
            }
        ]
    },
    "contact": {
        "title": "¿Listo para tu próximo proyecto?",
        "subtitle": "Contáctanos y descubre cómo podemos transformar tu espacio",
        "enabled": True
    },
    "colors": {
        "primary": "#06b6d4",
        "secondary": "#0891b2",
        "accent": "#0ea5e9",
        "background": "#000000",
        "text": "#e5e7eb"
    }
}
```

## 🔌 Endpoints Requeridos

### 1. GET `/home/config`

**Descripción**: Obtiene la configuración actual del homepage.

**Método**: `GET`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (opcional, pero recomendado)

**Respuesta exitosa (200 OK)**:
```json
{
    "config": {
        "banner": { ... },
        "logo": { ... },
        "values": { ... },
        "products": { ... },
        "contact": { ... },
        "colors": { ... }
    }
}
```

**Respuesta si no existe configuración (404 Not Found)**:
```json
{
    "detail": "No se encontró configuración del homepage"
}
```

### 2. PUT `/home/config`

**Descripción**: Guarda o actualiza la configuración del homepage.

**Método**: `PUT`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (opcional, pero recomendado)

**Body**:
```json
{
    "config": {
        "banner": { ... },
        "logo": { ... },
        "values": { ... },
        "products": { ... },
        "contact": { ... },
        "colors": { ... }
    }
}
```

**Respuesta exitosa (200 OK)**:
```json
{
    "message": "Configuración guardada exitosamente",
    "config": {
        "banner": { ... },
        "logo": { ... },
        ...
    }
}
```

**Errores posibles**:
- `400 Bad Request`: Si el body no es válido
- `500 Internal Server Error`: Si hay un error al guardar en la base de datos

## 💻 Implementación en FastAPI

### 1. Crear el archivo de rutas

**Ubicación**: `api/src/routes/home.py` (o similar)

```python
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from config.mongodb import db
from models.authmodels import HomeConfigRequest, HomeConfig
from bson import ObjectId
import json

router = APIRouter()

# Colección de MongoDB
home_config_collection = db["HOME_CONFIG"]

# Configuración por defecto
DEFAULT_CONFIG = {
    "banner": {
        "title": "TU MUNDO PUERTAS",
        "subtitle": "Diseño, Calidad y Protección",
        "image": "",
        "enabled": True
    },
    "logo": {
        "text": "TU MUNDO PUERTAS",
        "slogan": "Diseño, Calidad y Protección",
        "image": "",
        "enabled": True
    },
    "values": {
        "diseño": {
            "title": "Diseño",
            "description": "Soluciones arquitectónicas innovadoras",
            "icon": "Star"
        },
        "calidad": {
            "title": "Calidad",
            "description": "Materiales de primera calidad",
            "icon": "Shield"
        },
        "proteccion": {
            "title": "Protección",
            "description": "Seguridad y durabilidad garantizada",
            "icon": "Zap"
        }
    },
    "products": {
        "title": "Innovación y Tradición en Cada Apertura",
        "items": [
            {
                "id": "1",
                "name": "Boccion",
                "description": "Puerta de seguridad robusta",
                "image": "",
                "enabled": True
            },
            {
                "id": "2",
                "name": "Aluminium",
                "description": "Puerta de aluminio moderna",
                "image": "",
                "enabled": True
            },
            {
                "id": "3",
                "name": "Yar Mes",
                "description": "Puerta de madera elegante",
                "image": "",
                "enabled": True
            }
        ]
    },
    "contact": {
        "title": "¿Listo para tu próximo proyecto?",
        "subtitle": "Contáctanos y descubre cómo podemos transformar tu espacio",
        "enabled": True
    },
    "colors": {
        "primary": "#06b6d4",
        "secondary": "#0891b2",
        "accent": "#0ea5e9",
        "background": "#000000",
        "text": "#e5e7eb"
    }
}

@router.get("/home/config")
async def get_home_config():
    """
    Obtiene la configuración actual del homepage.
    Si no existe, devuelve 404.
    """
    try:
        # Buscar la configuración (solo debería haber una)
        config_doc = home_config_collection.find_one({})
        
        if not config_doc:
            raise HTTPException(status_code=404, detail="No se encontró configuración del homepage")
        
        # Remover el _id de MongoDB
        config_doc.pop('_id', None)
        
        return {
            "config": config_doc.get("config", DEFAULT_CONFIG)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al obtener configuración del homepage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener la configuración: {str(e)}")

@router.put("/home/config")
async def update_home_config(config_request: HomeConfigRequest):
    """
    Guarda o actualiza la configuración del homepage.
    Si no existe, la crea. Si existe, la actualiza.
    """
    try:
        config_dict = config_request.config.dict()
        
        # Buscar si ya existe una configuración
        existing_config = home_config_collection.find_one({})
        
        if existing_config:
            # Actualizar la configuración existente
            result = home_config_collection.update_one(
                {},
                {"$set": {"config": config_dict}},
                upsert=False
            )
            
            if result.modified_count > 0 or result.matched_count > 0:
                return {
                    "message": "Configuración actualizada exitosamente",
                    "config": config_dict
                }
            else:
                raise HTTPException(status_code=500, detail="Error al actualizar la configuración")
        else:
            # Crear nueva configuración
            result = home_config_collection.insert_one({
                "config": config_dict
            })
            
            if result.inserted_id:
                return {
                    "message": "Configuración guardada exitosamente",
                    "config": config_dict
                }
            else:
                raise HTTPException(status_code=500, detail="Error al guardar la configuración")
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al guardar configuración del homepage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al guardar la configuración: {str(e)}")
```

### 2. Agregar los modelos en `authmodels.py`

**Ubicación**: `api/src/models/authmodels.py`

```python
from pydantic import BaseModel
from typing import List, Optional

class BannerConfig(BaseModel):
    title: str
    subtitle: str
    image: str = ""
    enabled: bool = True

class LogoConfig(BaseModel):
    text: str
    slogan: str
    image: str = ""
    enabled: bool = True

class ValueConfig(BaseModel):
    title: str
    description: str
    icon: str  # "Star", "Shield", "Zap"

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

class HomeConfig(BaseModel):
    banner: BannerConfig
    logo: LogoConfig
    values: ValuesConfig
    products: ProductsConfig
    contact: ContactConfig
    colors: ColorsConfig

class HomeConfigRequest(BaseModel):
    config: HomeConfig
```

### 3. Registrar la ruta en el archivo principal

**Ubicación**: `api/src/main.py` (o donde se registren las rutas)

```python
from routes.home import router as home_router

app.include_router(home_router)
```

## 📝 Estructura de la Base de Datos

### Colección: `HOME_CONFIG`

**Documento único**:
```json
{
    "_id": ObjectId("..."),
    "config": {
        "banner": { ... },
        "logo": { ... },
        "values": { ... },
        "products": { ... },
        "contact": { ... },
        "colors": { ... }
    }
}
```

**Nota**: Solo debería haber UN documento en esta colección. El endpoint `PUT` actualiza el documento existente o crea uno nuevo si no existe.

## 🔍 Validación y Manejo de Errores

### Validaciones a implementar:

1. **Validar estructura del JSON**: Usar Pydantic para validar que el body tenga la estructura correcta.
2. **Validar tipos de datos**: Asegurarse de que los colores sean códigos hexadecimales válidos, que los booleanos sean booleanos, etc.
3. **Manejo de imágenes**: Las imágenes pueden venir como:
   - URLs (strings que empiezan con `http://` o `https://`)
   - Base64 (strings que empiezan con `data:image/...`)
   - Strings vacíos (`""`)

### Ejemplo de validación adicional:

```python
import re

def validate_color(color: str) -> bool:
    """Valida que el color sea un código hexadecimal válido"""
    pattern = r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
    return bool(re.match(pattern, color))

# En el endpoint PUT:
if not validate_color(config_request.config.colors.primary):
    raise HTTPException(status_code=400, detail="Color primario inválido")
```

## 📤 Manejo de Imágenes (Opcional - Mejora Futura)

Actualmente, las imágenes se guardan como base64 o URLs. Para una mejor solución a largo plazo, se recomienda:

1. **Subir imágenes a S3**: Usar el endpoint `/files/presigned-url` existente para subir imágenes.
2. **Guardar solo URLs**: En lugar de base64, guardar la URL de S3 en la configuración.
3. **Límite de tamaño**: Validar que las imágenes base64 no excedan cierto tamaño (ej: 5MB).

## ✅ Checklist de Implementación

- [ ] Crear archivo `routes/home.py` con los endpoints
- [ ] Agregar modelos en `models/authmodels.py`
- [ ] Registrar rutas en `main.py`
- [ ] Probar endpoint `GET /home/config` (debe devolver 404 si no hay configuración)
- [ ] Probar endpoint `PUT /home/config` (debe crear configuración)
- [ ] Probar endpoint `GET /home/config` después de crear (debe devolver la configuración)
- [ ] Probar endpoint `PUT /home/config` con configuración existente (debe actualizar)
- [ ] Validar que la estructura JSON se guarde correctamente en MongoDB
- [ ] Verificar que las imágenes base64 se guarden correctamente (si se usan)

## 🧪 Pruebas con Postman/cURL

### Crear/Actualizar configuración:
```bash
curl -X PUT "https://tu-api.com/home/config" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "config": {
      "banner": {
        "title": "TU MUNDO PUERTAS",
        "subtitle": "Diseño, Calidad y Protección",
        "image": "",
        "enabled": true
      },
      ...
    }
  }'
```

### Obtener configuración:
```bash
curl -X GET "https://tu-api.com/home/config" \
  -H "Content-Type: application/json"
```

## 📌 Notas Importantes

1. **Único documento**: Solo debe haber UN documento en la colección `HOME_CONFIG`. El endpoint `PUT` siempre actualiza el mismo documento o lo crea si no existe.

2. **Compatibilidad**: El frontend mantiene compatibilidad con `localStorage` como fallback. Si el backend no responde o no tiene configuración, el frontend intentará cargar desde `localStorage`.

3. **Imágenes**: Las imágenes pueden ser muy grandes si se guardan como base64. Considera implementar límites de tamaño o migrar a S3 en el futuro.

4. **Autenticación**: Los endpoints pueden funcionar sin autenticación, pero es recomendable agregar validación de permisos si quieres restringir quién puede modificar el homepage.

5. **Backup**: Considera implementar un sistema de versionado o backup de la configuración antes de actualizarla, para poder revertir cambios si es necesario.

## 🚀 Resultado Esperado

Una vez implementado:

1. ✅ El frontend puede cargar la configuración desde el backend
2. ✅ El frontend puede guardar cambios permanentemente en el backend
3. ✅ La configuración persiste entre actualizaciones de página
4. ✅ La configuración se mantiene sincronizada entre diferentes dispositivos/navegadores
5. ✅ Si el backend no está disponible, el frontend usa `localStorage` como fallback

