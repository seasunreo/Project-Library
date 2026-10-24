function statEntry(s) {
    const isFeatured = s.featured === true;
    return `
        <li class="flex justify-between md:flex-col md:justify-start md:items-start p-2 stats-node${isFeatured ? " is-featured" : ""}">
            <span class="stats_meta">${s.value}</span>
            <span class="stats_submeta">${s.label}</span>
        </li>`;
}

function renderStats() {
    const container = document.getElementById("stats-list");
    if (!container) return;
    container.innerHTML = Developer_Data.overview.stats.map(statEntry).join("");
}

function renderAll() {
    if (typeof Developer_Data === "undefined") return;

    const hasHomePageContent = [
    "stats-list",
    ].some((id) => document.getElementById(id));

    if (!hasHomePageContent) return;
    renderStats();
}

document.addEventListener("DOMContentLoaded", renderAll);