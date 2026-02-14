const listEl = document.getElementById("patientList");
const summaryEl = document.getElementById("profileSummary");
const resourceEl = document.getElementById("resourceJson");
const logEl = document.getElementById("logList");
const imageEl = document.getElementById("imageList");
const clearBtn = document.getElementById("clearImagesBtn");
let activePatientId = null;

async function fetchPatients() {
  const response = await fetch("/api/patients");
  const payload = await response.json();
  return payload.patients || [];
}

async function fetchPatient(id) {
  const response = await fetch(`/api/patients/${id}`);
  if (!response.ok) {
    throw new Error("patient not found");
  }
  return response.json();
}

function renderList(patients) {
  listEl.innerHTML = "";
  if (!patients.length) {
    listEl.innerHTML = "<div>No patients stored yet.</div>";
    return;
  }

  patients.forEach((patient) => {
    const item = document.createElement("div");
    item.className = "patient-item";
    item.textContent = `${patient.displayName} (updates: ${patient.logCount})`;
    item.addEventListener("click", () => selectPatient(patient.id, item));
    listEl.appendChild(item);
  });
}

async function selectPatient(id, element) {
  document.querySelectorAll(".patient-item").forEach((node) => {
    node.classList.remove("active");
  });
  element.classList.add("active");
  activePatientId = id;

  try {
    const patient = await fetchPatient(id);
    summaryEl.textContent = `${patient.displayName} | Last updated ${patient.lastUpdated}`;
    resourceEl.textContent = JSON.stringify(patient.resources, null, 2);
    renderLogs(patient.logs);
    renderImages(patient.uploads);
  } catch (error) {
    summaryEl.textContent = "Unable to load patient.";
  }
}

function renderLogs(logs) {
  logEl.innerHTML = "";
  if (!logs || !logs.length) {
    logEl.innerHTML = "<li>No updates yet.</li>";
    return;
  }

  logs.forEach((log) => {
    const item = document.createElement("li");
    item.textContent = `${log.timestamp} | doc ${log.documentId} | resources ${log.resourceCount}`;
    logEl.appendChild(item);
  });
}

function renderImages(uploads) {
  imageEl.innerHTML = "";
  if (!uploads || !uploads.length) {
    imageEl.innerHTML = "<div>No images stored yet.</div>";
    return;
  }

  uploads.forEach((upload) => {
    const card = document.createElement("div");
    card.className = "image-card";
    if (upload.dataUrl) {
      const img = document.createElement("img");
      img.src = upload.dataUrl;
      img.alt = upload.fileName;
      card.appendChild(img);
    }
    const caption = document.createElement("span");
    caption.textContent = `${upload.fileName} | ${upload.uploadedAt}`;
    card.appendChild(caption);
    imageEl.appendChild(card);
  });
}

clearBtn.addEventListener("click", async () => {
  if (!activePatientId) return;
  await fetch(`/api/patients/${activePatientId}/images/clear`, { method: "POST" });
  renderImages([]);
});

async function init() {
  try {
    const patients = await fetchPatients();
    renderList(patients);
  } catch (error) {
    listEl.innerHTML = "<div>Unable to load patients.</div>";
  }
}

init();
