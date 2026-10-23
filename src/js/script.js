const menuButton = document.querySelector(".nav-hamburger");
const menu = document.querySelector("#nav-menu");

if (menuButton instanceof HTMLButtonElement && menu instanceof HTMLElement) {
    const closeMenu = () => {
        menu.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation menu");
    };

    menuButton.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    });

    menu.addEventListener("click", (event) => {
        if (event.target instanceof HTMLAnchorElement) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menu.classList.contains("is-open")) {
            closeMenu();
            menuButton.focus();
        }
    });
}