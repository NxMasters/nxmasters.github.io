let currentFilter = "todos";

function getConfig() {
    // Si hay borrador local de prueba en este navegador, úsalo si se solicita; de lo contrario usa window.NX_CONFIG
    return window.NX_CONFIG || { site: {}, subIndices: [], guides: [], team: [], games: [] };
}

document.addEventListener("DOMContentLoaded", async () => {
    renderSiteHeaderAndHero();
    renderFilterTabs();
    renderCatalog();
    renderGuides();
    renderTeam();

    // Sincronización instantánea con los últimos cambios publicados por el Staff
    try {
        const res = await fetch(`https://api.github.com/repos/NxMasters/nxmasters.github.io/contents/data.js?t=${Date.now()}`, {
            headers: { "Accept": "application/vnd.github+json" }
        });
        if (res.ok) {
            const info = await res.json();
            const decoded = decodeURIComponent(escape(atob(info.content.replace(/\s/g, ""))));
            const match = decoded.match(/window\.NX_CONFIG\s*=\s*(\{[\s\S]*?\});\s*window\.NX_GAMES/);
            if (match && match[1]) {
                window.NX_CONFIG = JSON.parse(match[1]);
                renderSiteHeaderAndHero();
                renderFilterTabs();
                renderCatalog();
                renderGuides();
                renderTeam();
            }
        }
    } catch (e) {}

    const modal = document.getElementById("modal-juego");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.close();
        });
    }
});

function renderSiteHeaderAndHero() {
    const cfg = getConfig().site || {};
    const brandNameEl = document.querySelector(".brand-name");
    if (brandNameEl && cfg.brandFirst !== undefined) {
        brandNameEl.innerHTML = `${cfg.brandFirst}<span class="brand-gold">${cfg.brandHighlight || ""}</span>`;
    }
    const brandSubEl = document.querySelector(".brand-sub");
    if (brandSubEl && cfg.subtitle) brandSubEl.textContent = cfg.subtitle;

    document.querySelectorAll(".brand-avatar, .hero-logo-card img").forEach(img => {
        if (cfg.logoUrl) img.src = cfg.logoUrl;
    });

    const commBtn = document.querySelector(".community-btn");
    if (commBtn) {
        if (cfg.communityUrl) commBtn.href = cfg.communityUrl;
        const label = cfg.communityLabel || "Unirse a WhatsApp";
        commBtn.innerHTML = `<i class="fa-brands fa-whatsapp" style="font-size:1.08rem;"></i> ${label}`;
    }

    if (cfg.navTabs) {
        const btnCat = document.querySelector('[data-view="catalogo"]');
        const btnGuias = document.querySelector('[data-view="guias"]');
        const btnTeam = document.querySelector('[data-view="team"]');
        if (btnCat && cfg.navTabs.catalogo) btnCat.innerHTML = `<i class="fa-solid fa-gamepad"></i> ${cfg.navTabs.catalogo}`;
        if (btnGuias && cfg.navTabs.guias) btnGuias.innerHTML = `<i class="fa-solid fa-book-open"></i> ${cfg.navTabs.guias}`;
        if (btnTeam && cfg.navTabs.team) btnTeam.innerHTML = `<i class="fa-solid fa-users-gear"></i> ${cfg.navTabs.team}`;
    }

    const heroTitle = document.querySelector(".hero-info h1");
    if (heroTitle && cfg.heroTitlePrefix !== undefined) {
        heroTitle.innerHTML = `${cfg.heroTitlePrefix} <span class="ribbon-tag">${cfg.heroRibbon || "NXMASTERS"}</span>`;
    }
    const heroDesc = document.querySelector(".hero-info p");
    if (heroDesc && cfg.heroDescription) heroDesc.textContent = cfg.heroDescription;

    const heroBadges = document.querySelector(".hero-badges");
    if (heroBadges && Array.isArray(cfg.heroPills)) {
        heroBadges.innerHTML = cfg.heroPills.map((pill, idx) =>
            `<span class="tech-pill ${idx === 0 ? 'terabox' : ''}">${pill}</span>`
        ).join("");
    }
}

function renderFilterTabs() {
    const container = document.getElementById("filter-tabs");
    if (!container) return;
    const subIndices = getConfig().subIndices || [];
    const tabsHtml = subIndices.map(sub => `
        <button type="button" class="filter-tab ${currentFilter === sub.id ? 'activo' : ''}" data-filter="${sub.id}" onclick="setFilter('${sub.id}')">
            <i class="fa-solid ${sub.icon || 'fa-folder'}"></i> ${sub.label}
        </button>
    `).join("");
    container.innerHTML = `${tabsHtml}<span id="game-count" class="count-badge">Cargando...</span>`;
}

function switchView(viewName, event) {
    if (event) event.preventDefault();
    ["catalogo", "guias", "team"].forEach(v => {
        const section = document.getElementById(`view-${v}`);
        if (section) section.classList.toggle("hidden", v !== viewName);
    });

    document.querySelectorAll(".site-links .nav-pill").forEach(btn => {
        btn.classList.toggle("nav-active", btn.dataset.view === viewName);
    });
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll("#filter-tabs .filter-tab").forEach(btn => {
        btn.classList.toggle("activo", btn.dataset.filter === filter);
    });
    renderCatalog();
}

function getLangBadge(lang) {
    if (lang === "es") {
        return `<span class="badge-lang badge-es" title="Juego en Español"><i class="fa-solid fa-comment-dots"></i> Español</span>`;
    }
    if (lang === "multi") {
        return `<span class="badge-lang badge-multi" title="Multilenguaje (incluye Español)"><i class="fa-solid fa-language"></i> Multi</span>`;
    }
    return `<span class="badge-lang badge-en" title="Juego en Inglés"><i class="fa-solid fa-globe"></i> Inglés</span>`;
}

function getTypeBadge(type, label) {
    const sub = (getConfig().subIndices || []).find(s => s.id === type);
    const customColor = sub && sub.color ? `style="background:${sub.color};"` : "";
    const icon = sub && sub.icon ? sub.icon : "fa-gamepad";
    return `<span class="badge-type type-${type}" ${customColor}><i class="fa-solid ${icon}"></i> ${label || (sub ? sub.label : type)}</span>`;
}

// Calcula el color gradual continuo de 0% (Rojo) -> 50% (Amarillo) -> 100% (Verde)
function getProgressStyle(pctInput) {
    const pct = Math.max(0, Math.min(100, Number(pctInput) || 0));
    let hue;
    if (pct <= 50) {
        // 0% -> 50%: Rojo (0°) a Amarillo (48°)
        hue = Math.round((pct / 50) * 48);
    } else {
        // 50% -> 100%: Amarillo (48°) a Verde Esmeralda (132°)
        hue = Math.round(48 + ((pct - 50) / 50) * 84);
    }
    const hStart = Math.max(0, hue - 10);
    const hEnd = Math.min(140, hue + 8);
    return {
        pct,
        color: `hsl(${hue}, 95%, 56%)`,
        bg: `linear-gradient(90deg, hsl(${hStart}, 92%, 46%), hsl(${hEnd}, 92%, 52%))`,
        shadow: `0 0 12px hsla(${hue}, 95%, 50%, 0.6)`
    };
}

function renderProgressBar(game) {
    const status = game.status || "disponible";
    if (status !== "proximamente" && !game.showProgress) {
        return "";
    }
    const st = getProgressStyle(game.progress ?? 50);
    return `
        <div class="progress-wrap" title="Avance del desarrollo: ${st.pct}%">
            <div class="progress-head">
                <span style="color:var(--text-muted);"><i class="fa-solid fa-bars-progress"></i> Avance</span>
                <span style="color:${st.color};">${st.pct}%</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width:${st.pct}%;background:${st.bg};box-shadow:${st.shadow};"></div>
            </div>
        </div>
    `;
}

// ================= GESTOR DE CONTADOR DE DESCARGAS =================
const DL_CACHE_PREFIX = "nxm_dl_count_";
const DL_API_BASE = "https://countapi.mileshilliard.com/api/v1";

function getLocalDownloadCount(gameId, baseDownloads = 0) {
    const cached = localStorage.getItem(DL_CACHE_PREFIX + gameId);
    if (cached !== null && !isNaN(Number(cached))) {
        return Math.max(Number(baseDownloads) || 0, Number(cached));
    }
    return Number(baseDownloads) || 0;
}

function updateDownloadUI(gameId, count) {
    const formatted = Number(count).toLocaleString();
    const cardEl = document.getElementById(`dl-count-${gameId}`);
    if (cardEl) {
        cardEl.textContent = formatted;
        cardEl.classList.remove("dl-bump");
        void cardEl.offsetWidth;
        cardEl.classList.add("dl-bump");
    }
    const modalEl = document.getElementById(`modal-dl-count-${gameId}`);
    if (modalEl) {
        modalEl.textContent = formatted;
        modalEl.classList.remove("dl-bump");
        void modalEl.offsetWidth;
        modalEl.classList.add("dl-bump");
    }
}

async function syncDownloadCount(gameId, baseDownloads = 0) {
    const base = Number(baseDownloads) || 0;
    try {
        const res = await fetch(`${DL_API_BASE}/get/nxmasters_dl_game_${gameId}`);
        if (res.ok) {
            const data = await res.json();
            const apiHits = Number(data.value) || 0;
            const total = base + apiHits;
            localStorage.setItem(DL_CACHE_PREFIX + gameId, total);
            updateDownloadUI(gameId, total);
            return total;
        }
    } catch (e) {
        // Fallback local silencioso si no hay conexión
    }
    const current = getLocalDownloadCount(gameId, base);
    updateDownloadUI(gameId, current);
    return current;
}

function registerDownloadClick(gameId) {
    const game = (getConfig().games || []).find(g => String(g.id) === String(gameId));
    if (!game || game.enableDownloads === false) return;

    const base = Number(game.downloads) || 0;
    const current = getLocalDownloadCount(gameId, base);
    const newCount = current + 1;
    localStorage.setItem(DL_CACHE_PREFIX + gameId, newCount);
    updateDownloadUI(gameId, newCount);

    try {
        fetch(`${DL_API_BASE}/hit/nxmasters_dl_game_${gameId}`, {
            method: "GET",
            mode: "cors",
            keepalive: true
        }).then(r => r.json()).then(data => {
            if (data && typeof data.value === "number") {
                const updatedTotal = base + data.value;
                localStorage.setItem(DL_CACHE_PREFIX + gameId, updatedTotal);
                updateDownloadUI(gameId, updatedTotal);
            }
        }).catch(() => {});
    } catch (e) {}
}

function renderCardActionButton(game) {
    const status = game.status || "disponible";
    if (status === "mantenimiento") {
        return `
            <span class="btn-status btn-mantenimiento" aria-disabled="true" title="Este proyecto se encuentra temporalmente en mantenimiento">
                <i class="fa-solid fa-screwdriver-wrench"></i> En Mantenimiento
            </span>`;
    }
    if (status === "proximamente") {
        return `
            <span class="btn-status btn-proximamente" aria-disabled="true" title="Proyecto en desarrollo por NXMasters">
                <i class="fa-solid fa-clock"></i> Próximamente...
            </span>`;
    }
    const showTb = game.enableTerabox !== false;
    const showGd = game.enableGdrive !== false;
    const showVk = game.enableViking !== false;
    const tbUrl = game.teraboxLink || "https://www.terabox.com/";
    const gdUrl = game.gdriveLink || "https://drive.google.com/";
    const vkUrl = game.vikingLink || "https://vikingfile.com/";

    const buttons = [];
    if (showTb) {
        buttons.push(`
            <a href="${tbUrl}" target="_blank" rel="noopener" class="btn-terabox" title="Descargar directo desde TeraBox" onclick="registerDownloadClick('${game.id}')">
                <i class="fa-solid fa-cloud-arrow-down"></i> TeraBox
            </a>`);
    }
    if (showGd) {
        buttons.push(`
            <a href="${gdUrl}" target="_blank" rel="noopener" class="btn-gdrive" title="Descargar directo desde Google Drive" onclick="registerDownloadClick('${game.id}')">
                <i class="fa-brands fa-google-drive"></i> GDrive
            </a>`);
    }
    if (showVk) {
        buttons.push(`
            <a href="${vkUrl}" target="_blank" rel="noopener" class="btn-viking" title="Descargar directo desde Viking File" onclick="registerDownloadClick('${game.id}')">
                <i class="fa-solid fa-cloud-arrow-down"></i> Viking
            </a>`);
    }
    if (buttons.length === 0) {
        return `
            <span class="btn-status btn-proximamente" aria-disabled="true" title="Enlaces desactivados temporalmente">
                <i class="fa-solid fa-link-slash"></i> Sin Enlaces Activos
            </span>`;
    }
    return buttons.join("");
}

function renderCatalog() {
    const grid = document.getElementById("games-grid");
    const countBadge = document.getElementById("game-count");
    const searchInput = document.getElementById("search-input");
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    let list = (getConfig().games || []).filter(game => {
        if (currentFilter === "espanol") return game.language === "es" || game.language === "multi";
        if (currentFilter !== "todos") return game.type === currentFilter;
        return true;
    });

    if (query) {
        list = list.filter(g =>
            (g.title || "").toLowerCase().includes(query) ||
            (g.category || "").toLowerCase().includes(query) ||
            (g.typeLabel || "").toLowerCase().includes(query) ||
            (g.author || "").toLowerCase().includes(query) ||
            (g.engine || []).join(" ").toLowerCase().includes(query)
        );
    }

    if (countBadge) {
        countBadge.textContent = `${list.length} ${list.length === 1 ? "proyecto disponible" : "proyectos disponibles"}`;
    }
    if (!grid) return;
    grid.innerHTML = "";

    if (list.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--text-dim);">
                <i class="fa-solid fa-ghost" style="font-size:2rem;margin-bottom:0.5rem;color:var(--neon-purple);"></i>
                <p>No se encontraron proyectos con ese filtro. Prueba con otro término.</p>
            </div>`;
        return;
    }

    list.forEach(game => {
        const card = document.createElement("article");
        card.className = "post-card";
        const builds = (game.engine || []).map(b => `<span class="cover-build">${b}</span>`).join("");

        card.innerHTML = `
            <div class="cover-wrap">
                <img src="${game.image}" alt="Portada de ${game.title}" loading="lazy"
                     onerror="this.onerror=null;this.src='assets/nxmasters_logo.jpg';">
                ${getLangBadge(game.language)}
                ${getTypeBadge(game.type, game.typeLabel)}
                <div class="cover-builds">${builds}</div>
            </div>
            <div class="card-body">
                <div class="card-top">
                    <span class="chip-cat">${game.category || "Switch"}</span>
                    <span class="credit-porter" title="Desarrollado / Adaptado por ${game.author || 'NXMasters'}">
                        <i class="fa-solid fa-user-astronaut"></i> ${game.author || "NXMasters"}
                    </span>
                </div>
                <h3 class="card-title">${game.title}</h3>
                <div class="card-specs">
                    <span class="spec" title="Arquitectura"><i class="fa-solid fa-microchip"></i> ${game.arch || "ARM64"}</span>
                    ${game.size ? `<span class="spec" title="Peso aproximado"><i class="fa-solid fa-hard-drive"></i> ${game.size}</span>` : ""}
                    ${game.enableDownloads !== false ? `
                    <span class="spec spec-downloads" title="Descargas totales registradas">
                        <i class="fa-solid fa-download"></i> <span id="dl-count-${game.id}">${getLocalDownloadCount(game.id, game.downloads || 0).toLocaleString()}</span>
                    </span>` : ""}
                </div>
                ${renderProgressBar(game)}
                <div class="card-actions">
                    ${renderCardActionButton(game)}
                    <button type="button" class="btn-info" onclick="openGameModal(${game.id})" title="Ver ficha técnica e instrucciones">
                        <i class="fa-solid fa-circle-info"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Sincronización en segundo plano con contador global
    list.forEach(game => {
        if (game.enableDownloads !== false) {
            syncDownloadCount(game.id, game.downloads || 0);
        }
    });
}

function openGameModal(id) {
    const game = (getConfig().games || []).find(g => String(g.id) === String(id));
    if (!game) return;

    const modal = document.getElementById("modal-juego");
    const body = document.getElementById("modal-body");
    const builds = (game.engine || []).join(" • ");
    const status = game.status || "disponible";
    const showTb = game.enableTerabox !== false;
    const showGd = game.enableGdrive !== false;
    const showVk = game.enableViking !== false;
    const tbUrl = game.teraboxLink || "https://www.terabox.com/";
    const gdUrl = game.gdriveLink || "https://drive.google.com/";
    const vkUrl = game.vikingLink || "https://vikingfile.com/";

    const modalButtons = [];
    if (showTb) {
        modalButtons.push(`
           <a href="${tbUrl}" target="_blank" rel="noopener" class="btn-terabox" style="flex:1;padding:0.8rem 1rem;font-size:0.92rem;" onclick="registerDownloadClick('${game.id}')">
               <i class="fa-solid fa-cloud-arrow-down"></i> Descargar por TeraBox
           </a>`);
    }
    if (showGd) {
        modalButtons.push(`
           <a href="${gdUrl}" target="_blank" rel="noopener" class="btn-gdrive" style="flex:1;padding:0.8rem 1rem;font-size:0.92rem;" onclick="registerDownloadClick('${game.id}')">
               <i class="fa-brands fa-google-drive"></i> Descargar por GDrive
           </a>`);
    }
    if (showVk) {
        modalButtons.push(`
           <a href="${vkUrl}" target="_blank" rel="noopener" class="btn-viking" style="flex:1;padding:0.8rem 1rem;font-size:0.92rem;" onclick="registerDownloadClick('${game.id}')">
               <i class="fa-solid fa-cloud-arrow-down"></i> Descargar por Viking File
           </a>`);
    }
    if (modalButtons.length === 0) {
        modalButtons.push(`
           <div class="btn-status btn-proximamente" style="flex:1;padding:0.85rem 1.2rem;font-size:0.95rem;">
               <i class="fa-solid fa-link-slash"></i> Enlaces Desactivados Temporalmente
           </div>`);
    }

    const modalActionHtml = status === "mantenimiento"
        ? `<div class="btn-status btn-mantenimiento" style="flex:1;padding:0.85rem 1.2rem;font-size:0.95rem;">
               <i class="fa-solid fa-screwdriver-wrench"></i> Juego en Mantenimiento — Descarga Deshabilitada Temporalmente
           </div>`
        : status === "proximamente"
        ? `<div style="width:100%;">
               ${renderProgressBar(game)}
               <div class="btn-status btn-proximamente" style="width:100%;margin-top:0.65rem;padding:0.85rem 1.2rem;font-size:0.95rem;">
                   <i class="fa-solid fa-clock"></i> Próximamente — En Desarrollo por NXMasters
               </div>
           </div>`
        : `${modalButtons.join("")}
           ${game.patchLink ? `
           <a href="${game.patchLink}" target="_blank" rel="noopener" class="community-btn" style="background:linear-gradient(135deg,#ea580c,#f59e0b);color:#140800;font-weight:900;" onclick="registerDownloadClick('${game.id}')">
               <i class="fa-solid fa-box-archive"></i> Descargar Parche Extra (TeraBox)
           </a>` : ""}`;

    body.innerHTML = `
        <div class="modal-header">
            <div>
                <span class="chip-cat" style="margin-bottom:0.4rem;display:inline-block;">${game.typeLabel} • ${game.category}</span>
                <h2 style="font-family:'Outfit',sans-serif;font-size:1.5rem;font-weight:900;color:#fff;">${game.title}</h2>
                <p style="font-size:0.82rem;color:#f0abfc;margin-top:0.2rem;">
                    <i class="fa-solid fa-code"></i> Por <strong>${game.author}</strong>
                </p>
            </div>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-juego').close()" aria-label="Cerrar">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <p style="color:var(--text-muted);font-size:0.92rem;line-height:1.6;margin-bottom:1.1rem;">
            ${game.description || ""}
        </p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.65rem;margin-bottom:1.25rem;background:rgba(0,0,0,0.28);padding:0.9rem;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
            <div><span style="font-size:0.72rem;color:var(--text-dim);display:block;">Arquitectura</span><strong>${game.arch || "N/A"}</strong></div>
            <div><span style="font-size:0.72rem;color:var(--text-dim);display:block;">Entorno / Motor</span><strong>${builds || "Estándar"}</strong></div>
            <div><span style="font-size:0.72rem;color:var(--text-dim);display:block;">Tamaño</span><strong>${game.size || "N/A"}</strong></div>
            <div><span style="font-size:0.72rem;color:var(--text-dim);display:block;">Estado</span><strong style="color:${status === 'mantenimiento' ? '#fb923c' : status === 'proximamente' ? '#c084fc' : '#38bdf8'};">${status === 'mantenimiento' ? 'En Mantenimiento' : status === 'proximamente' ? 'Próximamente' : 'Disponible'}</strong></div>
            ${game.enableDownloads !== false ? `
            <div><span style="font-size:0.72rem;color:var(--text-dim);display:block;">Descargas</span><strong style="color:var(--terabox-cyan);"><i class="fa-solid fa-download"></i> <span id="modal-dl-count-${game.id}">${getLocalDownloadCount(game.id, game.downloads || 0).toLocaleString()}</span></strong></div>` : ""}
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:0.75rem;">
            ${modalActionHtml}
        </div>
    `;
    modal.showModal();
}

function renderGuides() {
    const grid = document.querySelector("#view-guias .guide-grid");
    if (!grid) return;
    const guides = getConfig().guides || [];
    grid.innerHTML = guides.map(g => `
        <div class="guide-card">
            <h3><i class="fa-solid ${g.icon || 'fa-book'}"></i> ${g.title}</h3>
            <ol class="guide-steps">
                ${(g.steps || []).map((s, i) => `
                    <li><span class="step-num">${i + 1}</span><span>${s}</span></li>
                `).join("")}
            </ol>
        </div>
    `).join("");
}

function renderTeam() {
    const grid = document.getElementById("team-grid");
    if (!grid) return;
    grid.innerHTML = (getConfig().team || []).map(member => `
        <div class="member-card">
            <div class="member-icon">${member.avatar || "🎮"}</div>
            <div>
                <h3 style="font-family:'Outfit',sans-serif;font-weight:800;font-size:1.05rem;color:#fff;">${member.name}</h3>
                <p style="font-size:0.76rem;color:#fde047;font-weight:700;">${member.role}</p>
                <p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem;">${member.specialty}</p>
            </div>
        </div>
    `).join("");
}
