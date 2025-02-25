# PowerShell script for building Docker images
# Ensures proper environment setup for Windows users

Write-Host "Setting up Docker BuildKit environment..." -ForegroundColor Cyan

# Set BuildKit environment variables
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1

# Move to parent directory
Push-Location ..

# Build with parallel jobs and cache
Write-Host "Building Docker images with optimized settings..." -ForegroundColor Green
docker-compose -f docker/docker-compose.yml build --parallel

# Return to original directory
Pop-Location

Write-Host "Build complete! Run 'docker-compose -f docker/docker-compose.yml up' to start services" -ForegroundColor Cyan 