# Deployment Guide for IntraDay Trading Dashboard

## Quick Fix for Build Issues

If you're getting `vite: not found` or `esbuild: not found` errors during deployment, use one of these solutions:

### Option 1: Use the Build Script (Recommended)
```bash
./build.sh
```

### Option 2: Manual Build Commands
```bash
# Make sure to use npx to find local binaries
npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

### Option 3: Set PATH for Build
```bash
export PATH="./node_modules/.bin:$PATH"
vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

## Deployment Platforms

### 1. Netlify Deployment

Create a `netlify.toml` file:
```toml
[build]
  command = "./build.sh"
  publish = "dist/public"
  functions = "dist"

[build.environment]
  NODE_VERSION = "20"

[[functions]]
  from = "dist"
  to = "/.netlify/functions/"

[dev]
  command = "npm run dev"
  port = 5000
```

**Build Settings:**
- Build command: `./build.sh`
- Publish directory: `dist/public`
- Node version: 20

### 2. Vercel Deployment

Create a `vercel.json` file:
```json
{
  "version": 2,
  "buildCommand": "./build.sh",
  "outputDirectory": "dist/public",
  "functions": {
    "dist/index.js": {
      "runtime": "nodejs20.x"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/dist/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/public/$1"
    }
  ]
}
```

### 3. Railway Deployment

Create a `Procfile`:
```
web: NODE_ENV=production node dist/index.js
```

Railway will automatically run the build command from package.json.

### 4. Render Deployment

**Build Settings:**
- Build Command: `./build.sh`
- Start Command: `NODE_ENV=production node dist/index.js`
- Node Version: 20

### 5. Heroku Deployment

Create a `Procfile`:
```
web: NODE_ENV=production node dist/index.js
```

Add this to your package.json scripts (if allowed):
```json
{
  "scripts": {
    "heroku-postbuild": "./build.sh"
  }
}
```

## Environment Variables

Make sure to set these environment variables on your deployment platform:

### Required Variables
- `NODE_ENV=production`
- `VITE_GOOGLE_SHEET_ID` - Your Google Sheet ID (can be set via app UI)
- `VITE_GOOGLE_SCRIPT_URL` - Your Google Apps Script URL (can be set via app UI)

### Optional Variables
- `PORT` - Server port (defaults to 5000)

## Build Output Structure

After running the build script, you'll have:
```
dist/
├── index.js          # Backend server bundle
└── public/           # Frontend static files
    ├── index.html
    ├── assets/
    │   ├── index-[hash].css
    │   └── index-[hash].js
    └── [other assets]
```

## Common Issues and Fixes

### Issue: "vite: not found" during build
**Solution:** Use `npx vite build` or the provided build script

### Issue: "esbuild: not found" during build  
**Solution:** Use `npx esbuild` or the provided build script

### Issue: Build succeeds but app doesn't start
**Solution:** Check that `NODE_ENV=production` is set and `dist/index.js` exists

### Issue: Static files not loading
**Solution:** Ensure your deployment platform serves files from `dist/public`

### Issue: API routes returning 404
**Solution:** Configure your platform to proxy `/api/*` requests to the backend

## Testing the Build Locally

1. Run the build:
   ```bash
   ./build.sh
   ```

2. Start the production server:
   ```bash
   NODE_ENV=production node dist/index.js
   ```

3. Open `http://localhost:5000` to test

## Google Sheets Integration Setup

After deployment, configure your Google Sheets integration:

1. Go to Settings page in your deployed app
2. Enter your Google Sheet ID
3. Enter your Google Apps Script URL
4. Test the connection

The app will work without Google Sheets integration, but data won't persist between sessions.

## Performance Optimization

The build includes:
- ✅ Frontend minification and bundling
- ✅ Backend bundling with tree-shaking
- ✅ CSS optimization
- ✅ Asset optimization

For better performance:
- Enable gzip compression on your server
- Set up a CDN for static assets
- Configure caching headers

## Support

If you continue to have deployment issues:
1. Check the build logs for specific error messages
2. Verify all dependencies are installed
3. Ensure Node.js version 18+ is being used
4. Try the manual build commands locally first