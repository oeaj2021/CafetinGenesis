$wifiIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "*Wi-Fi*" -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
if (-not $wifiIp) { $wifiIp = "172.19.203.45" }

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "         ☕ CAFETIN GENESIS - INICIANDO EN RED" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"
$dbPath = Join-Path $backendPath "prisma\dev.db"

if (-not (Test-Path $dbPath)) {
    Write-Host "[*] Inicializando Base de Datos SQLite y Seed..." -ForegroundColor Yellow
    Set-Location $backendPath
    npx prisma db push --skip-generate
    npm run prisma:seed
    Set-Location $PSScriptRoot
}

Write-Host "[1/2] Iniciando Backend en 0.0.0.0:4000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"

Write-Host "[2/2] Iniciando Frontend en 0.0.0.0:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " ✅ Sistema iniciado con éxito!" -ForegroundColor Green
Write-Host " 💻 Acceso Local (esta PC):" -ForegroundColor Yellow
Write-Host "    http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host " 📱 Acceso desde Celulares / Tablets en tu Wi-Fi:" -ForegroundColor Yellow
Write-Host "    http://${wifiIp}:5173" -ForegroundColor Green
Write-Host "    http://${wifiIp}:5173/admin/login" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
