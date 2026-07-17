function requireAdminAuth() {
  if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
    window.location.href = "login.html";
  }
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
          <a href="dashboard.html" data-key="dashboard">Início</a>
          <a href="clientes.html" data-key="clientes">Clientes</a>
          <a href="contratos.html" data-key="contratos">Contratos</a>
          <a href="planos.html" data-key="planos">Planos</a>
          <a href="boletos.html" data-key="boletos">Boletos</a>
          <a href="contas-receber.html" data-key="contas">Contas a Receber</a>
          ${usuario.perfil === "ADMIN" ? '<a href="usuarios.html" data-key="usuarios">Usuários</a>' : ""}
          <div class="nav-user">${usuario.nome || "Admin"}${usuario.perfil ? ` · ${usuario.perfil}` : ""}</div>
          <button id="logoutBtn" class="btn btn-ghost btn-block">Sair</button>
        </nav>
        <main class="content" id="pageContent"></main>
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
