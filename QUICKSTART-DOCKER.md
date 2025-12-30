# Docker Quick Start Guide

Get Radio Calico running in Docker in under 5 minutes.

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)
- Optional: Make utility for convenience commands

## 1-Minute Start

### Development Mode (with hot-reload)

```bash
docker-compose up radiocalico-dev
```

Visit: http://localhost:3000

### Production Mode

```bash
docker-compose up radiocalico-prod
```

Visit: http://localhost:3001

## Configuration

### Option 1: Environment Variables (Easiest)

```bash
STREAM_URL="https://your-stream.com/stream.mp3" docker-compose up radiocalico-prod
```

### Option 2: .env File (Recommended)

```bash
# Create .env file
cp .env.docker .env

# Edit with your settings
nano .env

# Start
docker-compose up -d radiocalico-prod
```

### Option 3: Custom docker-compose.yml

Edit `docker-compose.yml` and modify the environment variables:
```yaml
environment:
  - STREAM_URL=https://your-stream.com/stream.mp3
```

## Using Make Commands

If you have Make installed:

```bash
# Development
make start-dev      # Start in background
make logs-dev       # View logs
make shell-dev      # Open shell

# Production
make start-prod     # Start in background
make logs-prod      # View logs
make shell-prod     # Open shell

# General
make stop           # Stop all
make clean          # Clean up
make help           # Show all commands
```

## Production Deployment

### Docker Compose (Simple)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Docker CLI (Maximum Control)

```bash
# Build
docker build --target production -t radiocalico:latest .

# Run
docker run -d \
  --name radiocalico \
  -p 80:3000 \
  -e STREAM_URL="https://radio3.radio-calico.com:8443/calico.mp3" \
  --restart unless-stopped \
  radiocalico:latest
```

### Push to Registry

```bash
# Tag
docker tag radiocalico:latest yourusername/radiocalico:latest

# Push to Docker Hub
docker push yourusername/radiocalico:latest

# Deploy anywhere
docker run -d -p 80:3000 yourusername/radiocalico:latest
```

## Troubleshooting

### Docker Permission Error

If you see "permission denied" connecting to Docker daemon:

```bash
# Add your user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Or use sudo (not recommended for regular use)
sudo docker-compose up radiocalico-prod
```

### Port Already in Use

```bash
# Use a different port
docker run -p 8080:3000 radiocalico:prod
```

### View Logs

```bash
# With docker-compose
docker-compose logs -f radiocalico-prod

# With docker CLI
docker logs -f radiocalico
```

### Container Won't Start

```bash
# Check status
docker ps -a

# View logs
docker logs radiocalico

# Test health check manually
docker exec radiocalico wget -qO- http://localhost:3000/config
```

## What's Included

- **Multi-stage Dockerfile** - Optimized dev and prod builds
- **docker-compose.yml** - Both dev and prod services
- **docker-compose.prod.yml** - Production-only deployment
- **Makefile** - Convenient command shortcuts
- **Health checks** - Automatic container health monitoring
- **Security** - Non-root user, minimal attack surface
- **Logging** - Automatic log rotation
- **Resource limits** - CPU and memory constraints

## Next Steps

- Read [DOCKER.md](./DOCKER.md) for comprehensive documentation
- Configure custom stream URLs
- Set up reverse proxy (nginx, Traefik, Caddy)
- Deploy to cloud (AWS, GCP, Azure, DigitalOcean)
- Set up monitoring and alerts

## Quick Reference

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start all services in background |
| `docker-compose stop` | Stop all services |
| `docker-compose down` | Stop and remove containers |
| `docker-compose logs -f` | Follow logs |
| `docker-compose ps` | List running services |
| `docker-compose restart` | Restart all services |

## Support

For detailed documentation, see:
- [DOCKER.md](./DOCKER.md) - Complete Docker guide
- [README.md](./README.md) - Project documentation
- [CLAUDE.md](./CLAUDE.md) - Development guidelines
