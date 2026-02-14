const listEl = document.getElementById("resourceList");
const summaryEl = document.getElementById("resourceSummary");
const jsonEl = document.getElementById("resourceJson");
const refreshBtn = document.getElementById("refreshBtn");

async function fetchResources() {
  const response = await fetch("/api/resources");
  const payload = await response.json();
  return payload.resources || [];
}

function renderResources(resources) {
  listEl.innerHTML = "";
  if (!resources.length) {
    listEl.innerHTML = "<div>No resources yet.</div>";
    return;
  }

  resources.forEach((resource) => {
    const item = document.createElement("div");
    item.className = "resource-item";
    item.textContent = `${resource.resourceType} | ${resource.patientName || "Unknown"}`;
    item.addEventListener("click", () => selectResource(resource, item));
    listEl.appendChild(item);
  });
}

function selectResource(resource, element) {
  document.querySelectorAll(".resource-item").forEach((node) => {
    node.classList.remove("active");
  });
  element.classList.add("active");
  summaryEl.textContent = `${resource.resourceType} | doc ${resource.documentId}`;
  jsonEl.textContent = JSON.stringify(resource.resource, null, 2);
}

async function refresh() {
  try {
    const resources = await fetchResources();
    renderResources(resources);
  } catch (error) {
    listEl.innerHTML = "<div>Unable to load resources.</div>";
  }
}

refreshBtn.addEventListener("click", refresh);
refresh();
