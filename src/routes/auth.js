const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const router = express.Router();

// Login do admin/financeiro
router.post("/admin/login", async (req, res) => {
  const { email, senha } = req.body;

  const usuario = await prisma.usuarioAdmin.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: "Credenciais inválidas." });
  }

  const senhaOk = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaOk) return res.status(401).json({ erro: "Credenciais inválidas." });

  const token = jwt.sign(
    { id: usuario.id, tipo: "admin", perfil: usuario.perfil },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil } });
});

// Login do cliente (por CPF/CNPJ + senha)
router.post("/cliente/login", async (req, res) => {
  const { cpfCnpj, senha } = req.body;
  const cpfCnpjLimpo = (cpfCnpj || "").replace(/\D/g, "");

  const cliente = await prisma.cliente.findUnique({ where: { cpfCnpj: cpfCnpjLimpo } });
  if (!cliente) return res.status(401).json({ erro: "Credenciais inválidas." });

  const senhaOk = await bcrypt.compare(senha, cliente.senhaHash);
  if (!senhaOk) return res.status(401).json({ erro: "Credenciais inválidas." });

  const token = jwt.sign(
    { id: cliente.id, tipo: "cliente" },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({ token, cliente: { id: cliente.id, nome: cliente.nome } });
});

module.exports = router;
