@echo off
title Cafetin Genesis - Sistema en Red LAN
color 0E

echo ========================================================
echo          ☕ CAFETIN GENESIS - INICIANDO EN RED
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js no esta instalado o no esta en el PATH.
    pause
    exit /b 1
)

echo [1/3] Verificando base de datos SQLite y seed...
if not exist "%~dp0backend\prisma\dev.db" (
    cd /d "%~dp0backend"
    call npx prisma db push --skip-generate
    call npm run prisma:seed
    cd /d "%~dp0"
)

echo [2/3] Iniciando Backend en 0.0.0.0:4000...
start "Cafetin Genesis - Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [3/3] Iniciando Frontend en 0.0.0.0:5173...
start "Cafetin Genesis - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo  ✅ Sistema corriendo en tu Maquina y en tu Red Wi-Fi!
echo  ------------------------------------------------------
echo  💻 Acceso Local (esta PC):
echo     Tienda:      http://localhost:5173
echo     Admin:       http://localhost:5173/admin/login
echo.
echo  📱 Acceso desde Celulares/Tablets en la misma Wi-Fi:
echo     Tienda:      http://172.19.203.45:5173
echo     Admin:       http://172.19.203.45:5173/admin/login
echo.
echo  🔑 Credenciales:
echo     admin@genesis.com  /  admin123
echo ========================================================
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

exit
