#!/usr/bin/env node

/**
 * Build script for Netlify deployment
 * This script builds both frontend and backend for Netlify Functions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building IntraDay Trading Dashboard for Netlify...');

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build frontend with Vite
  console.log('🏗️  Building frontend...');
  execSync('npm run build:client', { stdio: 'inherit' });

  // Build backend for Netlify Functions
  console.log('🔧 Building backend for Netlify Functions...');
  execSync('npm run build:server', { stdio: 'inherit' });

  // Create Netlify Functions structure
  console.log('📁 Creating Netlify Functions structure...');
  const functionsDir = path.join(__dirname, 'dist', '.netlify', 'functions');
  fs.mkdirSync(functionsDir, { recursive: true });

  // Copy server build to functions
  const serverPath = path.join(__dirname, 'dist', 'index.js');
  const functionPath = path.join(functionsDir, 'index.js');
  
  if (fs.existsSync(serverPath)) {
    fs.copyFileSync(serverPath, functionPath);
    console.log('✅ Backend copied to Netlify Functions');
  }

  // Create _redirects file for SPA routing
  const redirectsContent = `
/api/* /.netlify/functions/index/:splat 200
/* /index.html 200
`;
  
  fs.writeFileSync(path.join(__dirname, 'dist', 'public', '_redirects'), redirectsContent.trim());
  console.log('✅ Created _redirects file');

  // Environment configuration reminder
  console.log(`
🎉 Build completed successfully!

📋 Before deploying to Netlify:
1. Upload the 'dist/public' folder contents to Netlify
2. Set up these environment variables in Netlify dashboard:
   - NODE_ENV=production
   - VITE_GOOGLE_SHEET_ID=your_sheet_id
   - VITE_GOOGLE_SCRIPT_URL=your_script_url

🔗 Deploy steps:
1. Connect your repository to Netlify
2. Set build command: npm run build:netlify
3. Set publish directory: dist/public
4. Add environment variables
5. Deploy!

⚡ Your trading dashboard will be live at: https://your-site-name.netlify.app
`);

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}