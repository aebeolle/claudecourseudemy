#!/bin/bash
# Radio Calico Docker Test Script
# This script tests both development and production Docker configurations

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Cleanup function
cleanup() {
    print_header "Cleaning up test containers"
    docker-compose down -v 2>/dev/null || true
    docker stop radiocalico-test-dev 2>/dev/null || true
    docker stop radiocalico-test-prod 2>/dev/null || true
    docker rm radiocalico-test-dev 2>/dev/null || true
    docker rm radiocalico-test-prod 2>/dev/null || true
    print_info "Cleanup complete"
}

# Trap to cleanup on exit
trap cleanup EXIT

# Check prerequisites
print_header "Checking Prerequisites"

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi
print_success "Docker is installed ($(docker --version))"

if ! command -v docker-compose &> /dev/null; then
    print_warning "docker-compose not found, trying docker compose plugin"
    if ! docker compose version &> /dev/null; then
        print_error "Neither docker-compose nor docker compose plugin found"
        exit 1
    else
        COMPOSE_CMD="docker compose"
        print_success "Docker Compose plugin is available"
    fi
else
    COMPOSE_CMD="docker-compose"
    print_success "Docker Compose is installed ($(docker-compose --version))"
fi

if ! docker ps &> /dev/null; then
    print_error "Cannot connect to Docker daemon. Try:"
    echo "  1. Add yourself to docker group: sudo usermod -aG docker \$USER"
    echo "  2. Or run this script with sudo: sudo ./test-docker.sh"
    exit 1
fi
print_success "Docker daemon is accessible"

# Test 1: Build Development Image
print_header "Test 1: Building Development Image"
if docker build --target development -t radiocalico:test-dev . > /tmp/docker-build-dev.log 2>&1; then
    print_success "Development image built successfully"

    # Check image size
    DEV_SIZE=$(docker images radiocalico:test-dev --format "{{.Size}}")
    print_info "Image size: $DEV_SIZE"
else
    print_error "Failed to build development image"
    cat /tmp/docker-build-dev.log
    exit 1
fi

# Test 2: Build Production Image
print_header "Test 2: Building Production Image"
if docker build --target production -t radiocalico:test-prod . > /tmp/docker-build-prod.log 2>&1; then
    print_success "Production image built successfully"

    # Check image size
    PROD_SIZE=$(docker images radiocalico:test-prod --format "{{.Size}}")
    print_info "Image size: $PROD_SIZE"
else
    print_error "Failed to build production image"
    cat /tmp/docker-build-prod.log
    exit 1
fi

# Test 3: Run Development Container
print_header "Test 3: Testing Development Container"
print_info "Starting development container on port 3100..."

if docker run -d \
    --name radiocalico-test-dev \
    -p 3100:3000 \
    -e STREAM_URL="https://radio3.radio-calico.com:8443/calico.mp3" \
    radiocalico:test-dev > /dev/null 2>&1; then
    print_success "Development container started"

    # Wait for container to be ready
    print_info "Waiting for container to be ready (10 seconds)..."
    sleep 10

    # Check if container is running
    if docker ps | grep -q radiocalico-test-dev; then
        print_success "Development container is running"

        # Check health status
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' radiocalico-test-dev 2>/dev/null || echo "no-healthcheck")
        if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "no-healthcheck" ]; then
            print_success "Development container health check: $HEALTH"
        else
            print_warning "Development container health check: $HEALTH (still initializing)"
        fi
    else
        print_error "Development container stopped unexpectedly"
        docker logs radiocalico-test-dev
        exit 1
    fi
else
    print_error "Failed to start development container"
    exit 1
fi

# Test 4: Test Development Endpoints
print_header "Test 4: Testing Development Endpoints"

# Test /config endpoint
print_info "Testing /config endpoint..."
if curl -s -f http://localhost:3100/config > /dev/null 2>&1; then
    CONFIG_RESPONSE=$(curl -s http://localhost:3100/config)
    print_success "Config endpoint responding"
    print_info "Response: $CONFIG_RESPONSE"
else
    print_error "Config endpoint not responding"
fi

# Test / endpoint (HTML)
print_info "Testing / endpoint..."
if curl -s -f http://localhost:3100/ > /dev/null 2>&1; then
    print_success "Main page endpoint responding"
else
    print_error "Main page endpoint not responding"
fi

# Test /metadata endpoint
print_info "Testing /metadata endpoint..."
if curl -s -f http://localhost:3100/metadata > /dev/null 2>&1; then
    METADATA_RESPONSE=$(curl -s http://localhost:3100/metadata)
    print_success "Metadata endpoint responding"
    print_info "Response: $METADATA_RESPONSE"
else
    print_warning "Metadata endpoint not responding (may need stream access)"
fi

# Test 5: Run Production Container
print_header "Test 5: Testing Production Container"
print_info "Starting production container on port 3101..."

if docker run -d \
    --name radiocalico-test-prod \
    -p 3101:3000 \
    -e STREAM_URL="https://radio3.radio-calico.com:8443/calico.mp3" \
    radiocalico:test-prod > /dev/null 2>&1; then
    print_success "Production container started"

    # Wait for container to be ready
    print_info "Waiting for container to be ready (10 seconds)..."
    sleep 10

    # Check if container is running
    if docker ps | grep -q radiocalico-test-prod; then
        print_success "Production container is running"

        # Check health status
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' radiocalico-test-prod 2>/dev/null || echo "no-healthcheck")
        if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "no-healthcheck" ]; then
            print_success "Production container health check: $HEALTH"
        else
            print_warning "Production container health check: $HEALTH (still initializing)"
        fi
    else
        print_error "Production container stopped unexpectedly"
        docker logs radiocalico-test-prod
        exit 1
    fi
else
    print_error "Failed to start production container"
    exit 1
fi

# Test 6: Test Production Endpoints
print_header "Test 6: Testing Production Endpoints"

# Test /config endpoint
print_info "Testing /config endpoint..."
if curl -s -f http://localhost:3101/config > /dev/null 2>&1; then
    CONFIG_RESPONSE=$(curl -s http://localhost:3101/config)
    print_success "Config endpoint responding"
    print_info "Response: $CONFIG_RESPONSE"
else
    print_error "Config endpoint not responding"
fi

# Test / endpoint (HTML)
print_info "Testing / endpoint..."
if curl -s -f http://localhost:3101/ > /dev/null 2>&1; then
    print_success "Main page endpoint responding"
else
    print_error "Main page endpoint not responding"
fi

# Test 7: Check Logs
print_header "Test 7: Checking Container Logs"

print_info "Development container logs (last 10 lines):"
docker logs --tail 10 radiocalico-test-dev
echo ""

print_info "Production container logs (last 10 lines):"
docker logs --tail 10 radiocalico-test-prod
echo ""

# Test 8: Check Security (Production)
print_header "Test 8: Security Checks (Production)"

# Check if running as non-root
PROD_USER=$(docker exec radiocalico-test-prod whoami 2>/dev/null || echo "unknown")
if [ "$PROD_USER" = "nodejs" ]; then
    print_success "Production container running as non-root user: $PROD_USER"
else
    print_warning "Production container user: $PROD_USER (expected: nodejs)"
fi

# Test 9: Docker Compose
print_header "Test 9: Testing Docker Compose"

print_info "Testing docker-compose.yml..."
if $COMPOSE_CMD config > /dev/null 2>&1; then
    print_success "docker-compose.yml is valid"
else
    print_error "docker-compose.yml has errors"
fi

print_info "Testing docker-compose.prod.yml..."
if $COMPOSE_CMD -f docker-compose.prod.yml config > /dev/null 2>&1; then
    print_success "docker-compose.prod.yml is valid"
else
    print_error "docker-compose.prod.yml has errors"
fi

# Test 10: Resource Usage
print_header "Test 10: Resource Usage"

print_info "Development container stats:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" radiocalico-test-dev

print_info "Production container stats:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" radiocalico-test-prod

# Final Summary
print_header "Test Summary"

echo -e "Total tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Total tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}\n"
    echo "Access the containers:"
    echo "  - Development: http://localhost:3100"
    echo "  - Production:  http://localhost:3101"
    echo ""
    echo "To stop containers:"
    echo "  docker stop radiocalico-test-dev radiocalico-test-prod"
    echo ""
    echo "Containers will be automatically cleaned up when you exit."

    # Keep containers running for manual testing
    print_info "Press Ctrl+C to stop and cleanup containers..."
    trap - EXIT  # Remove auto cleanup
    read -r -d '' _ </dev/tty || true
    cleanup
else
    echo -e "\n${RED}❌ Some tests failed${NC}\n"
    exit 1
fi
