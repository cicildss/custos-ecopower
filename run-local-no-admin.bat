@echo off
setlocal

set "ROOT=%~dp0"
set "CODEX_PY=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if exist "%CODEX_PY%" (
  "%CODEX_PY%" "%ROOT%local-no-admin\server.py"
  goto :eof
)

python "%ROOT%local-no-admin\server.py"

