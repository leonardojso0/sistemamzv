const express = require("express");
const prisma = require("../lib/prisma");
const { autenticarAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(autenticarAdmin);

router.get("/", async (req, res) => {
  const centros = await prisma.centroCusto.findMany({ orderBy: { nome: "asc" } });
  res.json(centros);
});

router.post("/", async (req, res) => {
  const { nome, numero } = req.body;
  if (!nome || !numero) return res.status(400).json({ erro: "Nome e número são obrigatórios." });

  const centro = await prisma.centroCusto.create({ data: { nome, numero } });
  res.status(201).json(centro);
});

router.put("/:id", async (req, res) => {
  const { nome, numero, ativo } = req.body;
  const centro = await prisma.centroCusto.update({
    where: { id: req.params.id },
    data: { nome, numero, ativo },
  });
  res.json(centro);
});

module.exports = router;
