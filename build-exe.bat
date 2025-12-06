@echo off
REM Script para gerar executável Windows (.exe) do Teleprompter
REM Requer: Python 3.8+, PyInstaller

echo ========================================
echo  Teleprompter - Build para Windows
echo ========================================
echo.

REM Verifica se Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado!
    echo Baixe em: https://www.python.org/downloads/
    echo Certifique-se de marcar "Add Python to PATH"
    pause
    exit /b 1
)

echo [1/4] Instalando PyInstaller...
pip install pyinstaller --quiet
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar PyInstaller
    pause
    exit /b 1
)

echo [2/4] Criando executável...
REM Cria o exe com ícone e opções
pyinstaller ^
    --onefile ^
    --windowed ^
    --name "Teleprompter" ^
    --icon=teleprompter.ico ^
    --add-data "docker-compose.yml:." ^
    --add-data "nginx.conf:." ^
    --add-data "Dockerfile:." ^
    --distpath "./dist" ^
    --buildpath "./build" ^
    --specpath "./build" ^
    teleprompter.py

if %errorlevel% neq 0 (
    echo [ERRO] Falha ao gerar executável
    pause
    exit /b 1
)

echo [3/4] Limpando arquivos temporários...
rmdir /s /q build
del Teleprompter.spec

echo [4/4] Verificando resultado...
if exist "dist\Teleprompter.exe" (
    echo.
    echo ========================================
    echo  ✓ SUCESSO!
    echo ========================================
    echo.
    echo Executável criado: dist\Teleprompter.exe
    echo.
    echo Para usar:
    echo   1. Certifique-se que Docker Desktop está instalado
    echo   2. Clique duas vezes em: dist\Teleprompter.exe
    echo   3. A app abrirá no navegador
    echo.
    echo ========================================
    pause
) else (
    echo [ERRO] Executável nao foi criado
    pause
    exit /b 1
)
