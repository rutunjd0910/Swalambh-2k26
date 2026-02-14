# 🚀 Quick Start Guide

Get FHIR Flow running in **3 minutes**!

## Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/fhir-flow.git
cd fhir-flow

# 2. Install dependencies (takes 2-3 minutes)
npm install

# 3. Start all services
npm run start:all
```

**Wait 10-15 seconds** for all services to start.

## Usage

### Open the UI
🌐 **http://localhost:3000**

### Upload a Document
1. Click **"Choose File"** or drag-and-drop
2. Select a PDF, image, or text file
3. Click **"Upload & Process"**

### View Results
- **Patient Profiles**: http://localhost:3000/patients.html
- **Activity Feed**: Right panel on main page
- **Health Check**: http://localhost:3000/health.html

## Test the System

```bash
# Run automated tests
node test-suite.js
```

## Common Commands

```bash
# Start all services
npm run start:all

# Stop all services (Windows PowerShell)
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 3000, 3001, 3002, 3003, 3004, 3005 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Stop all services (Linux/Mac)
lsof -ti:3000,3001,3002,3003,3004,3005 | xargs kill -9
```

## What's Running?

- **Port 3000**: Gateway API & UI
- **Port 3001**: Ingestion Service
- **Port 3002**: OCR Service
- **Port 3003**: NLP Service
- **Port 3004**: Validation Service
- **Port 3005**: Mapping Service

## Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Troubleshooting](README.md#troubleshooting)
- 🤝 [Contributing](CONTRIBUTING.md)

---

**That's it! You're ready to process medical documents! 🎉**
