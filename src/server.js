require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const clientesRoutes = require("./routes/clientes");
const planosRoutes = require("./routes/planos");
const contratosRoutes = require("./routes/contratos");
const boletosRoutes = require("./routes/boletos");
const contasReceberRoutes = require("./routes/contas-receber");
const portalClienteRoutes = require("./routes/portal-cliente");
const usuariosRoutes = require("./routes/usuarios");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ status: "ok", servico: "sistema-boletos-api" }));

app.use("/auth", authRoutes);
app.use("/clientes", clientesRoutes);
app.use("/planos", planosRoutes);
app.use("/contratos", contratosRoutes);
app.use("/boletos", boletosRoutes);
app.use("/contas-receber", contasReceberRoutes);
app.use("/portal", portalClienteRoutes);
app.use("/usuarios", usuariosRoutes);

// Tratamento de erro genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: "Erro interno no servidor." });
});

const PORTA = process.env.PORT || 3333;
app.listen(PORTA, () => console.log(`API rodando na porta ${PORTA}`));
