const express = require("express");
const multer = require("multer");
const prisma = require("../lib/prisma");
const { uploadArquivo } = require("../lib/storage");
const { autenticarAdmin } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(autenticarAdmin);

// Upload do boleto -> cria automaticamente o lançamento em contas a receber
router.post("/", upload.single("arquivo"), async (req, res) => {
  const { contratoId, mesReferencia, valor, vencimento } = req.body;
  if (!req.file) return res.status(400).json({ erro: "Nenhum arquivo enviado." });

  const contrato = await prisma.contrato.findUnique({ where: { id: contratoId } });
  if (!contrato) return res.status(404).json({ erro: "Contrato não encontrado." });

  const { nomeArquivo, urlArquivo } = await uploadArquivo(
    `contratos/${contratoId}/boletos`,
    req.file
  );

  // Transação: cria o boleto e a conta a receber vinculada em conjunto
  const resultado = await prisma.$transaction(async (tx) => {
    const boleto = await tx.boleto.create({
      data: {
        contratoId,
        mesReferencia,
        nomeArquivo,
        urlArquivo,
        uploadPorId: req.usuario.id,
      },
    });

    const contaReceber = await tx.contaReceber.create({
      data: {
        contratoId,
        boletoId: boleto.id,
        mesReferencia,
        valor,
        vencimento: new Date(vencimento),
        status: "PENDENTE",
      },
    });

    return { boleto, contaReceber };
  });

  res.status(201).json(resultado);
});

module.exports = router;
