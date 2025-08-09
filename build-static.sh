#!/bin/bash
# Static build script for Netlify deployment (frontend only)
# This builds only the frontend React app for static hosting

echo "Building static frontend for Netlify deployment..."

# Make sure we're using local node_modules binaries
export PATH="./node_modules/.bin:$PATH"

# Set production environment
export NODE_ENV=production

# Clean previous builds
rm -rf dist

# Build frontend with Vite - this creates dist/public by default
echo "Building React frontend with Vite..."
npx vite build

# Move files from dist/public to dist root for Netlify (if needed)
if [ -d "dist/public" ]; then
  echo "Restructuring build output..."
  # Move all files from dist/public to dist
  mv dist/public/* dist/
  # Remove empty public directory
  rmdir dist/public
fi

# Ensure we only have the frontend build, no backend files
echo "Cleaning up build output for static deployment..."
if [ -f "dist/index.js" ]; then
  echo "Removing backend index.js file..."
  rm dist/index.js
fi

# Ensure we only have the frontend build, no backend files
echo "Cleaning up build output for static deployment..."

# Create _redirects file for SPA routing
echo "Creating _redirects file for React Router..."
cat > dist/_redirects << 'EOF'
# Redirect all routes to index.html for React Router
/*    /index.html   200
EOF

echo "Static build completed successfully!"
echo "✅ Deploy the 'dist' folder to Netlify"
echo "✅ Make sure to set 'dist' as your publish directory in Netlify"