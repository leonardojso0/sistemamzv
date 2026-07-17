const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const prisma = require("../lib/prisma");
const { uploadArquivo } = require("../lib/storage");
const { autenticarAdmin } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(autenticarAdmin);

// Listar clientes
router.get("/", async (req, res) => {
  const clientes = await prisma.cliente.findMany({
    orderBy: { criadoEm: "desc" },
    include: { contratos: { include: { plano: true } } },
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
    },
  });
  if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado." });
  res.json(cliente);
});

// Criar cliente
router.post("/", async (req, res) => {
  const { nome, cpfCnpj, email, telefone, endereco, cidade, estado, cep, senha } = req.body;

  const senhaHash = await bcrypt.hash(senha || cpfCnpj, 10); // senha inicial padrão = CPF, se não informada

  const cliente = await prisma.cliente.create({
    data: { nome, cpfCnpj, email, telefone, endereco, cidade, estado, cep, senhaHash },
  });

  res.status(201).json(cliente);
});

// Atualizar cliente
router.put("/:id", async (req, res) => {
  const { nome, email, telefone, endereco, cidade, estado, cep, status } = req.body;

  const cliente = await prisma.cliente.update({
    where: { id: req.params.id },
    data: { nome, email, telefone, endereco, cidade, estado, cep, status },
  });

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

  res.status(201).json(documento);
});

module.exports = router;
