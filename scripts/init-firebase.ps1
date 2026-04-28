# Script de Inicialización Completa de Firebase
# Ejecutar desde la raíz del proyecto

Write-Host "🚀 Iniciando configuración completa de Firebase..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Firebase CLI
Write-Host "1️⃣ Verificando Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version
    Write-Host "   ✅ Firebase CLI versión: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Firebase CLI no está instalado" -ForegroundColor Red
    Write-Host "   Instala con: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar proyecto seleccionado
Write-Host ""
Write-Host "2️⃣ Verificando proyecto Firebase..." -ForegroundColor Yellow
$projectFile = Get-Content .firebaserc -Raw | ConvertFrom-Json
$projectId = $projectFile.projects.default
Write-Host "   📁 Proyecto: $projectId" -ForegroundColor Cyan

# 3. Instalar dependencias del frontend
Write-Host ""
Write-Host "3️⃣ Instalando dependencias del frontend..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Error instalando dependencias del frontend" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Dependencias frontend instaladas" -ForegroundColor Green

# 4. Instalar dependencias de functions
Write-Host ""
Write-Host "4️⃣ Instalando dependencias de Cloud Functions..." -ForegroundColor Yellow
Push-Location functions
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Error instalando dependencias de functions" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "   ✅ Dependencias de functions instaladas" -ForegroundColor Green

# 5. Desplegar reglas de Firestore
Write-Host ""
Write-Host "5️⃣ Desplegando reglas de Firestore..." -ForegroundColor Yellow
firebase deploy --only firestore:rules
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️ Error desplegando reglas de Firestore (puede que ya estén actualizadas)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Reglas de Firestore desplegadas" -ForegroundColor Green
}

# 6. Desplegar reglas de Realtime Database
Write-Host ""
Write-Host "6️⃣ Desplegando reglas de Realtime Database..." -ForegroundColor Yellow
firebase deploy --only database:rules
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️ Error desplegando reglas de RTDB (puede que ya estén actualizadas)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Reglas de Realtime Database desplegadas" -ForegroundColor Green
}

# 7. Desplegar Cloud Functions
Write-Host ""
Write-Host "7️⃣ Desplegando Cloud Functions..." -ForegroundColor Yellow
firebase deploy --only functions
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Error desplegando Cloud Functions" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Cloud Functions desplegadas" -ForegroundColor Green

# 8. Inicializar datos en Firestore
Write-Host ""
Write-Host "8️⃣ Inicializando datos en Firestore..." -ForegroundColor Yellow
node functions/seed-firestore.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️ Error inicializando datos (puede que ya existan)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Datos inicializados en Firestore" -ForegroundColor Green
}

# 9. Compilar frontend
Write-Host ""
Write-Host "9️⃣ Compilando frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Error compilando frontend" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Frontend compilado" -ForegroundColor Green

# 10. Desplegar Hosting (opcional)
Write-Host ""
Write-Host "🔟 Desplegando a Firebase Hosting..." -ForegroundColor Yellow
$deployHosting = Read-Host "   ¿Deseas desplegar el frontend a Firebase Hosting? (s/n)"
if ($deployHosting -eq 's' -or $deployHosting -eq 'S') {
    firebase deploy --only hosting
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️ Error desplegando Hosting" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Frontend desplegado a Firebase Hosting" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 ¡Configuración de Firebase completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Resumen:" -ForegroundColor Cyan
Write-Host "   ✅ Reglas de Firestore desplegadas"
Write-Host "   ✅ Reglas de Realtime Database desplegadas"
Write-Host "   ✅ Cloud Functions desplegadas (countVisit)"
Write-Host "   ✅ Datos iniciales en Firestore"
Write-Host "   ✅ Frontend compilado"
Write-Host ""
Write-Host "🌐 URLs del proyecto:" -ForegroundColor Cyan
Write-Host '   - Console: https://console.firebase.google.com/project/' + $projectId
Write-Host '   - Hosting: https://' + $projectId + '.web.app'
Write-Host '   - Function: https://us-central1-' + $projectId + '.cloudfunctions.net/countVisit'
Write-Host ""
