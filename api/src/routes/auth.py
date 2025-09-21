from fastapi import APIRouter, HTTPException
from ..config.mongodb import usuarios_collection
from ..auth.auth import get_password_hash, verify_password, create_admin_access_token
from ..models.authmodels import UserAdmin, AdminLogin

router = APIRouter()

@router.post("/register/")
async def register_admin(user: UserAdmin):
    if usuarios_collection.find_one({"usuario": user.usuario}):
        raise HTTPException(status_code=400, detail="Usuario ya registrado")
    if usuarios_collection.find_one({"identificador": user.identificador}):
        raise HTTPException(status_code=400, detail="Identificador ya registrado")
    hashed_password = get_password_hash(user.password)
    new_admin = user.dict()
    new_admin["password"] = hashed_password
    result = usuarios_collection.insert_one(new_admin)
    if result.inserted_id:
        return {"message": "Usuario administrativo registrado exitosamente"}
    raise HTTPException(status_code=500, detail="Error al registrar el usuario administrativo")

@router.post("/login/")
async def admin_login(admin: AdminLogin):
    db_admin = usuarios_collection.find_one({"usuario": admin.usuario})
    if not db_admin:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    if not verify_password(admin.password, db_admin["password"]):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
    access_token = create_admin_access_token(db_admin)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "permisos": db_admin["permisos"],
        "usuario": db_admin["usuario"],
        "identificador": db_admin["identificador"]
    }

