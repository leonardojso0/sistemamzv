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
