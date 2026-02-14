const express = require("express");

const app = express();
app.use(express.json({ limit: "5mb" }));

function extractFields(text) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  // Extract patient name - handle multiple formats
  let patientName = null;
  
  // Try "Patient: Name" format
  const patientLine = lines.find((line) => line.toLowerCase().startsWith("patient:"));
  if (patientLine) {
    patientName = patientLine.replace(/^patient:\s*/i, "").trim();
  }
  
  // Try "Mr./Ms./Dr. Name" format
  if (!patientName) {
    const titleLine = lines.find((line) => /^(Mr\.?|Ms\.?|Mrs\.?|Dr\.?)\s+[A-Z]/i.test(line));
    if (titleLine) {
      patientName = titleLine.replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").trim();
    }
  }
  
  // Try first capitalized line as name
  if (!patientName) {
    const nameLine = lines.find((line) => /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line));
    if (nameLine) {
      patientName = nameLine.split(/\s{2,}|:|\||\//).find(part => /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(part));
    }
  }

  // Extract age and gender
  let age = null;
  let gender = null;
  
  // Try "Age: 45" or "Age/Sex: 27YRS/M" format
  const ageGenderLine = lines.find((line) => /age/i.test(line));
  if (ageGenderLine) {
    const ageMatch = ageGenderLine.match(/(\d{1,3})\s*(yrs?|years?|y)?/i);
    if (ageMatch) age = Number(ageMatch[1]);
    
    const genderMatch = ageGenderLine.match(/\/(M|F|male|female)/i);
    if (genderMatch) {
      gender = genderMatch[1].toLowerCase();
      if (gender === 'm') gender = 'male';
      if (gender === 'f') gender = 'female';
    }
  }
  
  // Try separate "Gender: male" format
  if (!gender) {
    const genderLine = lines.find((line) => line.toLowerCase().startsWith("gender:"));
    if (genderLine) {
      gender = genderLine.replace(/^gender:\s*/i, "").trim().toLowerCase();
    }
  }

  // Extract blood pressure
  const bpLine = lines.find((line) => /bp:?\s*\d{2,3}\/\d{2,3}/i.test(line));
  const bpMatch = bpLine ? bpLine.match(/(\d{2,3})\/(\d{2,3})/i) : null;
  const bloodPressure = bpMatch
    ? { systolic: Number(bpMatch[1]), diastolic: Number(bpMatch[2]), unit: "mmHg" }
    : null;

  // Extract ALL lab values as structured key-value pairs
  const labTests = {};
  const labPatterns = [
    // Pattern: "HEMOGLOBIN 15 g/dl 13-17" or "NEUTROPHILS 79 % 40-80"
    /^([A-Z][A-Z\s,]+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z/%]+)?(?:\s+\d|$)/,
    // Pattern: "Lab: Hemoglobin 13.1 g/dL"
    /^lab:\s*([a-zA-Z\s]+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z/]+)?/i
  ];

  lines.forEach((line) => {
    for (const pattern of labPatterns) {
      const match = line.match(pattern);
      if (match) {
        const testName = match[1].trim().toLowerCase().replace(/\s+/g, '_');
        const value = Number(match[2]);
        const unit = match[3] || null;
        
        // Only add if it looks like a valid lab test
        if (testName.length > 2 && value > 0 && value < 10000) {
          labTests[testName] = { value, unit, raw: line };
        }
        break;
      }
    }
  });

  return {
    patientName,
    age,
    gender,
    bloodPressure,
    labTests: Object.keys(labTests).length > 0 ? labTests : null,
    // Keep legacy 'lab' field for backwards compatibility with first test
    lab: Object.keys(labTests).length > 0 
      ? { testName: Object.keys(labTests)[0], value: labTests[Object.keys(labTests)[0]].value, unit: labTests[Object.keys(labTests)[0]].unit }
      : null
  };
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/nlp", (req, res) => {
  const { documentId, textSegments } = req.body || {};
  if (!Array.isArray(textSegments)) {
    return res.status(400).json({ error: "textSegments is required" });
  }

  const combined = textSegments.map((s) => s.text).join("\n");
  const extracted = extractFields(combined);

  res.json({
    documentId,
    extracted,
    trace: textSegments.map((segment) => ({
      segmentId: segment.id,
      confidence: segment.confidence,
      page: segment.page
    }))
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "nlp" });
});

const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`NLP service listening on ${port}`);
});
