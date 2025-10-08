from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId
from datetime import datetime

class Transaccion(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    metodo_pago_id: str
    tipo: str  # "carga" o "transferencia"
    monto: float
    fecha: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
