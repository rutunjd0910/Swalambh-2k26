const listEl = document.getElementById("healthList");
const refreshBtn = document.getElementById("refreshBtn");

async function fetchHealth() {
  const response = await fetch("/api/health");
  const payload = await response.json();
  return payload.services || [];
}

function renderHealth(services) {
  listEl.innerHTML = "";
  if (!services.length) {
    listEl.innerHTML = "<div>No health data.</div>";
    return;
  }

  services.forEach((service) => {
    const card = document.createElement("div");
    card.className = `health-card ${service.ok ? "ok" : "bad"}`;
    card.innerHTML = `
      <h3>${service.name}</h3>
      <div>${service.ok ? "Online" : "Offline"}</div>
    `;
    listEl.appendChild(card);
  });
}

async function refresh() {
  try {
    const services = await fetchHealth();
    renderHealth(services);
  } catch (error) {
    listEl.innerHTML = "<div>Unable to load health data.</div>";
  }
}

refreshBtn.addEventListener("click", refresh);
refresh();
