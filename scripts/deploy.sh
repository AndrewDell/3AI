#!/bin/bash
# scripts/deploy.sh
# This script automates the deployment process for the 3AI application.
# It builds the Docker image, runs tests, and deploys the container to the desired environment.
# Best practices include error handling, logging, and using environment variables for configuration.

set -e  # Exit immediately if a command exits with a non-zero status.
set -o pipefail  # Return the exit status of the last command in the pipeline that failed.

echo "Starting deployment process for 3AI..."

# Run tests before deployment
echo "Running tests..."
pytest tests/ --maxfail=1 --disable-warnings -q

# Build the Docker image
echo "Building Docker image..."
docker build -t agentdock -f docker/Dockerfile .

# Optionally, tag and push the image to a Docker registry
# IMAGE_TAG="your-dockerhub-username/agentdock:latest"
# docker tag agentdock $IMAGE_TAG
# docker push $IMAGE_TAG

# Deploy using docker-compose
echo "Deploying with docker-compose..."
docker-compose -f docker/docker-compose.yml up --build -d

echo "Deployment completed successfully."
