from fastapi import APIRouter, HTTPException, Body, Depends
from bson import ObjectId
from ..config.mongodb import empleados_collection
from ..auth.auth import get_password_hash, get_current_admin_user
from ..models.authmodels import Empleado

router = APIRouter()

@router.get("/all/")
async def get_all_empleados():
    empleados = list(empleados_collection.find())
    for empleado in empleados:
        empleado["_id"] = str(empleado["_id"])
    return empleados

@router.get("/{empleado_id}/")
async def get_empleado(empleado_id: str):
    empleado = empleados_collection.find_one({"_id": empleado_id})
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return empleado

@router.post("/", dependencies=[Depends(get_current_admin_user)])
async def create_empleado(empleado: Empleado):
    existing_user = empleados_collection.find_one({"identificador": empleado.identificador})
    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    result = empleados_collection.insert_one(empleado.dict())
    return {"message": "Empleado creado correctamente", "id": str(result.inserted_id)}

@router.put("/{empleado_id}/", dependencies=[Depends(get_current_admin_user)])
async def update_empleado(empleado_id: str, empleado: Empleado):
    # Validar que ningún valor del empleado sea 0 o "0"
    for key, value in empleado.dict(exclude_unset=True).items():
        if value == 0 or value == "0":
            raise HTTPException(status_code=400, detail=f"error o")

    try:
        object_id = ObjectId(empleado_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de empleado inválido")
    result = empleados_collection.update_one(
        {"_id": object_id},
        {"$set": empleado.dict(exclude_unset=True)}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return {"message": "Empleado actualizado correctamente", "id": empleado_id}
