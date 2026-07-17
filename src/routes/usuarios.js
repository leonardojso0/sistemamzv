const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { autenticarAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(autenticarAdmin);

// Só usuários com perfil ADMIN podem gerenciar outros usuários
function apenasAdmin(req, res, next) {
  if (req.usuario.perfil !== "ADMIN") {
    return res.status(403).json({ erro: "Apenas administradores podem gerenciar usuários." });
  }
  next();
}

// Listar usuários
router.get("/", async (req, res) => {
  const usuarios = await prisma.usuarioAdmin.findMany({
    select: { id: true, nome: true, email: true, perfil: true, ativo: true, master: true, criadoEm: true },
    orderBy: { criadoEm: "asc" },
  });
  res.json(usuarios);
});

// Criar usuário
router.post("/", apenasAdmin, async (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
  }

  const existente = await prisma.usuarioAdmin.findUnique({ where: { email } });
  if (existente) return res.status(409).json({ erro: "Já existe um usuário com esse e-mail." });

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuarioAdmin.create({
    data: { nome, email, senhaHash, perfil: perfil === "ADMIN" ? "ADMIN" : "FINANCEIRO" },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true, master: true, criadoEm: true },
  });

  res.status(201).json(usuario);
});

// Atualizar usuário (nome, perfil, ativo, senha)
router.put("/:id", apenasAdmin, async (req, res) => {
  const { nome, perfil, ativo, senha } = req.body;

  const dados = { nome, ativo };
  if (perfil === "ADMIN" || perfil === "FINANCEIRO") dados.perfil = perfil;
  if (senha) dados.senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuarioAdmin.update({
    where: { id: req.params.id },
    data: dados,
    select: { id: true, nome: true, email: true, perfil: true, ativo: true, master: true, criadoEm: true },
  });

  res.json(usuario);
});

// Excluir usuário (usuário master nunca pode ser excluído; ninguém exclui a própria conta)
router.delete("/:id", apenasAdmin, async (req, res) => {
  const usuario = await prisma.usuarioAdmin.findUnique({ where: { id: req.params.id } });
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });

  if (usuario.master) {
    return res.status(403).json({ erro: "O usuário master não pode ser excluído." });
  }
  if (usuario.id === req.usuario.id) {
    return res.status(403).json({ erro: "Você não pode excluir a própria conta." });
  }

  await prisma.usuarioAdmin.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = router;
