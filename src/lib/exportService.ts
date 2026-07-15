import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getProcessos, getLancamentos, getPrazos, type Processo, type Lancamento, type Prazo } from "./store";
import { saveFile } from "./saveFile";

const BRAND = "Gerson Gomes — Advocacia e Consultoria Jurídica";

function getExcelBase64(processos: Processo[], lancamentos: Lancamento[], prazos: Prazo[]): string {
  const processosData = processos.map((p) => ({
    "Nome do Cliente": p.cliente,
    "Nº do Processo": p.numero,
    Tribunal: p.tribunal || "",
    Status: p.status,
    "Valor da Causa": p.valor,
  }));

  const lancamentosData = lancamentos
    .slice()
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .map((l) => ({
      Data: new Date(l.data).toLocaleDateString("pt-BR"),
      Descrição: l.descricao,
      Categoria: l.tipo === "receita" ? "Receita" : "Despesa",
      Valor: l.valor,
    }));

  const prazosData = prazos
    .slice()
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((p) => ({
      Data: new Date(p.data).toLocaleDateString("pt-BR"),
      Título: p.titulo,
      Detalhes: p.detalhe || "",
      Tipo: p.tipo === "fatal" ? "Prazo Fatal" : "Normal",
    }));

  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: `${BRAND} — Relatório`,
    Author: BRAND,
    CreatedDate: new Date(),
  };

  function autoFitColumns(rows: Record<string, any>[]): { wch: number }[] {
    if (!rows.length) return [];
    const keys = Object.keys(rows[0]);
    return keys.map((k) => {
      const headerLen = k.length;
      const maxCell = rows.reduce((max, r) => {
        const v = r[k];
        const len = v == null ? 0 : String(v).length;
        return len > max ? len : max;
      }, 0);
      return { wch: Math.min(Math.max(headerLen, maxCell) + 2, 50) };
    });
  }

  function buildSheet(rows: Record<string, any>[], emptyRow: Record<string, any>, title: string) {
    const data = rows.length ? rows : [emptyRow];
    const generatedAt = new Date().toLocaleString("pt-BR");

    const ws = XLSX.utils.aoa_to_sheet([
      [BRAND],
      [title],
      [`Gerado em: ${generatedAt}`],
      [],
    ]);
    XLSX.utils.sheet_add_json(ws, data, { origin: "A5" });

    const cols = autoFitColumns(data);
    ws["!cols"] = cols;

    return ws;
  }

  XLSX.utils.book_append_sheet(
    wb,
    buildSheet(
      processosData,
      { "Nome do Cliente": "", "Nº do Processo": "", Tribunal: "", Status: "", "Valor da Causa": "" },
      "Relatório de Processos"
    ),
    "Processos"
  );

  XLSX.utils.book_append_sheet(
    wb,
    buildSheet(
      lancamentosData,
      { Data: "", Descrição: "", Categoria: "", Valor: "" },
      "Relatório Financeiro"
    ),
    "Financeiro"
  );

  XLSX.utils.book_append_sheet(
    wb,
    buildSheet(
      prazosData,
      { Data: "", Título: "", Detalhes: "", Tipo: "" },
      "Relatório de Prazos"
    ),
    "Prazos"
  );

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
  return wbout;
}

export async function exportToExcel(): Promise<string> {
  const [processos, lancamentos, prazos] = await Promise.all([
    getProcessos(),
    getLancamentos(),
    getPrazos()
  ]);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `gerson-gomes-relatorio-${date}.xlsx`;
  const base64Content = getExcelBase64(processos, lancamentos, prazos);
  return saveFile(filename, base64Content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

export async function exportToPDF(): Promise<string> {
  const [processos, lancamentos, prazos] = await Promise.all([
    getProcessos(),
    getLancamentos(),
    getPrazos()
  ]);
  
  const doc = new jsPDF();
  const generatedAt = new Date().toLocaleString("pt-BR");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(13, 14, 18);
  doc.text(BRAND, 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Relatório Consolidado de Gestão Jurídica — Gerado em: ${generatedAt}`, 14, 26);
  doc.setLineWidth(0.5);
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 30, 196, 30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(13, 14, 18);
  doc.text("1. Relatório de Processos", 14, 38);

  const processosData = processos.map(p => [
    p.cliente,
    p.numero,
    p.tribunal || "—",
    p.status,
    p.valor > 0 ? p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"
  ]);
  
  autoTable(doc, {
    startY: 42,
    head: [["Cliente", "Nº Processo", "Tribunal", "Status", "Valor da Causa"]],
    body: processosData.length ? processosData : [["Nenhum processo cadastrado", "", "", "", ""]],
    theme: "striped",
    headStyles: { fillColor: [13, 14, 18], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 }
  });

  const finalY1 = (doc as any).lastAutoTable.finalY || 45;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(13, 14, 18);
  doc.text("2. Relatório de Prazos", 14, finalY1 + 12);

  const prazosData = prazos
    .slice()
    .sort((a, b) => a.data.localeCompare(b.data))
    .map(p => [
      new Date(p.data).toLocaleDateString("pt-BR"),
      p.titulo,
      p.detalhe || "—",
      p.tipo === "fatal" ? "Prazo Fatal" : "Normal"
    ]);

  autoTable(doc, {
    startY: finalY1 + 16,
    head: [["Data", "Título", "Detalhes", "Tipo"]],
    body: prazosData.length ? prazosData : [["Nenhum prazo cadastrado", "", "", ""]],
    theme: "striped",
    headStyles: { fillColor: [13, 14, 18], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 }
  });

  const finalY2 = (doc as any).lastAutoTable.finalY || (finalY1 + 20);
  
  if (finalY2 + 35 > 280) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(13, 14, 18);
    doc.text("3. Relatório Financeiro", 14, 20);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(13, 14, 18);
    doc.text("3. Relatório Financeiro", 14, finalY2 + 12);
  }

  const startFinanceiroY = finalY2 + 35 > 280 ? 24 : finalY2 + 16;

  const lancamentosData = lancamentos
    .slice()
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .map(l => [
      new Date(l.data).toLocaleDateString("pt-BR"),
      l.descricao,
      l.tipo === "receita" ? "Receita" : "Despesa",
      l.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    ]);

  autoTable(doc, {
    startY: startFinanceiroY,
    head: [["Data", "Descrição", "Categoria", "Valor"]],
    body: lancamentosData.length ? lancamentosData : [["Nenhum lançamento cadastrado", "", "", ""]],
    theme: "striped",
    headStyles: { fillColor: [13, 14, 18], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 }
  });

  const pdfOutput = doc.output("datauristring");
  const base64Content = pdfOutput.split(",")[1];
  
  const date = new Date().toISOString().slice(0, 10);
  const filename = `gerson-gomes-relatorio-${date}.pdf`;
  
  return saveFile(filename, base64Content, "application/pdf");
}
