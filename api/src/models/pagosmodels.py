from pydantic import BaseModel
from typing import Optional

class MetodoPago(BaseModel):
    nombre: str
    banco: str
    numero_cuenta: str
    titular: str
    cedula: Optional[str] = None
    moneda: str
