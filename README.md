# 🏥 FHIR Flow - Medical Document Processing System

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Hackathon Ready](https://img.shields.io/badge/Hackathon-Ready-orange.svg)]()

**FHIR Flow** is a complete medical document processing system that converts unstructured clinical documents (PDFs, images, text) into structured FHIR R4 JSON resources. Built for hackathons and prototyping, it requires **no paid APIs** and runs entirely locally.

## ✨ Features

- 🔄 **Complete Pipeline**: 6-microservice architecture for document processing
- 📄 **OCR Support**: Extract text from images (tesseract.js) and PDFs (pdf-parse)
- 🧠 **Smart NLP**: Extract patient demographics and ALL lab test values as structured data
- 👥 **Patient Profiles**: Automatic profile creation with flexible validation
- 📊 **FHIR R4 Compliant**: Generate standard-compliant Patient and Observation resources
- 🎨 **Beautiful UI**: Multi-page interface with drag-and-drop upload
- 🔍 **Real-time Monitoring**: Activity feed with live statistics
- ✅ **Comprehensive Testing**: 32 automated tests (white-box + black-box)
- 🚀 **One-Command Start**: Launch all services simultaneously

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** (for cloning the repository)

### Verify Installation

```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/fhir-flow.git
cd fhir-flow
```

### 2. Install Dependencies

```bash
npm install
```

This command installs all dependencies for:
- Root workspace (concurrently for parallel service execution)
- 6 microservices (Express.js, tesseract.js, pdf-parse)
- 3 shared packages (utilities, FHIR models, mapping config)

**Installation takes 2-3 minutes** due to tesseract.js language data (~35MB).

---

## ⚡ Quick Start

### Start All Services (Recommended)

```bash
npm run start:all
```

This starts all 6 microservices in parallel:
- ✅ Ingestion Service (Port 3001)
- ✅ OCR Service (Port 3002)
- ✅ NLP Service (Port 3003)
- ✅ Validation Service (Port 3004)
- ✅ Mapping Service (Port 3005)
- ✅ Gateway API (Port 3000)

**Wait 10-15 seconds** for all services to start.

### Access the UI

Open your browser and navigate to:

🌐 **http://localhost:3000**

---

## 📁 Project Structure

```
fhir-flow/
├── services/                    # Microservices
│   ├── gateway-api/             # Main API & UI (Port 3000)
│   │   ├── src/
│   │   │   ├── index.js         # Express server & patient store
│   │   │   └── public/          # Frontend HTML/CSS/JS
│   │   └── package.json
│   ├── ingestion-service/       # Document classification (Port 3001)
│   ├── ocr-service/             # Text extraction (Port 3002)
│   ├── nlp-service/             # Clinical data extraction (Port 3003)
│   ├── validation-service/      # Data validation (Port 3004)
│   └── mapping-service/         # FHIR resource mapping (Port 3005)
│
├── packages/                    # Shared libraries
│   ├── shared-utils/            # Common utilities
│   ├── fhir-models/             # FHIR R4 resource builders
│   └── mapping-config/          # LOINC/SNOMED mapping
│
├── images/                      # Test medical documents
│   └── Screenshot*.png          # Sample lab reports
│
├── test-suite.js                # Comprehensive test suite
├── package.json                 # Workspace configuration
├── README.md                    # This file
└── .gitignore                   # Git ignore rules
```

---

## 📖 Usage Guide

### 1. Upload Documents

#### Via Web UI (Recommended)
1. Open http://localhost:3000
2. Click **"Choose File"** or drag-and-drop a document
3. Supported formats: **PDF**, **PNG**, **JPG**, **JPEG**, **TXT**
4. Click **"Upload & Process"**

#### Via API (cURL)
```bash
# Text document
curl -X POST http://localhost:3000/process \
  -H "Content-Type: application/json" \
  -d '{
    "document": {
      "documentId": "doc-001",
      "sourceType": "scanner",
      "contentType": "lab_report",
      "content": "Patient: John Doe\nAge: 45\nGender: male\nHemoglobin: 15 g/dl"
    }
  }'
```

```bash
# Image file (base64 encoded)
curl -X POST http://localhost:3000/process \
  -H "Content-Type: application/json" \
  -d '{
    "document": {
      "documentId": "doc-002",
      "sourceType": "mobile_camera",
      "contentType": "lab_report",
      "fileName": "lab-report.png",
      "fileContent": "data:image/png;base64,iVBORw0KG..."
    }
  }'
```

### 2. View Patient Profiles

Navigate to **http://localhost:3000/patients.html** to see:
- All created patient profiles
- Extracted demographics (name, age, gender)
- ALL lab tests with values and units
- Uploaded document images
- Last update timestamp

### 3. Monitor System Activity

- **Activity Feed**: http://localhost:3000 (right panel)
- **All Uploads**: http://localhost:3000/uploads.html
- **FHIR Resources**: http://localhost:3000/resources.html
- **Service Health**: http://localhost:3000/health.html

---

## 🔌 API Reference

### Gateway API (Port 3000)

#### POST `/process`
Process a clinical document through the complete pipeline.

**Request Body:**
```json
{
  "document": {
    "documentId": "doc-123",
    "sourceType": "scanner",
    "contentType": "lab_report",
    "content": "Patient: Jane Doe\nAge: 45...",
    "fileName": "optional-file.png",
    "fileContent": "data:image/png;base64,..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "patientId": "jane doe",
  "profile": {
    "id": "jane doe",
    "displayName": "Jane Doe",
    "demographics": { "age": 45, "gender": "female" },
    "resources": [...],
    "uploads": [...]
  }
}
```

#### GET `/api/patients`
List all patient profiles.

#### GET `/api/patients/:id`
Get specific patient profile with all FHIR resources.

#### GET `/api/activity`
Get last 20 activity feed items.

### Individual Services

- **Ingestion** (3001): `POST /classify`
- **OCR** (3002): `POST /extract-text`
- **NLP** (3003): `POST /extract-fields`
- **Validation** (3004): `POST /validate`
- **Mapping** (3005): `POST /map-to-fhir`

---

## ✅ Testing

### Run Automated Tests

```bash
node test-suite.js
```

The test suite performs **32 comprehensive tests**:

#### Black-Box Tests (API Testing)
- ✅ Gateway API health check
- ✅ Document processing pipeline
- ✅ Patient profile creation
- ✅ Multiple patient handling
- ✅ Missing field handling
- ✅ Invalid input rejection

#### White-Box Tests (Service Testing)
- ✅ Each service health endpoint
- ✅ Service-to-service communication
- ✅ OCR text extraction from images
- ✅ NLP field extraction accuracy
- ✅ FHIR resource validation

#### End-to-End Tests
- ✅ Complete pipeline with real medical documents
- ✅ UI page accessibility
- ✅ Data persistence verification

**Auto-fix**: The test suite attempts to restart failed services automatically.

**Self-delete**: Test suite deletes itself after all tests pass.

---

## 🏗️ Architecture

### Pipeline Flow

```
Document Upload
    ↓
┌─────────────────────────────────────────────────┐
│  1. INGESTION (Port 3001)                       │
│     • Classify document type                     │
│     • Validate structure                         │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│  2. OCR (Port 3002)                             │
│     • Extract text from images (tesseract.js)    │
│     • Parse PDFs (pdf-parse)                     │
│     • Return text segments with confidence       │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│  3. NLP (Port 3003)                             │
│     • Extract patient name (multiple patterns)   │
│     • Extract age, gender                        │
│     • Extract ALL lab tests as key-value pairs   │
│     • Extract blood pressure                     │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│  4. VALIDATION (Port 3004)                      │
│     • Medical sanity checks                      │
│     • Unit normalization                         │
│     • Range validation                           │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│  5. MAPPING (Port 3005)                         │
│     • Create FHIR Patient resource               │
│     • Create Observation for EACH lab test       │
│     • Add traceability extensions                │
│     • Map to LOINC/SNOMED codes                  │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│  6. GATEWAY (Port 3000)                         │
│     • Orchestrate pipeline                       │
│     • Upsert patient profiles                    │
│     • Store images                               │
│     • Update activity feed                       │
└─────────────────────────────────────────────────┘
    ↓
Patient Profile Created ✅
```

### Key Design Decisions

- **In-Memory Storage**: Uses Map/Array for simplicity (no database required)
- **Flexible Validation**: Creates profiles even with missing patient names
- **Multiple Observations**: Each lab test becomes a separate FHIR Observation
- **Local OCR**: No external API calls (tesseract.js runs in Node.js)
- **Browser-based UI**: Vanilla HTML/CSS/JS with auto-refresh

---

## 🐛 Troubleshooting

### Services Won't Start

**Problem**: Port already in use

**Solution**:
```bash
# Windows PowerShell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 3000, 3001, 3002, 3003, 3004, 3005 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Linux/Mac
lsof -ti:3000,3001,3002,3003,3004,3005 | xargs kill -9
```

### OCR Not Working

**Problem**: Tesseract.js fails to load

**Solution**:
```bash
# Reinstall OCR service dependencies
cd services/ocr-service
npm install tesseract.js@5.1.0 --force
cd ../..
npm run start:all
```

### No Patient Profiles Created

**Problem**: Document doesn't contain patient name

**Solution**: This is expected! The system creates "Unknown Patient" profiles for documents without names. Check http://localhost:3000/patients.html for all profiles.

### Test Suite Fails

**Problem**: Services not fully started

**Solution**:
```bash
# Wait 15 seconds after starting services
npm run start:all
# In another terminal after 15 seconds wait
node test-suite.js
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `node test-suite.js`
5. Commit: `git commit -m "Add feature-name"`
6. Push: `git push origin feature-name`
7. Open a Pull Request

### Development Guidelines

- Follow existing code style (ES6+, async/await)
- Add tests for new features
- Update README.md if adding new functionality
- Keep services stateless and independent

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🎯 Hackathon Notes

This project is **completely free** to run:
- ✅ No API keys required
- ✅ No cloud services needed
- ✅ No database setup
- ✅ Runs entirely on localhost
- ✅ One-command start

Perfect for:
- 24-hour hackathons
- Healthcare tech demos
- FHIR learning projects
- Prototype development

---

## 📞 Support

Found a bug or have questions?
- Open an issue on GitHub
- Check [Troubleshooting](#troubleshooting) section
- Review test logs in `test-suite.js` output

---

## 🙏 Acknowledgments

- **FHIR R4**: HL7 FHIR standard
- **Tesseract.js**: OCR engine
- **pdf-parse**: PDF text extraction
- **Express.js**: Web framework

---

**Built with ❤️ for hackathons and healthcare innovation**
