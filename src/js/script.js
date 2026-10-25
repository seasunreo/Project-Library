function statEntry(s, index) {
    const isFeatured = s.featured === true;
    return `
        <li class="flex justify-between md:flex-col md:justify-start md:items-start p-2 stats-node fade-in-entry${isFeatured ? " is-featured" : ""}" style="--fade-delay:${300 + index * 100}ms;">
            <span class="stats_meta">${s.value}</span>
            <span class="stats_submeta">${s.label}</span>
        </li>`;
}

function projectCard(p, index = 0) {
    return `
        <a href="${p.link}" class="boxes flex flex-col md:flex-row items-center w-full p-3 gap-4 cursor-pointer fade-in-entry" style="--fade-delay:${index * 90}ms;">
        <!-- Website Image -->
            <div class="w-full md:w-40 shrink-0 items-center">
                <img
                src="${p.image}"
                alt="${p.name}"
                class="w-full h-48 md:h-28 object-cover rounded-lg"
                >
            </div>
        <!-- Project Information -->
        <div class="grid grid-rows-[auto_auto_1fr_auto] min-w-0 flex-1 w-full self-stretch">
            <!-- Name + Arrow -->
            <div class="flex items-center justify-between gap-2">
            <span class="meta">${p.name}</span>
            <span class="submeta shrink-0">${p.year}</span>
            </div>
            <!-- Tagline -->
            <span class="submeta">${p.category}</span>
            <!-- Description -->
            <p class="mt-2 text-[13px]">${p.description}</p>
            <div class="flex flex-wrap gap-2 mt-2">
            ${p.tech
                .map(
                tech => `
                    <span class="inline-flex px-3 py-1 techchip">
                    ${tech}
                    </span>
                `
                )
                .join("")}
            </div>
        </div>
    </a>`;
}

function renderStats() {
    const container = document.getElementById("stats-list");
    if (!container) return;
    container.innerHTML = Developer_Data.overview.stats.map(statEntry).join("");
}

function renderRecentProjects() {
    const container = document.getElementById("recent-projects-list");
    if (!container) return;
        container.innerHTML = Developer_Data.preview.map(projectCard).join("");
}

function renderAll() {
    if (typeof Developer_Data === "undefined") return;

    const hasHomePageContent = [
    "stats-list",
    "recent-projects-list"
    ].some((id) => document.getElementById(id));

    if (!hasHomePageContent) return;
    renderStats();
    renderRecentProjects();
}

document.addEventListener("DOMContentLoaded", renderAll);