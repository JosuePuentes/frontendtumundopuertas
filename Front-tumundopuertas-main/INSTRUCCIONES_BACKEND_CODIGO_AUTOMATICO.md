# INSTRUCCIONES PARA GENERACIÓN AUTOMÁTICA DE CÓDIGOS EN BACKEND

## 📋 RESUMEN
Implementar generación automática de códigos secuenciales cuando el campo `codigo` esté vacío al crear un item.
Formato: `ITEM-0001`, `ITEM-0002`, `ITEM-0003`, etc.

---

## 🔧 CAMBIOS A REALIZAR

### 1. MODIFICAR: `api/src/config/mongodb.py`

**Agregar esta línea después de `items_collection`:**

```python
secuencias_collection = db["SECUENCIAS"]  # Para guardar secuencias de códigos
```

**Archivo completo debería verse así:**
```python
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from .config import MONGO_URI
# Cargar variables de entorno
dotenv_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(dotenv_path)

# Configuración de conexión a MongoDB
client = MongoClient(MONGO_URI, tls=True, tlsAllowInvalidCertificates=True)
db = client["PROCESOS"]

usuarios_collection = db["USUARIOS"]
clientes_collection = db["CLIENTES"]
empleados_collection = db["EMPLEADOS"]
pedidos_collection = db["PEDIDOS"]
items_collection = db["INVENTARIO"]
secuencias_collection = db["SECUENCIAS"]  # Para guardar secuencias de códigos
```

---

### 2. MODIFICAR: `api/src/routes/inventario.py`

#### A) Agregar import de `secuencias_collection`:

**En la línea 2, cambiar:**
```python
from ..config.mongodb import items_collection, pedidos_collection
```

**Por:**
```python
from ..config.mongodb import items_collection, pedidos_collection, secuencias_collection
```

---

#### B) Agregar la función de generación de códigos (DESPUÉS de `router = APIRouter()`):

**Agregar este código después de la línea 9 (`router = APIRouter()`):**

```python
def generar_codigo_secuencial():
    """
    Genera un código secuencial automático para items.
    Formato: ITEM-0001, ITEM-0002, etc.
    """
    secuencia_name = "item_codigo"
    
    # Buscar el documento de secuencia
    secuencia = secuencias_collection.find_one({"nombre": secuencia_name})
    
    if not secuencia:
        # Si no existe, crear con valor inicial 1
        secuencias_collection.insert_one({"nombre": secuencia_name, "valor": 1})
        numero = 1
    else:
        # Incrementar el valor y actualizar
        numero = secuencia.get("valor", 0) + 1
        secuencias_collection.update_one(
            {"nombre": secuencia_name},
            {"$set": {"valor": numero}}
        )
    
    # Formatear el código con 4 dígitos (0001, 0002, etc.)
    codigo = f"ITEM-{numero:04d}"
    
    # Verificar que el código no exista (por si acaso hay duplicados)
    while items_collection.find_one({"codigo": codigo}):
        # Si existe, incrementar y generar otro
        numero += 1
        secuencias_collection.update_one(
            {"nombre": secuencia_name},
            {"$set": {"valor": numero}}
        )
        codigo = f"ITEM-{numero:04d}"
    
    return codigo
```

---

#### C) REEMPLAZAR el endpoint `@router.post("/")`:

**Buscar este código:**
```python
@router.post("/")
async def create_item(item: Item):
    existing_item = items_collection.find_one({"codigo": item.codigo})
    if existing_item:
        raise HTTPException(status_code=400, detail="El item con este código ya existe")
    result = items_collection.insert_one(item.dict(by_alias=True, exclude_unset=True))
    return {"message": "Item creado correctamente", "id": str(result.inserted_id)}
```

**REEMPLAZAR por este código:**
```python
@router.post("/")
async def create_item(item: Item):
    try:
        # Si el código está vacío o solo tiene espacios, generar uno automáticamente
        codigo_a_usar = item.codigo.strip() if item.codigo and item.codigo.strip() else None
        
        if not codigo_a_usar:
            # Generar código automático
            codigo_a_usar = generar_codigo_secuencial()
            print(f"🔢 Código generado automáticamente: {codigo_a_usar}")
        else:
            # Verificar que el código proporcionado no exista
            existing_item = items_collection.find_one({"codigo": codigo_a_usar})
            if existing_item:
                raise HTTPException(status_code=400, detail=f"El item con el código '{codigo_a_usar}' ya existe")
        
        # Crear el diccionario del item con el código (generado o proporcionado)
        item_dict = item.dict(by_alias=True, exclude_unset=True)
        item_dict["codigo"] = codigo_a_usar
        
        result = items_collection.insert_one(item_dict)
        return {
            "message": "Item creado correctamente",
            "id": str(result.inserted_id),
            "codigo": codigo_a_usar  # Devolver el código usado (generado o proporcionado)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear el item: {str(e)}")
```

---

### 3. MODIFICAR: `api/src/models/authmodels.py`

**Buscar la clase `Item` (alrededor de la línea 194):**

**Cambiar esta línea:**
```python
codigo: str
```

**Por:**
```python
codigo: Optional[str] = ""  # Opcional: si está vacío, se generará automáticamente
```

**El modelo completo debería verse así:**
```python
class Item(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    codigo: Optional[str] = ""  # Opcional: si está vacío, se generará automáticamente
    nombre: str
    descripcion: str
    departamento: Optional[str] = None
    marca: Optional[str] = None
    categoria: str
    modelo: Optional[str] = None
    precio: float
    costo: float
    costoProduccion: float = 0.0
    cantidad: int
    existencia: int = 0
    activo: bool = True
    imagenes: Optional[List[str]] = []
```

---

## ✅ VERIFICACIÓN

1. **Reiniciar el servidor backend** después de hacer los cambios
2. **Probar crear un item SIN código** → Debería generar `ITEM-0001`
3. **Probar crear otro item SIN código** → Debería generar `ITEM-0002`
4. **Probar crear un item CON código personalizado** → Debería usar ese código
5. **Verificar en MongoDB** que existe la colección `SECUENCIAS` con un documento:
   ```json
   {
     "nombre": "item_codigo",
     "valor": 2  // (o el número que corresponda)
   }
   ```

---

## 📝 NOTAS IMPORTANTES

- La colección `SECUENCIAS` se crea automáticamente cuando se genera el primer código
- El formato siempre será `ITEM-0001`, `ITEM-0002`, etc. (4 dígitos)
- Si se proporciona un código manual, se valida que no exista antes de crear
- La secuencia se guarda permanentemente en MongoDB, así que siempre será incremental

---

## 🐛 SI HAY ERRORES

- **Error de importación**: Verificar que `secuencias_collection` esté importado correctamente
- **Error de colección**: La colección se crea automáticamente, no necesita crearse manualmente
- **Código duplicado**: El sistema verifica automáticamente y salta al siguiente número si hay duplicado

---

## 📞 RESULTADO ESPERADO

Cuando el frontend envíe un item **sin código** o con **código vacío**, el backend:
1. Detectará que el código está vacío
2. Generará automáticamente `ITEM-0001` (o el siguiente número)
3. Guardará el item con ese código
4. Devolverá el código generado en la respuesta
5. El frontend mostrará: "Item creado correctamente ✅\nCódigo asignado: ITEM-0001"

