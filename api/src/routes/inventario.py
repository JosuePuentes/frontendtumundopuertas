from fastapi import APIRouter, HTTPException
from ..config.mongodb import items_collection
from ..models.authmodels import Item
from bson import ObjectId

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
    result = items_collection.insert_one(item.dict())
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
        {"$set": item.dict(exclude_unset=True)}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return {"message": "Item actualizado correctamente", "id": item_id}