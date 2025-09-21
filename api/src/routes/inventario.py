from fastapi import APIRouter, HTTPException
from ..config.mongodb import items_collection
from ..models.authmodels import Item
from bson import ObjectId
from typing import List

router = APIRouter()

@router.get("/all")
async def get_all_items():
    items = list(items_collection.find())
    for item in items:
        item["_id"] = str(item["_id"])
    return items

@router.get("/id/{item_id}/")
async def get_item(item_id: str):
    try:
        item_obj_id = ObjectId(item_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"item_id no es un ObjectId válido: {str(e)}")

    item = items_collection.find_one({"_id": item_obj_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    item["_id"] = str(item["_id"])
    return item

@router.post("/")
async def create_item(item: Item):
    existing_item = items_collection.find_one({"nombre": item.nombre})
    if existing_item:
        raise HTTPException(status_code=400, detail="El item ya existe")
    result = items_collection.insert_one(item.dict(by_alias=True))
    return {"message": "Item creado correctamente", "id": str(result.inserted_id)}

@router.put("/id/{item_id}/")
async def update_item(item_id: str, item: Item):
    # Validar que ningún valor del item sea 0 o "0"
    try:
        item_obj_id = ObjectId(item_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"item_id no es un ObjectId válido: {str(e)}")

    result = items_collection.update_one(
        {"_id": item_obj_id},
        {"$set": item.dict(exclude_unset=True, by_alias=True)}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return {"message": "Item actualizado correctamente", "id": item_id}

@router.post("/bulk")
async def bulk_create_items(items: List[Item]):
    inserted_count = 0
    skipped_items = []
    errors = []

    for item_data in items:
        # Check if item with same codigo or nombre already exists
        existing_item = items_collection.find_one({"$or": [
            {"codigo": item_data.codigo},
            {"nombre": item_data.nombre}
        ]})

        if existing_item:
            skipped_items.append({"item": item_data.dict(by_alias=True), "reason": "Item con código o nombre ya existente"})
            continue
        
        # Ensure _id is not set for new items, let MongoDB generate it
        item_dict = item_data.dict(by_alias=True)
        if "_id" in item_dict:
            del item_dict["_id"]

        try:
            items_collection.insert_one(item_dict)
            inserted_count += 1
        except Exception as e:
            errors.append({"item": item_data.dict(by_alias=True), "error": str(e)})

    return {
        "message": f"Procesamiento de carga masiva completado. {inserted_count} items insertados, {len(skipped_items)} saltados.",
        "inserted_count": inserted_count,
        "skipped_items": skipped_items,
        "errors": errors
    }