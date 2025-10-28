@echo off
echo Inicializando repositorio git en Front-tumundopuertas-main...
cd Front-tumundopuertas-main

echo Verificando si ya existe repositorio git...
if exist .git (
    echo Repositorio git ya existe
    git status
) else (
    echo Inicializando nuevo repositorio git...
    git init
    git add .
    git commit -m "Initial commit: Frontend completo con todas las funcionalidades implementadas"
    git branch -M main
    git remote add origin https://github.com/JosuePuentes/frontendtumundopuertas.git
    git push -u origin main
)

echo Proceso completado
pause





