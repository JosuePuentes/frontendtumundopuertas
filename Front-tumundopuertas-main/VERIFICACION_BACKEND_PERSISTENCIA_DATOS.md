# Verificación Backend - Persistencia de Datos de Clientes

## Problema Reportado
Cuando el cliente cierra sesión y vuelve a iniciar sesión, sus datos (carrito, borradores, preferencias) se borran.

## Verificaciones Necesarias en el Backend

### 1. ✅ Verificar que el Carrito se Guarda Correctamente

**Endpoint:** `PUT /clientes/{cliente_id}/carrito`

**Verificaciones:**
- [ ] El endpoint acepta y guarda el array de `items` recibido
- [ ] El documento del carrito se crea o actualiza en la colección `carritos_clientes`
- [ ] El `cliente_id` se usa correctamente como clave única
- [ ] Los items se guardan con toda su información (itemId, item completo, cantidad)
- [ ] El campo `fecha_actualizacion` se actualiza cada vez que se guarda

**Colección MongoDB:** `carritos_clientes`

**Estructura esperada:**
```javascript
{
  _id: ObjectId,
  cliente_id: String, // debe ser único por cliente
  items: [
    {
      itemId: String,
      item: {
        _id: String,
        codigo: String,
        nombre: String,
        descripcion: String,
        precio: Number,
        imagenes: [String]
      },
      cantidad: Number
    }
  ],
  fecha_creacion: Date,
  fecha_actualizacion: Date
}
```

**Índice necesario:**
```javascript
db.carritos_clientes.createIndex({ "cliente_id": 1 }, { unique: true });
```

---

### 2. ✅ Verificar que el Carrito se Carga al Iniciar Sesión

**Endpoint:** `GET /clientes/{cliente_id}/carrito`

**Verificaciones:**
- [ ] El endpoint busca el carrito por `cliente_id`
- [ ] Si existe, devuelve todos los items guardados
- [ ] Si NO existe, devuelve un objeto con `items: []` (array vacío) o 404 (el frontend maneja ambos)
- [ ] Los items incluyen toda la información del producto (item completo)
- [ ] El endpoint requiere autenticación con `cliente_access_token`

**Respuesta esperada (200):**
```json
{
  "cliente_id": "string",
  "items": [...],
  "fecha_actualizacion": "string"
}
```

**Respuesta si no existe (404 o 200 con items vacío):**
```json
{
  "message": "Carrito no encontrado"
}
```
O simplemente:
```json
{
  "cliente_id": "string",
  "items": [],
  "fecha_actualizacion": null
}
```

---

### 3. ✅ Verificar que los Datos NO se Eliminan al Cerrar Sesión

**IMPORTANTE:** El backend NO debe tener ningún endpoint que elimine el carrito o datos del cliente cuando se cierra sesión.

**Verificaciones:**
- [ ] NO existe endpoint `DELETE /clientes/{cliente_id}/carrito` (o si existe, NO se llama al cerrar sesión)
- [ ] NO existe lógica que elimine datos del cliente al hacer logout
- [ ] Los datos del carrito permanecen en la BD después del cierre de sesión
- [ ] Solo se eliminan tokens/credenciales del frontend (localStorage)

---

### 4. ✅ Verificar Preferencias del Usuario

**Endpoint:** `PUT /clientes/{cliente_id}/preferencias`

**Verificaciones:**
- [ ] El endpoint guarda `vista_activa` correctamente
- [ ] Los datos se persisten en la colección `preferencias_clientes`
- [ ] El `cliente_id` se usa como clave única

**Endpoint:** `GET /clientes/{cliente_id}/preferencias`

**Verificaciones:**
- [ ] Carga las preferencias guardadas al iniciar sesión
- [ ] Si no existen, devuelve valores por defecto o null

**Colección MongoDB:** `preferencias_clientes`

---

### 5. ✅ Verificar Borradores de Formularios

**Endpoints:**
- `PUT /clientes/{cliente_id}/borradores/{tipo}` (reclamo o soporte)
- `GET /clientes/{cliente_id}/borradores`

**Verificaciones:**
- [ ] Los borradores se guardan correctamente
- [ ] Se cargan al iniciar sesión
- [ ] NO se eliminan al cerrar sesión

**Colección MongoDB:** `borradores_clientes`

---

## 6. Flujo Esperado

### Al Iniciar Sesión:
1. Cliente inicia sesión → recibe `cliente_id` y `cliente_access_token`
2. Frontend llama a `GET /clientes/{cliente_id}/carrito`
3. Backend devuelve el carrito guardado (o array vacío si no existe)
4. Frontend carga el carrito en la interfaz
5. Frontend llama a `GET /clientes/{cliente_id}/preferencias`
6. Backend devuelve las preferencias guardadas
7. Frontend aplica las preferencias (vista activa, etc.)

### Al Agregar al Carrito:
1. Usuario agrega producto al carrito
2. Frontend actualiza el estado local
3. Frontend guarda en localStorage inmediatamente
4. Frontend llama a `PUT /clientes/{cliente_id}/carrito` (con debounce de 2 segundos)
5. Backend guarda en BD

### Al Cerrar Sesión:
1. Frontend llama a `PUT /clientes/{cliente_id}/carrito` (último guardado)
2. Backend guarda el carrito actualizado
3. Frontend elimina SOLO las credenciales del localStorage:
   - `cliente_access_token`
   - `cliente_usuario`
   - `cliente_id`
   - `cliente_nombre`
4. **NO se elimina** `cliente_carrito_{cliente_id}` del localStorage (se mantiene como backup)
5. Frontend redirige a `/usuarios`

### Al Volver a Iniciar Sesión:
1. Cliente inicia sesión con el mismo usuario
2. Recibe el mismo `cliente_id`
3. Frontend llama a `GET /clientes/{cliente_id}/carrito`
4. Backend devuelve el carrito que quedó guardado
5. **Los datos se recuperan correctamente**

---

## 7. Problemas Comunes y Soluciones

### Problema 1: El carrito se borra al cerrar sesión
**Causa:** El backend está eliminando el carrito al hacer logout
**Solución:** Asegurar que NO existe lógica de eliminación en el endpoint de logout

### Problema 2: El carrito no se carga al iniciar sesión
**Causa:** 
- El endpoint GET no existe o no funciona
- El `cliente_id` no coincide
- El token no está siendo validado correctamente

**Solución:**
- Verificar que el endpoint `GET /clientes/{cliente_id}/carrito` existe
- Verificar que busca por `cliente_id` correctamente
- Verificar que requiere autenticación

### Problema 3: El carrito no se guarda
**Causa:**
- El endpoint PUT no existe o no funciona
- Los datos no se están guardando en BD
- Error en la estructura de datos

**Solución:**
- Verificar que el endpoint `PUT /clientes/{cliente_id}/carrito` existe
- Verificar logs del backend al recibir la petición
- Verificar que los datos se insertan/actualizan en MongoDB

### Problema 4: El cliente_id cambia en cada login
**Causa:** El backend está generando un nuevo `_id` o `cliente_id` en cada login
**Solución:** Asegurar que el `cliente_id` es siempre el mismo para el mismo usuario (usar el `_id` del documento del cliente)

---

## 8. Tests Recomendados

1. **Test de Persistencia:**
   - Crear carrito con 3 items
   - Cerrar sesión
   - Iniciar sesión con el mismo usuario
   - Verificar que el carrito tiene los 3 items

2. **Test de Actualización:**
   - Cargar carrito existente
   - Agregar 1 item nuevo
   - Esperar 2 segundos (auto-guardado)
   - Verificar en BD que el carrito tiene 4 items

3. **Test de Preferencias:**
   - Cambiar a módulo "Perfil"
   - Cerrar sesión
   - Iniciar sesión
   - Verificar que se abre directamente en "Perfil"

---

## 9. Logs Recomendados

Agregar logs en el backend para debugging:

```python
# Al recibir PUT /clientes/{cliente_id}/carrito
logger.info(f"Guardando carrito para cliente {cliente_id}: {len(items)} items")

# Al recibir GET /clientes/{cliente_id}/carrito
logger.info(f"Cargando carrito para cliente {cliente_id}")

# Al crear/actualizar documento
logger.info(f"Carrito {'creado' si nuevo else 'actualizado'} en BD para cliente {cliente_id}")
```

---

## 10. Checklist Final

- [ ] Endpoint `GET /clientes/{cliente_id}/carrito` existe y funciona
- [ ] Endpoint `PUT /clientes/{cliente_id}/carrito` existe y funciona
- [ ] Colección `carritos_clientes` existe en MongoDB
- [ ] Índice único en `cliente_id` está creado
- [ ] Los datos se guardan correctamente en BD
- [ ] Los datos se cargan correctamente al iniciar sesión
- [ ] Los datos NO se eliminan al cerrar sesión
- [ ] El `cliente_id` es consistente (mismo usuario = mismo ID)
- [ ] La autenticación funciona correctamente
- [ ] Los logs muestran las operaciones correctamente

