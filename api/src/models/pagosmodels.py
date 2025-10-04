from pydantic import BaseModel
from typing import Optional

class MetodoPago(BaseModel):
    nombre: str
    banco: Optional[str] = None
    numero_cuenta: Optional[str] = None
    titular: Optional[str] = None
    cedula: Optional[str] = None
    tipo: str # e.g., "Transferencia", "Zelle", "Efectivo"
