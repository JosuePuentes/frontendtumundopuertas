from fastapi import APIRouter, HTTPException, Body
from typing import List
from bson import ObjectId
from ..config.mongodb import db
from ..models.pagosmodels import MetodoPago
from ..models.transaccionmodels import Transaccion
from pydantic import BaseModel

router = APIRouter()
metodos_pago_collection = db["metodos_pago"]
transacciones_collection = db["transacciones"]

def object_id_to_str(data):
    if "_id" in data:
        data["id"] = str(data["_id"])
        del data["_id"]
    return data

class MontoRequest(BaseModel):
    monto: float

@router.post("/", response_model=MetodoPago)
async def create_metodo_pago(metodo_pago: MetodoPago):
    try:
        metodo_pago_dict = metodo_pago.dict(by_alias=True)
        if "id" in metodo_pago_dict:
            del metodo_pago_dict["id"]
        
        # Verificar si ya existe un método con el mismo nombre
        existing = metodos_pago_collection.find_one({"nombre": metodo_pago.nombre})
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un método de pago con este nombre")
        
        result = metodos_pago_collection.insert_one(metodo_pago_dict)
        created_metodo = metodos_pago_collection.find_one({"_id": result.inserted_id})
        
        if not created_metodo:
            raise HTTPException(status_code=500, detail="Error al crear el método de pago")
            
        return object_id_to_str(created_metodo)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.post("", response_model=MetodoPago, include_in_schema=False)
async def create_metodo_pago_no_slash(metodo_pago: MetodoPago):
    """Endpoint alternativo sin barra final para compatibilidad"""
    return await create_metodo_pago(metodo_pago)

@router.get("/", response_model=List[MetodoPago])
async def get_all_metodos_pago():
    metodos = list(metodos_pago_collection.find())
    return [object_id_to_str(metodo) for metodo in metodos]

@router.get("", response_model=List[MetodoPago], include_in_schema=False)
async def get_all_metodos_pago_no_slash():
    metodos = list(metodos_pago_collection.find())
    return [object_id_to_str(metodo) for metodo in metodos]

@router.get("/{id}", response_model=MetodoPago)
async def get_metodo_pago(id: str):
    metodo = metodos_pago_collection.find_one({"_id": ObjectId(id)})
    if metodo:
        return object_id_to_str(metodo)
    raise HTTPException(status_code=404, detail="Método de pago no encontrado")

@router.put("/{id}", response_model=MetodoPago)
async def update_metodo_pago(id: str, metodo_pago: MetodoPago):
    metodo_pago_dict = metodo_pago.dict(by_alias=True, exclude_unset=True)
    if "id" in metodo_pago_dict:
        del metodo_pago_dict["id"]

    updated_metodo = metodos_pago_collection.find_one_and_update(
        {"_id": ObjectId(id)},
        {"$set": metodo_pago_dict},
        return_document=True
    )
    if updated_metodo:
        return object_id_to_str(updated_metodo)
    raise HTTPException(status_code=404, detail="Método de pago no encontrado")

@router.delete("/{id}", response_model=dict)
async def delete_metodo_pago(id: str):
    result = metodos_pago_collection.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 1:
        return {"message": "Método de pago eliminado correctamente"}
    raise HTTPException(status_code=404, detail="Método de pago no encontrado")

@router.post("/{id}/cargar", response_model=MetodoPago)
async def cargar_dinero(id: str, request: MontoRequest):
    # Incrementar el saldo
    updated_metodo = metodos_pago_collection.find_one_and_update(
        {"_id": ObjectId(id)},
        {"$inc": {"saldo": request.monto}},
        return_document=True
    )
    if not updated_metodo:
        raise HTTPException(status_code=404, detail="Método de pago no encontrado")

    # Registrar la transaccion
    transaccion = Transaccion(
        metodo_pago_id=id,
        tipo="carga",
        monto=request.monto
    )
    transaccion_dict = transaccion.dict(by_alias=True)
    if "id" in transaccion_dict:
        del transaccion_dict["id"]
    transacciones_collection.insert_one(transaccion_dict)

    return object_id_to_str(updated_metodo)

@router.post("/{id}/transferir", response_model=MetodoPago)
async def transferir_dinero(id: str, request: MontoRequest):
    # Verificar saldo suficiente
    metodo = metodos_pago_collection.find_one({"_id": ObjectId(id)})
    if not metodo:
        raise HTTPException(status_code=404, detail="Método de pago no encontrado")
    if metodo.get("saldo", 0) < request.monto:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")

    # Disminuir el saldo
    updated_metodo = metodos_pago_collection.find_one_and_update(
        {"_id": ObjectId(id)},
        {"$inc": {"saldo": -request.monto}},
        return_document=True
    )

    # Registrar la transaccion
    transaccion = Transaccion(
        metodo_pago_id=id,
        tipo="transferencia",
        monto=request.monto
    )
    transaccion_dict = transaccion.dict(by_alias=True)
    if "id" in transaccion_dict:
        del transaccion_dict["id"]
    transacciones_collection.insert_one(transaccion_dict)

    return object_id_to_str(updated_metodo)

@router.get("/{id}/transacciones", response_model=List[Transaccion])
async def get_transacciones(id: str):
    transacciones = list(transacciones_collection.find({"metodo_pago_id": id}))
    return [object_id_to_str(t) for t in transacciones]