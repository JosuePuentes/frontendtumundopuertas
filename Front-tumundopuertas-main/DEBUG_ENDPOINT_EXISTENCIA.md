# Debug: Error 400 en endpoint /inventario/{item_id}/existencia

## Problema Reportado
El endpoint está retornando error 400 cuando se intenta descargar/cargar existencias.

## Request que está enviando el frontend:

```json
{
  "cantidad": 10,
  "tipo": "descargar",  // o "cargar"
  "sucursal": "sucursal1"  // o "sucursal2"
}
```

## Posibles causas del error 400:

1. **Formato del body**: El backend podría estar esperando los parámetros en un formato diferente:
   - Como parámetros de query string en lugar del body
   - Con nombres diferentes (ej: `monto` en vez de `cantidad`, `accion` en vez de `tipo`)
   - En un formato anidado o embebido

2. **Validación de tipos**: 
   - El backend podría estar esperando `cantidad` como entero pero estamos enviando float
   - O esperando valores específicos para `tipo` o `sucursal`

3. **Modelo de datos**: El backend podría estar esperando un modelo Pydantic específico

## Para el Backend - Verificar:

1. ¿Qué formato de request body espera exactamente el endpoint?
2. ¿Usa un modelo Pydantic para validar el request?
3. ¿Hay alguna validación específica que esté fallando?
4. ¿El endpoint acepta `cantidad` como float o solo como int?
5. ¿Los valores de `tipo` deben ser exactamente "cargar"/"descargar" o hay variaciones?
6. ¿Los valores de `sucursal` deben ser "sucursal1"/"sucursal2" o hay otro formato?

## Próximos pasos:

Una vez que conozcamos el formato exacto que espera el backend, ajustaré el frontend para enviar los datos correctamente.










