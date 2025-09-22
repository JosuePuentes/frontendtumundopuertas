from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware


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
async def redirect_to_https_and_trailing_slash(request: Request, call_next):
    # 1. Redirigir a HTTPS si la solicitud llega como HTTP
    if request.url.scheme == "http":
        new_url = request.url.replace(scheme="https")
        return RedirectResponse(url=str(new_url), status_code=307)

    # 2. Añadir barra final si es necesario (y ya estamos en HTTPS)
    if not request.url.path.endswith('/') and request.url.path != '/':
        new_path = request.url.path + '/'
        new_url = request.url.replace(path=new_path) # Ya estamos en HTTPS
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




# Incluir routers segmentados
app.include_router(auth_router, prefix="/auth", tags=["Autenticación"])
app.include_router(cliente_router,prefix="/clientes", tags=["Clientes"])
app.include_router(empleado_router, prefix="/empleados", tags=["Empleados"])
app.include_router(pedido_router, prefix="/pedidos", tags=["Pedidos"])
app.include_router(inventario_router, prefix="/inventario", tags=["Inventario"])
app.include_router(usuarios_router, prefix="/usuarios", tags=["Usuarios"])
app.include_router(files_router, prefix="/files", tags=["Archivos"])