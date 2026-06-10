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

echo Configurando frontend\.env...
> "frontend\.env" echo VITE_SUPABASE_URL="https://hdorhyepkpgayjezubra.supabase.co"
>> "frontend\.env" echo VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_1bsxriJUMqaxUoxK14sZig_XYvk5NDI"
>> "frontend\.env" echo VITE_API_URL="http://10.1.100.17:3002"

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
