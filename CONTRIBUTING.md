# Contributing to FHIR Flow

Thank you for your interest in contributing to FHIR Flow! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- Git
- Code editor (VS Code recommended)

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/fhir-flow.git
   cd fhir-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start all services**
   ```bash
   npm run start:all
   ```

4. **Run tests**
   ```bash
   node test-suite.js
   ```

---

## 📋 Development Workflow

### Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions/changes

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

**Examples:**
```bash
git commit -m "feat(nlp): add support for lab result ranges"
git commit -m "fix(ocr): handle corrupted PDF files"
git commit -m "docs(readme): add API examples"
```

---

## 🏗️ Project Architecture

### Service Communication
All services are stateless and communicate via HTTP REST APIs:

```
Gateway (3000) → Ingestion (3001) → OCR (3002) → NLP (3003) → Validation (3004) → Mapping (3005) → Gateway (3000)
```

### Adding a New Service

1. **Create service directory**
   ```bash
   mkdir -p services/new-service/src
   cd services/new-service
   ```

2. **Initialize package.json**
   ```json
   {
     "name": "new-service",
     "version": "1.0.0",
     "main": "src/index.js",
     "scripts": {
       "start": "node src/index.js"
     },
     "dependencies": {
       "express": "^4.18.2"
     }
   }
   ```

3. **Create service endpoint**
   ```javascript
   // src/index.js
   const express = require('express');
   const app = express();
   const PORT = 3006;

   app.use(express.json());

   app.post('/process', async (req, res) => {
     try {
       const result = await processData(req.body);
       res.json({ success: true, data: result });
     } catch (error) {
       res.status(500).json({ success: false, error: error.message });
     }
   });

   app.get('/health', (req, res) => {
     res.json({ status: 'healthy', service: 'new-service' });
   });

   app.listen(PORT, () => {
     console.log(`New Service running on port ${PORT}`);
   });
   ```

4. **Add to root package.json**
   ```json
   "scripts": {
     "start:new": "npm --workspace services/new-service start",
     "start:all": "concurrently \"npm:start:ingestion\" \"npm:start:ocr\" \"npm:start:nlp\" \"npm:start:validation\" \"npm:start:mapping\" \"npm:start:new\" \"npm:start:gateway\""
   }
   ```

5. **Add tests to test-suite.js**

---

## 🧪 Testing Guidelines

### Test Categories

#### 1. Unit Tests
Test individual functions in isolation.

```javascript
// Example: Test NLP extraction
const nlpService = require('./services/nlp-service/src/index');

async function testNLPExtraction() {
  const input = { textSegments: ['Patient: John Doe', 'Age: 45'] };
  const result = await nlpService.extractFields(input);
  console.assert(result.patientName === 'John Doe', 'Patient name extraction failed');
  console.assert(result.age === 45, 'Age extraction failed');
}
```

#### 2. Integration Tests
Test service-to-service communication.

```javascript
async function testPipelineIntegration() {
  const ingestionResult = await callIngestion(document);
  const ocrResult = await callOCR(ingestionResult);
  const nlpResult = await callNLP(ocrResult);
  console.assert(nlpResult.patientName, 'Pipeline integration failed');
}
```

#### 3. End-to-End Tests
Test complete user workflows.

```javascript
async function testCompleteWorkflow() {
  const response = await fetch('http://localhost:3000/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document: testDocument })
  });
  const profile = await response.json();
  console.assert(profile.success, 'E2E workflow failed');
}
```

### Running Tests

```bash
# Run all tests
node test-suite.js

# Test specific service
curl http://localhost:3003/health

# Manual pipeline test
curl -X POST http://localhost:3000/process \
  -H "Content-Type: application/json" \
  -d '{"document": {...}}'
```

---

## 🎨 Code Style

### JavaScript Style Guide
- Use **ES6+** features (const/let, arrow functions, async/await)
- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Add **semicolons** at end of statements
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes

### Example
```javascript
const express = require('express');

async function processDocument(document) {
  try {
    const result = await extractText(document);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

module.exports = { processDocument };
```

### Error Handling
Always use try-catch blocks for async operations:

```javascript
app.post('/endpoint', async (req, res) => {
  try {
    const result = await someAsyncOperation(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

---

## 📝 Documentation

### Code Comments
- Use JSDoc for function documentation
- Explain **why**, not **what** (code should be self-explanatory)
- Document complex algorithms and business logic

```javascript
/**
 * Extracts clinical fields from OCR text segments
 * @param {Object} data - Contains textSegments array from OCR
 * @param {string[]} data.textSegments - Array of text lines
 * @returns {Object} Extracted fields (patientName, age, gender, labTests)
 */
async function extractFields(data) {
  // Multi-pattern extraction handles various medical report formats
  // including "Mr./Ms./Dr." titles and "Age/Sex: 27YRS/M" format
  // ...
}
```

### README Updates
When adding features, update:
- Features list
- API Reference (if adding endpoints)
- Usage examples
- Troubleshooting (if new issues may arise)

---

## 🐛 Bug Reports

### Before Submitting
1. Check existing issues
2. Test with latest code
3. Verify it's reproducible
4. Check service logs for errors

### Bug Report Template
```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Start services with `npm run start:all`
2. Upload document at http://localhost:3000
3. Observe error in console

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: Windows 11 / macOS 14 / Ubuntu 22.04
- Node.js: 18.19.0
- npm: 9.8.1

**Logs**
```
Paste relevant error logs
```

**Screenshots**
If applicable
```

---

## ✨ Feature Requests

### Feature Request Template
```markdown
**Feature Description**
Clear description of the proposed feature

**Use Case**
Why is this feature needed? What problem does it solve?

**Proposed Solution**
How would you implement this?

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Screenshots, mockups, or examples
```

---

## 🔍 Code Review Process

### Pull Request Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated for changes
- [ ] All tests pass (`node test-suite.js`)
- [ ] Documentation updated (README, comments)
- [ ] Commit messages follow convention
- [ ] No console.log statements (use proper logging)
- [ ] Branch is up-to-date with main

### Review Criteria
Reviewers will check:
1. **Functionality**: Does it work as intended?
2. **Tests**: Are there adequate tests?
3. **Code Quality**: Is it readable and maintainable?
4. **Performance**: Any performance concerns?
5. **Security**: Any security implications?
6. **Documentation**: Is it well documented?

---

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Creating a Release
1. Update version in package.json files
2. Update CHANGELOG.md
3. Create git tag: `git tag -a v1.2.0 -m "Release 1.2.0"`
4. Push tag: `git push origin v1.2.0`
5. Create GitHub release with notes

---

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions
- **Discussions**: General questions and ideas

---

## 📚 Resources

### FHIR Resources
- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [FHIR Patient Resource](https://hl7.org/fhir/R4/patient.html)
- [FHIR Observation Resource](https://hl7.org/fhir/R4/observation.html)

### Node.js Resources
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Testing Resources
- [Jest Documentation](https://jestjs.io/)
- [Supertest for API Testing](https://github.com/visionmedia/supertest)

---

## ❓ Questions?

If you have questions not covered here:
1. Check existing [GitHub Issues](https://github.com/yourusername/fhir-flow/issues)
2. Review [README.md](README.md)
3. Open a new issue with your question

---

**Thank you for contributing to FHIR Flow! 🎉**
