(() => {
    const projectFilters = [
        "All",
        "Certification Project",
        "JavaScript Practice",
        "UI Experiment",
        "Frontend Project",
        "Other Learning"
    ];

    function getProjectCategory(project) {
        const knownCategories = projectFilters.slice(1);
        return knownCategories.includes(project.category) ? project.category : "Other Learning";
    }

    function projectCard(project, index = 0) {
        return `
          <a href="${project.link}" class="boxes flex flex-col md:flex-row items-center w-full p-3 gap-4 cursor-pointer fade-in-entry" style="--fade-delay:${index * 90}ms;">
            <div class="w-full md:w-40 shrink-0 items-center">
                <img
                src="${project.image}"
                alt="${project.name}"
                class="w-full h-48 md:h-28 object-cover rounded-lg"
                >
            </div>

            <div class="grid grid-rows-[auto_auto_1fr_auto] min-w-0 flex-1 w-full self-stretch">
                <div class="flex items-center justify-between gap-2">
                    <span class="meta">${project.name}</span>
                    <span class="submeta shrink-0">${project.year}</span>
                </div>
                <span class="submeta">${project.category}</span>
                <p class="mt-2 text-[13px]">${project.description}</p>
                <div class="flex flex-wrap gap-2 mt-2">
                    ${project.tech.map((tech) => `
                        <span class="inline-flex px-3 py-1 techchip">${tech}</span>`).join("")}
                </div>
            </div>
        </a>
        `;
    }

    function initProjectPage() {
        const filterRoot = document.getElementById("project-filters");
        const projectGrid = document.getElementById("projects-grid");

        if (!filterRoot || !projectGrid) return;
        if (typeof projects_data === "undefined" || !Array.isArray(projects_data.projects)) {
            console.error("Project data is missing or invalid.");
            return;
        }

        function renderProjectFilter(filter) {
            const filteredProjects = filter === "All"
                ? projects_data.projects
                : projects_data.projects.filter((project) => getProjectCategory(project) === filter);

            projectGrid.innerHTML = filteredProjects.length
                ? filteredProjects.map((project, index) => projectCard(project, index)).join("")
                : `<p class="projects-empty fade-in-entry" style="--fade-delay:0ms;">No projects in this category yet.</p>`;

            filterRoot.querySelectorAll("[role='tab']").forEach((tab) => {
                const isActive = tab.dataset.filter === filter;
                tab.classList.toggle("is-active", isActive);
                tab.setAttribute("aria-selected", String(isActive));
            });
            filterRoot.querySelector(".project-filter-select").value = filter;
        }

        filterRoot.innerHTML = `
        <div class="project-filter-mobile">
            <label class="project-filter-label" for="project-filter-select">Browse projects</label>
            <div class="project-filter-select-wrap">
                <select id="project-filter-select" class="project-filter-select" aria-label="Filter projects">
                    ${projectFilters.map((filter) => `<option value="${filter}">${filter}</option>`).join("")}
                </select>
                <svg class="project-filter-chevron" aria-hidden="true" viewBox="0 0 20 20" fill="none">
                    <path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </div>
        </div>

        <div class="project-filter-list" role="tablist" aria-label="Filter projects">
            ${projectFilters.map((filter, index) => `
                <button type="button" role="tab" aria-selected="${index === 0}" data-filter="${filter}" class="project-filter${index === 0 ? " is-active" : ""}">
                    ${filter}
                </button>
            `).join("")}
        </div>
        `;

        filterRoot.addEventListener("click", (event) => {
            const filterButton = event.target.closest("[role='tab']");
            if (filterButton) renderProjectFilter(filterButton.dataset.filter);
        });
        filterRoot.querySelector(".project-filter-select").addEventListener("change", (event) => {
            renderProjectFilter(event.target.value);
        });

        renderProjectFilter("All");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initProjectPage);
    } else {
        initProjectPage();
    }
})();
