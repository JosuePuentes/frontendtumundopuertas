from fastapi import APIRouter, HTTPException, Body, Depends
from bson import ObjectId
from ..config.mongodb import usuarios_collection
from ..auth.auth import get_password_hash, get_current_admin_user
from ..models.authmodels import UserAdmin

router = APIRouter()

@router.put("/{id}", dependencies=[Depends(get_current_admin_user)])
async def update_user(id: str, update: UserAdmin):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="ID inválido")
    existing_user = usuarios_collection.find_one({"_id": ObjectId(id)})
    if not existing_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    update_data = update.dict(exclude_unset=True)
    print(f"Updating user {id} with data: {update_data}")
    for key, value in update_data.items():
        if value == 0 or value == "0":
            raise HTTPException(status_code=400, detail=f"error o")
    if "password" in update_data and update_data["password"]:
        update_data["password"] = get_password_hash(update_data["password"])
    result = usuarios_collection.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    if result.modified_count:
        updated_user = usuarios_collection.find_one({"_id": ObjectId(id)})
        updated_user["_id"] = str(updated_user["_id"])
        return updated_user
    return {"message": "No se realizaron cambios"}

@router.get("/all", dependencies=[Depends(get_current_admin_user)])
async def get_all_users():
    users = list(usuarios_collection.find())
    for user in users:
        user["_id"] = str(user["_id"])
    return users