const jwt = require("jsonwebtoken");

function autenticarAdmin(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ erro: "Token não enviado." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.tipo !== "admin") {
      return res.status(403).json({ erro: "Acesso restrito ao admin." });
    }
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}

function autenticarCliente(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ erro: "Token não enviado." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.tipo !== "cliente") {
      return res.status(403).json({ erro: "Acesso restrito ao cliente." });
    }
    req.cliente = payload;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}

// Garante que o cliente autenticado só acesse os próprios dados
function apenasProprioCliente(req, res, next) {
  if (req.params.clienteId && req.params.clienteId !== req.cliente.id) {
    return res.status(403).json({ erro: "Você não pode acessar dados de outro cliente." });
  }
  next();
}

module.exports = { autenticarAdmin, autenticarCliente, apenasProprioCliente };
