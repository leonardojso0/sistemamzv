const express = require("express");
const prisma = require("../lib/prisma");
const { gerarLinkDownload } = require("../lib/storage");
const { autenticarCliente } = require("../middleware/auth");

const router = express.Router();
router.use(autenticarCliente);

// Contrato assinado do cliente logado
router.get("/contrato", async (req, res) => {
  const documento = await prisma.documentoCliente.findFirst({
    where: { clienteId: req.cliente.id, tipo: "CONTRATO_ASSINADO" },
    orderBy: { criadoEm: "desc" },
  });

  if (!documento) return res.status(404).json({ erro: "Contrato ainda não disponível." });

  const url = await gerarLinkDownload(documento.urlArquivo);
  res.json({ nomeArquivo: documento.nomeArquivo, url });
});

// Lista de boletos do cliente logado (com status de pagamento)
router.get("/boletos", async (req, res) => {
  const contratos = await prisma.contrato.findMany({
    where: { clienteId: req.cliente.id },
    include: { boletos: { include: { contaReceber: true } } },
  });

  const boletos = contratos.flatMap((c) =>
    c.boletos.map((b) => ({
      id: b.id,
      mesReferencia: b.mesReferencia,
      status: b.contaReceber?.status || "PENDENTE",
      vencimento: b.contaReceber?.vencimento,
    }))
  );

  res.json(boletos);
});

// Link de download de um boleto específico
router.get("/boletos/:id/download", async (req, res) => {
  const boleto = await prisma.boleto.findUnique({
    where: { id: req.params.id },
    include: { contrato: true },
  });

  if (!boleto || boleto.contrato.clienteId !== req.cliente.id) {
    return res.status(403).json({ erro: "Acesso negado." });
  }

  const url = await gerarLinkDownload(boleto.urlArquivo);
  res.json({ nomeArquivo: boleto.nomeArquivo, url });
});

module.exports = router;
