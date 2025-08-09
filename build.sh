#!/bin/bash
# Build script for deployment platforms
# This ensures vite and esbuild are found from node_modules

# Make sure we're using local node_modules binaries
export PATH="./node_modules/.bin:$PATH"

# Build frontend with Vite
echo "Building frontend..."
npx vite build

# Build backend with esbuild
echo "Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"