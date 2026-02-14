function markActiveNav() {
  const current = window.location.pathname;
  document.querySelectorAll(".nav-button").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === current) {
      link.classList.add("active");
    }
  });
}

async function loadStats() {
  const el = document.getElementById("statsBar");
  if (!el) return;

  try {
    const response = await fetch("/api/stats");
    const stats = await response.json();
    el.innerHTML = `
      <div class="stat-chip">Patients: ${stats.patients}</div>
      <div class="stat-chip">Uploads: ${stats.uploads}</div>
      <div class="stat-chip">Resources: ${stats.resources}</div>
    `;
  } catch (error) {
    el.innerHTML = "";
  }
}

markActiveNav();
loadStats();
setInterval(loadStats, 5000);
