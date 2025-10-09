from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from .routes.auth import router as auth_router
from .routes.clientes import router as cliente_router
from .routes.empleados import router as empleado_router
from .routes.pedidos import router as pedido_router
from .routes.inventario import router as inventario_router
from .routes.users import router as usuarios_router
from .routes.files import router as files_router
from .routes.metodos_pago import router as metodos_pago_router

from dotenv import load_dotenv
from passlib.context import CryptContext
import os

# Cargar variables de entorno
dotenv_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(dotenv_path)

# Configuración de cifrado de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Inicializar FastAPI
app = FastAPI(
    title="Crafteo API",
    description="API para el sistema de gestión de Crafteo",
    version="1.0.0"
)

# Middleware para confiar en los encabezados de proxy
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://crafteo-three.vercel.app",
        "https://crafteo-three-git-main-josuepuentes.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"  # Fallback para desarrollo
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
)

# Endpoint de prueba para verificar CORS
@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "message": "API funcionando correctamente",
        "cors": "configurado"
    }

# Incluir routers segmentados
app.include_router(auth_router, prefix="/auth", tags=["Autenticación"])
app.include_router(cliente_router,prefix="/clientes", tags=["Clientes"])
app.include_router(empleado_router, prefix="/empleados", tags=["Empleados"])
app.include_router(pedido_router, prefix="/pedidos", tags=["Pedidos"])
app.include_router(inventario_router, prefix="/inventario", tags=["Inventario"])
app.include_router(usuarios_router, prefix="/usuarios", tags=["Usuarios"])
app.include_router(files_router, prefix="/files", tags=["Archivos"])
app.include_router(metodos_pago_router, prefix="/metodos-pago", tags=["Metodos de Pago"])