const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const mapaStatusConta = { PENDENTE: "Pendente", PAGO: "Pago", ATRASADO: "Atrasado" };

function formatarData(data) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarCpfCnpj(valor) {
  const v = (valor || "").replace(/\D/g, "");
  if (v.length === 11) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (v.length === 14) return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return valor || "-";
}

async function gerarExcelContas(contas) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Contas a Receber");

  sheet.columns = [
    { header: "Cliente", key: "cliente", width: 30 },
    { header: "CPF/CNPJ", key: "cpfCnpj", width: 20 },
    { header: "Centro de custo", key: "centroCusto", width: 22 },
    { header: "Mês de referência", key: "mes", width: 16 },
    { header: "Valor", key: "valor", width: 15 },
    { header: "Vencimento", key: "vencimento", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Data de pagamento", key: "dataPagamento", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  contas.forEach((c) => {
    sheet.addRow({
      cliente: c.contrato?.cliente?.nome || "-",
      cpfCnpj: formatarCpfCnpj(c.contrato?.cliente?.cpfCnpj),
      centroCusto: c.contrato?.cliente?.centroCusto?.nome || "-",
      mes: c.mesReferencia,
      valor: Number(c.valor),
      vencimento: formatarData(c.vencimento),
      status: mapaStatusConta[c.status] || c.status,
      dataPagamento: formatarData(c.dataPagamento),
    });
  });
  sheet.getColumn("valor").numFmt = '"R$" #,##0.00';

  return workbook.xlsx.writeBuffer();
}

function gerarPdfContas(contas, filtros = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").text("Relatório de Contas a Receber", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(9).font("Helvetica").fillColor("#666666");
    const linhasFiltro = [];
    if (filtros.status) linhasFiltro.push(`Status: ${mapaStatusConta[filtros.status] || filtros.status}`);
    if (filtros.dataInicio) linhasFiltro.push(`De: ${filtros.dataInicio}`);
    if (filtros.dataFim) linhasFiltro.push(`Até: ${filtros.dataFim}`);
    linhasFiltro.push(`Gerado em: ${new Date().toLocaleString("pt-BR")}`);
    doc.text(linhasFiltro.join("   |   "), { align: "center" });
    doc.moveDown(1);
    doc.fillColor("#000000");

    const colX = [40, 220, 340, 420, 500, 580, 680];
    const headers = ["Cliente", "Centro de custo", "Mês", "Valor", "Vencimento", "Status", "Pagamento"];

    function desenharCabecalho() {
      doc.font("Helvetica-Bold").fontSize(9);
      headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: (colX[i + 1] || 780) - colX[i] - 5 }));
      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(780, doc.y).strokeColor("#cccccc").stroke();
      doc.moveDown(0.3);
    }

    desenharCabecalho();
    doc.font("Helvetica").fontSize(8.5);

    let valorTotal = 0;
    contas.forEach((c) => {
      valorTotal += Number(c.valor);
      if (doc.y > 500) {
        doc.addPage();
        doc.y = 40;
        desenharCabecalho();
        doc.font("Helvetica").fontSize(8.5);
      }
      const y = doc.y;
      doc.text(c.contrato?.cliente?.nome || "-", colX[0], y, { width: colX[1] - colX[0] - 5 });
      doc.text(c.contrato?.cliente?.centroCusto?.nome || "-", colX[1], y, { width: colX[2] - colX[1] - 5 });
      doc.text(c.mesReferencia, colX[2], y, { width: colX[3] - colX[2] - 5 });
      doc.text(formatarMoeda(c.valor), colX[3], y, { width: colX[4] - colX[3] - 5 });
      doc.text(formatarData(c.vencimento), colX[4], y, { width: colX[5] - colX[4] - 5 });
      doc.text(mapaStatusConta[c.status] || c.status, colX[5], y, { width: colX[6] - colX[5] - 5 });
      doc.text(formatarData(c.dataPagamento), colX[6], y, { width: 100 });
      doc.moveDown(0.6);
    });

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(780, doc.y).strokeColor("#cccccc").stroke();
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text(`Total: ${formatarMoeda(valorTotal)}   |   Lançamentos: ${contas.length}`, 40, doc.y);

    doc.end();
  });
}

async function gerarExcelClientes(clientes) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Clientes");

  sheet.columns = [
    { header: "Nome", key: "nome", width: 30 },
    { header: "CPF/CNPJ", key: "cpfCnpj", width: 20 },
    { header: "E-mail", key: "email", width: 26 },
    { header: "Telefone", key: "telefone", width: 16 },
    { header: "Endereço", key: "endereco", width: 30 },
    { header: "Cidade", key: "cidade", width: 18 },
    { header: "Estado", key: "estado", width: 8 },
    { header: "CEP", key: "cep", width: 12 },
    { header: "Centro de custo", key: "centroCusto", width: 22 },
    { header: "Status", key: "status", width: 14 },
    { header: "Cadastrado em", key: "criadoEm", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  clientes.forEach((c) => {
    sheet.addRow({
      nome: c.nome,
      cpfCnpj: formatarCpfCnpj(c.cpfCnpj),
      email: c.email || "-",
      telefone: c.telefone || "-",
      endereco: c.endereco || "-",
      cidade: c.cidade || "-",
      estado: c.estado || "-",
      cep: c.cep || "-",
      centroCusto: c.centroCusto?.nome || "-",
      status: c.status,
      criadoEm: formatarData(c.criadoEm),
    });
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = { gerarExcelContas, gerarPdfContas, gerarExcelClientes };
