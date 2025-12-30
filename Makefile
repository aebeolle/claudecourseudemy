.PHONY: help build-dev build-prod run-dev run-prod start-dev start-prod stop logs clean test

# Default target
help:
	@echo "Radio Calico - Docker Management Commands"
	@echo ""
	@echo "Development:"
	@echo "  make build-dev      - Build development image"
	@echo "  make run-dev        - Run development container (foreground)"
	@echo "  make start-dev      - Start development container (background)"
	@echo "  make logs-dev       - View development logs"
	@echo ""
	@echo "Production:"
	@echo "  make build-prod     - Build production image"
	@echo "  make run-prod       - Run production container (foreground)"
	@echo "  make start-prod     - Start production container (background)"
	@echo "  make logs-prod      - View production logs"
	@echo ""
	@echo "General:"
	@echo "  make stop           - Stop all containers"
	@echo "  make clean          - Remove containers and images"
	@echo "  make logs           - View all logs"
	@echo "  make test           - Run tests"
	@echo "  make shell-dev      - Open shell in dev container"
	@echo "  make shell-prod     - Open shell in prod container"

# Development commands
build-dev:
	docker-compose build radiocalico-dev

run-dev:
	docker-compose up radiocalico-dev

start-dev:
	docker-compose up -d radiocalico-dev

logs-dev:
	docker-compose logs -f radiocalico-dev

shell-dev:
	docker-compose exec radiocalico-dev sh

# Production commands
build-prod:
	docker-compose build radiocalico-prod

run-prod:
	docker-compose up radiocalico-prod

start-prod:
	docker-compose up -d radiocalico-prod

logs-prod:
	docker-compose logs -f radiocalico-prod

shell-prod:
	docker-compose exec radiocalico-prod sh

# Production deployment (using prod compose file)
deploy:
	docker-compose -f docker-compose.prod.yml up -d

deploy-build:
	docker-compose -f docker-compose.prod.yml up -d --build

# General commands
stop:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v --rmi all

restart-dev:
	docker-compose restart radiocalico-dev

restart-prod:
	docker-compose restart radiocalico-prod

# Testing
test:
	docker-compose run --rm radiocalico-dev npm test

test-watch:
	docker-compose run --rm radiocalico-dev npm run test:watch

test-coverage:
	docker-compose run --rm radiocalico-dev npm run test:coverage

# Health checks
health-dev:
	docker inspect --format='{{json .State.Health}}' radiocalico-dev

health-prod:
	docker inspect --format='{{json .State.Health}}' radiocalico-prod

# Build both
build-all:
	docker-compose build

# Start both dev and prod
start-all:
	docker-compose up -d

# Docker cleanup
prune:
	docker system prune -f

prune-all:
	docker system prune -af --volumes
