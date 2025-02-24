#!/bin/bash

# Enable BuildKit
export DOCKER_BUILDKIT=1

# Pull the latest base image
docker pull python:3.10-slim

# Build with optimized settings
docker-compose build \
  --parallel \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --build-arg PIP_NO_CACHE_DIR=1 \
  --build-arg PYTHONDONTWRITEBYTECODE=1

# Tag for caching
docker tag agentdock:latest agentdock:cache 