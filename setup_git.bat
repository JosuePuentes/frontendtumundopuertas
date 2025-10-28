@echo off
cd Front-tumundopuertas-main
git init
git add .
git commit -m "Initial commit with all frontend changes"
git branch -M main
git remote add origin https://github.com/JosuePuentes/frontendtumundopuertas.git
git push -u origin main
pause





