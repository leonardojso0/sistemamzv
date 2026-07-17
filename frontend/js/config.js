// Troque a URL abaixo pelo endereço do back-end no Render depois do deploy.
const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3333"
    : "https://SEU-BACKEND.onrender.com";
