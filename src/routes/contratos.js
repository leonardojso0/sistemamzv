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

  await prisma.movimentacaoCliente.create({
    data: {
      clienteId,
      descricao: `Contrato criado no plano ${contrato.plano.nome}`,
      realizadoPorId: req.usuario.id,
    },
  });

  res.status(201).json(contrato);
});

// Atualiza status, data de assinatura, valor de implantação e/ou o plano do contrato
router.put("/:id", async (req, res) => {
  const { status, dataAssinatura, valorImplantacao, planoId } = req.body;

  const contratoAtual = await prisma.contrato.findUnique({
    where: { id: req.params.id },
    include: { plano: true },
  });
  if (!contratoAtual) return res.status(404).json({ erro: "Contrato não encontrado." });

  const dados = {
    status,
    dataAssinatura: dataAssinatura ? new Date(dataAssinatura) : undefined,
    valorImplantacao: valorImplantacao !== undefined ? valorImplantacao : undefined,
  };
  if (planoId) dados.planoId = planoId;

  const contrato = await prisma.contrato.update({
    where: { id: req.params.id },
    data: dados,
    include: { cliente: true, plano: true },
  });

  if (planoId && planoId !== contratoAtual.planoId) {
    await prisma.movimentacaoCliente.create({
      data: {
        clienteId: contrato.clienteId,
        descricao: `Alteração no contrato: plano trocado de ${contratoAtual.plano.nome} para ${contrato.plano.nome}`,
        realizadoPorId: req.usuario.id,
      },
    });
  }
  if (status && status !== contratoAtual.status) {
    await prisma.movimentacaoCliente.create({
      data: {
        clienteId: contrato.clienteId,
        descricao: `Status do contrato alterado de ${contratoAtual.status} para ${status}`,
        realizadoPorId: req.usuario.id,
      },
    });
  }

  res.json(contrato);
});

module.exports = router;
