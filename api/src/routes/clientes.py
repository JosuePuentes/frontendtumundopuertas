from fastapi import APIRouter, HTTPException
from ..config.mongodb import clientes_collection
from ..models.authmodels import Cliente
from bson import ObjectId

router = APIRouter()

@router.get("/all")
async def get_all_clientes():
    clientes = list(clientes_collection.find())
    for cliente in clientes:
        cliente["_id"] = str(cliente["_id"])
    return clientes

@router.get("/id/{cliente_id}/")
async def get_cliente(cliente_id: str):
    cliente = clientes_collection.find_one({"_id": cliente_id})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.post("/")
async def create_cliente(cliente: Cliente):
    existing_client = clientes_collection.find_one({"nombre": cliente.nombre})
    if existing_client:
        raise HTTPException(status_code=400, detail="El cliente ya existe")
    result = clientes_collection.insert_one(cliente.dict())
    return {"message": "Cliente creado correctamente", "id": str(result.inserted_id)}

@router.put("/id/{cliente_id}/")
async def update_cliente(cliente_id: str, cliente: Cliente):
    # Validación: ningún valor puede ser 0 o "0"
    for key, value in cliente.dict(exclude_unset=True).items():
        if value == 0 or value == "0":
            raise HTTPException(status_code=400, detail=f"error o")
    try:
        obj_id = ObjectId(cliente_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de cliente inválido")
    result = clientes_collection.update_one(
        {"_id": obj_id},
        {"$set": cliente.dict(exclude_unset=True)}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"message": "Cliente actualizado correctamente", "id": cliente_id}