#!/usr/bin/env node

/**
 * FHIR Flow - Setup Verification Script
 * Run this after cloning to verify your environment is ready
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 FHIR Flow Setup Verification\n');
console.log('=' .repeat(50));

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Helper to run shell commands
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Helper to check file exists
function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

// Check Node.js version
async function checkNodeVersion() {
  try {
    const version = await runCommand('node --version');
    const major = parseInt(version.slice(1).split('.')[0]);
    
    if (major >= 18) {
      console.log(`✅ Node.js ${version} (>= 18 required)`);
      checks.passed++;
    } else {
      console.log(`❌ Node.js ${version} - Please upgrade to Node.js 18 or higher`);
      checks.failed++;
    }
  } catch (error) {
    console.log('❌ Node.js not found - Please install Node.js 18+');
    checks.failed++;
  }
}

// Check npm version
async function checkNpmVersion() {
  try {
    const version = await runCommand('npm --version');
    const major = parseInt(version.split('.')[0]);
    
    if (major >= 9) {
      console.log(`✅ npm ${version} (>= 9 required)`);
      checks.passed++;
    } else {
      console.log(`⚠️  npm ${version} - Consider upgrading to npm 9+`);
      checks.warnings++;
    }
  } catch (error) {
    console.log('❌ npm not found');
    checks.failed++;
  }
}

// Check Git installation
async function checkGit() {
  try {
    const version = await runCommand('git --version');
    console.log(`✅ ${version}`);
    checks.passed++;
  } catch (error) {
    console.log('⚠️  Git not found - Recommended for version control');
    checks.warnings++;
  }
}

// Check project structure
function checkProjectStructure() {
  console.log('\n📁 Checking project structure...\n');
  
  const requiredFiles = [
    'package.json',
    'README.md',
    'services/gateway-api/package.json',
    'services/ingestion-service/package.json',
    'services/ocr-service/package.json',
    'services/nlp-service/package.json',
    'services/validation-service/package.json',
    'services/mapping-service/package.json'
  ];
  
  requiredFiles.forEach(file => {
    if (fileExists(file)) {
      console.log(`✅ ${file}`);
      checks.passed++;
    } else {
      console.log(`❌ ${file} - Missing!`);
      checks.failed++;
    }
  });
}

// Check dependencies
function checkDependencies() {
  console.log('\n📦 Checking dependencies...\n');
  
  if (fileExists('node_modules')) {
    console.log('✅ node_modules exists');
    checks.passed++;
    
    // Check critical packages
    const criticalPackages = ['express', 'tesseract.js', 'pdf-parse', 'concurrently'];
    criticalPackages.forEach(pkg => {
      if (fileExists(`node_modules/${pkg}`)) {
        console.log(`✅ ${pkg} installed`);
        checks.passed++;
      } else {
        console.log(`❌ ${pkg} not installed`);
        checks.failed++;
      }
    });
  } else {
    console.log('❌ node_modules not found');
    console.log('   Run: npm install');
    checks.failed++;
  }
}

// Check ports availability
async function checkPorts() {
  console.log('\n🔌 Checking port availability...\n');
  
  const ports = [3000, 3001, 3002, 3003, 3004, 3005];
  
  for (const port of ports) {
    try {
      // Try to fetch health endpoint (if service is running)
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/health',
        method: 'GET',
        timeout: 1000
      };
      
      await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          if (res.statusCode === 200) {
            console.log(`✅ Port ${port} - Service running`);
            checks.passed++;
            resolve();
          } else {
            reject();
          }
        });
        req.on('error', reject);
        req.on('timeout', reject);
        req.end();
      });
    } catch (error) {
      console.log(`✅ Port ${port} - Available`);
      checks.passed++;
    }
  }
}

// Check documentation
function checkDocumentation() {
  console.log('\n📚 Checking documentation...\n');
  
  const docs = [
    'README.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'CHANGELOG.md',
    'QUICK_START.md',
    'DEPLOYMENT.md'
  ];
  
  docs.forEach(doc => {
    if (fileExists(doc)) {
      console.log(`✅ ${doc}`);
      checks.passed++;
    } else {
      console.log(`⚠️  ${doc} - Missing (optional)`);
      checks.warnings++;
    }
  });
}

// Main verification function
async function verify() {
  console.log('🔍 Verifying environment...\n');
  
  await checkNodeVersion();
  await checkNpmVersion();
  await checkGit();
  
  checkProjectStructure();
  checkDependencies();
  
  await checkPorts();
  
  checkDocumentation();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Verification Summary:\n');
  console.log(`   ✅ Passed: ${checks.passed}`);
  console.log(`   ❌ Failed: ${checks.failed}`);
  console.log(`   ⚠️  Warnings: ${checks.warnings}`);
  console.log('\n' + '='.repeat(50));
  
  if (checks.failed > 0) {
    console.log('\n❌ Setup verification failed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Install Node.js 18+ if not installed');
    console.log('   2. Run: npm install');
    console.log('   3. Run this script again: node verify-setup.js');
    process.exit(1);
  } else if (checks.warnings > 0) {
    console.log('\n✅ Setup verification passed with warnings!');
    console.log('\n🚀 You can start the services with: npm run start:all');
    process.exit(0);
  } else {
    console.log('\n✅ Perfect! Everything is ready!');
    console.log('\n🚀 Start the services:');
    console.log('   npm run start:all');
    console.log('\n📖 Then open: http://localhost:3000');
    process.exit(0);
  }
}

// Run verification
verify().catch(error => {
  console.error('\n❌ Verification script error:', error.message);
  process.exit(1);
});
