const express = require("express");
const prisma = require("../lib/prisma");
const { autenticarAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(autenticarAdmin);

router.get("/", async (req, res) => {
  const contratos = await prisma.contrato.findMany({
    include: { cliente: true, plano: true },
    orderBy: { criadoEm: "desc" },
  });
  res.json(contratos);
});

router.post("/", async (req, res) => {
  const { clienteId, planoId, valorImplantacao, dataAssinatura } = req.body;

  const contrato = await prisma.contrato.create({
    data: {
      clienteId,
      planoId,
      valorImplantacao: valorImplantacao || 0,
      dataAssinatura: dataAssinatura ? new Date(dataAssinatura) : null,
    },
    include: { cliente: true, plano: true },
  });

  res.status(201).json(contrato);
});

router.put("/:id", async (req, res) => {
  const { status, dataAssinatura } = req.body;
  const contrato = await prisma.contrato.update({
    where: { id: req.params.id },
    data: { status, dataAssinatura: dataAssinatura ? new Date(dataAssinatura) : undefined },
  });
  res.json(contrato);
});

module.exports = router;
