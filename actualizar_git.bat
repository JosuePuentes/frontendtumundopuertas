@echo off
echo Actualizando repositorio existente...
cd Front-tumundopuertas-main

echo Agregando cambios...
git add .

echo Haciendo commit...
git commit -m "Update: Todas las funcionalidades implementadas y optimizadas"

echo Subiendo cambios...
git push origin main

echo Proceso completado
pause


