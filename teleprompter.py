#!/usr/bin/env python3
"""
Teleprompter App Launcher
Abre a app em uma janela (modo kiosk-like) via navegador
"""
import os
import sys
import time
import webbrowser
import subprocess
from pathlib import Path

# Configurações
DOCKER_CONTAINER = "teleprompter-app"
DOCKER_PORT = 3000
LOCAL_URL = f"http://localhost:{DOCKER_PORT}"
CHECK_TIMEOUT = 30  # segundos para aguardar container iniciar

def is_container_running():
    """Verifica se o container Docker está rodando"""
    try:
        result = subprocess.run(
            ["docker", "ps", "--filter", f"name={DOCKER_CONTAINER}", "--format", "{{.ID}}"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return bool(result.stdout.strip())
    except Exception as e:
        print(f"Erro ao verificar Docker: {e}")
        return False

def is_port_open(port=DOCKER_PORT, timeout=2):
    """Verifica se a porta está aberta (app pronta)"""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        result = sock.connect_ex(('localhost', port))
        return result == 0
    except Exception:
        return False
    finally:
        sock.close()

def start_container():
    """Inicia o container Docker se não estiver rodando"""
    if is_container_running():
        print("✓ Container já está rodando")
        return True
    
    print("🐳 Iniciando container Docker...")
    try:
        # Tenta rodar com docker-compose se existir
        compose_path = Path(__file__).parent / "docker-compose.yml"
        if compose_path.exists():
            subprocess.Popen(
                ["docker-compose", "up", "-d"],
                cwd=Path(__file__).parent,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        else:
            subprocess.Popen(
                ["docker", "run", "-d", "-p", f"{DOCKER_PORT}:80", "--name", DOCKER_CONTAINER, "teleprompter-app"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        
        # Aguarda container estar pronto
        print("⏳ Aguardando app iniciar...", end="", flush=True)
        start_time = time.time()
        while time.time() - start_time < CHECK_TIMEOUT:
            if is_port_open():
                print(" ✓")
                return True
            print(".", end="", flush=True)
            time.sleep(1)
        
        print(" ✗")
        print("⚠ Timeout esperando container iniciar")
        return False
    except Exception as e:
        print(f"✗ Erro ao iniciar container: {e}")
        return False

def open_app():
    """Abre a app no navegador"""
    print(f"🌐 Abrindo app em {LOCAL_URL}")
    webbrowser.open(LOCAL_URL)

def main():
    """Fluxo principal"""
    print("=" * 50)
    print("📺 Teleprompter App")
    print("=" * 50)
    
    # Verifica se Docker está instalado
    try:
        subprocess.run(["docker", "--version"], capture_output=True, timeout=5)
    except Exception:
        print("✗ Docker não está instalado ou não está no PATH")
        print("  Baixe em: https://www.docker.com/products/docker-desktop")
        input("\nPressione Enter para sair...")
        return 1
    
    # Inicia container
    if not start_container():
        print("\n✗ Falha ao iniciar container Docker")
        input("Pressione Enter para sair...")
        return 1
    
    # Aguarda porta ficar pronta
    print("⏳ Verificando se a app está pronta...", end="", flush=True)
    start_time = time.time()
    while time.time() - start_time < 10:
        if is_port_open():
            print(" ✓")
            break
        print(".", end="", flush=True)
        time.sleep(0.5)
    
    # Abre no navegador
    open_app()
    
    print("\n✓ App aberta! Você pode fechar este terminal.")
    print(f"  URL: {LOCAL_URL}")
    print("\n  Para parar a app, execute:")
    print("  docker-compose down  (ou)")
    print("  docker stop teleprompter-app")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n👋 Encerrando...")
        sys.exit(0)
