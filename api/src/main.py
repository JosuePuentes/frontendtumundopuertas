from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from .routes.auth import router as auth_router
from .routes.clientes import router as cliente_router
from .routes.empleados import router as empleado_router
from .routes.pedidos import router as pedido_router
from .routes.inventario import router as inventario_router
from .routes.users import router as usuarios_router
from .routes.files import router as files_router

from dotenv import load_dotenv
from passlib.context import CryptContext
import os

# Cargar variables de entorno
dotenv_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(dotenv_path)

# Configuración de cifrado de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Inicializar FastAPI
app = FastAPI()

@app.middleware("http")
async def custom_trailing_slash_redirect(request: Request, call_next):
    if not request.url.path.endswith('/') and request.url.path != '/':
        new_path = request.url.path + '/'
        # Asegurarse de que el esquema sea HTTPS
        new_url = request.url.replace(path=new_path, scheme="https")
        return RedirectResponse(url=str(new_url), status_code=307)
    
    response = await call_next(request)
    return response

# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if response.status_code in [307, 308]:
            location = response.headers.get("location")
            if location and location.startswith("http://"):
                https_location = location.replace("http://", "https://", 1)
                response.headers["location"] = https_location
        return response

app.add_middleware(HTTPSRedirectMiddleware)


# Incluir routers segmentados
app.include_router(auth_router, prefix="/auth", tags=["Autenticación"])
app.include_router(cliente_router,prefix="/clientes", tags=["Clientes"])
app.include_router(empleado_router, prefix="/empleados", tags=["Empleados"])
app.include_router(pedido_router, prefix="/pedidos", tags=["Pedidos"])
app.include_router(inventario_router, prefix="/inventario", tags=["Inventario"])
app.include_router(usuarios_router, prefix="/usuarios", tags=["Usuarios"])
app.include_router(files_router, prefix="/files", tags=["Archivos"])