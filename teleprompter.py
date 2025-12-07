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
import logging

# Configurações
DOCKER_CONTAINER = "teleprompter-app"
DOCKER_PORT = 3000
LOCAL_URL = f"http://localhost:{DOCKER_PORT}"
CHECK_TIMEOUT = 30  # segundos para aguardar container iniciar

# Setup logging (em vez de print)
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

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
        logging.error(f"Erro ao verificar Docker: {e}")
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
        logging.info("✓ Container já está rodando")
        return True
    
    logging.info("🐳 Iniciando container Docker...")
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
        logging.info("⏳ Aguardando app iniciar...", end="", flush=True)
        start_time = time.time()
        while time.time() - start_time < CHECK_TIMEOUT:
            if is_port_open():
                logging.info(" ✓")
                return True
            logging.info(".", end="", flush=True)
            time.sleep(1)
        
        logging.info(" ✗")
        logging.warning("⚠ Timeout esperando container iniciar")
        return False
    except Exception as e:
        logging.error(f"✗ Erro ao iniciar container: {e}")
        return False

def open_app():
    """Abre a app no navegador"""
    logging.info(f"🌐 Abrindo app em {LOCAL_URL}")
    webbrowser.open(LOCAL_URL)

def main():
    """Fluxo principal"""
    logging.info("=" * 50)
    logging.info("📺 Teleprompter App")
    logging.info("=" * 50)
    
    # Verifica se Docker está instalado
    try:
        subprocess.run(["docker", "--version"], capture_output=True, timeout=5, check=True)
    except Exception:
        logging.error("✗ Docker não está instalado ou não está no PATH")
        logging.error("  Baixe em: https://www.docker.com/products/docker-desktop")
        time.sleep(3)
        return 1
    
    # Inicia container
    if not start_container():
        logging.error("\n✗ Falha ao iniciar container Docker")
        time.sleep(3)
        return 1
    
    # Aguarda porta ficar pronta
    logging.info("⏳ Verificando se a app está pronta...", end="", flush=True)
    start_time = time.time()
    while time.time() - start_time < 10:
        if is_port_open():
            logging.info(" ✓")
            break
        logging.info(".", end="", flush=True)
        time.sleep(0.5)
    
    # Abre no navegador
    open_app()
    
    logging.info("\n✓ App aberta! Você pode fechar este terminal.")
    logging.info(f"  URL: {LOCAL_URL}")
    logging.info("\n  Para parar a app, execute no PowerShell:")
    logging.info("  docker-compose down")
    
    time.sleep(2)
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        logging.info("\n\n👋 Encerrando...")
        sys.exit(0)
    except Exception as e:
        logging.error(f"\n❌ Erro inesperado: {e}")
        time.sleep(3)
        sys.exit(1)
