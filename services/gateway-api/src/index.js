const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const SERVICE_URLS = {
  ingestion: process.env.INGESTION_URL || "http://localhost:3001",
  ocr: process.env.OCR_URL || "http://localhost:3002",
  nlp: process.env.NLP_URL || "http://localhost:3003",
  validation: process.env.VALIDATION_URL || "http://localhost:3004",
  mapping: process.env.MAPPING_URL || "http://localhost:3005"
};

const patientStore = new Map();
const uploadStore = [];
const resourceStore = [];
const activityFeed = [];

function seedPatients() {
  const now = new Date().toISOString();
  const seeds = [
    {
      displayName: "Aarav Shah",
      gender: "male",
      age: 34,
      lab: { testName: "Hemoglobin", value: 14.2, unit: "g/dL" }
    },
    {
      displayName: "Isha Verma",
      gender: "female",
      age: 29,
      lab: { testName: "Hemoglobin", value: 12.8, unit: "g/dL" }
    },
    {
      displayName: "Rohan Iyer",
      gender: "male",
      age: 41,
      lab: { testName: "Hemoglobin", value: 15.1, unit: "g/dL" }
    }
  ];

  seeds.forEach((seed) => {
    const key = normalizePatientName(seed.displayName);
    if (patientStore.has(key)) return;

    const record = {
      id: key,
      displayName: seed.displayName,
      lastUpdated: now,
      resources: [
        {
          resourceType: "Patient",
          id: `seed-${key}`,
          name: [{ text: seed.displayName }],
          gender: seed.gender
        },
        {
          resourceType: "Observation",
          id: `seed-obs-${key}`,
          status: "final",
          code: { text: seed.lab.testName },
          valueQuantity: { value: seed.lab.value, unit: seed.lab.unit }
        }
      ],
      logs: [
        {
          timestamp: now,
          documentId: `seed-${key}`,
          warnings: [],
          resourceCount: 2
        }
      ],
      uploads: []
    };

    patientStore.set(key, record);
  });
}

seedPatients();

function normalizePatientName(name) {
  return String(name || "").trim().toLowerCase();
}

function upsertPatientRecord(mapped, document) {
  const patientResource = (mapped.resources || []).find(
    (resource) => resource && resource.resourceType === "Patient"
  );

  // Create profile even without a full Patient resource
  let displayName = "Unknown Patient";
  
  if (patientResource && patientResource.name && patientResource.name[0]) {
    displayName = patientResource.name[0].text || "Unknown Patient";
  }
  
  // Use document ID as fallback if no valid name
  const key = normalizePatientName(displayName) || `doc-${document.documentId || Date.now()}`;

  const existing = patientStore.get(key);
  const now = new Date().toISOString();

  const logEntry = {
    timestamp: now,
    documentId: document.documentId,
    warnings: mapped.warnings || [],
    resourceCount: (mapped.resources || []).length
  };

  const imageUpload = document.mimeType && document.mimeType.startsWith("image/")
    ? {
        documentId: document.documentId,
        fileName: document.fileName || "uploaded-image",
        mimeType: document.mimeType,
        dataUrl: document.fileContent || null,
        uploadedAt: now
      }
    : null;

  if (existing) {
    existing.lastUpdated = now;
    existing.resources = mapped.resources;
    existing.logs.unshift(logEntry);
    if (imageUpload) {
      existing.uploads = existing.uploads || [];
      existing.uploads.unshift(imageUpload);
      if (existing.uploads.length > 5) existing.uploads.pop();
    }
    patientStore.set(key, existing);

    activityFeed.unshift({
      type: "patient_update",
      message: `${existing.displayName} profile updated`,
      timestamp: now
    });
    if (activityFeed.length > 50) activityFeed.pop();

    return existing;
  }

  const record = {
    id: key,
    displayName,
    lastUpdated: now,
    resources: mapped.resources || [],
    logs: [logEntry],
    uploads: imageUpload ? [imageUpload] : []
  };

  patientStore.set(key, record);

  activityFeed.unshift({
    type: "patient_create",
    message: `${record.displayName} profile created`,
    timestamp: now
  });
  if (activityFeed.length > 50) activityFeed.pop();

  return record;
}

function recordUpload(document) {
  const entry = {
    documentId: document.documentId || `doc-${Date.now()}`,
    sourceType: document.sourceType || "unknown",
    contentType: document.contentType || "unknown",
    fileName: document.fileName || null,
    mimeType: document.mimeType || null,
    receivedAt: new Date().toISOString(),
    status: "processed"
  };

  uploadStore.unshift(entry);
  if (uploadStore.length > 100) uploadStore.pop();

  activityFeed.unshift({
    type: "upload",
    message: `Document ${entry.documentId} uploaded`,
    timestamp: entry.receivedAt
  });
  if (activityFeed.length > 50) activityFeed.pop();

  return entry;
}

function recordResources(mapped, documentId, patientProfile) {
  const entries = (mapped.resources || []).map((resource) => ({
    documentId,
    resourceType: resource.resourceType,
    resourceId: resource.id || null,
    patientName: patientProfile ? patientProfile.displayName : null,
    recordedAt: new Date().toISOString(),
    resource
  }));

  resourceStore.unshift(...entries);
  if (resourceStore.length > 200) {
    resourceStore.length = 200;
  }
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed ${res.status}: ${text}`);
  }

  return res.json();
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/process", async (req, res) => {
  try {
    const { document } = req.body || {};
    if (!document || (!document.content && !document.fileContent)) {
      return res.status(400).json({ error: "document.content or document.fileContent is required" });
    }

    const uploadEntry = recordUpload(document);

    const ingested = await postJson(`${SERVICE_URLS.ingestion}/ingest`, document);
    const ocr = await postJson(`${SERVICE_URLS.ocr}/ocr`, ingested);
    const nlp = await postJson(`${SERVICE_URLS.nlp}/nlp`, ocr);
    const validated = await postJson(`${SERVICE_URLS.validation}/validate`, nlp);
    const mapped = await postJson(`${SERVICE_URLS.mapping}/map`, validated);
    const patientProfile = upsertPatientRecord(mapped, document);
    recordResources(mapped, uploadEntry.documentId, patientProfile);

    res.json({ pipeline: "ok", output: mapped, patientProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients", (req, res) => {
  const records = Array.from(patientStore.values()).map((record) => ({
    id: record.id,
    displayName: record.displayName,
    lastUpdated: record.lastUpdated,
    logCount: record.logs.length
  }));

  res.json({ patients: records });
});

app.get("/api/patients/:id", (req, res) => {
  const record = patientStore.get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: "patient not found" });
  }

  res.json(record);
});

app.post("/api/patients/:id/images/clear", (req, res) => {
  const record = patientStore.get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: "patient not found" });
  }

  record.uploads = [];
  record.lastUpdated = new Date().toISOString();
  patientStore.set(record.id, record);
  res.json({ status: "cleared" });
});

app.get("/api/uploads", (req, res) => {
  res.json({ uploads: uploadStore });
});

app.get("/api/resources", (req, res) => {
  res.json({ resources: resourceStore });
});

app.get("/api/stats", (req, res) => {
  res.json({
    patients: patientStore.size,
    uploads: uploadStore.length,
    resources: resourceStore.length
  });
});

app.get("/api/activity", (req, res) => {
  res.json({ activity: activityFeed.slice(0, 20) });
});

app.get("/api/health", async (req, res) => {
  const checks = await Promise.allSettled(
    Object.entries(SERVICE_URLS).map(async ([name, url]) => {
      const response = await fetch(`${url}/health`);
      return { name, ok: response.ok };
    })
  );

  const services = checks.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : { name: "unknown", ok: false }
  );

  res.json({ services });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Gateway listening on ${port}`);
});
