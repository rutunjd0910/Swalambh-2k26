/**
 * Comprehensive Test Suite for FHIR Flow Pipeline
 * Performs white-box and black-box testing
 * Self-deletes on successful completion
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// ===============================
// UTILITY FUNCTIONS
// ===============================

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  if (passed) {
    log(`✓ ${name}`, 'green');
    testResults.passed++;
  } else {
    log(`✗ ${name}`, 'red');
    if (details) log(`  ${details}`, 'yellow');
    testResults.failed++;
    testResults.errors.push({ test: name, details });
  }
}

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===============================
// BLACK BOX TESTS - API Endpoints
// ===============================

async function testHealthEndpoints() {
  log('\n🔍 BLACK BOX TEST: Health Endpoints', 'cyan');
  
  const services = [
    { name: 'Ingestion', port: 3001 },
    { name: 'OCR', port: 3002 },
    { name: 'NLP', port: 3003 },
    { name: 'Validation', port: 3004 },
    { name: 'Mapping', port: 3005 }
  ];

  for (const service of services) {
    try {
      const res = await makeRequest({
        hostname: 'localhost',
        port: service.port,
        path: '/health',
        method: 'GET'
      });
      
      logTest(
        `${service.name} Service Health Check`,
        res.status === 200 && res.data && res.data.status === 'ok',
        res.status !== 200 ? `Status: ${res.status}` : ''
      );
    } catch (err) {
      logTest(`${service.name} Service Health Check`, false, `Service not running: ${err.message}`);
    }
  }
}

async function testGatewayEndpoints() {
  log('\n🔍 BLACK BOX TEST: Gateway API Endpoints', 'cyan');

  // Test stats endpoint
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/stats',
      method: 'GET'
    });
    
    logTest(
      'Stats API',
      res.status === 200 && res.data && 'patients' in res.data,
      res.status !== 200 ? `Status: ${res.status}` : ''
    );
  } catch (err) {
    logTest('Stats API', false, err.message);
  }

  // Test activity endpoint
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/activity',
      method: 'GET'
    });
    
    logTest(
      'Activity Feed API',
      res.status === 200 && res.data && Array.isArray(res.data.activity),
      res.status !== 200 ? `Status: ${res.status}` : ''
    );
  } catch (err) {
    logTest('Activity Feed API', false, err.message);
  }

  // Test patients endpoint
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/patients',
      method: 'GET'
    });
    
    const hasSeedData = res.data && res.data.patients && res.data.patients.length >= 3;
    logTest(
      'Patients API with Seed Data',
      res.status === 200 && hasSeedData,
      !hasSeedData ? 'Seed patients not found' : ''
    );
  } catch (err) {
    logTest('Patients API', false, err.message);
  }

  // Test uploads endpoint
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/uploads',
      method: 'GET'
    });
    
    logTest(
      'Uploads API',
      res.status === 200 && res.data && Array.isArray(res.data.uploads),
      res.status !== 200 ? `Status: ${res.status}` : ''
    );
  } catch (err) {
    logTest('Uploads API', false, err.message);
  }

  // Test resources endpoint
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/resources',
      method: 'GET'
    });
    
    logTest(
      'Resources API',
      res.status === 200 && res.data && Array.isArray(res.data.resources),
      res.status !== 200 ? `Status: ${res.status}` : ''
    );
  } catch (err) {
    logTest('Resources API', false, err.message);
  }
}

async function testPipelineEndToEnd() {
  log('\n🔍 BLACK BOX TEST: End-to-End Pipeline', 'cyan');

  const testDocument = {
    document: {
      documentId: `test-${Date.now()}`,
      sourceType: 'test-suite',
      contentType: 'clinical_note',
      content: 'Patient: Test User\nAge: 28\nGender: male\nBP: 115/75 mmHg\nLab: Hemoglobin 14.5 g/dL'
    }
  };

  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/process',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testDocument);

    const hasPatientResource = res.data && 
                               res.data.output &&
                               res.data.output.fhirVersion === 'R4' &&
                               Array.isArray(res.data.output.resources) &&
                               res.data.output.resources.some(r => r.resourceType === 'Patient');

    logTest(
      'Full Pipeline Processing',
      res.status === 200 && hasPatientResource,
      !hasPatientResource ? 'No Patient resource in output' : ''
    );

    // Verify patient was stored
    await sleep(500);
    const patientsRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/patients',
      method: 'GET'
    });

    const testPatientStored = patientsRes.data && 
                              patientsRes.data.patients &&
                              patientsRes.data.patients.some(p => p.displayName === 'Test User');

    logTest(
      'Patient Data Persistence',
      testPatientStored,
      !testPatientStored ? 'Patient not found in store' : ''
    );

  } catch (err) {
    logTest('Full Pipeline Processing', false, err.message);
  }
}

async function testImageUpload() {
  log('\n🔍 BLACK BOX TEST: Image Upload', 'cyan');

  // Test with base64 encoded test image
  const testImageDocument = {
    document: {
      documentId: `img-test-${Date.now()}`,
      sourceType: 'test-suite',
      contentType: 'clinical_note',
      fileName: 'test-image.png',
      mimeType: 'image/png',
      fileContent: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      content: 'Patient: Image Test\nAge: 30\nGender: female\nBP: 118/78 mmHg'
    }
  };

  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/process',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testImageDocument);

    logTest(
      'Image Upload Processing',
      res.status === 200 && res.data && res.data.output && res.data.output.fhirVersion === 'R4',
      res.status !== 200 ? `Status: ${res.status}` : ''
    );

    // Check if image was stored in patient profile
    await sleep(500);
    const patientsRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/patients',
      method: 'GET'
    });

    const imagePatient = patientsRes.data && 
                         patientsRes.data.patients &&
                         patientsRes.data.patients.find(p => p.displayName === 'Image Test');

    const hasImageUploads = imagePatient && 
                           imagePatient.uploads && 
                           imagePatient.uploads.length > 0;

    logTest(
      'Image Storage in Patient Profile',
      hasImageUploads,
      !hasImageUploads ? 'No images found in patient uploads' : ''
    );

  } catch (err) {
    logTest('Image Upload Processing', false, err.message);
  }
}

// ===============================
// WHITE BOX TESTS - Internal Structure
// ===============================

async function testIndividualServices() {
  log('\n🔍 WHITE BOX TEST: Individual Service Logic', 'cyan');

  // Test Ingestion Service
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/ingest',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      documentId: 'whitebox-1',
      sourceType: 'test',
      contentType: 'lab_report',
      content: 'Test content'
    });

    logTest(
      'Ingestion Service Logic',
      res.status === 200 && res.data && res.data.docType,
      res.status !== 200 ? `Status: ${res.status}` : ''
    );
  } catch (err) {
    logTest('Ingestion Service Logic', false, err.message);
  }

  // Test OCR Service
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/ocr',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      documentId: 'whitebox-2',
      content: 'Plain text content for OCR',
      docType: 'clinical_note'
    });

    logTest(
      'OCR Service Logic',
      res.status === 200 && res.data && Array.isArray(res.data.textSegments),
      res.status !== 200 ? `Status: ${res.status}` : ''
    );
  } catch (err) {
    logTest('OCR Service Logic', false, err.message);
  }

  // Test NLP Service
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/nlp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      documentId: 'whitebox-3',
      docType: 'clinical_note',
      textSegments: [
        { id: 'seg-1', text: 'Patient: John Doe', confidence: 0.9, page: 1 },
        { id: 'seg-2', text: 'Age: 35', confidence: 0.9, page: 1 },
        { id: 'seg-3', text: 'Gender: male', confidence: 0.9, page: 1 },
        { id: 'seg-4', text: 'BP: 120/80 mmHg', confidence: 0.9, page: 1 }
      ]
    });

    const hasExtractedFields = res.data && 
                               res.data.extracted &&
                               res.data.extracted.patientName === 'John Doe';

    logTest(
      'NLP Service Field Extraction',
      res.status === 200 && hasExtractedFields,
      !hasExtractedFields ? 'Field extraction failed' : ''
    );
  } catch (err) {
    logTest('NLP Service Logic', false, err.message);
  }

  // Test Validation Service
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3004,
      path: '/validate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      documentId: 'whitebox-4',
      extracted: {
        patientName: 'Jane Doe',
        age: 25,
        gender: 'female',
        bloodPressure: { systolic: 110, diastolic: 70 }
      },
      trace: []
    });

    logTest(
      'Validation Service Logic',
      res.status === 200 && res.data && Array.isArray(res.data.warnings),
      res.status !== 200 ? `Status: ${res.status}` : ''
    );
  } catch (err) {
    logTest('Validation Service Logic', false, err.message);
  }

  // Test Mapping Service
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3005,
      path: '/map',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      documentId: 'whitebox-5',
      validated: {
        patientName: 'Bob Smith',
        age: 40,
        gender: 'male'
      },
      warnings: [],
      trace: []
    });

    const hasFHIRResources = res.data && 
                            res.data.fhirVersion === 'R4' &&
                            Array.isArray(res.data.resources) &&
                            res.data.resources.length > 0;

    logTest(
      'Mapping Service FHIR Generation',
      res.status === 200 && hasFHIRResources,
      !hasFHIRResources ? 'No FHIR resources generated' : ''
    );
  } catch (err) {
    logTest('Mapping Service Logic', false, err.message);
  }
}

async function testDataStores() {
  log('\n🔍 WHITE BOX TEST: Data Store Operations', 'cyan');

  // Test patient store operations
  const initialStats = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/stats',
    method: 'GET'
  });

  const initialPatientCount = initialStats.data ? initialStats.data.patients : 0;

  // Add a new patient
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/process',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    document: {
      documentId: `store-test-${Date.now()}`,
      sourceType: 'test',
      contentType: 'clinical_note',
      content: 'Patient: Store Test Patient\nAge: 33\nGender: male'
    }
  });

  await sleep(500);

  const updatedStats = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/stats',
    method: 'GET'
  });

  const updatedPatientCount = updatedStats.data ? updatedStats.data.patients : 0;

  logTest(
    'Patient Store - Add Operations',
    updatedPatientCount > initialPatientCount,
    `Expected count increase, got ${initialPatientCount} → ${updatedPatientCount}`
  );

  // Test upload store
  logTest(
    'Upload Store Tracking',
    updatedStats.data && updatedStats.data.uploads > 0,
    'No uploads tracked'
  );

  // Test resource store
  logTest(
    'Resource Store Tracking',
    updatedStats.data && updatedStats.data.resources > 0,
    'No resources tracked'
  );

  // Test activity feed
  const activityRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/activity',
    method: 'GET'
  });

  logTest(
    'Activity Feed Logging',
    activityRes.data && activityRes.data.activity && activityRes.data.activity.length > 0,
    'No activity logged'
  );
}

async function testUIAccessibility() {
  log('\n🔍 WHITE BOX TEST: UI File Accessibility', 'cyan');

  const uiFiles = [
    '/index.html',
    '/patients.html',
    '/uploads.html',
    '/resources.html',
    '/health.html',
    '/styles.css',
    '/app.js',
    '/app-shell.js',
    '/app-shell.css'
  ];

  for (const file of uiFiles) {
    try {
      const res = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: file,
        method: 'GET'
      });

      logTest(
        `UI File: ${file}`,
        res.status === 200,
        res.status !== 200 ? `Status: ${res.status}` : ''
      );
    } catch (err) {
      logTest(`UI File: ${file}`, false, err.message);
    }
  }
}

// ===============================
// ERROR HANDLING & AUTO-FIX
// ===============================

async function attemptAutoFix() {
  log('\n🔧 ATTEMPTING AUTO-FIX...', 'yellow');

  const commonIssues = [
    {
      check: async () => {
        try {
          await makeRequest({ hostname: 'localhost', port: 3000, path: '/api/stats', method: 'GET' });
          return false;
        } catch {
          return true;
        }
      },
      fix: 'Gateway service not running. Please start with: npm run start:gateway',
      fixable: false
    }
  ];

  for (const issue of commonIssues) {
    if (await issue.check()) {
      if (issue.fixable) {
        log(`✓ Fixed: ${issue.fix}`, 'green');
      } else {
        log(`⚠ Manual fix required: ${issue.fix}`, 'yellow');
      }
    }
  }
}

// ===============================
// MAIN TEST RUNNER
// ===============================

async function runAllTests() {
  log(`\n${'='.repeat(60)}`, 'bold');
  log('FHIR FLOW COMPREHENSIVE TEST SUITE', 'bold');
  log('White Box + Black Box Testing', 'cyan');
  log(`${'='.repeat(60)}\n`, 'bold');

  try {
    // Black Box Tests
    await testHealthEndpoints();
    await testGatewayEndpoints();
    await testPipelineEndToEnd();
    await testImageUpload();

    // White Box Tests
    await testIndividualServices();
    await testDataStores();
    await testUIAccessibility();

    // Results Summary
    log(`\n${'='.repeat(60)}`, 'bold');
    log('TEST RESULTS SUMMARY', 'bold');
    log(`${'='.repeat(60)}`, 'bold');
    log(`✓ Passed: ${testResults.passed}`, 'green');
    log(`✗ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
    log(`Total: ${testResults.passed + testResults.failed}`, 'cyan');

    if (testResults.failed > 0) {
      log('\n❌ FAILED TESTS:', 'red');
      testResults.errors.forEach((err, i) => {
        log(`  ${i + 1}. ${err.test}`, 'yellow');
        if (err.details) log(`     ${err.details}`, 'yellow');
      });

      await attemptAutoFix();
      
      log('\n⚠ Tests failed. Tester will NOT self-delete.', 'yellow');
      process.exit(1);
    } else {
      log('\n✅ ALL TESTS PASSED!', 'green');
      log('🎉 System is working correctly!', 'green');
      
      // Self-delete
      log('\n🗑️  Self-deleting test suite...', 'cyan');
      await sleep(2000);
      
      const selfPath = path.join(__dirname, 'test-suite.js');
      fs.unlinkSync(selfPath);
      
      log('✓ Test suite deleted successfully!', 'green');
      log('💻 Your FHIR Flow system is production-ready!', 'bold');
      process.exit(0);
    }

  } catch (err) {
    log(`\n💥 CRITICAL ERROR: ${err.message}`, 'red');
    log(err.stack, 'yellow');
    process.exit(1);
  }
}

// Run tests
runAllTests();
