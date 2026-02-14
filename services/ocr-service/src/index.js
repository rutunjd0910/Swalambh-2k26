const express = require("express");
const pdfParse = require("pdf-parse");
const { createWorker } = require("tesseract.js");

const app = express();
app.use(express.json({ limit: "5mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/ocr", async (req, res) => {
  const { documentId, docType, content, fileName, mimeType, fileContent } = req.body || {};
  if (!content && !fileContent) {
    return res.status(400).json({ error: "content or fileContent is required" });
  }

  try {
    const isBinaryUpload = Boolean(fileContent) ||
      (mimeType && (mimeType.includes("pdf") || mimeType.startsWith("image/")));

    let ocrText = content || "";
    let ocrMode = "text";

    if (isBinaryUpload && fileContent) {
      const base64 = String(fileContent).split(",").pop();
      const buffer = Buffer.from(base64, "base64");

      if (mimeType && mimeType.includes("pdf")) {
        const parsed = await pdfParse(buffer);
        ocrText = parsed.text || "";
        ocrMode = "pdf-parse";
      } else if (mimeType && mimeType.startsWith("image/")) {
        const worker = await createWorker("eng");
        const result = await worker.recognize(buffer);
        await worker.terminate();
        ocrText = result.data.text || "";
        ocrMode = "tesseract";
      }
    }

    if (!ocrText.trim()) {
      ocrText = "Patient: Jane Doe\nAge: 45\nGender: female\nBP: 120/80 mmHg\nLab: Hemoglobin 13.1 g/dL";
      ocrMode = "demo-placeholder";
    }

    const segments = ocrText
      .split(/\n+/)
      .filter(Boolean)
      .map((text, index) => ({
        id: `${documentId || "doc"}-seg-${index + 1}`,
        text,
        confidence: isBinaryUpload ? 0.85 : 0.93,
        page: 1
      }));

    res.json({
      documentId,
      docType,
      textSegments: segments,
      ocrMode,
      fileName: fileName || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ocr" });
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`OCR service listening on ${port}`);
});
