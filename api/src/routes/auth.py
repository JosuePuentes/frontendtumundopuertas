from fastapi import APIRouter, HTTPException, status
from ..config.mongodb import usuarios_collection
from ..auth.auth import get_password_hash, verify_password, create_admin_access_token
from ..models.authmodels import UserAdmin, AdminLogin, ForgotPasswordRequest, ResetPasswordRequest
from datetime import datetime, timedelta
import secrets

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
    
    # Prevent 'adminjosue' from being used as a master password
    if admin.password == "adminjosue":
        raise HTTPException(status_code=403, detail="Contraseña maestra no permitida")
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

@router.post("/create-temp-admin/")
async def create_temp_admin():
    temp_username = "adminjosue"
    temp_password = "password123"
    temp_identificador = "adminjosue_id"

    if usuarios_collection.find_one({"usuario": temp_username}):
        raise HTTPException(status_code=400, detail="Temporary admin user already exists")

    hashed_password = get_password_hash(temp_password)
    new_admin = {
        "usuario": temp_username,
        "password": hashed_password,
        "identificador": temp_identificador,
        "permisos": ["admin"],
        "rol": "admin",
        "modulos": []
    }
    result = usuarios_collection.insert_one(new_admin)
    if result.inserted_id:
        return {"message": "Temporary admin user created successfully"}
    raise HTTPException(status_code=500, detail="Error creating temporary admin user")

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    user = usuarios_collection.find_one({"usuario": request.usuario})
    if not user:
        # No revelar si el usuario existe o no por seguridad
        raise HTTPException(status_code=200, detail="Si el usuario existe, se ha enviado un enlace de restablecimiento de contraseña.")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1) # Token válido por 1 hora

    usuarios_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_token": token, "reset_token_expires": expires_at}}
    )

    # En un entorno real, aquí se enviaría un correo electrónico al usuario con el token.
    # Por ahora, solo devolvemos el token para propósitos de prueba/desarrollo.
    print(f"DEBUG: Token de restablecimiento para {request.usuario}: {token}")
    return {"message": "Si el usuario existe, se ha enviado un enlace de restablecimiento de contraseña.", "reset_token": token} # DEBUG: remove reset_token in production

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    user = usuarios_collection.find_one({"reset_token": request.token})

    if not user or user.get("reset_token_expires") < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token inválido o expirado.")

    hashed_password = get_password_hash(request.new_password)

    usuarios_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed_password}, "$unset": {"reset_token": "", "reset_token_expires": ""}}
    )

    return {"message": "Contraseña restablecida exitosamente."}