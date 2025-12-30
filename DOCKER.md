# Docker Deployment Guide

This guide explains how to deploy Radio Calico using Docker with both development and production configurations.

## Quick Start

### Using Docker Compose (Recommended)

**Development Mode (with hot-reloading):**
```bash
# Start development server on port 3000
docker-compose up radiocalico-dev

# Or run in detached mode
docker-compose up -d radiocalico-dev
```

**Production Mode:**
```bash
# Start production server on port 3001
docker-compose up radiocalico-prod

# Or run in detached mode
docker-compose up -d radiocalico-prod
```

**Run both simultaneously:**
```bash
docker-compose up -d
# Dev: http://localhost:3000
# Prod: http://localhost:3001
```

### Using Docker CLI

**Development:**
```bash
# Build development image
docker build --target development -t radiocalico:dev .

# Run development container
docker run -p 3000:3000 \
  -v $(pwd)/server.js:/app/server.js \
  -v $(pwd)/public:/app/public \
  -e STREAM_URL="https://radio3.radio-calico.com:8443/calico.mp3" \
  radiocalico:dev
```

**Production:**
```bash
# Build production image
docker build --target production -t radiocalico:prod .

# Run production container
docker run -p 3000:3000 \
  -e STREAM_URL="https://radio3.radio-calico.com:8443/calico.mp3" \
  radiocalico:prod
```

## Configuration

### Environment Variables

Configure the application using environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `STREAM_URL` | MP3 stream URL | Value from stream_URL.txt | No |
| `PORT` | Internal port | 3000 | No |
| `NODE_ENV` | Environment mode | Set by Dockerfile | No |

### Configuration Methods

**1. Environment Variables (Highest Priority)**
```bash
docker run -p 3000:3000 \
  -e STREAM_URL="https://your-stream.com/stream.mp3" \
  radiocalico:prod
```

**2. .env File with Docker Compose**
```bash
# Copy the example file
cp .env.docker .env

# Edit .env with your configuration
nano .env

# Start with docker-compose (automatically loads .env)
docker-compose up radiocalico-prod
```

**3. stream_URL.txt File (Built into Image)**
The file `stream_URL.txt` in the project root is copied into the image during build.

## Docker Architecture

### Multi-Stage Build

The Dockerfile uses a multi-stage build for optimization:

```
base → development
     → prod-deps → production
```

**Stages:**
- `base`: Common layer with Node.js and package.json
- `development`: Full dependencies + nodemon for hot-reloading
- `prod-deps`: Production dependencies only
- `production`: Minimal final image with security hardening

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Dependencies | All (inc. devDependencies) | Production only |
| Hot Reloading | Yes (nodemon) | No |
| Volume Mounts | Yes (source code) | No |
| User | root | nodejs (non-root) |
| Size | ~200MB | ~150MB |
| Port | 3000 | 3000 (map to 3001) |

## Advanced Usage

### Custom Port Mapping

```bash
# Map container port 3000 to host port 8080
docker run -p 8080:3000 radiocalico:prod
```

### Health Checks

Both images include health checks:
```bash
# Check container health
docker ps
# Look for "healthy" status

# View health check logs
docker inspect --format='{{json .State.Health}}' <container-id>
```

### Resource Limits

The production service in docker-compose.yml has resource limits:
- CPU: 0.5 cores (limit), 0.25 cores (reservation)
- Memory: 512MB (limit), 256MB (reservation)

Adjust in docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
```

### Development with Volume Mounts

Volume mounts enable live code updates without rebuilding:

```bash
docker run -p 3000:3000 \
  -v $(pwd)/server.js:/app/server.js \
  -v $(pwd)/public:/app/public \
  radiocalico:dev
```

Changes to `server.js` or `public/` files will trigger automatic restart.

### Build Arguments

Customize the build process:

```bash
# Use different Node.js version
docker build --build-arg NODE_VERSION=20 -t radiocalico:prod .
```

## Production Deployment

### Security Best Practices

The production image includes:
- ✅ Non-root user (nodejs:1001)
- ✅ Minimal Alpine Linux base
- ✅ Only production dependencies
- ✅ dumb-init for proper signal handling
- ✅ Health checks for monitoring

### Container Registry

**Push to Docker Hub:**
```bash
# Build and tag
docker build --target production -t yourusername/radiocalico:latest .
docker build --target production -t yourusername/radiocalico:v1.0.0 .

# Push
docker push yourusername/radiocalico:latest
docker push yourusername/radiocalico:v1.0.0
```

**Push to GitHub Container Registry:**
```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build and tag
docker build --target production -t ghcr.io/username/radiocalico:latest .

# Push
docker push ghcr.io/username/radiocalico:latest
```

### Production Deployment Examples

**Docker Compose with Traefik:**
```yaml
version: '3.8'

services:
  radiocalico:
    image: yourusername/radiocalico:latest
    environment:
      - STREAM_URL=${STREAM_URL}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.radiocalico.rule=Host(`radio.example.com`)"
      - "traefik.http.services.radiocalico.loadbalancer.server.port=3000"
    restart: unless-stopped
```

**Docker Swarm:**
```bash
docker service create \
  --name radiocalico \
  --replicas 3 \
  --publish 3000:3000 \
  -e STREAM_URL="https://radio3.radio-calico.com:8443/calico.mp3" \
  yourusername/radiocalico:latest
```

**Kubernetes:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: radiocalico
spec:
  replicas: 3
  selector:
    matchLabels:
      app: radiocalico
  template:
    metadata:
      labels:
        app: radiocalico
    spec:
      containers:
      - name: radiocalico
        image: yourusername/radiocalico:latest
        ports:
        - containerPort: 3000
        env:
        - name: STREAM_URL
          value: "https://radio3.radio-calico.com:8443/calico.mp3"
        livenessProbe:
          httpGet:
            path: /config
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        resources:
          limits:
            cpu: "0.5"
            memory: "512Mi"
          requests:
            cpu: "0.25"
            memory: "256Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: radiocalico
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: radiocalico
```

## Troubleshooting

### View Logs

```bash
# Docker Compose
docker-compose logs radiocalico-dev
docker-compose logs -f radiocalico-prod  # Follow logs

# Docker CLI
docker logs <container-id>
docker logs -f <container-id>  # Follow logs
```

### Container Shell Access

```bash
# Docker Compose
docker-compose exec radiocalico-dev sh

# Docker CLI
docker exec -it <container-id> sh
```

### Rebuild After Changes

```bash
# Docker Compose (force rebuild)
docker-compose build --no-cache radiocalico-prod
docker-compose up -d radiocalico-prod

# Docker CLI
docker build --no-cache --target production -t radiocalico:prod .
```

### Common Issues

**Port already in use:**
```bash
# Change port mapping in docker-compose.yml or use CLI
docker run -p 3001:3000 radiocalico:prod
```

**Health check failing:**
```bash
# Check if the app is responding
docker exec <container-id> wget -qO- http://localhost:3000/config

# Check logs for errors
docker logs <container-id>
```

**Volume mounts not working (Development):**
```bash
# Ensure paths are absolute
docker run -v "$(pwd)/server.js:/app/server.js" radiocalico:dev

# On Windows, use full paths
docker run -v "C:/path/to/project/server.js:/app/server.js" radiocalico:dev
```

## Useful Commands

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View running containers
docker-compose ps

# Restart a service
docker-compose restart radiocalico-prod

# View resource usage
docker stats

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune

# Clean up everything (careful!)
docker system prune -a
```

## Performance Optimization

### Image Size Optimization

Current image sizes:
- Development: ~200MB
- Production: ~150MB

The production image is optimized through:
- Alpine Linux base (5MB vs 100MB+ for full distros)
- Multi-stage build (excludes build dependencies)
- Only production npm dependencies
- .dockerignore file (excludes unnecessary files)

### Caching Strategy

Optimize build times with proper layer caching:
1. Package.json copied first (changes rarely)
2. Dependencies installed (cached if package.json unchanged)
3. Application code copied last (changes frequently)

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices for Writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
