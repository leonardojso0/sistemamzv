function requireAdminAuth() {
  if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
    window.location.href = "login.html";
  }
}

const NAV_ICONS = {
  dashboard: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
  clientes: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c.7-3.6 3.3-6 6.5-6s5.8 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.4"/><path d="M15.8 14.2c2.4.4 4.2 2.4 4.7 5.3"/>',
  contratos: '<path d="M6 2.5h9l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"/><path d="M15 2.5V7h4"/><path d="M8 12h7M8 15.5h7M8 8.5h3"/>',
  planos: '<path d="M2.5 8.5a15 15 0 0 1 19 0"/><path d="M6 12.5a10 10 0 0 1 12 0"/><path d="M9.5 16.3a5 5 0 0 1 5 0"/><circle cx="12" cy="20" r="1.2" fill="currentColor" stroke="none"/>',
  boletos: '<path d="M5 2.5h14v19l-2.5-1.6L14 21l-2-1.6-2 1.6-2.5-1.6L5 21.5Z"/><path d="M8 8h8M8 11.5h8M8 15h5"/>',
  contas: '<rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10.5h19"/><path d="M6 15h4"/>',
  "centro-custo": '<path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z"/><path d="M3 7.5v9L12 21l9-4.5v-9"/><path d="M12 12v9"/>',
  usuarios: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c.7-3.6 3.3-6 6.5-6s5.8 2.4 6.5 6"/><path d="M16 4.2a3.2 3.2 0 0 1 0 6.2"/><path d="M18.5 14.5c1.9.7 3.2 2.6 3.6 5.5"/>',
  configuracoes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H10.5a1.7 1.7 0 0 0 1-1.6V4a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9V10.5a1.7 1.7 0 0 0 1.6 1H20a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1Z"/>',
};

const NAV_TITULOS = {
  dashboard: "Visão geral",
  clientes: "Clientes",
  contratos: "Contratos",
  planos: "Planos",
  boletos: "Boletos",
  contas: "Contas a Receber",
  "centro-custo": "Centro de Custo",
  usuarios: "Usuários",
  configuracoes: "Configurações",
};

function iconeNav(chave) {
  return `<svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${NAV_ICONS[chave] || ""}</svg>`;
}

const NAV_HREFS = {
  dashboard: "dashboard.html",
  clientes: "clientes.html",
  contratos: "contratos.html",
  planos: "planos.html",
  boletos: "boletos.html",
  contas: "contas-receber.html",
  "centro-custo": "centro-custo.html",
  usuarios: "usuarios.html",
  configuracoes: "configuracoes.html",
};

function linkNav(chave, rotulo) {
  return `<a href="${NAV_HREFS[chave]}" data-key="${chave}">${iconeNav(chave)}<span>${rotulo}</span></a>`;
}

function renderAdminNav(active) {
  const usuario = JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || "{}");

  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <div class="app-shell">
      <header class="topbar">
        ${brandHtml("dashboard.html")}
        <button class="nav-toggle" id="navToggle" aria-label="Abrir menu">&#9776;</button>
      </header>
      <div class="overlay" id="navOverlay"></div>
      <div class="main-layout">
        <nav class="sidenav" id="sideNav">
          ${linkNav("dashboard", "Início")}
          <div class="nav-group-label">Módulos</div>
          ${linkNav("clientes", "Clientes")}
          ${linkNav("contratos", "Contratos")}
          ${linkNav("planos", "Planos")}
          ${linkNav("boletos", "Boletos")}
          ${linkNav("contas", "Contas a Receber")}
          ${linkNav("centro-custo", "Centro de Custo")}
          ${
            usuario.perfil === "ADMIN"
              ? `<div class="nav-group-label">Utilitários</div>${linkNav("usuarios", "Usuários")}${linkNav("configuracoes", "Configurações")}`
              : ""
          }
          <div class="nav-user">${usuario.nome || "Admin"}${usuario.perfil ? ` · ${usuario.perfil}` : ""}</div>
          <button id="logoutBtn" class="btn btn-ghost btn-block">Sair</button>
        </nav>
        <main class="content">
          <div class="breadcrumb">Início <span>/</span> <strong>${NAV_TITULOS[active] || ""}</strong></div>
          <div id="pageContent"></div>
        </main>
      </div>
    </div>
  `
  );

  document.querySelectorAll(".sidenav a").forEach((a) => {
    if (a.dataset.key === active) a.classList.add("active");
  });

  const sideNav = document.getElementById("sideNav");
  const overlay = document.getElementById("navOverlay");
  const toggle = () => {
    sideNav.classList.toggle("open");
    overlay.classList.toggle("open");
  };
  document.getElementById("navToggle").onclick = toggle;
  overlay.onclick = toggle;

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    window.location.href = "login.html";
  };

  // Move o conteúdo estático da página (definido em <template id="page-body">) para dentro do shell.
  const template = document.getElementById("page-body");
  if (template) {
    document.getElementById("pageContent").appendChild(template.content.cloneNode(true));
  }
}
