require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@sistema.com";
  const senha = process.env.SEED_ADMIN_SENHA || "admin123";

  const existente = await prisma.usuarioAdmin.findUnique({ where: { email } });
  if (existente) {
    console.log(`Usuário admin já existe: ${email}`);
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuarioAdmin.create({
    data: { nome: "Administrador", email, senhaHash, perfil: "ADMIN", master: true },
  });

  console.log(`Usuário admin criado: ${usuario.email} / senha: ${senha}`);
  console.log("IMPORTANTE: troque essa senha após o primeiro login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
