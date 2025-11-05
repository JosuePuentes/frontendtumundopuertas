# Instrucciones Backend - Manejo de Imágenes Base64

## 📋 Resumen

Este documento explica cómo el backend debe manejar las imágenes base64 que se envían desde el frontend en la configuración del homepage.

## 🔍 Problema Identificado

Las imágenes (banner, logo, productos) se están guardando como base64 en el frontend, pero pueden no estar persistiendo correctamente en la base de datos. Esto puede deberse a:

1. **Tamaño de las imágenes**: Las imágenes base64 pueden ser muy grandes (varios MB)
2. **Límites de MongoDB**: MongoDB puede tener límites en el tamaño de documentos
3. **Serialización**: El backend puede no estar guardando correctamente los strings base64

## ✅ Solución Implementada en Frontend

El frontend convierte las imágenes a base64 usando `FileReader.readAsDataURL()` y las incluye en el objeto `config` que se envía al backend:

```typescript
// Ejemplo de cómo se manejan las imágenes
const handleImageUpload = (section: string, field: string, file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageData = e.target?.result as string; // "data:image/jpeg;base64,/9j/4AAQ..."
    updateConfig(section, field, imageData);
  };
  reader.readAsDataURL(file);
};
```

Las imágenes se envían como strings en formato: `"data:image/jpeg;base64,/9j/4AAQ..."`

## 🔧 Verificaciones Requeridas en Backend

### 1. Verificar que el modelo acepte strings largos

**Ubicación**: `api/src/models/authmodels.py`

Asegúrate de que los campos `image` en `BannerConfig`, `LogoConfig`, y `ProductItem` acepten strings largos:

```python
class BannerConfig(BaseModel):
    title: str
    subtitle: str
    image: str = ""  # Debe aceptar strings largos (base64)
    enabled: bool = True
    width: Optional[str] = "100%"
    height: Optional[str] = "400px"

class LogoConfig(BaseModel):
    text: str
    slogan: str
    image: str = ""  # Debe aceptar strings largos (base64)
    enabled: bool = True
    width: Optional[str] = "200px"
    height: Optional[str] = "auto"

class ProductItem(BaseModel):
    id: str
    name: str
    description: str
    image: str = ""  # Debe aceptar strings largos (base64)
    enabled: bool = True
```

### 2. Verificar que MongoDB guarde los strings completos

**Ubicación**: `api/src/routes/home.py`

En el endpoint `PUT /home/config`, asegúrate de que se guarde todo el objeto `config` sin truncar:

```python
@router.put("/config")
async def save_config(config_request: HomeConfigRequest):
    try:
        # Asegurar que se guarde todo el objeto completo
        config_dict = config_request.config.dict(by_alias=True, exclude_unset=False)
        
        # Verificar que las imágenes estén presentes
        if config_dict.get("banner", {}).get("image"):
            print(f"Banner image presente: {len(config_dict['banner']['image'])} caracteres")
        if config_dict.get("logo", {}).get("image"):
            print(f"Logo image presente: {len(config_dict['logo']['image'])} caracteres")
        
        # Guardar en MongoDB
        result = home_config_collection.update_one(
            {},
            {"$set": {"config": config_dict}},
            upsert=True
        )
        
        return {"config": config_dict, "message": "Configuración guardada exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar: {str(e)}")
```

### 3. Verificar que el GET retorne las imágenes completas

**Ubicación**: `api/src/routes/home.py`

En el endpoint `GET /home/config`, asegúrate de retornar todo el documento sin truncar:

```python
@router.get("/config")
async def get_config():
    config_doc = home_config_collection.find_one({})
    if not config_doc:
        raise HTTPException(status_code=404, detail="No se encontró configuración del homepage")
    
    config = config_doc.get("config", {})
    
    # Verificar que las imágenes estén presentes
    if config.get("banner", {}).get("image"):
        print(f"Banner image en respuesta: {len(config['banner']['image'])} caracteres")
    if config.get("logo", {}).get("image"):
        print(f"Logo image en respuesta: {len(config['logo']['image'])} caracteres")
    
    return {"config": config}
```

## ⚠️ Posibles Problemas y Soluciones

### Problema 1: MongoDB tiene límite de 16MB por documento

**Solución**: Si las imágenes son muy grandes, considera:
- Comprimir las imágenes en el frontend antes de convertirlas a base64
- Usar un servicio de almacenamiento (S3, Cloudinary) y guardar solo URLs
- Dividir la configuración en múltiples documentos

### Problema 2: FastAPI/Pydantic truncando strings largos

**Solución**: Verifica los límites de FastAPI:
- No debería haber límites por defecto, pero verifica la configuración
- Asegúrate de usar `exclude_unset=False` en `dict()` para incluir todos los campos

### Problema 3: Las imágenes se pierden al actualizar

**Solución**: Asegúrate de que el `upsert=True` en MongoDB preserve todos los campos:
```python
home_config_collection.update_one(
    {},
    {"$set": {"config": config_dict}},  # "$set" asegura que se actualicen todos los campos
    upsert=True
)
```

## 🧪 Pruebas Recomendadas

1. **Subir una imagen de banner** y verificar en MongoDB que el campo `config.banner.image` tenga el string base64 completo
2. **Recargar la configuración** y verificar que la imagen se retorne completa
3. **Actualizar la página** y verificar que la imagen persista
4. **Verificar logs** para ver si hay mensajes de error sobre tamaño de documentos

## 📝 Checklist de Verificación

- [ ] El modelo `BannerConfig` acepta `image` como `str`
- [ ] El modelo `LogoConfig` acepta `image` como `str`
- [ ] El modelo `ProductItem` acepta `image` como `str`
- [ ] El endpoint `PUT /home/config` guarda todo el objeto `config` completo
- [ ] El endpoint `GET /home/config` retorna todo el objeto `config` completo
- [ ] MongoDB no está truncando los documentos
- [ ] Los logs muestran que las imágenes se están guardando (tamaño en caracteres)
- [ ] Las imágenes persisten después de actualizar la página

## 🔍 Debugging

Si las imágenes aún no se guardan, agrega estos logs en el backend:

```python
# En PUT /home/config
print(f"Tamaño total del config: {len(str(config_dict))} caracteres")
print(f"Banner image length: {len(config_dict.get('banner', {}).get('image', ''))}")
print(f"Logo image length: {len(config_dict.get('logo', {}).get('image', ''))}")
print(f"Productos con imágenes: {sum(1 for p in config_dict.get('products', {}).get('items', []) if p.get('image'))}")

# En GET /home/config
config_doc = home_config_collection.find_one({})
if config_doc:
    config = config_doc.get("config", {})
    print(f"Banner image en BD: {len(config.get('banner', {}).get('image', ''))}")
    print(f"Logo image en BD: {len(config.get('logo', {}).get('image', ''))}")
```

Estos logs te ayudarán a identificar si el problema está en:
- **Guardado**: Si los logs de PUT muestran imágenes pero GET no, el problema está en MongoDB
- **Recepción**: Si los logs de PUT no muestran imágenes, el problema está en la recepción del request
- **Serialización**: Si los logs muestran imágenes pero se pierden, el problema está en la serialización

