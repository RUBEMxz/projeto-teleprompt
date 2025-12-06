# Teleprompter App - Docker Setup

## 🐳 Executar com Docker

### Pré-requisitos
- Docker Desktop instalado ([baixar aqui](https://www.docker.com/products/docker-desktop))

### Build e execução rápida

```bash
# Entrar no diretório do projeto
cd c:\rubemxz\Projetos\projeto-teleprompt

# Build da imagem Docker
docker build -t teleprompter-app .

# Executar o container
docker run -p 3000:80 teleprompter-app
```

Depois acesse: **http://localhost:3000**

### Usando Docker Compose (mais fácil)

```bash
cd c:\rubemxz\Projetos\projeto-teleprompt

# Build e inicia em um comando
docker-compose up --build

# Para parar
docker-compose down
```

Acesse: **http://localhost:3000**

---

## 📦 Como funciona

1. **Build Stage**: Node.js compila o projeto Vite (gera arquivos em `dist/`)
2. **Serve Stage**: Nginx serve os arquivos estáticos em porta 80 (mapeada para 3000 no host)
3. **Leve e rápido**: Imagem final ~50MB (sem Node.js)

---

## 🚀 Acessar de outro computador na rede

Se quiser acessar de outro PC na mesma rede:

1. Descubra o IP da sua máquina:
```powershell
ipconfig
```
Procure por "IPv4 Address" (ex: 192.168.1.100)

2. Acesse do outro PC: `http://192.168.1.100:3000`

---

## 🔧 Variáveis de ambiente

Se precisar ajustar a porta no `docker-compose.yml`:

```yaml
ports:
  - "SEU_PORT:80"  # Mude SEU_PORT para a porta desejada
```

Depois rode `docker-compose up --build` novamente.

---

## 📋 Comandos úteis

```bash
# Ver containers rodando
docker ps

# Ver logs em tempo real
docker-compose logs -f

# Deletar a imagem
docker rmi teleprompter-app

# Limpar tudo (containers + imagens não usadas)
docker system prune -a
```

---

## ✨ Benefícios vs Electron

| Aspecto | Docker | Electron |
|---------|--------|----------|
| Tamanho | ~50MB | ~150MB+ |
| Performance | Muito leve | Pesado |
| Multiplataforma | ✅ (Windows/Mac/Linux) | ✅ (Windows/Mac/Linux) |
| Distribuição | 1 arquivo Docker | 1 instalador exe |
| Atualizações | Rebuild rápido | Auto-updater complexo |
| Acesso via rede | ✅ Fácil (só IP) | ❌ Difícil |

