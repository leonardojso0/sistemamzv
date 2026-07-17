const express = require("express");
const prisma = require("../lib/prisma");
const { autenticarAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(autenticarAdmin);

router.get("/", async (req, res) => {
  const planos = await prisma.plano.findMany({ where: { ativo: true } });
  res.json(planos);
});

router.post("/", async (req, res) => {
  const { nome, velocidade, valorMensal } = req.body;
  const plano = await prisma.plano.create({ data: { nome, velocidade, valorMensal } });
  res.status(201).json(plano);
});

router.put("/:id", async (req, res) => {
  const { nome, velocidade, valorMensal, ativo } = req.body;
  const plano = await prisma.plano.update({
    where: { id: req.params.id },
    data: { nome, velocidade, valorMensal, ativo },
  });
  res.json(plano);
});

module.exports = router;
