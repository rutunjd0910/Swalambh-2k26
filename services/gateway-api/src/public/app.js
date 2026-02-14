const runBtn = document.getElementById("runBtn");
const fillBtn = document.getElementById("fillBtn");
const docText = document.getElementById("docText");
const output = document.getElementById("output");
const statusEl = document.getElementById("status");
const uploadZone = document.getElementById("uploadZone");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");

const sampleText = `Patient: Jane Doe\nAge: 45\nGender: female\nBP: 120/80 mmHg\nLab: Hemoglobin 13.1 g/dL`;

docText.value = sampleText;
let uploadedFileMeta = null;

function setStatus(message, tone) {
  statusEl.textContent = message;
  statusEl.style.color = tone === "error" ? "#8c2b16" : "#1c4a3a";
}

fillBtn.addEventListener("click", () => {
  docText.value = sampleText;
  uploadedFileMeta = null;
  uploadBtn.disabled = true;
  setStatus("Sample loaded.");
});

uploadZone.addEventListener("click", () => fileInput.click());

uploadZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  uploadZone.classList.add("is-dragging");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("is-dragging");
});

uploadZone.addEventListener("drop", (event) => {
  event.preventDefault();
  uploadZone.classList.remove("is-dragging");
  const file = event.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  const isText = file.type === "text/plain" || file.name.endsWith(".txt");
  const reader = new FileReader();

  reader.onload = () => {
    uploadedFileMeta = {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      content: reader.result,
      isBinary: !isText
    };

    if (isText) {
      docText.value = String(reader.result || "").trim();
      setStatus(`Loaded ${file.name}.`);
    } else {
      docText.value = "";
      setStatus(
        `Loaded ${file.name}. Demo uses placeholder OCR text unless you add a real OCR engine.`
      );
    }

    uploadBtn.disabled = false;
  };

  if (isText) {
    reader.readAsText(file);
  } else {
    reader.readAsDataURL(file);
  }
}

async function runPipeline(payload) {
  const response = await fetch("/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }

  return response.json();
}

runBtn.addEventListener("click", async () => {
  const content = docText.value.trim();
  if (!content && !uploadedFileMeta) {
    setStatus("Paste a document or upload a file before running.", "error");
    return;
  }

  setStatus("Running pipeline...");
  runBtn.disabled = true;

  try {
    const payload = await runPipeline({
      document: {
        documentId: `doc-${Date.now()}`,
        sourceType: "demo-ui",
        contentType: "clinical_note",
        content: content || sampleText,
        fileName: uploadedFileMeta ? uploadedFileMeta.fileName : null,
        mimeType: uploadedFileMeta ? uploadedFileMeta.mimeType : null,
        fileContent: uploadedFileMeta && uploadedFileMeta.isBinary ? uploadedFileMeta.content : null
      }
    });
    output.textContent = JSON.stringify(payload, null, 2);
    setStatus("Pipeline complete.");
  } catch (error) {
    output.textContent = JSON.stringify({ error: error.message }, null, 2);
    setStatus("Pipeline failed. Check services.", "error");
  } finally {
    runBtn.disabled = false;
  }
});

uploadBtn.addEventListener("click", async () => {
  if (!uploadedFileMeta) {
    setStatus("Select a file first.", "error");
    return;
  }

  setStatus("Uploading and running OCR...");
  uploadBtn.disabled = true;

  try {
    const payload = await runPipeline({
      document: {
        documentId: `doc-${Date.now()}`,
        sourceType: "upload-ui",
        contentType: "scan_or_pdf",
        content: "",
        fileName: uploadedFileMeta.fileName,
        mimeType: uploadedFileMeta.mimeType,
        fileContent: uploadedFileMeta.content
      }
    });

    output.textContent = JSON.stringify(payload, null, 2);
    setStatus("Upload processed.");
  } catch (error) {
    output.textContent = JSON.stringify({ error: error.message }, null, 2);
    setStatus("Upload failed. Check services.", "error");
  } finally {
    uploadBtn.disabled = false;
  }
});

async function loadActivity() {
  const feedEl = document.getElementById("activityFeed");
  if (!feedEl) return;

  try {
    const response = await fetch("/api/activity");
    const data = await response.json();
    feedEl.innerHTML = "";

    if (!data.activity || !data.activity.length) {
      feedEl.innerHTML = "<li>No recent activity.</li>";
      return;
    }

    data.activity.forEach((item) => {
      const li = document.createElement("li");
      const timestamp = new Date(item.timestamp).toLocaleString();
      li.textContent = `${item.message} | ${timestamp}`;
      feedEl.appendChild(li);
    });
  } catch (error) {
    feedEl.innerHTML = "<li>Unable to load activity.</li>";
  }
}

loadActivity();
setInterval(loadActivity, 5000);
