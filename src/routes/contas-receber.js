const express = require("express");
const prisma = require("../lib/prisma");
const { autenticarAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(autenticarAdmin);

// Lista geral com filtro por status (?status=PENDENTE|PAGO|ATRASADO)
router.get("/", async (req, res) => {
  const { status } = req.query;

  const contas = await prisma.contaReceber.findMany({
    where: status ? { status } : undefined,
    include: {
      contrato: { include: { cliente: true, plano: true } },
      boleto: true,
    },
    orderBy: { vencimento: "asc" },
  });

  res.json(contas);
});

// Marca uma conta como paga manualmente
router.patch("/:id/pagar", async (req, res) => {
  const conta = await prisma.contaReceber.update({
    where: { id: req.params.id },
    data: {
      status: "PAGO",
      dataPagamento: new Date(),
      origemConfirmacao: "MANUAL",
      confirmadoPorId: req.usuario.id,
    },
  });

  res.json(conta);
});

// Endpoint reservado para confirmação automática futura (ex: webhook do banco)
router.post("/webhook/confirmacao-automatica", async (req, res) => {
  const { boletoId } = req.body;

  const conta = await prisma.contaReceber.update({
    where: { boletoId },
    data: { status: "PAGO", dataPagamento: new Date(), origemConfirmacao: "AUTOMATICO" },
  });

  res.json(conta);
});

module.exports = router;
