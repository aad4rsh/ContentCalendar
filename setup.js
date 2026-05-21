// Setup script to generate config.js from .env file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Copy .env.example to .env and fill in your credentials.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

// Validate required variables
if (!envVars.SUPABASE_URL || !envVars.SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
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
console.log('✅ config.js generated from .env');
