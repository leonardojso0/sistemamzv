const ADMIN_TOKEN_KEY = "boletos_admin_token";
const ADMIN_USER_KEY = "boletos_admin_usuario";
const CLIENTE_TOKEN_KEY = "boletos_cliente_token";
const CLIENTE_USER_KEY = "boletos_cliente_dados";

async function apiRequest(path, { method = "GET", body, isFormData = false, tokenKey } = {}) {
  const headers = {};
  const token = tokenKey ? localStorage.getItem(tokenKey) : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData && body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error("Não foi possível conectar à API. Verifique sua conexão ou tente novamente.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* resposta sem corpo JSON */
  }

  if (!res.ok) {
    throw new Error((data && data.erro) || `Erro ${res.status}`);
  }
  return data;
}

const adminApi = (path, opts = {}) => apiRequest(path, { ...opts, tokenKey: ADMIN_TOKEN_KEY });
const clienteApi = (path, opts = {}) => apiRequest(path, { ...opts, tokenKey: CLIENTE_TOKEN_KEY });

// Baixa um arquivo binário (Excel/PDF) da API autenticada como admin e dispara o download no navegador.
async function baixarArquivoAdmin(path) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const data = await res.json();
      msg = data.erro || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const nomeArquivo = match ? match[1] : "download";

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function formatMoeda(valor) {
  const numero = Number(valor || 0);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatData(dataIso) {
  if (!dataIso) return "-";
  // Datas vêm do backend em UTC (ou "YYYY-MM-DD" puro); força a leitura em UTC
  // para não perder um dia em fusos horários atrás de UTC (ex: Brasil).
  return new Date(dataIso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

const ASSET_PREFIX = /\/(admin|portal)\//.test(window.location.pathname) ? "../assets/" : "assets/";

function brandHtml(href, opcoes = {}) {
  const conteudo = `
    <span class="brand-chip">
      <img src="${ASSET_PREFIX}logo-nexus.png" alt="NEXUS" height="26" />
      <span class="brand-sub">CONECTA</span>
    </span>
  `;
  const marca = href ? `<a href="${href}" class="brand">${conteudo}</a>` : `<span class="brand">${conteudo}</span>`;
  if (!opcoes.comParceiro) return marca;
  return `<span class="brand-duo">${marca}<span class="brand-divider"></span>${mzvLogoHtml()}</span>`;
}

function mzvLogoHtml() {
  return `
    <span class="brand-chip" title="Desenvolvido por MZV Tecnologia">
      <img src="${ASSET_PREFIX}logo-mzv.png" alt="MZV Tecnologia" height="30" />
    </span>
  `;
}

// Formata um CPF/CNPJ (armazenado só com dígitos) para exibição.
function formatarCpfCnpj(valor) {
  const v = (valor || "").replace(/\D/g, "");
  if (v.length === 11) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (v.length === 14) return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return valor || "-";
}

// Aplica máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) enquanto o usuário digita.
function aplicarMascaraCpfCnpj(input) {
  input.addEventListener("input", () => {
    let v = input.value.replace(/\D/g, "").slice(0, 14);
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      v = v.replace(/(\d{2})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1/$2");
      v = v.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
    input.value = v;
  });
}

function mesReferenciaLegivel(mes) {
  if (!mes) return "-";
  const [ano, mesNum] = mes.split("-");
  const nomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const idx = parseInt(mesNum, 10) - 1;
  return `${nomes[idx] || mesNum}/${ano}`;
}

function badgeStatusConta(status) {
  const mapa = {
    PAGO: { classe: "badge-success", texto: "Pago" },
    PENDENTE: { classe: "badge-warning", texto: "Pendente" },
    ATRASADO: { classe: "badge-danger", texto: "Atrasado" },
  };
  const info = mapa[status] || { classe: "badge-muted", texto: status || "-" };
  return `<span class="badge ${info.classe}">${info.texto}</span>`;
}
