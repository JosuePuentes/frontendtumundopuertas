from fastapi import APIRouter, HTTPException, Body
from typing import List
from bson import ObjectId
from ..config.mongodb import db
from ..models.pagosmodels import MetodoPago

router = APIRouter()
metodos_pago_collection = db["metodos_pago"]

def object_id_to_str(metodo):
    metodo["_id"] = str(metodo["_id"])
    return metodo

@router.post("/", response_model=MetodoPago)
async def create_metodo_pago(metodo_pago: MetodoPago):
    metodo_pago_dict = metodo_pago.dict()
    result = metodos_pago_collection.insert_one(metodo_pago_dict)
    created_metodo = metodos_pago_collection.find_one({"_id": result.inserted_id})
    return object_id_to_str(created_metodo)

@router.get("/", response_model=List[MetodoPago])
async def get_all_metodos_pago():
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
    updated_metodo = metodos_pago_collection.find_one_and_update(
        {"_id": ObjectId(id)},
        {"$set": metodo_pago.dict()},
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
