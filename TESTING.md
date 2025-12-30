# Docker Testing Guide

This guide provides instructions for testing the Radio Calico Docker setup.

## Quick Test

### Automated Testing (Recommended)

Run the comprehensive test script:

```bash
# If you're in the docker group
./test-docker.sh

# Or with sudo if needed
sudo ./test-docker.sh
```

The script will:
- ✅ Build both dev and prod images
- ✅ Start containers on ports 3100 and 3101
- ✅ Test all endpoints
- ✅ Check health status
- ✅ Verify security settings
- ✅ Show resource usage
- ✅ Validate docker-compose files

## Manual Testing

### Prerequisites

```bash
# Check Docker is installed
docker --version

# Check Docker Compose is installed
docker-compose --version
# or
docker compose version

# Check you have permissions
docker ps

# If permission denied, add yourself to docker group
sudo usermod -aG docker $USER
# Then logout and login again
```

### Test 1: Build Images

**Development Image:**
```bash
docker build --target development -t radiocalico:dev .

# Verify build
docker images | grep radiocalico
```

**Production Image:**
```bash
docker build --target production -t radiocalico:prod .

# Verify build
docker images | grep radiocalico
```

**Expected:**
- Development: ~200MB
- Production: ~150MB

### Test 2: Run Development Container

```bash
# Start container
docker run -d \
  --name radiocalico-dev \
  -p 3000:3000 \
  -e STREAM_URL="https://radio3.radio-calico.com:8443/calico.mp3" \
  radiocalico:dev

# Wait 10 seconds for startup
sleep 10

# Check it's running
docker ps | grep radiocalico-dev

# Check logs
docker logs radiocalico-dev

# Check health
docker inspect --format='{{.State.Health.Status}}' radiocalico-dev
```

**Expected output:**
- Container status: "Up"
- Health status: "healthy" (after ~30 seconds)
- Logs: "Radio player running at http://localhost:3000"

### Test 3: Test Development Endpoints

```bash
# Test config endpoint
curl http://localhost:3000/config
# Expected: {"streamUrl":"https://radio3.radio-calico.com:8443/calico.mp3"}

# Test main page
curl -I http://localhost:3000/
# Expected: HTTP/1.1 200 OK

# Test metadata endpoint
curl http://localhost:3000/metadata
# Expected: JSON with title, artist, timestamp

# Test in browser
# Visit: http://localhost:3000
# Expected: Radio player interface loads
```

### Test 4: Run Production Container

```bash
# Start container
docker run -d \
  --name radiocalico-prod \
  -p 3001:3000 \
  -e STREAM_URL="https://radio3.radio-calico.com:8443/calico.mp3" \
  radiocalico:prod

# Wait 10 seconds for startup
sleep 10

# Check it's running
docker ps | grep radiocalico-prod

# Check logs
docker logs radiocalico-prod

# Check health
docker inspect --format='{{.State.Health.Status}}' radiocalico-prod
```

**Expected output:**
- Container status: "Up"
- Health status: "healthy" (after ~30 seconds)
- Logs: "Radio player running at http://localhost:3000"

### Test 5: Test Production Endpoints

```bash
# Test config endpoint
curl http://localhost:3001/config
# Expected: {"streamUrl":"https://radio3.radio-calico.com:8443/calico.mp3"}

# Test main page
curl -I http://localhost:3001/
# Expected: HTTP/1.1 200 OK

# Test in browser
# Visit: http://localhost:3001
# Expected: Radio player interface loads
```

### Test 6: Security Check (Production)

```bash
# Check user (should be nodejs, not root)
docker exec radiocalico-prod whoami
# Expected: nodejs

# Check process owner
docker exec radiocalico-prod ps aux
# Expected: nodejs owns the node process
```

### Test 7: Hot-Reload Test (Development)

```bash
# With dev container running, watch logs
docker logs -f radiocalico-dev &

# Make a change to server.js
echo "// test change" >> server.js

# Check logs for restart message
# Expected: "[nodemon] restarting due to changes..."

# Undo the change
git checkout server.js
```

### Test 8: Docker Compose Testing

**Test Development Service:**
```bash
# Start dev service
docker-compose up -d radiocalico-dev

# Wait for startup
sleep 10

# Test endpoint
curl http://localhost:3000/config

# Check logs
docker-compose logs radiocalico-dev

# Check status
docker-compose ps
```

**Test Production Service:**
```bash
# Start prod service
docker-compose up -d radiocalico-prod

# Wait for startup
sleep 10

# Test endpoint
curl http://localhost:3001/config

# Check logs
docker-compose logs radiocalico-prod

# Check status
docker-compose ps
```

**Test Both Simultaneously:**
```bash
# Start both
docker-compose up -d

# Test both endpoints
curl http://localhost:3000/config  # Dev
curl http://localhost:3001/config  # Prod

# View logs
docker-compose logs -f
```

### Test 9: Production Compose

```bash
# Start production compose (port 80)
docker-compose -f docker-compose.prod.yml up -d

# Test endpoint (adjust port if HOST_PORT set)
curl http://localhost/config

# Check logs
docker-compose -f docker-compose.prod.yml logs
```

### Test 10: Makefile Commands

```bash
# Build images
make build-dev
make build-prod

# Start services
make start-dev
make start-prod

# Check logs
make logs-dev
make logs-prod

# Test health
make health-dev
make health-prod

# Open shell
make shell-dev
# Inside container: ls, pwd, whoami, exit

# Stop services
make stop
```

### Test 11: Resource Usage

```bash
# Check resource usage
docker stats radiocalico-dev radiocalico-prod

# Expected:
# Dev:  < 0.5% CPU, ~256MB RAM
# Prod: < 0.5% CPU, ~256MB RAM
```

### Test 12: Volume Mount Test (Development)

```bash
# Start with volume mounts
docker-compose up -d radiocalico-dev

# Edit a file
echo "<!-- test -->" >> public/index.html

# Check logs - should see restart
docker-compose logs radiocalico-dev

# Visit browser - change should be visible
# http://localhost:3000

# Undo change
git checkout public/index.html
```

## Cleanup After Testing

```bash
# Stop and remove containers
docker stop radiocalico-dev radiocalico-prod
docker rm radiocalico-dev radiocalico-prod

# Or with docker-compose
docker-compose down

# Remove images (optional)
docker rmi radiocalico:dev radiocalico:prod

# Clean up everything (careful!)
docker system prune -a
```

## Troubleshooting Tests

### Container Won't Start

```bash
# Check if port is in use
sudo lsof -i :3000

# Try different port
docker run -p 8080:3000 radiocalico:prod

# Check logs for errors
docker logs radiocalico-dev
```

### Health Check Failing

```bash
# Check health details
docker inspect radiocalico-prod | jq '.[0].State.Health'

# Manually test health endpoint
docker exec radiocalico-prod wget -qO- http://localhost:3000/config

# Check if app is listening
docker exec radiocalico-prod netstat -tlnp
```

### Build Failing

```bash
# Clean build cache
docker builder prune

# Rebuild without cache
docker build --no-cache --target production -t radiocalico:prod .

# Check .dockerignore isn't excluding needed files
cat .dockerignore
```

### Permission Denied

```bash
# Check docker group
groups

# Add yourself to docker group
sudo usermod -aG docker $USER

# Apply immediately
newgrp docker

# Or logout/login

# Verify
docker ps
```

### Volume Mounts Not Working

```bash
# Check mount points
docker inspect radiocalico-dev | jq '.[0].Mounts'

# Verify paths are absolute
pwd
# Use full paths in docker run -v
```

## Success Criteria

A successful test should show:

- ✅ Both images build without errors
- ✅ Both containers start and stay running
- ✅ Health checks show "healthy" status
- ✅ All endpoints respond correctly
- ✅ Production runs as nodejs user (non-root)
- ✅ Development hot-reload works
- ✅ Docker compose files are valid
- ✅ Resource usage is reasonable
- ✅ No errors in logs
- ✅ Web interface loads in browser

## Performance Benchmarks

Expected performance:

| Metric | Development | Production |
|--------|-------------|------------|
| Build time (first) | 60-120s | 60-120s |
| Build time (cached) | 2-5s | 2-5s |
| Startup time | 3-5s | 3-5s |
| Health check time | ~30s | ~30s |
| Memory usage | ~256MB | ~256MB |
| CPU usage (idle) | <0.5% | <0.5% |
| Image size | ~200MB | ~150MB |

## Browser Testing Checklist

After containers are running, test in browser:

### Development (http://localhost:3000)
- [ ] Page loads without errors
- [ ] Player controls are visible
- [ ] Play button works
- [ ] Volume control works
- [ ] Album art loads
- [ ] Metadata updates
- [ ] Rating system works
- [ ] History shows tracks
- [ ] Debug panel toggles
- [ ] No console errors

### Production (http://localhost:3001)
- [ ] Same as above
- [ ] Performance is good
- [ ] No dev tools messages
- [ ] Assets load from container

## Load Testing (Optional)

```bash
# Install apache bench if needed
sudo apt install apache-bench

# Test config endpoint
ab -n 1000 -c 10 http://localhost:3001/config

# Test main page
ab -n 100 -c 5 http://localhost:3001/

# Expected: No errors, reasonable response times
```

## Next Steps After Testing

Once all tests pass:

1. **Commit the Docker configuration**
   ```bash
   git add .
   git commit -m "Add Docker containerization with dev/prod configs"
   ```

2. **Push to registry** (if deploying)
   ```bash
   docker tag radiocalico:prod username/radiocalico:latest
   docker push username/radiocalico:latest
   ```

3. **Deploy to production**
   ```bash
   # On production server
   docker pull username/radiocalico:latest
   docker run -d -p 80:3000 username/radiocalico:latest
   ```

4. **Set up monitoring**
   - Configure health check alerts
   - Set up log aggregation
   - Monitor resource usage

5. **Documentation**
   - Update README with Docker instructions
   - Document any custom configuration
   - Add deployment procedures
