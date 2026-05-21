// Setup script to generate config.js from .env file or environment variables
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determine if running on Vercel
const isVercel = process.env.VERCEL === '1';

let envVars = {};

if (isVercel) {
  // On Vercel: read from environment variables
  envVars.SUPABASE_URL = process.env.SUPABASE_URL;
  envVars.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
} else {
  // Locally: read from .env file
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Copy .env.example to .env and fill in your credentials.');
    console.error('   Run: cp .env.example .env');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
}

// Validate required variables
if (!envVars.SUPABASE_URL || !envVars.SUPABASE_ANON_KEY) {
  const source = isVercel ? 'Vercel environment variables' : '.env file';
  console.error(`❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in ${source}`);
  process.exit(1);
}

// Generate config.js
const configContent = `// This file is generated - do not edit manually
// Update .env file and run: node setup.js

window.CONFIG = {
  SUPABASE_URL: '${envVars.SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${envVars.SUPABASE_ANON_KEY}'
};
`;

const configPath = path.join(__dirname, 'config.js');
fs.writeFileSync(configPath, configContent);
console.log('✅ config.js generated successfully');
