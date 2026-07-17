const express = require("express");
const prisma = require("../lib/prisma");
const { autenticarAdmin } = require("../middleware/auth");
const { gerarExcelContas, gerarPdfContas } = require("../lib/exportar");

const router = express.Router();
router.use(autenticarAdmin);

const mapaStatus = { PENDENTE: "Pendente", PAGO: "Pago", ATRASADO: "Atrasado" };

function formatarDataBR(data) {
  return new Date(data).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function montarFiltro({ status, dataInicio, dataFim, clienteId, centroCustoId }) {
  const where = {};
  if (status) where.status = status;
  if (dataInicio || dataFim) {
    where.vencimento = {};
    if (dataInicio) where.vencimento.gte = new Date(`${dataInicio}T00:00:00.000Z`);
    if (dataFim) where.vencimento.lte = new Date(`${dataFim}T23:59:59.999Z`);
  }
  if (clienteId || centroCustoId) {
    where.contrato = {
      clienteId: clienteId || undefined,
      cliente: centroCustoId ? { centroCustoId } : undefined,
    };
  }
  return where;
}

// Lista com filtros: status, período (por vencimento), cliente e centro de custo
router.get("/", async (req, res) => {
  const contas = await prisma.contaReceber.findMany({
    where: montarFiltro(req.query),
    include: {
      contrato: { include: { cliente: { include: { centroCusto: true } }, plano: true } },
      boleto: true,
    },
    orderBy: { vencimento: "asc" },
  });

  res.json(contas);
});

// Exportação em Excel (respeita os mesmos filtros da listagem)
router.get("/exportar/excel", async (req, res) => {
  const contas = await prisma.contaReceber.findMany({
    where: montarFiltro(req.query),
    include: {
      contrato: { include: { cliente: { include: { centroCusto: true } }, plano: true } },
      boleto: true,
    },
    orderBy: { vencimento: "asc" },
  });

  const buffer = await gerarExcelContas(contas);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="contas-a-receber-${Date.now()}.xlsx"`);
  res.send(Buffer.from(buffer));
});

// Exportação em PDF (respeita os mesmos filtros da listagem)
router.get("/exportar/pdf", async (req, res) => {
  const contas = await prisma.contaReceber.findMany({
    where: montarFiltro(req.query),
    include: {
      contrato: { include: { cliente: { include: { centroCusto: true } }, plano: true } },
      boleto: true,
    },
    orderBy: { vencimento: "asc" },
  });

  const buffer = await gerarPdfContas(contas, req.query);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="contas-a-receber-${Date.now()}.pdf"`);
  res.send(buffer);
});

// Detalhe de uma conta (usado ao clicar no lançamento)
router.get("/:id", async (req, res) => {
  const conta = await prisma.contaReceber.findUnique({
    where: { id: req.params.id },
    include: {
      contrato: { include: { cliente: true, plano: true } },
      boleto: true,
      confirmadoPor: { select: { id: true, nome: true } },
    },
  });
  if (!conta) return res.status(404).json({ erro: "Conta não encontrada." });
  res.json(conta);
});

// Histórico de movimentações de uma conta
router.get("/:id/historico", async (req, res) => {
  const historico = await prisma.movimentacaoConta.findMany({
    where: { contaReceberId: req.params.id },
    include: { realizadoPor: { select: { id: true, nome: true } } },
    orderBy: { criadoEm: "desc" },
  });
  res.json(historico);
});

// Marca uma conta como paga (com data de pagamento opcional, padrão hoje)
router.patch("/:id/pagar", async (req, res) => {
  const { dataPagamento } = req.body;
  const data = dataPagamento ? new Date(`${dataPagamento}T00:00:00.000Z`) : new Date();

  const conta = await prisma.$transaction(async (tx) => {
    const atualizada = await tx.contaReceber.update({
      where: { id: req.params.id },
      data: {
        status: "PAGO",
        dataPagamento: data,
        origemConfirmacao: "MANUAL",
        confirmadoPorId: req.usuario.id,
      },
    });

    await tx.movimentacaoConta.create({
      data: {
        contaReceberId: req.params.id,
        descricao: `Marcado como pago (data de pagamento: ${formatarDataBR(data)})`,
        realizadoPorId: req.usuario.id,
      },
    });

    return atualizada;
  });

  res.json(conta);
});

// Edita a data de pagamento de um lançamento já pago (correção manual)
router.patch("/:id/data-pagamento", async (req, res) => {
  const { dataPagamento } = req.body;
  if (!dataPagamento) return res.status(400).json({ erro: "Informe a nova data de pagamento." });

  const contaAtual = await prisma.contaReceber.findUnique({ where: { id: req.params.id } });
  if (!contaAtual) return res.status(404).json({ erro: "Conta não encontrada." });

  const novaData = new Date(`${dataPagamento}T00:00:00.000Z`);

  const conta = await prisma.$transaction(async (tx) => {
    const atualizada = await tx.contaReceber.update({
      where: { id: req.params.id },
      data: { dataPagamento: novaData, status: "PAGO" },
    });

    await tx.movimentacaoConta.create({
      data: {
        contaReceberId: req.params.id,
        descricao: contaAtual.dataPagamento
          ? `Data de pagamento alterada de ${formatarDataBR(contaAtual.dataPagamento)} para ${formatarDataBR(novaData)}`
          : `Data de pagamento definida para ${formatarDataBR(novaData)}`,
        realizadoPorId: req.usuario.id,
      },
    });

    return atualizada;
  });

  res.json(conta);
});

// Reabre uma conta paga por engano (volta para pendente)
router.patch("/:id/reabrir", async (req, res) => {
  const conta = await prisma.$transaction(async (tx) => {
    const atualizada = await tx.contaReceber.update({
      where: { id: req.params.id },
      data: { status: "PENDENTE", dataPagamento: null, origemConfirmacao: null, confirmadoPorId: null },
    });

    await tx.movimentacaoConta.create({
      data: {
        contaReceberId: req.params.id,
        descricao: "Lançamento reaberto (status voltou para pendente)",
        realizadoPorId: req.usuario.id,
      },
    });

    return atualizada;
  });

  res.json(conta);
});

// Endpoint reservado para confirmação automática futura (ex: webhook do banco)
router.post("/webhook/confirmacao-automatica", async (req, res) => {
  const { boletoId } = req.body;

  const conta = await prisma.$transaction(async (tx) => {
    const atualizada = await tx.contaReceber.update({
      where: { boletoId },
      data: { status: "PAGO", dataPagamento: new Date(), origemConfirmacao: "AUTOMATICO" },
    });

    await tx.movimentacaoConta.create({
      data: {
        contaReceberId: atualizada.id,
        descricao: "Pagamento confirmado automaticamente (webhook)",
      },
    });

    return atualizada;
  });

  res.json(conta);
});

module.exports = router;
