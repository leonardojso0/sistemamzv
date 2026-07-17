const express = require("express");
const prisma = require("../lib/prisma");
const { autenticarAdmin } = require("../middleware/auth");

const router = express.Router();

// Pública: usada na página inicial (endereço, e-mail, telefone, whatsapp)
router.get("/", async (req, res) => {
  const config = await prisma.configuracaoEmpresa.findFirst();
  res.json(config || {});
});

// Só admin pode alterar
router.put("/", autenticarAdmin, async (req, res) => {
  const { endereco, email, telefone, whatsapp } = req.body;

  const existente = await prisma.configuracaoEmpresa.findFirst();
  const config = existente
    ? await prisma.configuracaoEmpresa.update({
        where: { id: existente.id },
        data: { endereco, email, telefone, whatsapp },
      })
    : await prisma.configuracaoEmpresa.create({ data: { endereco, email, telefone, whatsapp } });

  res.json(config);
});

module.exports = router;
