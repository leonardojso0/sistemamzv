const express = require("express");
const prisma = require("../lib/prisma");
const { autenticarAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(autenticarAdmin);

// Por padrão retorna só planos ativos (usado nos formulários de contrato).
// Use ?todos=true para listar também os desativados (usado na tela de Planos).
router.get("/", async (req, res) => {
  const planos = await prisma.plano.findMany({
    where: req.query.todos === "true" ? undefined : { ativo: true },
    orderBy: { nome: "asc" },
  });
  res.json(planos);
});

router.post("/", async (req, res) => {
  const { nome, velocidade, valorMensal } = req.body;
  const plano = await prisma.plano.create({ data: { nome, velocidade, valorMensal } });
  res.status(201).json(plano);
});

router.put("/:id", async (req, res) => {
  const { nome, velocidade, valorMensal, ativo } = req.body;

  const planoAtual = await prisma.plano.findUnique({ where: { id: req.params.id } });
  if (!planoAtual) return res.status(404).json({ erro: "Plano não encontrado." });

  const dados = { nome, velocidade, valorMensal };
  if (ativo !== undefined) {
    dados.ativo = ativo;
    if (planoAtual.ativo && !ativo) dados.desativadoEm = new Date();
    if (!planoAtual.ativo && ativo) dados.desativadoEm = null;
  }

  const plano = await prisma.plano.update({ where: { id: req.params.id }, data: dados });
  res.json(plano);
});

module.exports = router;
