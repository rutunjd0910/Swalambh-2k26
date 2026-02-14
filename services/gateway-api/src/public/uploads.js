const listEl = document.getElementById("uploadList");
const refreshBtn = document.getElementById("refreshBtn");

async function fetchUploads() {
  const response = await fetch("/api/uploads");
  const payload = await response.json();
  return payload.uploads || [];
}

function renderUploads(uploads) {
  listEl.innerHTML = "";
  if (!uploads.length) {
    listEl.innerHTML = "<div>No uploads yet.</div>";
    return;
  }

  uploads.forEach((upload) => {
    const item = document.createElement("div");
    item.className = "upload-item";
    item.innerHTML = `
      <h3>${upload.documentId}</h3>
      <div class="upload-meta">
        ${upload.contentType} | ${upload.sourceType} | ${upload.fileName || "no file"}
      </div>
      <div class="upload-meta">${upload.receivedAt}</div>
    `;
    listEl.appendChild(item);
  });
}

async function refresh() {
  try {
    const uploads = await fetchUploads();
    renderUploads(uploads);
  } catch (error) {
    listEl.innerHTML = "<div>Unable to load uploads.</div>";
  }
}

refreshBtn.addEventListener("click", refresh);
refresh();
