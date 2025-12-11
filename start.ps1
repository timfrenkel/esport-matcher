Write-Host "Starte Esport Matcher..."

# --- 1) Docker starten ---
Write-Host "Starte Postgres über Docker..."
cd "$PSScriptRoot\infra\docker"
docker compose up -d

Start-Sleep -Seconds 2


# --- 2) API starten ---
Write-Host "Starte API (NestJS)..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd `"$PSScriptRoot\apps\api`"; npm run start:dev"
)


# --- 3) Web starten ---
Write-Host "Starte Web (Next.js)..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd `"$PSScriptRoot\apps\web`"; npm run dev"
)

Write-Host "`n--- Alle Services wurden gestartet ---"
Write-Host "Web:  http://localhost:3000"
Write-Host "API:  http://localhost:4000/api/health"
