const express = require("express");

const app = express();
app.use(express.json({ limit: "5mb" }));

function detectDocType(contentType, content) {
  const text = `${contentType || ""} ${content || ""}`.toLowerCase();
  if (text.includes("lab")) return "lab_report";
  if (text.includes("prescription") || text.includes("rx")) return "prescription";
  if (text.includes("discharge")) return "discharge_summary";
  return "clinical_note";
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/ingest", (req, res) => {
  const { documentId, sourceType, contentType, content, fileName, mimeType, fileContent } = req.body || {};
  if (!content && !fileContent) {
    return res.status(400).json({ error: "content or fileContent is required" });
  }

  const docType = detectDocType(contentType, content || "");
  const finalContent = content || "";

  res.json({
    documentId: documentId || `doc-${Date.now()}`,
    sourceType: sourceType || "unknown",
    contentType: contentType || "unknown",
    docType,
    pages: 1,
    content: finalContent,
    fileName: fileName || null,
    mimeType: mimeType || null,
    fileContent: fileContent || null
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ingestion" });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Ingestion service listening on ${port}`);
});
