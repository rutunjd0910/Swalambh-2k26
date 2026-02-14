# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-14

### Added
- **Complete Microservices Architecture**
  - Gateway API (Port 3000) - Pipeline orchestration & patient profiles
  - Ingestion Service (Port 3001) - Document classification
  - OCR Service (Port 3002) - Text extraction from images and PDFs
  - NLP Service (Port 3003) - Clinical data extraction
  - Validation Service (Port 3004) - Medical data validation
  - Mapping Service (Port 3005) - FHIR R4 resource generation

- **OCR Capabilities**
  - Local OCR using tesseract.js (v5.1.0) for images
  - PDF text extraction using pdf-parse (v1.1.1)
  - Confidence scoring for extracted text
  - Support for PNG, JPG, JPEG, and PDF formats

- **Enhanced NLP Extraction**
  - Multi-pattern patient name extraction (Mr./Ms./Dr. titles)
  - Age/Sex format support (e.g., "Age/Sex: 27YRS/M")
  - Comprehensive lab test extraction as key-value pairs
  - Blood pressure detection
  - Support for real-world medical report formats

- **Patient Profile System**
  - Automatic profile creation from extracted data
  - Flexible validation (creates profiles even with missing data)
  - Image storage in patient profiles
  - Multiple FHIR Observation resources per document
  - In-memory storage using Map/Array structures

- **User Interface**
  - Multi-page web interface (Pipeline, Patients, Uploads, Resources, Health)
  - Drag-and-drop file upload
  - Real-time activity feed with auto-refresh (5-second intervals)
  - Live statistics dashboard
  - Patient profile viewer with lab test visualization
  - Shared navigation across all pages

- **Testing Infrastructure**
  - Comprehensive test suite with 32 tests
  - Black-box API testing
  - White-box service testing
  - End-to-end pipeline validation
  - Auto-fix capabilities for common issues
  - Self-delete on successful test completion

- **Developer Experience**
  - One-command startup (`npm run start:all`)
  - npm workspaces for monorepo management
  - Concurrent service execution
  - Health endpoints on all services
  - Detailed error logging

- **Documentation**
  - Comprehensive README.md with step-by-step instructions
  - CONTRIBUTING.md with development guidelines
  - API reference documentation
  - Troubleshooting guide
  - Architecture diagrams

### Technical Details
- **FHIR Compliance**: R4 standard with custom traceability extensions
- **No External APIs**: Runs completely locally without paid services
- **Node.js**: 18+ requirement
- **Storage**: In-memory (no database required)
- **Frontend**: Vanilla HTML/CSS/JavaScript

### Features
- ✅ Upload PDFs, images, and text documents
- ✅ Extract ALL lab tests as structured key-value pairs
- ✅ Create patient profiles with flexible validation
- ✅ Generate FHIR Patient and Observation resources
- ✅ View real-time activity feed
- ✅ Monitor service health
- ✅ Comprehensive testing

### Known Limitations
- In-memory storage (data lost on restart)
- No authentication/authorization
- No multi-tenancy support
- No database persistence
- Limited to English medical documents

### Hackathon Optimizations
- Zero API costs (everything runs locally)
- One-command setup and start
- No database configuration required
- Pre-seeded with Indian patient test data
- Real medical document processing verified

---

## [Unreleased]

### Planned Features
- Database persistence (PostgreSQL/MongoDB)
- User authentication and authorization
- Multi-language OCR support
- Advanced NLP with machine learning models
- Export to EHR systems (HL7 v2, CDA)
- RESTful API documentation (Swagger/OpenAPI)
- Docker containerization
- Cloud deployment guides (AWS, Azure, GCP)

---

## Version History

- **1.0.0** (2026-02-14) - Initial release with complete pipeline
- **0.1.0** (2026-02-13) - Project scaffold and basic services

---

## How to Update This Changelog

When making changes:

1. Add entries under `[Unreleased]` section
2. Group changes by type: Added, Changed, Deprecated, Removed, Fixed, Security
3. On release, move `[Unreleased]` entries to new version section
4. Update version number in package.json
5. Create git tag: `git tag -a v1.0.0 -m "Release 1.0.0"`

---

**For full details, see the [commit history](https://github.com/yourusername/fhir-flow/commits/main).**
