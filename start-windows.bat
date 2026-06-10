@echo off
setlocal

title Custos EcoPower - iniciar

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo.
echo ==============================
echo  Custos EcoPower - iniciar
echo ==============================
echo.

if not exist "package.json" (
  echo ERRO: este arquivo precisa estar dentro da pasta custos-ecopower.
  pause
  exit /b 1
)

echo Encerrando janelas antigas da plataforma...
taskkill /FI "WINDOWTITLE eq Custos API*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq Custos WEB*" /T /F >nul 2>nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$self=$PID; $parent=(Get-CimInstance Win32_Process -Filter \"ProcessId=$PID\").ParentProcessId; $ports=3002,5173; Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -and $_ -ne $self -and $_ -ne $parent } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }; Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $self -and $_.ProcessId -ne $parent -and $_.CommandLine -and $_.CommandLine -like '*custos-ecopower*' -and ($_.Name -eq 'node.exe' -or $_.Name -eq 'cmd.exe') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>nul
timeout /t 2 /nobreak >nul
del /f /q "node_modules\.prisma\client\query_engine-windows.dll.node.tmp*" >nul 2>nul

echo Configurando frontend\.env...
> "frontend\.env" echo VITE_SUPABASE_URL="https://hdorhyepkpgayjezubra.supabase.co"
>> "frontend\.env" echo VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_1bsxriJUMqaxUoxK14sZig_XYvk5NDI"
>> "frontend\.env" echo VITE_API_URL="http://10.1.100.17:3002"

if not exist "backend\.env" (
  echo Configurando backend\.env...
  > "backend\.env" echo DATABASE_URL="postgresql://protheus:protheus@localhost:5432/consulta_produtos?schema=public"
  >> "backend\.env" echo PORT=3002
  >> "backend\.env" echo CORS_ORIGIN="http://10.1.100.17:5173,http://127.0.0.1:5173,http://localhost:5173"
) else (
  echo backend\.env encontrado. Mantendo configuracao existente.
)

echo Atualizando dependencias e build...
call npm install
if errorlevel 1 goto :erro

call npx prisma generate --schema backend\prisma\schema.prisma
if errorlevel 1 goto :erro

call npm run build
if errorlevel 1 goto :erro

echo Abrindo API em http://10.1.100.17:3002 ...
start "Custos API" cmd /k "cd /d ""%ROOT%backend"" && set PORT=3002&& node dist\src\server.js"

echo Abrindo plataforma em http://10.1.100.17:5173 ...
start "Custos WEB" cmd /k "cd /d ""%ROOT%"" && npm run preview --workspace frontend -- --host 0.0.0.0 --port 5173"

echo.
echo Pronto. Acesse: http://10.1.100.17:5173
echo Deixe as janelas Custos API e Custos WEB abertas.
echo.
pause
exit /b 0

:erro
echo.
echo ERRO: a inicializacao falhou. Veja a mensagem acima.
pause
exit /b 1
