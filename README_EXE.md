# 📺 Teleprompter - Executável Windows

## ⚡ Quick Start (EXE)

### Opção 1: Usar o executável pronto (mais fácil)

1. **Baixe e execute** `Teleprompter.exe`
2. O app abre no navegador automaticamente
3. Pronto! 

### Opção 2: Build seu próprio executável

#### Pré-requisitos
- **Docker Desktop** instalado ([baixar](https://www.docker.com/products/docker-desktop))
- **Python 3.8+** instalado ([baixar](https://www.python.org/downloads/))
  - ⚠️ Durante instalação, marque **"Add Python to PATH"**

#### Passos

1. **Gere o ícone:**
```powershell
python create_icon.py
```

2. **Build o executável:**
```powershell
.\build-exe.bat
```

3. **Execute:**
```powershell
.\dist\Teleprompter.exe
```

---

## 🔧 Como funciona

```
Teleprompter.exe
  ↓ (Python)
  ↓ Inicia Docker
  ↓
docker-compose.yml
  ↓
Dockerfile (builds Node + Nginx)
  ↓
http://localhost:3000 (abre no navegador)
```

### Fluxo
1. Você clica em `Teleprompter.exe`
2. Python verifica se Docker está instalado
3. Inicia container (`docker-compose up`)
4. Aguarda app ficar pronta (port 3000)
5. Abre navegador automaticamente
6. Você usa a app normalmente

---

## 📋 Requisitos do Sistema

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| Windows | 10 | 11+ |
| RAM | 2GB | 4GB+ |
| Disco | 2GB | 5GB+ |
| Docker | Instalado | Latest |

---

## 🚀 Distribuição

### Opção A: Executável Standalone
- `dist/Teleprompter.exe` (~100MB)
- Simples de distribuir e executar
- Requer Docker Desktop instalado no PC alvo

### Opção B: Installer NSIS (Windows Installer)
Se quiser criar um `.msi` ou `.exe` installer:

```powershell
pip install pyinstaller nuitka
# (configuração avançada)
```

### Opção C: Portable (sem instalação)
O `Teleprompter.exe` já é portable — funciona em qualquer PC com Docker.

---

## 🐛 Troubleshooting

### "Docker não encontrado"
```powershell
# Verifique se Docker está no PATH
docker --version

# Se não funcionar, adicione ao PATH:
# C:\Program Files\Docker\Docker\resources\bin
```

### "Porta 3000 já está em uso"
```powershell
# Encontre e pare o processo:
netstat -ano | findstr :3000

# Ou mude a porta em docker-compose.yml:
# ports:
#   - "3001:80"  <- mude o primeiro número
```

### "Container não inicia"
```powershell
# Verifique logs:
docker-compose logs

# Ou reconstrua:
docker-compose down
docker-compose up --build
```

### "App abre mas está vazia"
```powershell
# Verifique se Nginx está servindo:
docker-compose logs teleprompter

# Rebuilde a imagem:
docker-compose down
docker-compose up --build -d
```

---

## 📦 Arquivos inclusos no EXE

O executável inclui automaticamente:
- `docker-compose.yml` - Orquestração
- `Dockerfile` - Build da imagem
- `nginx.conf` - Configuração do servidor

---

## ✨ Próximas melhorias (opcionais)

- [ ] Ícone customizado (altere `create_icon.py`)
- [ ] Versão com menu de contexto
- [ ] Auto-update automático
- [ ] Modo offline (incluir app dentro do EXE)
- [ ] Setup wizard para primeira execução

---

## 📞 Suporte

Se tiver dúvidas:
1. Verifique se Docker está rodando: `docker ps`
2. Veja logs: `docker-compose logs -f`
3. Reinicie: `docker-compose restart`

