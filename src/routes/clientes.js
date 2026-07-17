const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const prisma = require("../lib/prisma");
const { uploadArquivo, gerarLinkDownload, excluirArquivo } = require("../lib/storage");
const { autenticarAdmin } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(autenticarAdmin);

const rotulosDocumento = {
  RG_CPF: "RG/CPF",
  COMPROVANTE_ENDERECO: "Comprovante de endereço",
  CONTRATO_ASSINADO: "Contrato assinado",
  OUTRO: "Outro",
};

function apenasDigitos(valor) {
  return (valor || "").replace(/\D/g, "");
}

async function registrarHistorico(clienteId, descricao, realizadoPorId) {
  await prisma.movimentacaoCliente.create({
    data: { clienteId, descricao, realizadoPorId },
  });
}

// Listar clientes
router.get("/", async (req, res) => {
  const clientes = await prisma.cliente.findMany({
    orderBy: { criadoEm: "desc" },
    include: { contratos: { include: { plano: true } }, centroCusto: true },
  });
  res.json(clientes);
});

// Detalhe do cliente (com documentos e contratos)
router.get("/:id", async (req, res) => {
  const cliente = await prisma.cliente.findUnique({
    where: { id: req.params.id },
    include: {
      documentos: true,
      contratos: { include: { plano: true, contasReceber: true } },
      centroCusto: true,
    },
  });
  if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado." });
  res.json(cliente);
});

// Histórico de movimentações do cliente
router.get("/:id/historico", async (req, res) => {
  const historico = await prisma.movimentacaoCliente.findMany({
    where: { clienteId: req.params.id },
    include: { realizadoPor: { select: { id: true, nome: true } } },
    orderBy: { criadoEm: "desc" },
  });
  res.json(historico);
});

// Criar cliente
router.post("/", async (req, res) => {
  const { nome, cpfCnpj, email, telefone, endereco, cidade, estado, cep, senha, centroCustoId } = req.body;
  const cpfCnpjLimpo = apenasDigitos(cpfCnpj);

  const senhaHash = await bcrypt.hash(senha || cpfCnpjLimpo, 10); // senha inicial padrão = CPF, se não informada

  const cliente = await prisma.cliente.create({
    data: {
      nome,
      cpfCnpj: cpfCnpjLimpo,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      cep,
      senhaHash,
      centroCustoId: centroCustoId || undefined,
    },
  });

  await registrarHistorico(cliente.id, "Cliente cadastrado", req.usuario.id);

  res.status(201).json(cliente);
});

// Atualizar cliente
router.put("/:id", async (req, res) => {
  const { nome, email, telefone, endereco, cidade, estado, cep, status, centroCustoId } = req.body;

  const cliente = await prisma.cliente.update({
    where: { id: req.params.id },
    data: {
      nome,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      cep,
      status,
      centroCustoId: centroCustoId === "" ? null : centroCustoId,
    },
  });

  await registrarHistorico(cliente.id, "Dados do cliente atualizados", req.usuario.id);

  res.json(cliente);
});

// Upload de documento do cliente (RG, comprovante, contrato assinado)
router.post("/:id/documentos", upload.single("arquivo"), async (req, res) => {
  const { tipo } = req.body; // RG_CPF | COMPROVANTE_ENDERECO | CONTRATO_ASSINADO | OUTRO
  if (!req.file) return res.status(400).json({ erro: "Nenhum arquivo enviado." });

  const { nomeArquivo, urlArquivo } = await uploadArquivo(
    `clientes/${req.params.id}/documentos`,
    req.file
  );

  const documento = await prisma.documentoCliente.create({
    data: {
      clienteId: req.params.id,
      tipo,
      nomeArquivo,
      urlArquivo,
      uploadPorId: req.usuario.id,
    },
  });

  await registrarHistorico(
    req.params.id,
    `Documento adicionado (${rotulosDocumento[tipo] || tipo}): ${nomeArquivo}`,
    req.usuario.id
  );

  res.status(201).json(documento);
});

// Link de download de um documento do cliente
router.get("/:id/documentos/:documentoId/download", async (req, res) => {
  const documento = await prisma.documentoCliente.findUnique({
    where: { id: req.params.documentoId },
  });

  if (!documento || documento.clienteId !== req.params.id) {
    return res.status(404).json({ erro: "Documento não encontrado." });
  }

  const url = await gerarLinkDownload(documento.urlArquivo);
  res.json({ nomeArquivo: documento.nomeArquivo, url });
});

// Excluir documento do cliente
router.delete("/:id/documentos/:documentoId", async (req, res) => {
  const documento = await prisma.documentoCliente.findUnique({
    where: { id: req.params.documentoId },
  });

  if (!documento || documento.clienteId !== req.params.id) {
    return res.status(404).json({ erro: "Documento não encontrado." });
  }

  await excluirArquivo(documento.urlArquivo);
  await prisma.documentoCliente.delete({ where: { id: documento.id } });

  await registrarHistorico(
    req.params.id,
    `Documento excluído (${rotulosDocumento[documento.tipo] || documento.tipo}): ${documento.nomeArquivo}`,
    req.usuario.id
  );

  res.status(204).send();
});

module.exports = router;
