const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Student ID System with Global Access...\n');

// Start the backend server
console.log('📡 Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Wait a bit for backend to start
setTimeout(() => {
  console.log('\n🌐 Starting ngrok tunnel...');
  
  // Start ngrok with warning bypass
  const ngrok = spawn('ngrok', ['http', '5000', '--host-header=localhost:5000'], {
    stdio: 'pipe',
    shell: true
  });

  let ngrokUrl = '';
  
  ngrok.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('ngrok:', output);
    
    // Extract the public URL
    const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.ngrok-free\.app/);
    if (urlMatch && !ngrokUrl) {
      ngrokUrl = urlMatch[0];
      console.log(`\n✅ Global URL: ${ngrokUrl}`);
      console.log(`📱 QR codes will work from anywhere!`);
      
      // Update the .env file with ngrok URL
      updateEnvFile(ngrokUrl);
    }
  });

  ngrok.stderr.on('data', (data) => {
    console.error('ngrok error:', data.toString());
  });

}, 3000);

function updateEnvFile(ngrokUrl) {
  const envPath = path.join(__dirname, '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace APP_URL with ngrok URL
  envContent = envContent.replace(/APP_URL=.*/, `APP_URL=${ngrokUrl}`);
  
  fs.writeFileSync(envPath, envContent);
  console.log(`📝 Updated .env with: APP_URL=${ngrokUrl}`);
  
  // Also update frontend .env
  const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env');
  let frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');
  frontendEnvContent = frontendEnvContent.replace(/VITE_API_URL=.*/, `VITE_API_URL=${ngrokUrl}`);
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log(`📝 Updated frontend .env with: VITE_API_URL=${ngrokUrl}`);
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  backend.kill();
  process.exit();
});